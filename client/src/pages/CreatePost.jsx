import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import { createPost } from '../api/posts'

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
    </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

const PLACEHOLDERS = [
  { id: 'campus',  label: 'Campus Life',       graphic: buildPlaceholder('Campus Life',       '#d4edda', '#2e7d32') },
  { id: 'group',   label: 'Study Group',        graphic: buildPlaceholder('Study Group',        '#c8e6c9', '#388e3c') },
  { id: 'event',   label: 'Event Poster',       graphic: buildPlaceholder('Event Poster',       '#f9fbe7', '#827717') },
  { id: 'project', label: 'Project Showcase',   graphic: buildPlaceholder('Project Showcase',   '#e8f5e9', '#1b5e20') },
]

/* Floating key decoration */
const Key = ({ letter, color, style }) => (
  <div style={{
    position: 'absolute', width: 60, height: 60, borderRadius: 14,
    background: color, border: '3px solid #111', boxShadow: '3px 3px 0 #111',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
    fontSize: '1.7rem', color: '#111',
    animation: 'floatKey 3s ease-in-out infinite',
    userSelect: 'none', pointerEvents: 'none', ...style,
  }}>{letter}</div>
)

const CreatePostPage = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [content, setContent]         = useState('')
  const [graphic, setGraphic]         = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl]   = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState('')

  const currentUserName = useMemo(() => user?.name || user?.username || 'Student', [user])

  useEffect(() => {
    if (!selectedFile) { setPreviewUrl(''); return }
    const url = URL.createObjectURL(selectedFile)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [selectedFile])

  const handleFileChange = e => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file); setGraphic('')
  }
  const handlePlaceholderSelect = g => { setSelectedFile(null); setGraphic(g) }
  const handleClearImage = () => { setSelectedFile(null); setGraphic(''); setPreviewUrl('') }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!content.trim()) return setError('Post content is required')
    try {
      setLoading(true); setError(''); setSuccess('')
      const formData = new FormData()
      formData.append('content', content)
      if (selectedFile)   formData.append('image', selectedFile)
      else if (graphic)   formData.append('graphic', graphic)
      await createPost(formData)
      setContent(''); setSelectedFile(null); setGraphic(''); setPreviewUrl('')
      setSuccess('Post created successfully! 🎉')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post')
    } finally { setLoading(false) }
  }

  const previewGraphic = previewUrl || graphic || PLACEHOLDERS[0].graphic

  const s = {
    page: {
      minHeight: '100vh',
      background: '#eef3e2',
      backgroundImage: 'linear-gradient(#c8d8a0 1px,transparent 1px),linear-gradient(90deg,#c8d8a0 1px,transparent 1px)',
      backgroundSize: '24px 24px',
      fontFamily: "'Nunito', sans-serif",
    },
    nav: {
      background: '#d4e6a5', borderBottom: '2.5px solid #b5cc7a',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 36px', height: 60, position: 'sticky', top: 0, zIndex: 100,
    },
    navLeft: { display: 'flex', alignItems: 'center', gap: 4 },
    logo: {
      fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
      fontSize: '1.35rem', color: '#1a4a1a', textDecoration: 'none', marginRight: 14,
    },
    navA: {
      textDecoration: 'none', fontWeight: 700, fontSize: '0.92rem',
      color: '#1a4a1a', padding: '6px 14px',
    },
    btnOutline: {
      fontWeight: 700, fontSize: '0.88rem', color: '#1a4a1a', padding: '7px 18px',
      border: '2px solid #1a4a1a', borderRadius: 999, background: 'none', cursor: 'pointer',
      fontFamily: "'Nunito', sans-serif",
    },
    btnFill: {
      fontWeight: 700, fontSize: '0.88rem', color: '#fff', padding: '8px 20px',
      background: '#1a4a1a', border: 'none', borderRadius: 999, cursor: 'pointer',
      fontFamily: "'Nunito', sans-serif",
    },
    shell: {
      maxWidth: 1040, margin: '0 auto', padding: '40px 20px 60px',
      position: 'relative',
    },
    hero: { marginBottom: 28 },
    heroTitle: {
      fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
      fontSize: '2rem', color: '#1a4a1a', marginBottom: 6,
    },
    heroSub: { color: '#5a7a3a', fontSize: '0.95rem', fontWeight: 600, maxWidth: '62ch' },

    layout: { display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 20, alignItems: 'start' },

    card: {
      background: '#f9faf4', borderRadius: 22, border: '2.5px solid #1a4a1a',
      borderTop: '7px solid #43a047', boxShadow: '0 6px 28px rgba(0,0,0,0.10)',
      padding: '24px 24px 20px',
    },
    sectionTitle: {
      fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
      fontSize: '1.05rem', color: '#1a4a1a', marginBottom: 16,
    },
    label: { display: 'block', fontWeight: 700, fontSize: '0.85rem', color: '#1a1a1a', marginBottom: 6 },
    textarea: {
      width: '100%', minHeight: 160, resize: 'vertical', boxSizing: 'border-box',
      border: '2px solid #43a047', borderRadius: 14, padding: '12px 14px',
      fontFamily: "'Nunito', sans-serif", fontSize: '0.93rem', color: '#1a1a1a',
      background: '#f0f7f0', outline: 'none', lineHeight: 1.6,
    },
    uploadSection: { marginTop: 18, paddingTop: 16, borderTop: '1.5px solid #dce8c0' },
    uploadRow: { display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 },
    uploadBtn: {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      padding: '8px 18px', borderRadius: 999, border: '2px solid #43a047',
      background: '#e8f5e0', color: '#1a4a1a', cursor: 'pointer',
      fontFamily: "'Nunito', sans-serif", fontWeight: 700, fontSize: '0.88rem',
    },
    clearBtn: {
      background: 'none', border: '2px solid #f48fb1', borderRadius: 999,
      color: '#c62828', cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
      fontWeight: 700, fontSize: '0.85rem', padding: '7px 16px',
    },
    placeholderGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 },
    placeholderCard: (selected) => ({
      border: selected ? '2.5px solid #1a4a1a' : '2px solid #b5cc7a',
      borderRadius: 14, background: selected ? '#e8f5e0' : '#fff',
      cursor: 'pointer', overflow: 'hidden', padding: 0, textAlign: 'left',
      boxShadow: selected ? '0 0 0 3px rgba(67,160,71,0.18)' : 'none',
      transition: 'all 0.15s',
    }),
    placeholderLabel: { display: 'block', padding: '7px 10px', fontSize: '0.85rem', color: '#1a4a1a', fontWeight: 700 },
    toolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
    charCount: { fontSize: '0.82rem', color: content.length > 450 ? '#c62828' : '#888', fontWeight: 700 },
    postBtn: {
      background: content.trim() && !loading ? '#1a4a1a' : '#b5cc7a',
      color: '#fff', border: 'none', borderRadius: 999,
      padding: '10px 28px', fontFamily: "'Nunito', sans-serif",
      fontWeight: 800, fontSize: '0.93rem',
      cursor: content.trim() && !loading ? 'pointer' : 'not-allowed',
      transition: 'background 0.2s',
    },
    errorBox: {
      background: '#ffeef0', border: '1.5px solid #f48fb1', borderRadius: 10,
      padding: '10px 14px', color: '#c62828', fontSize: '0.85rem',
      fontWeight: 700, marginBottom: 14,
    },
    successBox: {
      background: '#e8f5e0', border: '1.5px solid #6abf4b', borderRadius: 10,
      padding: '10px 14px', color: '#2e7d32', fontSize: '0.85rem',
      fontWeight: 700, marginBottom: 14,
    },
    // Preview aside
    preview: {
      background: '#f9faf4', borderRadius: 22, border: '2.5px solid #1a4a1a',
      borderTop: '7px solid #f6c94e',   // yellow accent to differentiate
      boxShadow: '0 6px 28px rgba(0,0,0,0.10)',
      padding: '24px 24px 20px',
      position: 'sticky', top: 80,
    },
    previewImgWrap: {
      borderRadius: 14, overflow: 'hidden', border: '2px solid #b5cc7a',
      background: '#e8f5e0', marginBottom: 14,
    },
    previewName: {
      fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
      fontSize: '1rem', color: '#1a4a1a', marginBottom: 6,
    },
    previewText: { color: '#4a4a4a', lineHeight: 1.6, fontSize: '0.9rem', fontWeight: 600 },
    previewNote: {
      marginTop: 14, padding: '10px 12px', borderRadius: 12,
      background: '#e8f5e0', color: '#4a6a2a', fontSize: '0.82rem',
      fontWeight: 700, border: '1.5px solid #b5cc7a',
    },
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes floatKey {
          0%,100% { transform: translateY(0) rotate(var(--rot,0deg)); }
          50%      { transform: translateY(-7px) rotate(var(--rot,0deg)); }
        }
        textarea:focus { border-color: #1a4a1a !important; box-shadow: 0 0 0 3px rgba(26,74,26,0.12); }
        @media (max-width: 900px) {
          .cp-layout { grid-template-columns: 1fr !important; }
          .cp-preview { position: static !important; }
        }
        @media (max-width: 600px) {
          .cp-pgrid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={s.page}>
        {/* ── NAV ── */}
        <nav style={s.nav}>
          <div style={s.navLeft}>
            <Link to="/"            style={s.logo}>★ UNIVERSE</Link>
            <Link to="/feed"        style={s.navA}>Feed</Link>
            <Link to="/"            style={s.navA}>Create Post</Link>
            <Link to="/societies"   style={s.navA}>Societies</Link>
            <Link to="/explore"     style={s.navA}>Explore</Link>
            <Link to="/messages"    style={s.navA}>Messages</Link>
            <Link to="/settings"    style={s.navA}>Settings</Link>
             <Link to="/about"      style={s.navA}>About</Link>
             <Link to="/contact"    style={s.navA}>Contact</Link>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button style={s.btnOutline} onClick={() => navigate(-1)}>← Back</button>
            <button style={s.btnFill}    onClick={() => { logout(); navigate('/login', { replace:true }) }}>Logout</button>
          </div>
        </nav>

        <div style={s.shell}>
          {/* Floating key decorations */}
          <Key letter="C" color="#f4845f" style={{ left: -80, top: 60,  '--rot':'-10deg' }} />
          <Key letter="P" color="#f6c94e" style={{ left: -94, top: 140, '--rot':'8deg',  animationDelay:'0.5s' }} />
          <Key letter="+" color="#49c4a0" style={{ right:-10, top: 80,  '--rot':'10deg', animationDelay:'0.8s' }} />

          {/* Hero */}
          <div style={s.hero}>
            <h1 style={s.heroTitle}>Create a Post ✍️</h1>
            <p style={s.heroSub}>Share an update with the community, attach an image, or pick a placeholder visual.</p>
          </div>

          {/* Layout */}
          <div style={s.layout} className="cp-layout">

            {/* ── LEFT: Form ── */}
            <form style={s.card} onSubmit={handleSubmit}>
              <div style={s.sectionTitle}>Post details</div>

              {error   && <div style={s.errorBox}>⚠ {error}</div>}
              {success && <div style={s.successBox}>✓ {success}</div>}

              <label style={s.label} htmlFor="post-content">What are you sharing?</label>
              <textarea
                id="post-content"
                style={s.textarea}
                placeholder={`Write as ${currentUserName}…`}
                value={content}
                maxLength={500}
                onChange={e => setContent(e.target.value)}
              />

              {/* Upload */}
              <div style={s.uploadSection}>
                <label style={s.label}>Attach an image</label>
                <div style={s.uploadRow}>
                  <label style={s.uploadBtn} htmlFor="post-image-input">
                    📎 Upload image
                  </label>
                  <input id="post-image-input" type="file" accept="image/*" onChange={handleFileChange} hidden />
                  {(graphic || selectedFile) && (
                    <button type="button" style={s.clearBtn} onClick={handleClearImage}>✕ Remove</button>
                  )}
                </div>

                {/* Placeholder grid */}
                <div style={s.placeholderGrid} className="cp-pgrid">
                  {PLACEHOLDERS.map(ph => (
                    <button key={ph.id} type="button"
                      style={s.placeholderCard(graphic === ph.graphic)}
                      onClick={() => handlePlaceholderSelect(ph.graphic)}
                    >
                      <img src={ph.graphic} alt={ph.label} style={{ display:'block', width:'100%', aspectRatio:'16/10', objectFit:'cover' }} />
                      <span style={s.placeholderLabel}>{ph.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div style={s.toolbar}>
                <span style={s.charCount}>{content.length} / 500</span>
                <button type="submit" style={s.postBtn} disabled={!content.trim() || loading}>
                  {loading ? 'Posting…' : 'Post →'}
                </button>
              </div>
            </form>

            {/* ── RIGHT: Preview ── */}
            <aside style={s.preview} className="cp-preview">
              <div style={s.sectionTitle}>Live preview 👁</div>
              <div style={s.previewImgWrap}>
                <img src={previewGraphic} alt="Preview"
                  style={{ display:'block', width:'100%', maxHeight:260, objectFit:'cover' }} />
              </div>
              <div style={s.previewName}>{currentUserName}</div>
              <div style={s.previewText}>
                {content || 'Write something to preview your post here…'}
              </div>
              <div style={s.previewNote}>
                📤 Uploaded images go to Cloudinary. Placeholder visuals are saved directly as the post graphic.
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}

export default CreatePostPage