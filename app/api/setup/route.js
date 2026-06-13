import { NextResponse } from 'next/server'
import sql from '@/lib/db'

// Call this endpoint once to initialize the database schema.
// Idempotent — safe to run multiple times.
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  if (searchParams.get('token') !== process.env.SETUP_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name        TEXT NOT NULL,
        bisnis_name TEXT,
        email       TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      )
    `
    await sql`CREATE INDEX IF NOT EXISTS users_email_idx ON users (email)`

    return NextResponse.json({ ok: true, message: 'Database initialized' })
  } catch (err) {
    console.error('[setup]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
