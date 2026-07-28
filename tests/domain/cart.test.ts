import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateCart,
  createCheckoutFingerprint,
  normalizeCartLines,
  type SellableProduct,
} from '../../src/features/pos/cart-domain.ts';

const coffee: SellableProduct = {
  id: 'coffee',
  sku: 'COF-01',
  name: 'Es Kopi Susu',
  price: 18000,
  stockQty: 10,
  trackStock: true,
  isActive: true,
};

const products = new Map([[coffee.id, coffee]]);

test('normalizeCartLines menggabungkan produk duplikat', () => {
  assert.deepEqual(normalizeCartLines([
    { productId: 'coffee', quantity: 1 },
    { productId: 'coffee', quantity: 2 },
  ]), [{ productId: 'coffee', quantity: 3 }]);
});

test('calculateCart menghitung integer Rupiah tanpa floating point', () => {
  const result = calculateCart([{ productId: 'coffee', quantity: 2 }], products, 1000, 5000);
  assert.equal(result.subtotal, 36000);
  assert.equal(result.discount, 1000);
  assert.equal(result.total, 35000);
  assert.equal(result.items[0]?.lineTotal, 36000);
});

test('calculateCart menolak stok yang tidak cukup', () => {
  assert.throws(() => calculateCart([{ productId: 'coffee', quantity: 11 }], products, 0, 0), /Stok/);
});

test('calculateCart menolak diskon di atas batas', () => {
  assert.throws(() => calculateCart([{ productId: 'coffee', quantity: 1 }], products, 6000, 5000), /batas/);
});

test('fingerprint stabil untuk item yang sama dan berubah saat payload berubah', async () => {
  const base = {
    storeId: 'mamowi',
    orderId: 'order-1',
    items: [{ productId: 'coffee', quantity: 2 }],
    discount: 0,
    paid: 40000,
    paymentMethodId: 'cash',
  };
  const first = await createCheckoutFingerprint(base);
  const second = await createCheckoutFingerprint(base);
  const changed = await createCheckoutFingerprint({ ...base, paid: 50000 });
  assert.equal(first, second);
  assert.notEqual(first, changed);
  assert.equal(first.length, 64);
});


test('normalizeCartLines membatasi maksimal 50 jenis produk', () => {
  const lines = Array.from({ length: 51 }, (_, index) => ({
    productId: `product-${index + 1}`,
    quantity: 1,
  }));
  assert.throws(() => normalizeCartLines(lines), /Maksimal 50/);
});

test('batas jenis produk dihitung setelah baris duplikat digabung', () => {
  const lines = Array.from({ length: 7 }, () => ({ productId: 'coffee', quantity: 1 }));
  assert.deepEqual(normalizeCartLines(lines), [{ productId: 'coffee', quantity: 7 }]);
});
