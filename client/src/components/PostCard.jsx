import { useState } from 'react'
import api from '../api/index'
import { likePost } from '../api/posts'

const PostCard = ({ post, currentUserId, onDelete, onUpdate }) => {
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // like state — start from what the database already has
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0)
  const [isLiked, setIsLiked] = useState(
    post.likes?.some(id => id?.toString() === currentUserId) || false
  )

  const isMyPost = post.userId?._id === currentUserId || post.userId === currentUserId

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
    <div className="post-card">

      {/* Author and date */}
      <div className="post-header">
        <strong className="post-author">
          {post.userId?.name || post.userId?.username || 'Unknown'}
        </strong>
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
        />
      ) : (
        <>
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
        </>
      )}

      {error && <p className="post-error">{error}</p>}

      {/* Bottom row */}
      <div className="post-footer">

        {/* Like button */}
        <button
          onClick={handleLike}
          className={`like-btn ${isLiked ? 'liked' : ''}`}
        >
          {isLiked ? '♥' : '♡'} {likesCount}
        </button>

        {/* Edit / Delete — only on your own posts */}
        {isMyPost && (
          <div className="post-actions">
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
    </div>
  )
}

export default PostCard