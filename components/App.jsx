'use client'

import { useState, useRef, useEffect } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'
import MapView from './MapView'
import RiwayatSider from './RiwayatSider'
import MobileHeader from './MobileHeader'
import MobileBottomSheet from './MobileBottomSheet'
import useIsMobile from '@/hooks/useIsMobile'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) +
    ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.')
}

let _tempSeq = 0
function tempId() { return `tmp-${++_tempSeq}` }

export default function App() {
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [radius, setRadius] = useState(500)
  const [scale, setScale] = useState('Menengah')
  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisError, setAnalysisError] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [riwayatOpen, setRiwayatOpen] = useState(false)
  const [historyItems, setHistoryItems] = useState([])
  const [savedKey, setSavedKey] = useState(null)
  // id of the unsaved temp entry for the current analysis (null if saved or no analysis yet)
  const sessionIdRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    fetch('/api/analysis/history')
      .then(r => r.json())
      .then(({ items }) => {
        if (!items?.length) return
        setHistoryItems(items.map(h => ({
          id: h.id,
          location: h.location,
          category: h.category,
          score: h.overall,
          grade: h.grade,
          date: formatDate(h.created_at),
          saved: true,
          lat: h.lat,
          lng: h.lng,
          radius: h.radius,
          result: h.result_json,
        })))
      })
      .catch(() => {})
  }, [])

  const isMobile = useIsMobile()

  const runAnalysis = async (latlng, category, r) => {
    if (abortRef.current) abortRef.current.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setIsAnalyzing(true)
    setAnalysisResult(null)
    setAnalysisError(false)
    setSavedKey(null)
    sessionIdRef.current = null

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: latlng.lat, lng: latlng.lng, category, radius: r, scale }),
        signal: controller.signal,
      })
      if (controller.signal.aborted) return
      if (!res.ok) throw new Error('Analysis failed')
      const data = await res.json()
      setAnalysisResult(data)

      // Auto-add every completed (non-unsupported) analysis to session history
      if (!data.unsupported && data.overall != null) {
        const sid = tempId()
        sessionIdRef.current = sid
        const locationName = getAreaName(latlng)
        setHistoryItems(prev => [{
          id: sid,
          location: locationName,
          category,
          score: data.overall,
          grade: data.grade,
          date: formatDate(new Date().toISOString()),
          saved: false,
          lat: latlng.lat,
          lng: latlng.lng,
          radius: r,
          result: data,
        }, ...prev])
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error(err)
        // AC1.7: tampilkan state error agar UI bisa menampilkan tombol "Coba Lagi"
        if (!controller.signal.aborted) setAnalysisError(true)
      }
    } finally {
      if (!controller.signal.aborted) setIsAnalyzing(false)
    }
  }

  const handleLocationSelect = (latlng) => {
    setSelectedLocation(latlng)
    setAnalysisResult(null)
    setAnalysisError(false)
    setSavedKey(null)
  }

  const handleAnalyze = () => {
    if (!selectedCategory || !selectedLocation) return
    runAnalysis(selectedLocation, selectedCategory, radius)
  }

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat)
    setAnalysisResult(null)
    setAnalysisError(false)
    setSavedKey(null)
  }

  const handleSave = async () => {
    if (!analysisResult || !selectedLocation || !selectedCategory) return

    if (savedKey) {
      // Unsave: remove from DB, mark entry as saved:false in local list
      await fetch('/api/analysis/save', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: savedKey }),
      })
      const sid = tempId()
      sessionIdRef.current = sid
      setHistoryItems(prev => prev.map(h =>
        h.id === savedKey ? { ...h, id: sid, saved: false } : h
      ))
      setSavedKey(null)
      return
    }

    // Save: persist to DB, then update the session temp entry in place
    const locationName = getAreaName(selectedLocation)
    const res = await fetch('/api/analysis/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: locationName,
        category: selectedCategory,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        radius,
        result: analysisResult,
      }),
    })
    const { id, created_at } = await res.json()
    const sid = sessionIdRef.current

    setHistoryItems(prev => {
      // If the temp entry exists, upgrade it in place
      if (sid && prev.find(h => h.id === sid)) {
        return prev.map(h => h.id === sid
          ? { ...h, id, saved: true, date: formatDate(created_at) }
          : h
        )
      }
      // Fallback: prepend new saved entry
      return [{
        id,
        location: locationName,
        category: selectedCategory,
        score: analysisResult.overall,
        grade: analysisResult.grade,
        date: formatDate(created_at),
        saved: true,
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        radius,
        result: analysisResult,
      }, ...prev]
    })
    sessionIdRef.current = id
    setSavedKey(id)
  }

  const handleLocationSearch = ({ lat, lng }) => {
    const latlng = { lat, lng }
    setSelectedLocation(latlng)
    setSavedKey(null)
    setAnalysisResult(null)
  }

  const handleHistoryItemClick = (item) => {
    if (!item.lat || !item.lng) return
    const latlng = { lat: item.lat, lng: item.lng }
    setSelectedLocation(latlng)
    setSelectedCategory(item.category)
    setSavedKey(item.saved ? item.id : null)
    setAnalysisResult(item.result)
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
          scale={scale}
          onScaleChange={setScale}
          onAnalyze={handleAnalyze}
          canAnalyze={!!selectedCategory && !!selectedLocation}
          isAnalyzing={isAnalyzing}
          analysisResult={analysisResult}
          analysisError={analysisError}
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
          scale={scale}
          onScaleChange={setScale}
          onAnalyze={handleAnalyze}
          canAnalyze={!!selectedCategory && !!selectedLocation}
          isAnalyzing={isAnalyzing}
          analysisResult={analysisResult}
          analysisError={analysisError}
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
