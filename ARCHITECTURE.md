# ARCHITECTURE.md

## Overview

Mamowi Coffee POS memakai feature-oriented modular monolith dengan dua trust boundary:

1. Firebase Client SDK + Firestore Security Rules untuk realtime read dan CRUD terbatas.
2. Next.js Route Handler + Firebase Admin SDK untuk mutation sensitif dan transactional.

Arsitektur ini sengaja tidak memaksa semua Firestore access melewati server. Client access hanya dipakai ketika Security Rules dapat menjadi authoritative boundary tanpa merusak integritas bisnis.

## Sensitive Flow

```text
POS UI
↓
authenticatedJson()
↓
Next.js API Route
↓
Firebase ID token verification
↓
Store + role authorization
↓
server domain/service
↓
Firebase Admin transaction
↓
Firestore
```

Dipakai untuk:
- checkout;
- stock adjustment;
- void transaksi;
- order write;
- counter update;
- stock movement;
- perubahan stockQty.

## Client-Safe Flow

```text
Feature UI
↓
feature service
↓
Firebase Client SDK
↓
Firestore Security Rules
↓
Firestore
```

Dipakai untuk operasi yang Rules-nya cukup kuat, seperti:
- realtime catalog read;
- CRUD katalog terbatas untuk owner/manager;
- settings terbatas;
- read transaksi/report sesuai membership.

## Source Structure

```text
src/
├── app/
├── components/
├── features/
│   ├── auth/
│   ├── catalog/
│   ├── orders/
│   ├── pos/
│   ├── reports/
│   ├── settings/
│   └── users/
├── lib/
│   ├── firebase/
│   └── server/
└── types/
```

Tidak ada kebutuhan untuk menambah layer repository secara mekanis bila Firebase Client service sudah menjadi persistence boundary yang jelas.

## Feature Boundary

Feature boleh memiliki:
- UI component;
- schema;
- domain calculation;
- client service;
- server-only service bila dibutuhkan.

UI di `src/app/` atau `src/components/` tidak boleh mengakses Firebase langsung. Firebase access ditempatkan di feature/lib boundary.

## Critical POS Domain

Checkout wajib mempertahankan:
- server-side product snapshot;
- price recalculation;
- stock validation;
- discount constraint;
- payment validation;
- sequence/counter integrity;
- atomic stock update;
- stock movement;
- idempotent retry fingerprint.

Void wajib:
- hanya owner/manager;
- hanya order paid;
- restore stock atomik;
- movement log;
- update status order dalam transaction yang sama.

## Firestore Rules

Rules adalah bagian dari application security dan harus dites.

Client tidak boleh menulis langsung:
- orders;
- stock_movements;
- counters;
- stockQty;
- sku existing product.

## Architecture Decision

Refactor hanya dilakukan bila:
- responsibility lebih jelas;
- security boundary lebih kuat;
- transaction integrity meningkat;
- testability meningkat;
- coupling berkurang.

Jangan melakukan big-bang folder migration hanya demi tampilan struktur.
