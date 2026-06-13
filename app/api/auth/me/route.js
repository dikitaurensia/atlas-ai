import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE } from '@/lib/auth'

export async function GET() {
  try {
    const token = (await cookies()).get(COOKIE)?.value
    if (!token) return NextResponse.json({ user: null }, { status: 401 })
    const payload = await verifyToken(token)
    return NextResponse.json({ user: { userId: payload.userId, name: payload.name, email: payload.email } })
  } catch {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
