'use client'

import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import useIsMobile from '@/hooks/useIsMobile'

const CATEGORY_ICONS = {
  'Ayam Goreng': '🍗', 'Kopi & Cafe': '☕', 'Mie & Bakso': '🍜',
  'Minuman': '🧋', 'Burger': '🍔', 'Lainnya': '🍽️',
}

const TAG_STYLES = {
  positive: { bg: '#ECFDF5', color: '#059669', bd: '#A7F3D0' },
  warning:  { bg: '#FFFBEB', color: '#D97706', bd: '#FDE68A' },
  negative: { bg: '#FEF2F2', color: '#DC2626', bd: '#FECACA' },
  info:     { bg: '#EFF6FF', color: '#2563EB', bd: '#BFDBFE' },
  neutral:  { bg: '#F9FAFB', color: '#6B7280', bd: '#E5E7EB' },
}

function scoreColor(s) {
  if (s >= 70) return '#10B981'
  if (s >= 50) return '#F59E0B'
  return '#EF4444'
}

export default function PDFPreviewModal({ open, onClose, result, category, location }) {
  const previewRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const isMobile = useIsMobile()

  if (!open || !result) return null

  // Scale A4 page (595px) to fit mobile screen
  const pageScale = isMobile
    ? Math.min(1, (window.innerWidth - 16) / 595)
    : 1

  const today = new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const handleDownload = async () => {
    if (!previewRef.current) return
    setDownloading(true)
    // Temporarily remove zoom for full-resolution capture
    const el = previewRef.current
    const prevZoom = el.style.zoom
    el.style.zoom = '1'
    try {
      const canvas = await html2canvas(el, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const w = pdf.internal.pageSize.getWidth()
      pdf.addImage(imgData, 'PNG', 0, 0, w, (canvas.height * w) / canvas.width)
      const lat = location?.lat?.toFixed(4) ?? '0'
      const lng = location?.lng?.toFixed(4) ?? '0'
      const ds = new Date().toISOString().slice(0, 10).replace(/-/g, '')
      pdf.save(`ESB_AtlasAI_${(category ?? 'Analisis').replace(/\s/g, '')}_${ds}_${lat}_${lng}.pdf`)
    } finally {
      el.style.zoom = prevZoom // restore
      setDownloading(false)
    }
  }

  const overlayStyle = isMobile
    ? { ...s.overlay, padding: 0, alignItems: 'flex-end' }
    : s.overlay

  const modalStyle = isMobile
    ? { ...s.modal, maxWidth: '100%', maxHeight: '100vh', borderRadius: '14px 14px 0 0' }
    : s.modal

  return createPortal(
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={modalStyle}>

        {/* Modal chrome — dark */}
        <div style={s.chrome}>
          <div style={s.chromeLeft}>
            <div style={s.chromeIcon}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div>
              <div style={s.chromeTitle}>Preview Laporan PDF</div>
              <div style={s.chromeSub}>A4 · {category} · {today}</div>
            </div>
          </div>
          <div style={s.chromeRight}>
            <button
              style={{ ...s.dlBtn, ...(downloading ? s.dlBtnLoading : {}) }}
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <><span style={s.spinner} />Generating…</>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Unduh PDF
                </>
              )}
            </button>
            <button style={s.closeBtn} onClick={onClose}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--txt-2)" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Document viewer background */}
        <div style={{ ...s.viewer, ...(isMobile ? s.viewerMobile : {}) }}>
          <div ref={previewRef} style={{ ...s.page, zoom: pageScale }}>

            {/* ── Page header banner ── */}
            <div style={s.banner}>
              <div style={s.bannerLeft}>
                <div style={s.bannerLogo}>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1C5.24 1 3 3.24 3 6c0 4 5 9 5 9s5-5 5-9c0-2.76-2.24-5-5-5z" fill="white"/>
                    <circle cx="8" cy="6" r="2" fill="#FF6B2B"/>
                  </svg>
                </div>
                <div>
                  <div style={s.bannerBrand}>Atlas<span style={{ color: '#FF6B2B' }}>AI</span></div>
                  <div style={s.bannerSub}>by ESB · Location Intelligence</div>
                </div>
              </div>
              <div style={s.bannerRight}>
                <div style={s.bannerDocType}>LAPORAN ANALISIS LOKASI</div>
                <div style={s.bannerDate}>{today}</div>
              </div>
            </div>

            {/* ── Location strip ── */}
            <div style={s.locStrip}>
              <div style={s.locBadge}>
                <span style={s.locIcon}>{CATEGORY_ICONS[category] || '🍽️'}</span>
                <span style={s.locCat}>{category}</span>
              </div>
              {location && (
                <div style={s.coordStrip}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {location.lat?.toFixed(5)}°, {location.lng?.toFixed(5)}°
                </div>
              )}
            </div>

            {/* ── Score + dimensions ── */}
            <div style={s.scoreBlock}>
              {/* Score hero */}
              <div style={s.scoreHero}>
                <ScoreRingLarge score={result.overall} color={result.gradeColor} />
                <div style={{ ...s.gradePill, background: `${result.gradeColor}15`, color: result.gradeColor, border: `1px solid ${result.gradeColor}30` }}>
                  {result.grade}
                </div>
                <div style={s.scoreCaption}>Skor Kelayakan</div>
              </div>

              {/* Divider */}
              <div style={s.scoreVDivider} />

              {/* Dimensions */}
              <div style={s.dimsWrap}>
                <div style={s.dimsTitle}>5 DIMENSI ANALISIS</div>
                {result.dimensions.map(d => (
                  <div key={d.label} style={s.dimRow}>
                    <span style={s.dimLabel}>{d.label}</span>
                    <div style={s.dimBarWrap}>
                      <div style={s.dimBarBg}>
                        <div style={{ ...s.dimBarFill, width: `${d.score}%`, background: scoreColor(d.score) }} />
                      </div>
                      <span style={{ ...s.dimScore, color: scoreColor(d.score) }}>{d.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Profit + Tags row ── */}
            <div style={s.metricsRow}>
              <div style={s.profitCard}>
                <div style={s.metricLabel}>ESTIMASI PROFIT / BULAN</div>
                <div style={s.profitRange}>
                  Rp {result.profitMin} jt <span style={s.profitSep}>–</span> Rp {result.profitMax} jt
                </div>
                <div style={s.profitNote}>
                  Data {result.referenceCount}+ outlet ESB · radius {result.referenceRadius} km
                </div>
              </div>
              <div style={s.tagsCard}>
                <div style={s.metricLabel}>INSIGHT LOKASI</div>
                <div style={s.tagsRow}>
                  {result.tags.map((t, i) => {
                    const ts = TAG_STYLES[t.type] || TAG_STYLES.neutral
                    return (
                      <span key={i} style={{ ...s.tag, background: ts.bg, color: ts.color, border: `1px solid ${ts.bd}` }}>
                        {t.label}
                      </span>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ── AI Recommendation ── */}
            <div style={s.aiBlock}>
              <div style={s.aiHeader}>
                <span style={s.aiStar}>✦</span>
                <span style={s.aiLabel}>REKOMENDASI AI</span>
              </div>
              <p style={s.aiText}>{result.recommendation}</p>
            </div>

            {/* ── Footer ── */}
            <div style={s.footer}>
              <p style={s.disclaimer}>
                <strong>Disclaimer:</strong> Laporan ini dihasilkan secara otomatis oleh ESB AtlasAI berdasarkan data historis outlet ESB
                dan sumber publik. Estimasi profit bersifat indikatif dan tidak menjamin hasil aktual.
                Data kompetitor dapat memiliki lag hingga 30 hari. Keputusan bisnis sepenuhnya menjadi tanggung jawab pengguna.
              </p>
              <div style={s.footerRow}>
                <span style={s.footerBrand}>ESB AtlasAI · Location Intelligence for FnB</span>
                <span style={s.footerPage}>Halaman 1 / 1</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function ScoreRingLarge({ score, color }) {
  const r = 30, circ = 2 * Math.PI * r, dash = (score / 100) * circ
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" style={{ display: 'block' }}>
      <circle cx="38" cy="38" r={r} fill="none" stroke="#F1F5F9" strokeWidth="6"/>
      <circle cx="38" cy="38" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 38 38)"
      />
      <text x="38" y="43" textAnchor="middle" fontSize="19" fontWeight="800" fill="#111827">{score}</text>
    </svg>
  )
}

const s = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 10000,
    background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20,
  },
  modal: {
    width: '100%', maxWidth: 680,
    maxHeight: '96vh', display: 'flex', flexDirection: 'column',
    borderRadius: 12, overflow: 'hidden',
    border: '1px solid var(--sb-border)',
    boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
  },

  chrome: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px', flexShrink: 0,
    background: 'var(--sb-surface)',
    borderBottom: '1px solid var(--sb-border)',
  },
  chromeLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  chromeIcon: {
    width: 30, height: 30, borderRadius: 7,
    background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  chromeTitle: { fontSize: 13, fontWeight: 700, color: 'var(--txt-1)', marginBottom: 1 },
  chromeSub: { fontSize: 10, color: 'var(--txt-3)' },
  chromeRight: { display: 'flex', alignItems: 'center', gap: 8 },
  dlBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', border: 'none', borderRadius: 7,
    background: 'var(--accent)',
    boxShadow: '0 3px 10px rgba(255,107,43,0.35)',
    color: '#fff', fontSize: 12, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'inherit',
  },
  dlBtnLoading: { background: 'rgba(255,107,43,0.5)', cursor: 'not-allowed' },
  closeBtn: {
    width: 30, height: 30, borderRadius: 7,
    border: '1px solid var(--sb-border)', background: 'var(--sb-card)',
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  spinner: {
    display: 'inline-block', width: 11, height: 11, marginRight: 4,
    border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff',
    borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },

  viewerMobile: { padding: '12px 8px 20px' },
  viewer: {
    flex: 1, overflowY: 'auto', background: '#0D1117',
    padding: '20px 20px 28px',
    display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
  },

  page: {
    width: 595, background: '#fff',
    fontFamily: 'Inter, -apple-system, sans-serif',
    flexShrink: 0, alignSelf: 'flex-start',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },

  banner: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 28px',
    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
  },
  bannerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  bannerLogo: {
    width: 30, height: 30, borderRadius: 7, flexShrink: 0,
    background: 'linear-gradient(135deg,#FF6B2B,#FF9A5C)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  bannerBrand: { fontSize: 16, fontWeight: 800, color: '#F8FAFC', letterSpacing: '-0.3px' },
  bannerSub: { fontSize: 9, color: '#64748B', marginTop: 1 },
  bannerRight: { textAlign: 'right' },
  bannerDocType: { fontSize: 9, fontWeight: 800, letterSpacing: '1px', color: '#FF6B2B' },
  bannerDate: { fontSize: 10, color: '#94A3B8', marginTop: 2 },

  locStrip: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 28px',
    background: '#F8FAFC', borderBottom: '1px solid #F1F5F9',
  },
  locBadge: {
    display: 'flex', alignItems: 'center', gap: 5,
    padding: '4px 10px', borderRadius: 6,
    background: '#FFF7F3', border: '1px solid #FFD4B8',
  },
  locIcon: { fontSize: 13 },
  locCat: { fontSize: 11, fontWeight: 700, color: '#FF6B2B' },
  coordStrip: {
    display: 'flex', alignItems: 'center', gap: 4,
    fontSize: 10, color: '#94A3B8', fontWeight: 500,
  },

  scoreBlock: {
    display: 'flex', alignItems: 'stretch',
    padding: '20px 28px', gap: 20, borderBottom: '1px solid #F1F5F9',
  },
  scoreHero: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 6, flexShrink: 0, width: 90,
  },
  gradePill: {
    fontSize: 9, fontWeight: 800, padding: '3px 8px',
    borderRadius: 5, textAlign: 'center', letterSpacing: '0.2px',
  },
  scoreCaption: { fontSize: 9, color: '#9CA3AF', textAlign: 'center' },
  scoreVDivider: { width: 1, background: '#F1F5F9', flexShrink: 0 },
  dimsWrap: { flex: 1, display: 'flex', flexDirection: 'column', gap: 7, justifyContent: 'center' },
  dimsTitle: {
    fontSize: 8, fontWeight: 800, letterSpacing: '0.7px',
    color: '#9CA3AF', marginBottom: 4,
  },
  dimRow: { display: 'flex', alignItems: 'center', gap: 8 },
  dimLabel: { fontSize: 10, color: '#374151', width: 130, flexShrink: 0 },
  dimBarWrap: { flex: 1, display: 'flex', alignItems: 'center', gap: 6 },
  dimBarBg: { flex: 1, height: 4, background: '#F1F5F9', borderRadius: 2, overflow: 'hidden' },
  dimBarFill: { height: '100%', borderRadius: 2 },
  dimScore: { fontSize: 10, fontWeight: 800, width: 22, textAlign: 'right', flexShrink: 0 },

  metricsRow: {
    display: 'flex', gap: 0,
    borderBottom: '1px solid #F1F5F9',
  },
  profitCard: {
    flex: 1, padding: '16px 20px 16px 28px',
    borderRight: '1px solid #F1F5F9',
  },
  tagsCard: { flex: 1.4, padding: '16px 28px 16px 20px' },
  metricLabel: {
    fontSize: 8, fontWeight: 800, letterSpacing: '0.7px',
    color: '#9CA3AF', marginBottom: 8,
  },
  profitRange: { fontSize: 18, fontWeight: 800, color: '#FF6B2B', marginBottom: 4, lineHeight: 1 },
  profitSep: { color: '#CBD5E1', fontWeight: 400, fontSize: 14 },
  profitNote: { fontSize: 9, color: '#9CA3AF' },
  tagsRow: { display: 'flex', flexWrap: 'wrap', gap: 4 },
  tag: { fontSize: 9, fontWeight: 600, padding: '3px 7px', borderRadius: 4 },

  aiBlock: {
    margin: '0 28px', padding: '12px 14px',
    background: '#FAFAFF', border: '1px solid #EDE9FE',
    borderRadius: 6, marginTop: 14, marginBottom: 14,
  },
  aiHeader: { display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 },
  aiStar: { fontSize: 9, color: '#7C3AED' },
  aiLabel: { fontSize: 8, fontWeight: 800, letterSpacing: '0.7px', color: '#7C3AED' },
  aiText: { fontSize: 10, color: '#374151', lineHeight: 1.65, margin: 0 },

  footer: {
    padding: '10px 28px 14px',
    borderTop: '1px solid #F1F5F9',
    background: '#FAFAFA',
  },
  disclaimer: { fontSize: 8, color: '#9CA3AF', lineHeight: 1.6, marginBottom: 6 },
  footerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  footerBrand: { fontSize: 8, fontWeight: 700, color: '#CBD5E1', letterSpacing: '0.3px' },
  footerPage: { fontSize: 8, color: '#CBD5E1' },
}
