# Delivery Report — Mamowi POS V5

## Delivered

- Next.js Route Handler untuk checkout.
- Firebase Admin ID token verification dan role authorization.
- Server-side Firestore transaction untuk order, counter, stok, dan movement.
- Endpoint server untuk stock adjustment dan void.
- Firestore Rules yang disederhanakan dan menolak mutation sensitif dari browser.
- Batas keranjang dinaikkan dari 6 menjadi 50 produk berbeda.
- UI baru: sidebar modern, topbar, katalog POS, dark cart panel, payment modal, dan login split-screen.
- Environment template tanpa credential sebenarnya.

## Credential yang harus diisi pemilik project

```env
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```
