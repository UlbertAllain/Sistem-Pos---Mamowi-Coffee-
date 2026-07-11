# KOFFEE POS Security Notes

## Firestore Rules

This project uses `firestore.rules` as the first production security boundary.
Deploy with:

```bash
firebase deploy --only firestore:rules
```

The rules require a signed-in Firebase Auth user and a matching active user
document at:

```text
stores/{storeId}/users/{firebaseUid}
```

The user document must include:

```json
{
  "storeId": "default",
  "role": "owner",
  "isActive": true
}
```

## Important PIN Login Limitation

The current PIN login flow reads `stores/default/users/{pinUserId}` directly
without a Firebase Auth session. That cannot be made secure with Firestore
Security Rules alone.

For production, use one of these options:

- Disable PIN login and require Firebase Auth email/password.
- Replace PIN login with a Cloud Function that validates the PIN server-side
  and returns a custom Firebase Auth token.

## Current Role Intent

- `owner`: full access through the owner shortcut.
- `manager`: operational admin for settings, menu, inventory, orders, shifts,
  reports, and audit logs.
- `cashier`: POS checkout, orders, customers, loyalty, and own shift.
- `barista`: KDS order item updates and inventory operations.
- `viewer`: dashboard/report reads.

## Still Recommended

- Move create order, void order, stock deduction, loyalty processing, and shift
  cash updates into Cloud Functions so multi-document writes are atomic and not
  trusted to the browser.
- Add Firebase Emulator tests for the permission matrix before deploying rules
  to a client project.
