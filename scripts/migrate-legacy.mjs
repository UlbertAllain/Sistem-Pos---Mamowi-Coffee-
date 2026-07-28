import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

async function loadLocalEnv() {
  try {
    const text = await readFile(resolve('.env.local'), 'utf8');
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const separator = line.indexOf('=');
      if (separator < 1) continue;
      const key = line.slice(0, separator).trim();
      const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // Shell environment is also supported.
  }
}

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} belum diisi.`);
  return value;
}

function boundedInteger(value, maximum, fallback = 0) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 && number <= maximum ? number : fallback;
}

function text(value, fallback, maxLength) {
  const normalized = String(value ?? '').trim() || fallback;
  return normalized.slice(0, maxLength);
}

function normalizeSku(value, fallback) {
  const normalized = text(value, fallback, 50)
    .toUpperCase()
    .replace(/[^A-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return (normalized || `SKU-${fallback}`).slice(0, 50);
}

function withSkuSuffix(base, sequence) {
  const suffix = `-${sequence}`;
  return `${base.slice(0, 50 - suffix.length)}${suffix}`;
}

function httpsUrl(value) {
  const normalized = String(value ?? '').trim();
  return normalized.startsWith('https://') ? normalized.slice(0, 1000) : '';
}

await loadLocalEnv();
const storeId = required('NEXT_PUBLIC_FIREBASE_STORE_ID');
const app = initializeApp({
  apiKey: required('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: required('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: required('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: required('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: required('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: required('NEXT_PUBLIC_FIREBASE_APP_ID'),
});
const auth = getAuth(app);
const db = getFirestore(app);

const credential = await signInWithEmailAndPassword(
  auth,
  required('MIGRATION_ADMIN_EMAIL'),
  required('MIGRATION_ADMIN_PASSWORD'),
);

try {
  const profileSnapshot = await getDoc(doc(db, `stores/${storeId}/users/${credential.user.uid}`));
  const profile = profileSnapshot.data();
  if (!profileSnapshot.exists() || !['owner', 'manager'].includes(profile?.role) || profile?.isActive !== true) {
    throw new Error('Akun migrasi harus memiliki profil aktif dengan role owner atau manager.');
  }

  const categoryIds = new Set();
  const currentCategories = await getDocs(collection(db, `stores/${storeId}/categories`));
  for (const category of currentCategories.docs) categoryIds.add(category.id);

  let migratedCategories = 0;
  let skippedCategories = 0;
  const legacyCategories = await getDocs(collection(db, `stores/${storeId}/menu_categories`));
  for (const category of legacyCategories.docs) {
    const targetRef = doc(db, `stores/${storeId}/categories/${category.id}`);
    if ((await getDoc(targetRef)).exists()) {
      categoryIds.add(category.id);
      skippedCategories += 1;
      continue;
    }
    const data = category.data();
    await setDoc(targetRef, {
      storeId,
      name: text(data.name ?? data.title, `Kategori ${category.id}`, 80),
      isActive: data.isActive !== false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    categoryIds.add(category.id);
    migratedCategories += 1;
  }

  if (!categoryIds.has('uncategorized')) {
    await setDoc(doc(db, `stores/${storeId}/categories/uncategorized`), {
      storeId,
      name: 'Tanpa Kategori',
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    categoryIds.add('uncategorized');
    migratedCategories += 1;
  }

  const usedSkus = new Map();
  const existingIndexes = await getDocs(collection(db, `stores/${storeId}/sku_indexes`));
  for (const index of existingIndexes.docs) {
    usedSkus.set(index.id, String(index.data().productId ?? ''));
  }

  let createdSkuIndexes = 0;
  const currentProducts = await getDocs(collection(db, `stores/${storeId}/products`));
  for (const product of currentProducts.docs) {
    const sku = normalizeSku(product.data().sku, product.id);
    if (sku !== product.data().sku) {
      throw new Error(`Produk ${product.id} memiliki SKU lama yang tidak valid: ${product.data().sku ?? '-'}. Perbaiki sebelum migrasi.`);
    }
    const owner = usedSkus.get(sku);
    if (owner && owner !== product.id) {
      throw new Error(`SKU ${sku} digunakan oleh lebih dari satu produk (${owner} dan ${product.id}).`);
    }
    if (!owner) {
      await setDoc(doc(db, `stores/${storeId}/sku_indexes/${sku}`), {
        storeId,
        sku,
        productId: product.id,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      createdSkuIndexes += 1;
    }
    usedSkus.set(sku, product.id);
  }

  let migratedProducts = 0;
  let skippedProducts = 0;
  const legacyProducts = await getDocs(collection(db, `stores/${storeId}/menu_items`));
  for (const item of legacyProducts.docs) {
    const targetRef = doc(db, `stores/${storeId}/products/${item.id}`);
    const targetSnapshot = await getDoc(targetRef);
    if (targetSnapshot.exists()) {
      skippedProducts += 1;
      continue;
    }

    const data = item.data();
    const candidateCategory = text(data.categoryId ?? data.category, 'uncategorized', 120);
    const categoryId = categoryIds.has(candidateCategory) ? candidateCategory : 'uncategorized';
    const baseSku = normalizeSku(data.sku, item.id);
    let sku = baseSku;
    let suffix = 2;
    while (usedSkus.has(sku) && usedSkus.get(sku) !== item.id) {
      sku = withSkuSuffix(baseSku, suffix);
      suffix += 1;
    }

    const batch = writeBatch(db);
    batch.set(targetRef, {
      storeId,
      categoryId,
      name: text(data.name ?? data.title, `Produk ${item.id}`, 120),
      sku,
      price: boundedInteger(data.price ?? data.sellingPrice, 1_000_000_000),
      stockQty: boundedInteger(data.stockQty ?? data.stock, 1_000_000),
      trackStock: data.trackStock !== false,
      isActive: data.isActive !== false,
      imageUrl: httpsUrl(data.imageUrl ?? data.image),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, `stores/${storeId}/sku_indexes/${sku}`), {
      storeId,
      sku,
      productId: item.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await batch.commit();

    usedSkus.set(sku, item.id);
    migratedProducts += 1;
    createdSkuIndexes += 1;
  }

  console.log(JSON.stringify({
    migratedCategories,
    skippedCategories,
    migratedProducts,
    skippedProducts,
    createdSkuIndexes,
  }, null, 2));
  console.log('Migrasi selesai tanpa menghapus collection lama. Verifikasi hasil sebelum deploy aplikasi produksi.');
} finally {
  await signOut(auth);
}
