import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { getMySocieties, getSocietiesFeed } from '../../api/societies'
import { getPrivilegeLabel } from '../../utils/societyPrivileges'
import './societies.css'
import '../Feed.css'

const SocietiesHome = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [discoveries, setDiscoveries] = useState([])
  const [mySocieties, setMySocieties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const currentUserId = useMemo(() => {
    const token = user?.token || localStorage.getItem('token')
    if (!token) return null

    try {
      return JSON.parse(atob(token.split('.')[1])).userId || null
    } catch {
      return null
    }
  }, [user])

  useEffect(() => {
    const loadSocieties = async () => {
      try {
        setLoading(true)
        setError('')

        const [discoverData, mineData] = await Promise.all([
          getSocietiesFeed(),
          currentUserId ? getMySocieties() : Promise.resolve([])
        ])

        setDiscoveries(discoverData)
        setMySocieties(mineData)
      } catch {
        setError('Failed to load societies')
      } finally {
        setLoading(false)
      }
    }

    loadSocieties()
  }, [currentUserId])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const activeMemberships = mySocieties.filter((membership) => membership.status === 'active')
  const invitedMemberships = mySocieties.filter((membership) => membership.status === 'invited' || membership.status === 'pending')

  return (
    <div className="feed-page">
      <nav className="feed-nav">
        <div className="feed-nav-left">
          <span className="feed-logo">StudentNet</span>
          <Link to="/feed" className="nav-link">Feed</Link>
          <Link to="/create-post" className="nav-link">Create Post</Link>
          <Link to="/societies" className="nav-link">Societies</Link>
          <Link to="/settings" className="nav-link">Settings</Link>
        </div>
        <div className="feed-nav-right">
          <Link to="/societies/new" className="nav-btn">Create society</Link>
          <button onClick={handleLogout} className="nav-btn nav-btn-logout">Logout</button>
        </div>
      </nav>

      <div className="feed-container societies-container societies-container--wide">
        <section className="societies-hero">
          <div>
            <p className="societies-kicker">Campus communities</p>
            <h1>Societies</h1>
            <p className="societies-summary">
              Discover student groups, review the ones you belong to, and open a society page to manage it.
            </p>
          </div>
          <Link to="/societies/new" className="society-primary-link">
            Start a society
          </Link>
        </section>

        {error && <div className="feed-status feed-error">{error}</div>}
        {loading && <div className="feed-status">Loading societies...</div>}

        {!loading && (
          <div className="societies-grid">
            <section className="societies-panel">
              <div className="societies-panel-header">
                <h2>My societies</h2>
                <span>{activeMemberships.length} joined</span>
              </div>

              {mySocieties.length === 0 ? (
                <p className="societies-empty">You have not joined any societies yet.</p>
              ) : activeMemberships.length === 0 ? (
                <p className="societies-empty">You have no active memberships yet.</p>
              ) : (
                <div className="societies-list">
                  {activeMemberships.map((membership) => (
                    <button
                      key={membership._id}
                      className="society-card-button"
                      onClick={() => navigate(`/societies/${membership.societyId?.slug || membership.societyId?._id}`)}
                    >
                      <div className="society-card-top">
                        <div>
                          <strong>{membership.societyId?.name || 'Society'}</strong>
                          <span>@{membership.societyId?.slug || 'society'}</span>
                        </div>
                        <span className="society-role-badge">{getPrivilegeLabel(membership)}</span>
                      </div>
                      <p>{membership.societyId?.description || 'No description yet.'}</p>
                    </button>
                  ))}
                </div>
              )}
            </section>

            {invitedMemberships.length > 0 && (
              <section className="societies-panel">
                <div className="societies-panel-header">
                  <h2>Invitations</h2>
                  <span>{invitedMemberships.length} pending</span>
                </div>

                <div className="societies-list">
                  {invitedMemberships.map((membership) => (
                    <button
                      key={membership._id}
                      className="society-card-button"
                      onClick={() => navigate(`/societies/${membership.societyId?.slug || membership.societyId?._id}`)}
                    >
                      <div className="society-card-top">
                        <div>
                          <strong>{membership.societyId?.name || 'Society'}</strong>
                          <span>@{membership.societyId?.slug || 'society'}</span>
                        </div>
                        <span className="society-role-badge society-role-badge--accent">Accept invite</span>
                      </div>
                      <p>{membership.societyId?.description || 'No description yet.'}</p>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section className="societies-panel">
              <div className="societies-panel-header">
                <h2>Discover</h2>
                <span>{discoveries.length} public</span>
              </div>

              {discoveries.length === 0 ? (
                <p className="societies-empty">No societies have been created yet.</p>
              ) : (
                <div className="societies-list">
                  {discoveries.map((society) => (
                    <button
                      key={society._id}
                      className="society-card-button"
                      onClick={() => navigate(`/societies/${society.slug}`)}
                    >
                      <div className="society-card-top">
                        <div>
                          <strong>{society.name}</strong>
                          <span>@{society.slug}</span>
                        </div>
                        <span className="society-role-badge">{society.visibility}</span>
                        {society.settings?.inviteOnly && <span className="society-role-badge society-role-badge--accent">invite only</span>}
                      </div>
                      <p>{society.description || 'No description provided.'}</p>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  )
}

export default SocietiesHome