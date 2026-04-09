import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { createPost } from '../api/posts'
import './Feed.css'
import './CreatePost.css'

const buildPlaceholder = (label, background, accent) => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" role="img" aria-label="${label}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${background}" />
          <stop offset="100%" stop-color="#ffffff" />
        </linearGradient>
      </defs>
      <rect width="800" height="500" fill="url(#g)" />
      <circle cx="620" cy="120" r="92" fill="${accent}" fill-opacity="0.2" />
      <circle cx="180" cy="380" r="120" fill="${accent}" fill-opacity="0.16" />
      <path d="M0 360 C 140 300, 220 220, 360 250 S 580 380, 800 300 L800 500 L0 500 Z" fill="${accent}" fill-opacity="0.18" />
      <text x="64" y="112" fill="#0f172a" font-size="34" font-family="Arial, sans-serif" font-weight="700">${label}</text>
      <text x="64" y="150" fill="#334155" font-size="20" font-family="Arial, sans-serif">Placeholder image for now</text>
    </svg>
  `

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const PLACEHOLDERS = [
  { id: 'campus', label: 'Campus Life', graphic: buildPlaceholder('Campus Life', '#dbeafe', '#2563eb') },
  { id: 'group', label: 'Study Group', graphic: buildPlaceholder('Study Group', '#dcfce7', '#16a34a') },
  { id: 'event', label: 'Event Poster', graphic: buildPlaceholder('Event Poster', '#fce7f3', '#db2777') },
  { id: 'project', label: 'Project Showcase', graphic: buildPlaceholder('Project Showcase', '#fef3c7', '#f59e0b') }
]

const CreatePostPage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [content, setContent] = useState('')
  const [graphic, setGraphic] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const currentUserName = useMemo(() => {
    return user?.name || user?.username || 'Student'
  }, [user])

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl('')
      return undefined
    }

    const objectUrl = URL.createObjectURL(selectedFile)
    setPreviewUrl(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [selectedFile])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setGraphic('')
  }

  const handlePlaceholderSelect = (placeholderGraphic) => {
    setSelectedFile(null)
    setGraphic(placeholderGraphic)
  }

  const handleClearImage = () => {
    setSelectedFile(null)
    setGraphic('')
    setPreviewUrl('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!content.trim()) {
      setError('Post content is required')
      return
    }

    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const formData = new FormData()
      formData.append('content', content)

      if (selectedFile) {
        formData.append('image', selectedFile)
      } else if (graphic) {
        formData.append('graphic', graphic)
      }

      await createPost(formData)

      setContent('')
      setSelectedFile(null)
      setGraphic('')
      setPreviewUrl('')
      setSuccess('Post created successfully')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post')
    } finally {
      setLoading(false)
    }
  }

  const previewGraphic = previewUrl || graphic || PLACEHOLDERS[0].graphic

  return (
    <div className="create-post-page">
      <nav className="feed-nav">
        <div className="feed-nav-left">
          <span className="feed-logo">StudentNet</span>
          <Link to="/feed" className="nav-link">Feed</Link>
          <Link to="/explore" className="nav-link">Explore</Link>
        </div>
        <div className="feed-nav-right">
          <button onClick={handleLogout} className="nav-btn nav-btn-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="create-post-shell">
        <div className="create-post-hero">
          <h1>Create a post</h1>
          <p>
            Share an update with the community, attach an image, or use one of the placeholder visuals when you do not want to upload a file.
          </p>
        </div>

        <div className="create-post-layout">
          <form className="create-post-panel" onSubmit={handleSubmit}>
            <h2 className="create-post-section-title">Post details</h2>
            {error && <p className="create-post-error">{error}</p>}
            {success && <p className="create-post-success">{success}</p>}

            <label className="create-post-label" htmlFor="post-content">What are you sharing?</label>
            <textarea
              id="post-content"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder={`Write as ${currentUserName}...`}
              className="create-post-textarea"
              maxLength={500}
            />

            <div className="create-post-upload">
              <label className="create-post-label">Attach image</label>
              <div className="create-post-upload-row">
                <label className="create-post-upload-btn" htmlFor="post-image-input">
                  Upload image
                </label>
                <input
                  id="post-image-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  hidden
                />
                {(graphic || selectedFile) && (
                  <button type="button" className="create-post-clear-btn" onClick={handleClearImage}>
                    Remove image
                  </button>
                )}
              </div>

              <div className="placeholder-grid">
                {PLACEHOLDERS.map((placeholder) => (
                  <button
                    key={placeholder.id}
                    type="button"
                    className={`placeholder-card ${graphic === placeholder.graphic ? 'selected' : ''}`}
                    onClick={() => handlePlaceholderSelect(placeholder.graphic)}
                  >
                    <img src={placeholder.graphic} alt={placeholder.label} />
                    <span>{placeholder.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="create-post-toolbar">
              <span className="create-post-meta">{content.length} / 500 characters</span>
              <button type="submit" disabled={loading || !content.trim()} className="btn-post">
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>

          <aside className="create-post-preview">
            <h2 className="create-post-section-title">Live preview</h2>
            <div className="preview-graphic">
              {previewGraphic ? (
                <img src={previewGraphic} alt="Preview" />
              ) : (
                <div className="preview-empty">Your attached image will appear here.</div>
              )}
            </div>
            <div className="preview-body">
              <h2>{currentUserName}</h2>
              <p>{content || 'Write a message to preview your post before publishing.'}</p>
            </div>
            <div className="preview-note">
              Uploaded images are sent to Cloudinary and the returned URL is stored on the post. Placeholder visuals stay local and are saved directly as the attached graphic.
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default CreatePostPage