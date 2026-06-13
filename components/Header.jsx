'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

function useDebounce(value, delay) {
  const [dv, setDv] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDv(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return dv
}

function parseCoords(str) {
  const m = str.trim().match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/)
  if (!m) return null
  const lat = parseFloat(m[1]), lng = parseFloat(m[2])
  if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180)
    return { lat, lng, label: `${lat.toFixed(5)}°, ${lng.toFixed(5)}°`, type: 'coordinate' }
  return null
}

const PLACE_ICONS = {
  city: '🏙️', town: '🏘️', suburb: '📍', neighbourhood: '📍',
  road: '🛣️', street: '🛣️', restaurant: '🍽️', cafe: '☕',
  coordinate: '🎯', default: '📌',
}

export default function Header({ historyCount, onRiwayatClick, onLocationSearch }) {
  const [searchValue, setSearchValue] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const inputRef = useRef(null)
  const searchOuterRef = useRef(null)
  const [dropRect, setDropRect] = useState(null)
  const debouncedSearch = useDebounce(searchValue, 380)

  /* Fetch results */
  useEffect(() => {
    const q = debouncedSearch.trim()
    if (!q || q.length < 2) { setResults([]); return }

    const coords = parseCoords(q)
    if (coords) {
      setResults([{ ...coords, display_name: `Koordinat: ${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` }])
      return
    }

    let cancelled = false
    setLoading(true)
    fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ' Indonesia')}&format=json&limit=6&countrycodes=id&addressdetails=1`,
      { headers: { 'Accept-Language': 'id,en' } }
    )
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        setResults(data.map(r => ({
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon),
          display_name: r.display_name,
          label: r.display_name.split(',').slice(0, 2).join(',').trim(),
          sublabel: r.display_name.split(',').slice(2, 4).join(',').trim(),
          type: r.type || r.class || 'default',
        })))
      })
      .catch(() => { if (!cancelled) setResults([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [debouncedSearch])

  /* Reset active on new results */
  useEffect(() => setActiveIdx(-1), [results])

  const handleSelect = (r) => {
    setSearchValue(r.label)
    setResults([])
    inputRef.current?.blur()
    onLocationSearch?.({ lat: r.lat, lng: r.lng, label: r.label })
  }

  const handleKeyDown = (e) => {
    if (!results.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && activeIdx >= 0) handleSelect(results[activeIdx])
    if (e.key === 'Escape') { setResults([]); inputRef.current?.blur() }
  }

  const showDrop = searchFocused && (loading || results.length > 0)

  useEffect(() => {
    if (showDrop && searchOuterRef.current) {
      const r = searchOuterRef.current.getBoundingClientRect()
      setDropRect({ top: r.bottom + 6, left: r.left, width: r.width })
    }
  }, [showDrop, results])

  return (
    <header style={s.header}>
      {/* Brand */}
      <div style={s.brand}>
        <div style={s.logoMark}>
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <path d="M8 1C5.24 1 3 3.24 3 6c0 4 5 9 5 9s5-5 5-9c0-2.76-2.24-5-5-5z" fill="white"/>
            <circle cx="8" cy="6" r="2" fill="#FF6B2B"/>
          </svg>
        </div>
        <div style={s.logoStack}>
          <div style={s.logoRow}>
            <span style={s.logoText}>Atlas<span style={{ color: 'var(--accent)' }}>AI</span></span>
            <span style={s.betaBadge}>BETA</span>
          </div>
          <span style={s.poweredBy}>powered by <strong style={s.esbText}>ESB</strong></span>
        </div>
        <div style={s.dividerV} />
        <div style={s.workspace}>
          <div style={s.wsDot} />
          <span style={s.wsName}>Ayam Kreatif HQ</span>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>

      {/* Search */}
      <div style={s.searchOuter} ref={searchOuterRef}>
        <div style={{ ...s.searchWrap, ...(searchFocused ? s.searchFocused : {}) }}>
          <svg style={s.searchIco} width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke={searchFocused ? 'var(--accent)' : 'var(--txt-3)'} strokeWidth="2.2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            ref={inputRef}
            style={s.searchInput}
            placeholder="Cari area, jalan, atau koordinat..."
            value={searchValue}
            onChange={e => { setSearchValue(e.target.value) }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            spellCheck={false}
          />
          {loading && <span style={s.loadingDot} />}
          {searchValue && !loading && (
            <button style={s.clearBtn} onMouseDown={e => { e.preventDefault(); setSearchValue(''); setResults([]) }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
          {!searchValue && <kbd style={s.kbd}>⌘K</kbd>}
        </div>

        {/* Dropdown rendered as portal to escape overflow:hidden */}
        {showDrop && dropRect && createPortal(
          <div style={{ ...s.dropdown, position: 'fixed', top: dropRect.top, left: dropRect.left, width: dropRect.width }}>
            {loading && !results.length ? (
              <div style={s.dropLoading}>
                <span style={s.spinnerDot} />
                <span style={s.dropLoadingText}>Mencari lokasi…</span>
              </div>
            ) : (
              results.map((r, i) => {
                const icon = PLACE_ICONS[r.type] || PLACE_ICONS.default
                return (
                  <button
                    key={i}
                    style={{ ...s.dropItem, ...(i === activeIdx ? s.dropItemActive : {}) }}
                    onMouseDown={e => { e.preventDefault(); handleSelect(r) }}
                    onMouseEnter={() => setActiveIdx(i)}
                  >
                    <span style={s.dropIcon}>{icon}</span>
                    <div style={s.dropText}>
                      <span style={s.dropLabel}>{r.label}</span>
                      {r.sublabel && <span style={s.dropSub}>{r.sublabel}</span>}
                    </div>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--txt-3)" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </button>
                )
              })
            )}
          </div>,
          document.body
        )}
      </div>

      {/* Actions */}
      <div style={s.actions}>
        <button style={s.iconBtn} onClick={onRiwayatClick} title="Riwayat analisis">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
          </svg>
          {historyCount > 0 && <span style={s.badge}>{historyCount}</span>}
        </button>

        <button style={s.iconBtn} title="Notifikasi">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>

        <div style={s.avatarWrap}>
          <div style={s.avatarRing}>
            <div style={s.avatarInner}>A</div>
          </div>
          <div style={s.avatarInfo}>
            <span style={s.avatarName}>Aileen</span>
            <span style={s.avatarRole}>Admin</span>
          </div>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--txt-3)" strokeWidth="2.5">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </div>
    </header>
  )
}

const s = {
  header: {
    display: 'flex', alignItems: 'center', gap: 12,
    height: 52, padding: '0 18px',
    background: 'var(--sb-bg)',
    borderBottom: '1px solid var(--sb-border)',
    flexShrink: 0, zIndex: 200, position: 'relative',
  },

  brand: { display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  logoStack: { display: 'flex', flexDirection: 'column', gap: 1 },
  logoRow: { display: 'flex', alignItems: 'center', gap: 5 },
  poweredBy: { fontSize: 9, color: 'var(--txt-3)', letterSpacing: '0.1px', lineHeight: 1 },
  esbText: { color: 'var(--txt-2)', fontWeight: 700 },
  logoMark: {
    width: 27, height: 27, borderRadius: 7, flexShrink: 0,
    background: 'linear-gradient(135deg,#FF6B2B,#FF9A5C)',
    boxShadow: '0 2px 8px rgba(255,107,43,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 14, fontWeight: 800, color: 'var(--txt-1)', letterSpacing: '-0.4px' },
  betaBadge: {
    fontSize: 8, fontWeight: 800, letterSpacing: '0.8px',
    padding: '2px 5px', borderRadius: 4,
    background: 'var(--accent-bg)', color: 'var(--accent)',
    border: '1px solid var(--accent-bd)',
  },
  dividerV: { width: 1, height: 16, background: 'var(--sb-border-md)', margin: '0 2px' },
  workspace: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '4px 8px', borderRadius: 6, cursor: 'pointer',
    color: 'var(--txt-2)', fontSize: 12, fontWeight: 500,
  },
  wsDot: { width: 6, height: 6, borderRadius: '50%', background: '#10B981', flexShrink: 0 },
  wsName: { color: 'var(--txt-2)', fontWeight: 600, fontSize: 11 },

  searchOuter: {
    flex: 1, maxWidth: 400, position: 'relative',
  },
  searchWrap: {
    height: 33, display: 'flex', alignItems: 'center', position: 'relative',
    border: '1px solid var(--sb-border)',
    borderRadius: 8, background: 'var(--sb-surface)',
    transition: 'all 0.15s',
  },
  searchFocused: {
    border: '1px solid var(--accent-bd)',
    background: 'var(--sb-card)',
    boxShadow: '0 0 0 3px var(--accent-bg)',
  },
  searchIco: { position: 'absolute', left: 10, pointerEvents: 'none', flexShrink: 0 },
  searchInput: {
    width: '100%', height: '100%',
    padding: '0 52px 0 29px',
    border: 'none', background: 'transparent',
    fontSize: 12, color: 'var(--txt-1)', outline: 'none',
    fontFamily: 'inherit',
  },
  loadingDot: {
    position: 'absolute', right: 12,
    width: 14, height: 14,
    border: '2px solid var(--sb-border)',
    borderTopColor: 'var(--accent)',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block',
  },
  clearBtn: {
    position: 'absolute', right: 10,
    width: 18, height: 18, borderRadius: '50%',
    background: 'rgba(255,255,255,0.08)', border: 'none',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--txt-3)',
  },
  kbd: {
    position: 'absolute', right: 8,
    fontSize: 9, color: 'var(--txt-3)',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--sb-border)',
    borderRadius: 4, padding: '1px 5px', letterSpacing: '0.2px',
    whiteSpace: 'nowrap', pointerEvents: 'none',
  },

  dropdown: {
    background: 'var(--sb-surface)',
    border: '1px solid var(--sb-border-md)',
    borderRadius: 10,
    boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
    overflow: 'hidden',
    zIndex: 9999,
  },
  dropLoading: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '12px 14px',
  },
  spinnerDot: {
    width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
    border: '2px solid var(--sb-border)', borderTopColor: 'var(--accent)',
    animation: 'spin 0.7s linear infinite', display: 'inline-block',
  },
  dropLoadingText: { fontSize: 12, color: 'var(--txt-3)' },
  dropItem: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px', border: 'none', borderBottom: '1px solid var(--sb-border)',
    background: 'transparent', cursor: 'pointer', textAlign: 'left',
    fontFamily: 'inherit', transition: 'background 0.1s',
  },
  dropItemActive: { background: 'var(--sb-card)' },
  dropIcon: { fontSize: 14, flexShrink: 0, width: 20, textAlign: 'center' },
  dropText: { flex: 1, display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 },
  dropLabel: {
    fontSize: 12, fontWeight: 600, color: 'var(--txt-1)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  dropSub: {
    fontSize: 10, color: 'var(--txt-3)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },

  actions: { display: 'flex', alignItems: 'center', gap: 5, marginLeft: 'auto', flexShrink: 0 },
  iconBtn: {
    width: 32, height: 32, borderRadius: 7,
    border: '1px solid var(--sb-border)', background: 'var(--sb-surface)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--txt-2)', position: 'relative',
  },
  badge: {
    position: 'absolute', top: -3, right: -3,
    minWidth: 15, height: 15, borderRadius: 8,
    background: 'var(--accent)', color: '#fff',
    fontSize: 8, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: '0 3px', border: '1.5px solid var(--sb-bg)',
  },
  avatarWrap: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '4px 10px 4px 4px', marginLeft: 3,
    border: '1px solid var(--sb-border)', borderRadius: 8,
    cursor: 'pointer', background: 'var(--sb-surface)',
  },
  avatarRing: {
    padding: 1.5, borderRadius: '50%',
    background: 'linear-gradient(135deg,var(--accent),#FFAA80)',
  },
  avatarInner: {
    width: 24, height: 24, borderRadius: '50%',
    background: 'linear-gradient(135deg,#FF6B2B,#FF9A5C)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 9, fontWeight: 800, color: '#fff',
    border: '1.5px solid var(--sb-bg)',
  },
  avatarInfo: { display: 'flex', flexDirection: 'column' },
  avatarName: { fontSize: 11, fontWeight: 700, color: 'var(--txt-1)', lineHeight: 1.3 },
  avatarRole: { fontSize: 9, color: 'var(--txt-3)', lineHeight: 1.3 },
}
