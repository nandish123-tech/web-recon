import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { History as HistoryIcon, Trash2, ChevronRight, CheckCircle, AlertTriangle, XCircle, Clock, RefreshCw } from 'lucide-react'
import { scansApi } from '../services/api'

function StatusIcon({ status }) {
  if (status === 'completed') return <CheckCircle size={14} style={{color:'#3fb950'}} />
  if (status === 'completed_with_errors') return <AlertTriangle size={14} style={{color:'#d29922'}} />
  if (status === 'failed') return <XCircle size={14} style={{color:'#f85149'}} />
  return <Clock size={14} style={{color:'#58a6ff'}} />
}

export default function History() {
  const navigate = useNavigate()
  const [scans, setScans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)

  const loadScans = async () => {
    setLoading(true)
    try {
      const data = await scansApi.list(100)
      setScans(data)
    } catch (err) {
      setError('Failed to load scan history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadScans() }, [])

  const handleDelete = async (scanId) => {
    if (!confirm('Delete this scan and its results?')) return
    setDeleting(scanId)
    try {
      await scansApi.delete(scanId)
      setScans(scans.filter(s => s.scan_id !== scanId))
    } catch (err) {
      alert('Failed to delete scan')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#c9d1d9', display: 'flex', alignItems: 'center', gap: 10 }}>
            <HistoryIcon size={20} style={{color:'#58a6ff'}} /> Scan History
          </h1>
          <p style={{ color: '#6e7681', fontSize: 13, marginTop: 4 }}>{scans.length} total scans</p>
        </div>
        <button
          onClick={loadScans}
          style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid #21262d', color: '#6e7681', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#6e7681' }}>Loading history...</div>
      ) : error ? (
        <div style={{ color: '#f85149', textAlign: 'center', padding: 60 }}>{error}</div>
      ) : scans.length === 0 ? (
        <div style={{ background: 'rgba(22,27,34,0.6)', border: '1px dashed #21262d', borderRadius: 12, padding: 60, textAlign: 'center', color: '#6e7681' }}>
          No scans found. Start a scan from the dashboard.
        </div>
      ) : (
        <div style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid #21262d', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 100px 100px 140px', gap: 16, padding: '10px 20px', borderBottom: '1px solid #21262d', background: 'rgba(13,17,23,0.5)' }}>
            {['TARGET', 'DATE', 'STATUS', 'DURATION', 'ACTIONS'].map(h => (
              <div key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#6e7681', textTransform: 'uppercase' }}>{h}</div>
            ))}
          </div>
          {scans.map((scan) => (
            <div
              key={scan.scan_id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 160px 100px 100px 140px',
                gap: 16, padding: '14px 20px', borderBottom: '1px solid rgba(33,38,45,0.5)',
                alignItems: 'center', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(22,27,34,0.95)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#c9d1d9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{scan.target}</div>
              <div style={{ fontSize: 12, color: '#6e7681' }}>{new Date(scan.created_at).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <StatusIcon status={scan.status} />
                <span style={{ fontSize: 12, color: '#6e7681' }}>{scan.status === 'completed_with_errors' ? 'Partial' : scan.status.charAt(0).toUpperCase() + scan.status.slice(1)}</span>
              </div>
              <div style={{ fontSize: 12, color: '#6e7681', fontFamily: 'monospace' }}>{scan.duration_seconds ? `${scan.duration_seconds.toFixed(1)}s` : '&#8212;'}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => navigate(`/scan/${scan.scan_id}/results`)}
                  style={{ background: 'rgba(88,166,255,0.08)', border: '1px solid rgba(88,166,255,0.2)', color: '#58a6ff', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}
                >
                  View <ChevronRight size={11} />
                </button>
                <button
                  onClick={() => handleDelete(scan.scan_id)}
                  disabled={deleting === scan.scan_id}
                  style={{ background: 'rgba(248,81,73,0.06)', border: '1px solid rgba(248,81,73,0.15)', color: '#f85149', borderRadius: 6, padding: '4px 8px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
