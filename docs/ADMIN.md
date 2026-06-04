# Admin functionality

Platform-wide reporting APIs for administrators. Every endpoint requires a valid
JWT **and** the `ADMIN` role; authenticated non-admins receive `403`.

## Roles

Users have a `role` (`USER` | `ADMIN`), defaulting to `USER` (Prisma `Role` enum on
the `User` model). The role is included in the login response (`user.role`) and on
`GET /api/profile/me`. The `authenticate` middleware reloads the user from the
database on every request, so role changes take effect immediately (no token
re-issue needed).

### Granting / revoking admin

```bash
# from backend/
npm run promote-admin -- demo@expensee.app          # grant ADMIN
npm run promote-admin -- demo@expensee.app --demote # revoke (back to USER)
```

The script also reads `ADMIN_EMAIL` from `backend/.env` when no email is passed.
The demo account (`demo@expensee.app`) is promoted to ADMIN in local dev.

## Endpoints

Base path `/api/admin`. Send `Authorization: Bearer <token>`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/admin/stats` | Platform totals + per-category statistics |
| GET | `/admin/users?page=&limit=` | Paginated list of all users |

### `GET /admin/stats`

Aggregates across **all** users in a few grouped queries:

```jsonc
{
  "totalUsers": 3,
  "totalTransactions": 10,
  "totalIncome": 2015,
  "totalExpenses": 1229,
  "netBalance": 786,
  "categories": [
    // every category, sorted by expense desc
    { "category": "TRANSPORT", "income": 0, "expense": 550, "total": 550, "count": 2 }
  ]
}
```

`total` is gross volume (`income + expense`); `count` is the number of transactions
in that category. Categories with no transactions are still returned (zeroed).

### `GET /admin/users`

Standard paginated shape `{ items, total, page, limit }` (newest first). Each item:
`{ id, name, email, role, isEmailVerified, transactionCount, createdAt }`.
`limit` is clamped to `[1, 100]` (default 20); `page` defaults to 1.

## Security notes

- Guarded by `authenticate` → `requireAdmin` (see
  `backend/src/middleware/auth.middleware.ts`). No token ⇒ `401`; non-admin ⇒ `403`.
- Stats are read-only aggregates (no per-user data is exposed beyond the users list,
  which never returns passwords or tokens — it reuses safe field selection).

## Mobile app

Surfaced as a role-gated **Admin** bottom-tab (`src/screens/AdminScreen.tsx`), themed
dark/light. The tab is only registered when the logged-in `user.role === 'ADMIN'`
(see `src/navigation/AppNavigator.tsx`); `role` rides along on the login / `GET /me`
responses. Data comes from `src/api/admin.api.ts` via `src/hooks/useAdmin.ts`
(React Query). The screen shows a net-balance hero, user/transaction/income/expense
tiles, a platform expense-by-category pie (reusing `ExpensePieCard`), and a users list.

## Layering

`routes/admin.routes.ts` → `controllers/admin.controller.ts` →
`services/admin.service.ts` → Prisma, matching the rest of the backend.
