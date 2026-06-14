'use client'

import CategoryPicker from './CategoryPicker'
import RadiusSlider from './RadiusSlider'
import ScalePicker from './ScalePicker'
import ResultPanel from './ResultPanel'
import EmptyState from './EmptyState'
import LoadingSteps from './LoadingSteps'

export default function Sidebar({
  selectedCategory, onCategoryChange,
  radius, onRadiusChange,
  scale, onScaleChange,
  onAnalyze, isAnalyzing,
  analysisResult, analysisError, onSave, isSaved, selectedLocation,
}) {
  return (
    <aside style={s.sidebar}>
      {/* Top controls */}
      <div style={s.controls}>
        <CategoryPicker selected={selectedCategory} onChange={onCategoryChange} />
        <div style={s.divider} />
        <ScalePicker selected={scale} onChange={onScaleChange} />
        <div style={s.divider} />
        <RadiusSlider value={radius} onChange={onRadiusChange} />
      </div>

      {/* Result / state area */}
      <div style={s.resultArea}>
        {isAnalyzing ? (
          <LoadingSteps category={selectedCategory} />
        ) : analysisResult ? (
          <ResultPanel
            result={analysisResult}
            onSave={onSave}
            isSaved={isSaved}
            category={selectedCategory}
            location={selectedLocation}
          />
        ) : analysisError ? (
          // AC1.7: tampilkan error dengan tombol Coba Lagi
          <div style={s.errorWrap}>
            <div style={s.errorIcon}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
              </svg>
            </div>
            <p style={s.errorTitle}>Analisis Gagal</p>
            <p style={s.errorDesc}>Terjadi kesalahan saat memproses analisis. Periksa koneksi internet Anda dan coba lagi.</p>
            <button style={s.retryBtn} onClick={onAnalyze}>Coba Lagi</button>
          </div>
        ) : (
          <EmptyState selectedCategory={selectedCategory} selectedLocation={selectedLocation} onAnalyze={onAnalyze} />
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


const s = {
  sidebar: {
    width: 282, flexShrink: 0,
    display: 'flex', flexDirection: 'column',
    background: 'var(--sb-surface)',
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

  errorWrap: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '28px 20px', textAlign: 'center', gap: 10,
  },
  errorIcon: { color: '#EF4444', marginBottom: 4 },
  errorTitle: { fontSize: 13, fontWeight: 700, color: 'var(--txt-1)', margin: 0 },
  errorDesc: { fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.6, margin: 0 },
  retryBtn: {
    marginTop: 4, padding: '8px 18px',
    background: 'var(--cta)', color: '#fff',
    border: 'none', borderRadius: 8,
    fontSize: 11, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
}
