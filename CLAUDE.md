# CLAUDE.md — ExpenSee project guide

> **Read this first, every task.** Before starting any change, skim the **Design
> tokens** and **Conventions** below and reuse the existing values/patterns so the
> app stays visually and structurally consistent. **After making changes, update
> this file** (design tokens, structure, commands, and the _Implemented features_
> / _Last updated_ lines).

_Last updated: 2026-06-13 (**Edit Transaction → glass**: `EditTransactionScreen` migrated to the
premium glass design system (headerless `AuthLayout` + back pill), mirroring the Add screen —
shared animated `TypeToggle`, hero `AmountField`, glass details card, `GradientButton` +
`SuccessCheck` overlay, frosted danger delete. Keyed inner form re-seeds per transaction; route
is headerless.)
(2026-06-13 — **Budget set/edit → glass**: `BudgetFormScreen` migrated to the
premium glass design system (headerless `AuthLayout` + back pill) — frosted overview card with
`CircularProgress` ring + stat breakdown (live `useBudgets`), AI insight, glass `$` currency
input, `GradientButton` + `SuccessCheck` success overlay, empty state. `BudgetForm` route is now
headerless.)
(2026-06-13 — **Local notifications**: `expo-notifications` — money-received
alerts (income, manual + SMS auto-capture), budget-threshold alerts (deduped per month via
`notifiedBudgetsStore`), and scheduled daily-reminder + weekly-summary. Service in
`services/notifications/*`, prefs in `settingsStore`, scheduling via `<NotificationManager/>`,
toggles in a new Settings **NOTIFICATIONS** section. Expo Go-safe (local only — no push/FCM).)
(2026-06-13 — **Design tokens + primitive polish**: new `theme/spacing.ts`
(`spacing`/`radius`/`sizing`/`shadow` scale); `typography` presets gained tuned line-heights
+ a `title` preset; core primitives `Button`/`TextField`/`Card`/`ScreenContainer` refined to
use Inter + tokens + soft shadows (Button tints its shadow; TextField has a focus highlight).)
(2026-06-13 — **Auth simplified**: email verification removed — `registerUser`
creates accounts pre-verified and `register` returns a JWT, so sign-up is **auto-login**
straight to the main screen. VerifyEmail screen deleted. Password reset still needs the
`SMTP_*` keys in `backend/.env` to email real links.)
(2026-06-07 — **Profile stack** redesigned to glass — ProfileHome (glass profile card + action rows + log out), EditProfile & ChangePassword (glass `FloatingLabelInput` forms + `PasswordStrength`), Settings (glass appearance segmented + glass SMS toggle + about); all headerless via `AuthLayout` (added `center` prop) w/ glass back buttons. New Settings/LogOut/ChevronRight icons)_

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
| Notifications | `expo-notifications` — **local only** (Expo Go-safe; no push/FCM). Foreground handler + Android channel set at launch |
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

**Shape & type** — layout tokens now live in `src/theme/spacing.ts`; **prefer these over
ad-hoc numbers** so the app keeps a consistent rhythm.
- `spacing` (4px scale): `xs 4 · sm 8 · md 12 · lg 16 · xl 20 · xxl 24 · xxxl 32`.
- `radius`: `sm 8 · md 12 · lg 16 · xl 20 · pill 999` — inputs/buttons `md`, cards `lg`,
  chips/pills `xl`/`pill`, avatars/icon-circles = half of size. (Glass surfaces use their
  own larger radii, e.g. `GlassCard` 28.)
- `sizing.control` `52` — standard height for buttons & inputs.
- `shadow` presets `sm/md/lg` (iOS shadow + Android elevation): pair with a themed
  `shadowColor`/`backgroundColor`. Filled `Button`s tint the shadow to their own color.
- Type: presets in `theme/typography.ts` (`typography.*` — now with tuned `lineHeight`s +
  a `title` 22/700 preset). Screen title `28–32/700`, section `18/600`, body `16`, label
  `14/500`, small `12`. **All shared primitives use the Inter `fontFamily`** (never raw
  `fontWeight`).
- Spacing in practice: screen padding `xxl`, gaps `sm–lg`.
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
  (no OAuth backend yet — they show a "coming soon" alert).
  **No email verification**: registration is **auto-login** — `registerUser` creates the
  account already verified (`isEmailVerified: true`) and `register` returns `{ user, token }`,
  so the app stores the session (`useRegister` → `setAuth`) and lands straight on the main
  screen. There is no VerifyEmail screen. (The backend `verify-email` endpoints + browser
  link handler still exist but are no longer part of any flow.) Password **reset** still uses
  a token; with `SMTP_*` empty in `backend/.env`, `email.service` just logs the reset link to
  the console (fill the `SMTP_*` keys to send real reset emails).
- **Onboarding (first launch)**: 4-page glassmorphism carousel
  (`screens/onboarding/OnboardingScreen.tsx`) — Welcome · Track expenses automatically ·
  Smart budgeting · AI predictions. Animated SVG illustrations + floating elements
  (`components/onboarding/{illustrations,FloatingElement,ProgressDots}`), horizontal paging
  with **parallax** + fade/scale page transitions (`useAnimatedScrollHandler` + `scrollX`),
  expanding progress dots, **Skip**, and a **Get Started** CTA. Shown once, gated by
  `onboardingStore` (persisted `hasOnboarded`); `RootNavigator` order is
  splash → onboarding (if not authed & not onboarded) → auth → app. Reuses the auth
  design system (`useAuthTheme`, `AnimatedBackground`, `GradientButton`).
- **Profile**: the whole Profile stack is premium **glass** (headerless `ProfileNavigator`;
  each screen uses `AuthLayout` — now with a `center` prop — + glass back button):
  **ProfileHome** (glass profile card: avatar w/ edit badge, name/email, verified pill +
  glass action rows → Edit/Change password/Settings + Log out), **EditProfile** &
  **ChangePassword** (glass `GlassCard` forms w/ `FloatingLabelInput`, `PasswordStrength`,
  `GradientButton`/`GlassButton`), **Settings** (`screens/SettingsScreen.tsx` — glass
  appearance segmented (Light/Dark/System), a **glass SMS auto-capture toggle** reusing
  `settingsStore` + `smsReader`, and About). Avatar upload (multer) preserved. The shared
  core `AutoCaptureToggle` stays for the SMS Import screen. New icons: Settings/LogOut/ChevronRight.
- **Transactions**: CRUD, history (paginated), search (note), filter (type/category/date/amount), `/summary`.
  The **Add** tab (`screens/transactions/AddTransactionScreen.tsx`) is a premium **glass**
  form (auth design system) — hero `AmountField`, `CategoryChips`, Merchant + Notes, a
  `DateField` (quick chips + native date picker), expense/income toggle (honours the
  dashboard quick-action preset `type`), and a `SuccessCheck` overlay on save. **Merchant
  + Notes are combined into the single `note`** (`merchant — notes`) since there's no
  merchant column. Reusable pieces in `components/transactions/*` (incl. the shared glass
  `TypeToggle` — a segmented control with a spring-animated sliding indicator). **Edit**
  (`EditTransactionScreen`) is now the same premium **glass** as Add — headerless (`AuthLayout`
  shell + glass back pill), mirroring the Add form (`TypeToggle`, hero `AmountField`, a details
  `GlassCard` with `CategoryChips` + `FloatingLabelInput` note + `DateField`, a `GradientButton`
  save with a `SuccessCheck` overlay, and a frosted **danger delete**). It can also edit the
  date. The screen renders a keyed inner `EditForm` (`key={transaction.id}`) so fields re-seed
  when opening a different transaction. The old core `TransactionForm` is parked.
  The **history** screen (`TransactionListScreen`) is also premium **glass** (headerless
  in `TransactionsNavigator` — renders its own glass header w/ the Import action): search
  (icon + clear), type segmented, **date-range selector** (All/7d/30d/Month/Custom →
  native picker `from`/`to`), category chips; list of `SwipeableTransactionRow`
  (`react-native-gesture-handler` `ReanimatedSwipeable`) — **tap = Edit** (consistent with the
  dashboard's recent list), **swipe right = Edit, swipe left = Delete**; staggered entrance +
  `LinearTransition` layout, skeleton loaders, themed pull-to-refresh, beautiful empty state.
  Rows use a translucent glass surface (not per-row `BlurView`) for 60 FPS. The dashboard's
  **Recent transactions** rows share the same icon/`category · date`/tap-to-edit treatment.
  `EditTransactionScreen` keys `TransactionForm` by `transaction.id` so it re-syncs when the
  param changes (fixes a stale-form bug when editing different items via cross-tab nav). The
  old `TransactionItem` is parked.
- **SMS import (Android)**: parse MTN MoMo / Telecel Cash / AirtelTigo Cash / bank
  alerts → transactions (`src/services/sms/*`; Transactions → Import + Home shortcut).
  Manual import **and** opt-in **auto-capture** (foreground polling via
  `useSmsAutoCapture` + `settingsStore`, reuses the reader/parser). Parser is pure TS;
  reading SMS needs a **dev build** + `READ_SMS` (no-op/guarded in Expo Go). See
  `docs/SMS_IMPORT.md`.
- **Notifications (local)**: `expo-notifications`, **local-only** so it works in Expo Go
  (no push tokens / FCM). Service in `services/notifications/*`: `configureNotifications`
  (foreground handler + Android channel, called in `App.tsx`), `ensureNotificationPermission`,
  immediate `notifyMoneyIn`/`notifyBudgetAlert`, and `scheduleDailyReminder`/
  `scheduleWeeklySummary` (stable identifiers → idempotent). `onTransactionCreated(tx)` runs
  on every create (manual `useCreateTransaction` **and** SMS auto-capture): **income →
  money-received alert**; **expense → budget-threshold check** (`runBudgetAlertCheck` fetches
  the month's budgets, notifies on escalation to warning/exceeded, deduped per
  month+budget via `notifiedBudgetsStore`). Recurring **daily reminder** (8 PM) + **weekly
  summary** (Sun 6 PM) are static scheduled notifications synced to settings by the headless
  `<NotificationManager/>`. Four prefs in `settingsStore` (`notifMoneyIn`/`notifDailyReminder`/
  `notifBudgetAlerts`/`notifWeeklySummary`, default off) drive the new Settings
  **NOTIFICATIONS** section (each toggle requests OS permission on enable). Notifications only
  fire while the app runs/foregrounded; closed-app delivery would need a dev build + server push.
- **Budgets**: overall + per-category monthly budgets (CRUD) with spent/percent/status
  calc (`/budgets`). The Budgets tab (`BudgetOverviewScreen`) is premium **glass**
  (headerless — glass header + month switcher): a **monthly budget card** with an
  animated **`CircularProgress`** ring (SVG draw-on-mount) + status pill + a **`Celebration`**
  particle burst when on-track, **budget alert** banners (≥80% / exceeded), and
  per-category **`BudgetCategoryCard`**s with animated fill bars. `components/budgets/*`
  (+ `budgetStatus` helper: ok→success, warning→amber, exceeded→danger). The **set/edit
  screen** (`BudgetFormScreen`) is now also premium **glass** (headerless `AuthLayout` shell
  + glass back pill): a frosted **overview card** (`CircularProgress` ring + Spent%/Remaining%
  legend + Budget/Spent/Remaining stat row, fed by live `useBudgets(month)` progress), an
  **AI insight** card (`SparkleIcon`), a glass **currency input** (`FloatingLabelInput` + `$`
  prefix + focus/success/error), a `GradientButton` set/save action with a `SuccessCheck`
  success overlay (`Modal`), a subtle glass delete, and a `TargetIcon` **empty state** for new
  budgets. Old `BudgetCard`/`ProgressBar` and the core `TransactionForm`-era styling are parked.
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
