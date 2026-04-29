import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerUser } from '../api/auth'

/* ── Floating letter key ── */
const Key = ({ letter, color, border, style }) => (
  <div style={{
    position: 'absolute',
    width: 68,
    height: 68,
    borderRadius: 16,
    background: color,
    border: `3.5px solid ${border || '#111'}`,
    boxShadow: `4px 4px 0 ${border || '#111'}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Playfair Display', Georgia, serif",
    fontWeight: 900,
    fontSize: '2rem',
    color: '#111',
    userSelect: 'none',
    pointerEvents: 'none',
    animation: 'floatKey 3s ease-in-out infinite',
    ...style,
  }}>
    {letter}
  </div>
)

const Register = () => {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Name is required')
    if (!username.trim()) return setError('Username is required')
    if (!email.trim()) return setError('Email is required')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    try {
      setLoading(true)
      await registerUser(name, username, email, password)
      navigate('/login', { replace: true })
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  /* ── inline styles ── */
  const s = {
    page: {
      minHeight: '100vh',
      background: '#eef3e2',
      backgroundImage:
        'linear-gradient(#c8d8a0 1px,transparent 1px),linear-gradient(90deg,#c8d8a0 1px,transparent 1px)',
      backgroundSize: '24px 24px',
      display: 'flex',
      flexDirection: 'column',
    },
    nav: {
      background: '#d4e6a5',
      borderBottom: '2px solid #b5cc7a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 36px',
      height: 60,
      flexShrink: 0,
    },
    logo: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontWeight: 900,
      fontSize: '1.35rem',
      color: '#1a4a1a',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      textDecoration: 'none',
    },
    navLinks: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },
    navA: {
      textDecoration: 'none',
      fontWeight: 700,
      fontSize: '0.92rem',
      color: '#1a4a1a',
      padding: '6px 14px',
      fontFamily: "'Nunito', sans-serif",
    },
    btnOutline: {
      textDecoration: 'none',
      fontWeight: 700,
      fontSize: '0.88rem',
      color: '#1a4a1a',
      padding: '7px 18px',
      border: '2px solid #1a4a1a',
      borderRadius: 999,
      fontFamily: "'Nunito', sans-serif",
    },
    btnNavFill: {
      textDecoration: 'none',
      fontWeight: 700,
      fontSize: '0.88rem',
      color: '#fff',
      padding: '8px 20px',
      background: '#1a4a1a',
      borderRadius: 999,
      fontFamily: "'Nunito', sans-serif",
    },
    body: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
    },
    card: {
      background: '#f9faf4',
      borderRadius: 24,
      border: '2.5px solid #1a4a1a',
      borderTop: '8px solid #1a4a1a',
      boxShadow: '0 8px 40px rgba(0,0,0,0.13)',
      padding: '36px 40px 32px',
      width: '100%',
      maxWidth: 420,
      zIndex: 10,
      position: 'relative',
      fontFamily: "'Nunito', sans-serif",
    },
    title: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontWeight: 900,
      fontSize: '1.75rem',
      color: '#1a4a1a',
      textAlign: 'center',
      marginBottom: 4,
    },
    sub: {
      textAlign: 'center',
      color: '#555',
      fontSize: '0.9rem',
      fontWeight: 600,
      marginBottom: 20,
    },
    avatar: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginBottom: 20,
    },
    avatarCircle: {
      width: 78,
      height: 78,
      borderRadius: '50%',
      background: '#a5d6a7',
      border: '3px solid #43a047',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
    },
    avatarLabel: {
      marginTop: 6,
      fontSize: '0.8rem',
      color: '#2e7d32',
      fontWeight: 700,
    },
    fieldWrap: { marginBottom: 14 },
    label: {
      display: 'block',
      fontWeight: 700,
      fontSize: '0.85rem',
      color: '#1a1a1a',
      marginBottom: 5,
    },
    input: {
      width: '100%',
      padding: '11px 14px',
      border: '2px solid #43a047',
      borderRadius: 10,
      background: '#f0f7f0',
      fontFamily: "'Nunito', sans-serif",
      fontSize: '0.92rem',
      color: '#1a1a1a',
      outline: 'none',
      boxSizing: 'border-box',
    },
    pwWrap: { position: 'relative' },
    pwInput: {
      width: '100%',
      padding: '11px 42px 11px 14px',
      border: '2px solid #43a047',
      borderRadius: 10,
      background: '#f0f7f0',
      fontFamily: "'Nunito', sans-serif",
      fontSize: '0.92rem',
      color: '#1a1a1a',
      outline: 'none',
      boxSizing: 'border-box',
    },
    pwBtn: {
      position: 'absolute',
      right: 12,
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1.1rem',
      color: '#888',
    },
    error: {
      background: '#ffeef0',
      border: '1.5px solid #f48fb1',
      borderRadius: 10,
      padding: '10px 14px',
      color: '#c62828',
      fontSize: '0.85rem',
      fontWeight: 700,
      marginBottom: 14,
    },
    btnPrimary: {
      width: '100%',
      padding: '13px',
      background: '#1a4a1a',
      color: '#fff',
      border: 'none',
      borderRadius: 12,
      fontFamily: "'Nunito', sans-serif",
      fontWeight: 800,
      fontSize: '1rem',
      cursor: 'pointer',
      marginTop: 6,
      letterSpacing: '0.02em',
    },
    divider: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      margin: '16px 0',
      color: '#aaa',
      fontSize: '0.82rem',
    },
    btnGoogle: {
      width: '100%',
      padding: '11px',
      border: '2px solid #ddd',
      borderRadius: 12,
      background: '#fff',
      fontFamily: "'Nunito', sans-serif",
      fontWeight: 700,
      fontSize: '0.93rem',
      color: '#1a1a1a',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    loginLink: {
      textAlign: 'center',
      marginTop: 16,
      fontSize: '0.85rem',
      color: '#555',
    },
    footer: {
      textAlign: 'center',
      padding: 18,
      fontSize: '0.82rem',
      color: '#2e7d32',
      fontWeight: 700,
      fontFamily: "'Nunito', sans-serif",
    },
  }

  return (
    <>
      {/* Google Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes floatKey {
          0%,100% { transform: translateY(0) rotate(var(--rot,0deg)); }
          50%      { transform: translateY(-7px) rotate(var(--rot,0deg)); }
        }
        input::placeholder { color: #aaa; }
        .divider-line { flex:1; height:1px; background:#ddd; }
      `}</style>

      <div style={s.page}>

        {/* ── NAV ── */}
        <nav style={s.nav}>
          <Link to="/" style={s.logo}>★ UNIVERSE</Link>
          <div style={s.navLinks}>
            <Link to="/"       style={s.navA}>Home</Link>
            <Link to="/about"  style={s.navA}>About</Link>
            <Link to="/contact" style={s.navA}>Contact</Link>
            <Link to="/login"    style={s.btnOutline}>Log In</Link>
            <Link to="/register" style={s.btnNavFill}>Sign Up</Link>
          </div>
        </nav>

        {/* ── KEYS + FORM ── */}
        <div style={s.body}>

          {/* Left: U N I V */}
          <Key letter="U" color="#f4845f" style={{ left:'5%', top:'8%',  '--rot':'-10deg', animationDelay:'0s'   }} />
          <Key letter="N" color="#f6c94e" style={{ left:'9%', top:'30%', '--rot':'8deg',   animationDelay:'0.4s' }} />
          <Key letter="I" color="#b16ae8" style={{ left:'4%', top:'53%', '--rot':'-6deg',  animationDelay:'0.8s' }} />
          <Key letter="V" color="#5b9af5" style={{ left:'9%', top:'74%', '--rot':'12deg',  animationDelay:'0.2s' }} />

          {/* Right: E R S E */}
          <Key letter="E" color="#e85b5b" style={{ right:'7%', top:'8%',  '--rot':'10deg',  animationDelay:'0.6s' }} />
          <Key letter="R" color="#49c4a0" style={{ right:'4%', top:'30%', '--rot':'-8deg',  animationDelay:'1.0s' }} />
          <Key letter="S" color="#f6c94e" style={{ right:'8%', top:'53%', '--rot':'6deg',   animationDelay:'0.3s' }} />
          <Key letter="E" color="#5b9af5" style={{ right:'4%', top:'74%', '--rot':'-12deg', animationDelay:'0.9s' }} />

          {/* Decorations */}
          {[
            { emoji:'✏️', left:'7%',  top:'88%', delay:'0.5s' },
            { emoji:'💬', right:'9%', top:'88%', delay:'1.2s' },
            { emoji:'⭐', left:'18%', top:'18%', delay:'0.7s' },
            { emoji:'🌟', left:'20%', top:'64%', delay:'1.5s' },
            { emoji:'✉️', right:'15%',top:'65%', delay:'0.1s' },
          ].map(({ emoji, delay, ...pos }, i) => (
            <div key={i} style={{
              position:'absolute', fontSize:'1.5rem', pointerEvents:'none',
              animation:`floatKey 4s ease-in-out infinite`, animationDelay: delay, ...pos,
            }}>{emoji}</div>
          ))}

          {/* ── CARD ── */}
          <div style={s.card}>
            <div style={s.title}>Join UNIVERSE!</div>
            <div style={s.sub}>Connect. Collaborate. Create.</div>

            {/* Avatar */}
            <div style={s.avatar}>
              <div style={s.avatarCircle}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="#2e7d32">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </div>
              <span style={s.avatarLabel}>Upload photo</span>
            </div>

            {/* Error */}
            {error && <div style={s.error}>⚠ {error}</div>}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              <div style={s.fieldWrap}>
                <label style={s.label}>Name</label>
                <input style={s.input} type="text" placeholder="Your full name"
                  value={name} onChange={e => setName(e.target.value)} />
              </div>

              <div style={s.fieldWrap}>
                <label style={s.label}>Username</label>
                <input style={s.input} type="text" placeholder="@username"
                  value={username} onChange={e => setUsername(e.target.value)} />
              </div>

              <div style={s.fieldWrap}>
                <label style={s.label}>Email</label>
                <input style={s.input} type="email" placeholder="your@email.com"
                  value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div style={s.fieldWrap}>
                <label style={s.label}>Password</label>
                <div style={s.pwWrap}>
                  <input style={s.pwInput} type={showPw ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    value={password} onChange={e => setPassword(e.target.value)} />
                  <button type="button" style={s.pwBtn} onClick={() => setShowPw(p => !p)}>
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <button type="submit" style={{
                ...s.btnPrimary,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }} disabled={loading}>
                {loading ? 'Creating Account…' : 'Create Account →'}
              </button>
            </form>

            <div style={s.divider}>
              <div className="divider-line" />
              or
              <div className="divider-line" />
            </div>

            <div style={s.loginLink}>
              Already have an account?{' '}
              <Link to="/login" style={{ color:'#1a4a1a', fontWeight:800, textDecoration:'none' }}>
                Log in here
              </Link>
            </div>
          </div>
        </div>

        <footer style={s.footer}>✦ UNIVERSE — made with ♥ ✦</footer>
      </div>
    </>
  )
}

export default Register