import { Link } from 'react-router-dom'
import SettingsLayout from './SettingsLayout'

const cards = [
  {
    to: '/settings/account',
    title: 'Account',
    body: 'Review your profile identity, active session, and sign-out controls.'
  },
  {
    to: '/settings/notifications',
    title: 'Notifications',
    body: 'Tune message alerts, digest timing, and in-app noise.'
  },
  {
    to: '/settings/privacy',
    title: 'Privacy',
    body: 'Decide who can reach you, see your presence, and view your profile.'
  },
  {
    to: '/settings/appearance',
    title: 'Appearance',
    body: 'Adjust theme, density, and motion preferences for the UI.'
  }
]

const SettingsHome = () => (
  <SettingsLayout
    title="Settings overview"
    description="A central place for the preferences that matter most in a student collaboration app."
  >
    <div className="settings-grid">
      {cards.map((card) => (
        <section key={card.to} className="settings-card">
          <h3>{card.title}</h3>
          <p>{card.body}</p>
          <Link to={card.to} className="settings-card-link">
            Open {card.title.toLowerCase()}
          </Link>
        </section>
      ))}
    </div>
  </SettingsLayout>
)

export default SettingsHome