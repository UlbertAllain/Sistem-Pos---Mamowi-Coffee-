# Migration Notes V5

Tidak diperlukan migrasi data order lama. Schema order tetap `schemaVersion: 2` agar transaksi dan laporan lama tetap terbaca.

Perubahan deployment:

1. Tambahkan package `firebase-admin`.
2. Isi environment server Admin.
3. Deploy Firestore Rules V5.
4. Deploy aplikasi pada runtime Node.js.
5. Jalankan smoke test checkout, adjustment, dan void.

Script `scripts/migrate-legacy.mjs` tetap tersedia untuk migrasi collection legacy dan menggunakan Firebase Client SDK dengan akun migrasi terkontrol. Script tersebut terpisah dari mutation aplikasi harian.
