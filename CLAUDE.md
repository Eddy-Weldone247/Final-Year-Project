# CLAUDE.md — ExpenSee project guide

> **Read this first, every task.** Before starting any change, skim the **Design
> tokens** and **Conventions** below and reuse the existing values/patterns so the
> app stays visually and structurally consistent. **After making changes, update
> this file** (design tokens, structure, commands, and the _Implemented features_
> / _Last updated_ lines).

_Last updated: 2026-06-06 (New **Analytics** tab (glass) — Income-vs-Expense dual **line** chart w/ interactive pointer tooltip + animated `ProportionBar`, category **pie** (reuses `ExpensePieCard` embedded), monthly **bar** chart w/ tap tooltip; chart draw animations, loading/empty states. `components/analytics/*`; wired as a bottom tab in `AppNavigator`)_

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
| Animation | **Reanimated 4** (`react-native-worklets`) — UI-thread 60 FPS; layout `entering` (FadeIn/Up/Down), `useAnimatedStyle/Props`, springs. New Arch is on (`app.json`), all Expo Go-safe. (Built-in `Animated` still used by `FadeInView`.) |
| Glass / gradient | `expo-blur` (`BlurView`, `experimentalBlurMethod="dimezisBlurView"` for Android) + `expo-linear-gradient`. Always pair blur with a translucent bg so it degrades gracefully |
| Gestures | `react-native-gesture-handler` (`GestureHandlerRootView` wraps the app in `App.tsx`); swipeable rows via `ReanimatedSwipeable`. Date entry via `@react-native-community/datetimepicker` |
| Fonts | **Inter** via `@expo-google-fonts/inter` + `expo-font`, loaded in `App.tsx` (gated by `expo-splash-screen`); families/sizes in `theme/typography.ts`. Falls back to system font on load error |
| Theming | `useTheme()` + `themeStore` (light/dark/system); core palette in `theme/palette.ts`. **Auth flow** layers a richer palette in `theme/authTheme.ts` (`useAuthTheme()`) |
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

**Auth flow palette (premium layer)** — the authentication screens use a richer,
more expressive system in `src/theme/authTheme.ts` (`useAuthTheme()` → `{ isDark, c }`),
**separate from the core app tokens** so the rest of the app stays calm: primary
`#3B82F6` · secondary `#8B5CF6` · accent `#06B6D4` · success `#10B981`; animated
gradient bg (dark `#0F172A→#1E293B`, light `#EEF2FF→#FFFFFF`); glass surfaces
(`glassBg`/`glassBorder`/`glassHighlight`) + primary glow. Reuse `c.*` for any new
auth UI; reuse `useTheme()` tokens everywhere else.

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

- **Auth (premium UI)**: full glassmorphism + animated-gradient flow —
  **Splash → Welcome → Login → Register → ForgotPassword → ResetPassword → VerifyEmail**
  (`screens/auth/*`). Splash is a launch gate in `RootNavigator` (min ~1.7s); the rest
  live in `AuthNavigator` (headerless, `Welcome` initial). Built from a reusable kit:
  `AuthLayout`/`AuthHeader` (`components/auth`), `GlassCard` (`components/cards`),
  `FloatingLabelInput`/`PasswordStrength`/`Checkbox` (`components/inputs`),
  `GradientButton`/`GlassButton`/`SocialButton` (`components/buttons`),
  `AnimatedBackground`/`SuccessCheck`/`PressableScale` (`components/animations`), and an
  SVG icon set + `LogoMark` (`components/icons`). Reanimated 60 FPS micro-interactions
  (floating-label focus, press-scale, glow pulse, stroke-draw success, staggered entrances).
  Backend logic preserved (`useLogin/useRegister/useForgot/useReset/useVerifyEmail`).
  Remember-me persists the email (`useRememberedEmail`). **Social buttons are UI-only**
  (no OAuth backend yet — they show a "coming soon" alert). Register routes to VerifyEmail.
- **Onboarding (first launch)**: 4-page glassmorphism carousel
  (`screens/onboarding/OnboardingScreen.tsx`) — Welcome · Track expenses automatically ·
  Smart budgeting · AI predictions. Animated SVG illustrations + floating elements
  (`components/onboarding/{illustrations,FloatingElement,ProgressDots}`), horizontal paging
  with **parallax** + fade/scale page transitions (`useAnimatedScrollHandler` + `scrollX`),
  expanding progress dots, **Skip**, and a **Get Started** CTA. Shown once, gated by
  `onboardingStore` (persisted `hasOnboarded`); `RootNavigator` order is
  splash → onboarding (if not authed & not onboarded) → auth → app. Reuses the auth
  design system (`useAuthTheme`, `AnimatedBackground`, `GradientButton`).
- **Profile**: view/update profile, change password, avatar upload (multer), **Settings**
  screen (`screens/SettingsScreen.tsx`) housing the SMS auto-capture toggle + about info.
- **Transactions**: CRUD, history (paginated), search (note), filter (type/category/date/amount), `/summary`.
  The **Add** tab (`screens/transactions/AddTransactionScreen.tsx`) is a premium **glass**
  form (auth design system) — hero `AmountField`, `CategoryChips`, Merchant + Notes, a
  `DateField` (quick chips + native date picker), expense/income toggle (honours the
  dashboard quick-action preset `type`), and a `SuccessCheck` overlay on save. **Merchant
  + Notes are combined into the single `note`** (`merchant — notes`) since there's no
  merchant column. Reusable pieces in `components/transactions/*`. Edit still uses the
  core-themed `TransactionForm`.
  The **history** screen (`TransactionListScreen`) is also premium **glass** (headerless
  in `TransactionsNavigator` — renders its own glass header w/ the Import action): search
  (icon + clear), type segmented, **date-range selector** (All/7d/30d/Month/Custom →
  native picker `from`/`to`), category chips; list of `SwipeableTransactionRow`
  (`react-native-gesture-handler` `ReanimatedSwipeable`) — **swipe right = Edit, swipe
  left = Delete**, tap = expand details; staggered entrance + `LinearTransition` layout,
  skeleton loaders, themed pull-to-refresh, beautiful empty state. Rows use a translucent
  glass surface (not per-row `BlurView`) for 60 FPS. The old `TransactionItem` is parked.
- **SMS import (Android)**: parse MTN MoMo / Telecel Cash / AirtelTigo Cash / bank
  alerts → transactions (`src/services/sms/*`; Transactions → Import + Home shortcut).
  Manual import **and** opt-in **auto-capture** (foreground polling via
  `useSmsAutoCapture` + `settingsStore`, reuses the reader/parser). Parser is pure TS;
  reading SMS needs a **dev build** + `READ_SMS` (no-op/guarded in Expo Go). See
  `docs/SMS_IMPORT.md`.
- **Budgets**: overall + per-category monthly budgets (CRUD) with spent/percent/status
  calc (`/budgets`). The Budgets tab (`BudgetOverviewScreen`) is premium **glass**
  (headerless — glass header + month switcher): a **monthly budget card** with an
  animated **`CircularProgress`** ring (SVG draw-on-mount) + status pill + a **`Celebration`**
  particle burst when on-track, **budget alert** banners (≥80% / exceeded), and
  per-category **`BudgetCategoryCard`**s with animated fill bars. `components/budgets/*`
  (+ `budgetStatus` helper: ok→success, warning→amber, exceeded→danger). `BudgetForm`
  (set/edit) stays core-themed; old `BudgetCard`/`ProgressBar` are parked.
- **Dashboard (Home)**: premium **glassmorphism, dark-first** home (Revolut/Coinbase/
  Wealthsimple vibe) — uniquely uses the **auth design system** (`useAuthTheme` +
  `AnimatedBackground` gradient/blobs) rather than the core app theme. Sections
  (`components/dashboard/*`): (1) header (avatar + greeting + glass notification bell),
  (2) **balance card** (`BalanceHero` — frosted `GlassCard`, count-up total balance via
  `AnimatedCounter`, this-month income/expense, embedded **smooth area sparkline** of
  daily spend via gifted-charts), (3) **quick actions** (`QuickActions` glass tiles →
  Add Expense/Income deep-link the Add tab w/ preset `type`, Set Budget → Budgets),
  (4) **Spending Breakdown** — `ExpensePieCard` reused in a new `embedded` mode
  (renders bare, no inner `Card`/title, transparent donut center) inside a `GlassCard`
  titled "Spending Breakdown"; pie draw + staggered legend fade-in + pressable legend
  rows (memoized), (5) **AI insight** (`AIInsightCard` — projection + top category +
  savings; heuristic, can later read `/predictions`), (6) **recent transactions** glass
  list (+ beautiful empty state, skeleton loaders). `GlassCard` entrance springs +
  `PressableScale` micro-interactions. Powered by `GET /transactions/stats`
  (`services/stats.service.ts`). `ExpensePieCard` is shared with Admin/Analytics — its
  default (non-embedded) rendering is unchanged. `MonthlyBarCard`, `DailyLineCard`,
  `CategoryBreakdown` remain parked (available to re-add). Other tabs still use the core
  theme — migrate them to glass next.
- **Analytics**: glass **Analytics tab** (`screens/AnalyticsScreen.tsx`) — three sections
  mapped to three charts: **Income vs Expense** (dual **line** chart over 6 months w/
  interactive `pointerConfig` tooltip + totals + animated `ProportionBar`), **Category
  spending** (**pie** via embedded `ExpensePieCard`), **Monthly comparison** (**bar**
  chart of monthly spend w/ tap `renderTooltip`). All gifted-charts, Expo Go-safe (no
  native gradient props); chart draw animations + `GlassCard` entrances; loading
  skeletons + empty state. Powered by `GET /transactions/stats`. `components/analytics/*`.
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
- **App shell**: tabs **Home (dashboard) · Transactions · Add · Budgets · Analytics · Profile**
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
