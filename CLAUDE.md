# CLAUDE.md — ExpenSee project guide

> **Read this first, every task.** Before starting any change, skim the **Design
> tokens** and **Conventions** below and reuse the existing values/patterns so the
> app stays visually and structurally consistent. **After making changes, update
> this file** (design tokens, structure, commands, and the _Implemented features_
> / _Last updated_ lines).

_Last updated: 2026-06-03 (App-wide theming: every screen + shared component now reads `useTheme()` (expanded `ThemeColors`); themed nav headers/tab bar/status bar + `FadeInView` entrance animations and press feedback throughout)_

---

## 1. What this is

**ExpenSee** — a cross-platform income/expense tracker.

**The repo root (`Final Year Project/`) IS the Expo app** (React Native + Expo):
`App.tsx`, `index.ts`, `app.json`, `src/`, `package.json`, `node_modules/` all live
at the root, so **`npx expo start` runs from the root**. Alongside it:

- **`backend/`** — Express + Prisma REST API (its own `package.json` / `node_modules`).
- **`ml-service/`** — Python **FastAPI** microservice for spending forecasts
  (scikit-learn LinearRegression), consumed by the backend. Its own venv.
- **`docs/`** — setup, architecture, API reference.
- **`src/`** — the mobile app source (screens, components, hooks, services, …).

Run the API via `npm run backend` (a root script that delegates into `backend/`).
There is no longer an `expensee/` wrapper folder.

## 2. Tech stack (pinned)

| Area | Choice |
| --- | --- |
| Mobile | Expo **SDK 54**, React Native **0.81.5**, React **19.1.0** |
| Navigation | React Navigation v7 (native-stack + bottom-tabs) |
| Client state | Zustand (auth, theme, settings, imported-SMS — persisted via AsyncStorage) |
| Charts | `react-native-gifted-charts` + `react-native-svg` (Expo Go OK). gifted-charts' `react-native-linear-gradient` import is aliased to `expo-linear-gradient` in `metro.config.js`; **avoid gradient props** to stay Expo Go-safe |
| Theming | `useTheme()` + `themeStore` (light/dark/system); palettes in `theme/palette.ts` |
| Server state | TanStack React Query v5 |
| HTTP | Axios (`src/api/client.ts`, injects JWT, clears auth on 401) |
| Backend | Node 24, Express 4, TypeScript |
| ORM / DB | Prisma 6 / PostgreSQL |
| ML service | Python **FastAPI** + scikit-learn (LinearRegression) + pandas/numpy (`ml-service/`); stateless, called by Express via `ML_SERVICE_URL` (default `:8000`) |
| Auth | bcrypt (hashing), jsonwebtoken (JWT), nodemailer (email) |
| Validation | Zod (backend) |
| Uploads | multer (avatars → `backend/uploads`, served at `/uploads`) |
| Android SMS | `react-native-get-sms-android` + `READ_SMS` (dev build only) |
| Dev build | EAS (`eas.json` `development` profile). `expo-dev-client` is **not** installed by default (so `expo start` defaults to Expo Go); reinstall it (`npx expo install expo-dev-client`) when building the SMS dev build. |

## 3. Design tokens — USE THESE, don't invent new colors

**Primary — Blue `#2563eb`** (buttons, active tabs/links, balance card, focus).
Tint bg `#dbeafe`, pressed/active text `#1d4ed8`, on-primary text `#ffffff`.

**Secondary / semantic accents**
- **Income / success / budget-ok — Green `#16a34a`** (light `#bbf7d0`)
- **Expense / danger / delete / budget-exceeded — Red `#dc2626`** (light `#fecaca`)
- **Warning / budget ≥80% — Amber `#f59e0b`** (alert banner bg `#fffbeb`, border `#fde68a`)

**Neutrals**
| Token | Hex |
| --- | --- |
| App background | `#f9fafb` |
| Surface / card | `#ffffff` |
| Subtle bg (inputs, chips) | `#f3f4f6` |
| Border (light) | `#e5e7eb` |
| Border (input) | `#d1d5db` |
| Text — primary | `#111827` |
| Text — secondary | `#374151` |
| Text — muted | `#6b7280` |
| Text — placeholder/faint | `#9ca3af` |

> The table above is the **light** palette. The **dark** palette lives in
> `src/theme/palette.ts` (bg `#0b1220`, card `#151c2c`, text `#f3f4f6`, …). The
> `ThemeColors` interface is the **single source of truth** for themeable colors
> (text/secondary/muted/placeholder, border/inputBorder, primary/primaryStrong/
> primaryTint/onPrimary, income/expense/warning, verified/unverified badge pairs, …).
> **All screens and shared components are now fully themed** — they read colors via
> `useTheme()` and apply them inline (keep static StyleSheets layout-only, no colors).
> React Navigation headers, the tab bar, and the status bar follow the theme too
> (a `Theme` is passed to `NavigationContainer` in `RootNavigator`). When adding UI,
> use `useTheme()` + a palette token; never hardcode a hex.

**Status badges** — Verified bg `#dcfce7` / text `#166534`; Unverified bg `#fef9c3` / text `#854d0e`.

**Category colors** (see `src/constants/categories.ts`, single source of truth):
Food `#f97316` · Transport `#3b82f6` · Shopping `#ec4899` · Entertainment `#8b5cf6` ·
Utilities `#eab308` · Healthcare `#ef4444` · Education `#14b8a6` · Others `#6b7280`.
Each category also has an emoji icon (no icon library is used — emoji only).

**Shape & type**
- Radius: inputs/buttons `10`, cards `12`, chips/pills `16–20`, avatars/icon-circles = half of size.
- Control height: buttons & inputs `50`.
- Font sizes: screen title `28/700`, section `18/700`, body `15–16`, label `14/500`, small `12–13`.
- Spacing: screen padding `16–24`, gaps `8–16`.
- Currency: USD-style via `formatCurrency` (`$1,234.56`); never use `Intl` (Hermes-unsafe).

## 4. Conventions

- **TypeScript strict** everywhere. Backend also: `noUncheckedIndexedAccess`,
  `noImplicitOverride` (watch `req.params.x` → `string | undefined`).
- **Lint/format**: ESLint + Prettier — singleQuote, trailingComma `all`,
  printWidth 100, semicolons, 2-space. Run `lint:fix` after edits.
- **Path alias**: `@/` → `src/`. Backend uses relative imports.
- **Backend layering**: `routes → controllers → services → Prisma`. Controllers are
  thin + wrapped in `asyncHandler`; business logic in services; throw `AppError(status, msg)`.
- **Validation**: Zod schemas in `backend/src/validators`; `validate(schema)` for body,
  `validateQuery(schema)` for query (result on `res.locals.query`).
- **Auth**: protected routes use `authenticate` middleware → `req.user`. JWT bearer token.
- **API success shape**: resources returned as `{ resource }` or `{ items, total, page, limit }`;
  errors as `{ status: 'error', message }`.
- **Reusable UI** (`src/components`): `Button` (variants `primary | ghost | danger`),
  `TextField`, `ScreenContainer`, `Avatar`, `TransactionForm`, `TransactionItem`. **Reuse these.**
- **Money**: Prisma `Decimal(12,2)`; serialized to a JS **number** in API responses.

## 5. Domain

- **Transaction types**: `INCOME`, `EXPENSE`.
- **Categories** (enum): `FOOD, TRANSPORT, SHOPPING, ENTERTAINMENT, UTILITIES, HEALTHCARE, EDUCATION, OTHERS`.
- **User roles** (enum): `USER` (default), `ADMIN`. Exposed as `user.role`; reloaded
  per-request by `authenticate`, so role changes apply immediately.
- API base: `/api`. Routers: `/auth`, `/profile`, `/transactions` (incl. `/summary`,
  `/stats`), `/budgets`, `/predictions` (ML forecasts, stored), `/admin` (admin-only) (+ `/health`).
- **Budgets**: per month (`"YYYY-MM"`); `category: null` = overall, else per-category.
  Status thresholds: ≥80% `warning`, ≥100% `exceeded`.

## 6. Implemented features

- **Auth**: register, login, email verification, forgot/reset password, JWT, `GET /me`.
- **Profile**: view/update profile, change password, avatar upload (multer), **Settings**
  screen (`screens/SettingsScreen.tsx`) housing the SMS auto-capture toggle + about info.
- **Transactions**: CRUD, history (paginated), search (note), filter (type/category/date/amount), `/summary`.
- **SMS import (Android)**: parse MTN MoMo / Telecel Cash / AirtelTigo Cash / bank
  alerts → transactions (`src/services/sms/*`; Transactions → Import + Home shortcut).
  Manual import **and** opt-in **auto-capture** (foreground polling via
  `useSmsAutoCapture` + `settingsStore`, reuses the reader/parser). Parser is pure TS;
  reading SMS needs a **dev build** + `READ_SMS` (no-op/guarded in Expo Go). See
  `docs/SMS_IMPORT.md`.
- **Budgets**: overall + per-category monthly budgets (CRUD) with spent/percent/status
  calc (`/budgets`); Budgets tab with month switcher, `ProgressBar` + `BudgetCard`,
  and 80%/100% alert banner.
- **Dashboard (Home)**: fintech-style, fully **themed (dark/light)** + animated
  (`FadeInView`). Summary (income/expense/balance), expense-category **pie**, monthly
  income-vs-expense **bar**, daily-spend **line** (`components/charts/*`,
  gifted-charts), and recent transactions. Powered by `GET /transactions/stats`
  (`services/stats.service.ts`); appearance toggle in Settings.
- **ML predictions**: `ml-service/` (FastAPI) trains LinearRegression on the user's
  daily spending and forecasts next 7/30 days + per-category, returning MAE/RMSE/R².
  `services/prediction.service.ts` forwards the user's transactions, then **stores the
  result** (`Prediction` model, `jsonb` + metrics columns). Express endpoints:
  `POST /api/predictions/forecast?days=`, `/category`, `/train` (generate + store);
  `GET /api/predictions` (history), `/api/predictions/latest?kind=&days=` (last stored,
  works even if the ML service is down). Returns 503 if the ML service is unreachable.
  **Not yet surfaced in the app UI.** See `ml-service/README.md`.
- **Admin**: `User.role` (`USER`/`ADMIN`); admin-only APIs guarded by
  `authenticate` → `requireAdmin` (401 no token / 403 non-admin). `GET /api/admin/stats`
  (platform totals: users, transactions, income, expenses, net + per-category stats)
  and `GET /api/admin/users?page=&limit=` (paginated user list w/ transaction counts).
  Grant/revoke via `npm run promote-admin -- <email> [--demote]` (or `ADMIN_EMAIL`);
  demo account is ADMIN in local dev. Surfaced in the app as a **role-gated Admin tab**
  (`screens/AdminScreen.tsx`, themed): net-balance hero, user/transaction/income/expense
  tiles, platform expense pie (reuses `ExpensePieCard`), and a users list. The tab only
  renders when `user.role === 'ADMIN'` (`api/admin.api.ts` + `hooks/useAdmin.ts`).
  See `docs/ADMIN.md`.
- **App shell**: tabs **Home (dashboard) · Transactions · Add · Budgets · Profile**
  (+ **Admin** for admins only); auth stack; dev "Skip login" button + optional dev auto-login.

## 7. Commands (run from repo root `Final Year Project/`)

```bash
npx expo start          # Expo dev server (Expo Go) — the app IS the root. (= npm start)
npm run web             # also: npm run android / ios / start:dev-client / doctor

npm run backend         # API (dev, nodemon)        npm run backend:build / backend:start
npm run db              # zero-install embedded Postgres :5432 (backend/db-up.cjs)
npm run prisma:migrate  # migrations                npm run prisma:generate / prisma:studio

npm run typecheck       # app (tsc)                 npm run backend:typecheck
npm run lint            # lints app + backend       npm run install:all
```

The Expo/app scripts (`start`, `web`, `android`, `doctor`, `typecheck`, `lint`) run at
the **root** (the root is the Expo app). The `backend` / `db` / `prisma:*` scripts
delegate into `backend/` via `npm --prefix`. `npx expo start` now works from the root.

> **Expo Go is the default.** `expo-dev-client` is intentionally not installed, so a
> plain `npx expo start` (or `npm start`) boots in Expo Go mode and prints an
> `exp://192.168.100.27:8081` QR that the phone camera opens. (Installing
> `expo-dev-client` flips the default to dev-build mode and emits a dev-client QR that
> shows "no usable data found" when scanned — only reinstall it to build the SMS dev
> build, and then start with `expo start --dev-client`.)

## 8. Local dev runtime (no system Postgres needed)

- `backend/db-up.cjs` boots a **zero-install embedded PostgreSQL on :5432** (data in
  `backend/.localdb`). Requires the `embedded-postgres` dev package (currently
  installed `--no-save`; not yet in package.json).
- Default running stack: DB `:5432`, API `:4000` (LAN `http://192.168.100.27:4000/api`),
  Metro `:8081` (`exp://192.168.100.27:8081`).
- **Demo account** (verified, has sample data, **ADMIN** in local dev): `demo@expensee.app` / `demo12345`.
- **Dev bypass**: a "Skip login (dev)" button on the login screen (gated by `__DEV__`).
  Set `EXPO_PUBLIC_DEV_AUTOLOGIN=true` to skip the screen entirely. Credentials in
  `src/constants/config.ts`.
- Frontend talks to the API via `EXPO_PUBLIC_API_URL` (LAN IP for physical devices).
- Windows Firewall must allow inbound `4000` + `8081` for a phone to connect (needs admin).
