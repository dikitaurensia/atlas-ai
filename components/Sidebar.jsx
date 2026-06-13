'use client'

import CategoryPicker from './CategoryPicker'
import RadiusSlider from './RadiusSlider'
import ResultPanel from './ResultPanel'
import EmptyState from './EmptyState'

export default function Sidebar({
  selectedCategory, onCategoryChange,
  radius, onRadiusChange,
  onAnalyze, canAnalyze, isAnalyzing,
  analysisResult, onSave, isSaved, selectedLocation,
}) {
  return (
    <aside style={s.sidebar}>
      {/* Top controls */}
      <div style={s.controls}>
        <CategoryPicker selected={selectedCategory} onChange={onCategoryChange} />
        <div style={s.divider} />
        <RadiusSlider value={radius} onChange={onRadiusChange} />
        <div style={s.divider} />
      </div>

      {/* Result / state area */}
      <div style={s.resultArea}>
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
          <EmptyState
            selectedCategory={selectedCategory}
            onAnalyze={onAnalyze}
            canAnalyze={canAnalyze}
          />
        )}
      </div>

      {/* Footer */}
      <div style={s.footer}>
        <span style={s.footerText}>ESB AtlasAI</span>
        <span style={s.footerDot}>·</span>
        <span style={s.footerText}>Location Intelligence</span>
      </div>
    </aside>
  )
}

function LoadingState({ category }) {
  return (
    <div style={s.loading}>
      <div style={s.pulseRing}>
        <div style={s.pulseCore} />
      </div>
      <p style={s.loadingTitle}>Menganalisis lokasi…</p>
      <p style={s.loadingDesc}>
        {category ? `Memproses data ${category} & kompetitor` : 'Memproses data geospasial'}
      </p>
      <div style={s.loadingSteps}>
        {['Google Places API', 'ESB Data Layer', 'AI Inference'].map((step, i) => (
          <div key={step} style={{ ...s.loadingStep, animationDelay: `${i * 0.3}s` }}>
            <div style={s.loadingDot} />
            <span style={s.loadingStepText}>{step}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const s = {
  sidebar: {
    width: 282, flexShrink: 0,
    display: 'flex', flexDirection: 'column',
    background: 'var(--sb-bg)',
    borderRight: '1px solid var(--sb-border)',
    overflow: 'hidden',
  },
  controls: { flexShrink: 0 },
  divider: { height: 1, background: 'var(--sb-border)', margin: '0' },
  resultArea: {
    flex: 1, overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
  },
  footer: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '8px 14px',
    borderTop: '1px solid var(--sb-border)',
    flexShrink: 0,
  },
  footerText: { fontSize: 9, color: 'var(--txt-3)', letterSpacing: '0.3px' },
  footerDot: { fontSize: 9, color: 'var(--txt-3)' },

  loading: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '24px 20px', gap: 10,
  },
  pulseRing: {
    width: 52, height: 52, borderRadius: '50%',
    border: '2px solid rgba(255,107,43,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: 'pulse-ring 1.5s ease-out infinite',
  },
  pulseCore: {
    width: 20, height: 20, borderRadius: '50%',
    background: 'var(--accent)',
    boxShadow: '0 0 12px rgba(255,107,43,0.5)',
  },
  loadingTitle: { fontSize: 12, fontWeight: 700, color: 'var(--txt-1)' },
  loadingDesc: { fontSize: 10, color: 'var(--txt-3)', textAlign: 'center', marginTop: -4 },
  loadingSteps: { display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 },
  loadingStep: {
    display: 'flex', alignItems: 'center', gap: 7,
    animation: 'fade-in 0.5s ease forwards',
    opacity: 0,
  },
  loadingDot: {
    width: 5, height: 5, borderRadius: '50%',
    background: 'var(--accent)', opacity: 0.7,
  },
  loadingStepText: { fontSize: 10, color: 'var(--txt-3)' },
}
