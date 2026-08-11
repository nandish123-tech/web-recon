import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Shield, History, Home, Github } from 'lucide-react'

export default function Layout() {
  return (
    <div className="min-h-screen" style={{backgroundColor: '#0a0e14'}}>
      {/* Top navbar */}
      <nav style={{background: 'rgba(13, 17, 23, 0.95)', borderBottom: '1px solid #21262d'}} className="sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <NavLink to="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background: 'linear-gradient(135deg, #58a6ff22, #3fb95022)', border: '1px solid #58a6ff33'}}>
                <Shield size={14} style={{color: '#58a6ff'}} />
              </div>
              <div>
                <span className="font-bold text-sm" style={{color: '#c9d1d9'}}>Recon</span>
                <span className="font-bold text-sm" style={{color: '#58a6ff'}}>Scope</span>
              </div>
            </NavLink>

            {/* Nav links */}
            <div className="flex items-center gap-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'text-recon-cyan' : 'text-recon-muted hover:text-recon-text'
                  }`
                }
                style={({ isActive }) => ({
                  color: isActive ? '#58a6ff' : '#6e7681',
                  backgroundColor: isActive ? 'rgba(88,166,255,0.08)' : undefined,
                })}
              >
                <Home size={14} />
                Dashboard
              </NavLink>
              <NavLink
                to="/history"
                style={({ isActive }) => ({
                  color: isActive ? '#58a6ff' : '#6e7681',
                  backgroundColor: isActive ? 'rgba(88,166,255,0.08)' : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'color 0.15s',
                })}
              >
                <History size={14} />
                History
              </NavLink>
            </div>

            <div className="flex items-center gap-2">
              <span style={{fontSize:'11px', color:'#6e7681', background:'rgba(248,81,73,0.1)', border:'1px solid rgba(248,81,73,0.2)', padding:'2px 8px', borderRadius:'9999px', fontWeight:'600', letterSpacing:'0.05em'}}>AUTHORIZED USE ONLY</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Page content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer style={{borderTop: '1px solid #21262d', padding: '20px 24px', textAlign: 'center'}}>
        <p style={{fontSize: '12px', color: '#6e7681'}}>ReconScope — Web Reconnaissance Automation Framework. For authorized security testing only.</p>
      </footer>
    </div>
  )
}
