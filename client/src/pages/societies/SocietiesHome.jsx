import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { getMySocieties, getSocietiesFeed } from '../../api/societies'
import { getPrivilegeLabel } from '../../utils/societyPrivileges'

/* ── Floating letter key — identical to Feed ── */
const Key = ({ letter, color, style }) => (
  <div style={{
    position: 'absolute', width: 68, height: 68, borderRadius: 16,
    background: color, border: '3.5px solid #111', boxShadow: '4px 4px 0 #111',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
    fontSize: '2rem', color: '#111', animation: 'floatKey 3s ease-in-out infinite',
    userSelect: 'none', pointerEvents: 'none', ...style,
  }}>
    {letter}
  </div>
)

const SocietiesHome = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [discoveries, setDiscoveries] = useState([])
  const [mySocieties, setMySocieties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const currentUserId = useMemo(() => {
    const token = user?.token || localStorage.getItem('token')
    if (!token) return null
    try { return JSON.parse(atob(token.split('.')[1])).userId || null } catch { return null }
  }, [user])

  useEffect(() => {
    const loadSocieties = async () => {
      try {
        setLoading(true); setError('')
        const [discoverData, mineData] = await Promise.all([
          getSocietiesFeed(),
          currentUserId ? getMySocieties() : Promise.resolve([])
        ])
        setDiscoveries(discoverData)
        setMySocieties(mineData)
      } catch { setError('Failed to load societies') }
      finally { setLoading(false) }
    }
    loadSocieties()
  }, [currentUserId])

  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }
  const activeMemberships  = mySocieties.filter(m => m.status === 'active')
  const invitedMemberships = mySocieties.filter(m => m.status === 'invited' || m.status === 'pending')

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
    /* position:relative so Key's absolute positioning is contained here */
    body: {
      flex: 1, position: 'relative', display: 'flex', justifyContent: 'center',
      padding: '80px 20px 40px',
    },
    shell: { width: '100%', maxWidth: 1100, zIndex: 5 },
    hero: {
      background: '#f9faf4', borderRadius: 24, border: '2.5px solid #1a4a1a',
      borderTop: '8px solid #43a047', boxShadow: '0 6px 28px rgba(0,0,0,0.10)',
      padding: '32px 36px', marginBottom: 28,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexWrap: 'wrap', gap: 20,
    },
    heroKicker: {
      textTransform: 'uppercase', letterSpacing: '0.08em',
      color: '#6a8f4a', fontSize: '0.78rem', fontWeight: 800, marginBottom: 6,
    },
    heroTitle: {
      fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
      fontSize: '2.1rem', color: '#1a4a1a', margin: '0 0 8px',
    },
    heroSub: { color: '#555', fontSize: '0.92rem', fontWeight: 600, maxWidth: '52ch', margin: 0 },
    heroBtn: {
      display: 'inline-flex', alignItems: 'center',
      background: '#1a4a1a', color: '#fff', textDecoration: 'none',
      padding: '12px 26px', borderRadius: 999, fontWeight: 800,
      fontSize: '0.92rem', fontFamily: "'Nunito', sans-serif",
      flexShrink: 0, whiteSpace: 'nowrap',
    },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 },
    panel: {
      background: '#f9faf4', borderRadius: 22, border: '2.5px solid #1a4a1a',
      borderTop: '7px solid #43a047', boxShadow: '0 6px 28px rgba(0,0,0,0.10)',
      padding: '22px 24px',
    },
    panelInvite: {
      background: '#fffdf0', borderRadius: 22, border: '2.5px solid #1a4a1a',
      borderTop: '7px solid #f6c94e', boxShadow: '0 6px 28px rgba(0,0,0,0.10)',
      padding: '22px 24px',
    },
    panelHeader: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16,
    },
    panelTitle: {
      fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
      fontSize: '1.1rem', color: '#1a4a1a', margin: 0,
    },
    panelCount: {
      background: '#e8f5e0', color: '#2e7d32', fontSize: '0.78rem',
      fontWeight: 800, padding: '3px 10px', borderRadius: 999, border: '1.5px solid #b5cc7a',
    },
    list: { display: 'grid', gap: 10 },
    card: {
      width: '100%', textAlign: 'left', border: '2px solid #dce8c0',
      background: '#fff', borderRadius: 16, padding: '14px 16px',
      cursor: 'pointer', transition: 'all 0.15s',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    },
    cardTop: {
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: 10, marginBottom: 6,
    },
    cardName: { fontWeight: 800, fontSize: '0.95rem', color: '#1a4a1a', display: 'block' },
    cardSlug: { fontSize: '0.78rem', color: '#6a8f4a', fontWeight: 700, display: 'block', marginTop: 2 },
    cardDesc: { fontSize: '0.85rem', color: '#555', lineHeight: 1.5, margin: 0 },
    badge: {
      display: 'inline-flex', padding: '3px 10px', borderRadius: 999,
      background: '#e8f5e0', color: '#2a6f2a', fontSize: '0.72rem',
      fontWeight: 800, textTransform: 'uppercase', border: '1.5px solid #b5cc7a', flexShrink: 0,
    },
    badgeAccent: {
      display: 'inline-flex', padding: '3px 10px', borderRadius: 999,
      background: '#fff3d8', color: '#a45b00', fontSize: '0.72rem',
      fontWeight: 800, textTransform: 'uppercase', border: '1.5px solid #f6c94e', flexShrink: 0,
    },
    empty: { color: '#888', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center', padding: '16px 0' },
    statusBox: { textAlign: 'center', padding: '2rem', color: '#6a8f4a', fontSize: '0.95rem', fontWeight: 700 },
    errorBox: {
      background: '#ffeef0', border: '1.5px solid #f48fb1', borderRadius: 12,
      padding: '12px 16px', color: '#c62828', fontWeight: 700, marginBottom: 20,
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
        .soc-card:hover { background:#f0f7f0 !important; border-color:#43a047 !important; transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,0.10) !important; }
        .soc-nava:hover { color:#2e7d32 !important; }
        @media(max-width:680px){ .soc-hero{flex-direction:column !important;} }
        @media(max-width:640px){ .soc-nava{display:none !important;} .soc-nav{padding:0 16px !important;} }
      `}</style>

      <div style={s.page}>
        {/* ── NAV — identical to Feed ── */}
        <nav style={s.nav} className="soc-nav">
          <div style={s.navLeft}>
            <Link to="/" style={s.logo}>★ UNIVERSE</Link>
            <Link to="/feed"        style={s.navA} className="soc-nava">Feed</Link>
            <Link to="/create-post" style={s.navA} className="soc-nava">Create Post</Link>
            <Link to="/societies"   style={s.navA} className="soc-nava">Societies</Link>
            <Link to="/explore"     style={s.navA} className="soc-nava">Explore</Link>
            <Link to="/messages"    style={s.navA} className="soc-nava">Messages</Link>
            <Link to="/settings"    style={s.navA} className="soc-nava">Settings</Link>
            <Link to="/about"       style={s.navA} className="soc-nava">About</Link>
            <Link to="/contact"     style={s.navA} className="soc-nava">Contact</Link>
          </div>
          <div style={s.navRight}>
            <Link to="/societies/new" style={s.btnOutline}>+ New Society</Link>
            <button style={s.btnFill} onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        {/* ── BODY with keys spelling J-O-I-N on the sides ── */}
        <div style={s.body}>
          {/* Left side: J O */}
          <Key letter="J" color="#f4845f" style={{ left:'4%', top:'12%', '--rot':'-10deg' }} />
          <Key letter="O" color="#f6c94e" style={{ left:'7%', top:'38%', '--rot':'8deg',  animationDelay:'0.4s' }} />
          {/* Right side: I N */}
          <Key letter="I" color="#49c4a0" style={{ right:'5%', top:'10%', '--rot':'10deg', animationDelay:'0.6s' }} />
          <Key letter="N" color="#b16ae8" style={{ right:'8%', top:'32%', '--rot':'-8deg', animationDelay:'1s'   }} />

          <div style={s.shell}>
            {/* Hero */}
            <div style={s.hero} className="soc-hero">
              <div>
                <p style={s.heroKicker}>Campus communities</p>
                <h1 style={s.heroTitle}>Societies</h1>
                <p style={s.heroSub}>
                  Discover student groups, manage your memberships, and connect with your campus community.
                </p>
              </div>
              <Link to="/societies/new" style={s.heroBtn}>＋ Start a Society</Link>
            </div>

            {error   && <div style={s.errorBox}>⚠ {error}</div>}
            {loading && <div style={s.statusBox}>Loading societies…</div>}

            {!loading && (
              <div style={s.grid}>
                {/* My Societies */}
                <div style={s.panel}>
                  <div style={s.panelHeader}>
                    <h2 style={s.panelTitle}>My Societies</h2>
                    <span style={s.panelCount}>{activeMemberships.length} joined</span>
                  </div>
                  {activeMemberships.length === 0 ? (
                    <p style={s.empty}>You haven't joined any societies yet.</p>
                  ) : (
                    <div style={s.list}>
                      {activeMemberships.map(membership => (
                        <button key={membership._id} className="soc-card" style={s.card}
                          onClick={() => navigate(`/societies/${membership.societyId?.slug || membership.societyId?._id}`)}>
                          <div style={s.cardTop}>
                            <div>
                              <span style={s.cardName}>{membership.societyId?.name || 'Society'}</span>
                              <span style={s.cardSlug}>@{membership.societyId?.slug || 'society'}</span>
                            </div>
                            <span style={s.badge}>{getPrivilegeLabel(membership)}</span>
                          </div>
                          <p style={s.cardDesc}>{membership.societyId?.description || 'No description yet.'}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Invitations */}
                {invitedMemberships.length > 0 && (
                  <div style={s.panelInvite}>
                    <div style={s.panelHeader}>
                      <h2 style={s.panelTitle}>Invitations</h2>
                      <span style={{ ...s.panelCount, background: '#fff3d8', color: '#a45b00', border: '1.5px solid #f6c94e' }}>
                        {invitedMemberships.length} pending
                      </span>
                    </div>
                    <div style={s.list}>
                      {invitedMemberships.map(membership => (
                        <button key={membership._id} className="soc-card" style={s.card}
                          onClick={() => navigate(`/societies/${membership.societyId?.slug || membership.societyId?._id}`)}>
                          <div style={s.cardTop}>
                            <div>
                              <span style={s.cardName}>{membership.societyId?.name || 'Society'}</span>
                              <span style={s.cardSlug}>@{membership.societyId?.slug || 'society'}</span>
                            </div>
                            <span style={s.badgeAccent}>Accept Invite</span>
                          </div>
                          <p style={s.cardDesc}>{membership.societyId?.description || 'No description yet.'}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Discover */}
                <div style={s.panel}>
                  <div style={s.panelHeader}>
                    <h2 style={s.panelTitle}>Discover</h2>
                    <span style={s.panelCount}>{discoveries.length} public</span>
                  </div>
                  {discoveries.length === 0 ? (
                    <p style={s.empty}>No societies have been created yet.</p>
                  ) : (
                    <div style={s.list}>
                      {discoveries.map(society => (
                        <button key={society._id} className="soc-card" style={s.card}
                          onClick={() => navigate(`/societies/${society.slug}`)}>
                          <div style={s.cardTop}>
                            <div>
                              <span style={s.cardName}>{society.name}</span>
                              <span style={s.cardSlug}>@{society.slug}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                              <span style={s.badge}>{society.visibility}</span>
                              {society.settings?.inviteOnly && <span style={s.badgeAccent}>invite only</span>}
                            </div>
                          </div>
                          <p style={s.cardDesc}>{society.description || 'No description provided.'}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── FOOTER — identical to Feed ── */}
        <footer style={s.footer}>✦ UNIVERSE — made with ♥ ✦</footer>
      </div>
    </>
  )
}

export default SocietiesHome