'use client'

const SCALES = [
  {
    id: 'Kecil',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    label: 'Kecil',
    desc: '< Rp 100jt',
  },
  {
    id: 'Menengah',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="7" width="20" height="14" rx="2"/>
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
        <line x1="12" y1="12" x2="12" y2="16"/>
        <line x1="10" y1="14" x2="14" y2="14"/>
      </svg>
    ),
    label: 'Menengah',
    desc: '100–300jt',
  },
  {
    id: 'Besar',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 0 1-8 0"/>
      </svg>
    ),
    label: 'Besar',
    desc: '> Rp 300jt',
  },
]

export default function ScalePicker({ selected, onChange }) {
  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <span style={s.headerLabel}>SKALA BISNIS</span>
      </div>
      <div style={s.row}>
        {SCALES.map(sc => {
          const active = selected === sc.id
          return (
            <button
              key={sc.id}
              onClick={() => onChange(sc.id)}
              style={{ ...s.card, ...(active ? s.cardActive : {}) }}
            >
              <span style={{ ...s.icon, ...(active ? s.iconActive : {}) }}>{sc.icon}</span>
              <span style={{ ...s.label, ...(active ? s.labelActive : {}) }}>{sc.label}</span>
              <span style={s.desc}>{sc.desc}</span>
              {active && <div style={s.activeDot} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const s = {
  wrap: { padding: '12px 14px 10px' },
  header: { marginBottom: 8 },
  headerLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: '0.8px',
    color: 'var(--txt-3)', textTransform: 'uppercase',
  },
  row: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 },
  card: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 4, padding: '10px 4px 8px',
    border: '1px solid var(--sb-border)',
    borderRadius: 8, background: 'var(--sb-card)',
    cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit',
    position: 'relative', overflow: 'hidden',
  },
  cardActive: {
    border: '1px solid var(--accent-bd)',
    background: 'var(--accent-bg)',
    boxShadow: '0 0 0 1px var(--accent-bd) inset',
  },
  icon: { color: 'var(--txt-3)', display: 'flex', alignItems: 'center' },
  iconActive: { color: 'var(--accent)' },
  label: { fontSize: 10, fontWeight: 600, color: 'var(--txt-2)' },
  labelActive: { color: 'var(--accent)' },
  desc: { fontSize: 8.5, color: 'var(--txt-3)', textAlign: 'center' },
  activeDot: {
    position: 'absolute', top: 4, right: 4,
    width: 5, height: 5, borderRadius: '50%',
    background: 'var(--accent)',
  },
}
