import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';

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

async function createIfMissing(path, payload) {
  const ref = doc(db, path);
  if ((await getDoc(ref)).exists()) return false;
  await setDoc(ref, {
    ...payload,
    storeId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return true;
}

try {
  const profile = (await getDoc(doc(db, `stores/${storeId}/users/${credential.user.uid}`))).data();
  if (!['owner', 'manager'].includes(profile?.role) || profile?.isActive !== true) {
    throw new Error('Akun bootstrap harus memiliki profil aktif dengan role owner atau manager.');
  }

  const created = [];
  if (await createIfMissing(`stores/${storeId}/settings/general`, {
    storeName: 'Mamowi Coffee',
    address: '',
    phone: '',
    receiptFooter: 'Terima kasih sudah berbelanja.',
    maxDiscount: 0,
    lowStockThreshold: 5,
  })) created.push('settings/general');

  for (const [id, name] of [['coffee', 'Coffee'], ['non-coffee', 'Non-Coffee'], ['food', 'Food']]) {
    if (await createIfMissing(`stores/${storeId}/categories/${id}`, { name, isActive: true })) {
      created.push(`categories/${id}`);
    }
  }

  if (await createIfMissing(`stores/${storeId}/payment_methods/cash`, {
    name: 'Tunai', type: 'cash', isActive: true,
  })) created.push('payment_methods/cash');
  if (await createIfMissing(`stores/${storeId}/payment_methods/qris`, {
    name: 'QRIS', type: 'non_cash', isActive: true,
  })) created.push('payment_methods/qris');

  console.log(created.length ? `Bootstrap membuat: ${created.join(', ')}` : 'Bootstrap dilewati: semua data awal sudah tersedia.');
} finally {
  await signOut(auth);
}
