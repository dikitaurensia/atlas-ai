import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE } from '@/lib/auth'
import { getDataSource } from '@/lib/data-source'
import { SavedAnalysisSchema } from '@/lib/entities/SavedAnalysisSchema'

async function getPayload() {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return null
  try { return await verifyToken(token) } catch { return null }
}

export async function POST(req) {
  const payload = await getPayload()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { location, category, lat, lng, radius, result } = await req.json()
  // BUG-012: lat=0 dan lng=0 adalah koordinat valid (Null Island) — gunakan == null bukan falsy check
  if (!location || !category || lat == null || lng == null || !radius || !result) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const dataSource = await getDataSource()
  const repo = dataSource.getRepository(SavedAnalysisSchema)

  const entry = repo.create({
    user_id: payload.userId,
    location,
    category,
    lat,
    lng,
    radius,
    overall: result.overall,
    grade: result.grade,
    result_json: result,
  })
  const saved = await repo.save(entry)

  return NextResponse.json({ id: saved.id, created_at: saved.created_at })
}

export async function DELETE(req) {
  const payload = await getPayload()
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const dataSource = await getDataSource()
  const repo = dataSource.getRepository(SavedAnalysisSchema)

  await repo.delete({ id, user_id: payload.userId })

  return NextResponse.json({ ok: true })
}
