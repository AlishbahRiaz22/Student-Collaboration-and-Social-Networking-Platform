import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/index'
import { useAuth } from '../context/useAuth'
import Avatar from '../components/Avatar'
import { formatDateTime } from '../utils/formatters'
import './Feed.css'
import './Profile.css'

const MessagesInbox = () => {
  const navigate = useNavigate()
  const { user, socket } = useAuth()
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
      </nav>

      <div className="feed-container">
        <div className="profile-card">
          <h2 className="profile-title">Messages</h2>
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