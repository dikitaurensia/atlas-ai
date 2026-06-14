export function generateAnalysis(latlng, category, radius, realData = {}) {
  const { nearbyCompetitors = null, benchmark = null, footTraffic = null } = realData

  const seed = Math.abs(Math.sin(latlng.lat * 100 + latlng.lng * 100)) * 100

  // Traffic Pejalan Kaki — from Overpass amenity density; fallback to seed
  const traffic = footTraffic
    ? footTraffic.score
    : Math.round(55 + (seed % 40))

  const accessibility = Math.round(60 + (seed % 35))
  const population = Math.round(50 + (seed % 45))
  const purchasePower = Math.round(45 + (seed % 50))

  // Competition score: fewer competitors = higher score (less crowded = more opportunity)
  const competitorList = nearbyCompetitors || []
  const competitorCount = competitorList.length
  const competition = Math.min(90, Math.max(15, Math.round(90 - competitorCount * 8)))

  const overall = Math.round((traffic + competition + accessibility + population + purchasePower) / 5)

  let grade, gradeColor
  if (overall >= 75) { grade = 'Sangat Potensial'; gradeColor = '#10B981' }
  else if (overall >= 60) { grade = 'Potensi Bagus'; gradeColor = '#3B82F6' }
  else if (overall >= 45) { grade = 'Cukup Potensial'; gradeColor = '#F59E0B' }
  else { grade = 'Kurang Ideal'; gradeColor = '#EF4444' }

  const profitMin = benchmark ? benchmark.min_jt : Math.round(overall * 1.2 + 10)
  const profitMax = benchmark ? benchmark.max_jt : Math.round(overall * 2.1 + 20)
  const referenceCount = benchmark ? benchmark.outlet_count : Math.floor(12 + seed % 15)
  const referenceRadius = benchmark ? parseFloat(benchmark.radius_km) : Math.max(1, Math.ceil(radius / 1000 * 10) / 10)

  const trafficLabel = footTraffic
    ? footTraffic.amenityCount > 50 ? 'Area sangat ramai (data OSM)'
      : footTraffic.amenityCount > 20 ? 'Traffic pejalan kaki cukup tinggi'
      : 'Traffic pejalan kaki sedang'
    : 'Traffic tinggi di jam sibuk'

  const tags = [
    { label: trafficLabel, type: traffic > 70 ? 'positive' : traffic > 45 ? 'neutral' : 'warning' },
    { label: `${competitorCount} kompetitor terdeteksi`, type: competitorCount > 5 ? 'warning' : 'info' },
    { label: 'Aksesibilitas tinggi', type: accessibility > 70 ? 'positive' : 'neutral' },
    { label: footTraffic ? `${footTraffic.amenityCount} titik bisnis di sekitar` : 'Dekat area komersial', type: 'info' },
    { label: 'Parkir terbatas', type: 'warning' },
    { label: `${referenceCount} outlet referensi`, type: 'info' },
  ]

  const competitors = competitorList.map((c, i) => ({
    id: c.id || i,
    name: c.name,
    lat: parseFloat(c.lat),
    lng: parseFloat(c.lng),
    distance: Math.round(parseFloat(c.distance_m)),
  }))

  return {
    overall, grade, gradeColor,
    dimensions: [
      { label: 'Traffic Pejalan Kaki', score: traffic, source: footTraffic ? 'osm' : 'estimated' },
      { label: 'Tingkat Persaingan', score: competition, source: 'db' },
      { label: 'Aksesibilitas', score: accessibility, source: 'estimated' },
      { label: 'Kepadatan Penduduk', score: population, source: 'estimated' },
      { label: 'Daya Beli Area', score: purchasePower, source: 'estimated' },
    ],
    profitMin, profitMax,
    referenceCount, referenceRadius,
    tags, competitors,
    footTrafficAmenityCount: footTraffic?.amenityCount ?? null,
    recommendation: getRecommendation(overall, category, competitorCount, traffic, footTraffic),
  }
}

function getRecommendation(score, category, competitorCount, traffic, footTraffic) {
  const trafficNote = footTraffic
    ? footTraffic.amenityCount > 50
      ? `Area ini sangat ramai dengan ${footTraffic.amenityCount} titik bisnis aktif di sekitarnya.`
      : footTraffic.amenityCount > 20
      ? `Terdapat ${footTraffic.amenityCount} titik bisnis di sekitar, menunjukkan area cukup aktif.`
      : `Area relatif sepi dengan hanya ${footTraffic.amenityCount} titik bisnis terdeteksi.`
    : traffic > 70 ? 'Traffic pejalan kaki di area ini cukup tinggi.'
    : 'Traffic pejalan kaki di area ini moderat.'

  const competitionNote = competitorCount === 0
    ? 'Tidak ada kompetitor langsung dalam radius — peluang menjadi pionir.'
    : competitorCount <= 3
    ? `Hanya ${competitorCount} kompetitor terdeteksi, pasar belum jenuh.`
    : `Terdapat ${competitorCount} kompetitor aktif, diferensiasi produk menjadi kunci.`

  if (score >= 75) return `Lokasi ini memiliki potensi sangat baik untuk bisnis ${category}. ${trafficNote} ${competitionNote}`
  if (score >= 60) return `Lokasi cukup menjanjikan untuk ${category}. ${trafficNote} ${competitionNote} Pertimbangkan strategi diferensiasi untuk memaksimalkan potensi area ini.`
  if (score >= 45) return `Lokasi ini memiliki potensi moderat untuk ${category}. ${trafficNote} ${competitionNote} Disarankan survei lapangan sebelum memutuskan.`
  return `Lokasi ini menunjukkan beberapa risiko untuk bisnis ${category}. ${trafficNote} ${competitionNote} Pertimbangkan lokasi alternatif.`
}
