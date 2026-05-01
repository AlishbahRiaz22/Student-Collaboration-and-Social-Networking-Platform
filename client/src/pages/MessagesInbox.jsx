import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

const MessagesInbox = () => {
  const navigate = useNavigate()
  const { user, socket, logout } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const conversationsRef = useRef([])

  const dedupeConversations = (items) => {
    const seen = new Map()

    items.forEach((conversation) => {
      const participants = (conversation.participants || []).map((participant) => participant?._id || participant)
      const key = conversation.type === 'direct'
        ? [...participants].map(String).sort().join(':')
        : conversation._id

      const current = seen.get(key)
      if (!current) {
        seen.set(key, conversation)
        return
      }

      const currentUpdatedAt = new Date(conversation.updatedAt || conversation.createdAt || 0).getTime()
      const existingUpdatedAt = new Date(current.updatedAt || current.createdAt || 0).getTime()

      if (currentUpdatedAt > existingUpdatedAt) {
        seen.set(key, conversation)
      }
    })

    return Array.from(seen.values())
  }

  const getConversationKey = (conversation) => {
    const participants = (conversation.participants || []).map((participant) => participant?._id || participant)

    return conversation.type === 'direct'
      ? [...participants].map(String).sort().join(':')
      : conversation._id
  }

  const sortConversations = (items) =>
    [...items].sort((left, right) => {
      const leftTime = new Date(left.updatedAt || left.createdAt || 0).getTime()
      const rightTime = new Date(right.updatedAt || right.createdAt || 0).getTime()
      return rightTime - leftTime
    })

  const upsertConversation = (nextConversation) => {
    setConversations((prev) => {
      const key = getConversationKey(nextConversation)
      const filtered = prev.filter((conversation) => getConversationKey(conversation) !== key)
      const nextList = sortConversations(dedupeConversations([...filtered, nextConversation]))
      conversationsRef.current = nextList
      return nextList
    })
  }

  const currentUserId = useMemo(() => {
    const token = user?.token || localStorage.getItem('token')
    if (!token) return null

    try {
      return JSON.parse(atob(token.split('.')[1])).userId
    } catch {
      return null
    }
  }, [user?.token])

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true)
        setError('')
        const res = await api.get('/conversations')
        const nextList = sortConversations(dedupeConversations(res.data))
        conversationsRef.current = nextList
        setConversations(nextList)
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load conversations')
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [])

  useEffect(() => {
    if (!socket || !currentUserId) return undefined

    const handleIncomingMessage = async (message) => {
      try {
        const conversationId = message?.conversationId?._id || message?.conversationId
        if (!conversationId) return

        const existingConversation = conversationsRef.current.find((conversation) => conversation._id === conversationId)

        if (existingConversation) {
          upsertConversation({
            ...existingConversation,
            latestMessage: message,
            updatedAt: message.createdAt || new Date().toISOString()
          })
          return
        }

        const conversationRes = await api.get(`/conversations/${conversationId}`)
        upsertConversation({
          ...conversationRes.data,
          latestMessage: message,
          updatedAt: message.createdAt || new Date().toISOString()
        })
      } catch {
        return undefined
      }
    }

    socket.on('message:received', handleIncomingMessage)
    socket.on('message:new', handleIncomingMessage)

    return () => {
      socket.off('message:received', handleIncomingMessage)
      socket.off('message:new', handleIncomingMessage)
    }
  }, [socket, currentUserId])

  const openConversation = (conversation) => {
    const otherParticipant = (conversation.participants || []).find(
      (participant) => participant?._id !== currentUserId
    )

    if (otherParticipant?._id) {
      navigate(`/messages/${otherParticipant._id}`)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="feed-page">
      <style>{`
        @keyframes floatKey {
          0%,100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
      `}</style>
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

      <div className="feed-container messages-shell">
        <div className="messages-floating" aria-hidden="true">
          <Key letter="C" color="#f4845f" style={{ left: '-18px', top: '40%' }} />
          <Key letter="H" color="#f6c94e" style={{ left: '-10px', top: '60%' }} />
          <Key letter="A" color="#5b9af5" style={{ right: '-10px', top: '40%' }} />
          <Key letter="T" color="#49c4a0" style={{ right: '-18px', top: '60%' }} />
        </div>

        <div className="messages-card">
          <p className="messages-kicker">Campus conversations</p>
          <h2 className="messages-title">Messages</h2>
          <p className="messages-sub">Recent chats and campus updates.</p>
          {error && <p className="profile-error">{error}</p>}

          {loading ? (
            <div className="feed-status">Loading conversations...</div>
          ) : conversations.length === 0 ? (
            <div className="feed-status">No conversations yet. Visit a profile and tap Message.</div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {conversations.map((conversation) => {
                const otherParticipant = (conversation.participants || []).find(
                  (participant) => participant?._id !== currentUserId
                )

                return (
                  <button
                    key={conversation._id}
                    onClick={() => openConversation(conversation)}
                    className="profile-btn profile-btn-secondary"
                    style={{
                      textAlign: 'left',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.85rem 1rem',
                      justifyContent: 'flex-start'
                    }}
                  >
                    <Avatar
                      src={otherParticipant?.avatar}
                      name={otherParticipant?.name || otherParticipant?.username}
                      size={42}
                    />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>
                        {otherParticipant?.name || otherParticipant?.username || 'Conversation'}
                      </div>
                        <div style={{ fontSize: '0.88rem', color: '#666' }}>
                          {conversation.latestMessage?.content || 'No messages yet'}
                        </div>
                    </div>
                      <div style={{ fontSize: '0.78rem', color: '#888', whiteSpace: 'nowrap' }}>
                        {formatDateTime(conversation.latestMessage?.createdAt || conversation.updatedAt || conversation.createdAt)}
                      </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MessagesInbox