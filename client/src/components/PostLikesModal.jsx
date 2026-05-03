import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import Avatar from './Avatar'

const PostLikesModal = ({ open, title = 'Liked by', loading = false, error = '', users = [], onClose }) => {
  if (!open) return null

  const displayUsers = Array.isArray(users)
    ? users
    : Array.isArray(users?.likes)
      ? users.likes
      : Array.isArray(users?.users)
        ? users.users
        : []

  const modal = (
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
          {!loading && !error && displayUsers.length === 0 && <p className="post-likes-status">No likes yet.</p>}

          {!loading && !error && displayUsers.length > 0 && (
            <div className="post-likes-list">
              {displayUsers.map((user, index) => {
                const userId = user?._id || user?.id || user?.userId || index
                const profileTarget = user?._id || user?.id || user?.userId

                const rowContent = (
                  <>
                    <Avatar
                      src={user?.avatar}
                      name={user?.name || user?.username}
                      size={36}
                      className="post-likes-avatar"
                    />
                    <div className="post-likes-meta">
                      <span className="post-likes-name">{user?.name || user?.username || 'Student'}</span>
                      <span className="post-likes-username">@{user?.username || 'student'}</span>
                    </div>
                  </>
                )

                return (
                  profileTarget ? (
                    <Link key={userId} to={`/profile/${profileTarget}`} className="post-likes-item" onClick={onClose}>
                      {rowContent}
                    </Link>
                  ) : (
                    <div key={userId} className="post-likes-item">
                      {rowContent}
                    </div>
                  )
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return modal

  return createPortal(modal, document.body)
}

export default PostLikesModal