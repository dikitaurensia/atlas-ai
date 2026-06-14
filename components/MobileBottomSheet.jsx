'use client'

import { useState, useRef, useEffect } from 'react'
import CategoryPicker from './CategoryPicker'
import RadiusSlider from './RadiusSlider'
import ResultPanel from './ResultPanel'
import EmptyState from './EmptyState'

const PEEK_H = 230   // collapsed: just categories + radius
const FULL_H = 0.86  // expanded: 86% of viewport height

export default function MobileBottomSheet({
  selectedCategory, onCategoryChange,
  radius, onRadiusChange,
  onAnalyze, canAnalyze, isAnalyzing,
  analysisResult, onSave, isSaved, selectedLocation,
}) {
  const [expanded, setExpanded] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dragDelta, setDragDelta] = useState(0)
  const startY = useRef(0)
  const sheetRef = useRef(null)

  /* Auto-expand when result arrives */
  useEffect(() => {
    if (analysisResult || isAnalyzing) setExpanded(true)
  }, [analysisResult, isAnalyzing])

  const fullH = Math.round((typeof window !== 'undefined' ? window.innerHeight : 800) * FULL_H)
  const currentH = expanded ? fullH : PEEK_H
  const displayH = dragging ? Math.max(PEEK_H, Math.min(fullH, currentH - dragDelta)) : currentH

  const onTouchStart = (e) => {
    startY.current = e.touches[0].clientY
    setDragging(true)
    setDragDelta(0)
  }

  const onTouchMove = (e) => {
    if (!dragging) return
    const delta = e.touches[0].clientY - startY.current
    setDragDelta(delta)
  }

  const onTouchEnd = () => {
    setDragging(false)
    const midPoint = (PEEK_H + fullH) / 2
    if (dragDelta < -60 || displayH > midPoint) {
      setExpanded(true)
    } else if (dragDelta > 60 || displayH < midPoint) {
      setExpanded(false)
    }
    setDragDelta(0)
  }

  return (
    <div
      ref={sheetRef}
      style={{
        ...s.sheet,
        height: displayH,
        transition: dragging ? 'none' : 'height 0.35s cubic-bezier(0.32,0.72,0,1)',
      }}
    >
      {/* Drag handle */}
      <div
        style={s.handleWrap}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onClick={() => !dragging && setExpanded(e => !e)}
      >
        <div style={s.handle} />
        {!expanded && selectedCategory && (
          <div style={s.peekLabel}>
            <span style={s.peekCat}>{selectedCategory}</span>
            {canAnalyze && <span style={s.peekHint}>Tap untuk analisis</span>}
          </div>
        )}
        {!expanded && !selectedCategory && (
          <span style={s.peekHint}>Pilih kategori bisnis</span>
        )}
        {expanded && (
          <div style={s.sheetTitle}>
            {analysisResult ? 'Hasil Analisis' : isAnalyzing ? 'Menganalisis…' : 'Pengaturan'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="sidebar-scroll" style={s.content}>
        <CategoryPicker selected={selectedCategory} onChange={onCategoryChange} />
        <div style={s.divider} />
        <RadiusSlider value={radius} onChange={onRadiusChange} />
        <div style={s.analyzeBtnWrap}>
          <button
            style={{ ...s.analyzeBtn, ...(!canAnalyze || isAnalyzing ? s.analyzeBtnDisabled : {}) }}
            onClick={onAnalyze}
            disabled={!canAnalyze || isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <span style={s.analyzeBtnSpinner} />
                Menganalisis…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                {!selectedLocation ? 'Pilih lokasi di peta' : !selectedCategory ? 'Pilih kategori' : 'Mulai Analisis'}
              </>
            )}
          </button>
        </div>
        <div style={s.divider} />

        {isAnalyzing ? (
          <LoadingState category={selectedCategory} />
        ) : analysisResult ? (
          <ResultPanel
            result={analysisResult}
            onSave={onSave}
            isSaved={isSaved}
            category={selectedCategory}
            location={selectedLocation}
          />
        ) : (
          <EmptyState selectedCategory={selectedCategory} />
        )}
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <span style={s.footerText}>ESB AtlasAI · Location Intelligence</span>
      </div>
    </div>
  )
}

function LoadingState({ category }) {
  return (
    <div style={ls.wrap}>
      <div style={ls.ring} />
      <p style={ls.title}>Menganalisis lokasi…</p>
      <p style={ls.sub}>{category ? `Memproses data ${category}` : 'Memproses data geospasial'}</p>
    </div>
  )
}

const s = {
  sheet: {
    position: 'fixed', left: 0, right: 0, bottom: 0,
    zIndex: 500,
    background: 'var(--sb-surface)',
    borderTop: '1px solid var(--sb-border)',
    borderRadius: '16px 16px 0 0',
    boxShadow: '0 -4px 24px rgba(0,0,0,0.1)',
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
  },
  handleWrap: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '10px 16px 8px',
    flexShrink: 0, cursor: 'pointer', gap: 6,
    touchAction: 'none',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    background: '#CBD5E1', flexShrink: 0,
  },
  peekLabel: { display: 'flex', alignItems: 'center', gap: 8 },
  peekCat: { fontSize: 13, fontWeight: 700, color: 'var(--txt-1)' },
  peekHint: { fontSize: 11, color: 'var(--txt-3)' },
  sheetTitle: { fontSize: 13, fontWeight: 700, color: 'var(--txt-1)' },
  content: {
    flex: 1, overflowY: 'auto',
    borderTop: '1px solid var(--sb-border)',
  },
  divider: { height: 1, background: 'var(--sb-border)' },
  footer: {
    padding: '6px 16px 10px',
    borderTop: '1px solid var(--sb-border)', flexShrink: 0,
    display: 'flex', justifyContent: 'center',
  },
  footerText: { fontSize: 9, color: 'var(--txt-3)', letterSpacing: '0.3px' },

  analyzeBtnWrap: { padding: '10px 14px 12px' },
  analyzeBtn: {
    width: '100%', padding: '11px', border: 'none',
    borderRadius: 8, cursor: 'pointer',
    background: 'var(--cta)',
    boxShadow: '0 4px 14px rgba(6,182,212,0.3)',
    color: '#fff', fontSize: 13, fontWeight: 700,
    fontFamily: 'inherit',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    transition: 'all 0.15s',
  },
  analyzeBtnDisabled: {
    background: 'var(--sb-card)',
    color: 'var(--txt-3)',
    boxShadow: 'none',
    cursor: 'not-allowed',
  },
  analyzeBtnSpinner: {
    width: 13, height: 13, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: '#fff',
    animation: 'spin 0.7s linear infinite',
    display: 'inline-block', flexShrink: 0,
  },
}

const ls = {
  wrap: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '28px 20px', gap: 10,
  },
  ring: {
    width: 40, height: 40, borderRadius: '50%',
    border: '2px solid rgba(27,53,102,0.25)',
    borderTopColor: 'var(--accent)',
    animation: 'spin 0.8s linear infinite',
  },
  title: { fontSize: 13, fontWeight: 700, color: 'var(--txt-1)' },
  sub: { fontSize: 11, color: 'var(--txt-3)', textAlign: 'center' },
}
