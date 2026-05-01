import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/index'
import { useAuth } from '../context/useAuth'
import Avatar from '../components/Avatar'

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

const Explore = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const currentUserId = useMemo(() => {
    const token = user?.token || localStorage.getItem('token')
    if (!token) return null
    try { return JSON.parse(atob(token.split('.')[1])).userId } catch { return null }
  }, [user?.token])

  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }

  useEffect(() => {
    const term = query.trim()
    if (!term) { setResults([]); setError(''); return }
    const timeout = setTimeout(async () => {
      try {
        setLoading(true); setError('')
        const res = await api.get('/users/search', { params: { q: term } })
        setResults(res.data)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to search users')
      } finally { setLoading(false) }
    }, 250)
    return () => clearTimeout(timeout)
  }, [query])

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
    body: {
      flex: 1, position: 'relative',
      padding: '80px 20px 40px',
    },
    shell: {
      maxWidth: 620, margin: '0 auto', width: '100%',
      boxSizing: 'border-box', position: 'relative', zIndex: 5,
    },
    heading: {
      fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
      fontSize: '2rem', color: '#1a4a1a', margin: '0 0 4px',
    },
    subheading: {
      color: '#5a7a3a', fontSize: '0.92rem', fontWeight: 600, margin: '0 0 24px',
    },
    searchCard: {
      background: '#f9faf4', borderRadius: 24, border: '2.5px solid #1a4a1a',
      borderTop: '8px solid #43a047', boxShadow: '0 6px 28px rgba(0,0,0,0.10)',
      padding: '28px 32px',
    },
    searchWrap: {
      position: 'relative', marginBottom: 24,
    },
    searchIcon: {
      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
      fontSize: '1.1rem', pointerEvents: 'none',
    },
    searchInput: {
      width: '100%', padding: '13px 14px 13px 42px', boxSizing: 'border-box',
      border: '2px solid #43a047', borderRadius: 12, background: '#f0f7f0',
      fontSize: '0.95rem', fontFamily: "'Nunito', sans-serif",
      color: '#111', outline: 'none',
    },
    statusText: {
      textAlign: 'center', color: '#6a8f4a', fontWeight: 700,
      fontSize: '0.9rem', padding: '12px 0',
    },
    errorBox: {
      background: '#ffeef0', border: '1.5px solid #f48fb1', borderRadius: 10,
      padding: '10px 14px', color: '#c62828', fontSize: '0.85rem',
      fontWeight: 700, marginBottom: 16,
    },
    resultsList: { display: 'grid', gap: 12 },
    resultCard: {
      display: 'flex', alignItems: 'center', gap: 14,
      background: '#fff', borderRadius: 16, border: '2px solid #dce8c0',
      padding: '14px 18px', transition: 'all 0.15s',
    },
    resultInfo: { flex: 1, minWidth: 0 },
    resultName: {
      fontWeight: 800, fontSize: '0.95rem', color: '#1a4a1a',
      display: 'block', marginBottom: 2,
    },
    resultUsername: {
      fontSize: '0.8rem', color: '#6a8f4a', fontWeight: 700, display: 'block',
    },
    resultDept: {
      display: 'inline-block', marginTop: 4,
      background: '#e8f5d0', color: '#2e7d32', fontSize: '0.74rem',
      fontWeight: 700, padding: '2px 10px', borderRadius: 999,
      border: '1.5px solid #b5cc7a',
    },
    resultActions: { display: 'flex', gap: 8, flexShrink: 0 },
    viewBtn: {
      padding: '7px 16px', background: '#1a4a1a', color: '#fff',
      border: 'none', borderRadius: 999, fontWeight: 700,
      fontSize: '0.82rem', cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
    },
    msgBtn: {
      padding: '7px 16px', background: 'none', color: '#1a4a1a',
      border: '2px solid #1a4a1a', borderRadius: 999, fontWeight: 700,
      fontSize: '0.82rem', cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
    },
    emptyState: {
      textAlign: 'center', padding: '32px 0',
    },
    emptyIcon: { fontSize: '2.5rem', marginBottom: 10 },
    emptyText: {
      color: '#5a7a3a', fontWeight: 700, fontSize: '0.95rem', margin: 0,
    },
    emptyHint: {
      color: '#aaa', fontSize: '0.82rem', fontWeight: 600, margin: '6px 0 0',
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
        .ex-input:focus  { border-color:#1a4a1a !important; box-shadow:0 0 0 3px rgba(26,74,26,0.12); }
        .ex-navA:hover   { color:#2e7d32 !important; }
        .ex-card:hover   { border-color:#43a047 !important; transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,0.09) !important; }
        .ex-view:hover   { background:#2e7d32 !important; }
        .ex-msg:hover    { background:#e8f5e0 !important; }
        @media(max-width:640px){ .ex-navA{display:none !important;} .ex-nav{padding:0 16px !important;} }
      `}</style>

      <div style={s.page}>
        {/* ── NAV ── */}
        <nav style={s.nav} className="ex-nav">
          <div style={s.navLeft}>
            <Link to="/" style={s.logo}>★ UNIVERSE</Link>
            <Link to="/feed"      style={s.navA} className="ex-navA">Feed</Link>
            <Link to="/societies" style={s.navA} className="ex-navA">Societies</Link>
            <Link to="/explore"   style={s.navA} className="ex-navA">Explore</Link>
            <Link to="/messages"  style={s.navA} className="ex-navA">Messages</Link>
            <Link to="/settings"  style={s.navA} className="ex-navA">Settings</Link>
			<Link to="/about" style={s.navA} className="ex-navA">About</Link>
			<Link to="/contact" style={s.navA} className="ex-navA">Contact</Link>
          </div>
          <div style={s.navRight}>
            <button
              style={s.btnOutline}
              onClick={() => currentUserId && navigate(`/profile/${currentUserId}`)}
              disabled={!currentUserId}
            >
              Profile
            </button>
            <button style={s.btnFill} onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        {/* ── BODY ── */}
        <div style={s.body}>
          {/* Floating keys spell S-E-E-K */}
          <Key letter="S" color="#f4845f" style={{ left: '4%', top: '12%', '--rot': '-10deg' }} />
          <Key letter="E" color="#f6c94e" style={{ left: '7%', top: '42%', '--rot': '8deg',  animationDelay: '0.4s' }} />
          <Key letter="E" color="#49c4a0" style={{ right: '5%', top: '10%', '--rot': '10deg', animationDelay: '0.6s' }} />
          <Key letter="K" color="#a78bfa" style={{ right: '7%', top: '40%', '--rot': '-8deg', animationDelay: '1s'   }} />

          <div style={s.shell}>
            <h1 style={s.heading}>Explore</h1>
            <p style={s.subheading}>Find classmates by name or username, then visit their profile.</p>

            <div style={s.searchCard}>
              {/* Search input */}
              <div style={s.searchWrap}>
                <span style={s.searchIcon}>🔍</span>
                <input
                  type="text"
                  className="ex-input"
                  style={s.searchInput}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search by name or username…"
                  autoFocus
                />
              </div>

              {/* States */}
              {error   && <div style={s.errorBox}>⚠ {error}</div>}
              {loading && <p style={s.statusText}>Searching…</p>}

              {/* Results */}
              {!loading && results.length > 0 && (
                <div style={s.resultsList}>
                  {results.map(person => (
                    <div key={person._id} className="ex-card" style={s.resultCard}>
                      <Avatar src={person.avatar} name={person.name || person.username} size={46} />
                      <div style={s.resultInfo}>
                        <span style={s.resultName}>{person.name || 'Student'}</span>
                        <span style={s.resultUsername}>@{person.username}</span>
                        {person.department && (
                          <span style={s.resultDept}>{person.department}</span>
                        )}
                      </div>
                      <div style={s.resultActions}>
                        <button
                          className="ex-view"
                          style={s.viewBtn}
                          onClick={() => navigate(`/profile/${person._id}`)}
                        >
                          View
                        </button>
                        <button
                          className="ex-msg"
                          style={s.msgBtn}
                          onClick={() => navigate(`/messages/${person._id}`)}
                        >
                          Message
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!loading && !error && query.trim() && results.length === 0 && (
                <div style={s.emptyState}>
                  <div style={s.emptyIcon}>🔎</div>
                  <p style={s.emptyText}>No users found for "{query}"</p>
                  <p style={s.emptyHint}>Try a different name or username</p>
                </div>
              )}

              {/* Initial state */}
              {!query.trim() && (
                <div style={s.emptyState}>
                  <div style={s.emptyIcon}>👥</div>
                  <p style={s.emptyText}>Search for someone to get started</p>
                  <p style={s.emptyHint}>Type a name or @username above</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer style={s.footer}>✦ UNIVERSE — made with ♥ ✦</footer>
      </div>
    </>
  )
}

export default Explore