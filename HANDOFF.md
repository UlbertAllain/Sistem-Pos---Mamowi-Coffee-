# Handoff Mamowi POS V5

Paket ini adalah replacement project V5. Terapkan pada branch baru.

```bash
git checkout main
git pull
git tag before-mamowi-pos-v5
git checkout -b refactor/mamowi-pos-v5
```

Ekstrak `mamowi-pos-clean-v5.zip`, salin source ke repository, lalu:

```bash
npm install
npm run preflight
npm run check
```

`npm install` akan membuat `package-lock.json`; commit lockfile tersebut. Pastikan `.env.local` dan service-account JSON tidak masuk Git.

```bash
git add .
git commit -m "refactor: migrate POS mutations to Firebase Admin"
git push -u origin refactor/mamowi-pos-v5
```

Ikuti `V5_FIREBASE_ADMIN_MIGRATION.md` dan `DEPLOYMENT.md` sebelum merge production.
