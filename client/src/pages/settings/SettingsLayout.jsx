import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useMemo } from 'react'
import { useAuth } from '../../context/useAuth'

const Key = ({ letter, color, style }) => (
  <div style={{
    position: 'absolute', width: 68, height: 68, borderRadius: 16,
    background: color, border: '3.5px solid #111', boxShadow: '4px 4px 0 #111',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
    fontSize: '2rem', color: '#111', animation: 'floatKey 3s ease-in-out infinite',
    userSelect: 'none', pointerEvents: 'none', zIndex: 1, ...style,
  }}>
    {letter}
  </div>
)

const sectionLinks = [
  { to: '/settings',               label: 'Overview',      icon: '🏠', end: true },
  { to: '/settings/account',       label: 'Account',       icon: '👤' },
  { to: '/settings/notifications',  label: 'Notifications', icon: '🔔' },
  { to: '/settings/privacy',        label: 'Privacy',       icon: '🔒' },
  { to: '/settings/appearance',     label: 'Appearance',    icon: '🎨' },
]

const SettingsLayout = ({ title, description, children }) => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const currentUserId = useMemo(() => {
    const token = user?.token || localStorage.getItem('token')
    if (!token) return null
    try { return JSON.parse(atob(token.split('.')[1])).userId } catch { return null }
  }, [user?.token])
  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }

  const s = {
    page: {
      minHeight: '100vh',
      background: '#eef3e2',
      backgroundImage: 'linear-gradient(#c8d8a0 1px,transparent 1px),linear-gradient(90deg,#c8d8a0 1px,transparent 1px)',
      backgroundSize: '24px 24px',
      fontFamily: "'Nunito', sans-serif",
      display: 'flex', flexDirection: 'column',
    },
    nav: {
      position: 'fixed', top: 0, left: 0, right: 0, height: 60,
      background: '#d4e6a5', borderBottom: '2.5px solid #b5cc7a',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 36px', zIndex: 100,
    },
    navLeft:  { display: 'flex', alignItems: 'center', gap: 4 },
    navRight: { display: 'flex', alignItems: 'center', gap: 8 },
    logo: {
      fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
      fontSize: '1.35rem', color: '#1a4a1a', textDecoration: 'none', marginRight: 14,
    },
    navA: {
      textDecoration: 'none', fontWeight: 700, fontSize: '0.92rem',
      color: '#1a4a1a', padding: '6px 14px', fontFamily: "'Nunito', sans-serif",
    },
    btnOutline: {
      fontWeight: 700, fontSize: '0.88rem', color: '#1a4a1a', padding: '7px 18px',
      border: '2px solid #1a4a1a', borderRadius: 999, background: 'none',
      cursor: 'pointer', fontFamily: "'Nunito', sans-serif", textDecoration: 'none',
      display: 'inline-flex', alignItems: 'center',
    },
    btnFill: {
      fontWeight: 700, fontSize: '0.88rem', color: '#fff', padding: '8px 20px',
      background: '#1a4a1a', border: 'none', borderRadius: 999,
      cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
    },
    footer: {
      textAlign: 'center', padding: 18, fontSize: '0.82rem',
      color: '#2e7d32', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
    },
    /* position:relative + flex centering — mirrors Feed's body exactly */
    body: {
      flex: 1,
      position: 'relative',
      display: 'flex',
      justifyContent: 'center',
      padding: '80px 20px 40px',
    },
    shell: {
      width: '100%',
      maxWidth: 960,
      boxSizing: 'border-box',
      position: 'relative',
      zIndex: 5,
      display: 'grid',
      gridTemplateColumns: '220px 1fr',
      gap: 24,
      alignItems: 'start',
    },
    sidebar: {
      background: '#f9faf4', borderRadius: 20, border: '2.5px solid #1a4a1a',
      borderTop: '8px solid #43a047', boxShadow: '0 6px 28px rgba(0,0,0,0.10)',
      padding: '20px 16px', position: 'sticky', top: 80,
    },
    sidebarTitle: {
      fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
      fontSize: '1rem', color: '#1a4a1a', margin: '0 0 14px',
      paddingBottom: 10, borderBottom: '1.5px solid #dce8c0',
    },
    sidebarLink: {
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 12px', borderRadius: 10, marginBottom: 4,
      textDecoration: 'none', fontWeight: 700, fontSize: '0.88rem',
      color: '#1a4a1a', fontFamily: "'Nunito', sans-serif",
      transition: 'all 0.15s',
    },
    sidebarLinkActive:   { background: '#d4e6a5', border: '1.5px solid #b5cc7a' },
    sidebarLinkInactive: { background: 'none',    border: '1.5px solid transparent' },
    main: { minWidth: 0 },
    hero: {
      background: '#f9faf4', borderRadius: 20, border: '2.5px solid #1a4a1a',
      borderTop: '8px solid #43a047', boxShadow: '0 6px 28px rgba(0,0,0,0.10)',
      padding: '24px 28px', marginBottom: 20,
    },
    heroTitle: {
      fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
      fontSize: '1.7rem', color: '#1a4a1a', margin: '0 0 6px',
    },
    heroDesc: {
      color: '#5a7a3a', fontSize: '0.92rem', fontWeight: 600,
      margin: 0, lineHeight: 1.6,
    },
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes floatKey {
          0%,100% { transform: translateY(0) rotate(var(--rot,0deg)); }
          50%      { transform: translateY(-7px) rotate(var(--rot,0deg)); }
        }
        .sl-navA:hover { color:#2e7d32 !important; }
        .sl-sLink:hover { background:#e8f5e0 !important; border-color:#b5cc7a !important; }
        @media(max-width:860px){
          .sl-shell { grid-template-columns: 1fr !important; }
          .sl-sidebar { position: static !important; }
        }
        @media(max-width:640px){
          .sl-navA { display:none !important; }
          .sl-nav  { padding:0 16px !important; }
        }
      `}</style>

      <div style={s.page}>
        {/* ── NAV ── */}
        <nav style={s.nav} className="sl-nav">
          <div style={s.navLeft}>
            <Link to="/" style={s.logo}>★ UNIVERSE</Link>
            <Link to="/Feed"        style={s.navA} className="sl-navA">Feed</Link>
            <Link to="/create-post" style={s.navA} className="sl-navA">Create Post</Link>
            <Link to="/societies"   style={s.navA} className="sl-navA">Societies</Link>
            <Link to="/explore"     style={s.navA} className="sl-navA">Explore</Link>
            <Link to="/messages"    style={s.navA} className="sl-navA">Messages</Link>
            <Link to="/settings"    style={s.navA} className="sl-navA">Settings</Link>
            <Link to="/about"       style={s.navA} className="sl-navA">About</Link>
            <Link to="/contact"     style={s.navA} className="sl-navA">Contact</Link>
          </div>
          <div style={s.navRight}>
            <button style={s.btnOutline} onClick={() => navigate(`/profile/${currentUserId}`)} disabled={!currentUserId}>
              Profile
            </button>
            <button style={s.btnFill} onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        {/* ── BODY ── position:relative so keys are anchored to the viewport area, same as Feed */}
        <div style={s.body}>

          {/* S and E stacked on the left — mirrors M/Y in Feed */}
          <Key letter="S" color="#f4845f" style={{ left: '4%', top: '12%', '--rot': '-10deg' }} />
          <Key letter="E" color="#f6c94e" style={{ left: '7%', top: '38%', '--rot': '8deg', animationDelay: '0.4s' }} />

          {/* T on the right — mirrors F/E/E/D cluster in Feed */}
          <Key letter="T" color="#49c4a0" style={{ right: '5%', top: '12%', '--rot': '10deg', animationDelay: '0.7s' }} />

          <div style={s.shell} className="sl-shell">
            {/* ── SIDEBAR ── */}
            <aside style={s.sidebar} className="sl-sidebar">
              <p style={s.sidebarTitle}>⚙ Settings</p>
              {sectionLinks.map(link => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className="sl-sLink"
                  style={({ isActive }) => ({
                    ...s.sidebarLink,
                    ...(isActive ? s.sidebarLinkActive : s.sidebarLinkInactive),
                  })}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </NavLink>
              ))}
            </aside>

            {/* ── MAIN ── */}
            <main style={s.main}>
              <div style={s.hero}>
                <h1 style={s.heroTitle}>{title}</h1>
                <p style={s.heroDesc}>{description}</p>
              </div>
              {children}
            </main>
          </div>
        </div>

        <footer style={s.footer}>✦ UNIVERSE — made with ♥ ✦</footer>
      </div>
    </>
  )
}

export default SettingsLayout