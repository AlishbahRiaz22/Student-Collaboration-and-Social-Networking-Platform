// client/src/components/FollowButton.jsx

const FollowButton = ({ isFollowing, isLoggedIn, followLoading, onToggle }) => {
  if (!isLoggedIn) return null

  return (
    <button
      onClick={onToggle}
      disabled={followLoading}
      style={{ width: '100%', padding: '0.75rem', marginBottom: '0.5rem' }}
    >
      {followLoading ? 'Updating...' : isFollowing ? 'Unfollow' : 'Follow'}
    </button>
  )
}

export default FollowButton