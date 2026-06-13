'use client'

import { useState, useRef } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import MapView from './MapView'
import RiwayatSider from './RiwayatSider'
import MobileHeader from './MobileHeader'
import MobileBottomSheet from './MobileBottomSheet'
import useIsMobile from '@/hooks/useIsMobile'

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
  const isMobile = useIsMobile()

  const runAnalysis = async (latlng, category, r) => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setIsAnalyzing(true)
    setAnalysisResult(null)
    setSavedKey(null)

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: latlng.lat, lng: latlng.lng, category, radius: r }),
        signal: controller.signal,
      })
      if (controller.signal.aborted) return
      if (!res.ok) throw new Error('Analysis failed')
      setAnalysisResult(await res.json())
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err)
    } finally {
      if (!controller.signal.aborted) setIsAnalyzing(false)
    }
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

  const sharedRiwayat = (
    <RiwayatSider
      open={riwayatOpen}
      onClose={() => setRiwayatOpen(false)}
      historyItems={historyItems}
      onItemClick={handleHistoryItemClick}
    />
  )

  const sharedMap = (
    <MapView
      selectedLocation={selectedLocation}
      onLocationSelect={handleLocationSelect}
      radius={radius}
      analysisResult={analysisResult}
      isMobile={isMobile}
    />
  )

  if (isMobile) {
    return (
      <div className="app">
        <MobileHeader
          historyCount={historyItems.length}
          onRiwayatClick={() => setRiwayatOpen(true)}
          onLocationSearch={handleLocationSearch}
        />
        {sharedRiwayat}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {sharedMap}
        </div>
        <MobileBottomSheet
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
      </div>
    )
  }

  return (
    <div className="app">
      <Header
        historyCount={historyItems.length}
        onRiwayatClick={() => setRiwayatOpen(true)}
        onLocationSearch={handleLocationSearch}
      />
      {sharedRiwayat}
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
