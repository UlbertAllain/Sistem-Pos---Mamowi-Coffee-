# Mamowi POS V5 — Firebase Admin Migration

## Perubahan arsitektur

Mutation sensitif tidak lagi dikirim langsung ke Firestore dari browser.

- `POST /api/checkout`: checkout, counter, stok, order, dan sale movement.
- `POST /api/stock-adjustments`: penyesuaian stok dan audit movement.
- `POST /api/orders/[orderId]/void`: void order, restorasi stok, dan audit movement.

Setiap endpoint:

1. menerima Firebase ID token dari browser;
2. memverifikasi token melalui Firebase Admin Auth;
3. membaca profil user toko;
4. memeriksa status aktif dan role;
5. menjalankan Firestore Admin transaction.

Firestore Rules V5 menolak seluruh write client ke `orders`, `stock_movements`, dan `counters`. Update client pada produk juga wajib mempertahankan `stockQty` dan `sku`.

## Environment variable server

Isi hanya pada `.env.local` atau secret hosting. Jangan gunakan prefix `NEXT_PUBLIC`.

```env
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

Untuk private key satu baris, pertahankan karakter `\\n`. Kode server akan mengubahnya menjadi newline asli.

## Mendapatkan credential

Firebase Console → Project settings → Service accounts → Generate new private key.

Pemetaan JSON:

- `project_id` → `FIREBASE_ADMIN_PROJECT_ID`
- `client_email` → `FIREBASE_ADMIN_CLIENT_EMAIL`
- `private_key` → `FIREBASE_ADMIN_PRIVATE_KEY`

Jangan commit file JSON service account atau `.env.local`.

## Verifikasi

```powershell
npm install
npm run audit:rules-static
npm run test:rules
npm run typecheck
npm run build
```

Setelah lulus, deploy rules:

```powershell
npx firebase-tools@15.24.0 deploy --only firestore:rules --project mamowicoffe
```
