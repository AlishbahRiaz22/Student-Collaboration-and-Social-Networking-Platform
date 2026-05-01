import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import SettingsLayout from './SettingsLayout'

const getCurrentUserId = (token) => {
  if (!token) return null
  try {
    return JSON.parse(atob(token.split('.')[1])).userId || null
  } catch {
    return null
  }
}

const s = {
  card: {
    background: '#f9faf4', borderRadius: 18, border: '2px solid #dce8c0',
    borderTop: '5px solid #43a047', padding: '20px 22px',
    display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16,
  },
  cardIcon: { fontSize: '1.6rem' },
  cardTitle: {
    fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
    fontSize: '1.05rem', color: '#1a4a1a', margin: 0,
  },
  rowFirst: { display: 'grid', gap: 4 },
  row: { display: 'grid', gap: 4, paddingTop: 10, borderTop: '1px solid #dce8c0' },
  rowKey:  { fontWeight: 700, fontSize: '0.85rem', color: '#1a4a1a' },
  rowVal:  { color: '#5a7a3a', fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.5 },
  linkRow: { display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 6 },
  link:    {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    color: '#1a4a1a', textDecoration: 'none',
    fontWeight: 800, fontSize: '0.85rem', fontFamily: "'Nunito', sans-serif",
  },
}

const AccountSettings = () => {
  const { user } = useAuth()
  const currentUserId = getCurrentUserId(user?.token)
  const sessionSummary = user?.token ? 'You are signed in on this device.' : 'No active session found.'

  return (
    <SettingsLayout
      title="Account"
      description="Keep track of the account identity linked to this session and the actions available to you."
    >
      <style>{`.as-link:hover { text-decoration: underline; }`}</style>

      <div style={s.card}>
        <span style={s.cardIcon}>🔐</span>
        <h3 style={s.cardTitle}>Session</h3>

        <div style={s.rowFirst}>
          <span style={s.rowKey}>Session status</span>
          <span style={s.rowVal}>🟢 {sessionSummary}</span>
        </div>
        <div style={s.row}>
          <span style={s.rowKey}>Local identity</span>
          <span style={s.rowVal}>{currentUserId ? `User ID: ${currentUserId}` : 'Signed in user'}</span>
        </div>
        <div style={s.row}>
          <span style={s.rowKey}>Token storage</span>
          <span style={s.rowVal}>Authentication is stored in localStorage for this browser profile.</span>
        </div>

        <div style={s.linkRow}>
          <Link to="/feed" style={s.link} className="as-link">← Back to feed</Link>
          <Link to={currentUserId ? `/profile/${currentUserId}` : '/feed'} style={s.link} className="as-link">
            Open profile →
          </Link>
        </div>
      </div>
    </SettingsLayout>
  )
}

export default AccountSettings