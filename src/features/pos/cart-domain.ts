import { MAX_DISTINCT_PRODUCTS_PER_ORDER, MAX_ITEM_QUANTITY, MAX_TRANSACTION_AMOUNT } from '../../lib/constraints.ts';

export interface CartLine {
  productId: string;
  quantity: number;
}

export interface SellableProduct {
  id: string;
  sku: string;
  name: string;
  price: number;
  stockQty: number;
  trackStock: boolean;
  isActive: boolean;
}

export interface CalculatedOrderItem {
  productId: string;
  sku: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  trackStock: boolean;
}

export interface CalculatedCart {
  items: CalculatedOrderItem[];
  subtotal: number;
  discount: number;
  total: number;
}

export function assertAmount(value: number, field = 'Nominal'): number {
  if (!Number.isSafeInteger(value) || value < 0 || value > MAX_TRANSACTION_AMOUNT) {
    throw new Error(`${field} harus berupa bilangan bulat non-negatif.`);
  }
  return value;
}

export function normalizeCartLines(lines: CartLine[]): CartLine[] {
  const totals = new Map<string, number>();
  for (const line of lines) {
    const productId = line.productId.trim();
    if (!productId) throw new Error('ID produk tidak valid.');
    if (!Number.isSafeInteger(line.quantity) || line.quantity <= 0 || line.quantity > MAX_ITEM_QUANTITY) {
      throw new Error('Jumlah produk harus antara 1 sampai 999.');
    }
    const quantity = (totals.get(productId) ?? 0) + line.quantity;
    if (quantity > MAX_ITEM_QUANTITY) throw new Error(`Jumlah satu produk maksimal ${MAX_ITEM_QUANTITY}.`);
    totals.set(productId, quantity);
  }

  if (totals.size > MAX_DISTINCT_PRODUCTS_PER_ORDER) {
    throw new Error(`Maksimal ${MAX_DISTINCT_PRODUCTS_PER_ORDER} jenis produk per transaksi.`);
  }

  return [...totals.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([productId, quantity]) => ({ productId, quantity }));
}

function safeMultiply(left: number, right: number): number {
  const result = left * right;
  if (!Number.isSafeInteger(result)) throw new Error('Nominal transaksi terlalu besar.');
  return result;
}

function safeAdd(left: number, right: number): number {
  const result = left + right;
  if (!Number.isSafeInteger(result)) throw new Error('Nominal transaksi terlalu besar.');
  return result;
}

export function calculateCart(
  rawLines: CartLine[],
  productMap: Map<string, SellableProduct>,
  discount: number,
  maxDiscount: number,
): CalculatedCart {
  const lines = normalizeCartLines(rawLines);
  if (lines.length === 0) throw new Error('Keranjang masih kosong.');
  assertAmount(discount, 'Diskon');
  assertAmount(maxDiscount, 'Batas diskon');

  const items = lines.map((line): CalculatedOrderItem => {
    const product = productMap.get(line.productId);
    if (!product) throw new Error(`Produk ${line.productId} tidak ditemukan.`);
    if (!product.isActive) throw new Error(`${product.name} sedang tidak aktif.`);
    assertAmount(product.price, `Harga ${product.name}`);
    assertAmount(product.stockQty, `Stok ${product.name}`);
    if (product.trackStock && product.stockQty < line.quantity) {
      throw new Error(`Stok ${product.name} hanya tersisa ${product.stockQty}.`);
    }

    return {
      productId: product.id,
      sku: product.sku,
      name: product.name,
      unitPrice: product.price,
      quantity: line.quantity,
      lineTotal: safeMultiply(product.price, line.quantity),
      trackStock: product.trackStock,
    };
  });

  const subtotal = items.reduce((sum, item) => safeAdd(sum, item.lineTotal), 0);
  if (discount > subtotal) throw new Error('Diskon tidak boleh melebihi subtotal.');
  if (discount > maxDiscount) throw new Error('Diskon melebihi batas yang diizinkan.');

  return { items, subtotal, discount, total: subtotal - discount };
}

export async function createCheckoutFingerprint(payload: {
  storeId: string;
  orderId: string;
  items: CartLine[];
  discount: number;
  paid: number;
  paymentMethodId: string;
}): Promise<string> {
  const canonical = JSON.stringify({
    ...payload,
    items: normalizeCartLines(payload.items),
  });
  const bytes = new TextEncoder().encode(canonical);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}
