import { useState, useEffect, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import api from '../api/index'
import FollowButton from '../components/FollowButton'

const Profile = () => {
  const { id, username } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [name, setName] = useState('')
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
  const isFollowing = profile?.followers?.includes(currentUserId)
  const targetUserId = profile?._id || id

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

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleEditStart = () => {
    setName(profile?.name || '')
    setBio(profile?.bio || '')
    setEditing(true)
  }

  const handleEditCancel = () => {
    setName(profile?.name || '')
    setBio(profile?.bio || '')
    setEditing(false)
    setError('')
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Name is required')
      return
    }

    try {
      setSaving(true)
      setError('')
      setMessage('')
      const res = await api.put(`/users/${targetUserId}`, { name: name.trim(), bio })
      setProfile(res.data)
      setEditing(false)
      setMessage('Profile updated successfully')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const handleFollowToggle = async () => {
    try {
      setFollowLoading(true)
      setError('')
      setMessage('')
      const endpoint = isFollowing ? 'unfollow' : 'follow'
      const successText = isFollowing ? 'Unfollowed successfully' : 'Followed successfully'

      await api.put(`/users/${targetUserId}/${endpoint}`)
      await fetchProfile()
      setMessage(successText)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update follow status')
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '100px' }}>Loading profile...</div>
  }

  if (!profile) {
    return <div style={{ textAlign: 'center', marginTop: '100px', color: 'red' }}>{error || 'User not found'}</div>
  }

  return (
    <div style={{ maxWidth: '440px', margin: '80px auto', padding: '2rem', border: '1px solid #ddd', borderRadius: '12px', background: '#fff' }}>
      <h2>Profile</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {message && <p style={{ color: 'green' }}>{message}</p>}

      <div style={{ marginBottom: '1rem' }}>
        <strong>Username:</strong> {profile.username}
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Followers:</strong> {profile.followers?.length || 0}
      </div>
      <div style={{ marginBottom: '1rem' }}>
        <strong>Following:</strong> {profile.following?.length || 0}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Name</label><br />
        {editing ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={{ width: '100%', padding: '0.5rem' }}
          />
        ) : (
          <p>{profile.name || '-'}</p>
        )}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label>Bio</label><br />
        {editing ? (
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Write your bio"
            style={{ width: '100%', padding: '0.5rem' }}
          />
        ) : (
          <p>{profile.bio || 'No bio yet.'}</p>
        )}
      </div>

      {editing ? (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={handleSave} disabled={saving} style={{ width: '100%', padding: '0.75rem' }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
          <button onClick={handleEditCancel} disabled={saving} style={{ width: '100%', padding: '0.75rem' }}>
            Cancel
          </button>
        </div>
      ) : (
        <>
          {isOwnProfile ? (
            <button onClick={handleEditStart} style={{ width: '100%', padding: '0.75rem', marginBottom: '0.5rem' }}>
              Edit Profile
            </button>
          ) : !isLoggedIn ? (
            <p style={{ marginBottom: '0.75rem' }}>
              <Link to="/login">Login</Link> to follow this user.
            </p>
         ) : (
            <FollowButton
              isFollowing={isFollowing}
              followLoading={followLoading}
              onToggle={handleFollowToggle}
            />
          )}
          <button onClick={fetchProfile} style={{ width: '100%', padding: '0.75rem' }}>
            Refresh
          </button>
        </>
      )}
    </div>
  )
}

export default Profile