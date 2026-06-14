export function generateAnalysis(latlng, category, radius, realData = {}) {
  const { nearbyCompetitors = null, benchmark = null } = realData

  // Seeded deterministic values for dimensions without real data
  const seed = Math.abs(Math.sin(latlng.lat * 100 + latlng.lng * 100)) * 100
  const traffic = Math.round(55 + (seed % 40))
  const accessibility = Math.round(60 + (seed % 35))
  const population = Math.round(50 + (seed % 45))
  const purchasePower = Math.round(45 + (seed % 50))

  // Competition score: fewer real competitors = higher score (less crowded market = opportunity)
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

  const tags = [
    { label: 'Dekat area komersial', type: 'positive' },
    { label: `${competitorCount} kompetitor terdeteksi`, type: competitorCount > 5 ? 'warning' : 'info' },
    { label: 'Aksesibilitas tinggi', type: accessibility > 70 ? 'positive' : 'neutral' },
    { label: 'Weekend traffic tinggi', type: 'positive' },
    { label: 'Parkir terbatas', type: 'warning' },
    { label: `${referenceCount} outlet referensi`, type: 'info' },
  ]

  const competitors = competitorList.length > 0
    ? competitorList.map((c, i) => ({
        id: c.id || i,
        name: c.name,
        lat: parseFloat(c.lat),
        lng: parseFloat(c.lng),
        distance: Math.round(parseFloat(c.distance_m)),
      }))
    : Array.from({ length: Math.floor(3 + seed % 6) }, (_, i) => ({
        id: i,
        name: getCategoryCompetitor(category, i),
        lat: latlng.lat + (Math.sin(i * 1.3) * 0.003),
        lng: latlng.lng + (Math.cos(i * 1.7) * 0.003),
        distance: Math.floor(100 + i * 80 + (seed % 120)),
      }))

  return {
    overall, grade, gradeColor,
    dimensions: [
      { label: 'Traffic Pejalan Kaki', score: traffic },
      { label: 'Tingkat Persaingan', score: competition },
      { label: 'Aksesibilitas', score: accessibility },
      { label: 'Kepadatan Penduduk', score: population },
      { label: 'Daya Beli Area', score: purchasePower },
    ],
    profitMin, profitMax,
    referenceCount, referenceRadius,
    tags, competitors,
    recommendation: getRecommendation(overall, category, competitorCount),
  }
}

function getCategoryCompetitor(category, i) {
  const map = {
    'Ayam Goreng': ['CFC Cabang', 'Geprek Express', 'Ayam Bakar Mas', 'Sabana Franchise', 'Crispy Wing'],
    'Kopi & Cafe': ['Kopi Kenangan', 'Janji Jiwa', 'Fore Coffee', 'Tomoro Coffee', 'Kopi Soe'],
    'Mie & Bakso': ['Bakso Malang', 'Mie Gacoan', 'Bakso Pak Man', 'Mie Ayam Solo', 'Bakso Urat'],
    'Minuman':     ['Chatime', 'Mixue', 'Boba Time', 'Xi Bo Ba', 'KOI Thé'],
    'Burger':      ['McDonalds', 'Burger King', 'Richeese', 'Flame Burger', 'Mos Burger'],
    'Lainnya':     ['Restoran A', 'Warung B', 'Kedai C', 'Kafe D', 'Warung E'],
  }
  return (map[category] || map['Lainnya'])[i % 5]
}

function getRecommendation(score, category, competitorCount) {
  const competitionNote = competitorCount === 0
    ? 'Tidak ada kompetitor langsung yang terdeteksi dalam radius, menjadi peluang besar untuk menjadi pionir.'
    : competitorCount <= 3
    ? `Hanya ${competitorCount} kompetitor terdeteksi, menunjukkan pasar yang belum jenuh.`
    : `Terdapat ${competitorCount} kompetitor aktif, diferensiasi produk menjadi kunci.`

  if (score >= 75) return `Lokasi ini memiliki potensi sangat baik untuk bisnis ${category}. Traffic tinggi dan daya beli area mendukung pertumbuhan omset yang konsisten sejak bulan pertama. ${competitionNote}`
  if (score >= 60) return `Lokasi cukup menjanjikan untuk ${category} dengan beberapa keunggulan kompetitif. ${competitionNote} Pertimbangkan strategi diferensiasi untuk memaksimalkan potensi area ini.`
  if (score >= 45) return `Lokasi ini memiliki potensi moderat untuk ${category}. Disarankan melakukan survei lapangan tambahan sebelum memutuskan. ${competitionNote}`
  return `Lokasi ini menunjukkan beberapa risiko signifikan untuk bisnis ${category}. ${competitionNote} Pertimbangkan lokasi alternatif atau lakukan analisis mendalam terhadap faktor persaingan di area ini.`
}
