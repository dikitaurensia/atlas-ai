'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import styles from '../auth.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login gagal'); return }
      router.push('/analisis')
    } catch {
      setError('Gagal terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <LeftPanel />

      <div className={styles.right}>
        <div className={styles.formBox}>
          <h1 className={styles.formTitle}>Masuk ke AtlasAI</h1>
          <p className={styles.formSub}>Selamat datang kembali. Lanjutkan analisis lokasimu.</p>

          {error && <div className={styles.formError}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className={styles.fields}>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input
                  className={styles.input}
                  type="email"
                  placeholder="nama@email.com"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="email"
                  required
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Password</label>
                <input
                  className={styles.input}
                  type="password"
                  placeholder="Masukkan password"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="current-password"
                  required
                />
                <div className={styles.forgotRow}>
                  <a href="#" className={styles.forgotLink}>Lupa password?</a>
                </div>
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? <><span className={styles.spinner} />Masuk…</> : 'Masuk'}
            </button>
          </form>

          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>atau masuk dengan</span>
            <div className={styles.dividerLine} />
          </div>

          <button type="button" className={styles.socialBtn}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Masuk dengan Google
          </button>

          <p className={styles.switchText}>
            Belum punya akun?{' '}
            <Link href="/register" className={styles.switchLink}>Daftar sekarang</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const DIMS = [
  { label: 'Traffic',    val: 88, color: '#FF6B2B' },
  { label: 'Persaingan', val: 72, color: '#F59E0B' },
  { label: 'Akses',      val: 91, color: '#10B981' },
]
const STATS = [
  { val: '82',  label: 'Skor' },
  { val: '4',   label: 'Kompetitor' },
  { val: '<1s', label: 'Analisis' },
]
const PINS = [[102, 52, 1], [165, 58, 2], [114, 96, 3], [153, 90, 4]]

function LeftPanel() {
  const scoreCirc = 2 * Math.PI * 14

  return (
    <div className={styles.left}>
      <Link href="/" className={styles.leftLogo}>
        <div className={styles.leftLogoMark}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 1C5.24 1 3 3.24 3 6c0 4 5 9 5 9s5-5 5-9c0-2.76-2.24-5-5-5z" fill="white"/>
            <circle cx="8" cy="6" r="2" fill="#FF6B2B"/>
          </svg>
        </div>
        <span className={styles.leftLogoText}>
          Atlas<span style={{ color: '#FF6B2B' }}>AI</span>
        </span>
      </Link>

      <div className={styles.leftBody}>
        {/* ── 3D scene ── */}
        <div className={styles.scene}>
          <div className={styles.sceneGroup}>

            {/* Map card — base layer (Z 0) */}
            <div className={styles.mapCard}>
              <div className={styles.mapCardHeader}>
                <div className={styles.mapCardDot} style={{ background: '#FF5F57' }} />
                <div className={styles.mapCardDot} style={{ background: '#FEBC2E' }} />
                <div className={styles.mapCardDot} style={{ background: '#28C840' }} />
                <span className={styles.mapCardTitle}>AtlasAI · Kemang, Jakarta Selatan</span>
              </div>
              <svg width="262" height="140" viewBox="0 0 262 140">
                <defs>
                  <radialGradient id="lv" cx="50%" cy="50%" r="50%">
                    <stop offset="55%" stopColor="transparent"/>
                    <stop offset="100%" stopColor="rgba(13,20,38,0.75)"/>
                  </radialGradient>
                </defs>
                <rect width="262" height="140" fill="#131c2e"/>
                {/* Grid */}
                {[28,56,84,112].map(y => (
                  <line key={y} x1="0" y1={y} x2="262" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>
                ))}
                {[44,88,132,176,220].map(x => (
                  <line key={x} x1={x} y1="0" x2={x} y2="140" stroke="rgba(255,255,255,0.025)" strokeWidth="1"/>
                ))}
                {/* Roads */}
                <path d="M0 68 Q65 60 131 68 Q197 76 262 63" stroke="rgba(255,255,255,0.08)" strokeWidth="3" fill="none"/>
                <path d="M0 98 Q86 91 140 96 Q190 101 262 92" stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none"/>
                <path d="M62 0 Q60 35 63 70 Q66 105 60 140" stroke="rgba(255,255,255,0.07)" strokeWidth="2.5" fill="none"/>
                <path d="M161 0 Q158 44 162 78 Q165 112 159 140" stroke="rgba(255,255,255,0.05)" strokeWidth="2" fill="none"/>
                <path d="M100 0 Q97 28 99 68 Q101 108 97 140" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" fill="none"/>
                {/* Blocks */}
                <rect x="65" y="30" width="30" height="18" rx="2" fill="rgba(255,255,255,0.02)"/>
                <rect x="100" y="30" width="22" height="18" rx="2" fill="rgba(255,255,255,0.025)"/>
                <rect x="127" y="30" width="28" height="18" rx="2" fill="rgba(255,255,255,0.015)"/>
                <rect x="65" y="76" width="30" height="16" rx="2" fill="rgba(255,255,255,0.02)"/>
                <rect x="127" y="74" width="26" height="16" rx="2" fill="rgba(255,255,255,0.018)"/>
                {/* Radius rings */}
                <circle cx="131" cy="70" r="48" stroke="rgba(255,107,43,0.28)" strokeWidth="1.5" fill="rgba(255,107,43,0.04)" strokeDasharray="7 4"/>
                <circle cx="131" cy="70" r="22" stroke="rgba(255,107,43,0.1)" strokeWidth="1" fill="none"/>
                {/* Center pin */}
                <circle cx="131" cy="70" r="9" fill="#FF6B2B" opacity="0.15"/>
                <circle cx="131" cy="70" r="5.5" fill="#FF6B2B"/>
                <circle cx="131" cy="70" r="2.5" fill="rgba(255,255,255,0.9)"/>
                {/* Competitor pins */}
                {PINS.map(([x, y, n]) => (
                  <g key={n}>
                    <circle cx={x} cy={y} r="7" fill="rgba(15,23,42,0.92)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"/>
                    <text x={x} y={y+3.5} textAnchor="middle" fontSize="6.5" fontWeight="800" fill="#CBD5E1">{n}</text>
                  </g>
                ))}
                <rect width="262" height="140" fill="url(#lv)"/>
              </svg>
            </div>

            {/* Score card — Z 54 */}
            <div className={styles.scoreCard3d}>
              <div className={styles.scoreCard3dLabel}>Hasil Analisis</div>
              <div className={styles.scoreCard3dRow}>
                <svg width="40" height="40" viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
                  <circle cx="20" cy="20" r="14" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3.5"/>
                  <circle cx="20" cy="20" r="14" fill="none" stroke="#10B981" strokeWidth="3.5"
                    strokeDasharray={`${(82/100)*scoreCirc} ${scoreCirc}`}
                    strokeLinecap="round" transform="rotate(-90 20 20)"
                  />
                  <text x="20" y="24" textAnchor="middle" fontSize="9" fontWeight="800" fill="#F1F5F9">82</text>
                </svg>
                <div className={styles.scoreCard3dInfo}>
                  <span className={styles.scoreCard3dGrade}>Sangat Potensial</span>
                  <span className={styles.scoreCard3dLoc}>Kemang · Ayam Goreng</span>
                </div>
              </div>
              <div className={styles.scoreCard3dDims}>
                {DIMS.map(({ label, val, color }) => (
                  <div key={label} className={styles.scoreCard3dDimRow}>
                    <span className={styles.scoreCard3dDimLabel}>{label}</span>
                    <div className={styles.scoreCard3dDimBar}>
                      <div className={styles.scoreCard3dDimFill} style={{ width: `${val}%`, background: color }}/>
                    </div>
                    <span className={styles.scoreCard3dDimVal} style={{ color }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats row — Z 30 */}
            <div className={styles.statsCard3d}>
              {STATS.map(({ val, label }) => (
                <div key={label} className={styles.statMini}>
                  <span className={styles.statMiniVal}>{val}</span>
                  <span className={styles.statMiniLabel}>{label}</span>
                </div>
              ))}
            </div>

            {/* Floating badges */}
            <div className={`${styles.badge3d} ${styles.badge3dOrange}`}>📍 500m radius</div>
            <div className={`${styles.badge3d} ${styles.badge3dBlue}`}>✦ AI Powered</div>
            <div className={`${styles.badge3d} ${styles.badge3dGreen}`}>✓ ESB Data</div>

          </div>
        </div>

        <p className={styles.leftDescSmall}>
          Analisis potensi lokasi FnB berbasis data real ESB —<br/>
          skor, kompetitor &amp; estimasi profit dalam hitungan detik.
        </p>
      </div>

      <div className={styles.leftFooter}>© 2026 ESB · AtlasAI</div>
    </div>
  )
}
