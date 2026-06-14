// Test Suite — POST /api/auth/login
//
// Source analyzed:
//   app/api/auth/login/route.js  |  lib/auth.js  |  lib/entities/UserSchema.ts
//
// Prerequisites (devDependencies):
//   npm install --save-dev jest jest-environment-node node-fetch@2
//
// package.json "jest" config:
//   { "testEnvironment": "node", "testMatch": ["tests/**/*.test.js"],
//     "transform": {}, "extensionsToTreatAsEsm": [".js"] }
//
// Run (ESM mode):
//   NODE_OPTIONS=--experimental-vm-modules npx jest tests/api/auth/login.test.js
//
// The Next.js dev server must be running at TEST_BASE_URL (default http://localhost:3000).
// DATABASE_URL and JWT_SECRET must match the running server's environment.

import fetch from 'node-fetch'
import { jwtVerify, SignJWT } from 'jose'

// ─── Configuration ────────────────────────────────────────────────────────────

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
const LOGIN_URL = `${BASE_URL}/api/auth/login`
const REGISTER_URL = `${BASE_URL}/api/auth/register`
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-32-chars-minimum-here'
const COOKIE_NAME = 'atlas_token'

// ─── Test Helpers ─────────────────────────────────────────────────────────────

/**
 * POST JSON to a URL and return { status, body, headers }.
 * Throws only on network-level failures (not on 4xx/5xx).
 */
async function post(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body, headers: res.headers }
}

/**
 * Extract the value of a named cookie from a Set-Cookie header string array.
 * node-fetch collapses Set-Cookie into a single comma-joined string in some versions;
 * we iterate the raw header.
 */
function extractCookie(headers, name) {
  // node-fetch v2 does not expose multiple Set-Cookie via headers.get();
  // use headers.raw() if available, otherwise fall back.
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

/**
 * Decode a JWT without verifying signature — returns { header, payload }.
 * Used only to inspect structure; signature tests use jwtVerify separately.
 */
function decodeJwtUnsafe(token) {
  const [headerB64, payloadB64] = token.split('.')
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'))
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
  return { header, payload }
}

// ─── Test Fixtures ────────────────────────────────────────────────────────────

/**
 * A unique suffix for this test run so we can register fresh users
 * without colliding with prior runs in a shared DB.
 */
const RUN_ID = Date.now()

const VALID_USER = {
  name: 'Login Test User',
  bisnis_name: 'Warung Test',
  email: `login.test.${RUN_ID}@example.com`,
  password: 'testpassword99',
}

// ─── Setup: register the valid user once before all login tests ───────────────

beforeAll(async () => {
  const { status, body } = await post(REGISTER_URL, VALID_USER)
  if (status !== 201) {
    throw new Error(
      `Test setup failed: could not register seed user. ` +
        `Status ${status}, body: ${JSON.stringify(body)}`
    )
  }
}, 30_000) // bcrypt is slow; allow 30 s

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-L-001 — AUTH-L-004: Happy path
// ─────────────────────────────────────────────────────────────────────────────

describe('AUTH-L-001  Happy path — valid credentials', () => {
  let response

  beforeAll(async () => {
    response = await post(LOGIN_URL, {
      email: VALID_USER.email,
      password: VALID_USER.password,
    })
  }, 30_000)

  test('returns HTTP 200', () => {
    expect(response.status).toBe(200)
  })

  test('body contains ok: true', () => {
    expect(response.body.ok).toBe(true)
  })

  test('body contains user object with id, name, bisnis_name, email', () => {
    const { user } = response.body
    expect(user).toBeDefined()
    expect(typeof user.id).toBe('string')
    expect(user.name).toBe(VALID_USER.name)
    expect(user.bisnis_name).toBe(VALID_USER.bisnis_name)
    expect(user.email).toBe(VALID_USER.email.toLowerCase())
  })

  test('response body does NOT contain password or password_hash', () => {
    const bodyStr = JSON.stringify(response.body)
    expect(bodyStr).not.toContain('password_hash')
    expect(bodyStr).not.toContain('"password"')
  })

  test('Set-Cookie header contains atlas_token', () => {
    const cookie = extractCookie(response.headers, COOKIE_NAME)
    expect(cookie).not.toBeNull()
    expect(cookie.value.length).toBeGreaterThan(20) // JWT is never this short
  })

  test('atlas_token cookie is HttpOnly', () => {
    const cookie = extractCookie(response.headers, COOKIE_NAME)
    expect(cookie.flags).toContain('httponly')
  })

  test('atlas_token cookie has SameSite=Lax', () => {
    const cookie = extractCookie(response.headers, COOKIE_NAME)
    expect(cookie.flags.join(';')).toContain('samesite=lax')
  })

  test('atlas_token cookie has Path=/', () => {
    const cookie = extractCookie(response.headers, COOKIE_NAME)
    expect(cookie.flags.join(';')).toContain('path=/')
  })

  test('atlas_token cookie has Max-Age=604800 (7 days)', () => {
    const cookie = extractCookie(response.headers, COOKIE_NAME)
    expect(cookie.flags.join(';')).toContain('max-age=604800')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-L-002: JWT structure and claims
// ─────────────────────────────────────────────────────────────────────────────

describe('AUTH-L-002  JWT token structure and claims', () => {
  let token
  let decoded

  beforeAll(async () => {
    const res = await post(LOGIN_URL, {
      email: VALID_USER.email,
      password: VALID_USER.password,
    })
    const cookie = extractCookie(res.headers, COOKIE_NAME)
    token = cookie?.value
    if (token) decoded = decodeJwtUnsafe(token)
  }, 30_000)

  test('JWT header algorithm is HS256', () => {
    expect(decoded.header.alg).toBe('HS256')
  })

  test('JWT header typ is JWT', () => {
    expect(decoded.header.typ).toBe('JWT')
  })

  test('JWT payload contains userId claim (UUID string)', () => {
    expect(typeof decoded.payload.userId).toBe('string')
    expect(decoded.payload.userId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
  })

  test('JWT payload email matches registered email (lowercased)', () => {
    expect(decoded.payload.email).toBe(VALID_USER.email.toLowerCase())
  })

  test('JWT payload name matches registered name', () => {
    expect(decoded.payload.name).toBe(VALID_USER.name)
  })

  test('JWT payload bisnis_name matches registered bisnis_name', () => {
    expect(decoded.payload.bisnis_name).toBe(VALID_USER.bisnis_name)
  })

  test('JWT expiry is approximately 7 days from issuance (604800 s, ±60 s tolerance)', () => {
    const delta = decoded.payload.exp - decoded.payload.iat
    expect(delta).toBeGreaterThanOrEqual(604800 - 60)
    expect(delta).toBeLessThanOrEqual(604800 + 60)
  })

  test('JWT signature verifies with JWT_SECRET', async () => {
    const secretBytes = new TextEncoder().encode(JWT_SECRET)
    await expect(jwtVerify(token, secretBytes)).resolves.toBeDefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-L-003: Email normalization at login time
// ─────────────────────────────────────────────────────────────────────────────

describe('AUTH-L-003  Email is normalized before DB lookup', () => {
  test('uppercase email resolves to same user', async () => {
    const res = await post(LOGIN_URL, {
      email: VALID_USER.email.toUpperCase(),
      password: VALID_USER.password,
    })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  }, 30_000)

  test('email with leading/trailing spaces resolves to same user', async () => {
    const res = await post(LOGIN_URL, {
      email: `  ${VALID_USER.email}  `,
      password: VALID_USER.password,
    })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  }, 30_000)

  test('mixed-case email resolves to same user', async () => {
    const mixed = VALID_USER.email
      .split('')
      .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c))
      .join('')
    const res = await post(LOGIN_URL, {
      email: mixed,
      password: VALID_USER.password,
    })
    expect(res.status).toBe(200)
    expect(res.body.ok).toBe(true)
  }, 30_000)
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-L-004 — AUTH-L-006: Wrong credentials
// ─────────────────────────────────────────────────────────────────────────────

describe('AUTH-L-004  Wrong password — returns 401 with ambiguous message', () => {
  test('HTTP 401', async () => {
    const res = await post(LOGIN_URL, {
      email: VALID_USER.email,
      password: 'definitelythewrongpassword',
    })
    expect(res.status).toBe(401)
  }, 30_000)

  test('error message is "Email atau password salah" (no enumeration leak)', async () => {
    const res = await post(LOGIN_URL, {
      email: VALID_USER.email,
      password: 'definitelythewrongpassword',
    })
    expect(res.body.error).toBe('Email atau password salah')
  }, 30_000)

  test('no Set-Cookie header is set on failed login', async () => {
    const res = await post(LOGIN_URL, {
      email: VALID_USER.email,
      password: 'definitelythewrongpassword',
    })
    const cookie = extractCookie(res.headers, COOKIE_NAME)
    expect(cookie).toBeNull()
  }, 30_000)
})

describe('AUTH-L-005  Unknown email — same error as wrong password (prevents user enumeration)', () => {
  test('HTTP 401', async () => {
    const res = await post(LOGIN_URL, {
      email: 'nobody.exists@example.com',
      password: 'anypassword',
    })
    expect(res.status).toBe(401)
  }, 30_000)

  test('error message is identical to wrong-password message', async () => {
    const res = await post(LOGIN_URL, {
      email: 'nobody.exists@example.com',
      password: 'anypassword',
    })
    expect(res.body.error).toBe('Email atau password salah')
  }, 30_000)
})

describe('AUTH-L-006  Correct email, password is a whitespace string', () => {
  // password guard is !password (falsy) — "   " is truthy, so it passes the guard
  // and goes to bcrypt.compare where it will not match → 401
  test('HTTP 401 (whitespace password passes guard but fails bcrypt)', async () => {
    const res = await post(LOGIN_URL, {
      email: VALID_USER.email,
      password: '        ', // 8 spaces — truthy, passes the !password guard
    })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Email atau password salah')
  }, 30_000)
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-L-007 — AUTH-L-013: Missing / empty field validation
// ─────────────────────────────────────────────────────────────────────────────

describe('AUTH-L-007  Missing fields — email absent', () => {
  test('HTTP 400 with correct error message', async () => {
    const res = await post(LOGIN_URL, { password: 'testpassword99' })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Email dan password wajib diisi')
  })
})

describe('AUTH-L-008  Missing fields — password absent', () => {
  test('HTTP 400 with correct error message', async () => {
    const res = await post(LOGIN_URL, { email: VALID_USER.email })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Email dan password wajib diisi')
  })
})

describe('AUTH-L-009  Missing fields — both absent (empty body {})', () => {
  test('HTTP 400 with correct error message', async () => {
    const res = await post(LOGIN_URL, {})
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Email dan password wajib diisi')
  })
})

describe('AUTH-L-010  Empty string email', () => {
  test('HTTP 400 — empty string is falsy after .trim()', async () => {
    const res = await post(LOGIN_URL, {
      email: '',
      password: 'testpassword99',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Email dan password wajib diisi')
  })
})

describe('AUTH-L-011  Whitespace-only email', () => {
  test('HTTP 400 — "   ".trim() is "" which is falsy', async () => {
    const res = await post(LOGIN_URL, {
      email: '   ',
      password: 'testpassword99',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Email dan password wajib diisi')
  })
})

describe('AUTH-L-012  Empty string password', () => {
  test('HTTP 400 — empty string is falsy, triggers guard', async () => {
    const res = await post(LOGIN_URL, {
      email: VALID_USER.email,
      password: '',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Email dan password wajib diisi')
  })
})

describe('AUTH-L-013  null values for both fields', () => {
  test('HTTP 400 — null email: null?.trim() is undefined (falsy)', async () => {
    const res = await post(LOGIN_URL, {
      email: null,
      password: null,
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Email dan password wajib diisi')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-L-014: Malformed email format (no @ sign)
// ─────────────────────────────────────────────────────────────────────────────

describe('AUTH-L-014  Malformed email format — no @ sign', () => {
  // The login route has NO email format validation — it only validates presence.
  // A malformed email goes straight to the DB lookup and returns 401 (not found).
  test('HTTP 401 — no format validation in login route; DB lookup finds nothing', async () => {
    const res = await post(LOGIN_URL, {
      email: 'notavalidemail',
      password: 'testpassword99',
    })
    // BEHAVIOR NOTE: Unlike register (which returns 400 for bad format),
    // login returns 401 because there is no format check — only a DB lookup.
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Email atau password salah')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-L-015: Non-JSON body
// ─────────────────────────────────────────────────────────────────────────────

describe('AUTH-L-015  Non-JSON request body', () => {
  test('HTTP 500 — req.json() throws, caught by catch block', async () => {
    const res = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'this is not json',
    })
    const body = await res.json().catch(() => ({ error: 'could not parse response' }))
    expect(res.status).toBe(500)
    expect(body.error).toBe('Terjadi kesalahan server')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-L-016: Wrong HTTP method
// ─────────────────────────────────────────────────────────────────────────────

describe('AUTH-L-016  Wrong HTTP method', () => {
  test('GET returns 405 Method Not Allowed', async () => {
    const res = await fetch(LOGIN_URL, { method: 'GET' })
    expect(res.status).toBe(405)
  })

  test('PUT returns 405 Method Not Allowed', async () => {
    const res = await fetch(LOGIN_URL, { method: 'PUT' })
    expect(res.status).toBe(405)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SEC-L-001 — SEC-L-006: Security tests
// ─────────────────────────────────────────────────────────────────────────────

describe('SEC-L-001  SQL injection in email field', () => {
  test("payload '; DROP TABLE users; -- returns 401 (not a server error)", async () => {
    const res = await post(LOGIN_URL, {
      email: "'; DROP TABLE users; --@example.com",
      password: 'anypassword',
    })
    // TypeORM uses parameterized queries. The injection string is treated as a
    // literal email value. The lookup finds no user → 401.
    expect([400, 401]).toContain(res.status)
    // Critically: must NOT be 500, which would indicate query execution error
    expect(res.status).not.toBe(500)
  })

  test("classic OR 1=1 injection — email field", async () => {
    const res = await post(LOGIN_URL, {
      email: "' OR '1'='1",
      password: 'anypassword',
    })
    expect([400, 401]).toContain(res.status)
    expect(res.status).not.toBe(500)
    // Must NOT return 200 — injection must not bypass auth
    expect(res.status).not.toBe(200)
  })
})

describe('SEC-L-002  SQL injection in password field', () => {
  test("payload '; DROP TABLE users; -- in password field", async () => {
    const res = await post(LOGIN_URL, {
      email: VALID_USER.email,
      password: "'; DROP TABLE users; --",
    })
    // Password is passed to bcrypt.compare — no DB query is run with the password value.
    // bcrypt.compare will simply return false → 401.
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Email atau password salah')
  }, 30_000)
})

describe('SEC-L-003  JWT algorithm confusion — alg:none', () => {
  // Craft a JWT with alg:none and a valid-looking payload.
  // This must be rejected by jose's jwtVerify in any protected endpoint.
  // We test via the history endpoint which requires a valid JWT.
  test('alg:none token is rejected by protected endpoints', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
    const payload = Buffer.from(
      JSON.stringify({ userId: '00000000-0000-0000-0000-000000000000', exp: 9999999999 })
    ).toString('base64url')
    const fakeToken = `${header}.${payload}.`

    const res = await fetch(`${BASE_URL}/api/analysis/history`, {
      headers: { Cookie: `${COOKIE_NAME}=${fakeToken}` },
    })
    expect(res.status).toBe(401)
  })
})

describe('SEC-L-004  JWT signature tampered', () => {
  test('modified payload with original signature is rejected', async () => {
    // First get a real token
    const loginRes = await post(LOGIN_URL, {
      email: VALID_USER.email,
      password: VALID_USER.password,
    })
    const cookie = extractCookie(loginRes.headers, COOKIE_NAME)
    const realToken = cookie.value

    // Tamper: change the payload to elevate userId
    const [header, , sig] = realToken.split('.')
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        userId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        email: 'hacker@evil.com',
        exp: 9999999999,
      })
    ).toString('base64url')
    const tamperedToken = `${header}.${tamperedPayload}.${sig}`

    const res = await fetch(`${BASE_URL}/api/analysis/history`, {
      headers: { Cookie: `${COOKIE_NAME}=${tamperedToken}` },
    })
    expect(res.status).toBe(401)
  }, 30_000)
})

describe('SEC-L-005  Missing cookie — unauthenticated access to protected endpoints', () => {
  test('GET /api/analysis/history without cookie returns 401', async () => {
    const res = await fetch(`${BASE_URL}/api/analysis/history`)
    expect(res.status).toBe(401)
  })
})

describe('SEC-L-006  Expired JWT is rejected', () => {
  test('a token with exp in the past is rejected', async () => {
    // Build a token whose exp is 1 second in the past.
    // We must sign it properly with the real secret so it passes signature check
    // but fails the expiry check.
    const secretBytes = new TextEncoder().encode(JWT_SECRET)
    const expiredToken = await new SignJWT({
      userId: '00000000-0000-0000-0000-000000000001',
      email: 'expired@example.com',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 100)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1)
      .sign(secretBytes)

    const res = await fetch(`${BASE_URL}/api/analysis/history`, {
      headers: { Cookie: `${COOKIE_NAME}=${expiredToken}` },
    })
    expect(res.status).toBe(401)
  })
})

describe('SEC-L-007  Brute-force — no rate limiting (informational / flag only)', () => {
  // This test documents the absence of rate limiting.
  // It does not expect a 429 because the current implementation has none.
  // When rate limiting is added, update this expectation to toBe(429).
  test('50 rapid failed logins all return 401, none return 429 (no rate limiting present)', async () => {
    const attempts = Array.from({ length: 50 }, () =>
      post(LOGIN_URL, {
        email: VALID_USER.email,
        password: 'wrongpassword',
      })
    )
    const results = await Promise.all(attempts)
    const statuses = results.map((r) => r.status)

    // All should be 401 — if any are 429, rate limiting has been added (good)
    const allUnauthorized = statuses.every((s) => s === 401 || s === 429)
    expect(allUnauthorized).toBe(true)

    // Flag: if none are 429, rate limiting is absent — this is a security finding
    const hasRateLimit = statuses.some((s) => s === 429)
    if (!hasRateLimit) {
      console.warn(
        '[SEC-L-007] SECURITY FINDING: No rate limiting on /api/auth/login. ' +
          'Brute-force attacks are possible. Recommend adding rate limiting middleware.'
      )
    }
  }, 60_000)
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-L-017 — AUTH-L-019: Response shape assertions
// ─────────────────────────────────────────────────────────────────────────────

describe('AUTH-L-017  Response shape — success', () => {
  test('response body has exactly: ok, user (with id, name, bisnis_name, email)', async () => {
    const res = await post(LOGIN_URL, {
      email: VALID_USER.email,
      password: VALID_USER.password,
    })
    expect(res.body).toEqual({
      ok: true,
      user: {
        id: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        ),
        name: VALID_USER.name,
        bisnis_name: VALID_USER.bisnis_name,
        email: VALID_USER.email.toLowerCase(),
      },
    })
  }, 30_000)
})

describe('AUTH-L-018  Response shape — error', () => {
  test('error responses have exactly: { error: string }', async () => {
    const cases = [
      { payload: {}, expectedStatus: 400 },
      { payload: { email: 'nobody@example.com', password: 'wrong' }, expectedStatus: 401 },
    ]
    for (const { payload, expectedStatus } of cases) {
      const res = await post(LOGIN_URL, payload)
      expect(res.status).toBe(expectedStatus)
      expect(typeof res.body.error).toBe('string')
      expect(res.body.ok).toBeUndefined()
    }
  }, 30_000)
})

describe('AUTH-L-019  bisnis_name is null when user registered without it', () => {
  const userWithoutBisnis = {
    name: 'No Bisnis User',
    email: `nobisnis.${RUN_ID}@example.com`,
    password: 'testpassword99',
  }

  beforeAll(async () => {
    await post(REGISTER_URL, userWithoutBisnis)
  }, 30_000)

  test('bisnis_name in login response is null', async () => {
    const res = await post(LOGIN_URL, {
      email: userWithoutBisnis.email,
      password: userWithoutBisnis.password,
    })
    expect(res.status).toBe(200)
    expect(res.body.user.bisnis_name).toBeNull()
  }, 30_000)
})

// ─────────────────────────────────────────────────────────────────────────────
// EDGE-L-001 — EDGE-L-006: Edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('EDGE-L-001  Very long email string (500 chars, valid format)', () => {
  test('returns 401 (not found) — DB lookup runs but finds nothing', async () => {
    const longEmail = 'a'.repeat(490) + '@example.com'
    const res = await post(LOGIN_URL, {
      email: longEmail,
      password: 'testpassword99',
    })
    // No length cap in the route; goes to DB. DB has no row → 401.
    expect(res.status).toBe(401)
  })
})

describe('EDGE-L-002  Very long password string (1000 chars)', () => {
  test('returns 401 — bcrypt compare truncates at 72 bytes but mismatch is still 401', async () => {
    const res = await post(LOGIN_URL, {
      email: VALID_USER.email,
      password: 'a'.repeat(1000),
    })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Email atau password salah')
  }, 30_000)
})

describe('EDGE-L-003  Password field is a number (type coercion)', () => {
  // password guard is !password — number 0 is falsy, any other number is truthy
  test('numeric password 12345678 — truthy, passes guard, fails bcrypt → 401', async () => {
    const res = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Send raw JSON with a numeric password
      body: JSON.stringify({ email: VALID_USER.email, password: 12345678 }),
    })
    await res.json().catch(() => null)
    // bcrypt.compare(12345678, hash) — bcrypt coerces to string "12345678"
    // This will not match the registered password → 401, OR may throw → 500
    expect([401, 500]).toContain(res.status)
  }, 30_000)

  test('numeric password 0 — falsy, triggers missing-field guard → 400', async () => {
    const res = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: VALID_USER.email, password: 0 }),
    })
    const body = await res.json().catch(() => null)
    // !0 is true → fires the guard
    expect(res.status).toBe(400)
    expect(body.error).toBe('Email dan password wajib diisi')
  })
})

describe('EDGE-L-004  Unicode characters in email', () => {
  test('Unicode email returns 401 — DB lookup finds nothing, no crash', async () => {
    const res = await post(LOGIN_URL, {
      email: 'useré@example.com', // é character
      password: 'testpassword99',
    })
    expect([401]).toContain(res.status)
    expect(res.status).not.toBe(500)
  })
})

describe('EDGE-L-005  Request body is a JSON array instead of object', () => {
  test('HTTP 400 — destructuring array yields undefined email and password', async () => {
    const res = await fetch(LOGIN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(['email@x.com', 'password']),
    })
    const body = await res.json().catch(() => null)
    expect(res.status).toBe(400)
    expect(body.error).toBe('Email dan password wajib diisi')
  })
})

describe('EDGE-L-006  Correct password with extra trailing character (near-miss)', () => {
  test('returns 401 — one char difference causes bcrypt mismatch', async () => {
    const res = await post(LOGIN_URL, {
      email: VALID_USER.email,
      password: VALID_USER.password + 'X',
    })
    expect(res.status).toBe(401)
    expect(res.body.error).toBe('Email atau password salah')
  }, 30_000)
})
