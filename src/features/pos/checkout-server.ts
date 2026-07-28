import { createHash } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';

import { MAX_DISCOUNT_AMOUNT, MAX_PRODUCT_PRICE, MAX_STOCK_QUANTITY } from '@/lib/constraints';
import { getAdminDb } from '@/lib/firebase/admin';
import { firestorePaths } from '@/lib/firebase/paths';
import { getJakartaDateKey } from '@/lib/format';
import type { ServerUser } from '@/lib/server/auth';
import { HttpError } from '@/lib/server/http';
import {
  assertAmount,
  calculateCart,
  normalizeCartLines,
  type CalculatedOrderItem,
  type CartLine,
  type SellableProduct,
} from './cart-domain';

const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  price: z.number().int().nonnegative().max(MAX_PRODUCT_PRICE),
  stockQty: z.number().int().nonnegative().max(MAX_STOCK_QUANTITY),
  trackStock: z.boolean(),
  isActive: z.boolean(),
});
const paymentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['cash', 'non_cash']),
  isActive: z.literal(true),
});
const settingsSchema = z.object({
  maxDiscount: z.number().int().nonnegative().max(MAX_DISCOUNT_AMOUNT).default(0),
});

export interface ServerCheckoutInput {
  orderId: string;
  storeId: string;
  items: CartLine[];
  discount: number;
  paid: number;
  paymentMethodId: string;
}

export interface ServerCheckoutResult {
  orderId: string;
  orderNumber: string;
  sequence: number;
  storeId: string;
  cashierId: string;
  cashierName: string;
  items: CalculatedOrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paid: number;
  change: number;
  paymentMethodId: string;
  paymentMethodName: string;
}

function identifier(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized || normalized.includes('/')) throw new HttpError(`${label} tidak valid.`);
  return normalized;
}

function fingerprint(input: ServerCheckoutInput): string {
  const canonical = JSON.stringify({ ...input, items: normalizeCartLines(input.items) });
  return createHash('sha256').update(canonical).digest('hex');
}

function existingResult(id: string, data: Record<string, unknown>): ServerCheckoutResult {
  const parsed = z.object({
    orderNumber: z.string().min(1), sequence: z.number().int().positive(), storeId: z.string().min(1),
    cashierId: z.string().min(1), cashierName: z.string().min(1), items: z.array(z.any()),
    subtotal: z.number().int(), discount: z.number().int(), total: z.number().int(),
    paid: z.number().int(), change: z.number().int(), paymentMethodId: z.string().min(1),
    paymentMethodName: z.string().min(1),
  }).parse(data);
  return { orderId: id, ...parsed, items: parsed.items as CalculatedOrderItem[] };
}

export async function runServerCheckout(
  rawInput: ServerCheckoutInput,
  actor: ServerUser,
): Promise<ServerCheckoutResult> {
  let input: ServerCheckoutInput;
  try {
    input = {
      orderId: identifier(rawInput.orderId, 'ID transaksi'),
      storeId: identifier(rawInput.storeId, 'ID toko'),
      paymentMethodId: identifier(rawInput.paymentMethodId, 'Metode pembayaran'),
      items: normalizeCartLines(rawInput.items),
      discount: assertAmount(rawInput.discount, 'Diskon'),
      paid: assertAmount(rawInput.paid, 'Pembayaran'),
    };
  } catch (cause) {
    if (cause instanceof HttpError) throw cause;
    throw new HttpError(cause instanceof Error ? cause.message : 'Data checkout tidak valid.');
  }
  if (input.items.length === 0) throw new HttpError('Keranjang masih kosong.');
  if (actor.storeId !== input.storeId) throw new HttpError('Toko transaksi tidak sesuai akun.', 403);

  const requestFingerprint = fingerprint(input);
  const db = getAdminDb();
  const orderRef = db.doc(firestorePaths.order(input.storeId, input.orderId));

  return db.runTransaction(async (transaction) => {
    const existing = await transaction.get(orderRef);
    if (existing.exists) {
      const data = existing.data() ?? {};
      if (data.cashierId !== actor.uid || data.requestFingerprint !== requestFingerprint) {
        throw new HttpError('ID transaksi sudah digunakan oleh permintaan berbeda.', 409, 'ORDER_CONFLICT');
      }
      return existingResult(existing.id, data);
    }

    const dateKey = getJakartaDateKey();
    const counterId = `orders-${dateKey}`;
    const settingsRef = db.doc(firestorePaths.settings(input.storeId));
    const paymentRef = db.doc(firestorePaths.paymentMethod(input.storeId, input.paymentMethodId));
    const counterRef = db.doc(firestorePaths.counter(input.storeId, counterId));
    const [settingsSnap, paymentSnap, counterSnap] = await Promise.all([
      transaction.get(settingsRef), transaction.get(paymentRef), transaction.get(counterRef),
    ]);

    if (!paymentSnap.exists) throw new HttpError('Metode pembayaran tidak ditemukan.');
    const payment = paymentSchema.parse(paymentSnap.data());
    const settings = settingsSnap.exists ? settingsSchema.parse(settingsSnap.data()) : { maxDiscount: 0 };

    const productEntries: Array<[string, SellableProduct]> = [];
    for (const line of input.items) {
      const ref = db.doc(firestorePaths.product(input.storeId, line.productId));
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists) throw new HttpError(`Produk ${line.productId} tidak ditemukan.`);
      const product = productSchema.parse(snapshot.data());
      productEntries.push([snapshot.id, { id: snapshot.id, ...product }]);
    }

    const products = new Map(productEntries);
    let calculated;
    try {
      calculated = calculateCart(input.items, products, input.discount, settings.maxDiscount);
    } catch (cause) {
      throw new HttpError(cause instanceof Error ? cause.message : 'Keranjang tidak valid.');
    }
    const paid = payment.type === 'cash' ? input.paid : calculated.total;
    if (paid < calculated.total) throw new HttpError('Nominal pembayaran masih kurang.');
    const change = paid - calculated.total;

    const currentCounter = counterSnap.exists ? Number(counterSnap.data()?.value) : 0;
    if (!Number.isSafeInteger(currentCounter) || currentCounter < 0) throw new HttpError('Counter transaksi tidak valid.');
    const sequence = currentCounter + 1;
    const orderNumber = `MW-${dateKey}-${String(sequence).padStart(4, '0')}`;

    for (const item of calculated.items) {
      if (!item.trackStock) continue;
      const product = products.get(item.productId);
      if (!product) throw new HttpError('Produk transaksi tidak ditemukan.');
      const afterQty = product.stockQty - item.quantity;
      const movementId = `sale_${input.orderId}_${item.productId}`;
      transaction.update(db.doc(firestorePaths.product(input.storeId, item.productId)), {
        stockQty: afterQty, lastSaleOrderId: input.orderId, updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(db.doc(firestorePaths.stockMovement(input.storeId, movementId)), {
        storeId: input.storeId, productId: item.productId, orderId: input.orderId, type: 'sale',
        quantityDelta: -item.quantity, beforeQty: product.stockQty, afterQty, actorId: actor.uid,
        note: `Penjualan ${orderNumber}`, createdAt: FieldValue.serverTimestamp(),
      });
    }

    const result: ServerCheckoutResult = {
      orderId: input.orderId, orderNumber, sequence, storeId: input.storeId,
      cashierId: actor.uid, cashierName: actor.name, items: calculated.items,
      subtotal: calculated.subtotal, discount: calculated.discount, total: calculated.total,
      paid, change, paymentMethodId: input.paymentMethodId, paymentMethodName: payment.name,
    };
    transaction.set(orderRef, {
      schemaVersion: 2, ...result, counterId, requestFingerprint, status: 'paid', paymentStatus: 'paid',
      createdAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp(),
    });
    transaction.set(counterRef, {
      storeId: input.storeId, value: sequence, lastOrderId: input.orderId,
      updatedAt: FieldValue.serverTimestamp(),
    });
    return result;
  });
}
