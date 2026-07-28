# Rollback V5

1. Simpan tag Git release sebelumnya.
2. Backup Firestore sebelum deployment.
3. Deploy V5 ke staging terlebih dahulu.
4. Jika endpoint server gagal, rollback aplikasi dan Firestore Rules secara bersamaan.
5. Jangan menjalankan V5 dengan Rules server-only sementara frontend lama masih menulis order langsung.
6. Data order tetap schema v2 sehingga rollback aplikasi tidak memerlukan konversi order.
