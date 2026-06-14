import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken, COOKIE } from '@/lib/auth'
import { getDataSource } from '@/lib/data-source'
import { SavedAnalysisSchema } from '@/lib/entities/SavedAnalysisSchema'

export async function GET() {
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return NextResponse.json({ items: [] }, { status: 401 })

  let payload
  try { payload = await verifyToken(token) } catch {
    return NextResponse.json({ items: [] }, { status: 401 })
  }

  const dataSource = await getDataSource()
  const repo = dataSource.getRepository(SavedAnalysisSchema)

  const items = await repo.find({
    where: { user_id: payload.userId },
    order: { created_at: 'DESC' },
    take: 100,
  })

  return NextResponse.json({ items })
}
