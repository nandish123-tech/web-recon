import { AlertTriangle, AlertCircle } from 'lucide-react'

export function ErrorCard({ title, message, suggestion }) {
  return (
    <div style={{
      background: 'rgba(248,81,73,0.05)',
      border: '1px solid rgba(248,81,73,0.2)',
      borderRadius: 12,
      padding: '20px 24px',
      display: 'flex',
      gap: 16,
    }}>
      <AlertTriangle size={20} style={{ color: '#f85149', flexShrink: 0, marginTop: 2 }} />
      <div>
        {title && <div style={{ color: '#f85149', fontWeight: 600, marginBottom: 4 }}>{title}</div>}
        <div style={{ color: '#c9d1d9', fontSize: 14 }}>{message}</div>
        {suggestion && <div style={{ color: '#6e7681', fontSize: 13, marginTop: 8 }}>{suggestion}</div>}
      </div>
    </div>
  )
}

export function ModuleErrorCard({ module: mod, message, timestamp }) {
  return (
    <div style={{
      background: 'rgba(248,81,73,0.04)',
      border: '1px solid rgba(248,81,73,0.15)',
      borderRadius: 8,
      padding: '12px 16px',
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
    }}>
      <AlertCircle size={14} style={{ color: '#f85149', flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
          <span style={{
            background: 'rgba(248,81,73,0.12)', color: '#f85149',
            border: '1px solid rgba(248,81,73,0.2)', borderRadius: 4,
            fontSize: 10, fontWeight: 700, padding: '1px 6px', textTransform: 'uppercase',
          }}>{mod}</span>
        </div>
        <div style={{ fontSize: 13, color: '#c9d1d9' }}>{message}</div>
        {timestamp && <div style={{ fontSize: 11, color: '#6e7681', marginTop: 4 }}>{new Date(timestamp).toLocaleTimeString()}</div>}
      </div>
    </div>
  )
}
