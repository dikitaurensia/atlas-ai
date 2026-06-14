'use client'

import { useState, useEffect } from 'react'

const STEPS = [
  {
    label: 'Overpass API (OSM)',
    desc:  'Memindai traffic pejalan kaki & aksesibilitas',
    color: '#06B6D4',
  },
  {
    label: 'ESB Database',
    desc:  'Mengambil data kompetitor & profit benchmark',
    color: '#3B82F6',
  },
  {
    label: 'Demographics',
    desc:  'Membaca kepadatan penduduk & daya beli area',
    color: '#8B5CF6',
  },
  {
    label: 'Analisis AI',
    desc:  'Menghitung skor kelayakan & rekomendasi',
    color: '#10B981',
  },
]

// ms at which each step becomes "done" and the next becomes "active"
const STEP_DELAYS = [1100, 2200, 3300]

export default function LoadingSteps({ category }) {
  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    setCurrentStep(0)
    const timers = STEP_DELAYS.map((delay, i) =>
      setTimeout(() => setCurrentStep(i + 1), delay)
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  const progress = Math.round(((currentStep + 0.5) / STEPS.length) * 100)

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.spinner} />
        <div style={s.headerText}>
          <p style={s.title}>Menganalisis lokasi…</p>
          <p style={s.subtitle}>
            {category ? `${category} · data geospasial` : 'Memproses data geospasial'}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={s.track}>
        <div style={{ ...s.fill, width: `${progress}%`, background: STEPS[Math.min(currentStep, STEPS.length - 1)].color }} />
      </div>
      <p style={s.progressLabel}>{progress}%</p>

      {/* Steps */}
      <div style={s.stepList}>
        {STEPS.map((step, i) => {
          const done    = i < currentStep
          const active  = i === currentStep
          const pending = i > currentStep
          return (
            <div
              key={step.label}
              style={{ ...s.stepRow, opacity: pending ? 0.3 : 1, transition: 'opacity 0.4s ease' }}
            >
              {/* Icon */}
              <div style={{
                ...s.iconWrap,
                background: done ? `${step.color}22` : active ? `${step.color}18` : 'var(--sb-card)',
                border: `1px solid ${done || active ? step.color + '44' : 'var(--sb-border)'}`,
              }}>
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"
                    stroke={step.color} strokeWidth="3" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : active ? (
                  <span style={{ ...s.stepSpinner, borderTopColor: step.color }} />
                ) : (
                  <span style={{ ...s.stepDot, background: 'var(--sb-border)' }} />
                )}
              </div>

              {/* Text */}
              <div style={s.stepText}>
                <span style={{
                  ...s.stepLabel,
                  color: done ? 'var(--txt-3)' : active ? 'var(--txt-1)' : 'var(--txt-3)',
                  fontWeight: active ? 700 : 500,
                }}>
                  {step.label}
                </span>
                <span style={{ ...s.stepDesc, color: done ? step.color + 'cc' : 'var(--txt-3)' }}>
                  {done ? 'Selesai' : active ? step.desc : '—'}
                </span>
              </div>

              {/* Done badge */}
              {done && (
                <span style={{ ...s.doneBadge, color: step.color, background: step.color + '15', border: `1px solid ${step.color}33` }}>
                  ✓
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const s = {
  wrap: {
    display: 'flex', flexDirection: 'column',
    gap: 12, padding: '20px 16px',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 12,
  },
  spinner: {
    flexShrink: 0,
    width: 32, height: 32, borderRadius: '50%',
    border: '2.5px solid rgba(6,182,212,0.15)',
    borderTopColor: 'var(--accent)',
    animation: 'spin 0.75s linear infinite',
  },
  headerText: { display: 'flex', flexDirection: 'column', gap: 2 },
  title: { fontSize: 13, fontWeight: 700, color: 'var(--txt-1)', margin: 0 },
  subtitle: { fontSize: 10, color: 'var(--txt-3)', margin: 0 },

  track: {
    height: 3, borderRadius: 4,
    background: 'var(--sb-border)', overflow: 'hidden',
  },
  fill: {
    height: '100%', borderRadius: 4,
    transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1), background 0.4s ease',
  },
  progressLabel: {
    fontSize: 9, color: 'var(--txt-3)', textAlign: 'right',
    margin: '-6px 0 0', fontVariantNumeric: 'tabular-nums',
  },

  stepList: { display: 'flex', flexDirection: 'column', gap: 6 },
  stepRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 10px', borderRadius: 8,
    background: 'var(--sb-card)',
    border: '1px solid var(--sb-border)',
  },
  iconWrap: {
    flexShrink: 0,
    width: 24, height: 24, borderRadius: 6,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.3s ease',
  },
  stepSpinner: {
    display: 'inline-block',
    width: 10, height: 10, borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.1)',
    animation: 'spin 0.65s linear infinite',
  },
  stepDot: {
    display: 'inline-block',
    width: 6, height: 6, borderRadius: '50%',
  },
  stepText: { flex: 1, display: 'flex', flexDirection: 'column', gap: 1 },
  stepLabel: { fontSize: 11, transition: 'all 0.3s ease' },
  stepDesc: { fontSize: 9.5, transition: 'color 0.3s ease' },
  doneBadge: {
    flexShrink: 0,
    fontSize: 9, fontWeight: 700,
    padding: '2px 6px', borderRadius: 4,
  },
}
