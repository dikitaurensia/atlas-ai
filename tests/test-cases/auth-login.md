# Test Cases — Auth: Login
Generated from: app/api/auth/login/route.js, lib/auth.js, lib/entities/UserSchema.ts, lib/data-source.ts
Coverage: 19 functional / 7 API / 7 security / 6 edge cases

---

## Source Behavior Summary

| Concern | Detail |
|---|---|
| Endpoint | `POST /api/auth/login` |
| Required fields | `email` (trimmed, non-empty via `!email?.trim()`), `password` (non-empty via `!password` falsy check — NOT trimmed) |
| Email normalization | `email.toLowerCase().trim()` applied before DB lookup |
| Password check | `bcrypt.compare(password, user.password_hash)` via `verifyPassword` in `lib/auth.js` |
| DB query | `repo.findOne({ where: { email }, select: ['id','name','bisnis_name','email','password_hash'] })` |
| Token | HS256 JWT, 7-day expiry, claims: `{ userId, email, name, bisnis_name }` |
| Cookie name | `atlas_token` |
| Cookie flags | `httpOnly: true`, `secure: true` (production only), `sameSite: 'lax'`, `path: '/'`, `maxAge: 604800` |
| Success response | HTTP 200, body: `{ ok: true, user: { id, name, bisnis_name, email } }` |
| Error: missing fields | HTTP 400 `{ "error": "Email dan password wajib diisi" }` |
| Error: wrong credentials | HTTP 401 `{ "error": "Email atau password salah" }` (same message for unknown email AND wrong password — prevents enumeration) |
| Error: server failure | HTTP 500 `{ "error": "Terjadi kesalahan server" }` |
| No email format validation | The login route does NOT validate email format (no `@` check). Only presence is checked. |
| Password guard behavior | `!password` is a falsy check. Empty string `""` → 400. Whitespace string `"   "` → TRUTHY, passes guard, goes to bcrypt.compare → 401. This differs from the email side which uses `.trim()`. |

---

## Functional Test Cases

| ID | Feature | Scenario | Preconditions | Steps | Expected Result | Priority |
|---|---|---|---|---|---|---|
| AUTH-L-001 | Login | Happy path — valid email and password | User is registered with the given credentials | POST `{ email: "user@example.com", password: "testpassword99" }` | HTTP 200; body `{ ok: true, user: { id: <uuid>, name: <name>, bisnis_name: <bisnis_name>, email: "user@example.com" } }`; `Set-Cookie: atlas_token=<jwt>; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800` | Critical |
| AUTH-L-002 | Login — JWT structure | JWT header is `{ alg: "HS256", typ: "JWT" }` | Successful login | Decode JWT header from `atlas_token` cookie | `alg` is `"HS256"`, `typ` is `"JWT"` | High |
| AUTH-L-003 | Login — JWT claims | JWT payload contains all expected claims | Successful login | Decode JWT payload | Payload contains `userId` (UUID), `email` (lowercase), `name`, `bisnis_name`; `exp - iat` equals 604800 s (±60 s) | Critical |
| AUTH-L-004 | Login — JWT validity | JWT signature verifies with `JWT_SECRET` | Successful login | Call `jose.jwtVerify(token, secret())` | Resolves without throwing | Critical |
| AUTH-L-005 | Login | Email is normalized before DB lookup — uppercase input | User registered as `user@example.com` | POST `{ email: "USER@EXAMPLE.COM", password: "testpassword99" }` | HTTP 200; same user returned | High |
| AUTH-L-006 | Login | Email is normalized — leading/trailing whitespace | User registered | POST `{ email: "  user@example.com  ", password: "testpassword99" }` | HTTP 200; same user returned | High |
| AUTH-L-007 | Login | Wrong password | User is registered | POST `{ email: "user@example.com", password: "wrongpassword" }` | HTTP 401 `{ "error": "Email atau password salah" }`; no `Set-Cookie` header present | Critical |
| AUTH-L-008 | Login | Unknown email | No user with this email exists | POST `{ email: "ghost@example.com", password: "testpassword99" }` | HTTP 401 `{ "error": "Email atau password salah" }` — identical message to wrong-password (prevents user enumeration) | Critical |
| AUTH-L-009 | Login | Whitespace-only password | User is registered | POST `{ email: "user@example.com", password: "        " }` (8 spaces) | HTTP 401 — whitespace is truthy so it passes the `!password` guard, then bcrypt.compare fails to match → `{ "error": "Email atau password salah" }` | High |
| AUTH-L-010 | Login | Password with one extra character (near-miss) | User is registered | POST with `password` = correct password + `"X"` | HTTP 401 `{ "error": "Email atau password salah" }` | Medium |
| AUTH-L-011 | Login | Missing email field | — | POST `{ password: "testpassword99" }` | HTTP 400 `{ "error": "Email dan password wajib diisi" }` | Critical |
| AUTH-L-012 | Login | Missing password field | — | POST `{ email: "user@example.com" }` | HTTP 400 `{ "error": "Email dan password wajib diisi" }` | Critical |
| AUTH-L-013 | Login | Both fields absent — empty body `{}` | — | POST `{}` | HTTP 400 `{ "error": "Email dan password wajib diisi" }` | Critical |
| AUTH-L-014 | Login | Empty string email `""` | — | POST `{ email: "", password: "testpassword99" }` | HTTP 400 — `""?.trim()` is `""` (falsy) → `{ "error": "Email dan password wajib diisi" }` | Critical |
| AUTH-L-015 | Login | Whitespace-only email `"   "` | — | POST `{ email: "   ", password: "testpassword99" }` | HTTP 400 — `"   ".trim()` is `""` (falsy) → `{ "error": "Email dan password wajib diisi" }` | Critical |
| AUTH-L-016 | Login | Empty string password `""` | — | POST `{ email: "user@example.com", password: "" }` | HTTP 400 — `!""` is `true` → `{ "error": "Email dan password wajib diisi" }` | Critical |
| AUTH-L-017 | Login | null values for both fields | — | POST `{ email: null, password: null }` | HTTP 400 — `null?.trim()` is `undefined` (falsy) → `{ "error": "Email dan password wajib diisi" }` | High |
| AUTH-L-018 | Response shape | password_hash is NOT returned in success response | Successful login | Inspect full response body | Body contains exactly `{ ok, user: { id, name, bisnis_name, email } }`; keys `password`, `password_hash` are absent | Critical |
| AUTH-L-019 | Login | User registered without bisnis_name — login returns null for bisnis_name | User has `bisnis_name = NULL` in DB | Login with that user's credentials | `response.body.user.bisnis_name` is `null` | Medium |

---

## API Test Cases

| ID | Endpoint | Method | Scenario | Expected Result |
|---|---|---|---|---|
| API-L-001 | `/api/auth/login` | GET | Wrong HTTP method | HTTP 405 Method Not Allowed (Next.js default; only `POST` is exported) |
| API-L-002 | `/api/auth/login` | PUT | Wrong HTTP method | HTTP 405 Method Not Allowed |
| API-L-003 | `/api/auth/login` | POST | Valid credentials | HTTP 200; body `{ ok: true, user: { id, name, bisnis_name, email } }`; `Set-Cookie` with `atlas_token` |
| API-L-004 | `/api/auth/login` | POST | Body is not valid JSON (plain text) | `req.json()` throws; caught by `catch`; HTTP 500 `{ "error": "Terjadi kesalahan server" }` |
| API-L-005 | `/api/auth/login` | POST | Body is a JSON array `["email","pass"]` | Destructuring array yields `email: undefined`, `password: undefined`; HTTP 400 `{ "error": "Email dan password wajib diisi" }` |
| API-L-006 | `/api/auth/login` | POST | DB connection fails | `getDataSource()` rejects; caught; HTTP 500 `{ "error": "Terjadi kesalahan server" }` |
| API-L-007 | `/api/auth/login` | POST | `JWT_SECRET` env var is not set | `secret()` encodes `undefined`; `signToken` may throw; caught; HTTP 500 `{ "error": "Terjadi kesalahan server" }` |

---

## Security Test Cases

| ID | Vulnerability | Test Method | Expected Result |
|---|---|---|---|
| SEC-L-001 | SQL injection via email | POST `{ email: "' OR '1'='1", password: "x" }` | TypeORM parameterized query prevents injection; no row matches; HTTP 401 `{ "error": "Email atau password salah" }`; NOT 200 and NOT 500 |
| SEC-L-002 | SQL injection via email — destructive | POST `{ email: "'; DROP TABLE users; --@example.com", password: "x" }` | Returns 401; `users` table still exists; no DB error |
| SEC-L-003 | SQL injection via password | POST `{ email: "user@example.com", password: "'; DROP TABLE users; --" }` | Password is never used in a DB query; passed only to `bcrypt.compare`; returns HTTP 401; no DB mutation |
| SEC-L-004 | JWT algorithm confusion (alg:none) | Craft JWT with header `{ alg: "none" }` and any payload; send as `atlas_token` to a protected endpoint (e.g. `GET /api/analysis/history`) | `jose.jwtVerify` rejects `alg: none`; endpoint returns HTTP 401 |
| SEC-L-005 | JWT signature tampered | Take a real `atlas_token`, replace the payload with a different `userId`, keep original signature; send to protected endpoint | Signature mismatch; `jwtVerify` throws; endpoint returns HTTP 401 |
| SEC-L-006 | Expired JWT | Sign a valid JWT with `exp` set 1 second in the past using `JWT_SECRET`; send as `atlas_token` | `jwtVerify` throws `JWTExpired`; protected endpoint returns HTTP 401 |
| SEC-L-007 | Missing cookie | Call `GET /api/analysis/history` with no `atlas_token` cookie | Endpoint returns HTTP 401; no data is returned |

---

## Edge Cases

| ID | Scenario | Input | Expected Behavior |
|---|---|---|---|
| EDGE-L-001 | Very long email (500 chars, valid format) | `email: "a".repeat(490) + "@example.com"` | No length cap in route; goes to DB; no row found; HTTP 401. Must NOT be 500. |
| EDGE-L-002 | Very long password (1000 chars) | `password: "a".repeat(1000)` | bcrypt silently truncates at 72 bytes; compare fails against registered hash; HTTP 401 |
| EDGE-L-003 | password field is a number — non-zero | `password: 12345678` (JSON number) | Non-zero number is truthy; passes guard; `bcrypt.compare(12345678, hash)` — bcrypt may coerce to string `"12345678"` which does not match → 401; OR may throw → 500. Document actual behavior. |
| EDGE-L-004 | password field is the number 0 | `password: 0` (JSON number) | `!0` is `true`; triggers guard; HTTP 400 `{ "error": "Email dan password wajib diisi" }` |
| EDGE-L-005 | Unicode character in email | `email: "useré@example.com"` | Passed to DB lookup as literal string; no crash expected; no row found; HTTP 401. Must NOT be 500. |
| EDGE-L-006 | Request body is a JSON array | `["user@example.com", "password"]` | ES destructuring of array yields `email: undefined`, `password: undefined`; HTTP 400 `{ "error": "Email dan password wajib diisi" }` |

---

## Test Data Requirements

### Registered user for login tests (must be seeded before the suite runs)

```json
{
  "name": "Login Test User",
  "bisnis_name": "Warung Test",
  "email": "login.test.<run_id>@example.com",
  "password": "testpassword99"
}
```

Use a `RUN_ID` suffix (e.g. `Date.now()`) to avoid collisions in a shared DB.

### Wrong credential payloads (all must return HTTP 401)

```json
{ "email": "login.test.<run_id>@example.com", "password": "definitelywrong" }
{ "email": "nobody@example.com", "password": "testpassword99" }
{ "email": "login.test.<run_id>@example.com", "password": "testpassword9" }
{ "email": "login.test.<run_id>@example.com", "password": "        " }
```

### Missing/empty field payloads (all must return HTTP 400)

```json
{}
{ "password": "testpassword99" }
{ "email": "login.test.<run_id>@example.com" }
{ "email": "", "password": "testpassword99" }
{ "email": "   ", "password": "testpassword99" }
{ "email": "login.test.<run_id>@example.com", "password": "" }
{ "email": null, "password": null }
```

### Email normalization payloads (all must return HTTP 200 for the registered user)

```json
{ "email": "LOGIN.TEST.<run_id>@EXAMPLE.COM", "password": "testpassword99" }
{ "email": "  login.test.<run_id>@example.com  ", "password": "testpassword99" }
```

### Security injection payloads

```json
{ "email": "' OR '1'='1", "password": "x" }
{ "email": "'; DROP TABLE users; --@example.com", "password": "x" }
{ "email": "login.test.<run_id>@example.com", "password": "'; DROP TABLE users; --" }
```

### JWT verification checklist

After a successful login, verify the `atlas_token` cookie:
- Decode header: must be `{ "alg": "HS256", "typ": "JWT" }`
- Decode payload: must contain `userId` (UUID), `email` (lowercase), `name`, `bisnis_name`
- `exp - iat` must equal `604800` seconds (7 days ± 60 s tolerance)
- `jose.jwtVerify(token, secret)` must resolve; any modification to payload or signature must cause it to throw

---

## Known Gaps / Findings to Investigate

| # | Finding | Severity | Location |
|---|---|---|---|
| G-001 | No email format validation in login route — any non-empty, non-whitespace string is accepted as email and goes to DB | Low | `route.js` line 10 (contrast with `register/route.js` line 16 which checks `includes('@')`) |
| G-002 | Inconsistent password guard — `!password` (no `.trim()`) means a password of pure whitespace (e.g. 8 spaces) passes the presence check and reaches bcrypt; register uses the same approach but callers may not expect it | Low | `route.js` line 10; `lib/auth.js` line 8 |
| G-003 | No rate limiting on the login endpoint — brute-force password attacks are possible; current implementation provides no 429 response | High | `route.js` (no middleware) |
| G-004 | Identical 401 message for unknown email and wrong password is intentional (prevents user enumeration) — confirm this is documented as a design decision, not an oversight | Informational | `route.js` lines 23, 28 |
| G-005 | bcrypt silently truncates passwords exceeding 72 bytes — a 1000-char password and a 72-char prefix of it produce identical hashes; document this as a known bcrypt behavior | Medium | `lib/auth.js` line 8 |
| G-006 | No CSRF protection on the login endpoint — relies on `sameSite: 'lax'` cookie only; cross-site POST from a top-level navigation could succeed in some browser configurations | Low | `lib/auth.js` `cookieOpts()` |
