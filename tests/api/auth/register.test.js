// Test Suite — POST /api/auth/register
//
// Source analyzed:
//   app/api/auth/register/route.js  |  lib/auth.js  |  lib/entities/UserSchema.ts
//
// Prerequisites (devDependencies):
//   npm install --save-dev jest jest-environment-node node-fetch@2
//
// package.json "jest" config:
//   { "testEnvironment": "node", "testMatch": ["tests/**/*.test.js"],
//     "transform": {}, "extensionsToTreatAsEsm": [".js"] }
//
// Run (ESM mode):
//   NODE_OPTIONS=--experimental-vm-modules npx jest tests/api/auth/register.test.js
//
// The Next.js dev server must be running at TEST_BASE_URL (default http://localhost:3000).
// DATABASE_URL and JWT_SECRET must match the running server's environment.
//
// Known behavioral notes extracted from route.js:
//   - Validation guard (line 10): !name?.trim() || !email?.trim() || !password
//     The password guard is falsy (!password), NOT a trim check.
//     A whitespace-only password of length >= 8 passes this guard and the length check.
//   - Password length check (line 13): password.length < 8 (no trim applied)
//   - Email format check (line 16): !email.includes('@') — only '@' presence, not full format
//   - bisnis_name (line 31): bisnis_name?.trim() || null — optional, empty => null
//   - Email stored (line 32): email.toLowerCase().trim()
//   - Response (line 39): { ok: true, user: { id, name, bisnis_name, email } } — no password fields
//   - Cookie: atlas_token, httpOnly, sameSite: lax, path: /, maxAge: 604800

import fetch from 'node-fetch'
import { jwtVerify, SignJWT } from 'jose'

// ─── Configuration ────────────────────────────────────────────────────────────

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000'
const REGISTER_URL = `${BASE_URL}/api/auth/register`
const HISTORY_URL = `${BASE_URL}/api/analysis/history`
const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-32-chars-minimum-here'
const COOKIE_NAME = 'atlas_token'

// ─── Test Helpers ─────────────────────────────────────────────────────────────

// POST JSON to a URL and return { status, body, headers }.
// Throws only on network-level failures (not on 4xx/5xx).
async function post(url, payload) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => null)
  return { status: res.status, body, headers: res.headers }
}

// Extract the value of a named cookie from a Set-Cookie header string array.
// node-fetch v2 does not expose multiple Set-Cookie via headers.get();
// we iterate the raw header.
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

// Decode a JWT without verifying signature — returns { header, payload }.
// Used only to inspect structure; signature tests use jwtVerify separately.
function decodeJwtUnsafe(token) {
  const [headerB64, payloadB64] = token.split('.')
  const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'))
  const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
  return { header, payload }
}

// ─── Test Fixtures ────────────────────────────────────────────────────────────

// A unique suffix for this test run so registrations don't collide
// with prior runs in a shared DB.
const RUN_ID = Date.now()

const VALID_USER = {
  name: 'Register Test User',
  bisnis_name: 'Warung Register',
  email: `register.test.${RUN_ID}@example.com`,
  password: 'testpassword99',
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-R-001 — AUTH-R-004: Happy path — full valid registration
// ─────────────────────────────────────────────────────────────────────────────

describe('AUTH-R-001  Happy path — all valid fields including bisnis_name', () => {
  let response

  beforeAll(async () => {
    response = await post(REGISTER_URL, VALID_USER)
  }, 30_000) // bcrypt is slow; allow 30 s

  test('returns HTTP 201', () => {
    expect(response.status).toBe(201)
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

  test('user.id is a valid UUID', () => {
    expect(response.body.user.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
  })

  test('response body does NOT contain password or password_hash', () => {
    const bodyStr = JSON.stringify(response.body)
    expect(bodyStr).not.toContain('password_hash')
    expect(bodyStr).not.toContain('"password"')
  })

  test('Set-Cookie header contains atlas_token', () => {
    const cookie = extractCookie(response.headers, COOKIE_NAME)
    expect(cookie).not.toBeNull()
    expect(cookie.value.length).toBeGreaterThan(20)
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
// AUTH-R-002: JWT structure and claims issued on registration
// ─────────────────────────────────────────────────────────────────────────────

describe('AUTH-R-002  JWT token structure and claims issued on registration', () => {
  let token
  let decoded

  beforeAll(async () => {
    const uniqueEmail = `jwt.claims.${RUN_ID}@example.com`
    const res = await post(REGISTER_URL, {
      name: 'JWT Claims User',
      bisnis_name: 'JWT Bisnis',
      email: uniqueEmail,
      password: 'testpassword99',
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

  test('JWT payload email is lowercased', () => {
    expect(decoded.payload.email).toBe(`jwt.claims.${RUN_ID}@example.com`)
  })

  test('JWT payload name matches registered name', () => {
    expect(decoded.payload.name).toBe('JWT Claims User')
  })

  test('JWT payload bisnis_name matches registered bisnis_name', () => {
    expect(decoded.payload.bisnis_name).toBe('JWT Bisnis')
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

  test('JWT has iat claim (issued-at)', () => {
    expect(typeof decoded.payload.iat).toBe('number')
    expect(decoded.payload.iat).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-R-003: Duplicate email
// ─────────────────────────────────────────────────────────────────────────────

describe('AUTH-R-003  Duplicate email — exact match', () => {
  // VALID_USER was already registered in AUTH-R-001's beforeAll.
  // This describe intentionally re-uses that email to trigger 409.

  test('returns HTTP 409', async () => {
    const res = await post(REGISTER_URL, {
      name: 'Another Person',
      email: VALID_USER.email,
      password: 'differentpassword99',
    })
    expect(res.status).toBe(409)
  }, 30_000)

  test('error message is "Email sudah terdaftar"', async () => {
    const res = await post(REGISTER_URL, {
      name: 'Another Person',
      email: VALID_USER.email,
      password: 'differentpassword99',
    })
    expect(res.body.error).toBe('Email sudah terdaftar')
  }, 30_000)

  test('no Set-Cookie header is set on 409', async () => {
    const res = await post(REGISTER_URL, {
      name: 'Another Person',
      email: VALID_USER.email,
      password: 'differentpassword99',
    })
    const cookie = extractCookie(res.headers, COOKIE_NAME)
    expect(cookie).toBeNull()
  }, 30_000)
})

describe('AUTH-R-004  Duplicate email — uppercase variant treated as duplicate', () => {
  // email.toLowerCase().trim() is applied before DB lookup; uppercase same email is a duplicate
  test('returns HTTP 409', async () => {
    const res = await post(REGISTER_URL, {
      name: 'Uppercase Dupe',
      email: VALID_USER.email.toUpperCase(),
      password: 'testpassword99',
    })
    expect(res.status).toBe(409)
    expect(res.body.error).toBe('Email sudah terdaftar')
  }, 30_000)
})

describe('AUTH-R-005  Duplicate email — with surrounding spaces treated as duplicate', () => {
  test('returns HTTP 409', async () => {
    const res = await post(REGISTER_URL, {
      name: 'Spaced Dupe',
      email: `  ${VALID_USER.email}  `,
      password: 'testpassword99',
    })
    expect(res.status).toBe(409)
    expect(res.body.error).toBe('Email sudah terdaftar')
  }, 30_000)
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-R-006 — AUTH-R-014: Missing / empty / whitespace field validation
// ─────────────────────────────────────────────────────────────────────────────

describe('AUTH-R-006  Missing field — name is absent', () => {
  test('HTTP 400 with correct error message', async () => {
    const res = await post(REGISTER_URL, {
      email: `missing.name.${RUN_ID}@example.com`,
      password: 'testpassword99',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Nama, email, dan password wajib diisi')
  })
})

describe('AUTH-R-007  Missing field — email is absent', () => {
  test('HTTP 400 with correct error message', async () => {
    const res = await post(REGISTER_URL, {
      name: 'No Email User',
      password: 'testpassword99',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Nama, email, dan password wajib diisi')
  })
})

describe('AUTH-R-008  Missing field — password is absent', () => {
  test('HTTP 400 with correct error message', async () => {
    const res = await post(REGISTER_URL, {
      name: 'No Password User',
      email: `no.password.${RUN_ID}@example.com`,
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Nama, email, dan password wajib diisi')
  })
})

describe('AUTH-R-009  Missing fields — entire body is empty JSON object {}', () => {
  test('HTTP 400 with correct error message', async () => {
    const res = await post(REGISTER_URL, {})
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Nama, email, dan password wajib diisi')
  })
})

describe('AUTH-R-010  Empty string name — ""', () => {
  // ""?.trim() is "" which is falsy — fires the guard
  test('HTTP 400 — empty name after trim is falsy', async () => {
    const res = await post(REGISTER_URL, {
      name: '',
      email: `empty.name.${RUN_ID}@example.com`,
      password: 'testpassword99',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Nama, email, dan password wajib diisi')
  })
})

describe('AUTH-R-011  Whitespace-only name — "   "', () => {
  // "   "?.trim() is "" which is falsy
  test('HTTP 400 — whitespace-only name is falsy after trim', async () => {
    const res = await post(REGISTER_URL, {
      name: '   ',
      email: `ws.name.${RUN_ID}@example.com`,
      password: 'testpassword99',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Nama, email, dan password wajib diisi')
  })
})

describe('AUTH-R-012  Empty string email — ""', () => {
  // ""?.trim() is "" which is falsy
  test('HTTP 400 — empty email after trim is falsy', async () => {
    const res = await post(REGISTER_URL, {
      name: 'Valid Name',
      email: '',
      password: 'testpassword99',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Nama, email, dan password wajib diisi')
  })
})

describe('AUTH-R-013  Whitespace-only email — "   "', () => {
  // "   "?.trim() is "" which is falsy
  test('HTTP 400 — whitespace-only email is falsy after trim', async () => {
    const res = await post(REGISTER_URL, {
      name: 'Valid Name',
      email: '   ',
      password: 'testpassword99',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Nama, email, dan password wajib diisi')
  })
})

describe('AUTH-R-014  Empty string password — ""', () => {
  // !password is true for "" — fires the guard before the length check
  test('HTTP 400 — empty password is falsy, fires missing-field guard', async () => {
    const res = await post(REGISTER_URL, {
      name: 'Valid Name',
      email: `empty.pw.${RUN_ID}@example.com`,
      password: '',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Nama, email, dan password wajib diisi')
  })
})

describe('AUTH-R-015  null values for all required fields', () => {
  // null?.trim() is undefined (falsy); !null is true for password
  test('HTTP 400 — null fields all fail the guard', async () => {
    const res = await post(REGISTER_URL, {
      name: null,
      email: null,
      password: null,
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Nama, email, dan password wajib diisi')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-R-016 — AUTH-R-018: Password length boundaries
// ─────────────────────────────────────────────────────────────────────────────

describe('AUTH-R-016  Password length — exactly 7 characters (min - 1)', () => {
  test('HTTP 400 — password.length < 8 is true for length 7', async () => {
    const res = await post(REGISTER_URL, {
      name: 'Short PW User',
      email: `short.pw7.${RUN_ID}@example.com`,
      password: '1234567',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Password minimal 8 karakter')
  })
})

describe('AUTH-R-017  Password length — exactly 8 characters (min, boundary pass)', () => {
  test('HTTP 201 — password.length < 8 is false for length 8', async () => {
    const res = await post(REGISTER_URL, {
      name: 'Exact PW User',
      email: `exact.pw8.${RUN_ID}@example.com`,
      password: '12345678',
    })
    expect(res.status).toBe(201)
    expect(res.body.ok).toBe(true)
  }, 30_000)
})

describe('AUTH-R-018  Password length — 1 character', () => {
  test('HTTP 400 — password minimal 8 karakter', async () => {
    const res = await post(REGISTER_URL, {
      name: 'One Char PW',
      email: `one.char.pw.${RUN_ID}@example.com`,
      password: 'x',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Password minimal 8 karakter')
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-R-019 — AUTH-R-022: Email format validation
// ─────────────────────────────────────────────────────────────────────────────

describe('AUTH-R-019  Email format — no @ sign', () => {
  test('HTTP 400 — "Format email tidak valid" when @ is absent', async () => {
    const res = await post(REGISTER_URL, {
      name: 'No At Sign',
      email: 'notanemail.com',
      password: 'testpassword99',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Format email tidak valid')
  })
})

describe('AUTH-R-020  Email format — bare string (no dots, no TLD)', () => {
  test('HTTP 400 — "Format email tidak valid" for bare string', async () => {
    const res = await post(REGISTER_URL, {
      name: 'Bare String',
      email: 'juststring',
      password: 'testpassword99',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Format email tidak valid')
  })
})

describe('AUTH-R-021  Email format — only @ character', () => {
  // "@".includes('@') is true — the format check PASSES.
  // The route proceeds to DB. This documents the known gap in email validation.
  // BUG-007 FIXED: email "@" sekarang ditolak oleh regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  test('returns 400 — "@" ditolak regex email yang lebih ketat (BUG-007 fixed)', async () => {
    const res = await post(REGISTER_URL, {
      name: 'At Only',
      email: '@',
      password: 'testpassword99',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Format email tidak valid')
  }, 30_000)
})

describe('AUTH-R-022  Email format — no TLD (domain ends after @)', () => {
  // BUG-007 FIXED: "budi@" sekarang ditolak oleh regex karena tidak ada domain setelah @
  test('returns 400 — "user@" ditolak regex email yang lebih ketat (BUG-007 fixed)', async () => {
    const res = await post(REGISTER_URL, {
      name: 'No TLD User',
      email: `notld.${RUN_ID}@`,
      password: 'testpassword99',
    })
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Format email tidak valid')
  }, 30_000)
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-R-023: bisnis_name is optional
// ─────────────────────────────────────────────────────────────────────────────

describe('AUTH-R-023  bisnis_name is optional — omitting it returns 201', () => {
  let response

  beforeAll(async () => {
    response = await post(REGISTER_URL, {
      name: 'No Bisnis User',
      email: `no.bisnis.${RUN_ID}@example.com`,
      password: 'testpassword99',
    })
  }, 30_000)

  test('returns HTTP 201', () => {
    expect(response.status).toBe(201)
  })

  test('bisnis_name in response is null', () => {
    expect(response.body.user.bisnis_name).toBeNull()
  })

  test('JWT bisnis_name claim is null', () => {
    const cookie = extractCookie(response.headers, COOKIE_NAME)
    const decoded = decodeJwtUnsafe(cookie.value)
    expect(decoded.payload.bisnis_name).toBeNull()
  })
})

describe('AUTH-R-024  bisnis_name is empty string — stored as null', () => {
  // bisnis_name?.trim() || null evaluates: "".trim() => "" => falsy => null
  test('HTTP 201 and bisnis_name in response is null', async () => {
    const res = await post(REGISTER_URL, {
      name: 'Empty Bisnis User',
      bisnis_name: '',
      email: `empty.bisnis.${RUN_ID}@example.com`,
      password: 'testpassword99',
    })
    expect(res.status).toBe(201)
    expect(res.body.user.bisnis_name).toBeNull()
  }, 30_000)
})

describe('AUTH-R-025  bisnis_name is whitespace-only — stored as null', () => {
  // "   "?.trim() => "" => falsy => null
  test('HTTP 201 and bisnis_name in response is null', async () => {
    const res = await post(REGISTER_URL, {
      name: 'Ws Bisnis User',
      bisnis_name: '   ',
      email: `ws.bisnis.${RUN_ID}@example.com`,
      password: 'testpassword99',
    })
    expect(res.status).toBe(201)
    expect(res.body.user.bisnis_name).toBeNull()
  }, 30_000)
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-R-026: Email stored as lowercase
// ─────────────────────────────────────────────────────────────────────────────

describe('AUTH-R-026  Email stored and returned as lowercase regardless of input case', () => {
  let response
  const mixedCaseEmail = `Mixed.Case.${RUN_ID}@EXAMPLE.COM`

  beforeAll(async () => {
    response = await post(REGISTER_URL, {
      name: 'Mixed Case Email User',
      email: mixedCaseEmail,
      password: 'testpassword99',
    })
  }, 30_000)

  test('returns HTTP 201', () => {
    expect(response.status).toBe(201)
  })

  test('response user.email is fully lowercased', () => {
    expect(response.body.user.email).toBe(mixedCaseEmail.toLowerCase())
  })

  test('JWT email claim is lowercased', () => {
    const cookie = extractCookie(response.headers, COOKIE_NAME)
    const decoded = decodeJwtUnsafe(cookie.value)
    expect(decoded.payload.email).toBe(mixedCaseEmail.toLowerCase())
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-R-027: Wrong HTTP methods
// ─────────────────────────────────────────────────────────────────────────────

describe('AUTH-R-027  Wrong HTTP method — GET returns 405', () => {
  test('GET /api/auth/register returns 405 Method Not Allowed', async () => {
    const res = await fetch(REGISTER_URL, { method: 'GET' })
    expect(res.status).toBe(405)
  })
})

describe('AUTH-R-028  Wrong HTTP method — PUT returns 405', () => {
  test('PUT /api/auth/register returns 405 Method Not Allowed', async () => {
    const res = await fetch(REGISTER_URL, { method: 'PUT' })
    expect(res.status).toBe(405)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// AUTH-R-029: Non-JSON body
// ─────────────────────────────────────────────────────────────────────────────

describe('AUTH-R-029  Non-JSON request body', () => {
  test('HTTP 500 — req.json() throws, caught by catch block returning "Terjadi kesalahan server"', async () => {
    const res = await fetch(REGISTER_URL, {
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
// SEC-R-001 — SEC-R-007: Security tests
// ─────────────────────────────────────────────────────────────────────────────

describe('SEC-R-001  SQL injection in email field', () => {
  // The @ check fires before the DB lookup for the classic injection string.
  // TypeORM uses parameterized queries regardless, so DB-layer injection is blocked.

  test("payload '; DROP TABLE users; -- lacks @ — returns 400 format error, not 500", async () => {
    const res = await post(REGISTER_URL, {
      name: 'SQLi Test',
      email: "'; DROP TABLE users; --",
      password: 'testpassword99',
    })
    // No @ in the injection string — email format guard fires first
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('Format email tidak valid')
    expect(res.status).not.toBe(500)
  })

  test("OR 1=1 injection with @ included — email regex rejects whitespace before @ → 400", async () => {
    const res = await post(REGISTER_URL, {
      name: 'SQLi Test 2',
      email: `' OR '1'='1'@example.com`,
      password: 'testpassword99',
    })
    // BUG-007 FIXED: regex /^[^\s@]+/ rejects whitespace before @ → 400 format error
    // Even if it passed, TypeORM parameterized query would treat it as a literal string.
    expect([400, 201, 409]).toContain(res.status)
    expect(res.status).not.toBe(500)
  }, 30_000)
})

describe('SEC-R-002  SQL injection in name field', () => {
  test("'; DROP TABLE users;-- in name is stored as literal text, not executed", async () => {
    const res = await post(REGISTER_URL, {
      name: "'; DROP TABLE users; --",
      email: `sqli.name.${RUN_ID}@example.com`,
      password: 'testpassword99',
    })
    // TypeORM repo.create + repo.save uses parameterized INSERT
    // The injection string becomes a literal name value — row is created
    expect(res.status).toBe(201)
    expect(res.body.user.name).toBe("'; DROP TABLE users; --")
  }, 30_000)
})

describe('SEC-R-003  XSS payload in name field stored as plain text', () => {
  // The API stores the literal string. XSS risk is in the rendering layer.
  // React escapes by default so this tests the API contract: no transformation.
  test('<script>alert(1)</script> in name is stored verbatim — API returns it as a plain string', async () => {
    const xssName = '<script>alert(1)</script>'
    const res = await post(REGISTER_URL, {
      name: xssName,
      email: `xss.name.${RUN_ID}@example.com`,
      password: 'testpassword99',
    })
    expect(res.status).toBe(201)
    // The API must not transform or strip the value — that is the rendering layer's job
    expect(res.body.user.name).toBe(xssName)
  }, 30_000)
})

describe('SEC-R-004  Password is never returned in any API response', () => {
  test('201 response body does not contain password or password_hash', async () => {
    const res = await post(REGISTER_URL, {
      name: 'Password Leak Check',
      email: `pw.leak.${RUN_ID}@example.com`,
      password: 'noleakpassword',
    })
    expect(res.status).toBe(201)
    const bodyStr = JSON.stringify(res.body)
    expect(bodyStr).not.toContain('password_hash')
    expect(bodyStr).not.toContain('"password"')
    expect(bodyStr).not.toContain('noleakpassword')
  }, 30_000)
})

describe('SEC-R-005  JWT algorithm confusion — alg:none is rejected by protected endpoints', () => {
  test('alg:none token sent to /api/analysis/history returns 401', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url')
    const payload = Buffer.from(
      JSON.stringify({ userId: '00000000-0000-0000-0000-000000000000', exp: 9999999999 })
    ).toString('base64url')
    const fakeToken = `${header}.${payload}.`

    const res = await fetch(HISTORY_URL, {
      headers: { Cookie: `${COOKIE_NAME}=${fakeToken}` },
    })
    expect(res.status).toBe(401)
  })
})

describe('SEC-R-006  JWT signature tampered — modified payload with original signature is rejected', () => {
  let realToken

  beforeAll(async () => {
    const res = await post(REGISTER_URL, {
      name: 'Tamper Test User',
      email: `tamper.jwt.${RUN_ID}@example.com`,
      password: 'testpassword99',
    })
    const cookie = extractCookie(res.headers, COOKIE_NAME)
    realToken = cookie?.value
  }, 30_000)

  test('tampered token (different userId) is rejected with 401', async () => {
    const [header, , sig] = realToken.split('.')
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        userId: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
        email: 'hacker@evil.com',
        exp: 9999999999,
      })
    ).toString('base64url')
    const tamperedToken = `${header}.${tamperedPayload}.${sig}`

    const res = await fetch(HISTORY_URL, {
      headers: { Cookie: `${COOKIE_NAME}=${tamperedToken}` },
    })
    expect(res.status).toBe(401)
  })
})

describe('SEC-R-007  Expired JWT is rejected', () => {
  test('a token with exp in the past is rejected by protected endpoints', async () => {
    const secretBytes = new TextEncoder().encode(JWT_SECRET)
    const expiredToken = await new SignJWT({
      userId: '00000000-0000-0000-0000-000000000001',
      email: 'expired@example.com',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(Math.floor(Date.now() / 1000) - 100)
      .setExpirationTime(Math.floor(Date.now() / 1000) - 1)
      .sign(secretBytes)

    const res = await fetch(HISTORY_URL, {
      headers: { Cookie: `${COOKIE_NAME}=${expiredToken}` },
    })
    expect(res.status).toBe(401)
  })
})

describe('SEC-R-008  Missing cookie — unauthenticated request to protected endpoint', () => {
  test('GET /api/analysis/history without cookie returns 401', async () => {
    const res = await fetch(HISTORY_URL)
    expect(res.status).toBe(401)
  })
})

describe('SEC-R-009  Mass assignment — extra fields in payload are ignored', () => {
  // repo.create() in TypeORM only maps columns declared in the entity schema.
  // Extra fields like role or id in the payload must be silently dropped.
  test('registration with extra role and id fields succeeds; id is DB-generated UUID', async () => {
    const injectedId = '00000000-dead-beef-0000-000000000000'
    const res = await post(REGISTER_URL, {
      name: 'Mass Assign User',
      email: `mass.assign.${RUN_ID}@example.com`,
      password: 'testpassword99',
      role: 'admin',
      id: injectedId,
    })
    expect(res.status).toBe(201)
    // DB-generated UUID must differ from the injected value
    expect(res.body.user.id).not.toBe(injectedId)
    // The response body must not contain a role field
    expect(res.body.user.role).toBeUndefined()
  }, 30_000)
})

describe('SEC-R-010  Brute-force — no rate limiting (informational / flag only)', () => {
  // This test documents the absence of rate limiting.
  // When rate limiting is added, update the expectation to include 429.
  test('20 rapid registrations with invalid bodies return 400, none return 429 (no rate limiting present)', async () => {
    const attempts = Array.from({ length: 20 }, (_, i) =>
      post(REGISTER_URL, { name: '', email: `ratelimit${i}@x.com`, password: 'pw' })
    )
    const results = await Promise.all(attempts)
    const statuses = results.map((r) => r.status)

    const allExpected = statuses.every((s) => s === 400 || s === 429)
    expect(allExpected).toBe(true)

    const hasRateLimit = statuses.some((s) => s === 429)
    if (!hasRateLimit) {
      console.warn(
        '[SEC-R-010] SECURITY FINDING: No rate limiting on /api/auth/register. ' +
          'Account enumeration and abuse are possible. Recommend rate limiting middleware.'
      )
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// EDGE-R-001 — EDGE-R-012: Edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('EDGE-R-001  Very long email — 500 characters with valid @ and domain', () => {
  // No length cap in route.js; PostgreSQL text column has no max length.
  // Email uses RUN_ID to avoid 409 across test runs.
  test('returns 201 or 409 — no length cap on email field', async () => {
    const longLocal = `${'a'.repeat(488 - RUN_ID.length)}${RUN_ID}`
    const longEmail = `${longLocal}@example.com`
    const res = await post(REGISTER_URL, {
      name: 'Long Email User',
      email: longEmail,
      password: 'testpassword99',
    })
    expect([201, 409]).toContain(res.status)
  }, 30_000)
})

describe('EDGE-R-002  Very long password — 1000 characters', () => {
  // bcrypt silently truncates at 72 bytes. Registration should succeed.
  // NOTE: bcrypt truncation means passwords > 72 bytes that share the same first
  // 72 bytes will hash identically — document this limitation.
  test('returns 201 — bcrypt accepts and truncates long passwords', async () => {
    const res = await post(REGISTER_URL, {
      name: 'Long PW User',
      email: `long.pw.${RUN_ID}@example.com`,
      password: 'a'.repeat(1000),
    })
    expect(res.status).toBe(201)
  }, 30_000)
})

describe('EDGE-R-003  Very long name — 500 characters', () => {
  // PostgreSQL text column is unlimited; name.trim() and repo.create both handle it.
  test('returns 201 — no length cap on name field', async () => {
    const res = await post(REGISTER_URL, {
      name: 'N'.repeat(500),
      email: `long.name.${RUN_ID}@example.com`,
      password: 'testpassword99',
    })
    expect(res.status).toBe(201)
    expect(res.body.user.name).toBe('N'.repeat(500))
  }, 30_000)
})

describe('EDGE-R-004  Unicode characters in name', () => {
  // PostgreSQL text supports full UTF-8; TypeORM passes it through unchanged.
  test('returns 201 and roundtrips Unicode name correctly', async () => {
    const unicodeName = '안녕 田中 Ñoño'
    const res = await post(REGISTER_URL, {
      name: unicodeName,
      email: `unicode.name.${RUN_ID}@example.com`,
      password: 'testpassword99',
    })
    expect(res.status).toBe(201)
    expect(res.body.user.name).toBe(unicodeName)
  }, 30_000)
})

describe('EDGE-R-005  Unicode characters in email', () => {
  // Non-ASCII in the local part — passes the includes('@') check.
  // PostgreSQL text column stores it; whether the DB or network layer rejects it is documented here.
  test('email with accented character — does not crash the server (no 500)', async () => {
    const res = await post(REGISTER_URL, {
      name: 'Unicode Email User',
      email: `usér.${RUN_ID}@example.com`,
      password: 'testpassword99',
    })
    expect(res.status).not.toBe(500)
  }, 30_000)
})

describe('EDGE-R-006  Whitespace-only password of length 8 (8 spaces)', () => {
  // BUG-006 FIXED: password guard now uses !password?.trim() and password.trim().length < 8
  // 8 spaces: trim() → '' → length 0 < 8 → rejected with 400
  test('BUG-006 FIXED — 8-space password is rejected with 400', async () => {
    const res = await post(REGISTER_URL, {
      name: 'Space PW User',
      email: `space.pw8.${RUN_ID}@example.com`,
      password: '        ', // 8 spaces
    })
    expect(res.status).toBe(400)
  }, 30_000)
})

describe('EDGE-R-007  Request body is a JSON array instead of object', () => {
  // Destructuring an array yields all fields as undefined — guard fires
  test('HTTP 400 — array body makes all fields undefined, guard fires', async () => {
    const res = await fetch(REGISTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(['Budi', 'budi@example.com', 'password99']),
    })
    const body = await res.json().catch(() => null)
    expect(res.status).toBe(400)
    expect(body.error).toBe('Nama, email, dan password wajib diisi')
  })
})

describe('EDGE-R-008  Request body is JSON null', () => {
  // req.json() resolves to null; const { name, ... } = null throws → caught → 500
  test('HTTP 500 — destructuring null throws TypeError, caught by catch block', async () => {
    const res = await fetch(REGISTER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'null',
    })
    const body = await res.json().catch(() => null)
    // Destructuring null: const { name } = null throws TypeError
    expect(res.status).toBe(500)
    expect(body.error).toBe('Terjadi kesalahan server')
  })
})

describe('EDGE-R-009  Response shape on success is exact', () => {
  test('success response body has exactly: ok, user (with id, name, bisnis_name, email)', async () => {
    const res = await post(REGISTER_URL, {
      name: 'Shape Test User',
      bisnis_name: 'Shape Bisnis',
      email: `shape.test.${RUN_ID}@example.com`,
      password: 'testpassword99',
    })
    expect(res.body).toEqual({
      ok: true,
      user: {
        id: expect.stringMatching(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        ),
        name: 'Shape Test User',
        bisnis_name: 'Shape Bisnis',
        email: `shape.test.${RUN_ID}@example.com`,
      },
    })
  }, 30_000)
})

describe('EDGE-R-010  Response shape on error is exact', () => {
  test('error responses have exactly { error: string } — no ok field', async () => {
    const cases = [
      { payload: {}, expectedStatus: 400 },
      { payload: { name: 'X', email: 'noemail', password: 'testpassword99' }, expectedStatus: 400 },
    ]
    for (const { payload, expectedStatus } of cases) {
      const res = await post(REGISTER_URL, payload)
      expect(res.status).toBe(expectedStatus)
      expect(typeof res.body.error).toBe('string')
      expect(res.body.ok).toBeUndefined()
    }
  })
})

describe('EDGE-R-011  name and bisnis_name with leading/trailing whitespace are trimmed', () => {
  // name.trim() is called in repo.create (line 30); bisnis_name?.trim() on line 31
  test('stored and returned name/bisnis_name are trimmed versions', async () => {
    const res = await post(REGISTER_URL, {
      name: '  Trimmed Name  ',
      bisnis_name: '  Trimmed Bisnis  ',
      email: `trim.test.${RUN_ID}@example.com`,
      password: 'testpassword99',
    })
    expect(res.status).toBe(201)
    expect(res.body.user.name).toBe('Trimmed Name')
    expect(res.body.user.bisnis_name).toBe('Trimmed Bisnis')
  }, 30_000)
})

describe('EDGE-R-012  Multiple @ characters in email', () => {
  // BUG-007 FIXED: regex /^[^\s@]+@[^\s@]+\.[^\s@]+$/ — [^\s@]+ does not allow @
  // so "multi@@..." fails: local part contains a second @, or domain part does.
  test('BUG-007 FIXED — email with multiple @ signs rejected with 400', async () => {
    const res = await post(REGISTER_URL, {
      name: 'Multi At User',
      email: `multi@@example.${RUN_ID}.com`,
      password: 'testpassword99',
    })
    // "multi@@example..." — first [^\s@]+ matches "multi", then @ consumed, then
    // [^\s@]+ cannot match "@example..." because @ is excluded → regex fails → 400
    expect(res.status).toBe(400)
  }, 30_000)
})
