'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, useMapEvents, Circle, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'

const CENTER = [-6.2088, 106.8456]

/* Pin — bright orange, visible on dark tiles */
const pinIcon = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:40px;height:50px">
      <div style="
        position:absolute;top:0;left:50%;margin-left:-18px;
        width:36px;height:36px;border-radius:50% 50% 50% 0;
        background:linear-gradient(135deg,#FF6B2B,#FF9A5C);
        border:2.5px solid rgba(255,255,255,0.15);
        box-shadow:0 4px 20px rgba(255,107,43,0.6),0 0 0 4px rgba(255,107,43,0.15);
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
        border:1.5px solid rgba(255,107,43,0.4);
        animation:pulse-ring 1.8s ease-out infinite;
      "></div>
    </div>
  `,
  iconSize: [40, 50],
  iconAnchor: [20, 46],
})

/* Competitor markers — dark glass pill */
const competitorIcon = (i) => L.divIcon({
  className: '',
  html: `
    <div style="
      width:26px;height:26px;border-radius:50%;
      background:rgba(17,24,39,0.85);
      border:1.5px solid rgba(255,255,255,0.18);
      backdrop-filter:blur(4px);
      box-shadow:0 2px 10px rgba(0,0,0,0.4);
      display:flex;align-items:center;justify-content:center;
      font-size:10px;font-weight:800;color:#F1F5F9;
      font-family:Inter,sans-serif;letter-spacing:-0.3px;
    ">${i + 1}</div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
})

function ClickHandler({ onLocationSelect }) {
  useMapEvents({ click: e => onLocationSelect(e.latlng) })
  return null
}

function FlyTo({ location }) {
  const map = useMap()
  useEffect(() => {
    if (location) map.flyTo(location, 15, { duration: 0.9 })
  }, [location, map])
  return null
}

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

export default function MapView({ selectedLocation, onLocationSelect, radius, analysisResult, isMobile }) {
  const competitorCount = analysisResult?.competitors?.length || 0

  return (
    <div style={s.wrap}>
      <MapContainer center={CENTER} zoom={13}
        style={{ width: '100%', height: '100%' }} zoomControl={false}>

        {/* Dark CartoDB tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          maxZoom={19}
        />

        <ClickHandler onLocationSelect={onLocationSelect} />
        {selectedLocation && <FlyTo location={selectedLocation} />}

        {selectedLocation && (
          <>
            <Circle center={selectedLocation} radius={radius} pathOptions={{
              color: '#FF6B2B', fillColor: '#FF6B2B',
              fillOpacity: 0.07, dashArray: '8 5', weight: 1.5,
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

        {analysisResult?.competitors.map((c, i) => (
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

      {!selectedLocation && <HintOverlay isMobile={isMobile} />}
      {selectedLocation && !isMobile && <StatusBar location={selectedLocation} radius={radius} />}
      {analysisResult && !isMobile && <Legend competitorCount={competitorCount} radius={radius} />}
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

function StatusBar({ location, radius }) {
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
    </div>
  )
}

function Legend({ competitorCount, radius }) {
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
      <div style={s.legendItem}>
        <div style={s.ldDash} />
        <span style={s.ldText}>Radius {radius >= 1000 ? `${radius / 1000}km` : `${radius}m`}</span>
      </div>
    </div>
  )
}

const GLASS = 'rgba(10,15,26,0.82)'
const BORDER = 'rgba(255,255,255,0.08)'

const s = {
  wrap: { flex: 1, position: 'relative', overflow: 'hidden' },

  zoomWrap: {
    position: 'absolute', bottom: 72, right: 14, zIndex: 800,
    display: 'flex', flexDirection: 'column',
    background: 'rgba(17,24,39,0.9)', backdropFilter: 'blur(8px)',
    borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)', overflow: 'hidden',
  },
  zoomBtn: {
    width: 32, height: 32, background: 'transparent', border: 'none',
    cursor: 'pointer', color: 'var(--txt-2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s',
  },
  zoomDivider: { height: 1, background: 'rgba(255,255,255,0.07)' },

  hint: {
    position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
    zIndex: 800, display: 'flex', alignItems: 'center', gap: 8,
    background: GLASS, backdropFilter: 'blur(10px)',
    padding: '7px 16px 7px 10px', borderRadius: 20,
    border: `1px solid ${BORDER}`,
    boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    whiteSpace: 'nowrap',
  },
  hintDot: {
    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
    background: 'var(--accent)',
    boxShadow: '0 0 8px rgba(255,107,43,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  hintText: { fontSize: 11, fontWeight: 500, color: 'var(--txt-1)' },
  hintMobile: { bottom: 260 },

  statusBar: {
    position: 'absolute', bottom: 14, left: 14, zIndex: 800,
    display: 'flex', alignItems: 'center', gap: 8,
    background: GLASS, backdropFilter: 'blur(10px)',
    padding: '5px 12px', borderRadius: 7,
    border: `1px solid ${BORDER}`,
    boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
  },
  statusItem: { display: 'flex', alignItems: 'center', gap: 5 },
  statusCoord: { fontSize: 10, fontWeight: 600, color: 'var(--txt-1)', letterSpacing: '0.1px' },
  statusRadius: { fontSize: 10, fontWeight: 500, color: 'var(--txt-2)' },
  statusSep: { width: 1, height: 12, background: 'rgba(255,255,255,0.1)' },

  legend: {
    position: 'absolute', top: 14, right: 14, zIndex: 800,
    background: GLASS, backdropFilter: 'blur(10px)',
    padding: '10px 13px', borderRadius: 8,
    border: `1px solid ${BORDER}`,
    boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
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
    background: 'var(--accent)',
    boxShadow: '0 0 6px rgba(255,107,43,0.5)',
  },
  ldDark: {
    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
    background: 'rgba(255,255,255,0.08)',
    border: '1.5px solid rgba(255,255,255,0.3)',
  },
  ldDash: {
    width: 18, height: 0, flexShrink: 0,
    borderTop: '2px dashed rgba(255,107,43,0.7)',
  },
}
