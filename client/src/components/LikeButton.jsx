import { useState } from 'react'
import { likePost } from '../api/posts'
import { useAuth } from '../context/useAuth'

const LikeButton = ({ post, onLikeUpdate }) => {
  const { user } = useAuth()
  const [likes, setLikes] = useState(post.likes?.length || 0)
  const [liked, setLiked] = useState(post.likes?.some(id => id?.toString() === user?.userId) || false)
  const [loading, setLoading] = useState(false)

  const handleLike = async () => {
    if (loading) return

    const nextLiked = !liked
    const nextLikes = nextLiked ? likes + 1 : Math.max(0, likes - 1)
    const previousLiked = liked
    const previousLikes = likes

    setLiked(nextLiked)
    setLikes(nextLikes)

    try {
      setLoading(true)
      const data = await likePost(post._id)
      setLikes(data.likes)
      setLiked(data.liked)
      if (onLikeUpdate) onLikeUpdate(data)
    } catch (err) {
      setLiked(previousLiked)
      setLikes(previousLikes)
      console.error('Like failed:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: '1.2rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.3rem',
        color: liked ? 'red' : '#666'
      }}
    >
      {liked ? '❤️' : '🤍'} {likes}
    </button>
  )
}

export default LikeButton