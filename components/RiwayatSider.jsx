'use client'

import { useState } from 'react'
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

const TAG_COLORS = {
  positive: { bg: 'rgba(16,185,129,0.1)',   color: '#10B981', bd: 'rgba(16,185,129,0.2)' },
  warning:  { bg: 'rgba(245,158,11,0.1)',   color: '#F59E0B', bd: 'rgba(245,158,11,0.2)' },
  negative: { bg: 'rgba(239,68,68,0.1)',    color: '#EF4444', bd: 'rgba(239,68,68,0.18)' },
  info:     { bg: 'rgba(6,182,212,0.1)',    color: '#06B6D4', bd: 'rgba(6,182,212,0.25)' },
  neutral:  { bg: 'rgba(148,163,184,0.08)', color: '#94A3B8', bd: 'rgba(148,163,184,0.2)' },
}

function scoreColor(s) {
  if (s >= 75) return '#10B981'
  if (s >= 60) return '#F59E0B'
  return '#EF4444'
}

function scoreGlow(s) {
  if (s >= 75) return 'rgba(16,185,129,0.3)'
  if (s >= 60) return 'rgba(245,158,11,0.3)'
  return 'rgba(239,68,68,0.3)'
}

export default function RiwayatSider({ open, onClose, historyItems = [], onItemClick }) {
  const [selectedItem, setSelectedItem] = useState(null)

  const handleItemClick = (item) => {
    setSelectedItem(item)
  }

  const handleOpenMap = (item) => {
    onItemClick?.(item)
    setSelectedItem(null)
  }

  return createPortal(
    <>
      <div onClick={() => { onClose(); setSelectedItem(null) }} style={{
        ...s.backdrop,
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
      }} />

      <div style={{ ...s.drawer, transform: open ? 'translateX(0)' : 'translateX(100%)' }}>
        {selectedItem ? (
          <DetailPanel
            item={selectedItem}
            onBack={() => setSelectedItem(null)}
            onOpenMap={() => handleOpenMap(selectedItem)}
          />
        ) : (
          <ListPanel
            historyItems={historyItems}
            onClose={() => { onClose(); setSelectedItem(null) }}
            onItemClick={handleItemClick}
          />
        )}
      </div>
    </>,
    document.body
  )
}

function ListPanel({ historyItems, onClose, onItemClick }) {
  const [tab, setTab] = useState('semua')
  const items = tab === 'semua' ? historyItems : historyItems.filter(h => h.saved)

  return (
    <>
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
            <p style={s.subtitle}>{historyItems.length} analisis tersimpan</p>
          </div>
        </div>
        <button style={s.closeBtn} onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--txt-2)" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      <div style={s.tabs}>
        {[
          { key: 'semua',     label: 'Semua',     count: historyItems.length },
          { key: 'tersimpan', label: 'Tersimpan', count: historyItems.filter(h => h.saved).length },
        ].map(t => (
          <button key={t.key}
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

      <div className="sidebar-scroll" style={s.list}>
        {items.length === 0 ? (
          <div style={s.emptyWrap}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--txt-3)" strokeWidth="1.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <p style={s.emptyText}>Belum ada analisis tersimpan</p>
            <p style={s.emptyHint}>Klik "Simpan" setelah menganalisis lokasi</p>
          </div>
        ) : (
          items.map((item, i) => (
            <HistoryItem
              key={item.id} item={item}
              isLast={i === items.length - 1}
              onClick={() => onItemClick(item)}
            />
          ))
        )}
      </div>
    </>
  )
}

function HistoryItem({ item, isLast, onClick }) {
  const [hovered, setHovered] = useState(false)
  const catColor = CATEGORY_COLORS[item.category] || '#94A3B8'
  const catBg = CATEGORY_BG[item.category] || 'rgba(148,163,184,0.1)'
  const sc = scoreColor(item.score)
  const glow = scoreGlow(item.score)

  return (
    <div
      style={{ ...s.item, ...(hovered ? s.itemHover : {}), ...(!isLast ? s.itemBorder : {}), cursor: 'pointer' }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <ScoreRing score={item.score} color={sc} glow={glow} size={42} />

      <div style={s.info}>
        <div style={s.topRow}>
          <span style={s.location}>{item.location}</span>
          {hovered && (
            <span style={s.detailHint}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              Detail
            </span>
          )}
        </div>
        <span style={{ ...s.category, color: catColor, background: catBg }}>{item.category}</span>
        <div style={s.meta}>
          <span style={s.grade}>{item.grade}</span>
          <span style={s.metaDot}>·</span>
          <span style={s.date}>{item.date}</span>
        </div>
      </div>
    </div>
  )
}

function DetailPanel({ item, onBack, onOpenMap }) {
  const result = item.result
  const sc = scoreColor(item.score)
  const glow = scoreGlow(item.score)
  const catColor = CATEGORY_COLORS[item.category] || '#94A3B8'
  const catBg = CATEGORY_BG[item.category] || 'rgba(148,163,184,0.1)'

  return (
    <>
      {/* Detail Header */}
      <div style={s.header}>
        <div style={s.headerLeft}>
          <button style={s.backBtn} onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--txt-2)" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
          </button>
          <div>
            <h2 style={s.title}>Detail Analisis</h2>
            <p style={s.subtitle}>{item.location} · {item.date}</p>
          </div>
        </div>
        <button style={{ ...s.mapBtn }} onClick={onOpenMap}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          Buka peta
        </button>
      </div>

      <div className="sidebar-scroll" style={s.detailScroll}>

        {/* Score Hero */}
        <div style={s.detailHero}>
          <ScoreRing score={item.score} color={sc} glow={glow} size={72} />
          <div style={{ flex: 1 }}>
            <div style={{ ...s.gradePill, background: `${sc}18`, color: sc, border: `1px solid ${sc}30` }}>
              {item.grade}
            </div>
            <div style={s.heroSub}>Skor kelayakan keseluruhan</div>
            <span style={{ ...s.category, color: catColor, background: catBg, display: 'inline-block', marginTop: 6 }}>
              {item.category}
            </span>
          </div>
        </div>

        {/* Info strip */}
        <div style={s.infoStrip}>
          <div style={s.infoCell}>
            <span style={s.infoCellLabel}>LOKASI</span>
            <span style={s.infoCellVal}>{item.location}</span>
          </div>
          <div style={s.infoSep} />
          <div style={s.infoCell}>
            <span style={s.infoCellLabel}>RADIUS</span>
            <span style={s.infoCellVal}>{item.radius >= 1000 ? `${item.radius / 1000} km` : `${item.radius} m`}</span>
          </div>
          <div style={s.infoSep} />
          <div style={s.infoCell}>
            <span style={s.infoCellLabel}>KOMPETITOR</span>
            <span style={s.infoCellVal}>{result?.competitors?.length ?? 0}</span>
          </div>
        </div>

        {/* Dimensions */}
        {result?.dimensions && (
          <div style={s.section}>
            <div style={s.sectionLabel}>5 DIMENSI ANALISIS</div>
            <div style={s.dimList}>
              {result.dimensions.map(d => (
                <div key={d.label} style={s.dimRow}>
                  <div style={s.dimTop}>
                    <span style={s.dimLabel}>{d.label}</span>
                    <span style={{ ...s.dimScore, color: scoreColor(d.score) }}>{d.score}</span>
                  </div>
                  <div style={s.dimBar}>
                    <div style={{ ...s.dimFill, width: `${d.score}%`, background: scoreColor(d.score) }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profit */}
        {result?.profitMin && (
          <div style={s.profitCard}>
            <div style={s.profitLabel}>ESTIMASI PROFIT / BULAN</div>
            <div style={s.profitRange}>
              Rp {result.profitMin} jt
              <span style={{ color: 'var(--accent)', fontWeight: 400 }}> – </span>
              Rp {result.profitMax} jt
            </div>
            <div style={s.profitNote}>
              Referensi {result.referenceCount}+ outlet ESB dalam radius {result.referenceRadius} km
            </div>
          </div>
        )}

        {/* Tags */}
        {result?.tags?.length > 0 && (
          <div style={s.tagsWrap}>
            {result.tags.map((t, i) => {
              const tc = TAG_COLORS[t.type] || TAG_COLORS.neutral
              return (
                <span key={i} style={{ ...s.tag, background: tc.bg, color: tc.color, border: `1px solid ${tc.bd}` }}>
                  {t.label}
                </span>
              )
            })}
          </div>
        )}

        {/* AI Recommendation */}
        {result?.recommendation && (
          <div style={s.aiCard}>
            <div style={s.aiHeader}>
              <span style={s.aiDot}>✦</span>
              <span style={s.aiTitle}>REKOMENDASI AI</span>
            </div>
            <p style={s.aiText}>{result.recommendation}</p>
          </div>
        )}

        {/* Competitors */}
        {result?.competitors?.length > 0 && (
          <div style={s.section}>
            <div style={s.sectionLabel}>KOMPETITOR TERDEKAT</div>
            <div style={s.competitorList}>
              {result.competitors.map((c, i) => (
                <div key={c.id} style={s.competitorRow}>
                  <div style={s.competitorNum}>{i + 1}</div>
                  <div style={s.competitorInfo}>
                    <span style={s.competitorName}>{c.name}</span>
                    <span style={s.competitorDist}>{c.distance}m</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </>
  )
}

function ScoreRing({ score, color, glow, size = 42 }) {
  const half = size / 2
  const r = size === 42 ? 16 : 28
  const sw = size === 42 ? 3 : 5
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const fontSize = size === 42 ? 11 : 17
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={half} cy={half} r={r} fill="none" stroke="var(--sb-border)" strokeWidth={sw}/>
      <circle cx={half} cy={half} r={r} fill="none" stroke={color} strokeWidth={sw}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform={`rotate(-90 ${half} ${half})`}
        style={{ filter: `drop-shadow(0 0 4px ${glow})` }}
      />
      <text x={half} y={half + fontSize * 0.35} textAnchor="middle"
        fontSize={fontSize} fontWeight="800" fill="var(--txt-1)">{score}</text>
    </svg>
  )
}

const s = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 9998,
    background: 'rgba(0,0,0,0.55)',
    backdropFilter: 'blur(3px)',
    transition: 'opacity 0.25s ease',
  },
  drawer: {
    position: 'fixed', top: 0, right: 0, bottom: 0,
    width: 360, zIndex: 9999,
    background: 'var(--sb-bg)',
    borderLeft: '1px solid var(--sb-border)',
    boxShadow: '-4px 0 32px rgba(0,0,0,0.3)',
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
  backBtn: {
    width: 30, height: 30, border: '1px solid var(--sb-border)',
    borderRadius: 7, background: 'var(--sb-surface)',
    cursor: 'pointer', padding: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  mapBtn: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '6px 10px', border: '1px solid var(--accent-bd)',
    borderRadius: 7, background: 'var(--accent-bg)',
    color: 'var(--accent)', fontSize: 11, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
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
    border: '1px solid var(--accent-bd)', fontWeight: 600,
  },
  tabCount: {
    fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 4,
    background: 'var(--sb-card)', color: 'var(--txt-3)',
  },
  tabCountActive: { background: 'var(--accent)', color: '#fff' },

  list: { flex: 1, overflowY: 'auto' },

  emptyWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 8, padding: '48px 24px',
  },
  emptyText: { fontSize: 13, color: 'var(--txt-2)', textAlign: 'center', fontWeight: 600 },
  emptyHint: { fontSize: 11, color: 'var(--txt-3)', textAlign: 'center' },

  item: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', transition: 'background 0.12s',
  },
  itemHover: { background: 'var(--sb-surface)' },
  itemBorder: { borderBottom: '1px solid var(--sb-border)' },

  info: { flex: 1, display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 },
  topRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  location: { fontSize: 13, fontWeight: 600, color: 'var(--txt-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  detailHint: {
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

  /* Detail panel */
  detailScroll: {
    flex: 1, overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: 8,
    padding: '12px 14px 20px',
  },
  detailHero: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '14px',
    background: 'var(--sb-surface)', borderRadius: 12,
    border: '1px solid var(--sb-border)',
  },
  gradePill: {
    display: 'inline-block', fontSize: 10, fontWeight: 700,
    padding: '3px 8px', borderRadius: 6, marginBottom: 5,
  },
  heroSub: { fontSize: 11, color: 'var(--txt-3)' },

  infoStrip: {
    display: 'flex', alignItems: 'center',
    background: 'var(--sb-surface)', borderRadius: 10,
    border: '1px solid var(--sb-border)',
    overflow: 'hidden',
  },
  infoCell: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '10px 8px', gap: 3,
  },
  infoSep: { width: 1, height: 32, background: 'var(--sb-border)', flexShrink: 0 },
  infoCellLabel: { fontSize: 8, fontWeight: 700, letterSpacing: '0.6px', color: 'var(--txt-3)', textTransform: 'uppercase' },
  infoCellVal: { fontSize: 12, fontWeight: 700, color: 'var(--txt-1)' },

  section: {
    background: 'var(--sb-surface)', borderRadius: 12,
    border: '1px solid var(--sb-border)',
    overflow: 'hidden',
  },
  sectionLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: '0.7px',
    color: 'var(--txt-3)', textTransform: 'uppercase',
    padding: '10px 14px 8px',
    borderBottom: '1px solid var(--sb-border)',
  },
  dimList: { display: 'flex', flexDirection: 'column' },
  dimRow: {
    display: 'flex', flexDirection: 'column', gap: 4,
    padding: '8px 14px', borderBottom: '1px solid var(--sb-border)',
  },
  dimTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dimLabel: { fontSize: 11, color: 'var(--txt-2)', fontWeight: 500 },
  dimScore: { fontSize: 11, fontWeight: 800 },
  dimBar: { height: 4, background: '#243248', borderRadius: 2, overflow: 'hidden' },
  dimFill: { height: '100%', borderRadius: 2, transition: 'width 0.6s ease' },

  profitCard: {
    padding: '14px',
    background: 'linear-gradient(135deg, rgba(6,182,212,0.12) 0%, rgba(14,165,233,0.07) 100%)',
    borderRadius: 12, border: '1px solid rgba(6,182,212,0.2)',
  },
  profitLabel: { fontSize: 9, fontWeight: 700, letterSpacing: '0.7px', color: 'var(--txt-3)', textTransform: 'uppercase', marginBottom: 8 },
  profitRange: { fontSize: 20, fontWeight: 800, color: '#67E8F9', marginBottom: 4, lineHeight: 1 },
  profitNote: { fontSize: 10, color: 'var(--txt-3)' },

  tagsWrap: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  tag: { fontSize: 9.5, fontWeight: 600, padding: '3px 8px', borderRadius: 5 },

  aiCard: {
    padding: '12px 14px',
    background: 'linear-gradient(135deg, rgba(139,92,246,0.12) 0%, rgba(99,102,241,0.07) 100%)',
    borderRadius: 12, border: '1px solid rgba(139,92,246,0.2)',
  },
  aiHeader: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 7 },
  aiDot: { fontSize: 10, color: '#7C3AED' },
  aiTitle: { fontSize: 9, fontWeight: 700, color: '#7C3AED', letterSpacing: '0.7px', textTransform: 'uppercase' },
  aiText: { fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.7, margin: 0 },

  competitorList: { display: 'flex', flexDirection: 'column' },
  competitorRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 14px', borderBottom: '1px solid var(--sb-border)',
  },
  competitorNum: {
    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
    background: 'var(--sb-card)', border: '1px solid var(--sb-border)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 9, fontWeight: 800, color: 'var(--txt-2)',
  },
  competitorInfo: { flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  competitorName: { fontSize: 11, fontWeight: 600, color: 'var(--txt-1)' },
  competitorDist: { fontSize: 10, color: 'var(--txt-3)' },
}
