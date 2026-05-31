import { useState, useRef } from 'react'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import MapView from './components/MapView'
import RiwayatSider from './components/RiwayatSider'
import './App.css'

const INITIAL_HISTORY = [
  { id: 1, location: 'Kelapa Gading', category: 'Burger',      score: 76, grade: 'Potensi Bagus',    date: '25 Mei 2026, 11.57', saved: true,  lat: -6.1583, lng: 106.9063 },
  { id: 2, location: 'Kelapa Gading', category: 'Ayam Goreng', score: 76, grade: 'Potensi Bagus',    date: '25 Mei 2026, 11.33', saved: true,  lat: -6.1601, lng: 106.9020 },
  { id: 3, location: 'Blok M',        category: 'Ayam Goreng', score: 82, grade: 'Sangat Potensial', date: '25 Mei 2026, 11.33', saved: true,  lat: -6.2441, lng: 106.7983 },
  { id: 4, location: 'Senayan',       category: 'Kopi & Cafe', score: 86, grade: 'Sangat Potensial', date: '21 Mei 2026, 14.32', saved: true,  lat: -6.2183, lng: 106.8025 },
  { id: 5, location: 'Kemang',        category: 'Burger',      score: 78, grade: 'Potensi Bagus',    date: '20 Mei 2026, 11.08', saved: false, lat: -6.2622, lng: 106.8129 },
  { id: 6, location: 'Pondok Indah',  category: 'Ayam Goreng', score: 64, grade: 'Potensi Bagus',    date: '18 Mei 2026, 16.45', saved: true,  lat: -6.2821, lng: 106.7891 },
  { id: 7, location: 'Tebet Timur',   category: 'Mie & Bakso', score: 71, grade: 'Potensi Bagus',    date: '15 Mei 2026, 09.12', saved: false, lat: -6.2264, lng: 106.8583 },
  { id: 8, location: 'Kelapa Gading', category: 'Minuman',     score: 74, grade: 'Potensi Bagus',    date: '12 Mei 2026, 19.51', saved: false, lat: -6.1572, lng: 106.9101 },
]

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [radius, setRadius] = useState(500)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [riwayatOpen, setRiwayatOpen] = useState(false)
  const [historyItems, setHistoryItems] = useState(INITIAL_HISTORY)
  const [savedKey, setSavedKey] = useState(null)
  const abortRef = useRef(null)
  const nextId = useRef(INITIAL_HISTORY.length + 1)

  const runAnalysis = (latlng, category, r) => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setIsAnalyzing(true)
    setAnalysisResult(null)
    setSavedKey(null)

    setTimeout(() => {
      if (controller.signal.aborted) return
      setAnalysisResult(generateMockResult(latlng, category, r))
      setIsAnalyzing(false)
    }, 2200)
  }

  const handleLocationSelect = (latlng) => {
    setSelectedLocation(latlng)
    setAnalysisResult(null)
    setSavedKey(null)
    if (selectedCategory) runAnalysis(latlng, selectedCategory, radius)
  }

  const handleAnalyze = () => {
    if (!selectedCategory || !selectedLocation) return
    runAnalysis(selectedLocation, selectedCategory, radius)
  }

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat)
    setAnalysisResult(null)
    setSavedKey(null)
  }

  const handleSave = () => {
    if (!analysisResult || !selectedLocation || !selectedCategory) return

    if (savedKey) {
      // Unsave: remove from history
      setHistoryItems(prev => prev.filter(h => h.id !== savedKey))
      setSavedKey(null)
      return
    }

    const now = new Date()
    const dateStr = now.toLocaleDateString('id-ID', {
      day: 'numeric', month: 'long', year: 'numeric'
    }) + ', ' + now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')

    const newItem = {
      id: nextId.current++,
      location: getAreaName(selectedLocation),
      category: selectedCategory,
      score: analysisResult.overall,
      grade: analysisResult.grade,
      date: dateStr,
      saved: true,
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
    }

    setHistoryItems(prev => [newItem, ...prev])
    setSavedKey(newItem.id)
  }

  const handleLocationSearch = ({ lat, lng }) => {
    const latlng = { lat, lng }
    setSelectedLocation(latlng)
    setSavedKey(null)
    setAnalysisResult(null)
    if (selectedCategory) runAnalysis(latlng, selectedCategory, radius)
  }

  const handleHistoryItemClick = (item) => {
    if (!item.lat || !item.lng) return
    const latlng = { lat: item.lat, lng: item.lng }
    setSelectedLocation(latlng)
    setSelectedCategory(item.category)
    setSavedKey(item.saved ? item.id : null)
    runAnalysis(latlng, item.category, radius)
    setRiwayatOpen(false)
  }

  return (
    <div className="app">
      <Header
        historyCount={historyItems.length}
        onRiwayatClick={() => setRiwayatOpen(true)}
        onLocationSearch={handleLocationSearch}
      />
      <RiwayatSider
        open={riwayatOpen}
        onClose={() => setRiwayatOpen(false)}
        historyItems={historyItems}
        onItemClick={handleHistoryItemClick}
      />
      <div className="app-body">
        <Sidebar
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          radius={radius}
          onRadiusChange={setRadius}
          onAnalyze={handleAnalyze}
          canAnalyze={!!selectedCategory && !!selectedLocation}
          isAnalyzing={isAnalyzing}
          analysisResult={analysisResult}
          onSave={handleSave}
          isSaved={!!savedKey}
          selectedLocation={selectedLocation}
        />
        <MapView
          selectedLocation={selectedLocation}
          onLocationSelect={handleLocationSelect}
          radius={radius}
          analysisResult={analysisResult}
        />
      </div>
    </div>
  )
}

function getAreaName(latlng) {
  const areas = [
    { name: 'Kelapa Gading',  lat: [-6.16, -6.14], lng: [106.89, 106.92] },
    { name: 'Senayan',        lat: [-6.22, -6.20], lng: [106.79, 106.81] },
    { name: 'Blok M',         lat: [-6.25, -6.23], lng: [106.79, 106.81] },
    { name: 'Kemang',         lat: [-6.27, -6.25], lng: [106.81, 106.84] },
    { name: 'Pondok Indah',   lat: [-6.29, -6.27], lng: [106.78, 106.81] },
    { name: 'Tebet Timur',    lat: [-6.24, -6.22], lng: [106.84, 106.87] },
    { name: 'Menteng',        lat: [-6.21, -6.19], lng: [106.83, 106.85] },
    { name: 'Sudirman',       lat: [-6.22, -6.20], lng: [106.81, 106.83] },
    { name: 'Kuningan',       lat: [-6.23, -6.21], lng: [106.82, 106.84] },
    { name: 'Kebayoran Baru', lat: [-6.25, -6.23], lng: [106.80, 106.83] },
  ]
  const match = areas.find(a =>
    latlng.lat >= a.lat[0] && latlng.lat <= a.lat[1] &&
    latlng.lng >= a.lng[0] && latlng.lng <= a.lng[1]
  )
  return match ? match.name : `${Math.abs(latlng.lat).toFixed(2)}°S, ${latlng.lng.toFixed(2)}°E`
}

function generateMockResult(latlng, category, radius) {
  const seed = Math.abs(Math.sin(latlng.lat * 100 + latlng.lng * 100)) * 100
  const traffic = Math.round(55 + (seed % 40))
  const competition = Math.round(30 + (seed % 50))
  const accessibility = Math.round(60 + (seed % 35))
  const population = Math.round(50 + (seed % 45))
  const purchasePower = Math.round(45 + (seed % 50))
  const overall = Math.round((traffic + competition + accessibility + population + purchasePower) / 5)

  let grade, gradeColor
  if (overall >= 75) { grade = 'Sangat Potensial'; gradeColor = '#10B981' }
  else if (overall >= 60) { grade = 'Potensi Bagus'; gradeColor = '#3B82F6' }
  else if (overall >= 45) { grade = 'Cukup Potensial'; gradeColor = '#F59E0B' }
  else { grade = 'Kurang Ideal'; gradeColor = '#EF4444' }

  const profitMin = Math.round(overall * 1.2 + 10)
  const profitMax = Math.round(overall * 2.1 + 20)

  const tags = [
    { label: 'Dekat area komersial', type: 'positive' },
    { label: `${Math.floor(3 + seed % 8)} kompetitor terdeteksi`, type: competition > 60 ? 'warning' : 'info' },
    { label: 'Aksesibilitas tinggi', type: accessibility > 70 ? 'positive' : 'neutral' },
    { label: 'Weekend traffic tinggi', type: 'positive' },
    { label: 'Parkir terbatas', type: 'warning' },
    { label: `${Math.floor(12 + seed % 15)} outlet referensi`, type: 'info' },
  ]

  const competitors = Array.from({ length: Math.floor(3 + seed % 6) }, (_, i) => ({
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
    referenceCount: Math.floor(12 + seed % 15),
    referenceRadius: Math.max(1, Math.ceil(radius / 1000 * 10) / 10),
    tags, competitors,
    recommendation: getRecommendation(overall, category),
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

function getRecommendation(score, category) {
  if (score >= 75) return `Lokasi ini memiliki potensi sangat baik untuk bisnis ${category}. Traffic tinggi dan daya beli area mendukung pertumbuhan omset yang konsisten sejak bulan pertama.`
  if (score >= 60) return `Lokasi cukup menjanjikan untuk ${category} dengan beberapa keunggulan kompetitif. Pertimbangkan strategi diferensiasi untuk bersaing dengan outlet existing di area ini.`
  if (score >= 45) return `Lokasi ini memiliki potensi moderat untuk ${category}. Disarankan melakukan survei lapangan tambahan sebelum memutuskan, terutama terkait pola traffic pada jam sibuk.`
  return `Lokasi ini menunjukkan beberapa risiko signifikan untuk bisnis ${category}. Pertimbangkan lokasi alternatif atau lakukan analisis mendalam terhadap faktor persaingan di area ini.`
}
