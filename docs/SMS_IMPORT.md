# SMS Import (Android)

Automatically create transactions from bank & mobile-money SMS alerts.

## Supported sources

| Source | Detected by |
| --- | --- |
| MTN Mobile Money | sender/body contains `mtn`, `momo`, `mobile money` |
| Telecel Cash | `telecel`, `vodafone`, `voda cash` |
| AirtelTigo Cash | `airteltigo`, `at money`, `tigo cash`, `airtel money` |
| Ghanaian bank alerts | account + debit/credit/balance, "debit/credit alert", or POS purchase |

**Extracted fields:** amount, type (income/expense), merchant/counterparty, date
(falls back to the SMS received time), and a guessed category.

Sample formats the parser handles:
- `Payment received for GHS 200.00 from KWAME MENSAH. Current Balance: GHS 350.50. 01-Jun-2026`
- `Payment of GHS 45.00 to MELCOM LTD successful. Fee: GHS 0.00. 01/06/2026`
- `You have sent GHS 100.00 to AMA OWUSU. Fee charged: GHS 1.00.`
- `Acct ***1234 debited GHS 250.00 on 01-Jun-2026 at SHOPRITE ACCRA. Avail Bal: GHS 1,200.00`
- `Credit Alert: account ***5678 credited with GHS 3,500.00 on 31-May-2026. Salary`

Fees and balances are skipped — only the primary transaction amount is captured.

## ⚠️ Requires a Development Build (not Expo Go)

Reading SMS needs the Android `READ_SMS` permission + a native module
(`react-native-get-sms-android`), which **Expo Go does not include**. In Expo Go
the Import screen shows a "development build required" notice and the rest of the
app works normally.

### Build & run the dev build (no Android Studio needed — uses EAS cloud)

```bash
cd expensee/frontend
npm install
npx expo install expo-dev-client   # required for a dev build (removed by default so Expo Go works)
npm i -g eas-cli                   # once
eas login                          # your Expo account
eas build --platform android --profile development   # builds an installable APK in the cloud
```

Install the resulting APK on your phone, then start the dev server in dev-client
mode and open it from the app:

```bash
npx expo start --dev-client        # (from expensee/frontend)
```

The `development` profile is already defined in `eas.json`, and the `READ_SMS`
permission is set in `app.json`.

> Note: `expo-dev-client` is intentionally **not** installed by default — that keeps
> plain `expo start` in Expo Go mode (camera-scannable `exp://` QR). Reinstall it only
> for the dev build, as shown above.

## Using it

1. Open **Transactions → Import** (top-right).
2. Tap **Scan messages** → grant the SMS permission.
3. Review the parsed candidates (last 90 days), untick any you don't want.
4. Tap **Import N selected** → transactions are created via the API.

Imported SMS ids are remembered (`importedSmsStore`), so re-scanning won't create
duplicates.

## Auto-capture (opt-in)

Toggle **Auto-capture new SMS** on the Import screen. While enabled (and on a dev
build), ExpenSee scans the inbox when the app opens, when it returns to the
foreground, and every 60s while open — automatically creating transactions for any
new financial SMS (same parser + dedupe). This is **foreground polling**, not an
instant push (see the note below). Implemented in `hooks/useSmsAutoCapture.ts`,
mounted via `components/SmsAutoCapture.tsx`, toggled through `store/settingsStore.ts`.

## Implementation

The pipeline is a chain of single-responsibility stages, each an independently
testable module, orchestrated by `parser.ts`. Import the public API from the
`src/services/sms/index.ts` barrel (`@/services/sms`).

**Pipeline order:** `validator → provider → transactionType → amount → merchant → category → date` (then `dedupe` guards imports).

| File | Role |
| --- | --- |
| `src/services/sms/index.ts` | **public API barrel** — import from `@/services/sms` instead of deep paths |
| `src/services/sms/patterns.ts` | shared cross-cutting regexes only (`CREDIT_RE`/`DEBIT_RE`, `PROVIDER_HINTS`, `BANK_RE`, `MERCHANT_STOP_RE`) |
| `src/services/sms/validator.ts` | `validateSms` / `isFinancialSms` — confidence-scored gate that rejects OTP / promo / delivery / recharge / lottery / notification SMS before parsing (reuses `amount.hasCurrencyAmount`) |
| `src/services/sms/provider.ts` | `detectProvider` — MoMo wallets + banks/card networks (Ecobank/Absa/Stanbic/GTBank/Visa/Mastercard → `Bank`), else `null` |
| `src/services/sms/transactionType.ts` | `detectType` (+ `classifyTransactionType`, `DEFAULT_TYPE_RULES`, `smsTypeToDomain`) — configurable detection into a rich `SmsTransactionType` (Income/Expense/Transfer/Withdrawal/Deposit/Refund/Cash Out/Cash In), mapped to the domain `TransactionType`; `null` drops the SMS |
| `src/services/sms/amount.ts` | `extractAmount` (+ `hasCurrencyAmount`) — modular, currency-aware amount extractor returning `{ amount, currency, confidence }`; picks the real transaction amount over balances/fees/OTP/refs |
| `src/services/sms/merchant.ts` | `extractMerchant` (+ `matchKnownEntity` / `extractCounterparty` / `cleanMerchantName`, `KNOWN_ENTITIES`) — resolves the merchant/receiver/sender/institution to a short canonical name, or `"Unknown"` |
| `src/services/sms/category.ts` | `guessCategory` (+ `classifySmsCategory`, `DEFAULT_CATEGORY_RULES`, `SMS_CATEGORY_TO_DOMAIN`) — configurable keyword classifier into a rich `SmsCategory` set, mapped to the domain `Category` enum; defaults to Miscellaneous/`OTHERS` |
| `src/services/sms/date.ts` | `extractDate` — explicit date in body (dd-MMM-yyyy / yyyy-mm-dd / dd-mm-yyyy) or received-time fallback |
| `src/services/sms/parser.ts` | `parseSms` / `parseMany` — orchestrator; runs the stages in order, short-circuiting to `null` |
| `src/services/sms/dedupe.ts` | `filterDuplicates` / `computeFingerprint` — content-fingerprint duplicate detection (amount + timestamp + sender + reference + merchant); skips + logs dupes, O(n) |
| `src/services/sms/smsReader.ts` | native reader (guarded), `READ_SMS` permission |
| `src/services/sms/toTransaction.ts` | parsed SMS → `CreateTransactionPayload` |
| `src/hooks/useSmsImport.ts` | availability → permission → read → parse → dedupe |
| `src/store/importedSmsStore.ts` | persisted imported SMS ids **and** content fingerprints |
| `src/screens/transactions/ImportSmsScreen.tsx` | review & import UI |

The parser is pure TypeScript and unit-testable independently of the device.

## Notes

- **Google Play restricts `READ_SMS`** to default SMS handlers / approved use
  cases. A finance app reading SMS will likely **not** pass Play review — this is
  intended for personal/sideloaded/dev builds or an internal-distribution APK.
- **Instant push capture** (the moment an SMS arrives, even in the background) is a
  future extension on top of the opt-in foreground auto-capture above: add the
  `RECEIVE_SMS` permission + a native SMS listener (e.g.
  `@maniac-tech/react-native-expo-read-sms`) and feed it through the same parser.
