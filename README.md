# Mamowi Coffee POS

Mamowi Coffee POS adalah sistem point-of-sale berbasis web untuk operasional kedai kopi: katalog produk, checkout, pembayaran, stok, transaksi, laporan, user/role, dan pengaturan toko.

Sistem dibangun dengan fokus pada integritas transaksi. Harga, stok, nomor order, pembayaran, dan stock movement untuk operasi sensitif dihitung dan diproses kembali di server; browser tidak dipercaya sebagai sumber kebenaran transaksi.

## Fitur Utama

- POS checkout dengan cash dan non-cash payment.
- Realtime product/category catalog.
- Stock tracking dan stock adjustment.
- Transaction history dan reporting.
- Void transaksi dengan restorasi stok atomik.
- Owner, manager, dan cashier roles.
- Store settings dan user management.
- Optional Cloudinary product images.
- Idempotent checkout retry untuk mencegah duplicate order.

## Tech Stack

- Next.js 16 App Router
- React 19 + TypeScript
- Firebase Authentication
- Cloud Firestore
- Firebase Admin SDK
- Zod
- Zustand
- Firebase Emulator Suite untuk Rules testing
- Cloudinary opsional

## Architecture

Mamowi POS memakai dua trust boundary.

Operasi yang aman dilindungi oleh Firestore Security Rules:

```text
UI
↓
Feature Service
↓
Firebase Client SDK
↓
Firestore Security Rules
↓
Firestore
```

Operasi sensitif:

```text
UI
↓
Authenticated API Route
↓
Firebase ID Token Verification
↓
Store + Role Authorization
↓
Server Business Logic
↓
Firebase Admin Transaction
↓
Firestore
```

Checkout, stock adjustment, void, order write, counter update, stock movement, dan perubahan `stockQty` merupakan trusted-server operations.

Lihat [ARCHITECTURE.md](ARCHITECTURE.md) untuk boundary lengkap.

## Security Model

Browser tidak dapat menulis langsung:

- order;
- transaction counter;
- stock movement;
- product `stockQty`;
- SKU existing product.

Checkout server menghitung ulang product snapshot, harga, stok, diskon, pembayaran, kembalian, sequence, nomor order, dan request fingerprint sebelum melakukan transaction atomik.

Void hanya tersedia untuk role yang berwenang dan mengembalikan stok dalam transaction yang sama dengan status order dan movement log.

Detail: [SECURITY.md](SECURITY.md).

## Project Structure

```text
src/
├── app/            routes, pages, API route handlers
├── components/     reusable UI dan application shell
├── features/       POS, catalog, orders, reports, settings, users
├── lib/
│   ├── firebase/   Firebase client/admin bootstrap dan paths
│   └── server/     trusted server auth/error helpers
└── types/          shared contracts

scripts/            preflight, migration, architecture/rules audit
tests/              business regression dan Firestore Rules tests
```

## Local Setup

Gunakan Node.js 22 untuk environment yang sama dengan CI.

```bash
cp .env.example .env.local
npm ci
npm run preflight
npm run dev
```

Aplikasi tersedia di `http://localhost:3000`.

Konfigurasi detail tersedia di [SETUP.md](SETUP.md).

## Environment

Firebase browser configuration menggunakan `NEXT_PUBLIC_FIREBASE_*`.

Firebase Admin credential hanya server-side:

```env
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

Jangan commit service-account JSON, `.env.local`, private key, atau secret hosting.

## Quality Gate

```bash
npm run preflight
npm run check
```

`npm run check` menjalankan:

- scope audit;
- architecture audit;
- static Firestore Rules audit;
- ESLint;
- TypeScript;
- unit/domain tests;
- Firestore Rules tests melalui emulator;
- production build.

GitHub Actions juga membuat dependency audit report dan memblokir dependency vulnerability level **high** atau **critical**.

## Deployment

Aplikasi membutuhkan Node.js runtime karena menggunakan Next.js Route Handlers dan Firebase Admin SDK.

Supported deployment target antara lain Vercel, Firebase App Hosting, Cloud Run, atau Node.js server/VPS.

Lihat [DEPLOYMENT.md](DEPLOYMENT.md).

## Migration

Untuk project lama yang masih menggunakan schema legacy, ikuti:

- [V5_FIREBASE_ADMIN_MIGRATION.md](V5_FIREBASE_ADMIN_MIGRATION.md)
- [MIGRATION.md](MIGRATION.md)
- [ROLLBACK.md](ROLLBACK.md)

Jalankan migration secara terkontrol dan backup data sebelum production apply.

## Engineering Rules

Contributor atau coding agent harus membaca:

- [AGENTS.md](AGENTS.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [ENGINEERING_STANDARD.md](ENGINEERING_STANDARD.md)
- [SECURITY.md](SECURITY.md)

Perubahan pada checkout, payment, stock, void, authentication, authorization, atau Firestore Rules wajib mempertahankan transaction integrity dan regression tests.
