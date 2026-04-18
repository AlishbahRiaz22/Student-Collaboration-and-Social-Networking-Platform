import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { createSociety } from '../../api/societies'
import '../Feed.css'
import './societies.css'

const SocietyCreate = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [picture, setPicture] = useState('')
  const [pictureFile, setPictureFile] = useState(null)
  const [visibility, setVisibility] = useState('public')
  const [inviteOnly, setInviteOnly] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!name.trim()) {
      setError('Society name is required')
      return
    }

    try {
      setSaving(true)
      setError('')

      const formData = new FormData()
      formData.append('name', name)
      formData.append('description', description)
      formData.append('picture', picture)
      formData.append('visibility', visibility)
      formData.append('settings', JSON.stringify({
        defaultMemberCanPost: false,
        defaultMemberCanCreateSections: false,
        allowMemberInvites: false,
        requireApprovalForJoin: false,
        inviteOnly,
        allowFollowersSeePosts: true
      }))

      if (pictureFile) {
        formData.append('pictureFile', pictureFile)
      }

      const result = await createSociety(formData)

      navigate(`/societies/${result.society.slug}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create society')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="feed-page">
      <nav className="feed-nav">
        <div className="feed-nav-left">
          <span className="feed-logo">StudentNet</span>
          <Link to="/societies" className="nav-link">Societies</Link>
          <Link to="/feed" className="nav-link">Feed</Link>
          <Link to="/settings" className="nav-link">Settings</Link>
        </div>
        <div className="feed-nav-right">
          <button onClick={handleLogout} className="nav-btn nav-btn-logout">Logout</button>
        </div>
      </nav>

      <div className="feed-container societies-container societies-container--narrow">
        <section className="societies-panel">
          <div className="societies-panel-header">
            <h2>Create society</h2>
            <span>Prototype</span>
          </div>

          <form className="society-form" onSubmit={handleSubmit}>
            {error && <div className="feed-status feed-error">{error}</div>}

            <label className="society-field">
              <span>Name</span>
              <input value={name} onChange={(event) => setName(event.target.value)} className="profile-input" />
            </label>

            <label className="society-field">
              <span>Description</span>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} className="profile-textarea" rows={4} />
            </label>

            <label className="society-field">
              <span>Picture URL</span>
              <input value={picture} onChange={(event) => setPicture(event.target.value)} className="profile-input" placeholder="https://..." />
            </label>

            <label className="society-field">
              <span>Upload picture</span>
              <input type="file" accept="image/*" onChange={(event) => setPictureFile(event.target.files?.[0] || null)} className="profile-input" />
            </label>

            <label className="society-field">
              <span>Visibility</span>
              <select value={visibility} onChange={(event) => setVisibility(event.target.value)} className="profile-input">
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </label>

            <label className="society-toggle-row">
              <input type="checkbox" checked={inviteOnly} onChange={(event) => setInviteOnly(event.target.checked)} />
              <div>
                <strong>Invite only</strong>
                <p>Members must be invited before they can join. You can still discover the society if it is public.</p>
              </div>
            </label>

            <div className="settings-actions">
              <button type="submit" disabled={saving} className="settings-btn settings-btn-primary">
                {saving ? 'Creating...' : 'Create society'}
              </button>
              <Link to="/societies" className="settings-btn">Cancel</Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}

export default SocietyCreate