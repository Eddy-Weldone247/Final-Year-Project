# ExpenSee

A cross-platform income/expense tracker. **This folder is the Expo (React Native)
app** — run `npx expo start` right here. The REST API lives in [`backend/`](backend).

```
Final Year Project/        ← the Expo app (App.tsx, app.json, src/, …)
├── src/                   app source: screens, components, hooks, services, store
├── backend/               Express + Prisma API (own package.json / node_modules)
└── docs/                  setup, architecture, API reference, SMS import
```

## Run it

```bash
npm run install:all     # install app + backend deps (first time)

npm run db              # start a zero-install embedded Postgres on :5432
npm run backend         # start the API (http://localhost:4000) — separate terminal
npx expo start          # start the Expo dev server, then scan the QR with Expo Go
```

Other scripts: `npm run web | android | ios | doctor | start:dev-client`,
`npm run prisma:migrate | prisma:studio`, `npm run typecheck`, `npm run lint`.

> Run the backend (`npm run backend`) and the app (`npx expo start`) in **two
> terminals**. On a physical device, set `EXPO_PUBLIC_API_URL` in `.env` to your
> PC's LAN IP. See [`docs/SETUP.md`](docs/SETUP.md).
