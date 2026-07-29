# Security Model — V5

## Trust boundary

Firebase Authentication membuktikan identitas user. Browser mengirim Firebase ID token pada setiap mutation sensitif. Next.js Route Handler memverifikasi token melalui Firebase Admin Auth, memuat profil user dari toko, lalu memeriksa `isActive`, `storeId`, dan role.

## Mutation server-only

Operasi berikut tidak dapat ditulis langsung melalui Firebase Client SDK:

- order;
- counter transaksi;
- stock movement;
- perubahan `stockQty` produk;
- checkout;
- void transaksi;
- penyesuaian stok.

Firestore Rules menetapkan `allow write: if false` untuk order, movement, dan counter. Update produk dari client wajib mempertahankan `stockQty` dan `sku`.

## Otorisasi

- `owner`, `manager`, `cashier`: checkout.
- `owner`, `manager`: stock adjustment dan void.
- `owner`, `manager`: CRUD katalog dan pengaturan.
- `owner`: pengelolaan user dan role.

## Credential

Service account hanya disimpan pada server melalui:

- `FIREBASE_ADMIN_PROJECT_ID`
- `FIREBASE_ADMIN_CLIENT_EMAIL`
- `FIREBASE_ADMIN_PRIVATE_KEY`

Jangan gunakan prefix `NEXT_PUBLIC`, jangan masukkan JSON service account ke repository, dan jangan mengimpor `firebase-admin` dari Client Component.

## Transaction integrity

Checkout server menghitung ulang harga, stok, diskon, total, pembayaran, kembalian, sequence, dan nomor order. Nilai snapshot dari browser tidak dipercaya. Order ID dan request fingerprint menyediakan retry idempotent.
