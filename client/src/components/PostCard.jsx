import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import api from '../api/index'
import { getPostLikes, likePost } from '../api/posts'
import Avatar from './Avatar'
import PostLikesModal from './PostLikesModal'

const PostCard = ({ post, currentUserId, onDelete, onUpdate }) => {
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [likesOpen, setLikesOpen] = useState(false)
  const [likers, setLikers] = useState([])
  const [likersLoading, setLikersLoading] = useState(false)
  const [likersError, setLikersError] = useState('')

  // like state — start from what the database already has
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0)
  const [isLiked, setIsLiked] = useState(
    post.likes?.some(id => id?.toString() === currentUserId) || false
  )

  const isMyPost = post.userId?._id === currentUserId || post.userId === currentUserId
  const societyName = post.societyId?.name || ''
  const societySlug = post.societyId?.slug || ''
  const authorName = post.userId?.name || post.userId?.username || 'Unknown'
  const hasSocietyContext = Boolean(societyName)

  const openPost = () => {
    navigate(`/post/${post._id}`)
  }

  const stopCardNavigation = (event) => {
    event.stopPropagation()
  }

  const handleOpenLikes = async (event) => {
    event.stopPropagation()
    setLikesOpen(true)

    if (likers.length > 0 || likersLoading) return

    try {
      setLikersLoading(true)
      setLikersError('')
      const data = await getPostLikes(post._id)
      setLikers(data)
    } catch (err) {
      setLikersError(err.response?.data?.error || 'Failed to load likes')
    } finally {
      setLikersLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return
    try {
      setLoading(true)
      await api.delete(`/posts/${post._id}`)
      onDelete(post._id)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = async () => {
    if (!editContent.trim()) return
    try {
      setLoading(true)
      setError('')
      const res = await api.put(`/posts/${post._id}`, { content: editContent })
      onUpdate(res.data)
      setEditing(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!currentUserId) return  // must be logged in

    if (loading) return

    const nextLiked = !isLiked
    const nextLikesCount = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1)
    const previousLiked = isLiked
    const previousLikesCount = likesCount

    setIsLiked(nextLiked)
    setLikesCount(nextLikesCount)

    try {
      const data = await likePost(post._id)
      setLikesCount(data.likes)
      setIsLiked(data.liked)
    } catch (err) {
      setIsLiked(previousLiked)
      setLikesCount(previousLikesCount)
      console.error('Like failed:', err)
    }
  }

  return (
    <div
      className="post-card post-card-clickable"
      onClick={openPost}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          openPost()
        }
      }}
    >

      {/* Author and date */}
      <div className="post-header">
        <div className="post-author-wrap" onClick={stopCardNavigation}>
          <Avatar
            src={post.societyId?.picture || post.userId?.avatar}
            name={societyName || authorName}
            size={34}
            className="post-avatar"
          />
          <div className="post-author-copy">
            {hasSocietyContext ? (
              <strong className="post-author">
                <Link to={`/societies/${societySlug || post.societyId?._id}`} className="profile-link-inline">
                  {societyName}
                </Link>
              </strong>
            ) : (
              <strong className="post-author">
                {post.userId?._id ? (
                  <Link to={`/profile/${post.userId._id}`} className="profile-link-inline">
                    {authorName}
                  </Link>
                ) : (
                  authorName
                )}
              </strong>
            )}

            {hasSocietyContext && (
              <span className="post-author-subtitle">
                by {post.userId?._id ? (
                  <Link to={`/profile/${post.userId._id}`} className="profile-link-inline">
                    {authorName}
                  </Link>
                ) : (
                  authorName
                )}
              </span>
            )}
          </div>
        </div>
        <span className="post-date">
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Content */}
      {editing ? (
        <textarea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={3}
          className="post-edit-textarea"
          onClick={stopCardNavigation}
        />
      ) : (
        <div className="post-body-link">
          {post.graphic && (
            <div className="post-graphic-wrap">
              <img
                src={post.graphic}
                alt="Attached to post"
                className="post-graphic"
                loading="lazy"
              />
            </div>
          )}
          <p className="post-content">{post.content}</p>
        </div>
      )}
      {error && <p className="post-error">{error}</p>}

      {/* Bottom row */}
      <div className="post-footer">

        {/* Like button */}
        <div className="post-social-bar" onClick={stopCardNavigation}>
          <button
            type="button"
            onClick={handleLike}
            className={`like-btn ${isLiked ? 'liked' : ''}`}
          >
            {isLiked ? '♥' : '♡'} {likesCount}
          </button>
          <button
            type="button"
            onClick={handleOpenLikes}
            className="post-like-count-btn"
          >
            👥 {likesCount}
          </button>
          <span className="post-comment-count">💬 {post.comments?.length || 0}</span>
        </div>

        {/* Edit / Delete — only on your own posts */}
        {isMyPost && (
          <div className="post-actions" onClick={stopCardNavigation}>
            {editing ? (
              <>
                <button onClick={handleEdit} disabled={loading} className="btn-save">
                  {loading ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => { setEditing(false); setEditContent(post.content) }}
                  disabled={loading}
                  className="btn-cancel"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="btn-edit">
                  Edit
                </button>
                <button onClick={handleDelete} disabled={loading} className="btn-delete">
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <PostLikesModal
        open={likesOpen}
        loading={likersLoading}
        error={likersError}
        users={likers}
        onClose={() => setLikesOpen(false)}
      />
    </div>
  )
}

export default PostCard