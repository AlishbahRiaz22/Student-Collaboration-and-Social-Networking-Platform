import { Link } from 'react-router-dom'
import SettingsLayout from './SettingsLayout'

const cards = [
  {
    to: '/settings/account',
    icon: '👤',
    title: 'Account',
    body: 'Review your profile identity, active session, and sign-out controls.',
  },
  {
    to: '/settings/notifications',
    icon: '🔔',
    title: 'Notifications',
    body: 'Tune message alerts, digest timing, and in-app notification preferences.',
  },
  {
    to: '/settings/privacy',
    icon: '🔒',
    title: 'Privacy',
    body: 'Decide who can reach you, see your presence, and view your profile.',
  },
  {
    to: '/settings/appearance',
    icon: '🎨',
    title: 'Appearance',
    body: 'Adjust theme, density, and motion preferences for the UI.',
  },
]

const s = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 16,
  },
  card: {
    background: '#f9faf4', borderRadius: 18, border: '2px solid #dce8c0',
    borderTop: '5px solid #43a047', padding: '20px 22px',
    display: 'flex', flexDirection: 'column', gap: 8,
    transition: 'all 0.15s',
  },
  cardIcon: { fontSize: '1.6rem' },
  cardTitle: {
    fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
    fontSize: '1.05rem', color: '#1a4a1a', margin: 0,
  },
  cardBody: {
    color: '#5a7a3a', fontSize: '0.88rem', fontWeight: 600,
    lineHeight: 1.6, margin: 0, flex: 1,
  },
  cardLink: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    marginTop: 6, color: '#1a4a1a', textDecoration: 'none',
    fontWeight: 800, fontSize: '0.85rem',
    fontFamily: "'Nunito', sans-serif",
  },
}

const SettingsHome = () => (
  <SettingsLayout
    title="Settings Overview"
    description="A central place for the preferences that matter most."
  >
    <style>{`
      .sh-card:hover { border-color:#1a4a1a !important; transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,0.09) !important; }
      .sh-link:hover { text-decoration:underline; }
      @media(max-width:600px){ .sh-grid{ grid-template-columns:1fr !important; } }
    `}</style>

    <div style={s.grid} className="sh-grid">
      {cards.map(card => (
        <div key={card.to} style={s.card} className="sh-card">
          <span style={s.cardIcon}>{card.icon}</span>
          <h3 style={s.cardTitle}>{card.title}</h3>
          <p style={s.cardBody}>{card.body}</p>
          <Link to={card.to} style={s.cardLink} className="sh-link">
            Open {card.title.toLowerCase()} →
          </Link>
        </div>
      ))}
    </div>
  </SettingsLayout>
)

export default SettingsHome