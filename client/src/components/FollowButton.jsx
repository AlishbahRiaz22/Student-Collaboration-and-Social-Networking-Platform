// client/src/components/FollowButton.jsx

const FollowButton = ({ isFollowing, isLoggedIn, followLoading, onToggle }) => {
  if (!isLoggedIn) return null

  const label = isFollowing ? 'Following' : 'Follow'

  return (
    <button
      onClick={onToggle}
      disabled={followLoading}
      style={{
        width: '100%',
        padding: '0.75rem',
        marginBottom: '0.5rem',
        border: '1px solid #ddd',
        borderRadius: '8px',
        cursor: followLoading ? 'not-allowed' : 'pointer',
        background: isFollowing ? '#e7f5ec' : '#378add',
        color: isFollowing ? '#1f6b3f' : '#fff',
        opacity: 1
      }}
    >
      {label}
    </button>
  )
}

export default FollowButton