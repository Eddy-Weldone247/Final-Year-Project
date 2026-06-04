# Setup Guide

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **PostgreSQL** ≥ 14 (running locally or remotely)
- **Expo Go** app on a physical device, or an Android/iOS simulator
- (Optional) **Expo CLI** is bundled — no global install required

---

## 1. Backend

```bash
cd backend
npm install
```

Create your environment file from the template and adjust values:

```bash
cp .env.example .env
```

| Variable        | Description                              | Default                          |
| --------------- | ---------------------------------------- | -------------------------------- |
| `NODE_ENV`      | Runtime environment                      | `development`                    |
| `PORT`          | API port                                 | `4000`                           |
| `DATABASE_URL`  | PostgreSQL connection string             | local postgres / `expensee` db   |
| `JWT_SECRET`    | Secret used to sign tokens               | `change-me-in-production`        |
| `JWT_EXPIRES_IN`| Token lifetime                           | `7d`                             |
| `CORS_ORIGIN`   | Allowed origin for the API               | `http://localhost:8081`          |

### Database

Make sure PostgreSQL is running and a database matching `DATABASE_URL` exists, e.g.:

```bash
createdb expensee
```

Generate the Prisma client (required before the server can start):

```bash
npm run prisma:generate
```

Once you add models to `prisma/schema.prisma`, create and apply a migration:

```bash
npm run prisma:migrate
```

### Run

```bash
npm run dev      # start with hot reload (nodemon + ts-node)
npm run build    # compile TypeScript to dist/
npm start        # run the compiled server
```

Verify it's up:

```bash
curl http://localhost:4000/api/health
# { "status": "ok", "timestamp": "..." }
```

---

## 2. App (Expo frontend)

The app **is** the project root, so run these from `Final Year Project/`:

```bash
npm install
cp .env.example .env
```

Set `EXPO_PUBLIC_API_URL` to point at your backend. When testing on a physical
device, use your machine's LAN IP (not `localhost`), e.g.
`http://192.168.1.10:4000/api`.

### Run

```bash
npx expo start   # start the Expo dev server (Expo Go); = npm start
npm run android  # open on Android
npm run ios      # open on iOS (macOS only)
npm run web      # open in the browser
```

---

## 3. Code quality

Both apps share the same tooling commands:

```bash
npm run lint        # ESLint
npm run lint:fix    # ESLint with auto-fix
npm run format      # Prettier
npm run typecheck   # TypeScript, no emit
```
