# API Reference

Base URL: `http://localhost:4000/api`

All responses are JSON. Errors use the shape:

```json
{
  "status": "error",
  "message": "Human-readable message"
}
```

## Conventions

- Authenticated endpoints expect a bearer token:
  `Authorization: Bearer <token>`
- Timestamps are ISO 8601 strings (UTC).
- Validation failures return `400` with a combined `message`.

---

## System

### `GET /health`

Liveness probe. No authentication required.

**Response `200`**

```json
{ "status": "ok", "timestamp": "2026-01-01T00:00:00.000Z" }
```

---

## Authentication

### `POST /auth/register`

Creates an account and emails a verification link.

**Body**

```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "supersecret" }
```

**Response `201`**

```json
{
  "message": "Registration successful. Check your email to verify your account.",
  "user": {
    "id": "clx...",
    "email": "jane@example.com",
    "name": "Jane Doe",
    "isEmailVerified": false,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

Errors: `409` if the email is already registered.

---

### `POST /auth/login`

Authenticates a user. **Requires a verified email.**

**Body**

```json
{ "email": "jane@example.com", "password": "supersecret" }
```

**Response `200`**

```json
{
  "token": "<jwt>",
  "user": { "id": "clx...", "email": "jane@example.com", "name": "Jane Doe", "isEmailVerified": true, "createdAt": "..." }
}
```

Errors: `401` invalid credentials · `403` email not verified.

---

### `POST /auth/verify-email`

Verifies an email from the app (token in body).

**Body**

```json
{ "token": "<raw token from the email>" }
```

**Response `200`** — `{ "message": "Email verified successfully. You can now sign in." }`

Errors: `400` invalid or expired token.

### `GET /auth/verify-email?token=<token>`

Browser-friendly variant used by the link in the verification email. Returns a
small HTML confirmation page.

---

### `POST /auth/forgot-password`

Sends a password-reset code by email. Always returns `200` (it never reveals
whether an account exists).

**Body** — `{ "email": "jane@example.com" }`

**Response `200`** — `{ "message": "If an account exists for that email, a reset code has been sent." }`

---

### `POST /auth/reset-password`

Sets a new password using the emailed code.

**Body**

```json
{ "token": "<raw token from the email>", "password": "mynewsecret" }
```

**Response `200`** — `{ "message": "Your password has been reset. You can now sign in." }`

Errors: `400` invalid or expired token.

---

### `GET /auth/me` 🔒

Returns the current authenticated user. Requires `Authorization: Bearer <jwt>`.

**Response `200`**

```json
{ "user": { "id": "clx...", "email": "jane@example.com", "name": "Jane Doe", "isEmailVerified": true, "createdAt": "..." } }
```

Errors: `401` missing/invalid/expired token.

---

## Email in development

When `SMTP_HOST` is empty, emails are **logged to the backend console** instead
of being sent. Copy the verification link / reset code from there to complete
flows locally without configuring SMTP.

---

> Feature endpoints (expenses, categories, …) will be documented here as they
> are implemented.
