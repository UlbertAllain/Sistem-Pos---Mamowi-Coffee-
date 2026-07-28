# Mamowi Coffee POS V5

POS berbasis Next.js 16, Firebase Authentication, Cloud Firestore, Firebase Admin SDK, dan Cloudinary opsional.

## Arsitektur V5

Browser tetap memakai Firebase Client SDK untuk login, realtime catalog, transaksi, laporan, dan CRUD sederhana. Operasi sensitif diproses melalui Next.js Route Handlers dengan Firebase Admin:

- checkout;
- penyesuaian stok;
- void transaksi.

Dengan desain ini, kalkulasi harga, otorisasi role, counter, update stok, order, dan audit movement dijalankan di server dalam transaction atomik. Firestore Rules menjadi lebih pendek dan browser tidak dapat memanipulasi stok atau order secara langsung.

## Setup

1. Salin `.env.example` menjadi `.env.local`.
2. Isi konfigurasi Firebase Web SDK.
3. Isi tiga environment variable Firebase Admin dari service account.
4. Jalankan:

```bash
npm install
npm run dev
```

Dokumentasi migrasi lengkap: `V5_FIREBASE_ADMIN_MIGRATION.md`.

## Quality gate

```bash
npm run audit:scope
npm run audit:architecture
npm run audit:rules-static
npm run lint
npm run typecheck
npm test
npm run test:rules
npm run build
```
