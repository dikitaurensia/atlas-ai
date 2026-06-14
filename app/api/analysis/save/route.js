import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE } from '@/lib/auth'
import sql from '@/lib/db'

async function getPayload() {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  try { return await verifyToken(token) } catch { return null }
}

export async function POST(req) {
  const payload = await getPayload()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { location, category, lat, lng, radius, result } = await req.json()
  if (!location || !category || !lat || !lng || !radius || !result) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const [row] = await sql`
    INSERT INTO saved_analyses (user_id, location, category, lat, lng, radius, overall, grade, result_json)
    VALUES (
      ${payload.userId}, ${location}, ${category},
      ${lat}, ${lng}, ${radius},
      ${result.overall}, ${result.grade}, ${JSON.stringify(result)}
    )
    RETURNING id, created_at
  `

  return NextResponse.json({ id: row.id, created_at: row.created_at })
}

export async function DELETE(req) {
  const payload = await getPayload()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  await sql`
    DELETE FROM saved_analyses WHERE id = ${id} AND user_id = ${payload.userId}
  `

  return NextResponse.json({ ok: true })
}
