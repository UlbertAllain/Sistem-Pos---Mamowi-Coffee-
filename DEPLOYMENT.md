# Deployment Production V5

## Runtime

Aplikasi V5 membutuhkan Node.js server karena memiliki Next.js Route Handlers dan Firebase Admin SDK. Gunakan salah satu runtime berikut:

- Vercel;
- Firebase App Hosting;
- Cloud Run;
- server Node.js/VPS yang menjalankan `next start`.

Firebase Hosting statis saja tidak cukup untuk endpoint `/api/*`.

## Environment

Isi seluruh Firebase Web SDK variable dan tiga credential Admin pada secret hosting. Jangan expose Admin credential dengan prefix `NEXT_PUBLIC`.

## Quality gate

```bash
npm install
npm run preflight
npm run check
```

Commit `package-lock.json` setelah `npm install` pertama berhasil.

## Deploy Firestore

```bash
firebase deploy --only firestore:rules,firestore:indexes --project YOUR_PROJECT_ID
```

## Deploy aplikasi

```bash
npm run build
npm run start
```

Pada Vercel/App Hosting, gunakan build command `npm run build` dan tambahkan environment variable melalui dashboard platform.

## Smoke test

1. Login owner, manager, dan cashier.
2. Checkout 1, 3, 6, dan lebih dari 6 produk berbeda.
3. Uji cash dan non-cash.
4. Pastikan stok, order, counter, dan movement berubah atomik.
5. Putuskan koneksi setelah klik bayar lalu retry order yang sama.
6. Uji adjustment oleh manager dan penolakan untuk cashier.
7. Uji void dan restorasi stok.
8. Pastikan browser langsung tidak dapat menulis order, counter, movement, atau stockQty.
