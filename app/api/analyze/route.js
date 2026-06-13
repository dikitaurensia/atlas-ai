import { generateAnalysis } from '@/lib/analysis'

export async function POST(request) {
  const { lat, lng, category, radius } = await request.json()
  const result = generateAnalysis({ lat, lng }, category, radius)
  return Response.json(result)
}
