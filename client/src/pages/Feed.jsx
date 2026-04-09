import { useMemo, useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import CreatePostForm from '../components/CreatePostForm'
import Avatar from '../components/Avatar'
import PostCard from '../components/PostCard'
import api from '../api/index'
import './Feed.css'

const Feed = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const currentUserId = useMemo(() => {
    const token = user?.token || localStorage.getItem('token')
    if (!token) return null
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.userId || null
    } catch {
      return null
    }
  }, [user])

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedMode, setFeedMode] = useState('all')  // 'all' or 'smart' — Day 5
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const url = feedMode === 'smart' ? '/posts/feed' : '/posts'
      const res = await api.get(url)
      setPosts(res.data)
    } catch {
      setError('Failed to load posts')
    } finally {
      setLoading(false)
    }
  }, [feedMode])

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  const fetchSuggestions = useCallback(async () => {
    if (!currentUserId) {
      setSuggestedUsers([])
      return
    }

    try {
      setSuggestionsLoading(true)
      const res = await api.get('/users/suggestions')
      setSuggestedUsers(res.data.filter((person) => person._id !== currentUserId && !person.isFollowing))
    } catch {
      setSuggestedUsers([])
    } finally {
      setSuggestionsLoading(false)
    }
  }, [currentUserId])

  useEffect(() => {
    fetchSuggestions()
  }, [fetchSuggestions])

  const handleFollowSuggestion = async (userId) => {
    const previousUsers = suggestedUsers

    setSuggestedUsers((prev) => prev.map((u) => (
      u._id === userId ? { ...u, isFollowing: true } : u
    )))

    try {
      await api.put(`/users/${userId}/follow`)
      if (feedMode === 'smart') {
        fetchPosts()
      }
    } catch {
      setSuggestedUsers(previousUsers)
    }
  }

  const handleProfileClick = () => {
    if (!currentUserId) return
    navigate(`/profile/${currentUserId}`)
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="feed-page">

      {/* Top navbar */}
      <nav className="feed-nav">
        <div className="feed-nav-left">
          <span className="feed-logo">StudentNet</span>
          <Link to="/create-post" className="nav-link">Create Post</Link>
          <Link to="/explore" className="nav-link">Explore</Link>
        </div>
        <div className="feed-nav-right">
          <button onClick={handleProfileClick} disabled={!currentUserId} className="nav-btn">
            Profile
          </button>
          <button onClick={handleLogout} className="nav-btn nav-btn-logout">
            Logout
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="feed-container">

        {/* Feed mode toggle — Day 5 smart feed */}
        {currentUserId && (
          <div className="feed-toggle">
            <button
              className={`toggle-btn ${feedMode === 'all' ? 'active' : ''}`}
              onClick={() => setFeedMode('all')}
            >
              All Posts
            </button>
            <button
              className={`toggle-btn ${feedMode === 'smart' ? 'active' : ''}`}
              onClick={() => setFeedMode('smart')}
            >
              My Feed
            </button>
          </div>
        )}

        {/* Create post form — only if logged in */}
        {currentUserId && (
          <CreatePostForm onPostCreated={fetchPosts} />
        )}

        {currentUserId && (
          <section className="suggestions-strip-card">
            <div className="suggestions-strip-header">
              <h3 className="suggestions-title">Suggested People</h3>
              <span className="suggestions-subtitle">Discover classmates to follow</span>
            </div>

            {suggestionsLoading && <p className="suggestions-status">Loading suggestions...</p>}
            {!suggestionsLoading && suggestedUsers.length === 0 && (
              <p className="suggestions-status">No suggestions right now.</p>
            )}

            {!suggestionsLoading && suggestedUsers.length > 0 && (
              <div className="suggestions-row" role="list">
                {suggestedUsers.map((person) => (
                  <div key={person._id} className="suggestion-tile" role="listitem">
                    <div className="suggestion-info">
                      <Avatar
                        src={person.avatar}
                        name={person.name || person.username}
                        size={40}
                        className="suggestion-avatar"
                      />
                      <div className="suggestion-name">{person.name || 'Student'}</div>
                      <div className="suggestion-username">@{person.username}</div>
                    </div>
                    <div className="suggestion-actions">
                      <button
                        className="suggestion-btn suggestion-btn-follow"
                        onClick={() => handleFollowSuggestion(person._id)}
                        disabled={person.isFollowing}
                      >
                        {person.isFollowing ? 'Following' : 'Follow'}
                      </button>
                      <button
                        className="suggestion-btn suggestion-btn-view"
                        onClick={() => navigate(`/profile/${person._id}`)}
                      >
                        View Profile
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Posts list */}
        {loading && (
          <div className="feed-status">Loading posts...</div>
        )}
        {error && (
          <div className="feed-status feed-error">{error}</div>
        )}
        {!loading && posts.length === 0 && feedMode === 'all' && (
          <div className="feed-status">No posts yet. Be the first to post!</div>
        )}
        {!loading && posts.length === 0 && feedMode === 'smart' && (
          <div className="feed-status">Follow some users to see their posts here.</div>
        )}

        {posts.map(post => (
          <PostCard
            key={post._id}
            post={post}
            currentUserId={currentUserId}
            onDelete={(deletedId) => setPosts(posts.filter(p => p._id !== deletedId))}
            onUpdate={(updated) => setPosts(posts.map(p => p._id === updated._id ? updated : p))}
          />
        ))}
      </div>
    </div>
  )
}

export default Feed