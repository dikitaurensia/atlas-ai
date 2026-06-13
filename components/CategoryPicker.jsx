'use client'

const CATEGORIES = [
  { id: 'Ayam Goreng', icon: '🍗', label: 'Ayam Goreng' },
  { id: 'Kopi & Cafe', icon: '☕', label: 'Kopi & Cafe' },
  { id: 'Mie & Bakso', icon: '🍜', label: 'Mie & Bakso' },
  { id: 'Minuman',    icon: '🧋', label: 'Minuman' },
  { id: 'Burger',     icon: '🍔', label: 'Burger' },
  { id: 'Lainnya',    icon: '🍽️', label: 'Lainnya' },
]

export default function CategoryPicker({ selected, onChange }) {
  return (
    <div style={s.wrap}>
      <div style={s.header}>
        <span style={s.headerLabel}>KATEGORI BISNIS</span>
        {selected && (
          <button style={s.clearBtn} onClick={() => onChange(null)}>Reset</button>
        )}
      </div>
      <div style={s.grid}>
        {CATEGORIES.map(cat => {
          const active = selected === cat.id
          return (
            <button
              key={cat.id}
              onClick={() => onChange(active ? null : cat.id)}
              style={{ ...s.card, ...(active ? s.cardActive : {}) }}
            >
              <span style={s.icon}>{cat.icon}</span>
              <span style={{ ...s.label, ...(active ? s.labelActive : {}) }}>
                {cat.label}
              </span>
              {active && <div style={s.activeDot} />}
            </button>
          )
        })}
      </div>
    </div>
  )
}

const s = {
  wrap: { padding: '16px 14px 12px' },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  headerLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: '0.8px',
    color: 'var(--txt-3)', textTransform: 'uppercase',
  },
  clearBtn: {
    fontSize: 10, color: 'var(--accent)', background: 'none',
    border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500,
  },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 },
  card: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: 5, padding: '10px 4px 8px',
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
  icon: { fontSize: 18, lineHeight: 1 },
  label: {
    fontSize: 9.5, fontWeight: 500, color: 'var(--txt-2)',
    textAlign: 'center', lineHeight: 1.3,
  },
  labelActive: { color: 'var(--accent)', fontWeight: 600 },
  activeDot: {
    position: 'absolute', top: 4, right: 4,
    width: 5, height: 5, borderRadius: '50%',
    background: 'var(--accent)',
  },
}
