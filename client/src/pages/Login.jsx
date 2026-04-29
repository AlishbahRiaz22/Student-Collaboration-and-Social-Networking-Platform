import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { loginUser } from '../api/auth'
import { useAuth } from '../context/useAuth'

const Key = ({ letter, color, style }) => (
  <div
    style={{
      position: 'absolute',
      width: 68,
      height: 68,
      borderRadius: 16,
      background: color,
      border: '3.5px solid #111',
      boxShadow: '4px 4px 0 #111',
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
    }}
  >
    {letter}
  </div>
)


const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
   const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Frontend validation
    if (!email.trim()) return setError('Email is required')
    if (!password) return setError('Password is required')

    try {
      setLoading(true)
      const data = await loginUser(email, password)
      login({ token: data.token }, data.token)
      localStorage.setItem('token', data.token)
      navigate('/feed', { replace: true })
    } catch (err) {
  setError(err.response?.data?.error || 'Login failed. Check your credentials.')
} finally {
  setLoading(false)
}
  }
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
    },

    logo: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontWeight: 900,
      fontSize: '1.35rem',
      color: '#1a4a1a',
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

    btnFill: {
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
      marginBottom: 24,
    },

    fieldWrap: { marginBottom: 14 },

    label: {
      display: 'block',
      fontWeight: 700,
      fontSize: '0.85rem',
      marginBottom: 5,
    },

    input: {
      width: '100%',
      padding: '11px 14px',
      border: '2px solid #43a047',
      borderRadius: 10,
      background: '#f0f7f0',
      fontSize: '0.92rem',
      boxSizing: 'border-box',
      outline: 'none',
      color: '#111', 
    },

    pwWrap: { position: 'relative' },

    pwBtn: {
      position: 'absolute',
      right: 12,
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      fontSize: '1.1rem',
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
      fontWeight: 800,
      fontSize: '1rem',
      cursor: 'pointer',
      marginTop: 8,
    },

    registerLink: {
      textAlign: 'center',
      marginTop: 18,
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
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Nunito:wght@400;600;700;800&display=swap"
        rel="stylesheet"
      />

      <style>{`
        @keyframes floatKey {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }

        input::placeholder {
          color:#aaa;
        }
      `}</style>

      <div style={s.page}>
        {/* NAVBAR */}
        <nav style={s.nav}>
          <Link to="/" style={s.logo}>★ UNIVERSE</Link>

          <div style={s.navLinks}>
            <Link to="/" style={s.navA}>Home</Link>
            <Link to="/about" style={s.navA}>About</Link>
            <Link to="/contact" style={s.navA}>Contact</Link>
            <Link to="/login" style={s.btnFill}>Log In</Link>
            <Link to="/register" style={s.btnOutline}>Sign Up</Link>
          </div>
        </nav>

        {/* BODY */}
        <div style={s.body}>
          {/* floating blocks */}
          <Key letter="L" color="#f4845f" style={{ left:'6%', top:'12%' }} />
          <Key letter="O" color="#f6c94e" style={{ left:'10%', top:'35%' }} />
          <Key letter="G" color="#b16ae8" style={{ left:'6%', top:'65%' }} />

          <Key letter="I" color="#5b9af5" style={{ right:'8%', top:'18%' }} />
          <Key letter="N" color="#49c4a0" style={{ right:'6%', top:'55%' }} />

          {/* LOGIN CARD */}
          <div style={s.card}>
            <div style={s.title}>Welcome Back!</div>
            <div style={s.sub}>Log in to continue to UNIVERSE</div>

            {error && <div style={s.error}>⚠ {error}</div>}

            <form onSubmit={handleSubmit}>
              <div style={s.fieldWrap}>
                <label style={s.label}>Email</label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={s.input}
                />
              </div>

              <div style={s.fieldWrap}>
                <label style={s.label}>Password</label>

                <div style={s.pwWrap}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={s.input}
                  />

                  <button
                    type="button"
                    style={s.pwBtn}
                    onClick={() => setShowPw(!showPw)}
                  >
                    {showPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  ...s.btnPrimary,
                  opacity: loading ? 0.7 : 1,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Logging in...' : 'Login →'}
              </button>
            </form>

            <div style={s.registerLink}>
              Don’t have an account?{' '}
              <Link
                to="/register"
                style={{
                  color: '#1a4a1a',
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                Register here
              </Link>
            </div>
          </div>
        </div>

        <footer style={s.footer}>✦ UNIVERSE — made with ♥ ✦</footer>
      </div>
    </>
  )
}

export default Login