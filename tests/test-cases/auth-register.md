# Test Cases — Auth: Register
Generated: app/api/auth/register/route.js, lib/auth.js, lib/entities/UserSchema.ts, lib/data-source.ts
Coverage: 29 functional/API / 10 security / 12 edge cases

---

## Source Behavior Facts (extracted before writing tests)

### Validation rules (every `if` that returns 400)

| Line | Condition | Error message | Status |
|------|-----------|---------------|--------|
| 10 | `!name?.trim() \|\| !email?.trim() \|\| !password` | `Nama, email, dan password wajib diisi` | 400 |
| 13 | `password.length < 8` | `Password minimal 8 karakter` | 400 |
| 16 | `!email.includes('@')` | `Format email tidak valid` | 400 |

Note: the password guard on line 10 is `!password` (falsy), NOT `!password.trim()`.
A whitespace-only password of length >= 8 passes both guards. See POTENTIAL BUG below.

### Business logic branches

| Branch | Behavior |
|--------|----------|
| Duplicate email | `repo.findOne({ where: { email: email.toLowerCase().trim() } })`; if found → 409 |
| Email normalization | `email.toLowerCase().trim()` applied before duplicate check AND before storage |
| name normalization | `name.trim()` stored; leading/trailing spaces removed |
| bisnis_name | `bisnis_name?.trim() \|\| null`; absent, `""`, or whitespace-only all become `null` |
| Password hashing | `bcryptjs.hash(plain, 10)` — bcrypt, cost 10 |
| Catch-all | Any thrown error → 500 `Terjadi kesalahan server` |

### Error messages (exact strings)

| Scenario | Exact string | Status |
|----------|-------------|--------|
| Missing/empty required field | `Nama, email, dan password wajib diisi` | 400 |
| Password too short | `Password minimal 8 karakter` | 400 |
| Bad email format | `Format email tidak valid` | 400 |
| Duplicate email | `Email sudah terdaftar` | 409 |
| Server error | `Terjadi kesalahan server` | 500 |

### Boundary values

| Field | Boundary | Behavior |
|-------|----------|----------|
| password | length = 7 | Rejected: 400 |
| password | length = 8 | Accepted: 201 |
| password | length > 72 bytes | bcrypt truncates silently; still 201 |
| email | contains `@` | Passes format check |
| email | no `@` | Rejected: 400 |

### Auth guards

None on the register endpoint itself — it is public (no JWT check before processing).
The issued JWT is HS256, 7-day expiry, claims: `{ userId, email, name, bisnis_name }`.

### External API calls

None. Registration only touches the local/Neon PostgreSQL DB.

### Database writes

- Table: `users`
- Unique constraint: `email` column (enforces deduplication at DB layer even if race condition bypasses the application-level `findOne` check)
- `id`: auto-generated UUID (`generated: 'uuid'`)
- `created_at`: auto-set (`createDate: true`)

### Potential bugs found while reading code

| ID | Description | Severity | Location |
|----|-------------|----------|----------|
| BUG-1 | Password guard is `!password` (falsy), not `!password.trim()`. A whitespace-only password of 8+ spaces passes all validation and gets hashed. | Medium | `route.js` line 10 |
| BUG-2 | Email format check is only `!email.includes('@')`. Strings like `"@"`, `"user@"`, `"a@@b.com"` all pass format validation despite being invalid email addresses. | Medium | `route.js` line 16 |
| BUG-3 | Race condition between `findOne` (duplicate check) and `repo.save`: concurrent requests for the same email can both pass the `findOne` check and then collide at the DB unique constraint, causing a 500 instead of a graceful 409. | Medium | `route.js` lines 23–35 |

---

## Functional Test Cases

| ID | Feature | Scenario | Preconditions | Steps | Expected Result | Priority |
|----|---------|----------|---------------|-------|----------------|----------|
| AUTH-R-001 | Registration | Happy path — all valid fields including bisnis_name | Email not already registered | POST `{ name, bisnis_name, email, password }` all valid | HTTP 201; body `{ ok: true, user: { id: <uuid>, name, bisnis_name, email } }`; `Set-Cookie: atlas_token=<jwt>`; HttpOnly, SameSite=Lax, Path=/, Max-Age=604800 | Critical |
| AUTH-R-002 | JWT on registration | JWT header algorithm is HS256 | Successful registration | Decode JWT header from Set-Cookie | `{ alg: "HS256", typ: "JWT" }` | Critical |
| AUTH-R-003 | JWT on registration | JWT payload claims | Successful registration | Decode JWT payload from Set-Cookie | Contains `userId` (UUID), `email` (lowercase), `name` (trimmed), `bisnis_name`; `exp - iat === 604800` | Critical |
| AUTH-R-004 | JWT on registration | JWT signature verifies with JWT_SECRET | Successful registration | Run `jwtVerify(token, secret)` | Resolves without error | Critical |
| AUTH-R-005 | Duplicate email | Exact duplicate returns 409 | User already registered with that email | POST same email again | HTTP 409; `{ "error": "Email sudah terdaftar" }`; no Set-Cookie header | Critical |
| AUTH-R-006 | Duplicate email | Uppercase variant of registered email returns 409 | Email registered as lowercase | POST same email in uppercase | HTTP 409; `{ "error": "Email sudah terdaftar" }` (lookup normalizes to lowercase) | High |
| AUTH-R-007 | Duplicate email | Spaced variant of registered email returns 409 | Email registered | POST same email with surrounding spaces | HTTP 409; `{ "error": "Email sudah terdaftar" }` | High |
| AUTH-R-008 | Missing field | name absent | — | POST without `name` field | HTTP 400; `{ "error": "Nama, email, dan password wajib diisi" }` | Critical |
| AUTH-R-009 | Missing field | email absent | — | POST without `email` field | HTTP 400; `{ "error": "Nama, email, dan password wajib diisi" }` | Critical |
| AUTH-R-010 | Missing field | password absent | — | POST without `password` field | HTTP 400; `{ "error": "Nama, email, dan password wajib diisi" }` | Critical |
| AUTH-R-011 | Missing field | all fields absent (empty `{}`) | — | POST `{}` | HTTP 400; `{ "error": "Nama, email, dan password wajib diisi" }` | Critical |
| AUTH-R-012 | Empty field | name is `""` | — | POST with `name: ""` | HTTP 400; `{ "error": "Nama, email, dan password wajib diisi" }` (`""?.trim()` is falsy) | Critical |
| AUTH-R-013 | Whitespace field | name is `"   "` | — | POST with `name: "   "` | HTTP 400; `{ "error": "Nama, email, dan password wajib diisi" }` (`"   ".trim()` is `""`, falsy) | Critical |
| AUTH-R-014 | Empty field | email is `""` | — | POST with `email: ""` | HTTP 400; `{ "error": "Nama, email, dan password wajib diisi" }` | Critical |
| AUTH-R-015 | Whitespace field | email is `"   "` | — | POST with `email: "   "` | HTTP 400; `{ "error": "Nama, email, dan password wajib diisi" }` | Critical |
| AUTH-R-016 | Empty field | password is `""` | — | POST with `password: ""` | HTTP 400; `{ "error": "Nama, email, dan password wajib diisi" }` (falsy, fires before length check) | Critical |
| AUTH-R-017 | Password length | password is 7 characters (min - 1) | — | POST with `password: "1234567"` | HTTP 400; `{ "error": "Password minimal 8 karakter" }` | Critical |
| AUTH-R-018 | Password length | password is 8 characters (exact min) | Email not registered | POST with `password: "12345678"` | HTTP 201 (8 is not `< 8`) | Critical |
| AUTH-R-019 | Password length | password is 1 character | — | POST with `password: "x"` | HTTP 400; `{ "error": "Password minimal 8 karakter" }` | High |
| AUTH-R-020 | Email format | no `@` sign | — | POST with `email: "notanemail.com"` | HTTP 400; `{ "error": "Format email tidak valid" }` | Critical |
| AUTH-R-021 | Email format | bare string (no dots) | — | POST with `email: "juststring"` | HTTP 400; `{ "error": "Format email tidak valid" }` | High |
| AUTH-R-022 | Optional field | bisnis_name omitted — returns 201 | Email not registered | POST without `bisnis_name` | HTTP 201; `user.bisnis_name === null`; JWT `bisnis_name` claim is `null` | High |
| AUTH-R-023 | Optional field | bisnis_name is `""` — stored as null | Email not registered | POST with `bisnis_name: ""` | HTTP 201; `user.bisnis_name === null` (`""?.trim() \|\| null` → null) | High |
| AUTH-R-024 | Optional field | bisnis_name is whitespace-only — stored as null | Email not registered | POST with `bisnis_name: "   "` | HTTP 201; `user.bisnis_name === null` | Medium |
| AUTH-R-025 | Email normalization | Mixed-case email stored as lowercase | Email not registered | POST with `email: "Mixed.Case@EXAMPLE.COM"` | HTTP 201; `user.email === "mixed.case@example.com"`; JWT email claim also lowercase | High |
| AUTH-R-026 | Password in response | Password never returned | Successful registration | Inspect all 201 response bodies | No `password`, `password_hash`, or plaintext value present in body | Critical |
| AUTH-R-027 | HTTP method | GET returns 405 | — | GET /api/auth/register | HTTP 405 Method Not Allowed | Medium |
| AUTH-R-028 | HTTP method | PUT returns 405 | — | PUT /api/auth/register | HTTP 405 Method Not Allowed | Medium |
| AUTH-R-029 | Non-JSON body | Plain text body causes 500 | — | POST with `Content-Type: text/plain` and body `"this is not json"` | HTTP 500; `{ "error": "Terjadi kesalahan server" }` (`req.json()` throws, caught) | Medium |

---

## API Test Cases

| ID | Endpoint | Method | Scenario | Expected Result |
|----|----------|--------|----------|----------------|
| API-R-001 | `/api/auth/register` | POST | Valid full payload | HTTP 201; `{ ok: true, user: { id, name, bisnis_name, email } }`; `Set-Cookie: atlas_token=<jwt>` |
| API-R-002 | `/api/auth/register` | GET | Wrong method | HTTP 405 |
| API-R-003 | `/api/auth/register` | PUT | Wrong method | HTTP 405 |
| API-R-004 | `/api/auth/register` | POST | Non-JSON body | HTTP 500; `{ "error": "Terjadi kesalahan server" }` |
| API-R-005 | `/api/auth/register` | POST | Body is `null` (valid JSON) | HTTP 500; `{ "error": "Terjadi kesalahan server" }` (destructuring `null` throws `TypeError`) |
| API-R-006 | `/api/auth/register` | POST | Body is a JSON array | HTTP 400; `{ "error": "Nama, email, dan password wajib diisi" }` (all fields destructure as `undefined`) |
| API-R-007 | `/api/auth/register` | POST | `name` is a number (`123`) | HTTP 500; `{ "error": "Terjadi kesalahan server" }` (`123?.trim()` is `undefined` — wait, actually `(123)?.trim()` throws `TypeError` since numbers don't have `.trim()`; caught by catch) |
| API-R-008 | `/api/auth/register` | POST | `password` is a number (`12345678`) | `password.length` on a Number is `undefined`; `undefined < 8` is `false` so length check passes; `bcryptjs.hash(12345678, 10)` — bcrypt coerces to string; behavior is 201 or 500. Document actual result. |
| API-R-009 | `/api/auth/register` | POST | DB connection fails | HTTP 500; `{ "error": "Terjadi kesalahan server" }` |
| API-R-010 | `/api/auth/register` | POST | Concurrent duplicate registrations (race) | One 201, one 409 or 500; no duplicate row must exist in DB |
| API-R-011 | `/api/auth/register` | POST | `JWT_SECRET` not set | HTTP 500; `{ "error": "Terjadi kesalahan server" }` (`sign()` with empty/undefined key throws) |

---

## Security Test Cases

| ID | Vulnerability | Test Method | Expected Result |
|----|--------------|-------------|----------------|
| SEC-R-001 | SQL injection via email (no `@`) | POST `{ email: "'; DROP TABLE users; --", ... }` | HTTP 400 `{ "error": "Format email tidak valid" }` — `@` check fires first; no DB query executes; status must NOT be 500 |
| SEC-R-002 | SQL injection via email (with `@`) | POST `{ email: "' OR '1'='1'@example.com", ... }` | HTTP 201 or 409 — TypeORM `findOne` uses parameterized query; injection string is literal; no data leak; status must NOT be 500 |
| SEC-R-003 | SQL injection via name | POST `{ name: "'; DROP TABLE users;--", email: "sqli@x.com", password: "secret99" }` | HTTP 201; `user.name === "'; DROP TABLE users;--"` (stored verbatim, parameterized INSERT) |
| SEC-R-004 | XSS payload in name | POST `{ name: "<script>alert(1)</script>", ... }` | HTTP 201; `user.name` is the literal string (API does no sanitization — React rendering layer is responsible for escaping) |
| SEC-R-005 | Password not returned | Inspect all register responses | No `password`, `password_hash`, or plaintext appears in any response body |
| SEC-R-006 | JWT algorithm confusion — alg:none | Craft `{ alg: "none" }` JWT; send as `atlas_token` to `/api/analysis/history` | HTTP 401 — `jose`'s `jwtVerify` rejects `alg: none` tokens |
| SEC-R-007 | JWT signature tampered | Modify payload of real token, keep original signature; send to protected endpoint | HTTP 401 — signature verification fails |
| SEC-R-008 | Expired JWT | Sign a valid-looking JWT with `exp` in the past; send to protected endpoint | HTTP 401 — `jwtVerify` throws `JWTExpired` |
| SEC-R-009 | Missing cookie | Request to protected endpoint with no `atlas_token` | HTTP 401 |
| SEC-R-010 | Mass assignment (extra fields) | POST with extra `role: "admin"` and `id: "00000000-..."` | HTTP 201; `user.id` is DB-generated (not injected); `role` absent from response |

---

## Edge Cases

| ID | Scenario | Input | Expected Behavior |
|----|---------|-------|------------------|
| EDGE-R-001 | Very long email — 500 chars with valid `@` | `"a".repeat(488) + "@example.com"` | HTTP 201 — no length cap in route or entity; PostgreSQL `text` is unlimited |
| EDGE-R-002 | Very long password — 1000 chars | `"a".repeat(1000)` | HTTP 201 — bcrypt accepts but silently truncates at 72 bytes; document truncation behavior |
| EDGE-R-003 | Very long name — 500 chars | `"N".repeat(500)` | HTTP 201; name stored and returned in full (PostgreSQL `text` is unlimited) |
| EDGE-R-004 | Unicode in name | `"안녕 田中 Ñoño"` | HTTP 201; name roundtrips correctly through PostgreSQL UTF-8 |
| EDGE-R-005 | Unicode in email local part | `"usér.${RUN_ID}@example.com"` | Must not crash (no 500); 201 or DB-layer rejection documented |
| EDGE-R-006 | POTENTIAL BUG — 8 whitespace-char password | `"        "` (8 spaces) | Currently HTTP 201 — `!password` is false (non-empty string); `"        ".length < 8` is false; whitespace password is hashed and stored. Should be 400. |
| EDGE-R-007 | Body is a JSON array | `["Budi", "budi@x.com", "secret"]` | HTTP 400; `{ "error": "Nama, email, dan password wajib diisi" }` (all fields destructure as `undefined`) |
| EDGE-R-008 | Body is JSON `null` | `null` | HTTP 500; `{ "error": "Terjadi kesalahan server" }` (destructuring `null` throws `TypeError`) |
| EDGE-R-009 | Response shape is exact | Valid registration payload | Body equals exactly `{ ok: true, user: { id, name, bisnis_name, email } }` — no extra keys |
| EDGE-R-010 | Error response shape is exact | Any 400/409 payload | Body equals exactly `{ error: "<message>" }` — no `ok` key present |
| EDGE-R-011 | name and bisnis_name trimmed | `name: "  Trimmed Name  "`, `bisnis_name: "  Bisnis  "` | HTTP 201; `user.name === "Trimmed Name"`; `user.bisnis_name === "Bisnis"` |
| EDGE-R-012 | Email with multiple `@` signs | `"a@@b.com"` | POTENTIAL BUG — `includes('@')` is true; format check passes; stored literally. RFC 5321 forbids this. |

---

## Test Data Requirements

### Minimal valid payloads

```json
// Full registration
{ "name": "Budi Santoso", "bisnis_name": "Warung Budi", "email": "budi.${RUN_ID}@example.com", "password": "testpassword99" }

// Without bisnis_name
{ "name": "Ani Rahayu", "email": "ani.${RUN_ID}@example.com", "password": "testpassword99" }
```

### Password boundary payloads

```json
{ "password": "1234567" }  // length 7 — must fail (HTTP 400)
{ "password": "12345678" } // length 8 — must pass (HTTP 201)
{ "password": "        " } // 8 spaces — currently passes (BUG)
```

### Email normalization / format cases

```json
{ "email": "MIXED.Case@EXAMPLE.COM" }    // Stored as "mixed.case@example.com"
{ "email": "  budi@example.com  " }      // Trimmed before storage and lookup
{ "email": "notanemail.com" }            // No @ — HTTP 400
{ "email": "@" }                         // Has @ — passes check (BUG)
{ "email": "budi@" }                     // Has @ — passes check (BUG)
{ "email": "a@@b.com" }                  // Has @ — passes check (BUG)
```

### Missing / empty field payloads (all must return HTTP 400)

```json
{}
{ "email": "x@x.com", "password": "secret99" }
{ "name": "X", "password": "secret99" }
{ "name": "X", "email": "x@x.com" }
{ "name": "", "email": "x@x.com", "password": "secret99" }
{ "name": "   ", "email": "x@x.com", "password": "secret99" }
{ "name": "X", "email": "", "password": "secret99" }
{ "name": "X", "email": "x@x.com", "password": "" }
```

### Security payloads

```json
{ "name": "'; DROP TABLE users;--", "email": "sqli.${RUN_ID}@test.com", "password": "secret99" }
{ "name": "<script>alert(1)</script>", "email": "xss.${RUN_ID}@test.com", "password": "secret99" }
{ "name": "X", "email": "' OR '1'='1'@x.com", "password": "secret99" }
{ "name": "X", "email": "x@x.com", "password": "secret99", "role": "admin", "id": "00000000-dead-beef-0000-000000000000" }
```

### JWT verification after registration

1. Extract `atlas_token` from `Set-Cookie` response header
2. Decode header: must be `{ "alg": "HS256", "typ": "JWT" }`
3. Decode payload: must contain `userId` (UUID), `email` (lowercase/trimmed), `name` (trimmed), `bisnis_name` (string or null)
4. `exp - iat` must equal `604800` seconds (7 days), tolerance ±60 s
5. `jwtVerify(token, new TextEncoder().encode(JWT_SECRET))` must resolve without error

---

## Known Gaps / Findings

| ID | Finding | Severity | Location |
|----|---------|----------|----------|
| G-001 | Password guard is `!password` (falsy), not `!password?.trim()`. Whitespace-only passwords of length >= 8 pass all validation and are bcrypt-hashed. | Medium | `route.js` line 10 |
| G-002 | Email format check is only `!email.includes('@')`. Strings `"@"`, `"user@"`, `"a@@b.com"` all pass despite being invalid email addresses. | Medium | `route.js` line 16 |
| G-003 | Race condition: concurrent duplicate registrations both pass `findOne`, then the second `repo.save` hits the DB unique constraint and returns HTTP 500 instead of a clean 409. | Medium | `route.js` lines 23–35 |
| G-004 | No rate limiting on the register endpoint — account enumeration and abuse via rapid registrations are possible. | High | `route.js` (no middleware) |
| G-005 | bcrypt silently truncates passwords longer than 72 bytes — two passwords sharing the same first 72 bytes will produce an identical hash. | Medium | `lib/auth.js` line 8 |
| G-006 | No CSRF protection — relies solely on `SameSite: 'lax'` cookie behavior, which does not protect cross-site top-level navigations with POST. | Low | `lib/auth.js` `cookieOpts()` |
