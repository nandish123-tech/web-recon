import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Shield, Clock, CheckCircle, XCircle, Loader, Circle, AlertTriangle, ArrowRight } from 'lucide-react'
import { useScanPolling } from '../hooks/useScanPolling'

const MODULE_META = {
  whois:     { label: 'WHOIS Lookup',        icon: '🔍' },
  dns:       { label: 'DNS Enumeration',      icon: '🌐' },
  ip:        { label: 'IP & Geolocation',     icon: '📍' },
  http:      { label: 'HTTP Reconnaissance',  icon: '🔗' },
  ssl:       { label: 'SSL/TLS Analysis',     icon: '🔒' },
  web_files: { label: 'Robots & Sitemap',     icon: '📄' },
  security:  { label: 'Security Headers',     icon: '🛡️' },
}

const MODULE_ORDER = ['whois', 'dns', 'ip', 'http', 'ssl', 'web_files', 'security']

function ModuleIcon({ status }) {
  if (status === 'completed') return <CheckCircle size={16} style={{ color: '#3fb950' }} />
  if (status === 'running') return <Loader size={16} style={{ color: '#d29922', animation: 'spin 1s linear infinite' }} />
  if (status === 'failed') return <XCircle size={16} style={{ color: '#f85149' }} />
  if (status === 'skipped') return <Circle size={16} style={{ color: '#6e7681' }} />
  return <Circle size={16} style={{ color: '#30363d' }} />
}

function ModuleCard({ name, status }) {
  const meta = MODULE_META[name] || { label: name, icon: '⚙️' }
  const isRunning = status === 'running'
  const isCompleted = status === 'completed'
  const isFailed = status === 'failed'

  const borderColor = isRunning
    ? 'rgba(210,153,34,0.4)'
    : isCompleted
    ? 'rgba(63,185,80,0.2)'
    : isFailed
    ? 'rgba(248,81,73,0.2)'
    : '#21262d'

  const bgColor = isRunning
    ? 'rgba(210,153,34,0.04)'
    : isCompleted
    ? 'rgba(63,185,80,0.04)'
    : 'rgba(22,27,34,0.6)'

  return (
    <div style={{
      background: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: 10,
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      transition: 'all 0.3s',
      boxShadow: isRunning ? '0 0 12px rgba(210,153,34,0.1)' : undefined,
    }}>
      <ModuleIcon status={status} />
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#c9d1d9' }}>{meta.label}</div>
        <div style={{
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginTop: 2,
          color: isRunning ? '#d29922' : isCompleted ? '#3fb950' : isFailed ? '#f85149' : '#6e7681',
        }}>
          {status === 'pending' ? 'Waiting' : status === 'completed' ? 'Complete' : status === 'skipped' ? 'Skipped' : status}
        </div>
      </div>
    </div>
  )
}

export default function ScanProgress() {
  const { scanId } = useParams()
  const navigate = useNavigate()
  const { scan, error } = useScanPolling(scanId)

  // Auto-navigate to results when done
  useEffect(() => {
    if (!scan) return
    if (['completed', 'completed_with_errors'].includes(scan.status)) {
      const timer = setTimeout(() => navigate(`/scan/${scanId}/results`), 1200)
      return () => clearTimeout(timer)
    }
    if (scan.status === 'failed') {
      const timer = setTimeout(() => navigate(`/scan/${scanId}/results`), 2000)
      return () => clearTimeout(timer)
    }
  }, [scan?.status, scanId, navigate])

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <AlertTriangle size={40} style={{ color: '#f85149', margin: '0 auto 16px', display: 'block' }} />
        <div style={{ color: '#f85149', fontSize: 16, fontWeight: 600 }}>Connection Error</div>
        <div style={{ color: '#6e7681', marginTop: 8 }}>{error}</div>
      </div>
    )
  }

  if (!scan) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Loader size={32} style={{ color: '#58a6ff', margin: '0 auto 16px', display: 'block', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: '#6e7681' }}>Connecting to scan engine...</div>
      </div>
    )
  }

  const progress = scan.progress || 0
  const modules = scan.modules || {}
  const isTerminal = ['completed', 'completed_with_errors', 'failed'].includes(scan.status)

  const currentModuleMeta = scan.current_module ? MODULE_META[scan.current_module] : null

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      {/* Status header card */}
      <div style={{
        background: 'rgba(22,27,34,0.9)',
        border: '1px solid #21262d',
        borderRadius: 16,
        padding: '32px 36px',
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: 'radial-gradient(ellipse at top right, rgba(88,166,255,0.05) 0%, transparent 60%)',
      }}>
        {/* Top label */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: scan.status === 'completed' ? 'rgba(63,185,80,0.1)' : 'rgba(210,153,34,0.1)',
          border: `1px solid ${scan.status === 'completed' ? 'rgba(63,185,80,0.3)' : 'rgba(210,153,34,0.3)'}`,
          borderRadius: 9999, padding: '4px 14px', fontSize: 11,
          fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: scan.status === 'completed' ? '#3fb950' : '#d29922',
          marginBottom: 20,
        }}>
          {isTerminal ? (
            <><CheckCircle size={11} /> SCAN COMPLETE</>
          ) : (
            <><Loader size={11} style={{ animation: 'spin 1s linear infinite' }} /> RECONNAISSANCE IN PROGRESS</>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: '#c9d1d9', marginBottom: 6 }}>
              {scan.target}
            </div>
            <div style={{ display: 'flex', gap: 16, color: '#6e7681', fontSize: 13 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Shield size={12} /> {scanId?.slice(0, 8)}
              </span>
              {scan.created_at && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Clock size={12} /> {new Date(scan.created_at).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 36, fontWeight: 700, color: '#58a6ff', fontFamily: 'JetBrains Mono, monospace' }}>
              {progress}%
            </div>
            {scan.duration_seconds && (
              <div style={{ fontSize: 12, color: '#6e7681' }}>{scan.duration_seconds.toFixed(1)}s elapsed</div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 24 }}>
          <div style={{ background: '#1c2128', borderRadius: 9999, height: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progress}%`,
              background: isTerminal
                ? 'linear-gradient(90deg, #58a6ff, #3fb950)'
                : 'linear-gradient(90deg, #58a6ff, #d29922)',
              borderRadius: 9999,
              transition: 'width 0.5s ease',
              position: 'relative',
              overflow: 'hidden',
            }}>
              {!isTerminal && (
                <div style={{
                  position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation: 'shimmer 1.5s infinite',
                }} />
              )}
            </div>
          </div>
          {currentModuleMeta && !isTerminal && (
            <div style={{ marginTop: 10, fontSize: 13, color: '#6e7681' }}>
              Currently analyzing: <span style={{ color: '#d29922', fontWeight: 600 }}>{currentModuleMeta.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Module cards grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10, marginBottom: 24 }}>
        {MODULE_ORDER.map((mod) => (
          <ModuleCard key={mod} name={mod} status={modules[mod] || 'pending'} />
        ))}
      </div>

      {/* Errors */}
      {scan.errors && scan.errors.length > 0 && (
        <div style={{ background: 'rgba(248,81,73,0.04)', border: '1px solid rgba(248,81,73,0.15)', borderRadius: 12, padding: '16px 20px', marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', color: '#f85149', marginBottom: 12, textTransform: 'uppercase' }}>
            Module Errors ({scan.errors.length})
          </div>
          {scan.errors.map((err, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: i < scan.errors.length - 1 ? '1px solid rgba(33,38,45,0.5)' : 'none' }}>
              <span style={{ background: 'rgba(248,81,73,0.1)', color: '#f85149', border: '1px solid rgba(248,81,73,0.2)', borderRadius: 4, fontSize: 10, fontWeight: 700, padding: '1px 6px', textTransform: 'uppercase', flexShrink: 0 }}>
                {err.module}
              </span>
              <span style={{ fontSize: 13, color: '#8b949e' }}>{err.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Navigate button */}
      {isTerminal && (
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate(`/scan/${scanId}/results`)}
            style={{
              background: 'linear-gradient(135deg, #58a6ff, #4191e8)',
              color: '#0a0e14', fontWeight: 700, fontSize: 15,
              border: 'none', borderRadius: 10, padding: '12px 28px',
              cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
              boxShadow: '0 0 20px rgba(88,166,255,0.3)',
            }}
          >
            View Results <ArrowRight size={16} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { to { left: 100%; } }
      `}</style>
    </div>
  )
}
