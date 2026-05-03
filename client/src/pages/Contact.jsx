import { Link } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import Navbar from '../components/Navbar'
import './Contact.css'

const Key = ({ letter, color, style }) => (
  <div
    className="contact-key"
    style={{
      background: color,
      ...style,
    }}
  >
    {letter}
  </div>
)

const Contact = () => {
  const { user } = useAuth()
  const isLoggedIn = Boolean(user?.token || localStorage.getItem('token'))

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Nunito:wght@400;600;700;800&display=swap"
        rel="stylesheet"
      />

      <div className="contact-page position-relative overflow-hidden d-flex flex-column">
        <div className="contact-background" />

        <Navbar links={isLoggedIn ? [
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
        ]} />

        <div className="contact-floating" aria-hidden="true">
          <Key letter="C" color="#f4845f" style={{ left: '1%', top: '20%' }} />
          <Key letter="O" color="#f6c94e" style={{ left: '3%', top: '72%' }} />
          <Key letter="!" color="#5b9af5" style={{ right: '3%', top: '22%' }} />
          <Key letter="?" color="#49c4a0" style={{ right: '1%', top: '68%' }} />
        </div>

        <main className="contact-shell container-xl flex-grow-1">
          <section className="contact-card card shadow-sm border-0">
            <span className="contact-badge badge rounded-pill text-uppercase">Contact</span>
            <h1>Let us know what you need</h1>
            <p>
              Have feedback or questions about UNIVERSE? Send a note and we will help.
            </p>

            <div className="contact-details d-grid gap-3">
              <div>
                <span>Email</span>
                <strong>support@universe.edu</strong>
              </div>
              <div>
                <span>Office</span>
                <strong>Student Center, Room 214</strong>
              </div>
              <div>
                <span>Hours</span>
                <strong>Mon-Fri, 9:00 AM - 5:00 PM</strong>
              </div>
            </div>
          </section>

          <aside className="contact-card contact-card-alt card shadow-sm border-0">
            <h2>Quick links</h2>
            <p>Need to jump back in quickly? These will help.</p>
            <div className="contact-actions d-flex flex-wrap gap-2">
              {isLoggedIn ? (
                <>
                  <Link to="/feed" className="contact-btn contact-btn-primary btn btn-success rounded-pill">Open Feed</Link>
                  <Link to="/messages" className="contact-btn contact-btn-outline btn btn-outline-success rounded-pill">Open Messages</Link>
                </>
              ) : (
                <>
                  <Link to="/register" className="contact-btn contact-btn-primary btn btn-success rounded-pill">Create Account</Link>
                  <Link to="/login" className="contact-btn contact-btn-outline btn btn-outline-success rounded-pill">Log In</Link>
                </>
              )}
            </div>
          </aside>
        </main>
      </div>
    </>
  )
}

export default Contact
