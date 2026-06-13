import { NextResponse } from 'next/server'
import sql from '@/lib/db'
import { hashPassword, signToken, cookieOpts, COOKIE } from '@/lib/auth'

export async function POST(req) {
  try {
    const { name, bisnis_name, email, password } = await req.json()

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: 'Nama, email, dan password wajib diisi' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 })
    }
    if (!email.includes('@')) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 })
    }

    const existing = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase().trim()}`
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })
    }

    const passwordHash = await hashPassword(password)
    const [user] = await sql`
      INSERT INTO users (name, bisnis_name, email, password_hash)
      VALUES (${name.trim()}, ${bisnis_name?.trim() || null}, ${email.toLowerCase().trim()}, ${passwordHash})
      RETURNING id, name, bisnis_name, email, created_at
    `

    const token = await signToken({ userId: user.id, email: user.email, name: user.name })
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, email: user.email } }, { status: 201 })
    res.cookies.set(COOKIE, token, cookieOpts())
    return res
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
