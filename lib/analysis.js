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

  const competitorList = nearbyCompetitors || []
  const competitorCount = competitorList.length
  const { competition, competitionRatio } = calcCompetitionScore(competitorCount, benchmark, radius)

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
    { label: `${competitorCount} kompetitor terdeteksi`, type: competitionRatio > 1.5 ? 'warning' : 'info' },
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
      { label: 'Tingkat Persaingan', score: competition, source: benchmark ? 'db' : 'estimated' },
      { label: 'Aksesibilitas', score: accessibility, source: 'estimated' },
      { label: 'Kepadatan Penduduk', score: population, source: 'estimated' },
      { label: 'Daya Beli Area', score: purchasePower, source: 'estimated' },
    ],
    profitMin, profitMax,
    referenceCount, referenceRadius,
    tags, competitors,
    footTrafficAmenityCount: footTraffic?.amenityCount ?? null,
    recommendation: getRecommendation(overall, category, competitorCount, competitionRatio, traffic, footTraffic),
  }
}

// Competition score derived from market benchmark in profit_benchmarks table.
// Compares actual competitor count vs expected density for the category and radius.
function calcCompetitionScore(actualCount, benchmark, radius) {
  if (!benchmark) {
    // No benchmark data — simple linear fallback
    const score = Math.min(90, Math.max(15, Math.round(90 - actualCount * 8)))
    return { competition: score, competitionRatio: actualCount / 3 }
  }

  const benchmarkRadiusM = parseFloat(benchmark.radius_km) * 1000
  // Scale outlet_count proportionally to the searched area (area ∝ r²)
  const areaRatio = (radius / benchmarkRadiusM) ** 2
  const expectedCount = parseFloat(benchmark.outlet_count) * areaRatio

  // Ratio of actual vs expected market density
  const ratio = expectedCount > 0 ? actualCount / expectedCount : 0

  // ratio = 0   → score 90 (pioneer opportunity — no competition)
  // ratio = 0.5 → score 73 (below average competition)
  // ratio = 1.0 → score 55 (market average)
  // ratio = 1.5 → score 38 (above average — tight market)
  // ratio ≥ 2.0 → score 15 (saturated)
  const score = Math.min(90, Math.max(15, Math.round(90 - ratio * 37.5)))

  return { competition: score, competitionRatio: ratio }
}

function getRecommendation(score, category, competitorCount, competitionRatio, traffic, footTraffic) {
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
    : competitionRatio < 0.5
    ? `${competitorCount} kompetitor terdeteksi, jauh di bawah rata-rata pasar — pasar masih terbuka lebar.`
    : competitionRatio < 1.0
    ? `${competitorCount} kompetitor terdeteksi, di bawah rata-rata kepadatan pasar untuk kategori ini.`
    : competitionRatio < 1.5
    ? `${competitorCount} kompetitor terdeteksi, sesuai rata-rata pasar — diferensiasi produk menjadi kunci.`
    : `${competitorCount} kompetitor terdeteksi, kepadatan ${(competitionRatio * 100).toFixed(0)}% di atas rata-rata pasar — persaingan ketat.`

  if (score >= 75) return `Lokasi ini memiliki potensi sangat baik untuk bisnis ${category}. ${trafficNote} ${competitionNote}`
  if (score >= 60) return `Lokasi cukup menjanjikan untuk ${category}. ${trafficNote} ${competitionNote} Pertimbangkan strategi diferensiasi untuk memaksimalkan potensi area ini.`
  if (score >= 45) return `Lokasi ini memiliki potensi moderat untuk ${category}. ${trafficNote} ${competitionNote} Disarankan survei lapangan sebelum memutuskan.`
  return `Lokasi ini menunjukkan beberapa risiko untuk bisnis ${category}. ${trafficNote} ${competitionNote} Pertimbangkan lokasi alternatif.`
}
