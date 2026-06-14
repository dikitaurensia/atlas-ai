import { NextResponse } from 'next/server'
import { getDataSource } from '@/lib/data-source'
import { UserSchema } from '@/lib/entities/UserSchema'
import { hashPassword, signToken, cookieOpts, COOKIE } from '@/lib/auth'

export async function POST(req) {
  try {
    const { name, bisnis_name, email, password } = await req.json()

    // BUG-006: cek whitespace agar password "        " tidak lolos
    if (!name?.trim() || !email?.trim() || !password?.trim()) {
      return NextResponse.json({ error: 'Nama, email, dan password wajib diisi' }, { status: 400 })
    }
    if (password.trim().length < 8) {
      return NextResponse.json({ error: 'Password minimal 8 karakter' }, { status: 400 })
    }
    // BUG-007: validasi email lebih ketat dari sekadar includes('@')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Format email tidak valid' }, { status: 400 })
    }

    const dataSource = await getDataSource()
    const repo = dataSource.getRepository(UserSchema)

    const existing = await repo.findOne({ where: { email: email.toLowerCase().trim() } })
    if (existing) {
      return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })
    }

    const password_hash = await hashPassword(password)
    const user = repo.create({
      name: name.trim(),
      bisnis_name: bisnis_name?.trim() || null,
      email: email.toLowerCase().trim(),
      password_hash,
    })
    let saved
    try {
      saved = await repo.save(user)
    } catch (dbErr) {
      // BUG-008: race condition — dua request konkuren untuk email yang sama mengenai unique constraint
      if (dbErr.code === '23505') {
        return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 409 })
      }
      throw dbErr
    }

    const token = await signToken({ userId: saved.id, email: saved.email, name: saved.name, bisnis_name: saved.bisnis_name })

    const res = NextResponse.json(
      { ok: true, user: { id: saved.id, name: saved.name, bisnis_name: saved.bisnis_name, email: saved.email } },
      { status: 201 }
    )
    res.cookies.set(COOKIE, token, cookieOpts())
    return res
  } catch (err) {
    console.error('[register]', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
