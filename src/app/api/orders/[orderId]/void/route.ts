import { FieldValue } from 'firebase-admin/firestore';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { MAX_STOCK_QUANTITY } from '@/lib/constraints';
import { getAdminDb } from '@/lib/firebase/admin';
import { firestorePaths } from '@/lib/firebase/paths';
import { requireStoreUser } from '@/lib/server/auth';
import { HttpError, jsonError } from '@/lib/server/http';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const inputSchema = z.object({
  storeId: z.string().min(1).max(120),
  reason: z.string().trim().min(3).max(300),
});
const itemSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  quantity: z.number().int().positive(),
  trackStock: z.boolean(),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ orderId: string }> },
): Promise<NextResponse> {
  try {
    const { orderId } = await context.params;
    if (!orderId || orderId.includes('/')) throw new HttpError('ID transaksi tidak valid.');
    const input = inputSchema.parse(await request.json());
    const actor = await requireStoreUser(request, input.storeId, ['owner', 'manager']);
    const db = getAdminDb();
    const orderRef = db.doc(firestorePaths.order(input.storeId, orderId));

    await db.runTransaction(async (transaction) => {
      const orderSnapshot = await transaction.get(orderRef);
      if (!orderSnapshot.exists) throw new HttpError('Transaksi tidak ditemukan.', 404);
      const order = orderSnapshot.data() ?? {};
      if (order.status !== 'paid') throw new HttpError('Transaksi sudah dibatalkan sebelumnya.', 409);
      const items = z.array(itemSchema).parse(order.items).filter((item) => item.trackStock);

      const productState = new Map<string, number>();
      for (const item of items) {
        const productRef = db.doc(firestorePaths.product(input.storeId, item.productId));
        const snapshot = await transaction.get(productRef);
        if (!snapshot.exists) throw new HttpError(`Produk ${item.name} tidak ditemukan.`);
        const stockQty = Number(snapshot.data()?.stockQty);
        if (!Number.isSafeInteger(stockQty) || stockQty < 0) throw new HttpError(`Stok ${item.name} tidak valid.`);
        productState.set(item.productId, stockQty);
      }

      for (const item of items) {
        const beforeQty = productState.get(item.productId);
        if (beforeQty === undefined) throw new HttpError('Snapshot stok tidak ditemukan.');
        const afterQty = beforeQty + item.quantity;
        if (afterQty > MAX_STOCK_QUANTITY) throw new HttpError(`Stok ${item.name} melewati batas.`);
        const movementId = `void_${orderId}_${item.productId}`;
        transaction.update(db.doc(firestorePaths.product(input.storeId, item.productId)), {
          stockQty: afterQty,
          lastAdjustmentId: movementId,
          updatedAt: FieldValue.serverTimestamp(),
        });
        transaction.set(db.doc(firestorePaths.stockMovement(input.storeId, movementId)), {
          storeId: input.storeId,
          productId: item.productId,
          orderId,
          type: 'void',
          quantityDelta: item.quantity,
          beforeQty,
          afterQty,
          actorId: actor.uid,
          note: `Void ${String(order.orderNumber ?? orderId)}: ${input.reason}`,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      transaction.update(orderRef, {
        status: 'voided',
        paymentStatus: 'refunded',
        voidReason: input.reason,
        voidedBy: actor.uid,
        voidedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return NextResponse.json({ ok: true });
  } catch (cause) {
    return jsonError(cause);
  }
}
