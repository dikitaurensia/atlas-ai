import { generateAnalysis } from '@/lib/analysis'
import sql from '@/lib/db'

// Query Overpass API (OpenStreetMap) to count amenities near a point.
// Amenity density is a reliable proxy for pedestrian foot traffic.
async function fetchFootTrafficScore(lat, lng, radius) {
  try {
    // Single union query — count FnB + retail + office nodes in radius
    const q = `[out:json][timeout:12];(node["amenity"~"restaurant|cafe|fast_food|bar|food_court|bank|atm"](around:${radius},${lat},${lng});node["shop"~"mall|supermarket|convenience|clothes|electronics"](around:${radius},${lat},${lng});node["office"](around:${radius},${lat},${lng}););out count;`

    const res = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`,
      {
        headers: {
          'Accept': '*/*',
          'User-Agent': 'AtlasAI/1.0 (FnB location intelligence; contact: atlas@esb.co.id)',
        },
        signal: AbortSignal.timeout(14000),
      }
    )

    if (!res.ok) return null

    const data = await res.json()
    const total = parseInt(data.elements?.[0]?.tags?.total || '0', 10)

    // Normalize to 20–95:
    //   0 amenities  → 20 (very sparse)
    //  20 amenities  → 39 (residential)
    //  50 amenities  → 68 (commercial)
    //  80+ amenities → 95 (dense like Sudirman/SCBD)
    const score = Math.min(95, Math.max(20, Math.round(20 + total * 0.95)))
    return { score, amenityCount: total }
  } catch {
    return null
  }
}

export async function POST(request) {
  const { lat, lng, category, radius } = await request.json()

  let nearbyCompetitors = []
  let benchmark = null
  let footTraffic = null

  // Run all data fetches in parallel
  const [dbResult, trafficResult] = await Promise.allSettled([
    (async () => {
      const radiusLat = radius / 111320.0
      const radiusLng = radius / (111320.0 * Math.cos(lat * Math.PI / 180))
      const latMin = lat - radiusLat
      const latMax = lat + radiusLat
      const lngMin = lng - radiusLng
      const lngMax = lng + radiusLng

      const [rows, benchmarkRows] = await Promise.all([
        sql`
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
        `,
        sql`SELECT * FROM profit_benchmarks WHERE category = ${category} LIMIT 1`,
      ])

      return { competitors: rows, benchmark: benchmarkRows[0] || null }
    })(),
    fetchFootTrafficScore(lat, lng, radius),
  ])

  if (dbResult.status === 'fulfilled') {
    nearbyCompetitors = dbResult.value.competitors
    benchmark = dbResult.value.benchmark
  } else {
    console.error('[analyze] DB error:', dbResult.reason?.message)
    // Minimal fallback — sample from category
    try {
      nearbyCompetitors = await sql`
        SELECT id, name, lat, lng, address, 0 AS distance_m
        FROM competitors WHERE category = ${category} LIMIT 5
      `
    } catch { /* stay empty */ }
  }

  if (trafficResult.status === 'fulfilled') {
    footTraffic = trafficResult.value
  }

  const result = generateAnalysis(
    { lat, lng }, category, radius,
    { nearbyCompetitors, benchmark, footTraffic }
  )
  return Response.json(result)
}
