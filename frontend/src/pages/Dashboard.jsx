import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Shield, Search, Globe, Clock, CheckCircle, AlertTriangle, XCircle, ChevronRight, Zap, Eye, Lock } from 'lucide-react'
import { scansApi } from '../services/api'

const FEATURES = [
  { icon: Globe, title: 'DNS Enumeration', desc: 'A, AAAA, MX, NS, TXT, CNAME records' },
  { icon: Lock, title: 'SSL/TLS Analysis', desc: 'Certificate validity, expiry, SANs, issuer' },
  { icon: Eye, title: 'HTTP Reconnaissance', desc: 'Headers, redirects, response timing' },
  { icon: Shield, title: 'Security Headers', desc: 'CSP, HSTS, X-Frame-Options and more' },
  { icon: Search, title: 'WHOIS Lookup', desc: 'Registrar, creation date, nameservers' },
  { icon: Zap, title: 'Real-Time Progress', desc: 'Live module status as scan executes' },
]

function getStatusIcon(status) {
  if (status === 'completed') return <CheckCircle size={14} style={{color:'#3fb950'}} />
  if (status === 'completed_with_errors') return <AlertTriangle size={14} style={{color:'#d29922'}} />
  if (status === 'failed') return <XCircle size={14} style={{color:'#f85149'}} />
  return <Clock size={14} style={{color:'#6e7681'}} />
}

function getStatusText(status) {
  const map = {
    completed: 'Complete',
    completed_with_errors: 'Partial',
    failed: 'Failed',
    running: 'Running',
    queued: 'Queued',
  }
  return map[status] || status
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [target, setTarget] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [recentScans, setRecentScans] = useState([])
  const [loadingScans, setLoadingScans] = useState(true)

  useState(() => {
    scansApi.list(10).then(setRecentScans).catch(() => {}).finally(() => setLoadingScans(false))
  }, [])

  const [mounted, setMounted] = useState(false)
  if (!mounted) {
    setMounted(true)
    scansApi.list(10).then(setRecentScans).catch(() => {}).finally(() => setLoadingScans(false))
  }

  const handleScan = async (e) => {
    e.preventDefault()
    const trimmed = target.trim()
    if (!trimmed) { setError('Please enter a target domain or URL'); return }
    setError('')
    setLoading(true)
    try {
      const scan = await scansApi.create(trimmed)
      navigate(`/scan/${scan.scan_id}/progress`)
    } catch (err) {
      setError(err.message || 'Failed to start scan')
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{
        textAlign: 'center',
        padding: '60px 0 48px',
        position: 'relative',
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(88,166,255,0.06) 0%, transparent 70%)',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(88,166,255,0.08)', border: '1px solid rgba(88,166,255,0.2)',
          borderRadius: 9999, padding: '4px 14px', fontSize: 11, fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase', color: '#58a6ff',
          marginBottom: 24,
        }}>
          <Shield size={11} />
          Authorized Use Only
        </div>

        <h1 style={{
          fontSize: 'clamp(28px, 5vw, 48px)',
          fontWeight: 700,
          margin: '0 0 12px',
          background: 'linear-gradient(135deg, #c9d1d9 0%, #58a6ff 60%, #3fb950 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          lineHeight: 1.15,
        }}>Web Reconnaissance &amp;<br/>Attack Surface Intelligence</h1>

        <p style={{ color: '#6e7681', fontSize: 16, maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.6 }}>
          Professional-grade reconnaissance for security researchers and penetration testers.
          Scan authorized targets and receive detailed technical intelligence.
        </p>

        <form onSubmit={handleScan} style={{ maxWidth: 540, margin: '0 auto' }}>
          <div style={{
            display: 'flex',
            gap: 10,
            background: 'rgba(22,27,34,0.8)',
            border: error ? '1px solid rgba(248,81,73,0.4)' : '1px solid rgba(88,166,255,0.2)',
            borderRadius: 12,
            padding: 6,
            backdropFilter: 'blur(8px)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxShadow: error ? '0 0 0 3px rgba(248,81,73,0.08)' : undefined,
          }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, padding: '0 10px' }}>
              <Globe size={16} style={{ color: '#6e7681', flexShrink: 0 }} />
              <input
                id="target-input"
                type="text"
                value={target}
                onChange={(e) => { setTarget(e.target.value); if (error) setError('') }}
                placeholder="example.com or https://example.com"
                disabled={loading}
                style={{
                  flex: 1, background: 'none', border: 'none', outline: 'none',
                  color: '#c9d1d9', fontSize: 15, fontFamily: 'JetBrains Mono, monospace',
                  padding: '8px 0',
                }}
              />
            </div>
            <button
              type="submit"
              id="start-recon-btn"
              disabled={loading}
              style={{
                background: loading ? 'rgba(88,166,255,0.5)' : 'linear-gradient(135deg, #58a6ff, #4191e8)',
                color: '#0a0e14', fontWeight: 700, fontSize: 14,
                border: 'none', borderRadius: 8, padding: '10px 20px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'all 0.2s', whiteSpace: 'nowrap',
                boxShadow: '0 0 20px rgba(88,166,255,0.25)',
              }}
            >
              {loading ? (
                <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>&#8635;</span> Starting...</>
              ) : (
                <><Search size={15} /> Start Recon</>
              )}
            </button>
          </div>
          {error && (
            <p style={{ color: '#f85149', fontSize: 12, marginTop: 8, textAlign: 'left', paddingLeft: 16 }}>{error}</p>
          )}
          <p style={{ color: '#6e7681', fontSize: 11, marginTop: 10 }}>
            Only scan domains you own or have explicit written authorization to test.
          </p>
        </form>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 12,
        marginBottom: 48,
      }}>
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} style={{
            background: 'rgba(22,27,34,0.6)',
            border: '1px solid #21262d',
            borderRadius: 10,
            padding: '16px 18px',
            transition: 'border-color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(88,166,255,0.2)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = '#21262d'}
          >
            <Icon size={16} style={{ color: '#58a6ff', marginBottom: 8 }} />
            <div style={{ fontWeight: 600, fontSize: 13, color: '#c9d1d9', marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 12, color: '#6e7681', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#c9d1d9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} style={{ color: '#6e7681' }} /> Recent Scans
          </h2>
        </div>

        {loadingScans ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6e7681' }}>Loading scans...</div>
        ) : recentScans.length === 0 ? (
          <div style={{
            background: 'rgba(22,27,34,0.6)', border: '1px dashed #21262d',
            borderRadius: 12, padding: '40px', textAlign: 'center',
          }}>
            <Shield size={32} style={{ color: '#21262d', margin: '0 auto 12px', display: 'block' }} />
            <div style={{ color: '#6e7681', fontSize: 14 }}>No scans yet. Enter a domain above to start your first reconnaissance scan.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentScans.map((scan) => (
              <div
                key={scan.scan_id}
                style={{
                  background: 'rgba(22,27,34,0.8)', border: '1px solid #21262d',
                  borderRadius: 10, padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: 16,
                  transition: 'border-color 0.15s, background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(88,166,255,0.2)'; e.currentTarget.style.background = 'rgba(22,27,34,0.95)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#21262d'; e.currentTarget.style.background = 'rgba(22,27,34,0.8)' }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 14, color: '#c9d1d9', marginBottom: 3 }}>
                    {scan.target}
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: '#6e7681' }}>{new Date(scan.created_at).toLocaleString()}</span>
                    {scan.duration_seconds && (
                      <span style={{ fontSize: 12, color: '#6e7681' }}>{scan.duration_seconds.toFixed(1)}s</span>
                    )}
                    {scan.observation_count > 0 && (
                      <span style={{ fontSize: 12, color: '#6e7681' }}>{scan.observation_count} observations</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {getStatusIcon(scan.status)}
                    <span style={{ fontSize: 12, color: '#6e7681' }}>{getStatusText(scan.status)}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/scan/${scan.scan_id}/results`)}
                    style={{
                      background: 'rgba(88,166,255,0.08)', border: '1px solid rgba(88,166,255,0.2)',
                      color: '#58a6ff', borderRadius: 6, padding: '5px 12px',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(88,166,255,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(88,166,255,0.08)'}
                  >
                    View <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
