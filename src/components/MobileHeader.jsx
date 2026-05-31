import { useState } from 'react'
import { createPortal } from 'react-dom'

export default function MobileHeader({ historyCount, onRiwayatClick, onLocationSearch }) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = (q) => {
    setSearchValue(q)
    if (!q || q.length < 2) { setResults([]); return }

    const m = q.trim().match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/)
    if (m) {
      const lat = parseFloat(m[1]), lng = parseFloat(m[2])
      setResults([{ lat, lng, label: `Koordinat: ${lat.toFixed(4)}°, ${lng.toFixed(4)}°`, type: 'coordinate' }])
      return
    }

    setLoading(true)
    let cancelled = false
    fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q + ' Indonesia')}&format=json&limit=5&countrycodes=id`, {
      headers: { 'Accept-Language': 'id,en' }
    })
      .then(r => r.json())
      .then(data => {
        if (cancelled) return
        setResults(data.map(r => ({
          lat: parseFloat(r.lat), lng: parseFloat(r.lon),
          label: r.display_name.split(',').slice(0, 2).join(',').trim(),
          sublabel: r.display_name.split(',').slice(2, 4).join(',').trim(),
          type: r.type,
        })))
      })
      .catch(() => { if (!cancelled) setResults([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }

  const handleSelect = (r) => {
    setSearchOpen(false)
    setSearchValue('')
    setResults([])
    onLocationSearch?.({ lat: r.lat, lng: r.lng, label: r.label })
  }

  return (
    <>
      <header style={s.header}>
        {/* Logo */}
        <div style={s.brand}>
          <div style={s.logoMark}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <path d="M8 1C5.24 1 3 3.24 3 6c0 4 5 9 5 9s5-5 5-9c0-2.76-2.24-5-5-5z" fill="white"/>
              <circle cx="8" cy="6" r="2" fill="#FF6B2B"/>
            </svg>
          </div>
          <div>
            <div style={s.logoText}>Atlas<span style={{ color: 'var(--accent)' }}>AI</span></div>
            <div style={s.poweredBy}>powered by <strong style={{ color: 'var(--txt-2)' }}>ESB</strong></div>
          </div>
        </div>

        {/* Actions */}
        <div style={s.actions}>
          <button style={s.iconBtn} onClick={() => setSearchOpen(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
          <button style={s.iconBtn} onClick={onRiwayatClick}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
            </svg>
            {historyCount > 0 && <span style={s.badge}>{historyCount}</span>}
          </button>
          <div style={s.avatar}>A</div>
        </div>
      </header>

      {/* Full-screen search overlay */}
      {searchOpen && createPortal(
        <div style={s.searchOverlay}>
          <div style={s.searchBar}>
            <button style={s.backBtn} onClick={() => { setSearchOpen(false); setResults([]) }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5M12 5l-7 7 7 7"/>
              </svg>
            </button>
            <input
              style={s.searchInput}
              autoFocus
              placeholder="Cari area, jalan, atau koordinat..."
              value={searchValue}
              onChange={e => handleSearch(e.target.value)}
            />
            {(searchValue || loading) && (
              <button style={s.clearBtn} onClick={() => { setSearchValue(''); setResults([]) }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {loading && (
            <div style={s.loadingRow}>
              <span style={s.spinner} />
              <span style={s.loadingText}>Mencari lokasi…</span>
            </div>
          )}

          <div style={s.resultsList}>
            {results.map((r, i) => (
              <button key={i} style={s.resultItem} onClick={() => handleSelect(r)}>
                <div style={s.resultIcon}>
                  {r.type === 'coordinate' ? '🎯' : '📍'}
                </div>
                <div style={s.resultText}>
                  <span style={s.resultLabel}>{r.label}</span>
                  {r.sublabel && <span style={s.resultSub}>{r.sublabel}</span>}
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--txt-3)" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </button>
            ))}
          </div>

          {!searchValue && !results.length && (
            <div style={s.emptyHint}>
              <p style={s.emptyHintText}>Ketik nama area, jalan, atau koordinat</p>
              <p style={s.emptyHintSub}>Contoh: Senayan, Kemang, atau -6.2088, 106.8456</p>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  )
}

const s = {
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    height: 52, padding: '0 16px',
    background: 'var(--sb-bg)',
    borderBottom: '1px solid var(--sb-border)',
    flexShrink: 0, zIndex: 200,
  },
  brand: { display: 'flex', alignItems: 'center', gap: 8 },
  logoMark: {
    width: 28, height: 28, borderRadius: 7, flexShrink: 0,
    background: 'linear-gradient(135deg,#FF6B2B,#FF9A5C)',
    boxShadow: '0 2px 8px rgba(255,107,43,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontSize: 15, fontWeight: 800, color: 'var(--txt-1)', letterSpacing: '-0.4px', lineHeight: 1.2 },
  poweredBy: { fontSize: 9, color: 'var(--txt-3)', lineHeight: 1 },
  actions: { display: 'flex', alignItems: 'center', gap: 6 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 8,
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
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'linear-gradient(135deg,#FF6B2B,#FF9A5C)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11, fontWeight: 800, color: '#fff',
    border: '2px solid rgba(255,107,43,0.3)',
  },

  /* Search overlay */
  searchOverlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'var(--sb-bg)',
    display: 'flex', flexDirection: 'column',
  },
  searchBar: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 14px',
    borderBottom: '1px solid var(--sb-border)',
    flexShrink: 0,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 8, flexShrink: 0,
    border: 'none', background: 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--txt-2)',
  },
  searchInput: {
    flex: 1, height: 38,
    border: '1px solid var(--sb-border)', borderRadius: 8,
    background: 'var(--sb-surface)',
    padding: '0 12px', fontSize: 14,
    color: 'var(--txt-1)', outline: 'none',
    fontFamily: 'inherit',
  },
  clearBtn: {
    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
    border: 'none', background: 'transparent',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: 'var(--txt-3)',
  },
  loadingRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 20px',
  },
  spinner: {
    width: 16, height: 16, borderRadius: '50%', flexShrink: 0,
    border: '2px solid var(--sb-border)', borderTopColor: 'var(--accent)',
    animation: 'spin 0.7s linear infinite', display: 'inline-block',
  },
  loadingText: { fontSize: 13, color: 'var(--txt-3)' },
  resultsList: { flex: 1, overflowY: 'auto' },
  resultItem: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 20px',
    border: 'none', borderBottom: '1px solid var(--sb-border)',
    background: 'transparent', cursor: 'pointer',
    textAlign: 'left', fontFamily: 'inherit',
  },
  resultIcon: { fontSize: 18, flexShrink: 0 },
  resultText: { flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 },
  resultLabel: { fontSize: 14, fontWeight: 600, color: 'var(--txt-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  resultSub: { fontSize: 12, color: 'var(--txt-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  emptyHint: {
    display: 'flex', flexDirection: 'column', gap: 6,
    alignItems: 'center', padding: '48px 24px',
  },
  emptyHintText: { fontSize: 14, color: 'var(--txt-2)', fontWeight: 500, textAlign: 'center' },
  emptyHintSub: { fontSize: 12, color: 'var(--txt-3)', textAlign: 'center' },
}
