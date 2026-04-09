import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { getPostById, getPostLikes, likePost } from '../api/posts'
import CommentSection from '../components/CommentSection'
import Avatar from '../components/Avatar'
import PostLikesModal from '../components/PostLikesModal'
import './Feed.css'
import './PostDetail.css'

const PostDetail = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user, logout } = useAuth()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [likeLoading, setLikeLoading] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [likesOpen, setLikesOpen] = useState(false)
  const [likers, setLikers] = useState([])
  const [likersLoading, setLikersLoading] = useState(false)
  const [likersError, setLikersError] = useState('')

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

  const fetchPost = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await getPostById(id)
      setPost(data)
      setLikesCount(data.likes?.length || 0)
      setIsLiked(data.likes?.some((likeId) => likeId?.toString() === currentUserId) || false)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load post')
    } finally {
      setLoading(false)
    }
  }, [id, currentUserId])

  useEffect(() => {
    fetchPost()
  }, [fetchPost])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleLike = async () => {
    if (!currentUserId || likeLoading || !post) return

    const nextLiked = !isLiked
    const nextLikes = nextLiked ? likesCount + 1 : Math.max(0, likesCount - 1)
    const previousLiked = isLiked
    const previousLikes = likesCount

    setIsLiked(nextLiked)
    setLikesCount(nextLikes)

    try {
      setLikeLoading(true)
      const data = await likePost(post._id)
      setLikesCount(data.likes)
      setIsLiked(data.liked)
    } catch (err) {
      setIsLiked(previousLiked)
      setLikesCount(previousLikes)
      console.error('Like failed:', err)
    } finally {
      setLikeLoading(false)
    }
  }

  const handleOpenLikes = async () => {
    if (!post) return

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

  return (
    <div className="post-detail-page">
      <nav className="feed-nav">
        <div className="feed-nav-left">
          <span className="feed-logo">StudentNet</span>
          <Link to="/feed" className="nav-link">Feed</Link>
          <Link to="/create-post" className="nav-link">Create Post</Link>
        </div>
        <div className="feed-nav-right">
          <button onClick={handleLogout} className="nav-btn nav-btn-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="post-detail-shell">
        {loading && <div className="feed-status">Loading post...</div>}
        {error && <div className="feed-status feed-error">{error}</div>}

        {!loading && post && (
          <article className="post-detail-card">
            <div className="post-detail-title-row">
              <h1 className="post-detail-title">Post</h1>
              <Link to="/feed" className="post-detail-link">Back to feed</Link>
            </div>

            <div className="post-detail-meta">
              <span>
                <strong>Author:</strong>{' '}
                <span className="post-detail-author-wrap">
                  <Avatar
                    src={post.userId?.avatar}
                    name={post.userId?.name || post.userId?.username}
                    size={30}
                    className="post-detail-avatar"
                  />
                  {post.userId?._id ? (
                    <Link to={`/profile/${post.userId._id}`} className="profile-link-inline">
                      {post.userId?.name || post.userId?.username || 'Unknown'}
                    </Link>
                  ) : (
                    post.userId?.name || post.userId?.username || 'Unknown'
                  )}
                </span>
              </span>
              <span>
                <strong>Date:</strong> {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="post-detail-body">
              {post.graphic && (
                <div className="post-graphic-wrap">
                  <img src={post.graphic} alt="Attached to post" className="post-graphic" loading="lazy" />
                </div>
              )}
              <p className="post-content">{post.content}</p>
            </div>

            <div className="post-footer">
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

            <h2 className="post-detail-comments-title">Comments</h2>
            <CommentSection
              postId={post._id}
              currentUserId={currentUserId}
              comments={post.comments || []}
              onCommentAdded={(nextComments) => setPost((prev) => prev ? { ...prev, comments: nextComments } : prev)}
            />

            <PostLikesModal
              open={likesOpen}
              loading={likersLoading}
              error={likersError}
              users={likers}
              onClose={() => setLikesOpen(false)}
            />
          </article>
        )}
      </div>
    </div>
  )
}

export default PostDetail