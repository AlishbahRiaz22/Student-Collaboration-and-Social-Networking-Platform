import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import api from '../api/index'
import FollowButton from '../components/FollowButton'
import Avatar from '../components/Avatar'
import PostCard from '../components/PostCard'
import './Feed.css'
import './Profile.css'

const Profile = () => {
  const navigate = useNavigate()
  const { id, username } = useParams()
  const { user, logout } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [userPosts, setUserPosts] = useState([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsError, setPostsError] = useState('')
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [name, setName] = useState('')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [saving, setSaving] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)

  const getUserIdFromToken = (token) => {
    if (!token) return null

    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.userId
    } catch {
      return null
    }
  }

  const token = user?.token || localStorage.getItem('token')
  const isLoggedIn = Boolean(token)
  const currentUserId = getUserIdFromToken(token)
  const isOwnProfile = currentUserId && profile?._id === currentUserId
  const isFollowing = profile?.followers?.some((id) => id?.toString() === currentUserId)
  const targetUserId = profile?._id || id

  const handleProfileClick = () => {
    if (!currentUserId) return
    navigate(`/profile/${currentUserId}`)
  }

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const endpoint = `/users/${encodeURIComponent(username || id)}`
      const res = await api.get(endpoint)
      setProfile(res.data)
      setBio(res.data.bio || '')
      setName(res.data.name || '')
    } catch {
      setError('User not found')
    } finally {
      setLoading(false)
    }
  }, [id, username])

  const fetchUserPosts = useCallback(async (selectedUserId) => {
    if (!selectedUserId) {
      setUserPosts([])
      return
    }

    try {
      setPostsLoading(true)
      setPostsError('')
      const res = await api.get(`/posts/user/${selectedUserId}`)
      setUserPosts(res.data)
    } catch {
      setPostsError('Failed to load user posts')
    } finally {
      setPostsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    fetchUserPosts(profile?._id)
  }, [profile?._id, fetchUserPosts])

  const handleEditStart = () => {
    setName(profile?.name || '')
    setBio(profile?.bio || '')
    setAvatarFile(null)
    setAvatarPreview(profile?.avatar || '')
    setEditing(true)
  }

  const handleEditCancel = () => {
    setName(profile?.name || '')
    setBio(profile?.bio || '')
    setAvatarFile(null)
    setAvatarPreview(profile?.avatar || '')
    setEditing(false)
    setError('')
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0] || null
    setAvatarFile(file)

    if (!file) {
      setAvatarPreview(profile?.avatar || '')
      return
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file')
      event.target.value = ''
      setAvatarFile(null)
      setAvatarPreview(profile?.avatar || '')
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Avatar image must be 2MB or smaller')
      event.target.value = ''
      setAvatarFile(null)
      setAvatarPreview(profile?.avatar || '')
      return
    }

    setError('')
    setAvatarPreview(URL.createObjectURL(file))
  }

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')

      const profileRes = await api.put(`/users/${targetUserId}`, { name: name.trim(), bio })
      let nextProfile = profileRes.data

      if (avatarFile) {
        const formData = new FormData()
        formData.append('avatar', avatarFile)

        const avatarRes = await api.put(`/users/${targetUserId}/avatar`, formData)

        nextProfile = avatarRes.data
      }

      setProfile(nextProfile)
      setAvatarFile(null)
      setAvatarPreview(nextProfile.avatar || '')
      setEditing(false)
      setMessage('Profile updated successfully')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleFollowToggle = async () => {
    if (!profile || followLoading) return

    const previousProfile = profile
    const nextFollowing = !isFollowing

    setProfile((prev) => {
      if (!prev) return prev

      const followers = prev.followers || []
      const normalizedFollowers = followers.map((id) => id.toString())

      if (nextFollowing) {
        if (normalizedFollowers.includes(currentUserId)) return prev
        return {
          ...prev,
          followers: [...followers, currentUserId]
        }
      }

      return {
        ...prev,
        followers: followers.filter((id) => id.toString() !== currentUserId)
      }
    })

    try {
      setFollowLoading(true)
      setError('')
      setMessage('')
      const endpoint = isFollowing ? 'unfollow' : 'follow'
      const successText = isFollowing ? 'Unfollowed successfully' : 'Followed successfully'

      await api.put(`/users/${targetUserId}/${endpoint}`)
      setMessage(successText)
    } catch (err) {
      setProfile(previousProfile)
      setError(err.response?.data?.error || 'Failed to update follow status')
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="feed-page">
        <nav className="feed-nav">
          <div className="feed-nav-left">
            <span className="feed-logo">StudentNet</span>
            <Link to="/feed" className="nav-link">Feed</Link>
            <Link to="/explore" className="nav-link">Explore</Link>
          </div>
          <div className="feed-nav-right">
            <button onClick={handleProfileClick} disabled={!currentUserId} className="nav-btn">
              Profile
            </button>
            <button onClick={handleLogout} className="nav-btn nav-btn-logout">
              Logout
            </button>
          </div>
        </nav>
        <div className="feed-container">
          <div className="feed-status">Loading profile...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="feed-page">
      <nav className="feed-nav">
        <div className="feed-nav-left">
          <span className="feed-logo">StudentNet</span>
          <Link to="/create-post" className="nav-link">Create Post</Link>
          <Link to="/feed" className="nav-link">Feed</Link>
          <Link to="/explore" className="nav-link">Explore</Link>
        </div>
        <div className="feed-nav-right">
          <button onClick={handleProfileClick} disabled={!currentUserId} className="nav-btn">
            Profile
          </button>
          <button onClick={handleLogout} className="nav-btn nav-btn-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="feed-container">
        {!profile ? (
          <div className="feed-status feed-error">{error || 'User not found'}</div>
        ) : (
          <>
            <div className="profile-card">
              <h2 className="profile-title">Profile</h2>
              {error && <p className="profile-error">{error}</p>}
              {message && <p className="profile-success">{message}</p>}

              <div className="profile-avatar-block">
                <Avatar
                  src={editing ? avatarPreview : profile.avatar}
                  name={profile.name || profile.username}
                  size={88}
                  className="profile-avatar"
                />

                {isOwnProfile && editing && (
                  <div className="profile-avatar-controls">
                    <label className="profile-avatar-label" htmlFor="profile-avatar-input">
                      Change profile picture
                    </label>
                    <input
                      id="profile-avatar-input"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="profile-avatar-input"
                    />
                    <p className="profile-avatar-hint">PNG, JPG, GIF or WEBP. Max size: 2MB.</p>
                  </div>
                )}
              </div>

              <div className="profile-meta">
                <div className="profile-meta-item"><strong>Username:</strong> {profile.username}</div>
                <div className="profile-meta-item"><strong>Followers:</strong> {profile.followers?.length || 0}</div>
                <div className="profile-meta-item"><strong>Following:</strong> {profile.following?.length || 0}</div>
              </div>

              <div className="profile-field">
                <label>Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="profile-input"
                  />
                ) : (
                  <p>{profile.name || '-'}</p>
                )}
              </div>

              <div className="profile-field">
                <label>Bio</label>
                {editing ? (
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    placeholder="Write your bio"
                    className="profile-textarea"
                  />
                ) : (
                  <p>{profile.bio || 'No bio yet.'}</p>
                )}
              </div>

              {editing ? (
                <div className="profile-actions-row">
                  <button onClick={handleSave} disabled={saving} className="profile-btn profile-btn-primary">
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={handleEditCancel} disabled={saving} className="profile-btn profile-btn-secondary">
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  {isOwnProfile ? (
                    <button onClick={handleEditStart} className="profile-btn profile-btn-primary profile-btn-block">
                      Edit Profile
                    </button>
                  ) : !isLoggedIn ? (
                    <p className="profile-login-hint">
                      <Link to="/login" className="profile-link">Login</Link> to follow this user.
                    </p>
                  ) : (
                    <FollowButton
                      isFollowing={isFollowing}
                      isLoggedIn={isLoggedIn}
                      followLoading={followLoading}
                      onToggle={handleFollowToggle}
                    />
                  )}
                  <button onClick={fetchProfile} className="profile-btn profile-btn-secondary profile-btn-block">
                    Refresh
                  </button>
                </>
              )}
            </div>

            <div className="profile-posts-section">
              <h3 className="profile-posts-title">
                {isOwnProfile ? 'Your Posts' : `${profile.name || profile.username}'s Posts`}
              </h3>

              {postsLoading && <div className="feed-status">Loading posts...</div>}
              {postsError && <div className="feed-status feed-error">{postsError}</div>}
              {!postsLoading && !postsError && userPosts.length === 0 && (
                <div className="feed-status">No posts yet.</div>
              )}

              {userPosts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={currentUserId}
                  onDelete={(deletedId) => setUserPosts((prev) => prev.filter((p) => p._id !== deletedId))}
                  onUpdate={(updated) => setUserPosts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)))}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Profile