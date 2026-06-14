import { generateAnalysis } from '@/lib/analysis'
import sql from '@/lib/db'

export async function POST(request) {
  const { lat, lng, category, radius } = await request.json()

  let nearbyCompetitors = null
  let benchmark = null

  try {
    // Bounding box pre-filter, then exact Haversine inside subquery
    const radiusLat = radius / 111320.0
    const radiusLng = radius / (111320.0 * Math.cos(lat * Math.PI / 180))
    const latMin = lat - radiusLat
    const latMax = lat + radiusLat
    const lngMin = lng - radiusLng
    const lngMax = lng + radiusLng

    const rows = await sql`
      SELECT * FROM (
        SELECT id, name, lat, lng, address,
          6371000 * acos(
            LEAST(1.0,
              cos(radians(${lat})) * cos(radians(lat)) *
              cos(radians(lng) - radians(${lng})) +
              sin(radians(${lat})) * sin(radians(lat))
            )
          ) AS distance_m
        FROM competitors
        WHERE category = ${category}
          AND lat BETWEEN ${latMin} AND ${latMax}
          AND lng BETWEEN ${lngMin} AND ${lngMax}
      ) sub
      WHERE distance_m <= ${radius}
      ORDER BY distance_m
    `

    const benchmarkRows = await sql`
      SELECT * FROM profit_benchmarks WHERE category = ${category} LIMIT 1
    `

    nearbyCompetitors = rows
    benchmark = benchmarkRows[0] || null
  } catch (err) {
    console.error('[analyze] DB error, using mock data:', err.message)
  }

  const result = generateAnalysis({ lat, lng }, category, radius, { nearbyCompetitors, benchmark })
  return Response.json(result)
}
