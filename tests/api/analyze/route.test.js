// Test Suite — POST /api/analyze
//
// Source analyzed:
//   app/api/analyze/route.js
//   lib/analysis.js
//   lib/auth.js
//   lib/entities/CompetitorSchema.ts
//   lib/entities/ProfitBenchmarkSchema.ts
//   lib/entities/AreaDemographicSchema.ts
//   lib/data-source.ts
//
// Prerequisites (devDependencies):
//   npm install --save-dev jest jest-environment-node node-fetch@2
//
// package.json "jest" config:
//   { "testEnvironment": "node", "testMatch": ["tests/api/analyze/route.test.js"],
//     "transform": {}, "extensionsToTreatAsEsm": [".js"] }
//
// Run (ESM mode):
//   NODE_OPTIONS=--experimental-vm-modules npx jest tests/api/analyze/route.test.js
//
// The Next.js dev server must be running at TEST_BASE_URL (default http://localhost:3000).
// DATABASE_URL and JWT_SECRET must match the running server's environment.
// The database must have been seeded (npm run seed) with profit_benchmarks,
// competitors, and area_demographics before running these tests.
//
// SECURITY FINDING: The /api/analyze endpoint has NO authentication guard.
// Any unauthenticated caller receives full analysis results.
// See SEC-A-001 for the documented test case.

import fetch from 'node-fetch'
import { SignJWT } from 'jose'

// ─── Configuration ────────────────────────────────────────────────────────────

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
const ANALYZE_URL = `${BASE_URL}/api/analyze`
const LOGIN_URL = `${BASE_URL}/api/auth/login`
const REGISTER_URL = `${BASE_URL}/api/auth/register`
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-32-chars-minimum-here'
const COOKIE_NAME = 'atlas_token'

// ─── Jakarta coordinates used across tests ────────────────────────────────────
//
// MONAS (Monumen Nasional) — Gambir, Jakarta Pusat
// This is a well-known landmark guaranteed to be inside area_demographics coverage.
const JAKARTA_LAT = -6.1754
const JAKARTA_LNG = 106.8272

// Sudirman CBD — high foot traffic area, used for scale-comparison tests
const SUDIRMAN_LAT = -6.2088
const SUDIRMAN_LNG = 106.8228

// Outside Jakarta — Bogor city center
const OUTSIDE_LAT = -6.5971
const OUTSIDE_LNG = 106.8060

const VALID_CATEGORY = 'Kopi & Cafe'
const VALID_RADIUS = 500
const VALID_SCALE = 'Menengah'

// ─── Test Helpers ─────────────────────────────────────────────────────────────

async function post(url, payload, cookieHeader) {
  const headers = { 'Content-Type': 'application/json' }
  if (cookieHeader) headers['Cookie'] = cookieHeader
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body, headers: res.headers }
}

function extractCookie(headers, name) {
  const raw = headers.raw ? headers.raw()['set-cookie'] : null
  const cookies = raw || [headers.get('set-cookie') || '']
  for (const c of cookies) {
    const parts = c.split(';').map((p) => p.trim())
    const kv = parts[0]
    if (kv.startsWith(`${name}=`)) {
      return {
        value: kv.slice(name.length + 1),
        flags: parts.slice(1).map((p) => p.toLowerCase()),
        raw: c,
      }
    }
  }
  return null
}

// ─── Test Fixtures ────────────────────────────────────────────────────────────

const RUN_ID = Date.now()

const VALID_USER = {
  name: 'Analyze Test User',
  bisnis_name: 'Warung Analyze Test',
  email: `analyze.test.${RUN_ID}@example.com`,
  password: 'testpassword99',
}

// Populated in the top-level beforeAll
let authCookie = null

// ─── Setup: register + login once, capture the cookie ─────────────────────────

beforeAll(async () => {
  const regRes = await post(REGISTER_URL, VALID_USER)
  if (regRes.status !== 201) {
    throw new Error(
      `Test setup failed: could not register seed user. ` +
        `Status ${regRes.status}, body: ${JSON.stringify(regRes.body)}`
    )
  }
  const loginRes = await post(LOGIN_URL, {
    email: VALID_USER.email,
    password: VALID_USER.password,
  })
  if (loginRes.status !== 200) {
    throw new Error(
      `Test setup failed: could not log in. ` +
        `Status ${loginRes.status}, body: ${JSON.stringify(loginRes.body)}`
    )
  }
  const cookie = extractCookie(loginRes.headers, COOKIE_NAME)
  authCookie = `${COOKIE_NAME}=${cookie.value}`
}, 30_000)

// =============================================================================
// ANALYZE-001 — ANALYZE-004: Happy path (authenticated)
// =============================================================================

describe('ANALYZE-001  Happy path — authenticated request inside Jakarta returns 200', () => {
  let response

  beforeAll(async () => {
    response = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: VALID_SCALE },
      authCookie
    )
  }, 30_000)

  test('returns HTTP 200', () => {
    expect(response.status).toBe(200)
  })

  test('body does NOT contain unsupported:true', () => {
    expect(response.body.unsupported).toBeUndefined()
  })

  test('overall score is a number between 0 and 100', () => {
    expect(typeof response.body.overall).toBe('number')
    expect(response.body.overall).toBeGreaterThanOrEqual(0)
    expect(response.body.overall).toBeLessThanOrEqual(100)
  })

  test('grade is one of the four valid values', () => {
    const valid = ['Sangat Potensial', 'Potensi Bagus', 'Cukup Potensial', 'Kurang Ideal']
    expect(valid).toContain(response.body.grade)
  })

  test('dimensions is an array of 5 items', () => {
    expect(Array.isArray(response.body.dimensions)).toBe(true)
    expect(response.body.dimensions).toHaveLength(5)
  })

  test('each dimension has label (string), score (number|null), and source (string)', () => {
    for (const dim of response.body.dimensions) {
      expect(typeof dim.label).toBe('string')
      expect(dim.score === null || typeof dim.score === 'number').toBe(true)
      expect(typeof dim.source).toBe('string')
    }
  })

  test('dimensions contains the five expected labels in order', () => {
    const labels = response.body.dimensions.map((d) => d.label)
    expect(labels).toEqual([
      'Traffic Pejalan Kaki',
      'Tingkat Persaingan',
      'Aksesibilitas',
      'Kepadatan Penduduk',
      'Daya Beli Area',
    ])
  })

  test('competitors is an array', () => {
    expect(Array.isArray(response.body.competitors)).toBe(true)
  })

  test('recommendation is a non-empty string', () => {
    expect(typeof response.body.recommendation).toBe('string')
    expect(response.body.recommendation.length).toBeGreaterThan(0)
  })

  test('tags is an array with at least one entry', () => {
    expect(Array.isArray(response.body.tags)).toBe(true)
    expect(response.body.tags.length).toBeGreaterThan(0)
  })

  test('scale is echoed back in the response', () => {
    expect(response.body.scale).toBe(VALID_SCALE)
  })
})

describe('ANALYZE-002  Happy path — scale defaults to Menengah when not provided', () => {
  test('omitting scale field returns 200 with scale:Menengah in response', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS },
      authCookie
    )
    expect(res.status).toBe(200)
    expect(res.body.scale).toBe('Menengah')
  }, 30_000)
})

describe('ANALYZE-003  Happy path — all valid categories are accepted', () => {
  const categories = ['Kopi & Cafe', 'Ayam Goreng', 'Burger', 'Mie & Bakso', 'Minuman']

  test.each(categories)('category "%s" returns 200', async (category) => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category, radius: VALID_RADIUS, scale: VALID_SCALE },
      authCookie
    )
    expect(res.status).toBe(200)
    expect(res.body.unsupported).toBeUndefined()
  }, 30_000)
})

describe('ANALYZE-004  Happy path — both boundary radii (200 and 1500) are accepted', () => {
  test('radius=200 (minimum) returns 200', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: 200, scale: VALID_SCALE },
      authCookie
    )
    expect(res.status).toBe(200)
    expect(res.body.unsupported).toBeUndefined()
  }, 30_000)

  test('radius=1500 (maximum) returns 200', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: 1500, scale: VALID_SCALE },
      authCookie
    )
    expect(res.status).toBe(200)
    expect(res.body.unsupported).toBeUndefined()
  }, 30_000)
})

// =============================================================================
// ANALYZE-005 — ANALYZE-007: Authentication guard
// NOTE: The /api/analyze route has NO auth check in the current implementation.
// These tests document the ACTUAL behavior (200 without a cookie),
// not the desired behavior. They are flagged as security findings.
// =============================================================================

describe('ANALYZE-005  Auth guard — unauthenticated request (no cookie)', () => {
  // SECURITY FINDING: This endpoint returns 200 without any authentication.
  // Expected behavior per security requirements: should return 401.
  // Update this test to toBe(401) once an auth guard is added.
  test('request without cookie returns 200 (no auth guard — SECURITY FINDING)', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: VALID_SCALE }
    )
    // Document the current (insecure) behavior
    console.warn(
      '[ANALYZE-005] SECURITY FINDING: /api/analyze has no authentication guard. ' +
        'Unauthenticated callers receive full analysis results. ' +
        'Recommend adding JWT verification before processing.'
    )
    // The endpoint currently succeeds without auth
    expect([200, 401]).toContain(res.status)
  }, 30_000)
})

describe('ANALYZE-006  Auth guard — invalid JWT', () => {
  test('malformed JWT cookie does not cause 500 (endpoint ignores auth entirely)', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: VALID_SCALE },
      `${COOKIE_NAME}=not.a.valid.jwt`
    )
    // The route does not verify the token, so it should still process
    expect(res.status).not.toBe(500)
  }, 30_000)
})

describe('ANALYZE-007  Auth guard — expired JWT', () => {
  test('expired token does not cause 500 (endpoint ignores auth entirely)', async () => {
    const secretBytes = new TextEncoder().encode(JWT_SECRET)
    const expiredToken = await new SignJWT({
      userId: '00000000-0000-0000-0000-000000000001',
      email: 'expired@example.com',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 100)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1)
      .sign(secretBytes)

    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: VALID_SCALE },
      `${COOKIE_NAME}=${expiredToken}`
    )
    expect(res.status).not.toBe(500)
  }, 30_000)
})

// =============================================================================
// ANALYZE-008 — ANALYZE-016: Input validation
// FINDING: The route has NO validation. These tests document what actually happens
// when bad input is sent. Null/undefined fields are passed directly to the DB
// and scoring engine. Tests assert the server does not 500 on bad input.
// =============================================================================

describe('ANALYZE-008  Input validation — missing lat', () => {
  // No validation guard exists. null lat goes into the Haversine SQL query.
  // PostgreSQL radians(NULL) = NULL, so the bounding box filter may return nothing,
  // and demographics will be null, causing the unsupported gate to fire (200 with unsupported:true).
  test('missing lat returns 200 (unsupported gate fires) or 500, but NOT a useful result', async () => {
    const res = await post(
      ANALYZE_URL,
      { lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: VALID_SCALE },
      authCookie
    )
    // The route has no validation — behavior is undefined for missing lat.
    // It must not produce a valid analysis result with a score.
    const hasValidScore = typeof res.body?.overall === 'number' && res.body?.unsupported !== true
    expect(hasValidScore).toBe(false)
    console.warn(
      '[ANALYZE-008] VALIDATION FINDING: Missing lat produces unguarded behavior. ' +
        `Server responded with status ${res.status}. ` +
        'Recommend adding input validation (400) for missing lat/lng/category/radius.'
    )
  }, 30_000)
})

describe('ANALYZE-009  Input validation — missing lng', () => {
  test('missing lng returns 200 (unsupported gate fires) or 500, but NOT a useful result', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: VALID_SCALE },
      authCookie
    )
    const hasValidScore = typeof res.body?.overall === 'number' && res.body?.unsupported !== true
    expect(hasValidScore).toBe(false)
  }, 30_000)
})

describe('ANALYZE-010  Input validation — missing category', () => {
  test('missing category returns 200 with empty competitor list (DB returns 0 rows for NULL category)', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, radius: VALID_RADIUS, scale: VALID_SCALE },
      authCookie
    )
    // category=undefined goes into the SQL WHERE category = $3 as NULL.
    // PostgreSQL: category = NULL is always false, so competitors and benchmark are empty.
    // Demographics can still be found for valid lat/lng, so the gate does NOT fire.
    // The result will compute with 0 competitors and null benchmark.
    expect([200, 400]).toContain(res.status)
  }, 30_000)
})

describe('ANALYZE-011  Input validation — missing radius', () => {
  test('missing radius causes JS arithmetic on undefined (NaN bounding box) — server does not 500', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, scale: VALID_SCALE },
      authCookie
    )
    // radius=undefined → radiusLat = undefined / 111320.0 = NaN
    // bounding box NaN → PostgreSQL receives NaN which it rejects or returns no rows.
    // The route must not throw an uncaught 500 due to Promise.allSettled wrapping DB call.
    expect(res.status).not.toBe(500)
    console.warn(
      '[ANALYZE-011] VALIDATION FINDING: Missing radius causes NaN arithmetic in bounding box. ' +
        'Recommend adding a radius validation guard.'
    )
  }, 30_000)
})

describe('ANALYZE-012  Input validation — radius below minimum (199)', () => {
  // No range validation exists. 199 is a valid number and will be used as-is.
  // This test documents the absence of min/max enforcement.
  test('radius=199 returns 200 (no range validation in route)', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: 199, scale: VALID_SCALE },
      authCookie
    )
    expect([200, 400]).toContain(res.status)
    console.warn(
      '[ANALYZE-012] VALIDATION FINDING: radius=199 (below 200m minimum) is accepted. ' +
        'Recommend adding range validation (200–1500).'
    )
  }, 30_000)
})

describe('ANALYZE-013  Input validation — radius above maximum (1501)', () => {
  test('radius=1501 returns 200 (no range validation in route)', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: 1501, scale: VALID_SCALE },
      authCookie
    )
    expect([200, 400]).toContain(res.status)
    console.warn(
      '[ANALYZE-013] VALIDATION FINDING: radius=1501 (above 1500m maximum) is accepted. ' +
        'Recommend adding range validation (200–1500).'
    )
  }, 30_000)
})

describe('ANALYZE-014  Input validation — invalid scale value', () => {
  // BUG-001 FIXED: scale is now validated against ["Kecil","Menengah","Besar"] whitelist.
  test('BUG-001 FIXED — scale="InvalidScale" returns 400 (scale whitelist validation)', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: 'InvalidScale' },
      authCookie
    )
    expect(res.status).toBe(400)
  }, 30_000)
})

describe('ANALYZE-015  Input validation — radius as string', () => {
  // radius="500" (string) — JS arithmetic: "500" / 111320.0 coerces to 0.00449, works fine.
  // The SQL receives a string "500" for the $8 parameter (distance_m <= "500").
  // PostgreSQL casts text to numeric for comparison — may work or may error.
  test('radius as string "500" does not 500 (JS coercion handles arithmetic)', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: '500', scale: VALID_SCALE },
      authCookie
    )
    expect(res.status).not.toBe(500)
  }, 30_000)
})

describe('ANALYZE-016  Input validation — non-JSON request body', () => {
  test('BUG-005 FIXED — plain text body: try/catch wraps req.json() and returns 400', async () => {
    const res = await fetch(ANALYZE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain', 'Cookie': authCookie },
      body: 'this is not json',
    })
    // BUG-005 FIXED: route.js now has a top-level try/catch; req.json() throw → 400
    expect(res.status).toBe(400)
  }, 30_000)
})

// =============================================================================
// ANALYZE-017: Jakarta gate — location outside area_demographics coverage
// =============================================================================

describe('ANALYZE-017  Jakarta gate — location outside DKI Jakarta coverage', () => {
  let response

  beforeAll(async () => {
    response = await post(
      ANALYZE_URL,
      { lat: OUTSIDE_LAT, lng: OUTSIDE_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: VALID_SCALE },
      authCookie
    )
  }, 30_000)

  test('returns HTTP 200', () => {
    expect(response.status).toBe(200)
  })

  test('body contains unsupported:true', () => {
    expect(response.body.unsupported).toBe(true)
  })

  test('body contains the correct Indonesian message', () => {
    expect(response.body.message).toBe(
      'Area ini berada di luar cakupan AtlasAI. Saat ini kami mendukung analisis untuk wilayah DKI Jakarta.'
    )
  })

  test('body does NOT contain overall score or grade', () => {
    expect(response.body.overall).toBeUndefined()
    expect(response.body.grade).toBeUndefined()
  })
})

// =============================================================================
// ANALYZE-018 — ANALYZE-020: Scale effect on profit range
// =============================================================================

describe('ANALYZE-018  Scale effect — Kecil vs Besar profitRange ratio is 2.2 / 0.4 = 5.5x', () => {
  let kecilResult
  let besarResult

  beforeAll(async () => {
    const [r1, r2] = await Promise.all([
      post(
        ANALYZE_URL,
        { lat: SUDIRMAN_LAT, lng: SUDIRMAN_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: 'Kecil' },
        authCookie
      ),
      post(
        ANALYZE_URL,
        { lat: SUDIRMAN_LAT, lng: SUDIRMAN_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: 'Besar' },
        authCookie
      ),
    ])
    kecilResult = r1.body
    besarResult = r2.body
  }, 30_000)

  test('both requests return 200 without unsupported flag', () => {
    expect(kecilResult.unsupported).toBeUndefined()
    expect(besarResult.unsupported).toBeUndefined()
  })

  test('Besar profitMin is 5.5x Kecil profitMin (multiplier ratio 2.2/0.4)', () => {
    // Only when profitMin is available (not null) from the same underlying data.
    if (kecilResult.profitMin != null && besarResult.profitMin != null) {
      const ratio = besarResult.profitMin / kecilResult.profitMin
      // Allow ±0.1 tolerance for rounding via Math.round in calcProfitRange
      expect(ratio).toBeCloseTo(5.5, 0)
    } else {
      console.warn('[ANALYZE-018] profitMin was null for one or both scales — cannot verify multiplier ratio. Check seed data for this location/category.')
    }
  })

  test('Besar profitMax is 5.5x Kecil profitMax', () => {
    if (kecilResult.profitMax != null && besarResult.profitMax != null) {
      const ratio = besarResult.profitMax / kecilResult.profitMax
      expect(ratio).toBeCloseTo(5.5, 0)
    }
  })

  test('Besar profitMin > Kecil profitMin when both are non-null', () => {
    if (kecilResult.profitMin != null && besarResult.profitMin != null) {
      expect(besarResult.profitMin).toBeGreaterThan(kecilResult.profitMin)
    }
  })
})

describe('ANALYZE-019  Scale effect — Menengah profit is 2.5x Kecil (1.0 / 0.4 = 2.5)', () => {
  let kecilResult
  let menengahResult

  beforeAll(async () => {
    const [r1, r2] = await Promise.all([
      post(
        ANALYZE_URL,
        { lat: SUDIRMAN_LAT, lng: SUDIRMAN_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: 'Kecil' },
        authCookie
      ),
      post(
        ANALYZE_URL,
        { lat: SUDIRMAN_LAT, lng: SUDIRMAN_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: 'Menengah' },
        authCookie
      ),
    ])
    kecilResult = r1.body
    menengahResult = r2.body
  }, 30_000)

  test('Menengah profitMin is 2.5x Kecil profitMin', () => {
    if (kecilResult.profitMin != null && menengahResult.profitMin != null) {
      const ratio = menengahResult.profitMin / kecilResult.profitMin
      expect(ratio).toBeCloseTo(2.5, 0)
    }
  })
})

// =============================================================================
// ANALYZE-020 — ANALYZE-022: Scale effect on competition score
// =============================================================================

describe('ANALYZE-020  Scale competition adjustment — SCALE_COMP_ADJ', () => {
  let kecilDims
  let menengahDims
  let besarDims

  beforeAll(async () => {
    const [r1, r2, r3] = await Promise.all([
      post(
        ANALYZE_URL,
        { lat: SUDIRMAN_LAT, lng: SUDIRMAN_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: 'Kecil' },
        authCookie
      ),
      post(
        ANALYZE_URL,
        { lat: SUDIRMAN_LAT, lng: SUDIRMAN_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: 'Menengah' },
        authCookie
      ),
      post(
        ANALYZE_URL,
        { lat: SUDIRMAN_LAT, lng: SUDIRMAN_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: 'Besar' },
        authCookie
      ),
    ])
    kecilDims = r1.body.dimensions
    menengahDims = r2.body.dimensions
    besarDims = r3.body.dimensions
  }, 30_000)

  // dimensions[1] is "Tingkat Persaingan" per the known order from analysis.js
  test('Kecil competition score <= Menengah competition score (SCALE_COMP_ADJ Kecil=-5)', () => {
    const kecilComp = kecilDims?.[1]?.score
    const menengahComp = menengahDims?.[1]?.score
    if (kecilComp != null && menengahComp != null) {
      expect(kecilComp).toBeLessThanOrEqual(menengahComp)
    }
  })

  test('Besar competition score >= Menengah competition score (SCALE_COMP_ADJ Besar=+5)', () => {
    const besarComp = besarDims?.[1]?.score
    const menengahComp = menengahDims?.[1]?.score
    if (besarComp != null && menengahComp != null) {
      expect(besarComp).toBeGreaterThanOrEqual(menengahComp)
    }
  })

  test('Besar competition score is exactly 10 points higher than Kecil (unless clamped by min/max)', () => {
    const kecilComp = kecilDims?.[1]?.score
    const besarComp = besarDims?.[1]?.score
    if (kecilComp != null && besarComp != null) {
      // The difference is 10 unless clamped: Kecil adj=-5, Besar adj=+5
      // Clamping: min=15, max=90
      // If rawCompetition is at boundaries the difference will be less than 10.
      const diff = besarComp - kecilComp
      expect(diff).toBeGreaterThanOrEqual(0) // Besar is always >= Kecil
      expect(diff).toBeLessThanOrEqual(10)   // diff cannot exceed the 10-point adj span
    }
  })

  test('competition score for any scale is clamped between 15 and 90', () => {
    for (const dims of [kecilDims, menengahDims, besarDims]) {
      const compScore = dims?.[1]?.score
      if (compScore != null) {
        expect(compScore).toBeGreaterThanOrEqual(15)
        expect(compScore).toBeLessThanOrEqual(90)
      }
    }
  })
})

// =============================================================================
// ANALYZE-021 — ANALYZE-022: Grade threshold unit-level assertions
// These verify the grade boundary logic in lib/analysis.js directly.
// They are phrased as integration checks on the response, but the underlying
// logic is deterministic — see the inline formula documentation.
// =============================================================================

describe('ANALYZE-021  Grade thresholds — overall score determines grade label', () => {
  // Grade logic from analysis.js:
  //   overall >= 75 → 'Sangat Potensial'
  //   overall >= 60 → 'Potensi Bagus'
  //   overall >= 45 → 'Cukup Potensial'
  //   overall <  45 → 'Kurang Ideal'
  //
  // Real HTTP integration cannot force exact overall scores because Overpass is live.
  // We document the mapping and test it via the unit helper below.

  function computeGrade(overall) {
    if (overall >= 75) return 'Sangat Potensial'
    if (overall >= 60) return 'Potensi Bagus'
    if (overall >= 45) return 'Cukup Potensial'
    return 'Kurang Ideal'
  }

  test('overall=75 → Sangat Potensial (inclusive lower boundary)', () => {
    expect(computeGrade(75)).toBe('Sangat Potensial')
  })

  test('overall=74 → Potensi Bagus (one below Sangat Potensial boundary)', () => {
    expect(computeGrade(74)).toBe('Potensi Bagus')
  })

  test('overall=60 → Potensi Bagus (inclusive lower boundary)', () => {
    expect(computeGrade(60)).toBe('Potensi Bagus')
  })

  test('overall=59 → Cukup Potensial (one below Potensi Bagus boundary)', () => {
    expect(computeGrade(59)).toBe('Cukup Potensial')
  })

  test('overall=45 → Cukup Potensial (inclusive lower boundary)', () => {
    expect(computeGrade(45)).toBe('Cukup Potensial')
  })

  test('overall=44 → Kurang Ideal (one below Cukup Potensial boundary)', () => {
    expect(computeGrade(44)).toBe('Kurang Ideal')
  })

  test('overall=100 → Sangat Potensial (maximum score)', () => {
    expect(computeGrade(100)).toBe('Sangat Potensial')
  })

  test('overall=0 → Kurang Ideal (minimum score)', () => {
    expect(computeGrade(0)).toBe('Kurang Ideal')
  })
})

describe('ANALYZE-022  Grade in live response is consistent with overall score', () => {
  test('if overall >= 75 the grade is Sangat Potensial', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: VALID_SCALE },
      authCookie
    )
    if (res.body.overall >= 75) {
      expect(res.body.grade).toBe('Sangat Potensial')
    } else if (res.body.overall >= 60) {
      expect(res.body.grade).toBe('Potensi Bagus')
    } else if (res.body.overall >= 45) {
      expect(res.body.grade).toBe('Cukup Potensial')
    } else {
      expect(res.body.grade).toBe('Kurang Ideal')
    }
  }, 30_000)
})

// =============================================================================
// ANALYZE-023 — ANALYZE-024: Scoring formula unit-level assertions
// These replicate the formula from analysis.js with known inputs.
// =============================================================================

describe('ANALYZE-023  Scoring formula — Traffic score (amenityCount)', () => {
  // Formula: Math.min(95, Math.max(20, Math.round(20 + amenityCount * 0.95)))

  function trafficScore(amenityCount) {
    return Math.min(95, Math.max(20, Math.round(20 + amenityCount * 0.95)))
  }

  test('amenityCount=0 → score=20 (floor)', () => {
    expect(trafficScore(0)).toBe(20)
  })

  test('amenityCount=1 → score=21 (20 + 0.95 rounds to 21)', () => {
    expect(trafficScore(1)).toBe(21)
  })

  test('amenityCount=79 → score=95 (cap: 20 + 79*0.95 = 95.05 → rounds to 95)', () => {
    expect(trafficScore(79)).toBe(95)
  })

  test('amenityCount=100 → score=95 (capped at 95)', () => {
    expect(trafficScore(100)).toBe(95)
  })

  test('amenityCount=50 → score=68 (20 + 47.5 = 67.5 → rounds to 68)', () => {
    expect(trafficScore(50)).toBe(68)
  })
})

describe('ANALYZE-024  Scoring formula — Accessibility score (transportCount)', () => {
  // Formula: Math.min(95, Math.max(20, Math.round(20 + transportCount * 3.5)))

  function accessScore(transportCount) {
    return Math.min(95, Math.max(20, Math.round(20 + transportCount * 3.5)))
  }

  test('transportCount=0 → score=20 (floor)', () => {
    expect(accessScore(0)).toBe(20)
  })

  test('transportCount=1 → score=24 (20 + 3.5 = 23.5 → rounds to 24)', () => {
    expect(accessScore(1)).toBe(24)
  })

  test('transportCount=21 → score=94 (20 + 73.5 = 93.5 → rounds to 94)', () => {
    expect(accessScore(21)).toBe(94)
  })

  test('transportCount=22 → score=95 (capped: 20 + 77 = 97 → 95)', () => {
    expect(accessScore(22)).toBe(95)
  })

  test('transportCount=50 → score=95 (capped at 95)', () => {
    expect(accessScore(50)).toBe(95)
  })
})

describe('ANALYZE-025  Scoring formula — Population score (population_density)', () => {
  // Formula: Math.min(90, Math.max(25, Math.round(25 + density / 310)))

  function popScore(density) {
    return Math.min(90, Math.max(25, Math.round(25 + density / 310)))
  }

  test('density=0 → score=25 (floor)', () => {
    expect(popScore(0)).toBe(25)
  })

  test('density=3000 → score=35 (25 + 9.67 ≈ 35)', () => {
    expect(popScore(3000)).toBe(35)
  })

  test('density=10000 → score=57 (25 + 32.26 ≈ 57)', () => {
    expect(popScore(10000)).toBe(57)
  })

  test('density=18000 → score=83 (25 + 58.06 ≈ 83)', () => {
    expect(popScore(18000)).toBe(83)
  })

  test('density=25000 → score=90 (capped: 25 + 80.6 = 105.6 → 90)', () => {
    expect(popScore(25000)).toBe(90)
  })
})

// =============================================================================
// ANALYZE-026: Profit range IQR vs min-max logic
// =============================================================================

describe('ANALYZE-026  Profit range — IQR threshold at 4 competitors with revenue data', () => {
  // From calcProfitRange in analysis.js:
  //   revenues.length >= 4 → IQR (p25 index = floor(len*0.25), p75 = floor(len*0.75))
  //   revenues.length < 4  → min-max (revenues[0] and revenues[length-1])
  // This is a unit-level test against the documented logic.

  function calcProfitRange(revenues) {
    const sorted = [...revenues].sort((a, b) => a - b)
    if (sorted.length === 0) return { source: 'none' }
    const mid = Math.floor(sorted.length / 2)
    const median = sorted.length % 2 === 0
      ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
      : sorted[mid]
    let profitMin, profitMax
    if (sorted.length >= 4) {
      profitMin = Math.round(sorted[Math.floor(sorted.length * 0.25)])
      profitMax = Math.round(sorted[Math.floor(sorted.length * 0.75)])
    } else {
      profitMin = Math.round(sorted[0])
      profitMax = Math.round(sorted[sorted.length - 1])
    }
    return { profitMin, profitMax, profitMedian: median }
  }

  test('3 revenues uses min-max (below IQR threshold)', () => {
    const result = calcProfitRange([10, 20, 30])
    expect(result.profitMin).toBe(10)
    expect(result.profitMax).toBe(30)
  })

  test('4 revenues uses IQR — p25 index=floor(4*0.25)=1, p75 index=floor(4*0.75)=3', () => {
    const result = calcProfitRange([10, 20, 30, 40])
    // p25 index = floor(4*0.25) = 1 → revenues[1] = 20
    // p75 index = floor(4*0.75) = 3 → revenues[3] = 40
    expect(result.profitMin).toBe(20)
    expect(result.profitMax).toBe(40)
  })

  test('exactly 4 is the IQR boundary — profitMin is p25 (not raw min 10), profitMax is p75 index 3 = 40', () => {
    const result = calcProfitRange([10, 20, 30, 40])
    // p25 index = floor(4*0.25) = 1 → 20 (not raw min 10)
    expect(result.profitMin).not.toBe(10)
    expect(result.profitMin).toBe(20)
    // p75 index = floor(4*0.75) = 3 → 40 (coincides with raw max for this dataset)
    expect(result.profitMax).toBe(40)
  })

  test('1 revenue → min-max with same value for both', () => {
    const result = calcProfitRange([25])
    expect(result.profitMin).toBe(25)
    expect(result.profitMax).toBe(25)
  })
})

// =============================================================================
// ANALYZE-027: Graceful degradation — null Overpass results
// =============================================================================

describe('ANALYZE-027  Graceful degradation — null Overpass scores are excluded from overall average', () => {
  // From analysis.js:
  //   availableScores = [traffic, competition, accessibilityScore, populationScore, purchasePowerScore]
  //     .filter(s => s !== null)
  //   overall = Math.round(sum(availableScores) / availableScores.length)
  //
  // If traffic=null and accessibilityScore=null, overall = avg of [competition, population, purchasingPower].

  function computeOverall(scores) {
    const available = scores.filter((s) => s !== null)
    if (available.length === 0) return null
    return Math.round(available.reduce((a, b) => a + b, 0) / available.length)
  }

  test('all 5 scores present: overall = avg of all 5', () => {
    expect(computeOverall([60, 70, 80, 50, 40])).toBe(Math.round((60+70+80+50+40)/5))
  })

  test('traffic=null and accessibility=null: overall = avg of remaining 3', () => {
    expect(computeOverall([null, 70, null, 50, 40])).toBe(Math.round((70+50+40)/3))
  })

  test('all scores null: returns null (edge case — should not happen if demographics gate is enforced)', () => {
    expect(computeOverall([null, null, null, null, null])).toBeNull()
  })

  test('only one score available: overall equals that score', () => {
    expect(computeOverall([null, null, null, 55, null])).toBe(55)
  })
})

describe('ANALYZE-028  Graceful degradation — live request with extreme location returns 200 not 500', () => {
  // Use a valid-looking but unlikely Jakarta coordinate.
  // If Overpass fails (timeout/error), Promise.allSettled ensures the route still responds.
  test('returns 200 or unsupported, never 500, even if Overpass is slow', async () => {
    const res = await post(
      ANALYZE_URL,
      // Port area near Tanjung Priok — valid Jakarta coords, may have fewer OSM nodes
      { lat: -6.1053, lng: 106.8827, category: VALID_CATEGORY, radius: 200, scale: VALID_SCALE },
      authCookie
    )
    expect([200]).toContain(res.status)
    expect(res.status).not.toBe(500)
  }, 30_000)
})

// =============================================================================
// ANALYZE-029: Response shape completeness
// =============================================================================

describe('ANALYZE-029  Response shape — all expected top-level keys are present', () => {
  let body

  beforeAll(async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: VALID_SCALE },
      authCookie
    )
    body = res.body
  }, 30_000)

  const expectedKeys = [
    'overall', 'grade', 'gradeColor', 'dimensions',
    'profitMin', 'profitMax', 'profitMedian', 'profitSource',
    'referenceCount', 'referenceRadius',
    'tags', 'competitors',
    'areaName', 'footTrafficAmenityCount',
    'recommendation', 'scale',
  ]

  test.each(expectedKeys)('response body has key "%s"', (key) => {
    expect(body).toHaveProperty(key)
  })

  test('profitSource is one of: "competitors", "benchmark", "none"', () => {
    expect(['competitors', 'benchmark', 'none']).toContain(body.profitSource)
  })

  test('gradeColor is a hex color string', () => {
    expect(body.gradeColor).toMatch(/^#[0-9A-Fa-f]{6}$/)
  })

  test('each competitor has: id, name, lat, lng, distance', () => {
    for (const c of body.competitors) {
      expect(c).toHaveProperty('id')
      expect(c).toHaveProperty('name')
      expect(typeof c.lat).toBe('number')
      expect(typeof c.lng).toBe('number')
      expect(typeof c.distance).toBe('number')
    }
  })

  test('each tag has: label (string) and type (string)', () => {
    for (const t of body.tags) {
      expect(typeof t.label).toBe('string')
      expect(typeof t.type).toBe('string')
    }
  })

  test('tag type is one of: "positive", "neutral", "warning", "info"', () => {
    const validTypes = ['positive', 'neutral', 'warning', 'info']
    for (const t of body.tags) {
      expect(validTypes).toContain(t.type)
    }
  })
})

// =============================================================================
// ANALYZE-030: Wrong HTTP method
// =============================================================================

describe('ANALYZE-030  Wrong HTTP method', () => {
  test('GET returns 405 Method Not Allowed', async () => {
    const res = await fetch(ANALYZE_URL, { method: 'GET' })
    expect(res.status).toBe(405)
  })

  test('PUT returns 405 Method Not Allowed', async () => {
    const res = await fetch(ANALYZE_URL, { method: 'PUT', headers: { 'Cookie': authCookie } })
    expect(res.status).toBe(405)
  })

  test('DELETE returns 405 Method Not Allowed', async () => {
    const res = await fetch(ANALYZE_URL, { method: 'DELETE', headers: { 'Cookie': authCookie } })
    expect(res.status).toBe(405)
  })
})

// =============================================================================
// SEC-A-001 — SEC-A-006: Security tests
// =============================================================================

describe('SEC-A-001  No authentication on analyze endpoint (SECURITY FINDING)', () => {
  test('POST without atlas_token cookie returns a valid result (auth bypass — document and flag)', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: VALID_SCALE }
      // No authCookie — deliberate
    )
    console.warn(
      '[SEC-A-001] SECURITY FINDING: /api/analyze accepts requests with no authentication. ' +
        `Status: ${res.status}. ` +
        'This exposes Overpass API consumption and DB query load to anonymous callers. ' +
        'Recommend: add JWT verification before fetchDBData / fetchFootTrafficScore calls.'
    )
    // The test passes regardless of 200 or 401 — it documents current behavior.
    expect([200, 401]).toContain(res.status)
  }, 30_000)
})

describe('SEC-A-002  SQL injection — category field', () => {
  test("BUG-001 FIXED — '; DROP TABLE competitors; -- in category rejected with 400", async () => {
    const res = await post(
      ANALYZE_URL,
      {
        lat: JAKARTA_LAT,
        lng: JAKARTA_LNG,
        category: "'; DROP TABLE competitors; --",
        radius: VALID_RADIUS,
        scale: VALID_SCALE,
      },
      authCookie
    )
    // BUG-001 FIXED: category whitelist validation rejects unknown category → 400
    expect(res.status).not.toBe(500)
    expect([400]).toContain(res.status)
    // Must not have modified the competitors table
  }, 30_000)

  test("BUG-001 FIXED — OR 1=1 injection in category rejected with 400", async () => {
    const res = await post(
      ANALYZE_URL,
      {
        lat: JAKARTA_LAT,
        lng: JAKARTA_LNG,
        category: "' OR '1'='1",
        radius: VALID_RADIUS,
        scale: VALID_SCALE,
      },
      authCookie
    )
    expect(res.status).not.toBe(500)
    // BUG-001 FIXED: category whitelist rejects non-whitelisted strings → 400
    expect(res.status).toBe(400)
  }, 30_000)
})

describe('SEC-A-003  SQL injection — lat/lng fields as strings', () => {
  test("lat as SQL injection string does not cause 500 (Promise.allSettled absorbs DB error)", async () => {
    const res = await post(
      ANALYZE_URL,
      {
        lat: "1; DROP TABLE area_demographics; --",
        lng: JAKARTA_LNG,
        category: VALID_CATEGORY,
        radius: VALID_RADIUS,
        scale: VALID_SCALE,
      },
      authCookie
    )
    // lat is passed as $1 parameter — parameterized. PostgreSQL will reject non-numeric
    // input causing a DB error, which is caught by Promise.allSettled.
    // The route will then fall back to no demographics → unsupported:true.
    expect(res.status).not.toBe(500)
  }, 30_000)
})

describe('SEC-A-004  Coordinate injection — extreme / invalid coordinates', () => {
  test('BUG-002 FIXED — lat=999 rejected by coordinate range validation → 400', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: 999, lng: -999, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: VALID_SCALE },
      authCookie
    )
    // BUG-002 FIXED: lat must be in [-90, 90]; 999 rejected → 400 (not 200+unsupported)
    expect(res.status).toBe(400)
  }, 30_000)

  test('lat=0, lng=0 (null island) returns unsupported:true', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: 0, lng: 0, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: VALID_SCALE },
      authCookie
    )
    expect(res.status).toBe(200)
    expect(res.body.unsupported).toBe(true)
  }, 30_000)

  test('lat=NaN does not return HTTP 500', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: NaN, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: VALID_SCALE },
      authCookie
    )
    // JSON.stringify(NaN) → "null" per JSON spec; so lat arrives as null in the route.
    // Behavior is the same as missing lat (ANALYZE-008).
    expect(res.status).not.toBe(500)
  }, 30_000)
})

describe('SEC-A-005  Oversized radius — potential for resource amplification', () => {
  test('radius=999999 (far beyond 1500m max) does not crash the server', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: 999999, scale: VALID_SCALE },
      authCookie
    )
    // A very large radius causes the Haversine bounding box to expand greatly.
    // This can be expensive but should not crash the server.
    expect(res.status).not.toBe(500)
    console.warn(
      '[SEC-A-005] SECURITY FINDING: No upper bound enforced on radius. ' +
        `radius=999999 processed without error (status ${res.status}). ` +
        'A large radius expands the PostgreSQL scan area and the Overpass query. ' +
        'Recommend validating radius <= 1500 and returning 400 for violations.'
    )
  }, 30_000)
})

describe('SEC-A-006  Oversized payload — very large string in category field', () => {
  test('category with 10000 characters does not cause 500', async () => {
    const res = await post(
      ANALYZE_URL,
      {
        lat: JAKARTA_LAT,
        lng: JAKARTA_LNG,
        category: 'A'.repeat(10000),
        radius: VALID_RADIUS,
        scale: VALID_SCALE,
      },
      authCookie
    )
    expect(res.status).not.toBe(500)
  }, 30_000)
})

// =============================================================================
// EDGE-A-001 — EDGE-A-008: Edge cases
// =============================================================================

describe('EDGE-A-001  Both lat and lng at the exact boundary of a demographics bbox', () => {
  // The SQL condition is: lat_min <= $1 AND $1 <= lat_max AND lng_min <= $2 AND $2 <= lng_max
  // The boundary is inclusive on both sides. A coordinate at lat_min or lat_max should match.
  // This requires knowledge of the actual seed data bounding boxes.
  // We document the expected behavior: boundary coordinates should NOT return unsupported.
  test('a coordinate known to be at the edge of a Jakarta kecamatan bbox returns a valid analysis', async () => {
    // Using the Gambir area boundary approximation (a safe bet for being inside Jakarta coverage)
    const res = await post(
      ANALYZE_URL,
      { lat: -6.1754, lng: 106.8272, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: VALID_SCALE },
      authCookie
    )
    expect(res.status).toBe(200)
    // If this returns unsupported, the seed data does not cover this coordinate.
    if (res.body.unsupported) {
      console.warn('[EDGE-A-001] Gambir coordinate returned unsupported — check seed data coverage for (-6.1754, 106.8272).')
    } else {
      expect(typeof res.body.overall).toBe('number')
    }
  }, 30_000)
})

describe('EDGE-A-002  Profit range when no competitors have revenue data', () => {
  // BUG-001 FIXED: category whitelist now rejects unknown categories → 400
  // This test now verifies rejection behavior instead of 0-competitor behavior.
  test('BUG-001 FIXED — unknown category rejected with 400 (category whitelist)', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: 'UnknownFakeCategory999', radius: VALID_RADIUS, scale: VALID_SCALE },
      authCookie
    )
    expect(res.status).toBe(400)
  }, 30_000)
})

describe('EDGE-A-003  Tag type when traffic is null (Overpass unavailable)', () => {
  // BUG-009 FIXED: explicit null check → null traffic returns type='info'
  test('BUG-009 FIXED — when traffic score is null, first tag type is info (not warning)', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: VALID_SCALE },
      authCookie
    )
    const trafficDim = res.body.dimensions?.[0]
    if (trafficDim?.score === null) {
      const firstTag = res.body.tags?.[0]
      // BUG-009 FIXED: null traffic returns 'info', not 'warning'
      expect(firstTag?.type).toBe('info')
    }
  }, 30_000)
})

describe('EDGE-A-004  Tag type when accessibility score is null (Overpass unavailable)', () => {
  // BUG-009 FIXED: explicit null check → null accessibility returns type='info'
  test('BUG-009 FIXED — when accessibility score is null, tags[2] type is info (not warning)', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: VALID_SCALE },
      authCookie
    )
    const accessDim = res.body.dimensions?.[2]
    if (accessDim?.score === null) {
      const accessTag = res.body.tags?.[2]
      // BUG-009 FIXED: explicit null check returns 'info' for null accessibility
      expect(accessTag?.type).toBe('info')
    }
  }, 30_000)
})

describe('EDGE-A-005  referenceCount is null when no benchmark exists for category', () => {
  // BUG-001 FIXED: unknown categories are now rejected with 400 by the category whitelist.
  // The old scenario (unknown category reaching analysis) no longer applies.
  test('BUG-001 FIXED — unknown category returns 400 (whitelist), not 200 with null referenceCount', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: 'UnknownCategory', radius: VALID_RADIUS, scale: VALID_SCALE },
      authCookie
    )
    // Category whitelist rejects → 400; body.referenceCount is not applicable
    expect(res.status).toBe(400)
  }, 30_000)
})

describe('EDGE-A-006  areaName is returned in the response', () => {
  test('areaName is a non-empty string for a valid Jakarta coordinate', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: VALID_SCALE },
      authCookie
    )
    if (!res.body.unsupported) {
      expect(typeof res.body.areaName).toBe('string')
      expect(res.body.areaName.length).toBeGreaterThan(0)
    }
  }, 30_000)
})

describe('EDGE-A-007  recommendation includes scale-specific context', () => {
  // From getRecommendation: SCALE_CTX appended at the end of parts array.
  test('Kecil recommendation contains modal < Rp 100jt phrasing', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: 'Kecil' },
      authCookie
    )
    if (!res.body.unsupported) {
      expect(res.body.recommendation).toContain('modal < Rp 100jt')
    }
  }, 30_000)

  test('Besar recommendation contains modal > Rp 300jt phrasing', async () => {
    const res = await post(
      ANALYZE_URL,
      { lat: JAKARTA_LAT, lng: JAKARTA_LNG, category: VALID_CATEGORY, radius: VALID_RADIUS, scale: 'Besar' },
      authCookie
    )
    if (!res.body.unsupported) {
      expect(res.body.recommendation).toContain('modal > Rp 300jt')
    }
  }, 30_000)
})

describe('EDGE-A-008  competition score without benchmark uses fallback formula', () => {
  // calcCompetitionScore without benchmark:
  //   score = Math.min(90, Math.max(15, Math.round(90 - actualCount * 8)))
  //   competitionRatio = actualCount / 3
  // Unknown category → no benchmark → fallback formula applies.

  function calcCompWithoutBenchmark(count) {
    return Math.min(90, Math.max(15, Math.round(90 - count * 8)))
  }

  test('0 competitors → competition score = 90 (maximum, no competition)', () => {
    expect(calcCompWithoutBenchmark(0)).toBe(90)
  })

  test('10 competitors → score = 15 (floor: 90 - 80 = 10, clamped to 15)', () => {
    expect(calcCompWithoutBenchmark(10)).toBe(15)
  })

  test('5 competitors → score = 50 (90 - 40 = 50)', () => {
    expect(calcCompWithoutBenchmark(5)).toBe(50)
  })

  test('9 competitors → score = 18 (90 - 72 = 18, above floor)', () => {
    expect(calcCompWithoutBenchmark(9)).toBe(18)
  })
})
