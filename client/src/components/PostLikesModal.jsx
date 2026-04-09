import { Link } from 'react-router-dom'
import Avatar from './Avatar'

const PostLikesModal = ({ open, title = 'Liked by', loading = false, error = '', users = [], onClose }) => {
  if (!open) return null

  return (
    <div className="post-likes-overlay" onClick={onClose} role="presentation">
      <div className="post-likes-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label={title}>
        <div className="post-likes-modal-header">
          <h3 className="post-likes-title">{title}</h3>
          <button type="button" className="post-likes-close" onClick={onClose} aria-label="Close likes list">
            ×
          </button>
        </div>

        <div className="post-likes-content">
          {loading && <p className="post-likes-status">Loading likes...</p>}
          {!loading && error && <p className="post-likes-status post-likes-error">{error}</p>}
          {!loading && !error && users.length === 0 && <p className="post-likes-status">No likes yet.</p>}

          {!loading && !error && users.length > 0 && (
            <div className="post-likes-list">
              {users.map((user) => (
                <Link key={user._id} to={`/profile/${user._id}`} className="post-likes-item" onClick={onClose}>
                  <Avatar
                    src={user.avatar}
                    name={user.name || user.username}
                    size={36}
                    className="post-likes-avatar"
                  />
                  <div className="post-likes-meta">
                    <span className="post-likes-name">{user.name || 'Student'}</span>
                    <span className="post-likes-username">@{user.username}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PostLikesModal