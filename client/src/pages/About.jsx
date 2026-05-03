import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import Navbar from '../components/Navbar'
import './About.css'

const Key = ({ letter, color, style }) => (
  <div
    className="about-key"
    style={{
      background: color,
      ...style,
    }}
  >
    {letter}
  </div>
)

const About = () => {
  const { user } = useAuth()
  const isLoggedIn = Boolean(user?.token || localStorage.getItem('token'))

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Nunito:wght@400;600;700;800&display=swap"
        rel="stylesheet"
      />

      <div className="about-page position-relative overflow-hidden d-flex flex-column">
        <div className="about-background" />

        <Navbar
          links={isLoggedIn ? [
             { to: '/feed', label: 'Feed' },
          { to: '/create-post', label: 'Create Post' },
          { to: '/societies', label: 'Societies' },
          { to: '/explore', label: 'Explore' },
          { to: '/messages', label: 'Messages' },
          { to: '/settings', label: 'Settings' },
          { to: '/about', label: 'About' },
          { to: '/contact', label: 'Contact' },
          ] : [
             { to: '/', label: 'Home', end: true },
            { to: '/contact', label: 'Contact' },
            { to: '/about', label: 'About' },
          ]}
        />

        <div className="about-floating" aria-hidden="true">
          <Key letter="A" color="#f4845f" style={{ left: '1%', top: '22%' }} />
          <Key letter="B" color="#f6c94e" style={{ left: '3%', top: '68%' }} />
          <Key letter="T" color="#5b9af5" style={{ right: '3%', top: '18%' }} />
          <Key letter="!" color="#49c4a0" style={{ right: '1%', top: '70%' }} />
        </div>

        <main className="about-shell container-xl flex-grow-1">
          <section className="about-card card shadow-sm border-0">
            <span className="about-badge badge rounded-pill text-uppercase">About</span>
            <h1>Built for campus collaboration</h1>
            <p>
              UNIVERSE is a shared space for posts, profiles, societies, and real-time messages.
              It keeps classwork, group discussions, and announcements in one vibrant feed.
            </p>
            <p>
              The platform is designed to feel friendly and fast, so classmates can connect without
              losing the flow of their day.
            </p>
            <div className="about-actions d-flex flex-wrap gap-2">
              {isLoggedIn ? (
                <>
                  <Link to="/feed" className="about-btn about-btn-primary btn btn-success rounded-pill">Open Feed</Link>
                  <Link to="/societies" className="about-btn about-btn-outline btn btn-outline-success rounded-pill">Browse Societies</Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="about-btn about-btn-primary btn btn-success rounded-pill">Create Account</Link>
                  <Link to="/login" className="about-btn about-btn-outline btn btn-outline-success rounded-pill">Log In</Link>
                </>
              )}
            </div>
          </section>

          <aside className="about-card about-card-alt card shadow-sm border-0">
            <h2>What you can do</h2>
            <ul className="list-group list-group-flush">
              <li>Share updates, projects, and campus wins.</li>
              <li>Discover societies and upcoming events.</li>
              <li>Message classmates instantly with live chat.</li>
              <li>Manage your profile and privacy settings.</li>
            </ul>
          </aside>
        </main>
      </div>
    </>
  )
}

export default About
