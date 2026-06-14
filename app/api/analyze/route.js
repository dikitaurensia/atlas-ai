import { generateAnalysis } from '@/lib/analysis'
import sql from '@/lib/db'

// Count transport infrastructure nodes via Overpass — proxy for accessibility
async function fetchAccessibilityScore(lat, lng, radius) {
  try {
    const q = `[out:json][timeout:10];(node["highway"="bus_stop"](around:${radius},${lat},${lng});node["railway"~"station|halt|tram_stop|subway_entrance"](around:${radius},${lat},${lng});node["amenity"~"bus_station|taxi"](around:${radius},${lat},${lng}););out count;`

    const res = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`,
      {
        headers: {
          'Accept': '*/*',
          'User-Agent': 'AtlasAI/1.0 (FnB location intelligence; contact: atlas@esb.co.id)',
        },
        signal: AbortSignal.timeout(12000),
      }
    )
    if (!res.ok) return null

    const data = await res.json()
    const total = parseInt(data.elements?.[0]?.tags?.total || '0', 10)

    // 0 nodes → 20 (isolated), 10 → 55, 20 → 90, 22+ → 95
    const score = Math.min(95, Math.max(20, Math.round(20 + total * 3.5)))
    return { score, transportCount: total }
  } catch {
    return null
  }
}

// Count FnB + retail + office amenities via Overpass — proxy for foot traffic
async function fetchFootTrafficScore(lat, lng, radius) {
  try {
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

    // 0 → 20, 20 → 39, 50 → 68, 80+ → 95
    const score = Math.min(95, Math.max(20, Math.round(20 + total * 0.95)))
    return { score, amenityCount: total }
  } catch {
    return null
  }
}

async function fetchDBData(lat, lng, category, radius) {
  const radiusLat = radius / 111320.0
  const radiusLng = radius / (111320.0 * Math.cos(lat * Math.PI / 180))
  const latMin = lat - radiusLat
  const latMax = lat + radiusLat
  const lngMin = lng - radiusLng
  const lngMax = lng + radiusLng

  const [rows, benchmarkRows, demoRows] = await Promise.all([
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
    sql`
      SELECT name, population_density, income_index, area_type
      FROM area_demographics
      WHERE lat_min <= ${lat} AND ${lat} <= lat_max
        AND lng_min <= ${lng} AND ${lng} <= lng_max
      ORDER BY (lat_max - lat_min) * (lng_max - lng_min) ASC
      LIMIT 1
    `,
  ])

  return {
    competitors: rows,
    benchmark: benchmarkRows[0] || null,
    demographics: demoRows[0] || null,
  }
}

export async function POST(request) {
  const { lat, lng, category, radius } = await request.json()

  // All 3 data sources run in parallel
  const [dbResult, trafficResult, accessibilityResult] = await Promise.allSettled([
    fetchDBData(lat, lng, category, radius),
    fetchFootTrafficScore(lat, lng, radius),
    fetchAccessibilityScore(lat, lng, radius),
  ])

  let nearbyCompetitors = []
  let benchmark = null
  let demographics = null

  if (dbResult.status === 'fulfilled') {
    nearbyCompetitors = dbResult.value.competitors
    benchmark = dbResult.value.benchmark
    demographics = dbResult.value.demographics
  } else {
    console.error('[analyze] DB error:', dbResult.reason?.message)
    try {
      nearbyCompetitors = await sql`
        SELECT id, name, lat, lng, address, 0 AS distance_m
        FROM competitors WHERE category = ${category} LIMIT 5
      `
    } catch { /* stay empty */ }
  }

  const footTraffic = trafficResult.status === 'fulfilled' ? trafficResult.value : null
  const accessibility = accessibilityResult.status === 'fulfilled' ? accessibilityResult.value : null

  const result = generateAnalysis(
    { lat, lng }, category, radius,
    { nearbyCompetitors, benchmark, footTraffic, accessibility, demographics }
  )
  return Response.json(result)
}
