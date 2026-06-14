# Test Cases — POST /api/analyze

Generated from: `app/api/analyze/route.js`, `lib/analysis.js`, `lib/auth.js`,
`lib/entities/CompetitorSchema.ts`, `lib/entities/ProfitBenchmarkSchema.ts`,
`lib/entities/AreaDemographicSchema.ts`, `lib/data-source.ts`

Coverage: 30 functional/API / 6 security / 8 edge cases = 44 total test cases

---

## Facts Extracted from Source Code

### Validation rules
The route has NO input validation. There is no check for:
- Missing `lat`, `lng`, `category`, `radius`
- `radius` out of range (< 200 or > 1500)
- Invalid `category` value
- Invalid `scale` value

`scale` defaults to `'Menengah'` via destructuring default: `scale = 'Menengah'`.

### Auth guard
There is NO authentication check in `POST /api/analyze`. The route does not read or verify the `atlas_token` cookie. Any caller (anonymous or authenticated) receives full analysis results.

### Business logic branches
1. Jakarta gate: if `demographics` is `null` after the DB query, returns `{ unsupported: true, message: '...' }` with HTTP 200.
2. DB failure path: if `dbResult.status === 'rejected'`, falls back to a 5-row uncategorized competitor list via a simpler query.
3. Overpass failure path: `trafficResult` and `accessibilityResult` can be `null` (Overpass timeout or error); `Promise.allSettled` prevents a 500.
4. Profit range IQR vs min-max: `revenues.length >= 4` uses IQR (p25/p75 indices); `< 4` uses min/max.
5. Scale multiplier fallback: `SCALE_PROFIT_MULT[scale] || 1.0` — unknown scale silently uses 1.0.
6. Competition score SCALE_COMP_ADJ fallback: `SCALE_COMP_ADJ[scale] || 0` — unknown scale silently uses 0.
7. Competition score clamped: `Math.min(90, Math.max(15, rawCompetition + adj))` — after scale adjustment.

### Exact error message strings
- Outside Jakarta: `'Area ini berada di luar cakupan AtlasAI. Saat ini kami mendukung analisis untuk wilayah DKI Jakarta.'`

### Boundary values
- Traffic score: floor=20 (amenityCount=0), cap=95 (amenityCount >= ~79)
- Accessibility score: floor=20 (transportCount=0), cap=95 (transportCount >= 22)
- Population score: floor=25 (density=0), cap=90 (density >= ~20,150)
- Competition score: floor=15, cap=90 (both applied after scale adjustment)
- IQR threshold: `revenues.length >= 4` (not > 4, not >= 5)
- SCALE_PROFIT_MULT: Kecil=0.4, Menengah=1.0, Besar=2.2
- SCALE_COMP_ADJ: Kecil=-5, Menengah=0, Besar=+5

### Grade thresholds (from source)
- `overall >= 75` → `'Sangat Potensial'` / `#10B981`
- `overall >= 60` → `'Potensi Bagus'` / `#3B82F6`
- `overall >= 45` → `'Cukup Potensial'` / `#F59E0B`
- `overall < 45` → `'Kurang Ideal'` / `#EF4444`

### Potential bugs found
1. **POTENTIAL BUG — null traffic comparison in tags**: `tags[0].type` is computed as `traffic > 70 ? 'positive' : traffic > 45 ? 'neutral' : 'warning'`. When `traffic` is `null`, both comparisons are `false`, so the tag always gets type `'warning'`. This is misleading — `null` traffic should not be labeled as a warning. Same issue affects `tags[2]` (accessibility).
2. **POTENTIAL BUG — no try/catch in POST handler**: Unlike the auth routes, `POST /api/analyze` has no top-level `try/catch`. If `request.json()` throws (non-JSON body), Next.js returns an unhandled 500 rather than a graceful error response.

---

## Functional Test Cases

| ID | Feature | Scenario | Preconditions | Steps | Expected Result | Priority |
|----|---------|----------|---------------|-------|-----------------|----------|
| ANALYZE-001 | Happy path | Authenticated request with valid Jakarta coordinates | User registered and logged in; DB seeded with area_demographics covering MONAS (-6.1754, 106.8272); Overpass reachable | POST `/api/analyze` with lat=-6.1754, lng=106.8272, category="Kopi & Cafe", radius=500, scale="Menengah", cookie=atlas_token | HTTP 200; body has `overall` (0–100 number), `grade` in valid set, `dimensions` array of 5, `competitors` array, `recommendation` string, `tags` array, `scale="Menengah"`; no `unsupported` key | Critical |
| ANALYZE-002 | Scale default | `scale` field omitted from request | Same as ANALYZE-001 | POST without `scale` field | HTTP 200; `scale` in response body is `"Menengah"` | High |
| ANALYZE-003 | Category variants | Each of the 5 known categories is accepted | DB seeded with benchmarks for all categories | POST with each category value: "Kopi & Cafe", "Ayam Goreng", "Burger", "Mie & Bakso", "Minuman" | HTTP 200 for each; no `unsupported` flag | High |
| ANALYZE-004 | Radius boundaries | Both min (200) and max (1500) radius values are accepted | Same as ANALYZE-001 | POST with radius=200 and separately with radius=1500 | HTTP 200 for both; valid analysis result | High |
| ANALYZE-005 | Auth guard | Request without any cookie | No cookie set | POST without `Cookie` header | SECURITY FINDING: currently returns HTTP 200 (no auth guard). Expected: HTTP 401 | Critical |
| ANALYZE-006 | Auth guard | Invalid JWT in cookie | User logged in; JWT value replaced with garbage string | POST with `atlas_token=not.a.valid.jwt` | Route does not verify JWT — does not return 500; currently processes normally | High |
| ANALYZE-007 | Auth guard | Expired JWT in cookie | Build JWT signed with correct secret but exp in the past | POST with expired token cookie | Route does not verify JWT — does not return 500 | High |
| ANALYZE-008 | Input validation | Missing `lat` | None | POST without `lat` field | VALIDATION FINDING: no 400 guard exists; `lat=undefined` passed to DB; NaN bounding box causes DB query to return no rows; demographics=null → unsupported gate fires → 200 `{unsupported:true}` or DB error absorbed by `Promise.allSettled` | High |
| ANALYZE-009 | Input validation | Missing `lng` | None | POST without `lng` field | Same behavior as ANALYZE-008 | High |
| ANALYZE-010 | Input validation | Missing `category` | None | POST without `category` field | `category=undefined` → SQL `WHERE category = NULL` matches nothing; competitors=[]; benchmark=null; demographics may be found → analysis runs with 0 competitors and no benchmark; returns 200 | Medium |
| ANALYZE-011 | Input validation | Missing `radius` | None | POST without `radius` field | `radius=undefined` → `radiusLat = NaN`; bounding box NaN; DB call fails or returns empty; `Promise.allSettled` absorbs error; demographics=null → unsupported gate fires; does not return 500 | High |
| ANALYZE-012 | Input validation | radius=199 (below 200m minimum) | None | POST with radius=199 | VALIDATION FINDING: no range check exists; request is processed normally; 200 returned | Medium |
| ANALYZE-013 | Input validation | radius=1501 (above 1500m maximum) | None | POST with radius=1501 | VALIDATION FINDING: no range check exists; request is processed normally; 200 returned | Medium |
| ANALYZE-014 | Input validation | Invalid scale value | None | POST with scale="InvalidScale" | 200 returned; scale echoed as "InvalidScale"; profit multiplier falls back to 1.0; competition adj falls back to 0; no error | Medium |
| ANALYZE-015 | Input validation | radius as string "500" | None | POST with radius="500" (JSON string) | JS coerces string to number in arithmetic; PostgreSQL receives string for $8 param; result may vary but should not be 500 | Low |
| ANALYZE-016 | Input validation | Non-JSON request body | None | POST with `Content-Type: text/plain` body | `req.json()` throws; no try/catch in route → HTTP 500 (POTENTIAL BUG — no graceful error response) | Medium |
| ANALYZE-017 | Jakarta gate | Location outside DKI Jakarta coverage | DB seeded with area_demographics for Jakarta only; use Bogor coordinates (-6.5971, 106.8060) | POST with outside-Jakarta coordinates | HTTP 200; body = `{ unsupported: true, message: "Area ini berada di luar cakupan AtlasAI. Saat ini kami mendukung analisis untuk wilayah DKI Jakarta." }`; no `overall`, no `grade` | Critical |
| ANALYZE-018 | Scale profit multiplier | Kecil vs Besar profitRange ratio | Same coordinates and category, only scale differs; profitSource must be "competitors" or "benchmark" (not "none") | POST with scale="Kecil" and POST with scale="Besar"; compare profitMin | `besarProfitMin / kecilProfitMin ≈ 5.5` (2.2 / 0.4); Besar profitMin > Kecil profitMin | Critical |
| ANALYZE-019 | Scale profit multiplier | Menengah vs Kecil profitRange ratio | Same as ANALYZE-018 | POST with scale="Kecil" and scale="Menengah" | `menengahProfitMin / kecilProfitMin ≈ 2.5` (1.0 / 0.4) | High |
| ANALYZE-020 | Scale competition adj | SCALE_COMP_ADJ shifts competition score | Same coordinates and category, only scale differs | POST with Kecil, Menengah, Besar; read `dimensions[1].score` | Kecil competition <= Menengah competition; Besar competition >= Menengah competition; Besar - Kecil <= 10; all scores clamped [15, 90] | Critical |
| ANALYZE-021 | Grade thresholds | All four grade boundary values | Unit-level (no DB needed) | Compute grade from scores: 75, 74, 60, 59, 45, 44, 100, 0 | 75→"Sangat Potensial"; 74→"Potensi Bagus"; 60→"Potensi Bagus"; 59→"Cukup Potensial"; 45→"Cukup Potensial"; 44→"Kurang Ideal"; 100→"Sangat Potensial"; 0→"Kurang Ideal" | Critical |
| ANALYZE-022 | Grade consistency | Live response grade matches overall score | Valid Jakarta coordinate | POST and compare `overall` to `grade` | If overall >= 75 → "Sangat Potensial"; >= 60 → "Potensi Bagus"; >= 45 → "Cukup Potensial"; < 45 → "Kurang Ideal" | High |
| ANALYZE-023 | Traffic formula | amenityCount boundary values | Unit-level | Compute `Math.min(95, Math.max(20, Math.round(20 + amenityCount * 0.95)))` for 0, 1, 50, 79, 100 | 0→20; 1→21; 50→68; 79→95; 100→95 | High |
| ANALYZE-024 | Accessibility formula | transportCount boundary values | Unit-level | Compute `Math.min(95, Math.max(20, Math.round(20 + transportCount * 3.5)))` for 0, 1, 21, 22, 50 | 0→20; 1→24; 21→94; 22→95; 50→95 | High |
| ANALYZE-025 | Population formula | density boundary values | Unit-level | Compute `Math.min(90, Math.max(25, Math.round(25 + density / 310)))` for 0, 3000, 10000, 18000, 25000 | 0→25; 3000→35; 10000→57; 18000→83; 25000→90 | High |
| ANALYZE-026 | Profit range IQR | Threshold at exactly 4 competitors with revenue | Unit-level | Run calcProfitRange with sorted arrays of length 1, 3, 4 | len=3 → min-max (revenues[0], revenues[2]); len=4 → IQR (revenues[1], revenues[3]); len=4 profitMin != revenues[0] | Critical |
| ANALYZE-027 | Graceful degradation | null Overpass scores excluded from overall average | Unit-level | Compute overall from [null, 70, null, 50, 40] | overall = Math.round((70+50+40)/3) = 53; 5-null array returns null | High |
| ANALYZE-028 | Graceful degradation | Overpass timeout does not cause 500 | Valid Jakarta location with potentially slow Overpass | POST with short radius=200 at Tanjung Priok port area | HTTP 200 (not 500); if Overpass timed out, traffic and accessibility dimensions have score=null, source="unavailable" | Critical |
| ANALYZE-029 | Response shape | All expected top-level keys present | Valid Jakarta coordinate, DB seeded | POST and inspect response body | Body has: overall, grade, gradeColor, dimensions (5 items), profitMin, profitMax, profitMedian, profitSource, referenceCount, referenceRadius, tags, competitors, areaName, footTrafficAmenityCount, recommendation, scale; profitSource in ["competitors","benchmark","none"]; gradeColor matches `/^#[0-9A-Fa-f]{6}$/` | High |
| ANALYZE-030 | HTTP method | Wrong HTTP methods rejected | None | GET, PUT, DELETE to /api/analyze | HTTP 405 for all non-POST methods | Medium |

---

## API Test Cases

| ID | Endpoint | Method | Scenario | Expected Result |
|----|----------|--------|----------|-----------------|
| API-A-001 | /api/analyze | POST | Minimum valid payload (Jakarta lat/lng, known category, radius=500, scale=Menengah, auth cookie) | 200; body has overall (number), grade (string), dimensions (array[5]), competitors (array), recommendation (non-empty string), tags (array) |
| API-A-002 | /api/analyze | POST | Outside-Jakarta coordinates (Bogor: -6.5971, 106.8060) | 200; `{ unsupported: true, message: "Area ini berada di luar cakupan AtlasAI. Saat ini kami mendukung analisis untuk wilayah DKI Jakarta." }` |
| API-A-003 | /api/analyze | POST | scale="Kecil" at same coordinates as scale="Besar" | 200 for both; `besarBody.profitMin / kecilBody.profitMin ≈ 5.5`; `besarBody.dimensions[1].score >= kecilBody.dimensions[1].score` |
| API-A-004 | /api/analyze | GET | Wrong HTTP method | 405 Method Not Allowed |
| API-A-005 | /api/analyze | POST | Non-JSON Content-Type body | 500 (no try/catch in route — POTENTIAL BUG) |
| API-A-006 | /api/analyze | POST | Empty JSON body `{}` | Route processes with all fields undefined; demographics gate fires or DB error; does NOT return 400 (no validation exists); returns 200 with unsupported or unusual state |
| API-A-007 | /api/analyze | POST | Valid payload, no auth cookie | 200 (auth bypass — SECURITY FINDING: no guard on this endpoint) |
| API-A-008 | /api/analyze | POST | profitSource when no revenue data and no benchmark | 200; `profitSource = "none"`; `profitMin = null`; `profitMax = null` |
| API-A-009 | /api/analyze | POST | profitSource when benchmark exists but no competitor revenue data | 200; `profitSource = "benchmark"`; profitMin and profitMax derived from benchmark min_jt/max_jt multiplied by scale factor |
| API-A-010 | /api/analyze | POST | profitSource when >= 4 competitors have revenue data | 200; `profitSource = "competitors"`; profitMin = p25 (IQR), profitMax = p75 (IQR) |

---

## Security Test Cases

| ID | Vulnerability | Test Method | Expected Result |
|----|---------------|-------------|-----------------|
| SEC-A-001 | Missing authentication | POST to /api/analyze with no `atlas_token` cookie | SECURITY FINDING: Current behavior is HTTP 200 with full results. Expected behavior (not yet implemented): HTTP 401. No auth guard exists on this endpoint. |
| SEC-A-002 | SQL injection — category | `category = "'; DROP TABLE competitors; --"` in POST body | HTTP 200 (or unsupported); TypeORM parameterized query ($3) treats value as a literal string; competitors table is not modified; no 500 |
| SEC-A-003 | SQL injection — lat field | `lat = "1; DROP TABLE area_demographics; --"` | Non-numeric value passed as $1 to PostgreSQL; query fails inside `Promise.allSettled`; DB fallback triggers; route returns 200 or unsupported; NOT 500; no table is dropped |
| SEC-A-004 | Coordinate injection | `lat=999, lng=-999` (impossible geography) | HTTP 200; `unsupported: true` (no area_demographics row matches); no crash; no data leaked |
| SEC-A-005 | Resource amplification — oversized radius | `radius=999999` (far beyond 1500m max) | SECURITY FINDING: No upper bound enforced; request is processed; the Haversine bounding box spans thousands of km; potentially expensive DB scan and Overpass query. Recommend 400 for radius > 1500. |
| SEC-A-006 | Oversized payload — category field | `category = "A".repeat(10000)` | Does not cause 500; DB query runs with long literal string; returns 200 (likely with no competitors / no benchmark) |

---

## Edge Cases

| ID | Scenario | Input | Expected Behavior |
|----|----------|-------|-------------------|
| EDGE-A-001 | Coordinate at exact bbox boundary in area_demographics | lat/lng at exact lat_min or lat_max of a Jakarta kecamatan row | SQL condition `lat_min <= $1 AND $1 <= lat_max` is inclusive; coordinate should match; result is a valid analysis (not unsupported) |
| EDGE-A-002 | No competitors with revenue AND no benchmark for category | Unknown category (no benchmark row, no competitors) | `profitSource = "none"`, `profitMin = null`, `profitMax = null`, `profitMedian = null`; analysis still returns valid score using population and purchasing power dimensions |
| EDGE-A-003 | POTENTIAL BUG — null traffic comparison in tags | Overpass returns null (timeout) | `tags[0].type = 'warning'` because `null > 70` and `null > 45` are both false in JS; misleading label; recommend explicit null check |
| EDGE-A-004 | POTENTIAL BUG — null accessibility comparison in tags | Overpass returns null (timeout) | `tags[2].type = 'warning'` due to same null comparison issue; recommend explicit null check |
| EDGE-A-005 | referenceCount null when no benchmark | Unknown category with no benchmark row | `referenceCount = null`; `referenceRadius = null`; tags[5] label is "null outlet referensi" (POTENTIAL BUG — null not guarded in template literal) |
| EDGE-A-006 | areaName present in response | Valid Jakarta coordinate | `areaName` is a non-empty string matching the `name` column from the matched area_demographics row |
| EDGE-A-007 | Scale-specific text in recommendation | scale="Kecil" and scale="Besar" | Kecil recommendation contains `"modal < Rp 100jt"`; Besar recommendation contains `"modal > Rp 300jt"` |
| EDGE-A-008 | Competition score fallback formula (no benchmark) | Unknown category (no benchmark row) | Competition score = `Math.min(90, Math.max(15, Math.round(90 - competitorCount * 8)))`. 0 competitors → 90; 10 competitors → 15 (clamped from 10); 5 competitors → 50 |

---

## Test Data Requirements

### User accounts
- One test user registered per test run: `analyze.test.{RUN_ID}@example.com`, password `testpassword99`
- The `beforeAll` registers and logs in this user to get `authCookie`

### Database seed data required
The following seed data must be present for tests to pass:

1. **area_demographics** — Must have rows covering at minimum:
   - MONAS: lat=-6.1754, lng=106.8272 (Gambir, Jakarta Pusat)
   - Sudirman CBD: lat=-6.2088, lng=106.8228
   - Tanjung Priok port: lat=-6.1053, lng=106.8827
   - Must NOT have rows covering: Bogor (lat=-6.5971, lng=106.8060)

2. **profit_benchmarks** — Must have at least one row for category `"Kopi & Cafe"` with columns: `min_jt`, `max_jt`, `outlet_count`, `radius_km`

3. **competitors** — Must have rows for category `"Kopi & Cafe"` near Sudirman coordinates to exercise the IQR vs min-max and scale profit tests. For ANALYZE-026 (IQR threshold), at least 4 competitors with non-null `revenue_min_jt` and `revenue_max_jt` within 500m radius are needed.

### Coordinate reference table

| Name | lat | lng | Expected outcome |
|------|-----|-----|-----------------|
| MONAS | -6.1754 | 106.8272 | Inside Jakarta — valid analysis |
| Sudirman CBD | -6.2088 | 106.8228 | Inside Jakarta — valid analysis |
| Tanjung Priok | -6.1053 | 106.8827 | Inside Jakarta — valid analysis |
| Bogor city center | -6.5971 | 106.8060 | Outside Jakarta — unsupported:true |
| Null Island | 0 | 0 | Outside Jakarta — unsupported:true |
| Impossible coords | 999 | -999 | Outside Jakarta — unsupported:true |

### JWT payloads for security tests
- Expired token: built with `SignJWT` using real `JWT_SECRET`, `exp = now - 1`
- Tampered token: real header + forged payload + original signature (3-part JWT reassembly)
- alg:none token: base64url-encoded header `{alg:"none",typ:"JWT"}` + arbitrary payload + empty signature

---

## Known Issues and Findings Summary

| Finding | Severity | File | Description |
|---------|----------|------|-------------|
| No auth guard on /api/analyze | Critical | `app/api/analyze/route.js` | The endpoint performs DB queries and Overpass HTTP calls without verifying any JWT. Any anonymous caller can invoke it. |
| No input validation | High | `app/api/analyze/route.js` | Missing lat/lng/category/radius fields and out-of-range radius values are not rejected with HTTP 400. |
| No try/catch in POST handler | Medium | `app/api/analyze/route.js` | `request.json()` failure (non-JSON body) produces an unhandled 500 rather than a graceful error response. Compare to the auth routes which wrap everything in try/catch. |
| Null traffic/accessibility comparison in tags | Low | `lib/analysis.js` lines 59, 61 | When `traffic` or `accessibilityScore` is `null`, the ternary comparison (`null > 70`) silently evaluates to `false`, labeling both as `'warning'` rather than a neutral or informational type. |
| Unlimited radius allows resource amplification | Medium | `app/api/analyze/route.js` | No upper bound enforced on `radius`. A caller can submit `radius=999999`, causing an extremely wide PostgreSQL bounding box scan and a large Overpass query area. |
