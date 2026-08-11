/**
 * StatusBadge — displays a scan or module status as a colored badge.
 */
export function StatusBadge({ status, size = 'sm' }) {
  const configs = {
    queued: { label: 'Queued', bg: 'rgba(88,166,255,0.1)', color: '#58a6ff', border: 'rgba(88,166,255,0.3)' },
    running: { label: 'Running', bg: 'rgba(210,153,34,0.1)', color: '#d29922', border: 'rgba(210,153,34,0.3)' },
    completed: { label: 'Complete', bg: 'rgba(63,185,80,0.1)', color: '#3fb950', border: 'rgba(63,185,80,0.3)' },
    completed_with_errors: { label: 'Partial', bg: 'rgba(210,153,34,0.1)', color: '#d29922', border: 'rgba(210,153,34,0.3)' },
    failed: { label: 'Failed', bg: 'rgba(248,81,73,0.1)', color: '#f85149', border: 'rgba(248,81,73,0.3)' },
    pending: { label: 'Waiting', bg: 'rgba(110,118,129,0.1)', color: '#6e7681', border: 'rgba(110,118,129,0.3)' },
    skipped: { label: 'Skipped', bg: 'rgba(110,118,129,0.1)', color: '#6e7681', border: 'rgba(110,118,129,0.3)' },
  }

  const cfg = configs[status] || configs.pending
  const fontSize = size === 'xs' ? '10px' : '11px'
  const padding = size === 'xs' ? '1px 6px' : '2px 8px'

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      borderRadius: 9999,
      fontSize,
      fontWeight: 600,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      padding,
    }}>
      {cfg.label}
    </span>
  )
}

export function SslBadge({ status }) {
  const configs = {
    VALID: { label: '✓ Valid', bg: 'rgba(63,185,80,0.1)', color: '#3fb950', border: 'rgba(63,185,80,0.3)' },
    EXPIRING_SOON: { label: '⚠ Expiring', bg: 'rgba(210,153,34,0.1)', color: '#d29922', border: 'rgba(210,153,34,0.3)' },
    EXPIRED: { label: '✗ Expired', bg: 'rgba(248,81,73,0.1)', color: '#f85149', border: 'rgba(248,81,73,0.3)' },
    UNAVAILABLE: { label: 'Unavailable', bg: 'rgba(110,118,129,0.1)', color: '#6e7681', border: 'rgba(110,118,129,0.3)' },
  }
  const cfg = configs[status] || configs.UNAVAILABLE
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      borderRadius: 9999, fontSize: '11px', fontWeight: 700,
      letterSpacing: '0.05em', textTransform: 'uppercase', padding: '2px 10px',
    }}>
      {cfg.label}
    </span>
  )
}
