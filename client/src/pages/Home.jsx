import { Link } from 'react-router-dom'
import './Home.css'

const highlights = [
  {
    title: 'Study together',
    text: 'A shared space for posts, profiles, messages, and quick coordination.'
  },
  {
    title: 'Stay connected',
    text: 'Open the feed, message classmates, and keep conversations in one place.'
  },
  {
    title: 'Prototype ready',
    text: 'This landing page is intentionally simple so it can evolve later.'
  }
]

const Home = () => {
  return (
    <div className="home-page">
      <div className="home-background" />

      <main className="home-shell">
        <section className="home-hero">
          <div className="home-badge">Student Collaboration Platform</div>
          <h1>StudentNet</h1>
          <p className="home-lead">
            A lightweight campus network for posts, messages, and class connections.
            This is the first-pass showcase page, built to route users into login or registration.
          </p>

          <div className="home-actions">
            <Link to="/login" className="home-btn home-btn-primary">
              Login
            </Link>
            <Link to="/register" className="home-btn home-btn-secondary">
              Register
            </Link>
          </div>

          <div className="home-pills" aria-label="Platform highlights">
            <span>Feed</span>
            <span>Messages</span>
            <span>Profiles</span>
            <span>Explore</span>
          </div>
        </section>

        <aside className="home-showcase">
          <div className="home-showcase-card home-showcase-main">
            <div className="home-showcase-topline">Live preview</div>
            <h2>Classmates, posts, and conversations in one place</h2>
            <p>
              This mockup gives users a clear entry point while the richer experience is built out later.
            </p>

            <div className="home-mock-feed">
              <div className="home-mock-row">
                <div className="home-mock-avatar">A</div>
                <div>
                  <strong>Alex</strong>
                  <span>shared a project update</span>
                </div>
              </div>
              <div className="home-mock-row">
                <div className="home-mock-avatar home-mock-avatar-alt">M</div>
                <div>
                  <strong>Mina</strong>
                  <span>sent a message about study group notes</span>
                </div>
              </div>
            </div>
          </div>

          <div className="home-grid">
            {highlights.map((item) => (
              <div key={item.title} className="home-showcase-card home-mini-card">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </div>
  )
}

export default Home