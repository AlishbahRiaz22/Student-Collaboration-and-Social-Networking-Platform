import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/index'

const Profile = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  const isOwnProfile = user?.token && profile?._id && id === profile._id

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/users/${id}`)
        setProfile(res.data)
        setBio(res.data.bio || '')
        setName(res.data.name || '')
      } catch (err) {
        setError('User not found')
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [id])

  const handleSave = async () => {
    try {
      setSaving(true)
      const res = await api.put(`/users/${id}`, { name, bio })
      setProfile(res.data)
      setEditing(false)
    } catch (err) {
      setError('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  }

  if (loading) return <div style={{ textAlign: 'center', marginTop: '100px' }}>Loading...</div>
  if (error) return <div style={{ textAlign: 'center', marginTop: '100px', color: 'red' }}>{error}</div>

  return (
    <div style={{ maxWidth: '600px', margin: '60px auto', padding: '2rem' }}>
      {/* Avatar */}
      <div style={{
        width: '80px', height: '80px', borderRadius: '50%',
        background: '#4f46e5', color: 'white', fontSize: '1.8rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: '1rem'
      }}>
        {getInitials(profile.name)}
      </div>

      {/* Name */}
      {editing ? (
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ fontSize: '1.5rem', marginBottom: '0.5rem', padding: '0.3rem', width: '100%' }}
        />
      ) : (
        <h2 style={{ marginBottom: '0.25rem' }}>{profile.name}</h2>
      )}

      {/* Stats */}
      <p style={{ color: '#666', marginBottom: '1rem' }}>
        {profile.followers?.length || 0} followers · {profile.following?.length || 0} following
      </p>

      {/* Bio */}
      {editing ? (
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={3}
          placeholder="Write your bio..."
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem' }}
        />
      ) : (
        <p style={{ marginBottom: '1rem' }}>{profile.bio || 'No bio yet.'}</p>
      )}

      {/* Buttons */}
      {isOwnProfile && (
        editing ? (
          <div>
            <button onClick={handleSave} disabled={saving} style={{ marginRight: '1rem', padding: '0.5rem 1rem' }}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={() => setEditing(false)} style={{ padding: '0.5rem 1rem' }}>
              Cancel
            </button>
          </div>
        ) : (
          <button onClick={() => setEditing(true)} style={{ padding: '0.5rem 1rem' }}>
            Edit Profile
          </button>
        )
      )}
    </div>
  )
}

export default Profile