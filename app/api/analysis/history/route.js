import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE } from '@/lib/auth'
import sql from '@/lib/db'

export async function GET() {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return NextResponse.json({ items: [] }, { status: 401 })

  let payload
  try { payload = await verifyToken(token) } catch {
    return NextResponse.json({ items: [] }, { status: 401 })
  }

  const rows = await sql`
    SELECT id, location, category, lat, lng, radius, overall, grade, result_json, created_at
    FROM saved_analyses
    WHERE user_id = ${payload.userId}
    ORDER BY created_at DESC
    LIMIT 100
  `

  return NextResponse.json({ items: rows })
}
