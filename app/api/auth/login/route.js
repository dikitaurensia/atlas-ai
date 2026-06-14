import { NextResponse } from 'next/server'
import { getDataSource } from '@/lib/data-source'
import { UserSchema } from '@/lib/entities/UserSchema'
import { verifyPassword, signToken, cookieOpts, COOKIE } from '@/lib/auth'

export async function POST(req) {
  try {
    const { email, password } = await req.json()

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 })
    }

    const dataSource = await getDataSource()
    const repo = dataSource.getRepository(UserSchema)

    const user = await repo.findOne({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, name: true, bisnis_name: true, email: true, password_hash: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    const valid = await verifyPassword(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Email atau password salah' }, { status: 401 })
    }

    const token = await signToken({ userId: user.id, email: user.email, name: user.name, bisnis_name: user.bisnis_name })
    const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, bisnis_name: user.bisnis_name, email: user.email } })
    res.cookies.set(COOKIE, token, cookieOpts())
    return res
  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
