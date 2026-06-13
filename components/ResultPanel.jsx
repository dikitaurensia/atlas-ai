'use client'

import { useState } from 'react'
import PDFPreviewModal from './PDFPreviewModal'

const TAG_COLORS = {
  positive: { bg: 'rgba(16,185,129,0.12)', color: '#34D399', bd: 'rgba(16,185,129,0.2)' },
  warning:  { bg: 'rgba(245,158,11,0.12)', color: '#FCD34D', bd: 'rgba(245,158,11,0.2)' },
  negative: { bg: 'rgba(239,68,68,0.12)',  color: '#F87171', bd: 'rgba(239,68,68,0.2)'  },
  info:     { bg: 'rgba(59,130,246,0.12)', color: '#93C5FD', bd: 'rgba(59,130,246,0.2)' },
  neutral:  { bg: 'rgba(255,255,255,0.05)',color: 'var(--txt-2)', bd: 'var(--sb-border)' },
}

function scoreColor(s) {
  if (s >= 70) return '#10B981'
  if (s >= 50) return '#F59E0B'
  return '#EF4444'
}

function gradeConfig(overall) {
  if (overall >= 75) return { label: 'Sangat Potensial', color: '#10B981', glow: 'rgba(16,185,129,0.25)' }
  if (overall >= 60) return { label: 'Potensi Bagus',    color: '#3B82F6', glow: 'rgba(59,130,246,0.25)' }
  if (overall >= 45) return { label: 'Cukup Potensial',  color: '#F59E0B', glow: 'rgba(245,158,11,0.25)' }
  return                     { label: 'Kurang Ideal',     color: '#EF4444', glow: 'rgba(239,68,68,0.25)' }
}

export default function ResultPanel({ result, onSave, isSaved, category, location }) {
  const [pdfOpen, setPdfOpen] = useState(false)
  const grade = gradeConfig(result.overall)

  return (
    <>
      <PDFPreviewModal open={pdfOpen} onClose={() => setPdfOpen(false)}
        result={result} category={category} location={location} />

      <div className="sidebar-scroll" style={s.wrap}>

        {/* Score Hero */}
        <div style={s.scoreHero}>
          <div style={s.scoreLeft}>
            <ScoreRing score={result.overall} color={grade.color} glow={grade.glow} />
          </div>
          <div style={s.scoreRight}>
            <div style={{ ...s.gradePill, background: `${grade.color}18`, color: grade.color, border: `1px solid ${grade.color}30` }}>
              {grade.label}
            </div>
            <div style={s.scoreSubText}>Skor kelayakan keseluruhan</div>
            <div style={s.scoreMeta}>5 dimensi · {category}</div>
          </div>
        </div>

        {/* 5 Dimensions */}
        <div style={s.analysisCard}>
          <div style={s.cardHeader}>
            <span style={s.cardLabel}>5 DIMENSI ANALISIS</span>
          </div>
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

        {/* Profit Card */}
        <div style={s.profitCard}>
          <div style={s.profitTop}>
            <span style={s.cardLabel}>ESTIMASI PROFIT / BULAN</span>
            <span style={s.profitBadge}>ESB Data</span>
          </div>
          <div style={s.profitRange}>
            Rp {result.profitMin} jt
            <span style={s.profitSep}> – </span>
            Rp {result.profitMax} jt
          </div>
          <div style={s.profitNote}>
            Referensi {result.referenceCount}+ outlet ESB dalam radius {result.referenceRadius} km
          </div>
        </div>

        {/* Tags */}
        <div style={s.tagsSection}>
          {result.tags.map((t, i) => {
            const tc = TAG_COLORS[t.type] || TAG_COLORS.neutral
            return (
              <span key={i} style={{ ...s.tag, background: tc.bg, color: tc.color, border: `1px solid ${tc.bd}` }}>
                {t.label}
              </span>
            )
          })}
        </div>

        {/* AI Recommendation */}
        <div style={s.aiCard}>
          <div style={s.aiHeader}>
            <div style={s.aiDot}>✦</div>
            <span style={s.aiTitle}>REKOMENDASI AI</span>
          </div>
          <p style={s.aiText}>{result.recommendation}</p>
        </div>

        {/* Actions */}
        <div style={s.actions}>
          <button
            style={{ ...s.saveBtn, ...(isSaved ? s.saveBtnActive : {}) }}
            onClick={onSave}
          >
            <svg width="12" height="12" viewBox="0 0 24 24"
              fill={isSaved ? 'currentColor' : 'none'}
              stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
            {isSaved ? 'Tersimpan' : 'Simpan'}
          </button>
          <button style={s.exportBtn} onClick={() => setPdfOpen(true)}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            Export PDF
          </button>
        </div>

      </div>
    </>
  )
}

/* Score ring */
function ScoreRing({ score, color, glow }) {
  const r = 30, circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div style={{ position: 'relative', width: 76, height: 76 }}>
      <svg width="76" height="76" viewBox="0 0 76 76">
        <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5.5"/>
        <circle cx="38" cy="38" r={r} fill="none" stroke={color} strokeWidth="5.5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 38 38)"
          style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
        />
        <text x="38" y="43" textAnchor="middle" fontSize="17" fontWeight="800" fill="var(--txt-1)">{score}</text>
      </svg>
    </div>
  )
}

const s = {
  wrap: {
    flex: 1, overflowY: 'auto',
    display: 'flex', flexDirection: 'column', gap: 8,
    padding: '10px 12px 16px',
    animation: 'fade-in 0.3s ease',
  },

  scoreHero: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px',
    background: 'var(--sb-card)', borderRadius: 10,
    border: '1px solid var(--sb-border)',
  },
  scoreLeft: { flexShrink: 0 },
  scoreRight: { flex: 1 },
  gradePill: {
    display: 'inline-block', fontSize: 10, fontWeight: 700,
    padding: '3px 8px', borderRadius: 5, marginBottom: 5,
  },
  scoreSubText: { fontSize: 11, color: 'var(--txt-2)', marginBottom: 3 },
  scoreMeta: { fontSize: 10, color: 'var(--txt-3)' },

  analysisCard: {
    background: 'var(--sb-card)', borderRadius: 10,
    border: '1px solid var(--sb-border)',
  },
  cardHeader: { padding: '10px 14px 8px', borderBottom: '1px solid var(--sb-border)' },
  cardLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: '0.7px',
    color: 'var(--txt-3)', textTransform: 'uppercase',
  },
  dimList: { display: 'flex', flexDirection: 'column', gap: 0 },
  dimRow: {
    display: 'flex', flexDirection: 'column', gap: 4,
    padding: '8px 14px',
    borderBottom: '1px solid var(--sb-border)',
  },
  dimTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dimLabel: { fontSize: 11, color: 'var(--txt-2)', fontWeight: 500 },
  dimScore: { fontSize: 11, fontWeight: 800 },
  dimBar: { height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' },
  dimFill: { height: '100%', borderRadius: 2, transition: 'width 0.7s ease' },

  profitCard: {
    padding: '12px 14px',
    background: 'linear-gradient(135deg, rgba(37,99,235,0.1), rgba(37,99,235,0.04))',
    borderRadius: 10,
    border: '1px solid var(--accent-bd)',
  },
  profitTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  profitBadge: {
    fontSize: 8, fontWeight: 700, color: 'var(--accent)',
    background: 'var(--accent-bg)', padding: '1px 6px',
    borderRadius: 4, border: '1px solid var(--accent-bd)',
  },
  profitRange: { fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 4, lineHeight: 1 },
  profitSep: { color: 'var(--txt-2)', fontWeight: 400 },
  profitNote: { fontSize: 9.5, color: 'var(--txt-3)' },

  tagsSection: { display: 'flex', flexWrap: 'wrap', gap: 5 },
  tag: { fontSize: 9.5, fontWeight: 500, padding: '3px 8px', borderRadius: 5 },

  aiCard: {
    padding: '11px 14px',
    background: 'rgba(139,92,246,0.08)',
    borderRadius: 10, border: '1px solid rgba(139,92,246,0.2)',
  },
  aiHeader: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 },
  aiDot: { fontSize: 10, color: '#A78BFA' },
  aiTitle: {
    fontSize: 9, fontWeight: 700, color: '#A78BFA',
    letterSpacing: '0.7px', textTransform: 'uppercase',
  },
  aiText: { fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.65, margin: 0 },

  actions: { display: 'flex', gap: 7 },
  saveBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    padding: '9px', border: '1px solid var(--sb-border-md)',
    borderRadius: 8, background: 'rgba(255,255,255,0.04)',
    color: 'var(--txt-2)', fontSize: 11, fontWeight: 600,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  saveBtnActive: {
    background: 'var(--accent-bg)', color: 'var(--accent)',
    border: '1px solid var(--accent-bd)',
  },
  exportBtn: {
    flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    padding: '9px', border: 'none',
    borderRadius: 8, background: 'var(--accent)',
    boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
    color: '#fff', fontSize: 11, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
}
