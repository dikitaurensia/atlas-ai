'use client'

const MIN = 200, MAX = 1500
const MARKS = [200, 500, 1000, 1500]

function toPct(v) { return ((v - MIN) / (MAX - MIN)) * 100 }

export default function RadiusSlider({ value, onChange }) {
  const pct = toPct(value)
  const label = value >= 1000 ? `${value / 1000} km` : `${value} m`

  return (
    <div style={s.wrap}>
      <div style={s.row}>
        <span style={s.sectionLabel}>RADIUS ANALISIS</span>
        <span style={s.valueBadge}>{label}</span>
      </div>
      <div style={s.sliderWrap}>
        <input
          type="range" min={MIN} max={MAX} step={50}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{ ...s.slider, '--pct': `${pct}%` }}
        />
        {/* Marks positioned at actual track percentages */}
        <div style={s.marksWrap}>
          {MARKS.map(m => {
            const mp = toPct(m)
            const active = Math.abs(value - m) < 26
            return (
              <span
                key={m}
                style={{
                  ...s.mark,
                  left: `${mp}%`,
                  transform: m === MIN ? 'none' : m === MAX ? 'translateX(-100%)' : 'translateX(-50%)',
                  ...(active ? s.markActive : {}),
                }}
              >
                {m >= 1000 ? `${m / 1000}k` : m}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
}

const s = {
  wrap: { padding: '0 14px 18px' },
  row: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: '0.8px',
    color: 'var(--txt-3)', textTransform: 'uppercase',
  },
  valueBadge: {
    fontSize: 11, fontWeight: 700, color: 'var(--accent)',
    background: 'var(--accent-bg)', padding: '2px 8px',
    borderRadius: 5, border: '1px solid var(--accent-bd)',
  },
  sliderWrap: { position: 'relative', paddingBottom: 16 },
  slider: {
    width: '100%', appearance: 'none', height: 3,
    borderRadius: 2, outline: 'none', cursor: 'pointer', display: 'block',
    background: `linear-gradient(to right, var(--accent) var(--pct, 0%), #2D3D5A var(--pct, 0%))`,
  },
  marksWrap: { position: 'relative', height: 14, marginTop: 4 },
  mark: {
    position: 'absolute', top: 0,
    fontSize: 9, color: 'var(--txt-3)', fontWeight: 500,
    whiteSpace: 'nowrap', lineHeight: 1,
  },
  markActive: { color: 'var(--accent)', fontWeight: 700 },
}
