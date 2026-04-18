import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/index'
import { useAuth } from '../context/useAuth'
import Avatar from '../components/Avatar'
import { formatDateTime } from '../utils/formatters'
import './Feed.css'
import './Profile.css'

const Messages = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user, socket } = useAuth()
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

  if (loading) {
    return (
      <div className="feed-page">
        <nav className="feed-nav">
          <div className="feed-nav-left">
            <span className="feed-logo">StudentNet</span>
            <Link to="/feed" className="nav-link">Feed</Link>
            <Link to="/societies" className="nav-link">Societies</Link>
            <Link to="/explore" className="nav-link">Search</Link>
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
      <nav className="feed-nav">
        <div className="feed-nav-left">
          <span className="feed-logo">StudentNet</span>
          <Link to="/feed" className="nav-link">Feed</Link>
          <Link to="/societies" className="nav-link">Societies</Link>
          <Link to="/explore" className="nav-link">Search</Link>
          <Link to="/settings" className="nav-link">Settings</Link>
        </div>
        <div className="feed-nav-right">
          <button onClick={() => navigate(-1)} className="nav-btn">Back</button>
        </div>
      </nav>

      <div className="feed-container">
        {!profile ? (
          <div className="feed-status feed-error">{error || 'User not found'}</div>
        ) : (
          <div className="profile-card">
            <div className="profile-avatar-block">
              <Avatar src={profile.avatar} name={profile.name || profile.username} size={56} className="profile-avatar" />
              <div>
                <h2 className="profile-title" style={{ marginBottom: '0.2rem' }}>Message {profile.name || profile.username}</h2>
                <p className="profile-login-hint" style={{ margin: 0 }}>Conversation started with @{profile.username}</p>
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
                        background: isMine ? '#378add' : '#f3f5f7',
                        color: isMine ? '#fff' : '#222',
                        border: isMine ? 'none' : '1px solid #e2e6ea'
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