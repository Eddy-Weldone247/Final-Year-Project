# Architecture

## Overview

ExpenSee is split into two independently deployable apps that communicate over a
JSON/HTTP API.

```
┌──────────────────────────┐         HTTPS / JSON        ┌──────────────────────────┐
│        frontend          │  ───────────────────────▶   │         backend          │
│  Expo React Native app   │                              │     Express REST API     │
│                          │  ◀───────────────────────   │                          │
└──────────────────────────┘                              └────────────┬─────────────┘
                                                                        │ Prisma
                                                                        ▼
                                                              ┌──────────────────┐
                                                              │   PostgreSQL     │
                                                              └──────────────────┘
```

## Frontend

```
frontend/
├── App.tsx                 # Root component (providers + navigation)
├── index.ts                # Expo entry point
└── src/
    ├── api/                # Axios client + interceptors
    ├── components/         # Reusable UI components
    ├── constants/          # App configuration (config.ts)
    ├── hooks/              # Custom hooks (incl. React Query hooks)
    ├── navigation/         # React Navigation stacks/tabs + types
    ├── providers/          # Context providers (React Query)
    ├── screens/            # Screen components (auth/, tabs)
    ├── store/              # Zustand stores
    ├── types/              # Shared types
    └── utils/              # Helpers
```

**Key choices**

- **Navigation** — A root native-stack switches between the `Auth` flow and the
  authenticated `App` (bottom tabs) based on `useAuthStore`.
- **State** — Zustand for client/UI state (e.g. auth session); React Query for
  server state (fetching/caching/mutations).
- **HTTP** — A single Axios instance attaches the bearer token and handles `401`
  responses centrally.
- **Path alias** — `@/*` maps to `src/*` (TypeScript + babel-plugin-module-resolver).

## Backend

```
backend/
├── prisma/
│   └── schema.prisma       # Database schema (PostgreSQL)
└── src/
    ├── index.ts            # Server bootstrap (DB connect, listen, shutdown)
    ├── app.ts              # Express app assembly (middleware + routes)
    ├── config/             # env.ts, prisma.ts
    ├── controllers/        # Request handlers
    ├── services/           # Business logic
    ├── middleware/         # errorHandler, notFound
    ├── routes/             # Route definitions (mounted under /api)
    ├── types/              # Shared types
    └── utils/              # Helpers
```

**Key choices**

- **Layering** — Routes → controllers → services → Prisma keeps HTTP concerns
  separate from business logic and data access.
- **Configuration** — `config/env.ts` validates and centralizes environment
  variables; the app fails fast if a required one is missing.
- **Errors** — `AppError` carries an HTTP status code; a single error-handling
  middleware formats all responses consistently.
- **Security** — `helmet`, `cors`, and JSON body limits are applied globally.

## Conventions

- TypeScript `strict` mode on both sides.
- ESLint + Prettier enforced via shared config.
- Environment-specific values come from `.env` (never committed).
