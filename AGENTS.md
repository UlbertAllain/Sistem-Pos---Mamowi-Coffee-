# AGENTS.md

## Purpose

Aturan kerja untuk developer dan AI yang mengubah Mamowi Coffee POS.

Baca sebelum coding:
- `ARCHITECTURE.md`
- `ENGINEERING_STANDARD.md`
- `SECURITY.md`

## Stack

- Next.js 16 + TypeScript
- Firebase Authentication
- Cloud Firestore
- Firebase Admin SDK untuk mutation sensitif
- Cloudinary opsional
- Zod
- Zustand untuk state POS lokal

## Core Rule

Gunakan solusi paling sederhana yang tetap benar, aman, maintainable, dan sesuai scope POS.

## Request Flows

Operasi biasa yang memang diizinkan Firestore Rules:

```text
UI
↓
Feature service
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
ID Token Verification
↓
Store/Role Authorization
↓
Server Domain Logic
↓
Firebase Admin Transaction
↓
Firestore
```

Mutation sensitif seperti checkout, stock adjustment, void, order, counter, dan stock movement tidak boleh dipindahkan ke client.

## Folder Responsibilities

- `src/app/`: route, page, layout, route handler.
- `src/features/`: feature UI, service, schema, domain logic.
- `src/lib/firebase/`: Firebase bootstrap dan path helper.
- `src/lib/server/`: trusted server/auth/error helpers.
- `src/components/`: reusable UI/layout.
- `src/types/`: shared contracts.
- `scripts/`: migration, preflight, architecture/rules audits.
- `tests/`: business, security-rule, dan regression tests.

## Safety Rules

- Browser tidak boleh menulis order, counter, stock movement, atau stockQty.
- Checkout harus menghitung ulang harga, stok, discount, payment, dan counter di server.
- Retry checkout harus mempertahankan idempotency.
- Void harus transaction-safe dan memulihkan stok dengan audit movement.
- Firebase Admin credential tidak boleh memakai prefix `NEXT_PUBLIC_`.
- Jangan melemahkan Firestore Rules demi mempermudah UI.

## Scope Rules

Jangan menambahkan modul di luar POS inti tanpa requirement eksplisit. Script `audit:scope` adalah guardrail.

## Verification

Sebelum selesai:

```bash
npm run preflight
npm run check
```

`npm run check` mencakup architecture/rules audit, lint, typecheck, tests, Firestore Rules tests, dan build.
