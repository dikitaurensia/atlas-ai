'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { MapContainer, TileLayer, useMapEvents, Circle, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

const CENTER = [-6.2088, 106.8456]

/* Pin — electric cyan */
const pinIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:40px;height:50px">
      <div style="
        position:absolute;top:0;left:50%;margin-left:-18px;
        width:36px;height:36px;border-radius:50% 50% 50% 0;
        background:linear-gradient(135deg,#06B6D4,#0EA5E9);
        border:2.5px solid rgba(255,255,255,0.2);
        box-shadow:0 4px 20px rgba(6,182,212,0.6),0 0 0 4px rgba(6,182,212,0.15);
        transform:rotate(-45deg);
      "></div>
      <div style="
        position:absolute;top:8px;left:50%;margin-left:-7px;
        width:14px;height:14px;border-radius:50%;
        background:rgba(255,255,255,0.95);
      "></div>
      <div style="
        position:absolute;top:-6px;left:50%;margin-left:-24px;
        width:48px;height:48px;border-radius:50%;
        border:1.5px solid rgba(6,182,212,0.4);
        animation:pulse-ring 1.8s ease-out infinite;
      "></div>
    </div>
  `,
  iconSize: [40, 50],
  iconAnchor: [20, 46],
})

/* POI markers — restaurants, cafes, shops from OSM */
const POI_TYPES = {
  restaurant: { color: '#F59E0B', emoji: '🍽' },
  fast_food:  { color: '#EF4444', emoji: '🍔' },
  cafe:       { color: '#D97706', emoji: '☕' },
  bar:        { color: '#A78BFA', emoji: '🍺' },
  food_court: { color: '#F59E0B', emoji: '🍽' },
  supermarket:{ color: '#10B981', emoji: '🛒' },
  convenience:{ color: '#34D399', emoji: '🏪' },
  mall:       { color: '#8B5CF6', emoji: '🏬' },
}
const poiIcon = (type) => {
  const cfg = POI_TYPES[type] || { color: '#64748B', emoji: '📍' }
  return L.divIcon({
    className: '',
    html: `<div style="
      width:20px;height:20px;border-radius:50%;
      background:${cfg.color}28;
      border:1.5px solid ${cfg.color}77;
      display:flex;align-items:center;justify-content:center;
      font-size:9px;line-height:1;
    ">${cfg.emoji}</div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })
}

/* Competitor markers — staggered pop-in entrance */
const competitorIcon = (i) => L.divIcon({
  className: '',
  html: `
    <div style="
      width:26px;height:26px;border-radius:50%;
      background:#FFFFFF;
      border:1.5px solid rgba(0,0,0,0.12);
      box-shadow:0 2px 8px rgba(0,0,0,0.14);
      display:flex;align-items:center;justify-content:center;
      font-size:10px;font-weight:800;color:#0F172A;
      font-family:Inter,sans-serif;letter-spacing:-0.3px;
      animation:pop-in 0.35s cubic-bezier(0.175,0.885,0.32,1.275) both;
      animation-delay:${i * 60}ms;
    ">${i + 1}</div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
})

/* Radar scan overlay — rendered into the Leaflet container via portal */
function ScanOverlay({ location, radius, isAnalyzing }) {
  const map = useMap()
  const [pos, setPos] = useState(null)

  useEffect(() => {
    if (!location) { setPos(null); return }
    const update = () => {
      const center = map.latLngToContainerPoint([location.lat, location.lng])
      const edge   = map.latLngToContainerPoint([location.lat + radius / 111320, location.lng])
      setPos({ x: center.x, y: center.y, r: Math.max(4, Math.abs(center.y - edge.y)) })
    }
    update()
    map.on('move zoom moveend zoomend', update)
    return () => map.off('move zoom moveend zoomend', update)
  }, [location, radius, map])

  if (!pos || !isAnalyzing) return null

  return createPortal(
    <div style={{
      position: 'absolute',
      left: pos.x - pos.r, top: pos.y - pos.r,
      width: pos.r * 2, height: pos.r * 2,
      borderRadius: '50%', overflow: 'hidden',
      pointerEvents: 'none', zIndex: 500,
    }}>
      {/* rotating sweep */}
      <div style={{
        width: '100%', height: '100%',
        background: 'conic-gradient(from 0deg, rgba(6,182,212,0) 60%, rgba(6,182,212,0.28) 100%)',
        animation: 'scan-rotate 2s linear infinite',
        transformOrigin: 'center',
      }} />
      {/* centre dot */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 6, height: 6, marginTop: -3, marginLeft: -3,
        borderRadius: '50%', background: 'rgba(6,182,212,0.9)',
        boxShadow: '0 0 8px rgba(6,182,212,0.8)',
      }} />
    </div>,
    map.getContainer()
  )
}


function PopDensityOverlay({ location, radius, populationScore }) {
  const map = useMap()
  const [geo, setGeo] = useState(null)

  // score 25 → 2 rings, score 57 → 3, score 75 → 4, score 90+ → 5
  const ringCount = Math.max(2, Math.min(5, Math.floor(populationScore / 18)))
  // score 25 → 4.2s, score 57 → 3.3s, score 90 → 2.4s
  const duration  = (5.0 - populationScore * 0.03).toFixed(1)

  useEffect(() => {
    if (!location) { setGeo(null); return }
    const update = () => {
      const center = map.latLngToContainerPoint([location.lat, location.lng])
      const edge   = map.latLngToContainerPoint([location.lat + radius / 111320, location.lng])
      const pr = Math.max(4, Math.abs(center.y - edge.y))
      setGeo({ cx: center.x, cy: center.y, pr })
    }
    update()
    map.on('move zoom moveend zoomend', update)
    return () => map.off('move zoom moveend zoomend', update)
  }, [location, radius, map])

  if (!geo) return null

  return createPortal(
    <div style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 487 }}>
      {Array.from({ length: ringCount }, (_, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: geo.cx - geo.pr,
          top:  geo.cy - geo.pr,
          width:  geo.pr * 2,
          height: geo.pr * 2,
          borderRadius: '50%',
          border: '1.5px solid rgba(245,158,11,0.55)',
          animation: `density-expand ${duration}s ${((i / ringCount) * -parseFloat(duration)).toFixed(1)}s linear infinite`,
          willChange: 'transform, opacity',
        }} />
      ))}
    </div>,
    map.getContainer()
  )
}

const WALK_ANIMS = ['walk-a', 'walk-b', 'walk-c', 'walk-d']

function FootTrafficOverlay({ location, radius, trafficScore }) {
  const map = useMap()
  const [geo, setGeo] = useState(null)

  const dotCount = Math.max(5, Math.min(22, Math.round(trafficScore / 5)))

  const dotsRef = useRef(null)
  if (!dotsRef.current) {
    dotsRef.current = Array.from({ length: 22 }, (_, i) => ({
      angle:    (Math.PI * 2 * i / 22) + (Math.random() - 0.5) * 0.9,
      distFrac: 0.12 + Math.random() * 0.56,
      anim:     WALK_ANIMS[i % 4],
      duration: (3.5 + Math.random() * 5.5).toFixed(1),
      delay:    (-(Math.random() * 9)).toFixed(1),
      size:     2.5 + Math.random() * 3,
      opacity:  0.38 + Math.random() * 0.48,
    }))
  }
  const dots = dotsRef.current.slice(0, dotCount)

  useEffect(() => {
    if (!location) { setGeo(null); return }
    const update = () => {
      const center = map.latLngToContainerPoint([location.lat, location.lng])
      const edge   = map.latLngToContainerPoint([location.lat + radius / 111320, location.lng])
      const pr = Math.max(4, Math.abs(center.y - edge.y))
      setGeo({ cx: center.x, cy: center.y, pr })
    }
    update()
    map.on('move zoom moveend zoomend', update)
    return () => map.off('move zoom moveend zoomend', update)
  }, [location, radius, map])

  if (!geo) return null

  return createPortal(
    <div style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none', zIndex: 490 }}>
      {dots.map((d, i) => {
        const bx = geo.cx + Math.cos(d.angle) * d.distFrac * geo.pr
        const by = geo.cy + Math.sin(d.angle) * d.distFrac * geo.pr
        return (
          <div key={i} style={{
            position: 'absolute',
            left: bx - d.size / 2,
            top:  by - d.size / 2,
            width:  d.size,
            height: d.size,
            borderRadius: '50%',
            background: `rgba(6,182,212,${d.opacity.toFixed(2)})`,
            boxShadow: `0 0 ${Math.round(d.size + 2)}px rgba(6,182,212,0.25)`,
            animation: `${d.anim} ${d.duration}s ${d.delay}s ease-in-out infinite`,
            willChange: 'transform',
          }} />
        )
      })}
    </div>,
    map.getContainer()
  )
}

function ClickHandler({ onLocationSelect, locked }) {
  useMapEvents({ click: e => { if (!locked) onLocationSelect(e.latlng) } })
  return null
}

function FlyTo({ location }) {
  const map = useMap()
  useEffect(() => {
    if (location) map.flyTo(location, 15, { duration: 0.9 })
  }, [location, map])
  return null
}

const TILE_URLS = {
  dark:  'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
}
const TILE_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'

function ZoomControl() {
  const map = useMap()
  return (
    <div style={s.zoomWrap}>
      <button style={s.zoomBtn} onClick={() => map.zoomIn()} title="Zoom in">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
      <div style={s.zoomDivider} />
      <button style={s.zoomBtn} onClick={() => map.zoomOut()} title="Zoom out">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    </div>
  )
}

export default function MapView({ selectedLocation, onLocationSelect, radius, analysisResult, isAnalyzing, isMobile, theme }) {
  const competitorCount = analysisResult?.competitors?.length || 0
  const poiCount = analysisResult?.pois?.length || 0
  const gradeColor = analysisResult?.gradeColor || '#06B6D4'

  const mapCenter = selectedLocation
    ? [selectedLocation.lat, selectedLocation.lng]
    : CENTER
  const mapZoom = selectedLocation ? 15 : 12

  return (
    <div style={s.wrap}>
      <MapContainer key={theme} center={mapCenter} zoom={mapZoom}
        style={{ width: '100%', height: '100%' }} zoomControl={false}>

        <TileLayer url={TILE_URLS[theme] || TILE_URLS.dark} attribution={TILE_ATTR} maxZoom={19} />

        <ClickHandler onLocationSelect={onLocationSelect} locked={!!analysisResult} />
        {selectedLocation && <FlyTo location={selectedLocation} />}
        {selectedLocation && (
          <ScanOverlay location={selectedLocation} radius={radius} isAnalyzing={isAnalyzing} />
        )}
        {selectedLocation && !isAnalyzing && analysisResult?.dimensions?.[3]?.score != null && (
          <PopDensityOverlay
            location={selectedLocation}
            radius={radius}
            populationScore={analysisResult.dimensions[3].score}
          />
        )}
        {selectedLocation && !isAnalyzing && analysisResult?.dimensions?.[0]?.score != null && (
          <FootTrafficOverlay
            location={selectedLocation}
            radius={radius}
            trafficScore={analysisResult.dimensions[0].score}
          />
        )}

        {selectedLocation && (
          <>
            <Circle center={selectedLocation} radius={radius} pathOptions={{
              color: gradeColor,
              fillColor: gradeColor,
              fillOpacity: isAnalyzing ? 0.04 : 0.08,
              dashArray: '8 5',
              weight: 1.5,
              className: isAnalyzing ? 'radius-analyzing' : '',
            }}/>
            <Marker position={selectedLocation} icon={pinIcon}>
              <Popup>
                <div style={popupStyle}>
                  <strong style={{ color: 'var(--txt-1)' }}>Lokasi Analisis</strong>
                  <span style={{ color: 'var(--txt-3)', fontSize: 10 }}>
                    {selectedLocation.lat.toFixed(5)}°, {selectedLocation.lng.toFixed(5)}°
                  </span>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {analysisResult?.pois?.map((p, i) => (
          <Marker key={`poi-${i}`} position={[p.lat, p.lng]} icon={poiIcon(p.type)}>
            {p.name && (
              <Popup>
                <div style={popupStyle}>
                  <strong style={{ color: 'var(--txt-1)' }}>{p.name}</strong>
                  <span style={{ color: 'var(--txt-3)', fontSize: 10, textTransform: 'capitalize' }}>{p.type?.replace('_', ' ')}</span>
                </div>
              </Popup>
            )}
          </Marker>
        ))}

        {analysisResult?.competitors?.map((c, i) => (
          <Marker key={c.id} position={[c.lat, c.lng]} icon={competitorIcon(i)}>
            <Popup>
              <div style={popupStyle}>
                <strong style={{ color: 'var(--txt-1)' }}>{c.name}</strong>
                <span style={{ color: 'var(--txt-3)', fontSize: 10 }}>{c.distance}m dari titik analisis</span>
              </div>
            </Popup>
          </Marker>
        ))}

        {!isMobile && <ZoomControl />}
      </MapContainer>

      <CurrentLocationBtn onLocationSelect={onLocationSelect} isMobile={isMobile} />
      {!selectedLocation && <HintOverlay isMobile={isMobile} />}
      {selectedLocation && !isMobile && <StatusBar location={selectedLocation} radius={radius} locked={!!analysisResult} />}
      {analysisResult && !isMobile && <Legend competitorCount={competitorCount} poiCount={poiCount} radius={radius} />}
    </div>
  )
}

function CurrentLocationBtn({ onLocationSelect, isMobile }) {
  const [loading, setLoading] = useState(false)
  const [denied, setDenied] = useState(false)

  const handleClick = () => {
    if (!navigator.geolocation || loading) return
    setLoading(true)
    setDenied(false)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onLocationSelect({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      () => { setLoading(false); setDenied(true); setTimeout(() => setDenied(false), 3000) },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  return (
    <div
      style={{ ...s.locBtn, ...(isMobile ? s.locBtnMobile : {}), ...(denied ? s.locBtnDenied : {}) }}
      onClick={handleClick}
      title={denied ? 'Akses lokasi ditolak' : 'Lokasi saat ini'}
    >
      {loading ? (
        <span style={s.locSpinner} />
      ) : denied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="3" fill="currentColor"/>
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
          <circle cx="12" cy="12" r="8"/>
        </svg>
      )}
    </div>
  )
}

const popupStyle = {
  display: 'flex', flexDirection: 'column', gap: 2,
  fontFamily: 'Inter, sans-serif', padding: '2px 0',
}

function HintOverlay({ isMobile }) {
  return (
    <div style={{ ...s.hint, ...(isMobile ? s.hintMobile : {}) }}>
      <div style={s.hintDot}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <span style={s.hintText}>Klik pada peta untuk menentukan lokasi analisis</span>
    </div>
  )
}

function StatusBar({ location, radius, locked }) {
  return (
    <div style={s.statusBar}>
      <div style={s.statusItem}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="var(--accent)" stroke="none">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
        </svg>
        <span style={s.statusCoord}>
          {location.lat.toFixed(5)}°, {location.lng.toFixed(5)}°
        </span>
      </div>
      <div style={s.statusSep} />
      <div style={s.statusItem}>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--txt-3)" strokeWidth="2">
          <circle cx="12" cy="12" r="9" strokeDasharray="4 3"/>
        </svg>
        <span style={s.statusRadius}>
          Radius {radius >= 1000 ? `${radius / 1000} km` : `${radius} m`}
        </span>
      </div>
      {locked && (
        <>
          <div style={s.statusSep} />
          <div style={s.statusItem}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="var(--txt-3)" strokeWidth="2.2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span style={s.statusLock}>Cari lokasi baru untuk pindah pin</span>
          </div>
        </>
      )}
    </div>
  )
}

function Legend({ competitorCount, poiCount, radius }) {
  return (
    <div style={s.legend}>
      <div style={s.legendTitle}>LEGENDA</div>
      <div style={s.legendItem}>
        <div style={s.ldOrange} />
        <span style={s.ldText}>Lokasi Anda</span>
      </div>
      <div style={s.legendItem}>
        <div style={s.ldDark} />
        <span style={s.ldText}>Kompetitor <span style={{ color: 'var(--txt-3)' }}>({competitorCount})</span></span>
      </div>
      {poiCount > 0 && (
        <div style={s.legendItem}>
          <div style={s.ldPoi} />
          <span style={s.ldText}>POI <span style={{ color: 'var(--txt-3)' }}>({poiCount})</span></span>
        </div>
      )}
      <div style={s.legendItem}>
        <div style={s.ldDash} />
        <span style={s.ldText}>Radius {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}</span>
      </div>
    </div>
  )
}

const s = {
  wrap: { flex: 1, position: 'relative', overflow: 'hidden' },

  zoomWrap: {
    position: 'absolute', bottom: 72, right: 14, zIndex: 800,
    display: 'flex', flexDirection: 'column',
    background: 'var(--map-glass)', backdropFilter: 'blur(8px)',
    borderRadius: 8, border: '1px solid var(--map-border)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.1)', overflow: 'hidden',
  },
  zoomBtn: {
    width: 32, height: 32, background: 'transparent', border: 'none',
    cursor: 'pointer', color: 'var(--txt-2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s',
  },
  zoomDivider: { height: 1, background: 'var(--map-border)' },

  hint: {
    position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
    zIndex: 800, display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--map-glass)', backdropFilter: 'blur(10px)',
    padding: '7px 16px 7px 10px', borderRadius: 20,
    border: '1px solid var(--map-border)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    whiteSpace: 'nowrap',
  },
  hintDot: {
    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
    background: 'var(--accent)',
    boxShadow: '0 0 8px rgba(6,182,212,0.45)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  hintText: { fontSize: 11, fontWeight: 500, color: 'var(--txt-1)' },
  hintMobile: { bottom: 260 },

  statusBar: {
    position: 'absolute', bottom: 14, left: 14, zIndex: 800,
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'var(--map-glass)', backdropFilter: 'blur(10px)',
    padding: '5px 12px', borderRadius: 7,
    border: '1px solid var(--map-border)',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  statusItem: { display: 'flex', alignItems: 'center', gap: 5 },
  statusCoord: { fontSize: 10, fontWeight: 600, color: 'var(--txt-1)', letterSpacing: '0.1px' },
  statusRadius: { fontSize: 10, fontWeight: 500, color: 'var(--txt-2)' },
  statusLock:   { fontSize: 10, fontWeight: 400, color: 'var(--txt-3)', fontStyle: 'italic' },
  statusSep: { width: 1, height: 12, background: 'var(--map-border)' },

  legend: {
    position: 'absolute', top: 14, right: 14, zIndex: 800,
    background: 'var(--map-glass)', backdropFilter: 'blur(10px)',
    padding: '10px 13px', borderRadius: 8,
    border: '1px solid var(--map-border)',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    display: 'flex', flexDirection: 'column', gap: 7,
  },
  legendTitle: {
    fontSize: 8, fontWeight: 800, letterSpacing: '0.8px',
    color: 'var(--txt-3)', marginBottom: 1,
  },
  legendItem: { display: 'flex', alignItems: 'center', gap: 8 },
  ldText: { fontSize: 10, color: 'var(--txt-2)', fontWeight: 500 },
  ldOrange: {
    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
    background: 'var(--cta)',
    boxShadow: '0 0 6px rgba(6,182,212,0.6)',
  },
  ldDark: {
    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
    background: 'var(--sb-surface)',
    border: '1.5px solid var(--sb-border-md)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  },
  ldDash: {
    width: 18, height: 0, flexShrink: 0,
    borderTop: '2px dashed rgba(6,182,212,0.5)',
  },
  ldPoi: {
    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
    background: 'rgba(245,158,11,0.18)',
    border: '1.5px solid rgba(245,158,11,0.6)',
  },

  locBtn: {
    position: 'absolute', bottom: 148, right: 14, zIndex: 800,
    width: 32, height: 32,
    background: 'var(--map-glass)', backdropFilter: 'blur(8px)',
    border: '1px solid var(--map-border)',
    borderRadius: 8,
    boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--accent)',
    transition: 'all 0.15s',
  },
  locBtnMobile: {
    bottom: 'auto', top: 68, right: 14,
  },
  locBtnDenied: {
    color: 'var(--red)',
    border: `1px solid rgba(239,68,68,0.35)`,
  },
  locSpinner: {
    width: 14, height: 14, borderRadius: '50%',
    border: '2px solid rgba(6,182,212,0.25)',
    borderTopColor: 'var(--accent)',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },
}
