'use client'

export default function Error({ error, reset }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', gap: 12,
      background: '#0A0F1A', color: '#F1F5F9', fontFamily: 'Inter, sans-serif',
      padding: 24,
    }}>
      <p style={{ fontSize: 14, color: '#94A3B8' }}>Terjadi kesalahan.</p>
      {error?.message && (
        <pre style={{
          fontSize: 11, color: '#EF4444', background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8,
          padding: '10px 14px', maxWidth: 600, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}>
          {error.message}
          {error.stack ? '\n\n' + error.stack.split('\n').slice(1, 4).join('\n') : ''}
        </pre>
      )}
      <button
        onClick={reset}
        style={{
          padding: '8px 16px', borderRadius: 8, border: 'none',
          background: '#2563EB', color: '#fff', cursor: 'pointer',
          fontSize: 13, fontWeight: 600,
        }}
      >
        Coba lagi
      </button>
    </div>
  )
}
