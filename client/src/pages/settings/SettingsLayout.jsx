import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import '../Feed.css'
import '../Settings.css'

const sectionLinks = [
  { to: '/settings', label: 'Overview', end: true },
  { to: '/settings/account', label: 'Account' },
  { to: '/settings/notifications', label: 'Notifications' },
  { to: '/settings/privacy', label: 'Privacy' },
  { to: '/settings/appearance', label: 'Appearance' }
]

const SettingsLayout = ({ title, description, children }) => {
  const navigate = useNavigate()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="feed-page">
      <nav className="feed-nav">
        <div className="feed-nav-left">
          <span className="feed-logo">StudentNet</span>
          <Link to="/feed" className="nav-link">Feed</Link>
          <Link to="/explore" className="nav-link">Search</Link>
          <Link to="/messages" className="nav-link">Messages</Link>
          <Link to="/settings" className="nav-link">Settings</Link>
        </div>
        <div className="feed-nav-right">
          <Link to="/feed" className="nav-btn">Back to feed</Link>
          <button onClick={handleLogout} className="nav-btn nav-btn-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="feed-container">
        <div className="settings-shell">
          <aside className="settings-sidebar">
            <p className="settings-sidebar-title">Settings</p>
            {sectionLinks.map((section) => (
              <NavLink
                key={section.to}
                to={section.to}
                end={section.end}
                className={({ isActive }) => `settings-sidebar-link${isActive ? ' active' : ''}`}
              >
                {section.label}
              </NavLink>
            ))}
          </aside>

          <main className="settings-content">
            <section className="settings-hero">
              <h1 style={{ margin: 0, fontSize: '1.7rem' }}>{title}</h1>
              <p>{description}</p>
            </section>
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

export default SettingsLayout