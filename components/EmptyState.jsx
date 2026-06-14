'use client'

const STEPS = [
  { n: 1, label: 'Pilih kategori bisnis' },
  { n: 2, label: 'Klik titik di peta' },
  { n: 3, label: 'Baca skor & insight' },
]

export default function EmptyState({ selectedCategory }) {
  const step = selectedCategory ? 2 : 1

  return (
    <div style={s.wrap}>
      <GeoIllustration />

      <div style={s.text}>
        <h3 style={s.title}>Analisis Kelayakan Lokasi</h3>
        <p style={s.desc}>
          Pilih jenis bisnis dan tentukan lokasi di peta untuk mendapatkan skor kelayakan berbasis data real.
        </p>
      </div>

      <div style={s.steps}>
        {STEPS.map(st => {
          const done = st.n < step
          const active = st.n === step
          return (
            <div key={st.n} style={{ ...s.step, ...(active ? s.stepActive : {}) }}>
              <div style={{ ...s.stepNum, ...(done ? s.stepDone : active ? s.stepCurrent : {}) }}>
                {done
                  ? <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                  : st.n
                }
              </div>
              <span style={{ ...s.stepLabel, ...(done ? s.stepLabelDone : active ? s.stepLabelActive : {}) }}>
                {st.label}
              </span>
            </div>
          )
        })}
      </div>

    </div>
  )
}

function GeoIllustration() {
  return (
    <div style={{ position: 'relative', width: 100, height: 80, margin: '0 auto 16px' }}>
      <svg width="100" height="80" viewBox="0 0 100 80" fill="none">
        <rect x="8" y="12" width="84" height="56" rx="6" fill="#1E293B" stroke="#2D3D5A" strokeWidth="1.5"/>
        <line x1="8" y1="40" x2="92" y2="40" stroke="#2D3D5A" strokeWidth="1"/>
        <line x1="50" y1="12" x2="50" y2="68" stroke="#2D3D5A" strokeWidth="1"/>
        <path d="M20 30 Q35 25 50 30 Q65 35 80 28" stroke="#3D5070" strokeWidth="1.5" fill="none"/>
        <path d="M15 52 Q35 48 55 52 Q70 55 88 50" stroke="#3D5070" strokeWidth="1.5" fill="none"/>
        <circle cx="50" cy="40" r="14" stroke="rgba(6,182,212,0.2)" strokeWidth="1" fill="none"/>
        <circle cx="50" cy="40" r="9" stroke="rgba(6,182,212,0.35)" strokeWidth="1.5" fill="rgba(6,182,212,0.08)"/>
        <circle cx="50" cy="40" r="4" fill="var(--accent)"/>
        <circle cx="50" cy="40" r="2" fill="white"/>
        <circle cx="32" cy="30" r="3" fill="#243248" stroke="#3D5070" strokeWidth="1.5"/>
        <circle cx="68" cy="50" r="3" fill="#243248" stroke="#3D5070" strokeWidth="1.5"/>
        <circle cx="38" cy="55" r="2.5" fill="#243248" stroke="#3D5070" strokeWidth="1"/>
      </svg>
    </div>
  )
}

const s = {
  wrap: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '20px 18px', textAlign: 'center',
    animation: 'fade-in 0.3s ease',
  },
  text: { marginBottom: 20 },
  title: { fontSize: 13, fontWeight: 700, color: 'var(--txt-1)', marginBottom: 7 },
  desc: { fontSize: 11, color: 'var(--txt-2)', lineHeight: 1.6 },
  steps: { display: 'flex', flexDirection: 'column', gap: 6, width: '100%', marginBottom: 18 },
  step: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 12px', borderRadius: 8,
    background: 'var(--sb-surface)',
    border: '1px solid var(--sb-border)',
  },
  stepActive: {
    background: 'var(--accent-bg)', border: '1px solid var(--accent-bd)',
  },
  stepNum: {
    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 9, fontWeight: 800,
    background: '#F1F5F9', color: 'var(--txt-3)',
  },
  stepDone: { background: '#10B981', color: '#fff' },
  stepCurrent: { background: 'var(--accent)', color: '#fff' },
  stepLabel: { fontSize: 11, color: 'var(--txt-3)', fontWeight: 500, textAlign: 'left' },
  stepLabelDone: { color: 'var(--txt-2)' },
  stepLabelActive: { color: 'var(--txt-1)', fontWeight: 600 },
}
