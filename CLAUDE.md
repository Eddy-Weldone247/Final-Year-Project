# CLAUDE.md — ExpenSee project guide

> **Read this first, every task.** Before starting any change, skim the **Design
> tokens** and **Conventions** below and reuse the existing values/patterns so the
> app stays visually and structurally consistent. **After making changes, update
> this file** (design tokens, structure, commands, and the _Implemented features_
> / _Last updated_ lines).

_Last updated: 2026-07-24 (**Notification Center connected to app events**: the screen now shows
real in-app notifications from a persisted `store/notificationsStore.ts` (Zustand + AsyncStorage,
newest-first, capped 50, dedupe by `dedupeKey`). Thin generators in `services/appNotifications.ts`
(`notifyWelcome`/`notifyExpenseRecorded`/`notifySmsImported`/`notifyBudgetWarning`/`notifyBudgetExceeded`/
`notifyPredictionReady`/`notifyMonthlySummary`) are called imperatively from existing event sites:
register success (`useAuth`), manual expense (`AddTransactionScreen`, EXPENSE only), SMS import
(`useSmsAutoCapture` + `ImportSmsScreen`), budget ≥80%/100% (`triggers.runBudgetAlertCheck`, deduped
via `notifiedBudgetsStore`, now fires in-app regardless of the OS push setting), LR prediction
(`hooks/usePrediction` + `api/prediction.api` — model unchanged) and monthly summary (both on the
Analytics screen, deduped once per month). `NotificationScreen` reads the store (kind→icon/tone via
local `NOTIFICATION_META`, timestamp via `utils/relativeTime`), keeps the empty state and tap-to-read.
No background service/engine; adds don't re-render Home (only the closed modal, which returns null).) added
`<StatusBar style={isDark?'light':'dark'} />` inside the modal (legible icons vs the gradient in
both themes), and made shadows consistent: `NotificationCard` + the header back pill now carry the
same subtle themed `shadowColor: c.glow` soft lift as the empty-state circle (scaled by prominence).
No redesign, no new functionality — the screen stays lightweight (static gradient, memoized cards,
transparent modal + unmount-on-close), so it opens/returns/scrolls instantly with no white flash,
lag, blocked touches, or extra re-renders.)
(2026-07-24 — **Notification read/unread interaction**: `NotificationCard` is now
tappable — a tap marks it read via local state in `NotificationScreen` (`markRead`, persists while
Home is mounted). Unread = small coloured dot + **bolder title** (`fontFamily.bold`) + accent border
+ full opacity; read = no dot + `semibold` title + `glassBorder` + dimmed (0.72). The transition
animates smoothly — opacity via `useAnimatedStyle`+`withTiming`, the dot via `FadeOut`. No delete /
no swipe; UI + navigation preserved.)
(2026-07-24 — **Notification screen — glass list + reusable card**: the Notification
screen now renders a clean glass notification list from a **static** sample array (presentational
only — NOT generated from app activity; set the array to `[]` for the empty state). New reusable
`components/notifications/NotificationCard.tsx` — a translucent glass card with a tone-tinted icon,
title, description, timestamp, and a read/unread indicator (unread = accent dot + border + full
opacity; read = faded); staggered `FadeInDown` entrances, no per-card blur (lightweight). The
`NotificationScreen` shows the list or the existing empty state when the array is empty. Only the
Notification screen changed — Home, navigation, and other screens untouched.)
(2026-07-24 — **Notification screen — glass empty state**: the Home bell's native
`Alert` placeholder was replaced with a lightweight, glassmorphic **Notification screen** (new
`components/notifications/NotificationScreen.tsx`) — presentational only (no notification data or
logic): a "Notifications" header with a glass back pill, and a centered empty state (glass/neu icon
circle with soft-lift shadow + primary halo + `BellIcon`, headline "No Notifications Yet", subtitle
"You're all caught up. / Alerts and reminders will appear here when available."), with subtle
staggered fade-ins. Static `LinearGradient` bg (no animated loops) keeps it cheap; transparent
modal + own `SafeAreaProvider`/`initialWindowMetrics` + unmount-on-close keep Home instantly
interactive; light/dark via `useAuthTheme`. Only the bell's `onPress` + a modal render were added
to `HomeScreen` — the bell UI, navigation, and all other screens are unchanged.)
(2026-07-23 — **Notification feature rolled back to baseline**: the in-app Notification
Center built earlier this session was fully reverted to the original placeholder. The Home bell is
back to `Alert.alert('Notifications', "You're all caught up — alerts are coming soon.")` (with the
always-on dot). **Deleted**: `components/notifications/*`, `hooks/useNotifications.ts` +
`usePredictions.ts`, `store/notificationReadStore.ts` + `achievementStore.ts`,
`services/{achievements,budgetAlerts,spendingInsights,predictionNotifications,reminderNotifications}.ts`,
`api/prediction.api.ts`, `types/notification.ts`, `utils/dateKeys.ts`. **Restored to originals**:
`HomeScreen.tsx`, `services/notifications/triggers.ts`, `store/notifiedBudgetsStore.ts`. The
pre-existing OS local-notification system (`services/notifications/*`, `<NotificationManager/>`,
`settingsStore` prefs) is unchanged. NOTE: the dated notification-center entries below are
historical only — all that work has been removed.)
(2026-07-23 — **Notification → Home white-screen fix**: after the bell touch fix
(`if (!visible) return null` fully unmounts the Modal on close), returning to Home flashed a 3–4s
white screen. Cause: the Modal window was `transparent={false}` (fully opaque); Android stops
compositing the occluded Home window, so destroying that opaque window on close forced a full, slow
redraw of Home's heavy glass background + `BlurView`s + charts. Fix (`NotificationCenter.tsx` only):
Modal is now `transparent` — the content still paints an opaque gradient so it looks identical, but
the transparent window keeps Home composited behind it → instant reveal, no white. HomeScreen never
remounts and runs no focus work; nothing else changed.)
(2026-07-23 — **Notification bell needs-multiple-taps — definitive fix**: after
opening the Notification Center once and closing, the Home bell needed 2–3 taps to reopen. Real
root cause: the RN `<Modal>` was **always mounted** (only its `visible` prop toggled), and a
dismissed-but-mounted Modal on Android leaves its native Dialog **window** in the hierarchy, which
swallows the first taps meant for the Home screen behind it. Fix (`NotificationCenter.tsx` only):
`if (!visible) return null;` — the Modal is rendered **only while open**, so it (and its window)
fully unmount on close → Home is always interactive → every tap opens instantly. The first-render
gating (`SafeAreaProvider`+`initialWindowMetrics`, mount after `runAfterInteractions`) now applies
per open; entrance animations preserved (close is instant, not faded). HomeScreen/design untouched.)
(2026-07-22 — **Notification Center first-render fix**: the modal rendered broken on
its first open (header overlapping the status bar, wrong safe area, blur not fully drawn) then fine
after. Cause: a RN `Modal` is a **separate native window**, so the app-root `SafeAreaProvider`'s
insets don't reach it and its window isn't laid out on the first visible frame. Fix (in
`NotificationCenter.tsx` only, no design change): wrap the modal in its **own** `SafeAreaProvider`
seeded with `initialWindowMetrics` (insets correct on frame 1), and gate the glass background +
animated content behind a `ready` flag set via `InteractionManager.runAfterInteractions` on the
first open (heavy render + entrance animations start only after the window has laid out; solid
gradient backdrop bridges so nothing flashes; stays mounted so re-opens/close stay smooth).)
(2026-07-22 — **Notification system audit**: reviewed the whole feature after all
phases. Surgical, no working logic rewritten. (1) Removed duplicate `dayKey`/`monthKey`/`monthTag`
copies from `achievements`/`reminderNotifications`/`predictionNotifications` → shared
`utils/dateKeys.ts` (single source of truth). (2) Hardened `useNotifications` feed assembly with an
**id-uniqueness guard** (dedup by id in the final list) so no source can ever surface a duplicate
card, on top of the existing per-source stable ids + read/dismissed/earned stores. Verified:
meaningful-only generation (each service gates on thresholds/confidence/coverage/time-windows),
no duplicates (namespaced ids + stores + render guard), smooth Reanimated animations
(entering/exiting/layout + read-fade), and glass/neu design consistency (all components use
`useAuthTheme` glass tokens; cards use translucent surfaces with **no per-card BlurView** for
60 FPS). `tsc`/`eslint` clean.)
(2026-07-22 — **Notification prioritization**: consolidated the notification
`priority` + `tone` split into four semantic **priority levels** — `critical` · `warning` · `info` ·
`success` — as the single driver of a card's indicator colour + icon. `meta.ts` `PRIORITY_META`
(consistent label + Ionicon per level: alert-circle/warning/information-circle/checkmark-circle) +
`priorityColor` (theme palette: danger red / amber / primary blue / success green — matches the
app design language). `NotificationTone` removed; `AppNotification.tone` dropped; each source now
maps to a level (budget exceeded→critical, ≥threshold→warning, on-track & achievements & income→
success, reminders/insights→info/warning). `NotificationCard` tints stripe/icon/badge/border and a
priority pill (icon + label) by the level colour. Feed-only, modular; no other app areas touched.
`tsc`/`eslint` clean.)
(2026-07-22 — **Notification management**: full read/delete controls in the
Notification Center. `notificationReadStore` gained `dismissedIds` + `dismiss(id)` / `clear(ids)`
(persisted) alongside the existing `markRead`/`markAllRead`; `useNotifications` filters dismissed
ids from the derived feed and exposes `dismiss` + `clearAll`. UI: each `NotificationCard` has a ✕
**delete** button and an **unread badge** on its icon; read cards fade (animated opacity 1→0.7) and
the badge fade-outs — removal + list reflow animate via Reanimated `exiting`(FadeOut)+`layout`
(LinearTransition). Header adds a **Clear all** (trash) action (confirm Alert) beside **Mark all
read**. Feed-only change — no other app areas touched. `tsc`/`eslint` clean.)
(2026-07-22 — **Motivational / achievement notifications**: new persisted
`store/achievementStore.ts` (unlocked-achievement **history**, `award()` no-ops on a known id) +
pure `services/achievements.ts` (`detectAchievements`, tunable `DEFAULT_ACHIEVEMENT_CONFIG`) drive
positive-reinforcement notifications (new `'achievement'` notification kind): 🎉 tracking streak
(3/7/14/30/60/100 days), 👏 transaction-count milestones (10/50/100/…), 📈 savings improved vs the
previous completed month, 🏆 stayed within the monthly budget (celebrated near month-end when on
track). `useNotifications` detects currently-satisfied achievements, unlocks new ones **once** via a
`useEffect`→`award`, and renders the persisted history (snapshotted title/body + `earnedAt`) as
cards — so each fires exactly once, survives restarts, and never duplicates (milestone ids stable,
monthly ids month-keyed). Modular; no other notification types touched. `tsc`/`eslint` clean.)
(2026-07-22 — **Reminder notifications**: new reusable
`services/reminderNotifications.ts` (`buildReminderNotifications`, tunable `DEFAULT_REMINDER_CONFIG`)
finally uses the `'reminder'` notification kind in the Notification Center feed. Context-aware,
intelligently scheduled reminders: "log today's spending" (evening only, suppressed once anything
is logged today), "monthly report ready" (1st of month), "budgets reset tomorrow" (last day of
month, if budgets exist), and a mid-month "review your budget" check-in (day 15, if budgets exist).
**Anti-spam by design**: each fires only in its window and carries a per-day / per-month id so it
appears once per cadence (deduped via `notificationReadStore`); suppressed when it would be noise.
Wired into `useNotifications` (variant→visual map, `kind:'reminder'`). Pure/modular; no scheduling
side-effects (distinct from the OS `scheduleDailyReminder`/`scheduleWeeklySummary` push path).
`tsc`/`eslint` clean.)
(2026-07-22 — **AI prediction notifications**: the existing ML LinearRegression
forecasts are now surfaced as Notification Center alerts (model unchanged — consumed only). New
frontend layer: `api/prediction.api.ts` (`forecastSpending`/`forecastCategory` → `POST
/predictions/forecast|category?days=`), `hooks/usePredictions.ts` (React Query, 6h stale, retry
off, gated on auth), and reusable `services/predictionNotifications.ts` (`buildPredictionNotifications`,
tunable `DEFAULT_PREDICTION_CONFIG`). Emits: month spend projection ("You are predicted to spend
GH₵4,350 this month."), projected savings ("…likely to save GH₵420 if your current spending
continues."), and per-budget exceed forecasts ("…may exceed your Food budget within 5 days.").
**Only when confident** (R² ≥ `minR2`, `n_samples` ≥ `minSamples`) **and realistic** (finite,
non-negative, within bounds, days-to-exceed 1..`maxDaysToExceed`); otherwise nothing. Ids are
month-bucketed → one stable slot each (deduped via `notificationReadStore`). Wired into
`useNotifications` (horizon = days left in month); ML service down → forecasts error silently → no
prediction cards. `tsc`/`eslint` clean.)
(2026-07-22 — **Spending insight notifications → intelligent**: new reusable
`services/spendingInsights.ts` (`buildSpendingInsights`, tunable `DEFAULT_INSIGHT_CONFIG`) replaces
the Notification Center's single top-category insight. A single O(n) pass over recent transaction
history buckets this-week vs last-week spend (overall + per category) and emits only **meaningful**
insights: week-over-week total delta ("You spent GH₵250 more this week than last week."), per-
category % change ("Food spending increased by 18%." / "Transport spending decreased by 12%."), and
top-2 ranking changes ("Entertainment is now your second highest spending category."). Gated by
absolute+% thresholds and a per-category value floor (tiny categories' big swings ignored); skips
when history coverage is insufficient. Ids are 7-day-bucketed so an insight fills one stable weekly
slot (deduped via `notificationReadStore`) — no repetition. `useNotifications` maps them to card
visuals (trending-up/down/stats icons). Existing analytics (AnalyticsScreen/useStats) untouched;
the hook no longer needs `useStats`. `tsc`/`eslint` clean.)
(2026-07-22 — **Budget alert notifications → configurable thresholds**: new reusable
`services/budgetAlerts.ts` (`buildBudgetAlerts` / `buildBudgetAlert` / `reachedMilestone`,
`DEFAULT_BUDGET_THRESHOLDS` = `[50,75,80,90,100]`) is the single source of truth for budget-alert
semantics + wording (⚠️ reached X% · 🚨 exceeded by GH₵Y · ✅ on track). Both consumers use it:
the **Notification Center** feed (`useNotifications`) surfaces milestone alerts (+ on-track once
there's spend), and the **OS trigger** (`runBudgetAlertCheck`) pushes them — deduped per milestone
via `notifiedBudgetsStore` (upgraded from status→milestone number, persist `-v2`) so alerts fire
once per threshold escalation, never duplicated. Thresholds are code-configurable (pass a custom
list); no UI changed outside the Notification Center. `tsc`/`eslint` clean.)
(2026-07-22 — **Notification Center**: the Home bell no longer shows a placeholder
`Alert` — it opens a premium **glass Notification Center** (`components/notifications/*` —
`NotificationCenter` full-screen `Modal` + `NotificationCard` + `NotificationEmptyState`, reusing
the auth glass system: `AnimatedBackground`, glass back pill, `PressableScale`, `useAuthTheme`).
Cards show icon + title + description + relative timestamp + **priority indicator** + read/unread
state; grouped into **Today / Yesterday / Earlier** (`meta.ts` helpers). Feed is derived live by
`hooks/useNotifications.ts` from real activity (budget warning/exceeded alerts, money received,
AI top-category insight) with read state persisted in `store/notificationReadStore.ts`
(`markRead`/`markAllRead`); empty → beautiful empty state. Bell dot + a11y label now reflect the
unread count. Presented as a modal so **navigation is unchanged**; only `HomeScreen` wiring touched,
no other screens. Dark/light auto via the palette; Expo Go-safe.)
(2026-07-21 — **SMS parser architecture audit**: whole pipeline reviewed after all
phases. Surgical, no working logic rewritten. (1) Removed dead code from `patterns.ts`
(`AMOUNT_PREFIX_RE`/`AMOUNT_SUFFIX_RE`/`FEE_CONTEXT_RE`/`CATEGORY_KEYWORDS`, superseded by
`amount.ts`/`category.ts`) — it now holds only shared cross-cutting regexes. (2) Single source of
truth for currency detection: `amount.hasCurrencyAmount()` reused by `validator.ts` (removed a
duplicated regex + a validate/extract disagreement risk). (3) Extracted `detectProvider` →
`provider.ts` and `extractDate` → `date.ts`; `parser.ts` is now a pure orchestrator
(validator→provider→type→amount→merchant→category→date). (4) Added `index.ts` **public API barrel**
(`@/services/sms`). (5) **Functional fix**: `detectProvider` now recognises named banks + card
networks (Ecobank/Absa/Stanbic/GTBank/Visa/Mastercard → `Bank`), which were previously dropped —
validation still runs first so no spam leaks. Verified against the **real compiled pipeline** with
55 realistic cases (MoMo/Telecel/Ecobank/Absa/Visa/Mastercard/salary/ATM/utility/food + OTP/promo/
scam/delivery/recharge) — 55/55 pass; invariants confirmed: no OTP/promo/scam imported, no phone
number → amount, every category in-enum, dedup within-batch + against store. `tsc`/`eslint` clean.)
(2026-07-21 — **SMS duplicate detection → content fingerprints**: new
`services/sms/dedupe.ts` (`filterDuplicates` / `computeFingerprint` / `extractReference` /
`logDuplicates`) upgrades import dedup from **SMS-id-only** to a content **fingerprint** built from
amount + timestamp (minute bucket) + sender/provider + reference number (scanned from `raw`, no
parser change) + merchant — reference wins when present, else the composite. Single O(n) `Set`-based
pass that also catches intra-batch dupes; skips are returned with a reason and logged
(`[SMS dedupe] …`). `importedSmsStore` now persists `importedFingerprints` alongside `importedIds`;
`markImported(ids, fingerprints?)`. Wired into all three commit points (`useSmsImport` scan,
`ImportSmsScreen` import, `useSmsAutoCapture`). Parser extraction untouched.)
(2026-07-21 — **SMS transaction-type detection → modular + configurable**: new
`services/sms/transactionType.ts` replaces the old inline `detectType` in `parser.ts`. A
configurable, ORDERED keyword ruleset (`DEFAULT_TYPE_RULES`) detects a rich `SmsTransactionType`
(Income/Expense/Transfer/Withdrawal/Deposit/Refund/Cash Out/Cash In) via
`classifyTransactionType(body, rules?)` (first-match; `null` if no direction signal → `parseSms`
drops the SMS), then maps to the domain `TransactionType` via `smsTypeToDomain` (Deposit/Cash In/
Refund→INCOME; Withdrawal/Cash Out→EXPENSE; **Transfer resolved by direction words** — inbound
from/received→INCOME else EXPENSE). Income is ordered before Expense (preserving the old
credit-before-debit precedence). Domain type unchanged; only type detection changed.)
(2026-07-21 — **SMS category classification → modular + configurable**: new
`services/sms/category.ts` replaces the old inline `guessCategory` in `parser.ts`. A configurable,
ORDERED keyword ruleset (`DEFAULT_CATEGORY_RULES`) classifies into a rich `SmsCategory` label set
(Food/Transport/Shopping/Utilities/Entertainment/Healthcare/Education/Salary/Income/Transfer/Bills/
Airtime/Internet/Mobile Money/Cash Withdrawal/Cash Deposit/Insurance/Investments/Miscellaneous) via
`classifySmsCategory(text, rules?)` (first-match wins; unmatched → Miscellaneous), then maps to the
app's fixed domain `Category` enum via `SMS_CATEGORY_TO_DOMAIN` so `parseSms` still stores a valid
`Category` (Bills/Airtime/Internet→UTILITIES; Salary/Transfer/MoMo/Cash*/Insurance/Investments→
OTHERS). The domain enum is unchanged — persisting the rich labels would need a Prisma-enum
migration + Zod/`types` changes (out of scope). Only classification changed.)
(2026-07-21 — **SMS merchant extraction → modular**: new `services/sms/merchant.ts`
(`extractMerchant` → short name or `"Unknown"`; reusable helpers `matchKnownEntity` /
`extractCounterparty` / `cleanMerchantName` + a curated `KNOWN_ENTITIES` dictionary of GH banks,
wallets & merchants — MTN MoMo, Ecobank, Absa, Stanbic, Bolt, Uber, Melcom, KFC, Shell, Goil…)
replaces the old inline `extractMerchant`/`cleanMerchant` in `parser.ts`. It captures the
counterparty after money-flow prepositions (from/to/at) with strict name-token rules (stops at
connective words, punctuation, or account/phone numbers) and normalises known brands to canonical
casing; when nothing name-like is found it returns `"Unknown"` instead of a whole sentence. Only
merchant extraction changed — validation, amount, category, types and UI untouched.)
(2026-07-21 — **SMS amount extraction → modular**: new `services/sms/amount.ts`
(`extractAmount` → `{ amount, currency, confidence }`, `CurrencyCode` `'GHS' | 'USD'`) replaces
the old inline `extractAmount` in `parser.ts`. A number only qualifies if **adjacent to a
currency marker** (GH₵ / GHS / GHC / ₵ / cedis / USD / US$ / $), which alone discards phone
numbers, OTPs, reference / account / txn IDs and reward points. When several currency amounts
exist, each is scored by its **own clause's** context (positive txn verbs vs balance/fee/levy/
tax/reward) to pick the real transaction amount; `confidence` reflects the pick. Only amount
extraction changed — validation, category, types, and UI untouched (`parseSms` still uses
`.amount`).)
(2026-07-21 — **SMS validation layer**: new `services/sms/validator.ts` —
a modular, confidence-scored gate (`validateSms`/`isFinancialSms`, `DEFAULT_CONFIDENCE_THRESHOLD`
`0.5`) run as the **first line of `parseSms`** so OTPs, verification codes, promos, delivery /
recharge confirmations, lottery and general notifications are ignored before any field
extraction (fixes random numbers being imported as amounts). Weighted positive signals
(currency amount · debit/credit direction · running balance · txn vocab · trusted sender) minus
spam penalties; a spam term is only tolerated as a safety **footer** ("never share your OTP/PIN")
when the message is structurally a real transaction (currency **+** balance **+** core verb).
Supports MTN MoMo / Telecel / AirtelTigo / bank / Visa / Mastercard. No parser-extraction, UI,
type, or consumer changes — both `parseMany` callers inherit the gate.)
(2026-06-13 — **Edit Transaction → glass**: `EditTransactionScreen` migrated to the
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
Each category has an **emoji** `icon` (chips, transaction rows) **and** an `ionicon`
(`@expo/vector-icons` Ionicons glyph, typed against `Ionicons.glyphMap`) used by the
dashboard/Analytics **Spending Breakdown legend** (`ExpensePieCard`).

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
- Currency: **Ghanaian Cedi** (`GHS` · symbol `GH₵` · locale `en-GH`) via `formatCurrency`
  (`GH₵1,234.56`). Symbol/code/locale constants live in `utils/formatCurrency.ts`
  (`CURRENCY_SYMBOL`/`CURRENCY_CODE`/`CURRENCY_GLYPH`/`CURRENCY_LOCALE`); the bare `₵`
  `CURRENCY_GLYPH` is used in tight spots (chart axes, the onboarding coin). **Never use
  `Intl`** — Hermes ships without full ICU data, so currency formatting is done manually.

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
  reading SMS needs a **dev build** + `READ_SMS` (no-op/guarded in Expo Go). A modular
  **validation layer** (`services/sms/validator.ts` — `isFinancialSms`/`validateSms`) gates
  `parseSms`: a **confidence score** (weighted currency/direction/balance/vocab/sender signals
  minus OTP/promo/delivery/recharge/lottery penalties, threshold `0.5`) drops non-transaction
  SMS before extraction, so stray numbers in OTPs/promos are never imported. A modular
  **amount extractor** (`services/sms/amount.ts` — `extractAmount` → `{ amount, currency,
  confidence }`) then pulls only the true transaction amount: numbers must be currency-tagged
  (GH₵/GHS/GHC/₵/cedis/USD/US$/$) and are scored by their own-clause context so balances, fees,
  levies, reward points, phone numbers and reference/txn IDs are never mistaken for the amount.
  A modular **merchant extractor** (`services/sms/merchant.ts` — `extractMerchant` + reusable
  `matchKnownEntity`/`extractCounterparty`/`cleanMerchantName` over a `KNOWN_ENTITIES` dictionary)
  resolves the counterparty to a short canonical name (banks, wallets, Bolt/Uber/Melcom/KFC/Shell/
  Goil, or a person's name), returning `"Unknown"` rather than a whole sentence when none is found.
  A configurable **type detector** (`services/sms/transactionType.ts` — `detectType` /
  `classifyTransactionType` over `DEFAULT_TYPE_RULES`) reads the money-direction into a rich
  `SmsTransactionType` (Income/Expense/Transfer/Withdrawal/Deposit/Refund/Cash Out/Cash In) and
  maps it to the domain `INCOME`/`EXPENSE` (Transfer resolved by direction). Finally a configurable
  **category classifier** (`services/sms/category.ts` — `guessCategory` / `classifySmsCategory`
  over `DEFAULT_CATEGORY_RULES`) keyword-maps the transaction into a rich `SmsCategory`
  (Airtime/Internet/Salary/Cash Withdrawal/Investments/…, unmatched → Miscellaneous) and collapses
  it onto the domain `Category` enum for storage. **Duplicate detection** (`services/sms/dedupe.ts`)
  fingerprints each transaction by amount + timestamp + sender + reference + merchant (persisted in
  `importedSmsStore` alongside SMS ids), so a re-sent/duplicate SMS is skipped (and logged) rather
  than imported twice. See `docs/SMS_IMPORT.md`.
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
  (`components/dashboard/*`): (1) header (avatar + greeting + glass notification bell → opens the
  glass **Notification screen** — `NotificationScreen` + reusable `NotificationCard` list / empty
  state, `components/notifications/*`),
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
  **Surfaced in the app** as **AI prediction notifications** in the Notification Center
  (`api/prediction.api.ts` + `hooks/usePredictions.ts` → `services/predictionNotifications.ts`):
  confidence-gated month-spend projection, projected savings, and per-budget exceed forecasts.
  See `ml-service/README.md`.
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
  (+ **Admin** for admins only); auth stack; optional dev auto-login (env-gated).

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
- **Dev bypass**: set `EXPO_PUBLIC_DEV_AUTOLOGIN=true` to skip the login screen entirely
  (credentials in `src/constants/config.ts`). (The on-screen "Skip login (dev)" button was
  removed.)
- Frontend talks to the API via `EXPO_PUBLIC_API_URL` (LAN IP for physical devices).
- Windows Firewall must allow inbound `4000` + `8081` for a phone to connect (needs admin).
