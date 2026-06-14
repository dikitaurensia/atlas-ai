# AtlasAI — Test Plan

## 1. Objectives

- Verify that every API endpoint enforces authentication correctly and returns the documented HTTP status codes and response shapes.
- Confirm that the scoring engine in `lib/analysis.js` produces numerically accurate dimension scores, grade labels, profit ranges, and competition adjustments across all three business scales.
- Detect security vulnerabilities — SQL injection, JWT algorithm confusion, auth bypass, IDOR, and resource amplification — before each release.
- Establish a living coverage map that makes gaps explicit so every sprint can prioritise the highest-risk untested surface.
- Provide a single executable test suite (Jest + node-fetch) that can run in CI against a real database without mocks.

---

## 2. Scope

### In Scope

- `POST /api/auth/register` — registration, JWT issuance, duplicate detection, validation
- `POST /api/auth/login` — authentication, JWT issuance, email normalisation, credential checks
- `POST /api/analyze` — full analysis pipeline, scoring formulas, scale multipliers, Jakarta gate, Overpass degradation
- `GET  /api/analysis/history` — authenticated history retrieval, per-user isolation, pagination cap
- `POST /api/analysis/save` — authenticated result persistence, field validation, response shape
- `DELETE /api/analysis/save` — authenticated deletion, per-user scope enforcement (IDOR prevention)
- `POST /api/auth/logout` — cookie clearance
- `GET  /api/auth/me` — token-to-profile resolution
- `lib/analysis.js` scoring engine — all five dimension formulas, grade thresholds, IQR profit logic, competition score clamping
- JWT security properties — HS256 algorithm, 7-day expiry, alg:none rejection, signature tampering
- Rate limiting (absence of, documented as findings)

### Out of Scope

- React component pixel rendering and visual regression testing
- Overpass API internal correctness (treated as an external dependency)
- Neon/PostgreSQL infrastructure availability and network latency
- PDF export pixel fidelity (`html2canvas` + `jsPDF` output)
- Leaflet map rendering and tile loading

---

## 3. Environment Setup

### Prerequisites

Jest and its dependencies are not yet installed. Run:

```bash
npm install --save-dev jest jest-environment-node node-fetch@2
```

The `xlsx` package (used for the test plan export only) is already installed as a dev dependency.

### Environment Variables

| Variable | Purpose | Example value |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string for the running app and TypeORM CLI | `postgres://user:pass@host/atlas_ai` |
| `JWT_SECRET` | HMAC secret used for signing and verifying `atlas_token` JWTs | `my-very-secret-key-32-chars-min` |
| `TEST_BASE_URL` | Base URL of the running Next.js dev or production server | `http://localhost:3000` |

### Database Setup

```bash
npm run migration:run   # create all tables (idempotent)
npm run seed            # populate profit_benchmarks, competitors, area_demographics
```

Seed data must include at minimum:
- `area_demographics` rows covering MONAS (`-6.1754, 106.8272`), Sudirman (`-6.2088, 106.8228`), and Tanjung Priok (`-6.1053, 106.8827`); must NOT cover Bogor (`-6.5971, 106.8060`).
- `profit_benchmarks` row for category `"Kopi & Cafe"`.
- `competitors` rows for `"Kopi & Cafe"` near Sudirman — at least 4 with non-null `revenue_min_jt` and `revenue_max_jt` within 500 m to exercise IQR logic.

### Running the Suite

Start the Next.js server first, then in a second terminal:

```bash
# Full suite
NODE_OPTIONS=--experimental-vm-modules npx jest tests/api/ --testEnvironment node --runInBand

# Individual suites
NODE_OPTIONS=--experimental-vm-modules npx jest tests/api/auth/login.test.js
NODE_OPTIONS=--experimental-vm-modules npx jest tests/api/auth/register.test.js
NODE_OPTIONS=--experimental-vm-modules npx jest tests/api/analyze/route.test.js
```

Add the following Jest configuration block to `package.json` (no `jest.config.js` currently exists):

```json
"jest": {
  "testEnvironment": "node",
  "testMatch": ["tests/**/*.test.js"],
  "transform": {},
  "extensionsToTreatAsEsm": [".js"]
}
```

---

## 4. Coverage Map

### API Endpoints

| Endpoint | Method | Test File | Test Count | Priority | Status |
|---|---|---|---|---|---|
| `POST /api/auth/register` | POST | `tests/api/auth/register.test.js` | 51 describe blocks, ~85 individual tests | P0 | Covered |
| `POST /api/auth/login` | POST | `tests/api/auth/login.test.js` | 24 describe blocks, ~60 individual tests | P0 | Covered |
| `POST /api/analyze` | POST | `tests/api/analyze/route.test.js` | 30 describe blocks, ~80 individual tests | P0 | Covered |
| `GET /api/analysis/history` | GET | None | 0 | P0 | Not covered |
| `POST /api/analysis/save` | POST | None | 0 | P1 | Not covered |
| `DELETE /api/analysis/save` | DELETE | None | 0 | P1 | Not covered |
| `POST /api/auth/logout` | POST | None | 0 | P1 | Not covered |
| `GET /api/auth/me` | GET | None | 0 | P1 | Not covered |
| `POST /api/setup` | POST | None | 0 | P2 | Not covered (deprecated) |

### Components

| Component | Test File | Test Count | Priority | Status |
|---|---|---|---|---|
| `App.jsx` | None | 0 | P1 | Not covered |
| `Sidebar.jsx` | None | 0 | P1 | Not covered |
| `ResultPanel.jsx` | None | 0 | P1 | Not covered |
| `RiwayatSider.jsx` | None | 0 | P1 | Not covered |
| `MapView.jsx` | None | 0 | P2 | Not covered |
| `CategoryPicker.jsx` | None | 0 | P2 | Not covered |
| `ScalePicker.jsx` | None | 0 | P2 | Not covered |
| `RadiusSlider.jsx` | None | 0 | P2 | Not covered |
| `EmptyState.jsx` | None | 0 | P2 | Not covered |
| `LoadingSteps.jsx` | None | 0 | P2 | Not covered |
| `MobileBottomSheet.jsx` | None | 0 | P2 | Not covered |
| `PDFPreviewModal.jsx` | None | 0 | P2 | Out of scope (PDF pixel output) |
| `Header.jsx` | None | 0 | P2 | Not covered |
| `MobileHeader.jsx` | None | 0 | P2 | Not covered |

### Scoring / Business Logic

| Module | Function | Covered by | Status |
|---|---|---|---|
| `lib/analysis.js` | `generateAnalysis()` — overall average | `ANALYZE-027` (unit assertion) | Covered |
| `lib/analysis.js` | `generateAnalysis()` — grade thresholds | `ANALYZE-021` (unit assertion) | Covered |
| `lib/analysis.js` | Traffic score formula (`20 + count * 0.95`, cap 95) | `ANALYZE-023` (unit assertion) | Covered |
| `lib/analysis.js` | Accessibility score formula (`20 + count * 3.5`, cap 95) | `ANALYZE-024` (unit assertion) | Covered |
| `lib/analysis.js` | Population score formula (`25 + density / 310`, cap 90) | `ANALYZE-025` (unit assertion) | Covered |
| `lib/analysis.js` | `calcProfitRange()` — IQR vs min-max threshold | `ANALYZE-026` (unit assertion) | Covered |
| `lib/analysis.js` | `calcCompetitionScore()` — with benchmark | `ANALYZE-020` (integration) | Covered |
| `lib/analysis.js` | `calcCompetitionScore()` — without benchmark | `EDGE-A-008` (unit assertion) | Covered |
| `lib/analysis.js` | `SCALE_PROFIT_MULT` application | `ANALYZE-018`, `ANALYZE-019` | Covered |
| `lib/analysis.js` | `SCALE_COMP_ADJ` application and clamping | `ANALYZE-020` | Covered |
| `lib/analysis.js` | `getRecommendation()` — scale context strings | `EDGE-A-007` | Covered |
| `lib/analysis.js` | Tags null-safety for traffic/accessibility | `EDGE-A-003`, `EDGE-A-004` | Covered (bug documented) |
| `lib/analysis.js` | `referenceCount` null template literal | `EDGE-A-005` | Covered (bug documented) |

---

## 5. Existing Test Suites

### auth/login

`tests/api/auth/login.test.js` covers 24 describe groups spanning the full happy path (AUTH-L-001 through AUTH-L-004), email normalisation (AUTH-L-003), wrong credentials and user-enumeration prevention (AUTH-L-004 through AUTH-L-006), all missing/empty field permutations (AUTH-L-007 through AUTH-L-013), malformed email handling (AUTH-L-014), non-JSON body (AUTH-L-015), wrong HTTP methods (AUTH-L-016), response shape (AUTH-L-017 through AUTH-L-019), SQL injection via email and password (SEC-L-001 through SEC-L-002), JWT algorithm confusion/signature tampering/expiry (SEC-L-003 through SEC-L-006), and brute-force absence documentation (SEC-L-007). Notable findings: no rate limiting is present; the password presence guard (`!password`) does not trim, so whitespace-only passwords of 8+ chars reach bcrypt; the login route has no email format validation.

### auth/register

`tests/api/auth/register.test.js` covers 45 describe groups: full happy path with and without `bisnis_name` (AUTH-R-001 through AUTH-R-004), duplicate email detection including normalised variants (AUTH-R-003 through AUTH-R-005), all missing/empty/whitespace field combinations across name, email, and password (AUTH-R-006 through AUTH-R-015), password length boundaries at 7, 8, and 1 characters (AUTH-R-016 through AUTH-R-018), email format validation and its known gaps (AUTH-R-019 through AUTH-R-022), email normalisation on storage (AUTH-R-026), wrong HTTP methods (AUTH-R-027 through AUTH-R-028), non-JSON body (AUTH-R-029), and a full security battery including SQL injection in name and email, XSS storage, password non-exposure, JWT algorithm confusion, tampered tokens, expired tokens, missing cookie, and mass assignment (SEC-R-001 through SEC-R-010). The suite documents three bugs: whitespace-only password of 8+ chars is accepted (EDGE-R-006); emails like `"@"`, `"user@"`, and `"a@@b.com"` pass the format check (AUTH-R-021, AUTH-R-022, EDGE-R-012); and concurrent registrations with the same email may produce a DB 500 instead of a clean 409 (noted in findings).

### analyze/route

`tests/api/analyze/route.test.js` covers 30 describe groups. The happy path (ANALYZE-001 through ANALYZE-004) validates full response shape, five-dimension structure, grade consistency, and scale echoing. Input validation findings (ANALYZE-008 through ANALYZE-016) document the absence of any validation guard — missing lat/lng, out-of-range radius, invalid scale, and non-JSON body are all passed through. The Jakarta gate is exercised with Bogor coordinates (ANALYZE-017). Scale multiplier correctness is verified with ratio assertions for Kecil/Menengah/Besar (ANALYZE-018 through ANALYZE-020). Unit-level assertions cover all grade thresholds, scoring formulas, IQR profit logic, and graceful degradation under null Overpass results (ANALYZE-021 through ANALYZE-028). Security tests document the critical auth bypass (SEC-A-001), SQL injection resistance, and resource amplification via oversized radius (SEC-A-005).

---

## 6. Gap Analysis — Recommended Next Suites

**`GET /api/analysis/history`** — Priority: P0

The route reads the `atlas_token` cookie, verifies it, and returns up to 100 saved analyses for the authenticated user ordered by `created_at DESC`. No test file exists.

- HIS-001: No cookie → HTTP 401, body `{ items: [] }`
- HIS-002: Valid cookie for user A → returns only user A's items (per-user isolation; IDOR check — user B's items must not appear)
- HIS-003: Tampered JWT sent as cookie → HTTP 401
- HIS-004: Expired JWT sent as cookie → HTTP 401
- HIS-005: alg:none JWT sent as cookie → HTTP 401
- HIS-006: New user with no saved analyses → HTTP 200, body `{ items: [] }`
- HIS-007: User with exactly 100 saved analyses → `items.length === 100` (pagination cap)
- HIS-008: User with 101 saved analyses → `items.length === 100` (hard cap via `take: 100`)
- HIS-009: Items returned in descending `created_at` order — most recent first
- HIS-010: Each item shape contains `id`, `location`, `category`, `lat`, `lng`, `radius`, `overall`, `grade`, `result_json`, `created_at`
- HIS-011: GET /api/analysis/history with wrong method POST → HTTP 405
- HIS-012: DB unavailable → HTTP 500 or graceful error (no try/catch currently wraps the `repo.find` call)
- HIS-013 to HIS-020: IDOR — construct a valid JWT for user B, call the endpoint; confirm items returned belong only to user B

Recommended IDs: HIS-001 to HIS-020

---

**`POST /api/analysis/save`** — Priority: P1

The route authenticates, validates six required fields, persists to `saved_analyses`, and returns `{ id, created_at }`.

- SAVE-001: Valid authenticated POST with all fields → HTTP 200, body `{ id: <uuid>, created_at: <iso> }`
- SAVE-002: No cookie → HTTP 401, body `{ error: 'Unauthorized' }`
- SAVE-003: Missing `location` field → HTTP 400, body `{ error: 'Missing fields' }`
- SAVE-004: Missing `result` field → HTTP 400, body `{ error: 'Missing fields' }`
- SAVE-005: POTENTIAL BUG — the validation guard is `!location || !category || !lat || !lng || !radius || !result`; `lat=0` and `lng=0` are falsy and would trigger a 400 even for valid coordinates at 0,0 (Null Island). Document this as a validation bug.
- SAVE-006: Saved item appears in subsequent `GET /api/analysis/history` response for the same user
- SAVE-007: Saved item does NOT appear in `GET /api/analysis/history` for a different user (isolation)
- SAVE-008: Non-JSON body → no try/catch around `req.json()` → HTTP 500 (potential unhandled error)
- SAVE-009: Expired JWT → HTTP 401
- SAVE-010: Tampered JWT → HTTP 401

Recommended IDs: SAVE-001 to SAVE-020

---

**`DELETE /api/analysis/save`** — Priority: P1

The route authenticates, reads `id` from the request body, and calls `repo.delete({ id, user_id: payload.userId })`. The `user_id` filter is the IDOR safeguard.

- DEL-001: Authenticated DELETE of own record → HTTP 200, body `{ ok: true }`; record removed from history
- DEL-002: No cookie → HTTP 401
- DEL-003: Missing `id` field → HTTP 400, body `{ error: 'Missing id' }`
- DEL-004: IDOR check — user B authenticates and attempts to DELETE a record owned by user A; TypeORM filter `{ id, user_id: payload.userId }` should cause a no-op (0 rows affected), not a 401 or 403 — verify the record still exists for user A
- DEL-005: Non-existent `id` → `repo.delete` silently succeeds; HTTP 200 `{ ok: true }` (TypeORM delete on a non-existent key is not an error)
- DEL-006: Non-JSON body → HTTP 500 (no try/catch around `req.json()`)
- DEL-007: Deleted record no longer appears in `GET /api/analysis/history`

Recommended IDs: DEL-001 to DEL-015

---

**`POST /api/auth/logout`** — Priority: P1

The route sets `atlas_token` cookie `maxAge: 0` to clear it. No authentication is required before clearing.

- LGOUT-001: POST → HTTP 200, body `{ ok: true }`; `Set-Cookie` header clears `atlas_token` (`Max-Age=0` or `Expires` in the past)
- LGOUT-002: After logout, the cleared cookie is rejected by `GET /api/analysis/history` → HTTP 401
- LGOUT-003: Logout with no prior session (no cookie) → HTTP 200 (route does not require a cookie)
- LGOUT-004: Wrong method GET → HTTP 405

Recommended IDs: LGOUT-001 to LGOUT-010

---

**`GET /api/auth/me`** — Priority: P1

The route reads the cookie, verifies it, and returns `{ user: { userId, name, bisnis_name, email } }` or `{ user: null }` with HTTP 401.

- ME-001: Valid cookie → HTTP 200, body `{ user: { userId, name, bisnis_name, email } }`
- ME-002: No cookie → HTTP 401, body `{ user: null }`
- ME-003: Tampered JWT → HTTP 401, body `{ user: null }`
- ME-004: Expired JWT → HTTP 401, body `{ user: null }`
- ME-005: alg:none JWT → HTTP 401, body `{ user: null }`
- ME-006: Response does NOT contain `password_hash` or any password value
- ME-007: Wrong method POST → HTTP 405

Recommended IDs: ME-001 to ME-010

---

**Scoring Engine Unit Tests** — Priority: P1

The existing analyze tests embed formula replicas inline rather than importing from `lib/analysis.js`. A dedicated unit test file would test the exported functions directly.

- UNIT-001 to UNIT-010: `generateAnalysis()` with controlled `realData` fixture — verify each dimension score, overall average, grade, profit range, and tags
- UNIT-011: `calcProfitRange` with revenues array of length 0, 1, 2, 3, 4, 5 — verify IQR/min-max branch selection at exact boundary of 4
- UNIT-012: `calcCompetitionScore` with and without benchmark — verify ratio formula and clamping at 15 and 90
- UNIT-013: `getRecommendation` for each of the four score bands and each of three scales

Recommended IDs: UNIT-001 to UNIT-030

---

## 7. Bug Registry

| ID | Severity | Description | Location | Repro Test | Status |
|---|---|---|---|---|---|
| BUG-001 | Critical | `POST /api/analyze` has no authentication guard. Any anonymous caller receives full analysis results, consuming DB queries and Overpass API budget. | `app/api/analyze/route.js` line 1 (entire file — no cookie verification added) | `SEC-A-001`, `ANALYZE-005` | Open |
| BUG-002 | High | No input validation on `POST /api/analyze`. Missing `lat`, `lng`, `radius` and out-of-range values are not rejected with HTTP 400; they propagate into SQL and can produce silent NaN arithmetic. | `app/api/analyze/route.js` lines 1–10 (no validation block) | `ANALYZE-008`, `ANALYZE-009`, `ANALYZE-011`, `ANALYZE-012`, `ANALYZE-013` | Open |
| BUG-003 | High | No rate limiting on `POST /api/auth/login`. Rapid credential stuffing returns 401 for every attempt without any 429 backoff. | `app/api/auth/login/route.js` (no middleware present) | `SEC-L-007` | Open |
| BUG-004 | High | No rate limiting on `POST /api/auth/register`. Rapid account creation or enumeration is possible. | `app/api/auth/register/route.js` (no middleware present) | `SEC-R-010` | Open |
| BUG-005 | High | `POST /api/analyze` has no `try/catch`. A non-JSON request body causes `request.json()` to throw, producing an unhandled HTTP 500 instead of a graceful error. Auth routes wrap everything in `try/catch`; this route does not. | `app/api/analyze/route.js` lines 1–10 | `ANALYZE-016`, `API-A-005` | Open |
| BUG-006 | Medium | Password guard on `POST /api/auth/register` is `!password` (falsy), not `!password.trim()`. A whitespace-only password of 8 or more spaces passes both the presence check and the length check and is bcrypt-hashed and stored. | `app/api/auth/register/route.js` line 10 | `EDGE-R-006` | Open |
| BUG-007 | Medium | Email format validation on `POST /api/auth/register` uses only `!email.includes('@')`. Strings `"@"`, `"user@"`, and `"a@@b.com"` all pass despite being invalid RFC 5321 addresses. | `app/api/auth/register/route.js` line 16 | `AUTH-R-021`, `AUTH-R-022`, `EDGE-R-012` | Open |
| BUG-008 | Medium | Race condition on `POST /api/auth/register`: two concurrent requests for the same email both pass the `findOne` duplicate check, then the second `repo.save` hits the DB unique constraint and returns HTTP 500 instead of a clean 409. | `app/api/auth/register/route.js` lines 23–35 | `API-R-010` | Open |
| BUG-009 | Medium | Null traffic and null accessibility comparisons in `lib/analysis.js` tags array: `null > 70` and `null > 45` both evaluate to `false` in JS, so a null score always resolves to `'warning'` type. A null score should produce `'info'` or `'unavailable'` type, not `'warning'`. | `lib/analysis.js` lines 59, 61 | `EDGE-A-003`, `EDGE-A-004` | Open |
| BUG-010 | Medium | `referenceCount` is interpolated directly into a tag template literal: `` `${referenceCount} outlet referensi` ``. When `referenceCount` is `null` (no benchmark match), the rendered label is `"null outlet referensi"`. The null value should be guarded. | `lib/analysis.js` line 64 | `EDGE-A-005` | Open |
| BUG-011 | Medium | Radius is not validated against the documented 200–1500 m range on `POST /api/analyze`. A caller can submit `radius=999999`, causing an extremely wide Haversine bounding box scan in PostgreSQL and a large Overpass query — resource amplification DoS vector. | `app/api/analyze/route.js` (no range check) | `SEC-A-005`, `ANALYZE-012`, `ANALYZE-013` | Open |
| BUG-012 | Medium | `POST /api/analysis/save` validation guard uses falsy check: `!lat || !lng`. Coordinates `lat=0` and `lng=0` (Null Island) are numerically valid but falsy in JS, causing the route to return HTTP 400 for a legitimate coordinate pair. | `app/api/analysis/save/route.js` line 18 | `SAVE-005` (gap — not yet written) | Open |
| BUG-013 | Low | Password guard on `POST /api/auth/login` is `!password` without `.trim()`. A whitespace-only password string passes the guard and reaches `bcrypt.compare`, which correctly fails (returns 401). The behavior is ultimately correct but inconsistent with the email-side which does `.trim()`. | `app/api/auth/login/route.js` line 10 | `AUTH-L-009`, `EDGE-L` | Open (Low — no user impact) |
| BUG-014 | Low | No CSRF protection beyond `SameSite: 'lax'` on the login and register endpoints. A cross-site top-level POST navigation can succeed in some browser configurations. | `lib/auth.js` `cookieOpts()` | `SEC-L` / `SEC-R` informational | Open |
| BUG-015 | Low | bcrypt silently truncates passwords exceeding 72 bytes. Two passwords sharing the same first 72 bytes produce identical hashes. This is documented bcrypt behaviour but creates a non-obvious collision risk for very long passwords. | `lib/auth.js` line 8 (bcryptjs call) | `EDGE-L-002`, `EDGE-R-002` | Open (Low — inherent bcrypt limitation) |

---

## 8. Test Execution Order

1. Start the PostgreSQL database (local Docker or Neon).
2. Run `npm run migration:run` to apply all TypeORM migrations.
3. Run `npm run seed` to populate `profit_benchmarks`, `competitors`, and `area_demographics`.
4. Start the Next.js server (`npm run dev` or `npm run start`) and confirm it is reachable at `TEST_BASE_URL`.
5. Run `tests/api/auth/register.test.js` — this suite creates users needed by downstream suites and exercises the registration lifecycle first.
6. Run `tests/api/auth/login.test.js` — depends on registration working; exercises JWT issuance used in all authenticated tests.
7. Run `tests/api/analyze/route.test.js` — registers and logs in its own user in `beforeAll`; requires seed data; must follow steps 2–4.
8. Run `tests/api/auth/me.test.js` (when created) — depends on a valid JWT from login.
9. Run `tests/api/analysis/save.test.js` (when created) — creates saved records needed by the history tests.
10. Run `tests/api/analysis/history.test.js` (when created) — must follow save tests to have data to retrieve.
11. Run `tests/api/auth/logout.test.js` (when created) — final auth suite; verifies cookie clearance.
12. Run unit tests for `lib/analysis.js` (when created) — no server required; can run in isolation at any point.

---

## 9. Definition of Done

- All P0 test suites (auth/register, auth/login, analyze, history) pass with zero failures in a clean environment.
- All P1 test suites (save, delete, logout, me) pass with zero failures.
- The Bug Registry entries BUG-001 through BUG-005 (Critical and High severity) are resolved and each has a corresponding regression test that now passes.
- No test is marked as `skip` or `todo` without a linked issue tracking resolution.
- The JWT security tests (alg:none, tampered signature, expired token, missing cookie) pass for every authenticated endpoint.
- The rate-limiting informational tests (SEC-L-007, SEC-R-010) either confirm a 429 response is present or are explicitly accepted as deferred findings in the project backlog.
- Code coverage for `lib/analysis.js` reaches 100% line coverage via the dedicated unit test suite.
- The XLSX export at `tests/TEST-PLAN.xlsx` reflects the current state of all nine sections and is regenerated as part of each release checklist.
- The CI pipeline executes the full suite (`NODE_OPTIONS=--experimental-vm-modules npx jest tests/api/ --runInBand`) and blocks merges on any failure.
