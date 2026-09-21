# ENGINEERING_STANDARD.md

## Principles

Gunakan Clean Code, Separation of Concerns, SRP, DRY, KISS, YAGNI, strict TypeScript, runtime validation, dan security-first design.

## TypeScript

- Hindari `any`; prefer `unknown` + narrowing.
- Domain contract harus explicit.
- External data dari Firestore/request wajib divalidasi bila berpengaruh pada business rule.
- Jangan menutup error dengan type assertion sembarangan.

## UI

Client component fokus pada interaction/presentation. Business rule penting tidak boleh hanya hidup di event handler UI.

## Firebase Client

Firebase Client SDK boleh dipakai di feature service hanya untuk operasi yang dilindungi Rules secara memadai.

Jangan:
- import Firestore/Auth langsung dari app page atau generic component;
- menulis stockQty langsung dari browser;
- membuat order/counter/movement dari browser.

## Firebase Admin

Gunakan Admin SDK untuk mutation trusted. Selalu lakukan:
- authentication;
- store ownership/membership check;
- role authorization;
- validation;
- transaction bila state saling terkait.

## Validation

Gunakan Zod untuk:
- request body;
- Firestore document penting;
- form/domain input;
- environment yang dibutuhkan runtime.

## Errors

Jangan expose stack trace, Firebase Admin error mentah, credential, atau implementation detail ke browser.

## Money and Stock

- Gunakan integer untuk nilai uang.
- Jangan percaya price/total dari browser.
- Stock harus integer non-negative dan dibatasi constraint.
- Mutation yang mengubah order + stock + movement harus atomic.

## Security

Review:
- AuthN/AuthZ;
- Firestore Rules;
- direct client writes;
- service-account secret;
- App Check bila digunakan;
- dependency vulnerability;
- upload policy;
- replay/idempotency.

## Tests

Prioritas:
1. cart calculation;
2. checkout integrity;
3. idempotency;
4. stock adjustment;
5. void;
6. role authorization;
7. Firestore Rules;
8. regression-prone domain logic.

## Quality Gate

```bash
npm run preflight
npm run check
```

Jangan merge bila architecture audit, rules audit, tests, typecheck, lint, atau build gagal.
