# KOFFEE POS - Audit & Development Backlog

## Revisi awal yang sudah dikerjakan

- Checkout POS sekarang membawa `recipe` dari menu item ke cart, termasuk item yang memakai variant/modifier.
- Setelah order berhasil dibuat, checkout memanggil pengurangan stok berdasarkan recipe dan menyimpan referensi order pada stock transaction.
- Dashboard revenue/order hari ini sekarang menghitung order berstatus `paid` dan `completed`, selaras dengan halaman Reports.
- Halaman Settings sudah dibuat untuk profil toko, jam operasional, pajak, struk, loyalty, dan meja.
- Shift sudah eksplisit: buka shift dengan modal awal, tutup shift dengan kas fisik, hitung selisih, dan checkout wajib punya shift aktif.
- Orders sudah punya cetak ulang struk dan void order untuk owner/manager dengan alasan, audit log, serta koreksi revenue/kas shift.
- KDS tidak lagi auto-complete saat semua item ready; order selesai hanya saat tombol selesai disajikan ditekan.
- Firestore security rules awal sudah ditambahkan dengan role-based access, Firebase deploy config, dan catatan security/PIN login.
- Verifikasi: `npm run lint`, `npx tsc --noEmit`, dan `npm run build` berhasil.

## Temuan prioritas tinggi

- Auth dan role guard sudah mulai diperkuat dengan Firestore Rules. Mutasi sensitif tetap sebaiknya dipindah ke Cloud Functions agar atomic dan tidak trusted ke browser.
- PIN login saat ini tidak kompatibel dengan Firestore Rules production karena belum membuat Firebase Auth session. Perlu Cloud Function/custom token atau nonaktifkan untuk production.
- `STORE_ID` masih hardcoded `default`. Untuk multi-store atau production, store context harus berasal dari user/session, bukan constant global.
- Shift lifecycle sudah punya flow dasar. Berikutnya perlu approval/rekap manager, kas keluar/masuk non-penjualan, dan export tutup kas.
- Inventory deduction berjalan setelah order dibuat. Idealnya order, shift update, loyalty, dan stok berada dalam transaksi/Cloud Function agar tidak ada data setengah tersimpan saat salah satu step gagal.
- Payment methods masih memakai konstanta, belum dikelola dari Settings.
- Void order belum melakukan reversal stok/loyalty otomatis. Perlu kebijakan: salah input sebelum produksi bisa restock, produk sudah dibuat masuk waste, loyalty bisa ditarik balik.

## Backlog halaman/fitur

- Settings: lanjutkan payment methods, logo, warna brand, dan konfigurasi printer yang lebih detail.
- Shift: kas masuk/keluar manual, approval selisih, print/export laporan tutup kas.
- Orders: filter tanggal/status/metode pembayaran, refund parsial, reversal stok/loyalty sesuai kebijakan outlet.
- POS mobile: cart drawer/panel mobile, bukan hanya toast "gunakan layar lebih lebar".
- Inventory: purchase/restock flow, supplier, COGS, stock opname, warning stok habis sebelum item bisa dijual.
- Reports: range filter lebih lengkap, export CSV/PDF, gross/net sales, tax, discount, payment, cashier performance.
- Role/permission: matrix permission per action, bukan hanya per halaman.
- Activity log: catat login, order create/void/refund, stock adjustment, user changes, settings changes.

## Risiko desain dan UX

- Palet terlalu dominan espresso/cream. Cocok untuk brand coffee, tapi dashboard operasional butuh kontras status yang lebih jelas.
- Banyak komponen memakai card dan rounded besar. Untuk POS yang dipakai cepat, layar kasir perlu lebih dense dan lebih mudah discan.
- Beberapa teks menggunakan karakter non-ASCII dan ada indikasi mojibake di output terminal. Perlu normalisasi encoding secara bertahap.
