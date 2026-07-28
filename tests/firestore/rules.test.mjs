import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { after, before, beforeEach, test } from 'node:test';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';

const projectId = 'demo-mamowi';
const storeId = 'mamowi-coffee';
let env;

const user = (id, role, targetStore = storeId) => ({
  id,
  storeId: targetStore,
  name: id,
  email: `${id}@example.com`,
  role,
  isActive: true,
});

before(async () => {
  env = await initializeTestEnvironment({
    projectId,
    firestore: { rules: await readFile('firestore.rules', 'utf8') },
  });
});

after(async () => env.cleanup());

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, `stores/${storeId}/users/owner`), user('owner', 'owner'));
    await setDoc(doc(db, `stores/${storeId}/users/manager`), user('manager', 'manager'));
    await setDoc(doc(db, `stores/${storeId}/users/cashier`), user('cashier', 'cashier'));
    await setDoc(doc(db, 'stores/other-store/users/outsider'), user('outsider', 'owner', 'other-store'));
    await setDoc(doc(db, `stores/${storeId}/products/coffee`), {
      storeId, categoryId: 'coffee', name: 'Americano', sku: 'COF-01', price: 18000,
      stockQty: 10, trackStock: true, isActive: true, imageUrl: '',
    });
    await setDoc(doc(db, `stores/${storeId}/settings/general`), {
      storeId, storeName: 'Mamowi', address: '', phone: '', receiptFooter: '',
      maxDiscount: 10000, lowStockThreshold: 5,
    });
  });
});

function dbFor(uid, store = storeId) {
  return env.authenticatedContext(uid, { storeId: store }).firestore();
}

test('anggota toko dapat membaca produk', async () => {
  await assertSucceeds(getDoc(doc(dbFor('cashier'), `stores/${storeId}/products/coffee`)));
});

test('user toko lain tidak dapat membaca data Mamowi', async () => {
  await assertFails(getDoc(doc(dbFor('outsider', 'other-store'), `stores/${storeId}/products/coffee`)));
});

test('cashier tidak dapat membuat produk', async () => {
  await assertFails(setDoc(doc(dbFor('cashier'), `stores/${storeId}/products/new`), {
    storeId, categoryId: 'coffee', name: 'Latte', sku: 'COF-02', price: 20000,
    stockQty: 5, trackStock: true, isActive: true, imageUrl: '',
  }));
});

test('manager dapat membuat produk dan reservasi SKU atomik', async () => {
  const db = dbFor('manager');
  const batch = writeBatch(db);
  batch.set(doc(db, `stores/${storeId}/products/latte`), {
    storeId, categoryId: 'coffee', name: 'Latte', sku: 'COF-02', price: 20000,
    stockQty: 5, trackStock: true, isActive: true, imageUrl: '',
  });
  batch.set(doc(db, `stores/${storeId}/sku_indexes/COF-02`), {
    storeId, sku: 'COF-02', productId: 'latte',
  });
  await assertSucceeds(batch.commit());
});

test('manager dapat mengubah metadata produk tanpa mengubah stok', async () => {
  await assertSucceeds(updateDoc(doc(dbFor('manager'), `stores/${storeId}/products/coffee`), {
    name: 'Americano Classic',
  }));
});

test('manager tidak dapat mengubah stok langsung dari client', async () => {
  await assertFails(updateDoc(doc(dbFor('manager'), `stores/${storeId}/products/coffee`), {
    stockQty: 9,
  }));
});

test('client tidak dapat membuat order', async () => {
  await assertFails(setDoc(doc(dbFor('owner'), `stores/${storeId}/orders/order-1`), {
    storeId, orderNumber: 'MW-1', status: 'paid',
  }));
});

test('client tidak dapat membuat stock movement', async () => {
  await assertFails(setDoc(doc(dbFor('owner'), `stores/${storeId}/stock_movements/move-1`), {
    storeId, productId: 'coffee', type: 'sale', quantityDelta: -1,
  }));
});

test('client tidak dapat mengubah counter', async () => {
  await assertFails(setDoc(doc(dbFor('owner'), `stores/${storeId}/counters/orders-20260728`), {
    storeId, value: 1,
  }));
});

test('manager dapat mengubah settings general', async () => {
  await assertSucceeds(updateDoc(doc(dbFor('manager'), `stores/${storeId}/settings/general`), {
    lowStockThreshold: 4,
  }));
});

test('settings selain general ditolak', async () => {
  await assertFails(setDoc(doc(dbFor('owner'), `stores/${storeId}/settings/other`), {
    storeId, enabled: true,
  }));
});

test('cashier tidak dapat mengubah metode pembayaran', async () => {
  await assertFails(setDoc(doc(dbFor('cashier'), `stores/${storeId}/payment_methods/cash`), {
    storeId, name: 'Cash', type: 'cash', isActive: true,
  }));
});

test('manager tidak dapat menaikkan role user', async () => {
  await assertFails(updateDoc(doc(dbFor('manager'), `stores/${storeId}/users/cashier`), {
    role: 'owner',
  }));
});

test('owner dapat mengelola role user', async () => {
  await assertSucceeds(updateDoc(doc(dbFor('owner'), `stores/${storeId}/users/cashier`), {
    role: 'manager',
  }));
  const snapshot = await getDoc(doc(dbFor('owner'), `stores/${storeId}/users/cashier`));
  assert.equal(snapshot.data()?.role, 'manager');
});
