export function generateAnalysis(latlng, category, radius, realData = {}) {
  const { nearbyCompetitors = null, benchmark = null, footTraffic = null, accessibility = null, demographics = null } = realData

  const seed = Math.abs(Math.sin(latlng.lat * 100 + latlng.lng * 100)) * 100

  // Traffic Pejalan Kaki — Overpass amenity density
  const traffic = footTraffic
    ? footTraffic.score
    : Math.round(55 + (seed % 40))

  // Aksesibilitas — Overpass transport node count (halte, stasiun)
  const accessibilityScore = accessibility
    ? accessibility.score
    : Math.round(60 + (seed % 35))

  // Kepadatan Penduduk — area_demographics.population_density (jiwa/km²)
  // Score: 3000/km² → 35, 10000 → 57, 18000 → 83, 25000+ → 90
  // Fallback ke traffic amenity count jika tidak ada data demografis — area sepi = penduduk sedikit
  const populationScore = demographics
    ? Math.min(90, Math.max(25, Math.round(25 + demographics.population_density / 310)))
    : footTraffic
      ? Math.min(65, Math.max(15, Math.round(15 + footTraffic.amenityCount * 0.65)))
      : 20

  // Daya Beli Area — income_index dari DB, atau turunan dari foot traffic jika tidak ada data demografis
  // Area minim aktivitas komersial (hutan, pinggiran) → skor rendah secara alami
  const purchasePowerScore = demographics
    ? demographics.income_index
    : footTraffic
      ? Math.min(70, Math.max(15, Math.round(15 + footTraffic.amenityCount * 0.7)))
      : 25

  // Tingkat Persaingan — competitor count vs benchmark market density
  const competitorList = nearbyCompetitors || []
  const competitorCount = competitorList.length
  const { competition, competitionRatio } = calcCompetitionScore(competitorCount, benchmark, radius)

  const overall = Math.round((traffic + competition + accessibilityScore + populationScore + purchasePowerScore) / 5)

  let grade, gradeColor
  if (overall >= 75) { grade = 'Sangat Potensial'; gradeColor = '#10B981' }
  else if (overall >= 60) { grade = 'Potensi Bagus'; gradeColor = '#3B82F6' }
  else if (overall >= 45) { grade = 'Cukup Potensial'; gradeColor = '#F59E0B' }
  else { grade = 'Kurang Ideal'; gradeColor = '#EF4444' }

  const profitData = calcProfitRange(competitorList, benchmark)
  const { profitMin, profitMax, profitMedian, profitSource } = profitData
  const referenceCount = benchmark ? benchmark.outlet_count : Math.floor(12 + seed % 15)
  const referenceRadius = benchmark ? parseFloat(benchmark.radius_km) : Math.max(1, Math.ceil(radius / 1000 * 10) / 10)

  const trafficLabel = footTraffic
    ? footTraffic.amenityCount > 50 ? 'Area sangat ramai (data OSM)'
      : footTraffic.amenityCount > 20 ? 'Traffic pejalan kaki cukup tinggi'
      : 'Traffic pejalan kaki sedang'
    : 'Traffic tinggi di jam sibuk'

  const accessLabel = accessibility
    ? accessibility.transportCount > 15 ? 'Akses transportasi sangat baik'
      : accessibility.transportCount > 5 ? 'Transportasi umum tersedia'
      : 'Akses transportasi terbatas'
    : 'Aksesibilitas moderat'

  const tags = [
    { label: trafficLabel, type: traffic > 70 ? 'positive' : traffic > 45 ? 'neutral' : 'warning' },
    { label: `${competitorCount} kompetitor terdeteksi`, type: competitionRatio > 1.5 ? 'warning' : 'info' },
    { label: accessLabel, type: accessibilityScore > 70 ? 'positive' : accessibilityScore > 45 ? 'neutral' : 'warning' },
    { label: demographics ? `Area ${demographics.area_type} — ${demographics.name}` : 'Dekat area komersial', type: 'info' },
    { label: footTraffic ? `${footTraffic.amenityCount} titik bisnis di sekitar` : 'Estimasi kepadatan area', type: 'info' },
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
      { label: 'Traffic Pejalan Kaki', score: traffic,            source: footTraffic   ? 'osm' : 'estimated' },
      { label: 'Tingkat Persaingan',   score: competition,        source: benchmark     ? 'db'  : 'estimated' },
      { label: 'Aksesibilitas',        score: accessibilityScore, source: accessibility ? 'osm' : 'estimated' },
      { label: 'Kepadatan Penduduk',   score: populationScore,    source: demographics  ? 'db'  : 'estimated' },
      { label: 'Daya Beli Area',       score: purchasePowerScore, source: demographics  ? 'db'  : 'estimated' },
    ],
    profitMin, profitMax, profitMedian, profitSource,
    referenceCount, referenceRadius,
    tags, competitors,
    areaName: demographics?.name ?? null,
    footTrafficAmenityCount: footTraffic?.amenityCount ?? null,
    recommendation: getRecommendation(overall, category, competitorCount, competitionRatio, traffic, footTraffic, demographics),
  }
}

// Compute profit range from nearby competitors' revenue data.
// Uses IQR (p25–p75) when ≥4 competitors; min–max when fewer.
// Falls back to category benchmark when no revenue data available.
function calcProfitRange(competitors, benchmark) {
  const revenues = competitors
    .filter(c => c.revenue_min_jt != null && c.revenue_max_jt != null)
    .map(c => (parseInt(c.revenue_min_jt) + parseInt(c.revenue_max_jt)) / 2)
    .sort((a, b) => a - b)

  if (revenues.length === 0) {
    return benchmark
      ? { profitMin: benchmark.min_jt, profitMax: benchmark.max_jt, profitMedian: null, profitSource: 'benchmark' }
      : { profitMin: null, profitMax: null, profitMedian: null, profitSource: 'none' }
  }

  const mid = Math.floor(revenues.length / 2)
  const median = revenues.length % 2 === 0
    ? Math.round((revenues[mid - 1] + revenues[mid]) / 2)
    : revenues[mid]

  let profitMin, profitMax
  if (revenues.length >= 4) {
    profitMin = Math.round(revenues[Math.floor(revenues.length * 0.25)])
    profitMax = Math.round(revenues[Math.floor(revenues.length * 0.75)])
  } else {
    profitMin = Math.round(revenues[0])
    profitMax = Math.round(revenues[revenues.length - 1])
  }

  return { profitMin, profitMax, profitMedian: median, profitSource: 'competitors' }
}

function calcCompetitionScore(actualCount, benchmark, radius) {
  if (!benchmark) {
    const score = Math.min(90, Math.max(15, Math.round(90 - actualCount * 8)))
    return { competition: score, competitionRatio: actualCount / 3 }
  }

  const benchmarkRadiusM = parseFloat(benchmark.radius_km) * 1000
  const areaRatio = (radius / benchmarkRadiusM) ** 2
  const expectedCount = parseFloat(benchmark.outlet_count) * areaRatio
  const ratio = expectedCount > 0 ? actualCount / expectedCount : 0

  // ratio 0 → 90, 0.5 → 71, 1.0 → 53, 1.5 → 34, 2.0+ → 15
  const score = Math.min(90, Math.max(15, Math.round(90 - ratio * 37.5)))
  return { competition: score, competitionRatio: ratio }
}

function getRecommendation(score, category, competitorCount, competitionRatio, traffic, footTraffic, demographics) {
  const trafficNote = footTraffic
    ? footTraffic.amenityCount > 50 ? `Area sangat ramai dengan ${footTraffic.amenityCount} titik bisnis aktif.`
      : footTraffic.amenityCount > 20 ? `Terdapat ${footTraffic.amenityCount} titik bisnis di sekitar — area cukup aktif.`
      : `Area relatif sepi, hanya ${footTraffic.amenityCount} titik bisnis terdeteksi.`
    : traffic > 70 ? 'Traffic pejalan kaki di area ini cukup tinggi.'
    : 'Traffic pejalan kaki di area ini moderat.'

  const competitionNote = competitorCount === 0
    ? 'Tidak ada kompetitor langsung dalam radius — peluang menjadi pionir.'
    : competitionRatio < 0.5
    ? `${competitorCount} kompetitor, jauh di bawah rata-rata pasar — pasar masih terbuka.`
    : competitionRatio < 1.0
    ? `${competitorCount} kompetitor, di bawah rata-rata kepadatan pasar kategori ini.`
    : competitionRatio < 1.5
    ? `${competitorCount} kompetitor, sesuai rata-rata pasar — diferensiasi produk menjadi kunci.`
    : `${competitorCount} kompetitor, ${(competitionRatio * 100).toFixed(0)}% di atas rata-rata — persaingan ketat.`

  const demoNote = demographics
    ? `Daya beli area ${demographics.name} tergolong ${demographics.income_index >= 80 ? 'tinggi' : demographics.income_index >= 65 ? 'menengah' : 'menengah-bawah'} dengan kepadatan ${demographics.population_density.toLocaleString('id')} jiwa/km².`
    : ''

  if (score >= 75) return `Lokasi ini memiliki potensi sangat baik untuk bisnis ${category}. ${trafficNote} ${competitionNote} ${demoNote}`.trim()
  if (score >= 60) return `Lokasi cukup menjanjikan untuk ${category}. ${trafficNote} ${competitionNote} ${demoNote}`.trim()
  if (score >= 45) return `Lokasi ini memiliki potensi moderat untuk ${category}. ${trafficNote} ${competitionNote} ${demoNote} Disarankan survei lapangan sebelum memutuskan.`.trim()
  return `Lokasi ini menunjukkan beberapa risiko untuk bisnis ${category}. ${trafficNote} ${competitionNote} ${demoNote} Pertimbangkan lokasi alternatif.`.trim()
}
