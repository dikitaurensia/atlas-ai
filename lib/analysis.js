export function generateAnalysis(latlng, category, radius, realData = {}) {
  const { nearbyCompetitors = null, benchmark = null, footTraffic = null, accessibility = null, demographics = null } = realData

  // Traffic Pejalan Kaki — Overpass amenity density (null jika OSM tidak tersedia)
  const traffic = footTraffic ? footTraffic.score : null

  // Aksesibilitas — Overpass transport node count (null jika OSM tidak tersedia)
  const accessibilityScore = accessibility ? accessibility.score : null

  // Kepadatan Penduduk — BPS 2020 via area_demographics (dijamin ada karena sudah di-gate di route.js)
  // Score: 3000/km² → 35, 10000 → 57, 18000 → 83, 25000+ → 90
  const populationScore = Math.min(90, Math.max(25, Math.round(25 + demographics.population_density / 310)))

  // Daya Beli Area — income_index BPS dari area_demographics (0–100)
  const purchasePowerScore = demographics.income_index

  // Tingkat Persaingan — competitor count vs benchmark market density
  const competitorList = nearbyCompetitors || []
  const competitorCount = competitorList.length
  const { competition, competitionRatio } = calcCompetitionScore(competitorCount, benchmark, radius)

  // Overall: rata-rata dari dimensi yang tersedia saja (OSM bisa null jika Overpass timeout)
  const availableScores = [traffic, competition, accessibilityScore, populationScore, purchasePowerScore].filter(s => s !== null)
  const overall = Math.round(availableScores.reduce((a, b) => a + b, 0) / availableScores.length)

  let grade, gradeColor
  if (overall >= 75) { grade = 'Sangat Potensial'; gradeColor = '#10B981' }
  else if (overall >= 60) { grade = 'Potensi Bagus'; gradeColor = '#3B82F6' }
  else if (overall >= 45) { grade = 'Cukup Potensial'; gradeColor = '#F59E0B' }
  else { grade = 'Kurang Ideal'; gradeColor = '#EF4444' }

  const profitData = calcProfitRange(competitorList, benchmark)
  const { profitMin, profitMax, profitMedian, profitSource } = profitData
  const referenceCount = benchmark ? benchmark.outlet_count : null
  const referenceRadius = benchmark ? parseFloat(benchmark.radius_km) : null

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
      { label: 'Traffic Pejalan Kaki', score: traffic,            source: footTraffic   ? 'osm'         : 'unavailable' },
      { label: 'Tingkat Persaingan',   score: competition,        source: benchmark     ? 'db'          : 'estimated'   },
      { label: 'Aksesibilitas',        score: accessibilityScore, source: accessibility ? 'osm'         : 'unavailable' },
      { label: 'Kepadatan Penduduk',   score: populationScore,    source: 'db' },
      { label: 'Daya Beli Area',       score: purchasePowerScore, source: 'db' },
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
  const areaName  = demographics?.name ?? 'area ini'
  const income    = demographics?.income_index ?? 0
  const density   = demographics?.population_density ?? 0
  const amenities = footTraffic?.amenityCount ?? 0
  const incomeLabel = income >= 80 ? 'tinggi' : income >= 65 ? 'menengah' : 'menengah-bawah'

  const CAT = {
    'Kopi & Cafe':  { crowd: 'pekerja kantoran dan komunitas urban', peak: 'pagi dan sore hari' },
    'Ayam Goreng':  { crowd: 'keluarga dan pekerja', peak: 'jam makan siang dan malam' },
    'Burger':       { crowd: 'anak muda dan pekerja', peak: 'makan siang dan akhir pekan' },
    'Mie & Bakso':  { crowd: 'pekerja dan pelajar', peak: 'jam makan siang' },
    'Minuman':      { crowd: 'pejalan kaki dan anak muda', peak: 'siang dan sore hari' },
  }
  const ctx = CAT[category] || { crowd: 'beragam segmen', peak: 'jam makan utama' }

  const highComp  = competitionRatio > 1.2
  const lowComp   = competitorCount === 0 || competitionRatio < 0.5
  const goodTraffic = traffic !== null && traffic >= 60
  const densePop  = density >= 15000
  const highBuy   = income >= 75

  const parts = []

  if (score >= 75) {
    parts.push(`Area ${areaName} menunjukkan kondisi yang sangat mendukung untuk bisnis ${category}.`)

    if (lowComp && amenities > 20) {
      parts.push(`Pasar belum jenuh — hanya ${competitorCount} kompetitor aktif sementara ${amenities} titik usaha di sekitar membuktikan tingginya aktivitas komersial.`)
    } else if (lowComp) {
      parts.push(competitorCount === 0
        ? `Belum ada kompetitor langsung dalam radius ini, membuka peluang menjadi pemain pertama.`
        : `Kompetitor sangat minim (${competitorCount}) relatif terhadap potensi pasar di area ini.`)
    }

    if (densePop && highBuy) {
      parts.push(`Kepadatan ${density.toLocaleString('id')} jiwa/km² dengan daya beli ${incomeLabel} menjadikan ${areaName} target ideal untuk segmen ${ctx.crowd}.`)
    } else if (densePop) {
      parts.push(`Kepadatan penduduk ${density.toLocaleString('id')} jiwa/km² memastikan basis customer yang besar.`)
    }

    parts.push(`Manfaatkan peak hour ${ctx.peak} untuk memaksimalkan pendapatan.`)

  } else if (score >= 60) {
    parts.push(`${areaName} layak dipertimbangkan untuk ${category}, dengan beberapa faktor yang perlu disiasati.`)

    if (goodTraffic && highComp) {
      parts.push(`Traffic area cukup tinggi (${amenities > 0 ? `${amenities} titik usaha aktif` : 'skor OSM baik'}), namun persaingan di atas rata-rata dengan ${competitorCount} kompetitor — diferensiasi konsep dan kualitas layanan menjadi penentu.`)
    } else if (!goodTraffic && lowComp) {
      parts.push(`Persaingan minim (${competitorCount} kompetitor) adalah peluang besar, namun traffic organik yang rendah mengharuskan strategi pemasaran aktif sejak hari pertama.`)
    } else if (highComp) {
      parts.push(`Dengan ${competitorCount} kompetitor di radius ini, fokus pada keunikan produk dan pengalaman pelanggan untuk menciptakan loyalitas.`)
    }

    if (demographics) {
      parts.push(`Daya beli ${incomeLabel} di ${areaName} ${highBuy ? 'mendukung positioning premium' : 'lebih cocok untuk segmen harga menengah'}.`)
    }

    parts.push(`Lakukan observasi lapangan di ${ctx.peak} untuk memverifikasi volume traffic riil sebelum keputusan final.`)

  } else if (score >= 45) {
    parts.push(`${areaName} memiliki potensi terbatas untuk ${category} — ada peluang, namun risiko perlu dimitigasi dengan cermat.`)

    const risks = []
    if (highComp)                              risks.push(`persaingan ketat (${competitorCount} kompetitor, ${(competitionRatio * 100).toFixed(0)}% di atas rata-rata)`)
    if (traffic !== null && traffic < 40)      risks.push('traffic pejalan kaki yang rendah')
    if (income > 0 && income < 55)             risks.push('daya beli area yang terbatas')
    if (risks.length)                          parts.push(`Tantangan utama: ${risks.join(' dan ')}.`)

    parts.push(`Bila tetap melanjutkan, pertimbangkan konsep yang menyasar ${ctx.crowd} dengan harga kompetitif dan biaya operasional ramping. Survei lapangan wajib dilakukan sebelum komitmen sewa.`)

  } else {
    parts.push(`Area ini menunjukkan risiko yang signifikan untuk bisnis ${category} saat ini.`)

    if (highComp) parts.push(`Pasar sudah jenuh — ${competitorCount} kompetitor beroperasi di area ini, ${(competitionRatio * 100).toFixed(0)}% di atas rata-rata kepadatan kategori.`)
    if (traffic !== null && traffic < 35)   parts.push(`Traffic pejalan kaki yang sangat rendah akan mempersulit akuisisi customer secara organik.`)
    if (income > 0 && income < 50)          parts.push(`Daya beli ${incomeLabel} di ${areaName} berpotensi menekan margin dan memperlambat balik modal.`)

    const alt = highComp ? 'area dengan persaingan lebih rendah' : 'area dengan traffic lebih tinggi dan kepadatan lebih besar'
    parts.push(`Sangat disarankan untuk mengevaluasi lokasi alternatif di ${alt} sebelum mengambil keputusan investasi.`)
  }

  return parts.join(' ')
}
