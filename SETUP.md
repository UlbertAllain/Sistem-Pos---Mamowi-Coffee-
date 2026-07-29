# Setup Awal V5

## 1. Firebase Authentication

Aktifkan provider Email/Password. Buat akun owner melalui Firebase Console, lalu buat profil:

```text
stores/{storeId}/users/{firebaseUid}
```

```json
{
  "storeId": "mamowi-coffee",
  "name": "Owner Mamowi",
  "email": "owner@example.com",
  "role": "owner",
  "isActive": true
}
```

Role yang diterima: `owner`, `manager`, dan `cashier`.

## 2. Firebase Web SDK

Salin `.env.example` menjadi `.env.local`, lalu isi seluruh variable `NEXT_PUBLIC_FIREBASE_*`.

## 3. Firebase Admin SDK

Firebase Console → Project settings → Service accounts → Generate new private key.

Isi:

```env
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

Jangan commit JSON service account atau `.env.local`.

## 4. Install

```bash
npm install
npm run preflight
npm run dev
```

## 5. Firestore

Deploy Rules V5:

```bash
firebase deploy --only firestore:rules,firestore:indexes --project YOUR_PROJECT_ID
```

## 6. Cloudinary opsional

Isi `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` dan `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` secara berpasangan. Jangan pernah menyimpan Cloudinary API Secret pada variable `NEXT_PUBLIC_*`.
