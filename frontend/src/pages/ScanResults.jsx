import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Shield, Globe, Lock, Server, FileText, AlertTriangle, CheckCircle, XCircle,
  Download, ChevronLeft, Clock, Copy, Check, Activity, Eye, ExternalLink
} from 'lucide-react'
import { scansApi } from '../services/api'

// ---- Utility Components ----
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(text) } catch { }
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#3fb950' : '#6e7681', padding: '2px 4px', borderRadius: 4, display: 'inline-flex', alignItems: 'center' }}>
      {copied ? <Check size={11} /> : <Copy size={11} />}
    </button>
  )
}

function InfoRow({ label, value, mono = true }) {
  if (!value && value !== 0) return null
  return (
    <div style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid rgba(33,38,45,0.5)' }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6e7681', width: 160, flexShrink: 0, paddingTop: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit', color: '#c9d1d9', wordBreak: 'break-all', flex: 1 }}>
        {String(value)}
        {mono && <CopyBtn text={String(value)} />}
      </div>
    </div>
  )
}

function Card({ children, title, style = {} }) {
  return (
    <div style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid #21262d', borderRadius: 12, padding: '20px 24px', ...style }}>
      {title && <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6e7681', marginBottom: 16 }}>{title}</div>}
      {children}
    </div>
  )
}

function RecordTag({ text }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(28,33,40,0.9)', border: '1px solid #21262d', borderRadius: 6, padding: '4px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#c9d1d9', margin: '3px 3px 3px 0' }}>
      {text}
      <CopyBtn text={text} />
    </span>
  )
}

// ---- Summary Cards ----
function SummaryCards({ scan }) {
  const r = scan.results || {}
  const sslStatus = r.ssl?.status
  const sslColor = sslStatus === 'VALID' ? '#3fb950' : sslStatus === 'EXPIRING_SOON' ? '#d29922' : sslStatus === 'EXPIRED' ? '#f85149' : '#6e7681'
  const httpStatus = r.http?.status_code
  const httpColor = httpStatus >= 200 && httpStatus < 300 ? '#3fb950' : httpStatus >= 300 && httpStatus < 400 ? '#d29922' : httpStatus >= 400 ? '#f85149' : '#6e7681'

  const cards = [
    { label: 'PRIMARY IP', value: r.ip?.ipv4 || '—', color: '#58a6ff' },
    { label: 'HTTP STATUS', value: r.http?.status_code ? `${r.http.status_code}` : '—', sub: r.http?.status_text, color: httpColor },
    { label: 'SSL STATUS', value: sslStatus?.replace('_', ' ') || '—', color: sslColor },
    { label: 'DNS RECORDS', value: r.dns?.total_records ?? '—', color: '#a371f7' },
    { label: 'OBSERVATIONS', value: r.security?.headers?.length ?? '—', color: '#d29922' },
    { label: 'DURATION', value: scan.duration_seconds ? `${scan.duration_seconds.toFixed(1)}s` : '—', color: '#6e7681' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
      {cards.map(c => (
        <div key={c.label} style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid #21262d', borderRadius: 10, padding: '16px 18px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6e7681', marginBottom: 8 }}>{c.label}</div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: c.color }}>{String(c.value)}</div>
          {c.sub && <div style={{ fontSize: 11, color: '#6e7681', marginTop: 3 }}>{c.sub}</div>}
        </div>
      ))}
    </div>
  )
}

// ---- Tab Bar ----
const TABS = [
  { id: 'overview', label: 'Overview', icon: Activity },
  { id: 'whois', label: 'WHOIS', icon: Globe },
  { id: 'dns', label: 'DNS', icon: Server },
  { id: 'ip', label: 'IP', icon: Globe },
  { id: 'http', label: 'HTTP', icon: ExternalLink },
  { id: 'tls', label: 'TLS', icon: Lock },
  { id: 'webfiles', label: 'Web Files', icon: FileText },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'raw', label: 'Raw Data', icon: Eye },
]

function TabBar({ active, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', borderBottom: '1px solid #21262d', paddingBottom: 0, marginBottom: 24, overflowX: 'auto' }}>
      {TABS.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          style={{
            background: active === id ? 'rgba(88,166,255,0.1)' : 'transparent',
            border: active === id ? '1px solid rgba(88,166,255,0.2)' : '1px solid transparent',
            borderBottom: active === id ? '2px solid #58a6ff' : '2px solid transparent',
            color: active === id ? '#58a6ff' : '#6e7681',
            borderRadius: '8px 8px 0 0',
            padding: '8px 14px',
            fontSize: 13, fontWeight: active === id ? 600 : 400,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
            transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}
        >
          <Icon size={13} /> {label}
        </button>
      ))}
    </div>
  )
}

// ---- Overview Tab ----
function OverviewTab({ scan }) {
  const r = scan.results || {}
  const secHeaders = r.security?.headers || []
  const presentHeaders = secHeaders.filter(h => h.status === 'PRESENT')
  const missingHeaders = secHeaders.filter(h => h.status === 'MISSING')
  const infoHeaders = secHeaders.filter(h => h.status === 'INFORMATIONAL')

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 16 }}>
      <Card title="Scan Information">
        <InfoRow label="Target" value={scan.target} />
        <InfoRow label="Scan ID" value={scan.scan_id?.slice(0, 16) + '...'} />
        <InfoRow label="Status" value={scan.status?.replace(/_/g, ' ')} mono={false} />
        <InfoRow label="Duration" value={scan.duration_seconds ? `${scan.duration_seconds.toFixed(2)}s` : undefined} />
        <InfoRow label="Primary IP" value={r.ip?.ipv4} />
        <InfoRow label="HTTP Status" value={r.http?.status_code ? `${r.http.status_code} ${r.http.status_text || ''}`.trim() : undefined} />
        <InfoRow label="TLS Status" value={r.ssl?.status} />
        <InfoRow label="DNS Records" value={r.dns?.total_records !== undefined ? String(r.dns.total_records) : undefined} />
        {r.ip?.country && <InfoRow label="Country" value={r.ip.country} mono={false} />}
        {r.ip?.org && <InfoRow label="Organization" value={r.ip.org} mono={false} />}
      </Card>

      <Card title="Security Observations">
        {secHeaders.length === 0 ? (
          <div style={{ color: '#6e7681', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>No security data available</div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20, fontSize: 13 }}>
              <div><span style={{ color: '#3fb950', fontWeight: 700 }}>{presentHeaders.length}</span> <span style={{ color: '#6e7681' }}>Present</span></div>
              <div><span style={{ color: '#f85149', fontWeight: 700 }}>{missingHeaders.length}</span> <span style={{ color: '#6e7681' }}>Missing</span></div>
              <div><span style={{ color: '#d29922', fontWeight: 700 }}>{infoHeaders.length}</span> <span style={{ color: '#6e7681' }}>Info</span></div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6e7681', marginBottom: 6 }}>
                <span>Header Coverage</span>
                <span style={{ color: '#58a6ff', fontWeight: 600 }}>{r.security?.coverage_percent || 0}%</span>
              </div>
              <div style={{ background: '#1c2128', borderRadius: 9999, height: 6, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${r.security?.coverage_percent || 0}%`, background: 'linear-gradient(90deg, #58a6ff, #3fb950)', borderRadius: 9999 }} />
              </div>
            </div>
            {secHeaders.map((h) => (
              <div key={h.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', borderBottom: '1px solid rgba(33,38,45,0.4)' }}>
                {h.status === 'PRESENT'
                  ? <CheckCircle size={13} style={{ color: '#3fb950', flexShrink: 0 }} />
                  : h.status === 'MISSING'
                    ? <XCircle size={13} style={{ color: '#f85149', flexShrink: 0 }} />
                    : <AlertTriangle size={13} style={{ color: '#d29922', flexShrink: 0 }} />}
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#c9d1d9', flex: 1 }}>{h.name}</span>
                <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', color: h.status === 'PRESENT' ? '#3fb950' : h.status === 'MISSING' ? '#f85149' : '#d29922' }}>
                  {h.status}
                </span>
              </div>
            ))}
          </>
        )}
      </Card>
    </div>
  )
}

// ---- WHOIS Tab ----
function WhoisTab({ data }) {
  const [showRaw, setShowRaw] = useState(false)
  if (!data) return <Card><div style={{ color: '#6e7681', textAlign: 'center', padding: 40 }}>WHOIS data unavailable</div></Card>
  if (!data.available) return <Card><div style={{ color: '#6e7681', textAlign: 'center', padding: 40 }}>WHOIS data not available — may be privacy-protected or unavailable for this domain.</div></Card>

  return (
    <div>
      <Card title="Registration Information">
        <InfoRow label="Domain" value={data.domain} />
        <InfoRow label="Registrar" value={data.registrar} mono={false} />
        <InfoRow label="Created" value={data.creation_date} />
        <InfoRow label="Updated" value={data.updated_date} />
        <InfoRow label="Expires" value={data.expiration_date} />
        <InfoRow label="Name Servers" value={data.name_servers?.join(', ')} />
        <InfoRow label="Status" value={data.status?.slice(0, 3).join(', ')} />
        {data.emails?.length > 0 && <InfoRow label="Emails" value={data.emails?.join(', ')} />}
      </Card>
      {data.raw && (
        <div style={{ marginTop: 12 }}>
          <button
            onClick={() => setShowRaw(!showRaw)}
            style={{ background: 'none', border: '1px solid #21262d', color: '#6e7681', borderRadius: 6, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}
          >
            {showRaw ? 'Hide' : 'Show'} Raw WHOIS Data
          </button>
          {showRaw && (
            <div style={{ marginTop: 10, background: 'rgba(13,17,23,0.8)', border: '1px solid #21262d', borderRadius: 8, padding: 16, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#8b949e', whiteSpace: 'pre-wrap', maxHeight: 400, overflowY: 'auto' }}>
              {data.raw}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---- DNS Tab ----
function DnsTab({ data }) {
  if (!data) return <Card><div style={{ color: '#6e7681', textAlign: 'center', padding: 40 }}>DNS data unavailable</div></Card>
  const types = [
    { key: 'A', label: 'A Records (IPv4)' },
    { key: 'AAAA', label: 'AAAA Records (IPv6)' },
    { key: 'MX', label: 'MX Records (Mail)' },
    { key: 'NS', label: 'NS Records (Nameservers)' },
    { key: 'TXT', label: 'TXT Records' },
    { key: 'CNAME', label: 'CNAME Records' },
  ]
  const hasAny = types.some(({ key }) => data[key] && data[key].length > 0)
  return (
    <div>
      <div style={{ marginBottom: 16, color: '#6e7681', fontSize: 13 }}>{data.total_records} total records discovered</div>
      {types.map(({ key, label }) => (
        data[key] && data[key].length > 0 ? (
          <Card key={key} title={label} style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {data[key].map((r, i) => <RecordTag key={i} text={r} />)}
            </div>
          </Card>
        ) : null
      ))}
      {!hasAny && <Card><div style={{ color: '#6e7681', textAlign: 'center', padding: 40 }}>No DNS records found</div></Card>}
    </div>
  )
}

// ---- IP Tab ----
function IpTab({ data }) {
  if (!data) return <Card><div style={{ color: '#6e7681', textAlign: 'center', padding: 40 }}>IP data unavailable</div></Card>
  return (
    <Card title="IP & Network Information">
      <InfoRow label="IPv4" value={data.ipv4} />
      <InfoRow label="IPv6" value={data.ipv6} />
      <InfoRow label="ASN" value={data.asn} />
      <InfoRow label="ASN Description" value={data.asn_description} mono={false} />
      <InfoRow label="Organization" value={data.org} mono={false} />
      <InfoRow label="ISP" value={data.isp} mono={false} />
      <InfoRow label="Country" value={data.country ? `${data.country}${data.country_code ? ` (${data.country_code})` : ''}` : undefined} mono={false} />
      <InfoRow label="Region" value={data.region} mono={false} />
      <InfoRow label="City" value={data.city} mono={false} />
      <InfoRow label="Network" value={data.network} />
      <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(210,153,34,0.05)', border: '1px solid rgba(210,153,34,0.1)', borderRadius: 6, fontSize: 12, color: '#6e7681' }}>
        ⚠ Geolocation data is approximate and should not be treated as precise.
      </div>
    </Card>
  )
}

// ---- HTTP Tab ----
function HttpTab({ data }) {
  const [search, setSearch] = useState('')
  if (!data) return <Card><div style={{ color: '#6e7681', textAlign: 'center', padding: 40 }}>HTTP data unavailable</div></Card>

  const headers = data.headers ? Object.entries(data.headers) : []
  const filtered = headers.filter(([k]) => k.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <Card title="Response Information" style={{ marginBottom: 16 }}>
        <InfoRow label="Status" value={data.status_text} />
        <InfoRow label="Final URL" value={data.final_url} />
        <InfoRow label="Response Time" value={data.response_time_ms ? `${data.response_time_ms}ms` : undefined} />
        <InfoRow label="HTTP Version" value={data.http_version} />
        <InfoRow label="Server" value={data.server} />
        <InfoRow label="Content-Type" value={data.content_type} />
        <InfoRow label="X-Powered-By" value={data.x_powered_by} />
        <InfoRow label="Content-Length" value={data.content_length ? `${data.content_length} bytes` : undefined} />
      </Card>

      {data.redirect_chain && data.redirect_chain.length > 0 && (
        <Card title="Redirect Chain" style={{ marginBottom: 16 }}>
          {data.redirect_chain.map((hop, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(33,38,45,0.5)' }}>
              <span style={{ background: 'rgba(210,153,34,0.1)', color: '#d29922', border: '1px solid rgba(210,153,34,0.2)', borderRadius: 4, padding: '1px 8px', fontFamily: 'monospace', fontSize: 12 }}>{hop.status_code}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#8b949e', wordBreak: 'break-all' }}>{hop.url}</span>
            </div>
          ))}
        </Card>
      )}

      <Card title={`Response Headers (${headers.length})`}>
        <div style={{ marginBottom: 12 }}>
          <input
            placeholder="Filter headers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', background: 'rgba(13,17,23,0.8)', border: '1px solid #21262d', borderRadius: 6, padding: '7px 12px', color: '#c9d1d9', fontSize: 13, outline: 'none', fontFamily: 'JetBrains Mono, monospace' }}
          />
        </div>
        <div style={{ maxHeight: 400, overflowY: 'auto' }}>
          {filtered.map(([key, val]) => (
            <div key={key} style={{ display: 'flex', gap: 16, padding: '7px 0', borderBottom: '1px solid rgba(33,38,45,0.3)' }}>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#58a6ff', width: 240, flexShrink: 0 }}>{key}</span>
              <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#8b949e', wordBreak: 'break-all', flex: 1 }}>{val}</span>
            </div>
          ))}
          {filtered.length === 0 && <div style={{ color: '#6e7681', textAlign: 'center', padding: '20px 0', fontSize: 13 }}>No headers match filter</div>}
        </div>
      </Card>
    </div>
  )
}

// ---- TLS Tab ----
function TlsTab({ data }) {
  if (!data || data.status === 'UNAVAILABLE') {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Lock size={40} style={{ color: '#21262d', margin: '0 auto 12px', display: 'block' }} />
          <div style={{ color: '#6e7681', fontSize: 14 }}>TLS certificate information unavailable</div>
          <div style={{ color: '#6e7681', fontSize: 12, marginTop: 8 }}>The target may not support HTTPS or the connection timed out.</div>
        </div>
      </Card>
    )
  }

  const statusConfig = {
    VALID: { color: '#3fb950', bg: 'rgba(63,185,80,0.08)', border: 'rgba(63,185,80,0.2)', icon: CheckCircle },
    EXPIRING_SOON: { color: '#d29922', bg: 'rgba(210,153,34,0.08)', border: 'rgba(210,153,34,0.2)', icon: AlertTriangle },
    EXPIRED: { color: '#f85149', bg: 'rgba(248,81,73,0.08)', border: 'rgba(248,81,73,0.2)', icon: XCircle },
  }
  const cfg = statusConfig[data.status] || statusConfig.VALID
  const StatusIcon = cfg.icon

  return (
    <Card title="TLS Certificate">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '12px 16px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 8 }}>
        <StatusIcon size={20} style={{ color: cfg.color }} />
        <div>
          <div style={{ fontWeight: 700, color: cfg.color, fontSize: 15 }}>{data.status.replace(/_/g, ' ')}</div>
          {data.days_remaining !== null && data.days_remaining !== undefined && (
            <div style={{ fontSize: 12, color: '#6e7681' }}>{data.days_remaining} days remaining</div>
          )}
        </div>
      </div>

      <InfoRow label="Common Name" value={data.common_name} />
      <InfoRow label="Issuer" value={data.issuer_cn} mono={false} />
      <InfoRow label="Valid From" value={data.not_before} />
      <InfoRow label="Valid Until" value={data.not_after} />
      <InfoRow label="TLS Version" value={data.tls_version} />
      <InfoRow label="Serial Number" value={data.serial_number} />

      {data.san && data.san.length > 0 && (
        <div style={{ paddingTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6e7681', marginBottom: 8 }}>Subject Alternative Names ({data.san.length})</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {data.san.map((name, i) => <RecordTag key={i} text={name} />)}
          </div>
        </div>
      )}
    </Card>
  )
}

// ---- Web Files Tab ----
function WebFilesTab({ data }) {
  if (!data) return <Card><div style={{ color: '#6e7681', textAlign: 'center', padding: 40 }}>Web files data unavailable</div></Card>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card title="robots.txt">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: data.robots_txt_available && data.robots_txt_content ? 16 : 0 }}>
          {data.robots_txt_available
            ? <CheckCircle size={14} style={{ color: '#3fb950' }} />
            : <XCircle size={14} style={{ color: '#6e7681' }} />}
          <span style={{ fontSize: 13, color: data.robots_txt_available ? '#3fb950' : '#6e7681' }}>
            {data.robots_txt_available ? 'Available' : 'Not available'}
            {data.robots_txt_status ? ` (HTTP ${data.robots_txt_status})` : ''}
          </span>
        </div>
        {data.robots_txt_available && data.robots_txt_content && (
          <div style={{ background: 'rgba(13,17,23,0.8)', border: '1px solid #21262d', borderRadius: 6, padding: 14, fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#8b949e', whiteSpace: 'pre-wrap', maxHeight: 300, overflowY: 'auto' }}>
            {data.robots_txt_content}
          </div>
        )}
      </Card>

      <Card title="sitemap.xml">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: data.sitemap_urls?.length ? 16 : 0 }}>
          {data.sitemap_xml_available
            ? <CheckCircle size={14} style={{ color: '#3fb950' }} />
            : <XCircle size={14} style={{ color: '#6e7681' }} />}
          <span style={{ fontSize: 13, color: data.sitemap_xml_available ? '#3fb950' : '#6e7681' }}>
            {data.sitemap_xml_available ? 'Available' : 'Not available'}
            {data.sitemap_xml_status ? ` (HTTP ${data.sitemap_xml_status})` : ''}
          </span>
        </div>
        {data.sitemap_urls && data.sitemap_urls.length > 0 && (
          <>
            <div style={{ fontSize: 12, color: '#6e7681', marginBottom: 8 }}>{data.sitemap_urls.length} URLs discovered</div>
            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
              {data.sitemap_urls.map((url, i) => (
                <div key={i} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#58a6ff', padding: '4px 0', borderBottom: '1px solid rgba(33,38,45,0.3)' }}>{url}</div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  )
}

// ---- Security Tab ----
function SecurityTab({ data }) {
  if (!data) return <Card><div style={{ color: '#6e7681', textAlign: 'center', padding: 40 }}>Security header data unavailable</div></Card>

  const headers = data.headers || []

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Present', count: data.present_count, color: '#3fb950' },
          { label: 'Missing', count: data.missing_count, color: '#f85149' },
          { label: 'Informational', count: data.informational_count, color: '#d29922' },
        ].map(({ label, count, color }) => (
          <div key={label} style={{ background: 'rgba(22,27,34,0.8)', border: '1px solid #21262d', borderRadius: 8, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{count}</div>
            <div style={{ fontSize: 11, color: '#6e7681', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
          <span style={{ color: '#6e7681' }}>Security Header Coverage</span>
          <span style={{ color: '#58a6ff', fontWeight: 600, fontFamily: 'monospace' }}>{data.coverage_percent}%</span>
        </div>
        <div style={{ background: '#1c2128', borderRadius: 9999, height: 8, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${data.coverage_percent}%`, background: 'linear-gradient(90deg, #58a6ff, #3fb950)', borderRadius: 9999, transition: 'width 0.5s' }} />
        </div>
      </Card>

      <Card title="Security Headers">
        {headers.map((h) => (
          <div key={h.name} style={{ padding: '14px 0', borderBottom: '1px solid rgba(33,38,45,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: h.status === 'PRESENT' ? 'rgba(63,185,80,0.15)' : h.status === 'MISSING' ? 'rgba(248,81,73,0.15)' : 'rgba(210,153,34,0.15)',
                marginTop: 2,
              }}>
                {h.status === 'PRESENT'
                  ? <CheckCircle size={12} style={{ color: '#3fb950' }} />
                  : h.status === 'MISSING'
                    ? <XCircle size={12} style={{ color: '#f85149' }} />
                    : <AlertTriangle size={12} style={{ color: '#d29922' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: 600, fontSize: 13, color: '#c9d1d9' }}>{h.name}</div>
                {h.value && <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#6e7681', marginTop: 2, wordBreak: 'break-all' }}>{h.value}</div>}
                {h.observation && <div style={{ fontSize: 12, color: '#8b949e', marginTop: 4 }}>{h.observation}</div>}
                {h.impact && <div style={{ fontSize: 12, color: '#d29922', marginTop: 4 }}><strong>Potential Impact:</strong> {h.impact}</div>}
                {h.recommendation && <div style={{ fontSize: 12, color: '#58a6ff', marginTop: 4 }}><strong>Recommendation:</strong> {h.recommendation}</div>}
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  )
}

// ---- Raw Data Tab ----
function RawTab({ scan }) {
  return (
    <Card title="Raw JSON Data">
      <div style={{ background: 'rgba(13,17,23,0.8)', border: '1px solid #21262d', borderRadius: 8, padding: 16, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#8b949e', whiteSpace: 'pre', overflowX: 'auto', maxHeight: 600, overflowY: 'auto' }}>
        {JSON.stringify(scan, null, 2)}
      </div>
    </Card>
  )
}

// ---- Main ScanResults Page ----
export default function ScanResults() {
  const { scanId } = useParams()
  const navigate = useNavigate()
  const [scan, setScan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!scanId) return
    setLoading(true)
    scansApi.get(scanId)
      .then(setScan)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [scanId])

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: 14, color: '#6e7681' }}>Loading results...</div>
      </div>
    )
  }

  if (error || !scan) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <AlertTriangle size={40} style={{ color: '#f85149', margin: '0 auto 12px', display: 'block' }} />
        <div style={{ color: '#f85149', fontWeight: 600, marginBottom: 8 }}>Failed to load results</div>
        <div style={{ color: '#6e7681' }}>{error || 'Scan not found'}</div>
        <button onClick={() => navigate('/')} style={{ marginTop: 20, background: 'rgba(88,166,255,0.1)', border: '1px solid rgba(88,166,255,0.2)', color: '#58a6ff', borderRadius: 8, padding: '8px 20px', cursor: 'pointer' }}>← Back to Dashboard</button>
      </div>
    )
  }

  // Redirect to progress page if scan is still running
  if (['running', 'queued'].includes(scan.status) && !scan.results) {
    navigate(`/scan/${scanId}/progress`)
    return null
  }

  const r = scan.results || {}

  const statusColor = scan.status === 'completed' ? '#3fb950' : scan.status === 'completed_with_errors' ? '#d29922' : '#f85149'
  const statusLabel = scan.status === 'completed_with_errors' ? 'Partial' : scan.status.charAt(0).toUpperCase() + scan.status.slice(1)

  return (
    <div>
      {/* Back + Title header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: '#6e7681', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, marginBottom: 8, padding: 0 }}
          >
            <ChevronLeft size={14} /> Dashboard
          </button>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#c9d1d9', fontFamily: 'JetBrains Mono, monospace', margin: 0 }}>{scan.target}</h1>
          <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: '#6e7681', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>Scan {scanId?.slice(0, 8)}</span>
            {scan.created_at && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Clock size={11} /> {new Date(scan.created_at).toLocaleString()}
              </span>
            )}
            <span style={{
              background: `rgba(${scan.status === 'completed' ? '63,185,80' : '210,153,34'},0.1)`,
              color: statusColor,
              border: `1px solid rgba(${scan.status === 'completed' ? '63,185,80' : '210,153,34'},0.3)`,
              borderRadius: 9999, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase',
            }}>
              {statusLabel}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <a
            href={scansApi.reportUrl(scanId)}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(22,27,34,0.8)', border: '1px solid #21262d',
              color: '#c9d1d9', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(22,27,34,0.95)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(22,27,34,0.8)'}
          >
            <Download size={14} /> HTML
          </a>
          <a
            href={scansApi.pdfReportUrl(scanId)}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(88,166,255,0.1)', border: '1px solid rgba(88,166,255,0.25)',
              color: '#58a6ff', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600,
              textDecoration: 'none', transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(88,166,255,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(88,166,255,0.1)'}
          >
            <Download size={14} /> PDF Report
          </a>
        </div>
      </div>

      {/* Summary cards */}
      <SummaryCards scan={scan} />

      {/* Module errors */}
      {scan.errors && scan.errors.length > 0 && (
        <div style={{ background: 'rgba(248,81,73,0.04)', border: '1px solid rgba(248,81,73,0.15)', borderRadius: 10, padding: '12px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: '#f85149', marginBottom: 10, textTransform: 'uppercase' }}>
            {scan.errors.length} module error{scan.errors.length !== 1 ? 's' : ''}
          </div>
          {scan.errors.map((err, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '5px 0' }}>
              <span style={{ background: 'rgba(248,81,73,0.1)', color: '#f85149', border: '1px solid rgba(248,81,73,0.2)', borderRadius: 4, fontSize: 10, fontWeight: 700, padding: '1px 6px', textTransform: 'uppercase', flexShrink: 0 }}>
                {err.module}
              </span>
              <span style={{ fontSize: 12, color: '#8b949e' }}>{err.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tab navigation */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      {activeTab === 'overview' && <OverviewTab scan={scan} />}
      {activeTab === 'whois' && <WhoisTab data={r.whois} />}
      {activeTab === 'dns' && <DnsTab data={r.dns} />}
      {activeTab === 'ip' && <IpTab data={r.ip} />}
      {activeTab === 'http' && <HttpTab data={r.http} />}
      {activeTab === 'tls' && <TlsTab data={r.ssl} />}
      {activeTab === 'webfiles' && <WebFilesTab data={r.web_files} />}
      {activeTab === 'security' && <SecurityTab data={r.security} />}
      {activeTab === 'raw' && <RawTab scan={scan} />}
    </div>
  )
}
