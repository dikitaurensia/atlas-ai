import { cookies } from 'next/headers'
import { verifyToken, COOKIE } from '@/lib/auth'
import { generateAnalysis } from '@/lib/analysis'
import { getDataSource } from '@/lib/data-source'

const VALID_CATEGORIES = ['Ayam Goreng', 'Kopi & Cafe', 'Mie & Bakso', 'Minuman', 'Burger', 'Lainnya']
const VALID_SCALES    = ['Kecil', 'Menengah', 'Besar']

async function fetchAccessibilityScore(lat, lng, radius) {
  try {
    const q = `[out:json][timeout:10];(node["highway"="bus_stop"](around:${radius},${lat},${lng});node["railway"~"station|halt|tram_stop|subway_entrance"](around:${radius},${lat},${lng});node["amenity"~"bus_station|taxi"](around:${radius},${lat},${lng}););out count;`
    const res = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`,
      {
        headers: { 'Accept': '*/*', 'User-Agent': 'AtlasAI/1.0 (FnB location intelligence; contact: atlas@esb.co.id)' },
        signal: AbortSignal.timeout(12000),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const total = parseInt(data.elements?.[0]?.tags?.total || '0', 10)
    // Normalisasi ke densitas per km² — skor tidak bergantung radius
    const areakm2 = Math.PI * Math.pow(radius / 1000, 2)
    const density = total / areakm2
    const score = Math.min(95, Math.max(20, Math.round(20 + density * 5)))
    return { score, transportCount: total }
  } catch {
    return null
  }
}

async function fetchFootTrafficScore(lat, lng, radius) {
  try {
    const q = `[out:json][timeout:12];(node["amenity"~"restaurant|cafe|fast_food|bar|food_court|bank|atm"](around:${radius},${lat},${lng});node["shop"~"mall|supermarket|convenience|clothes|electronics"](around:${radius},${lat},${lng});node["office"](around:${radius},${lat},${lng}););out count;`
    const res = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`,
      {
        headers: { 'Accept': '*/*', 'User-Agent': 'AtlasAI/1.0 (FnB location intelligence; contact: atlas@esb.co.id)' },
        signal: AbortSignal.timeout(14000),
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    const total = parseInt(data.elements?.[0]?.tags?.total || '0', 10)
    // Normalisasi ke densitas per km² — skor tidak bergantung radius
    const areakm2 = Math.PI * Math.pow(radius / 1000, 2)
    const density = total / areakm2
    const score = Math.min(95, Math.max(20, Math.round(20 + density * 0.75)))
    return { score, amenityCount: total }
  } catch {
    return null
  }
}

async function fetchDBData(dataSource, lat, lng, category, radius) {
  const radiusLat = radius / 111320.0
  const radiusLng = radius / (111320.0 * Math.cos(lat * Math.PI / 180))
  const latMin = lat - radiusLat
  const latMax = lat + radiusLat
  const lngMin = lng - radiusLng
  const lngMax = lng + radiusLng

  const [competitors, benchmarks, demographics] = await Promise.all([
    dataSource.query(
      `SELECT * FROM (
         SELECT id, name, lat, lng, address, revenue_min_jt, revenue_max_jt,
           6371000 * acos(
             LEAST(1.0,
               cos(radians($1)) * cos(radians(lat)) *
               cos(radians(lng) - radians($2)) +
               sin(radians($1)) * sin(radians(lat))
             )
           ) AS distance_m
         FROM competitors
         WHERE category = $3
           AND lat BETWEEN $4 AND $5
           AND lng BETWEEN $6 AND $7
       ) sub
       WHERE distance_m <= $8
       ORDER BY distance_m`,
      [lat, lng, category, latMin, latMax, lngMin, lngMax, radius]
    ),
    dataSource.query(
      `SELECT * FROM profit_benchmarks WHERE category = $1 LIMIT 1`,
      [category]
    ),
    dataSource.query(
      `SELECT name, population_density, income_index, area_type
       FROM area_demographics
       WHERE lat_min <= $1 AND $1 <= lat_max
         AND lng_min <= $2 AND $2 <= lng_max
       ORDER BY (lat_max - lat_min) * (lng_max - lng_min) ASC
       LIMIT 1`,
      [lat, lng]
    ),
  ])

  return {
    competitors,
    benchmark: benchmarks[0] || null,
    demographics: demographics[0] || null,
  }
}

async function fetchPOIs(lat, lng, radius) {
  try {
    const q = `[out:json][timeout:10];(node["amenity"~"restaurant|cafe|fast_food|bar|food_court"](around:${radius},${lat},${lng});node["shop"~"mall|supermarket|convenience"](around:${radius},${lat},${lng}););out 120;`
    const res = await fetch(
      `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`,
      {
        headers: { 'Accept': '*/*', 'User-Agent': 'AtlasAI/1.0 (FnB location intelligence; contact: atlas@esb.co.id)' },
        signal: AbortSignal.timeout(12000),
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    return data.elements
      .filter(e => e.lat != null && e.lon != null)
      .map(e => ({
        lat: e.lat,
        lng: e.lon,
        type: e.tags?.amenity || e.tags?.shop || 'other',
        name: e.tags?.name || null,
      }))
  } catch {
    return []
  }
}

export async function POST(request) {
  // BUG-001: Auth guard — endpoint tidak boleh publik
  const token = (await cookies()).get(COOKIE)?.value
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try { await verifyToken(token) } catch { return Response.json({ error: 'Unauthorized' }, { status: 401 }) }

  // BUG-005: Seluruh handler dibungkus try/catch
  try {
    // BUG-002: Validasi input sebelum menyentuh DB
    let body
    try { body = await request.json() } catch {
      return Response.json({ error: 'Request body tidak valid' }, { status: 400 })
    }

    const { lat, lng, category, radius, scale = 'Menengah' } = body

    if (lat == null || lng == null || !category || radius == null) {
      return Response.json({ error: 'lat, lng, category, dan radius wajib diisi' }, { status: 400 })
    }
    if (typeof lat !== 'number' || typeof lng !== 'number' || !isFinite(lat) || !isFinite(lng)) {
      return Response.json({ error: 'lat dan lng harus berupa angka' }, { status: 400 })
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return Response.json({ error: 'Koordinat tidak valid' }, { status: 400 })
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return Response.json({ error: 'Kategori tidak valid' }, { status: 400 })
    }
    // BUG-011: Radius harus dalam rentang 200–1500 m
    const r = Number(radius)
    if (!Number.isFinite(r) || r < 200 || r > 1500) {
      return Response.json({ error: 'Radius harus antara 200 dan 1500 meter' }, { status: 400 })
    }
    if (!VALID_SCALES.includes(scale)) {
      return Response.json({ error: 'Skala tidak valid' }, { status: 400 })
    }

    const dataSource = await getDataSource()

    const [dbResult, trafficResult, accessibilityResult, poisResult] = await Promise.allSettled([
      fetchDBData(dataSource, lat, lng, category, r),
      fetchFootTrafficScore(lat, lng, r),
      fetchAccessibilityScore(lat, lng, r),
      fetchPOIs(lat, lng, r),
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
        nearbyCompetitors = await dataSource.query(
          `SELECT id, name, lat, lng, address, 0 AS distance_m FROM competitors WHERE category = $1 LIMIT 5`,
          [category]
        )
      } catch { /* stay empty */ }
    }

    const footTraffic    = trafficResult.status === 'fulfilled'      ? trafficResult.value      : null
    const accessibility  = accessibilityResult.status === 'fulfilled' ? accessibilityResult.value : null
    const pois           = poisResult.status === 'fulfilled' && Array.isArray(poisResult.value) ? poisResult.value : []
    const OSM_FOOD_TYPES = new Set(['restaurant', 'cafe', 'fast_food', 'bar', 'food_court'])
    const osmFoodCount   = pois.filter(p => OSM_FOOD_TYPES.has(p.type)).length

    if (!demographics) {
      return Response.json({
        unsupported: true,
        message: 'Area ini berada di luar cakupan AtlasAI. Saat ini kami mendukung analisis untuk wilayah DKI Jakarta.',
      })
    }

    const result = generateAnalysis(
      { lat, lng }, category, r,
      { nearbyCompetitors, benchmark, footTraffic, accessibility, demographics, osmFoodCount },
      scale
    )
    return Response.json({ ...result, pois })

  } catch (err) {
    console.error('[analyze]', err)
    return Response.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
