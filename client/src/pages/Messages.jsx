import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/index'
import { useAuth } from '../context/useAuth'
import Avatar from '../components/Avatar'
import { formatDateTime } from '../utils/formatters'
import './Feed.css'
import './Profile.css'

const s = {
  nav: {
    position: 'fixed', top: 0, left: 0, right: 0, height: 60,
    background: '#d4e6a5', borderBottom: '2.5px solid #b5cc7a',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 36px', zIndex: 100,
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: 4 },
  navRight: { display: 'flex', alignItems: 'center', gap: 8 },
  logo: {
    fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
    fontSize: '1.35rem', color: '#1a4a1a', textDecoration: 'none', marginRight: 14,
  },
  navA: {
    textDecoration: 'none', fontWeight: 700, fontSize: '0.92rem',
    color: '#1a4a1a', padding: '6px 14px', fontFamily: "'Nunito', sans-serif",
  },
  btnOutline: {
    fontWeight: 700, fontSize: '0.88rem', color: '#1a4a1a', padding: '7px 18px',
    border: '2px solid #1a4a1a', borderRadius: 999, background: 'none',
    cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
  },
  btnFill: {
    fontWeight: 700, fontSize: '0.88rem', color: '#fff', padding: '8px 20px',
    background: '#1a4a1a', border: 'none', borderRadius: 999,
    cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
  },
}
const Key = ({ letter, color, style }) => (
  <div
    style={{
      position: 'absolute',
      width: 60,
      height: 60,
      borderRadius: 14,
      background: color,
      border: '3px solid #111',
      boxShadow: '3px 3px 0 #111',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Playfair Display', Georgia, serif",
      fontWeight: 900,
      fontSize: '1.7rem',
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

const Messages = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user, socket, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const currentUserId = useMemo(() => user?.token ? JSON.parse(atob(user.token.split('.')[1])).userId : null, [user?.token])

  useEffect(() => {
    if (!userId) return

    const fetchThread = async () => {
      try {
        setLoading(true)
        setError('')

        const profileRes = await api.get(`/users/${userId}`)
        setProfile(profileRes.data)

        const conversationRes = await api.post('/conversations', { participantId: userId })
        const nextConversation = conversationRes.data
        setConversation(nextConversation)

        const messagesRes = await api.get(`/conversations/${nextConversation._id}/messages`)
        setMessages(messagesRes.data)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load conversation')
      } finally {
        setLoading(false)
      }
    }

    fetchThread()
  }, [userId])

  useEffect(() => {
    if (!socket || !conversation?._id) return undefined

    socket.emit('conversation:join', { conversationId: conversation._id })

    const handleIncomingMessage = (incomingMessage) => {
      if (String(incomingMessage.conversationId) !== String(conversation._id)) return
      setMessages((prev) => {
        if (prev.some((message) => message._id === incomingMessage._id)) return prev
        return [...prev, incomingMessage]
      })
    }

    socket.on('message:new', handleIncomingMessage)

    return () => {
      socket.off('message:new', handleIncomingMessage)
      socket.emit('conversation:leave', { conversationId: conversation._id })
    }
  }, [socket, conversation?._id])

  const handleSend = async (event) => {
    event.preventDefault()

    if (!conversation?._id || !content.trim() || sending) return

    try {
      setSending(true)
      setError('')

      await api.post('/messages', {
        conversationId: conversation._id,
        content: content.trim()
      })

      setContent('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  if (loading) {
    return (
      <div className="feed-page">
        <nav style={s.nav}>
          <div style={s.navLeft}>
            <Link to="/" style={s.logo}>★ UNIVERSE</Link>
            <Link to="/Feed"        style={s.navA}>Feed</Link>
            <Link to="/create-post" style={s.navA}>Create Post</Link>
            <Link to="/societies"   style={s.navA}>Societies</Link>
            <Link to="/explore"     style={s.navA}>Explore</Link>
            <Link to="/messages"    style={s.navA}>Messages</Link>
            <Link to="/settings"    style={s.navA}>Settings</Link>
            <Link to="/about"       style={s.navA}>About</Link>
            <Link to="/contact"     style={s.navA}>Contact</Link>
          </div>
          <div style={s.navRight}>
            <button onClick={() => navigate(`/profile/${currentUserId}`)} disabled={!currentUserId} style={s.btnOutline}>
              Profile
            </button>
            <button onClick={handleLogout} style={s.btnFill}>Logout</button>
          </div>
        </nav>
        <div className="feed-container">
          <div className="feed-status">Loading messages...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="feed-page">
      <nav style={s.nav}>
        <div style={s.navLeft}>
          <Link to="/" style={s.logo}>★ UNIVERSE</Link>
          <Link to="/Feed"        style={s.navA}>Feed</Link>
          <Link to="/create-post" style={s.navA}>Create Post</Link>
          <Link to="/societies"   style={s.navA}>Societies</Link>
          <Link to="/explore"     style={s.navA}>Explore</Link>
          <Link to="/messages"    style={s.navA}>Messages</Link>
          <Link to="/settings"    style={s.navA}>Settings</Link>
          <Link to="/about"       style={s.navA}>About</Link>
          <Link to="/contact"     style={s.navA}>Contact</Link>
        </div>
        <div style={s.navRight}>
          <button onClick={() => navigate(-1)} style={s.btnOutline}>Back</button>
          <button onClick={() => navigate(`/profile/${currentUserId}`)} disabled={!currentUserId} style={s.btnOutline}>
            Profile
          </button>
          <button onClick={handleLogout} style={s.btnFill}>Logout</button>
        </div>
      </nav>

      <div className="feed-container messages-shell">
        <style>{`
          @keyframes floatKey {
            0%,100% { transform: translateY(0); }
            50% { transform: translateY(-7px); }
          }
        `}</style>
        <div className="messages-floating" aria-hidden="true">
          <Key letter="C" color="#f4845f" style={{ left: '-18px', top: '40%' }} />
          <Key letter="H" color="#f6c94e" style={{ left: '-10px', top: '60%' }} />
          <Key letter="A" color="#5b9af5" style={{ right: '-10px', top: '40%' }} />
          <Key letter="T" color="#49c4a0" style={{ right: '-18px', top: '60%' }} />
        </div>

        {!profile ? (
          <div className="feed-status feed-error">{error || 'User not found'}</div>
        ) : (
          <div className="messages-card">
            <p className="messages-kicker">Campus conversations</p>
            <h2 className="messages-title">Messages</h2>
            <p className="messages-sub">Chatting with {profile.name || profile.username}.</p>

            <div className="profile-avatar-block" style={{ marginBottom: '0.75rem' }}>
              <Avatar src={profile.avatar} name={profile.name || profile.username} size={56} className="profile-avatar" />
              <div>
                <h3 className="profile-title" style={{ marginBottom: '0.2rem' }}>{profile.name || profile.username}</h3>
                <p className="profile-login-hint" style={{ margin: 0 }}>@{profile.username}</p>
              </div>
            </div>

            {error && <p className="profile-error">{error}</p>}

            <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1rem' }}>
              {messages.length === 0 ? (
                <div className="feed-status">No messages yet. Say hello.</div>
              ) : (
                messages.map((message) => {
                  const isMine = message.senderId?._id === currentUserId
                  return (
                    <div
                      key={message._id}
                      style={{
                        justifySelf: isMine ? 'end' : 'start',
                        maxWidth: '80%',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '14px',
                        background: isMine ? '#1a4a1a' : '#f0f7f0',
                        color: isMine ? '#fff' : '#1a4a1a',
                        border: isMine ? 'none' : '1px solid #dce8c0'
                      }}
                    >
                      <div style={{ fontSize: '0.84rem', opacity: 0.8, marginBottom: '0.35rem' }}>
                        {isMine ? 'You' : message.senderId?.name || message.senderId?.username || 'User'}
                      </div>
                      <div>{message.content}</div>
                      <div style={{ fontSize: '0.76rem', opacity: 0.72, marginTop: '0.45rem' }}>
                        {formatDateTime(message.createdAt)}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <form onSubmit={handleSend} className="profile-actions-row" style={{ alignItems: 'stretch' }}>
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a message..."
                className="profile-input"
                style={{ flex: 1, marginBottom: 0 }}
              />
              <button type="submit" disabled={sending} className="profile-btn profile-btn-primary">
                {sending ? 'Sending...' : 'Send'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default Messages