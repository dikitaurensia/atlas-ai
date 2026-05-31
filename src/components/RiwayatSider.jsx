import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const CATEGORY_COLORS = {
  'Burger':      '#F97316',
  'Ayam Goreng': '#10B981',
  'Kopi & Cafe': '#8B5CF6',
  'Mie & Bakso': '#EF4444',
  'Minuman':     '#3B82F6',
  'Lainnya':     '#94A3B8',
}

const CATEGORY_BG = {
  'Burger':      'rgba(249,115,22,0.12)',
  'Ayam Goreng': 'rgba(16,185,129,0.12)',
  'Kopi & Cafe': 'rgba(139,92,246,0.12)',
  'Mie & Bakso': 'rgba(239,68,68,0.12)',
  'Minuman':     'rgba(59,130,246,0.12)',
  'Lainnya':     'rgba(148,163,184,0.1)',
}

function scoreColor(s) {
  if (s >= 75) return '#10B981'
  if (s >= 60) return '#F59E0B'
  return '#EF4444'
}

function scoreGlow(s) {
  if (s >= 75) return 'rgba(16,185,129,0.25)'
  if (s >= 60) return 'rgba(245,158,11,0.25)'
  return 'rgba(239,68,68,0.25)'
}

export default function RiwayatSider({ open, onClose, historyItems = [], onItemClick }) {
  const [tab, setTab] = useState('semua')
  const savedItems = historyItems.filter(h => h.saved)
  const prevSavedCount = useState(savedItems.length)[0]

  useEffect(() => {
    if (open && savedItems.length > prevSavedCount) setTab('tersimpan')
  }, [savedItems.length, open])

  const items = tab === 'tersimpan' ? savedItems : historyItems

  return createPortal(
    <>
      <div onClick={onClose} style={{
        ...s.backdrop,
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
      }} />

      <div style={{ ...s.drawer, transform: open ? 'translateX(0)' : 'translateX(100%)' }}>

        {/* Header */}
        <div style={s.header}>
          <div style={s.headerLeft}>
            <div style={s.headerIcon}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>
              </svg>
            </div>
            <div>
              <h2 style={s.title}>Riwayat Analisis</h2>
              <p style={s.subtitle}>90 hari terakhir · {historyItems.length} analisis</p>
            </div>
          </div>
          <button style={s.closeBtn} onClick={onClose}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--txt-2)" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {[
            { key: 'semua', label: 'Semua', count: historyItems.length },
            { key: 'tersimpan', label: 'Tersimpan', count: savedItems.length },
          ].map(t => (
            <button
              key={t.key}
              style={{ ...s.tab, ...(tab === t.key ? s.tabActive : {}) }}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              <span style={{ ...s.tabCount, ...(tab === t.key ? s.tabCountActive : {}) }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        <div className="sidebar-scroll" style={s.list}>
          {items.length === 0 ? (
            <EmptyList tab={tab} />
          ) : (
            items.map((item, i) => (
              <HistoryItem
                key={item.id}
                item={item}
                isLast={i === items.length - 1}
                onClick={() => item.lat && item.lng && onItemClick?.(item)}
                hasCoords={!!(item.lat && item.lng)}
              />
            ))
          )}
        </div>

      </div>
    </>,
    document.body
  )
}

function EmptyList({ tab }) {
  return (
    <div style={s.emptyWrap}>
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--txt-3)" strokeWidth="1.5">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
      <p style={s.emptyText}>
        {tab === 'tersimpan' ? 'Belum ada analisis tersimpan' : 'Belum ada riwayat analisis'}
      </p>
    </div>
  )
}

function HistoryItem({ item, isLast, onClick, hasCoords }) {
  const [hovered, setHovered] = useState(false)
  const catColor = CATEGORY_COLORS[item.category] || '#94A3B8'
  const catBg = CATEGORY_BG[item.category] || 'rgba(148,163,184,0.1)'
  const sc = scoreColor(item.score)
  const glow = scoreGlow(item.score)

  return (
    <div
      style={{
        ...s.item,
        ...(hovered && hasCoords ? s.itemHover : {}),
        ...(!isLast ? s.itemBorder : {}),
        cursor: hasCoords ? 'pointer' : 'default',
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Score ring */}
      <div style={s.scoreWrap}>
        <ScoreRing score={item.score} color={sc} glow={glow} />
      </div>

      {/* Info */}
      <div style={s.info}>
        <div style={s.topRow}>
          <span style={s.location}>{item.location}</span>
          {hovered && hasCoords && (
            <span style={s.mapHint}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Buka di peta
            </span>
          )}
        </div>
        <span style={{ ...s.category, color: catColor, background: catBg }}>
          {item.category}
        </span>
        <div style={s.meta}>
          <span style={s.grade}>{item.grade}</span>
          <span style={s.metaDot}>·</span>
          <span style={s.date}>{item.date}</span>
        </div>
      </div>

      {/* Download icon */}
      <button
        style={{ ...s.downloadBtn, ...(item.saved ? s.downloadBtnSaved : {}) }}
        title="Unduh laporan PDF"
        onClick={e => e.stopPropagation()}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
      </button>
    </div>
  )
}

function ScoreRing({ score, color, glow }) {
  const r = 16, circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" style={{ flexShrink: 0 }}>
      <circle cx="21" cy="21" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3"/>
      <circle cx="21" cy="21" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 21 21)"
        style={{ filter: `drop-shadow(0 0 4px ${glow})` }}
      />
      <text x="21" y="25" textAnchor="middle" fontSize="11" fontWeight="800" fill="var(--txt-1)">{score}</text>
    </svg>
  )
}

const s = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 9998,
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(3px)',
    transition: 'opacity 0.25s ease',
  },
  drawer: {
    position: 'fixed', top: 0, right: 0, bottom: 0,
    width: 360, zIndex: 9999,
    background: 'var(--sb-bg)',
    borderLeft: '1px solid var(--sb-border)',
    boxShadow: '-8px 0 40px rgba(0,0,0,0.4)',
    display: 'flex', flexDirection: 'column',
    transition: 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
  },

  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '16px 16px 14px',
    borderBottom: '1px solid var(--sb-border)',
    flexShrink: 0,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 32, height: 32, borderRadius: 8,
    background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  title: { fontSize: 14, fontWeight: 700, color: 'var(--txt-1)', marginBottom: 2 },
  subtitle: { fontSize: 10, color: 'var(--txt-3)' },
  closeBtn: {
    width: 30, height: 30, border: '1px solid var(--sb-border)',
    borderRadius: 7, background: 'var(--sb-surface)',
    cursor: 'pointer', padding: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  tabs: {
    display: 'flex', gap: 4, padding: '10px 14px',
    borderBottom: '1px solid var(--sb-border)', flexShrink: 0,
  },
  tab: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '5px 12px', border: '1px solid transparent',
    borderRadius: 6, fontSize: 12, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
    background: 'transparent', color: 'var(--txt-3)',
    transition: 'all 0.15s',
  },
  tabActive: {
    background: 'var(--accent-bg)', color: 'var(--accent)',
    border: '1px solid var(--accent-bd)',
    fontWeight: 600,
  },
  tabCount: {
    fontSize: 10, fontWeight: 700,
    padding: '1px 5px', borderRadius: 4,
    background: 'rgba(255,255,255,0.06)', color: 'var(--txt-3)',
  },
  tabCountActive: {
    background: 'var(--accent)', color: '#fff',
  },

  list: { flex: 1, overflowY: 'auto' },

  emptyWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 10, padding: '48px 24px',
  },
  emptyText: { fontSize: 12, color: 'var(--txt-3)', textAlign: 'center' },

  item: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px',
    transition: 'background 0.12s',
  },
  itemHover: { background: 'var(--sb-surface)' },
  itemBorder: { borderBottom: '1px solid var(--sb-border)' },

  scoreWrap: { flexShrink: 0 },

  info: { flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 },
  topRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  location: { fontSize: 13, fontWeight: 600, color: 'var(--txt-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  mapHint: {
    display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0,
    fontSize: 9, fontWeight: 600, color: 'var(--accent)',
    background: 'var(--accent-bg)', padding: '2px 6px',
    borderRadius: 4, border: '1px solid var(--accent-bd)',
    whiteSpace: 'nowrap',
  },
  category: {
    display: 'inline-block', fontSize: 10, fontWeight: 600,
    padding: '2px 7px', borderRadius: 4, width: 'fit-content',
  },
  meta: { display: 'flex', alignItems: 'center', gap: 5 },
  grade: { fontSize: 10, color: 'var(--txt-3)' },
  metaDot: { fontSize: 10, color: 'var(--txt-3)', opacity: 0.4 },
  date: { fontSize: 10, color: 'var(--txt-3)' },

  downloadBtn: {
    width: 30, height: 30, border: '1px solid var(--sb-border)',
    borderRadius: 7, background: 'transparent',
    cursor: 'pointer', padding: 0, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: 'var(--txt-3)', transition: 'all 0.15s',
  },
  downloadBtnSaved: {
    color: 'var(--accent)',
    background: 'var(--accent-bg)',
    border: '1px solid var(--accent-bd)',
  },
}
