import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { createSociety } from '../../api/societies'

const Key = ({ letter, color, style }) => (
  <div style={{
    position: 'absolute', width: 68, height: 68, borderRadius: 16,
    background: color, border: '3.5px solid #111', boxShadow: '4px 4px 0 #111',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
    fontSize: '2rem', color: '#111', animation: 'floatKey 3s ease-in-out infinite',
    userSelect: 'none', pointerEvents: 'none', ...style,
  }}>
    {letter}
  </div>
)

const SocietyCreate = () => {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [name, setName]               = useState('')
  const [description, setDescription] = useState('')
  const [picture, setPicture]         = useState('')
  const [pictureFile, setPictureFile] = useState(null)
  const [visibility, setVisibility]   = useState('public')
  const [inviteOnly, setInviteOnly]   = useState(false)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState('')

  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!name.trim()) { setError('Society name is required'); return }
    try {
      setSaving(true); setError('')
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
      if (pictureFile) formData.append('pictureFile', pictureFile)
      const result = await createSociety(formData)
      navigate(`/societies/${result.society.slug}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create society')
    } finally { setSaving(false) }
  }

  const s = {
    page: {
      minHeight: '100vh',
      background: '#eef3e2',
      backgroundImage: 'linear-gradient(#c8d8a0 1px,transparent 1px),linear-gradient(90deg,#c8d8a0 1px,transparent 1px)',
      backgroundSize: '24px 24px',
      fontFamily: "'Nunito', sans-serif",
      display: 'flex', flexDirection: 'column',
    },
    nav: {
      position: 'fixed', top: 0, left: 0, right: 0, height: 60,
      background: '#d4e6a5', borderBottom: '2.5px solid #b5cc7a',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 36px', zIndex: 100,
    },
    navLeft:  { display: 'flex', alignItems: 'center', gap: 4 },
    navRight: { display: 'flex', alignItems: 'center', gap: 8 },
    logo: {
      fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
      fontSize: '1.35rem', color: '#1a4a1a', textDecoration: 'none', marginRight: 14,
    },
    navA: {
      textDecoration: 'none', fontWeight: 700, fontSize: '0.92rem',
      color: '#1a4a1a', padding: '6px 14px', fontFamily: "'Nunito', sans-serif",
    },
    btnOutline: {
      fontWeight: 700, fontSize: '0.88rem', color: '#1a4a1a', padding: '7px 18px',
      border: '2px solid #1a4a1a', borderRadius: 999, background: 'none',
      cursor: 'pointer', fontFamily: "'Nunito', sans-serif", textDecoration: 'none',
      display: 'inline-flex', alignItems: 'center',
    },
    btnFill: {
      fontWeight: 700, fontSize: '0.88rem', color: '#fff', padding: '8px 20px',
      background: '#1a4a1a', border: 'none', borderRadius: 999,
      cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
    },
    footer: {
      textAlign: 'center', padding: 18, fontSize: '0.82rem',
      color: '#2e7d32', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
    },
    body: {
      flex: 1, position: 'relative', display: 'flex', justifyContent: 'center',
      padding: '80px 20px 40px',
    },
    shell: { width: '100%', maxWidth: 560, zIndex: 5 },

    /* page heading above the card */
    heading: {
      fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
      fontSize: '2rem', color: '#1a4a1a', margin: '0 0 4px',
    },
    subheading: {
      color: '#5a7a3a', fontSize: '0.92rem', fontWeight: 600,
      margin: '0 0 24px',
    },

    card: {
      background: '#f9faf4', borderRadius: 24, border: '2.5px solid #1a4a1a',
      borderTop: '8px solid #43a047', boxShadow: '0 6px 28px rgba(0,0,0,0.10)',
      padding: '28px 32px 24px',
    },
    fieldWrap: { marginBottom: 16 },
    label: {
      display: 'block', fontWeight: 700, fontSize: '0.85rem',
      color: '#1a1a1a', marginBottom: 6,
    },
    input: {
      width: '100%', padding: '11px 14px', boxSizing: 'border-box',
      border: '2px solid #43a047', borderRadius: 10, background: '#f0f7f0',
      fontSize: '0.92rem', fontFamily: "'Nunito', sans-serif",
      color: '#111', outline: 'none',
    },
    textarea: {
      width: '100%', padding: '11px 14px', boxSizing: 'border-box',
      border: '2px solid #43a047', borderRadius: 10, background: '#f0f7f0',
      fontSize: '0.92rem', fontFamily: "'Nunito', sans-serif",
      color: '#111', outline: 'none', resize: 'vertical', lineHeight: 1.6,
    },
    select: {
      width: '100%', padding: '11px 14px', boxSizing: 'border-box',
      border: '2px solid #43a047', borderRadius: 10, background: '#f0f7f0',
      fontSize: '0.92rem', fontFamily: "'Nunito', sans-serif",
      color: '#111', outline: 'none', cursor: 'pointer',
    },
    toggleRow: {
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '14px 16px', borderRadius: 12,
      border: '2px solid #dce8c0', background: '#fff', marginBottom: 16,
    },
    toggleText: { display: 'block', fontWeight: 700, fontSize: '0.88rem', color: '#1a4a1a', marginBottom: 3 },
    toggleDesc: { margin: 0, fontSize: '0.82rem', color: '#666', lineHeight: 1.5 },
    checkbox: { marginTop: 3, accentColor: '#1a4a1a', width: 16, height: 16, cursor: 'pointer' },

    actions: { display: 'flex', gap: 10, marginTop: 8 },
    submitBtn: {
      flex: 1, padding: '13px', background: '#1a4a1a', color: '#fff',
      border: 'none', borderRadius: 12, fontWeight: 800, fontSize: '0.95rem',
      cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
    },
    cancelBtn: {
      padding: '13px 22px', background: 'none', color: '#1a4a1a',
      border: '2px solid #1a4a1a', borderRadius: 12, fontWeight: 700,
      fontSize: '0.92rem', cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
      textDecoration: 'none', display: 'inline-flex', alignItems: 'center',
    },
    errorBox: {
      background: '#ffeef0', border: '1.5px solid #f48fb1', borderRadius: 10,
      padding: '10px 14px', color: '#c62828', fontSize: '0.85rem',
      fontWeight: 700, marginBottom: 16,
    },
    divider: { borderTop: '1.5px solid #dce8c0', margin: '16px 0' },
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
        .sc-input:focus  { border-color:#1a4a1a !important; box-shadow:0 0 0 3px rgba(26,74,26,0.12); }
        .sc-navA:hover   { color:#2e7d32 !important; }
        .sc-submit:hover:not(:disabled) { background:#2e7d32 !important; }
        .sc-cancel:hover { background:#e8f5e0 !important; }
        @media(max-width:640px){ .sc-navA{display:none !important;} .sc-nav{padding:0 16px !important;} }
      `}</style>

      <div style={s.page}>
        {/* ── NAV — identical to Feed / SocietiesHome ── */}
        <nav style={s.nav} className="sc-nav">
          <div style={s.navLeft}>
            <Link to="/" style={s.logo}>★ UNIVERSE</Link>
            <Link to="/feed"        style={s.navA} className="sc-navA">Feed</Link>
            <Link to="/create-post" style={s.navA} className="sc-navA">Create Post</Link>
            <Link to="/societies"   style={s.navA} className="sc-navA">Societies</Link>
            <Link to="/explore"   style={s.navA} className="sc-navA">Explore</Link>
            <Link to="/messages"  style={s.navA} className="sc-navA">Messages</Link>
            <Link to="/settings"  style={s.navA} className="sc-navA">Settings</Link>
            <Link to="/about"     style={s.navA} className="sc-navA">About</Link>
            <Link to="/contact"   style={s.navA} className="sc-navA">Contact</Link>
          </div>
          <div style={s.navRight}>
            <Link to="/societies" style={s.btnOutline}>← Back</Link>
            <button style={s.btnFill} onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        {/* ── BODY — keys spell N-E-W on the sides ── */}
        <div style={s.body}>
          {/* Left: N E */}
          <Key letter="N" color="#f4845f" style={{ left:'4%', top:'14%', '--rot':'-10deg' }} />
          <Key letter="E" color="#f6c94e" style={{ left:'7%', top:'40%', '--rot':'8deg', animationDelay:'0.4s' }} />
          {/* Right: W */}
          <Key letter="W" color="#49c4a0" style={{ right:'5%', top:'14%', '--rot':'10deg', animationDelay:'0.7s' }} />

          <div style={s.shell}>
            <h1 style={s.heading}>Start a Society</h1>
            <p style={s.subheading}>Set up your group, add a description, and invite members.</p>

            <div style={s.card}>
              {error && <div style={s.errorBox}>⚠ {error}</div>}

              <form onSubmit={handleSubmit}>
                {/* Name */}
                <div style={s.fieldWrap}>
                  <label style={s.label} htmlFor="sc-name">Society Name</label>
                  <input
                    id="sc-name" className="sc-input" style={s.input}
                    placeholder="e.g. Robotics Club"
                    value={name} onChange={e => setName(e.target.value)}
                  />
                </div>

                {/* Description */}
                <div style={s.fieldWrap}>
                  <label style={s.label} htmlFor="sc-desc">Description</label>
                  <textarea
                    id="sc-desc" className="sc-input" style={s.textarea} rows={4}
                    placeholder="What is this society about?"
                    value={description} onChange={e => setDescription(e.target.value)}
                  />
                </div>

                <div style={s.divider} />

                {/* Picture URL */}
                <div style={s.fieldWrap}>
                  <label style={s.label} htmlFor="sc-pic">Picture URL</label>
                  <input
                    id="sc-pic" className="sc-input" style={s.input}
                    placeholder="https://..."
                    value={picture} onChange={e => setPicture(e.target.value)}
                  />
                </div>

                {/* Upload */}
                <div style={s.fieldWrap}>
                  <label style={s.label} htmlFor="sc-file">Upload Picture</label>
                  <input
                    id="sc-file" type="file" accept="image/*" className="sc-input" style={s.input}
                    onChange={e => setPictureFile(e.target.files?.[0] || null)}
                  />
                </div>

                {/* Visibility */}
                <div style={s.fieldWrap}>
                  <label style={s.label} htmlFor="sc-vis">Visibility</label>
                  <select
                    id="sc-vis" className="sc-input" style={s.select}
                    value={visibility} onChange={e => setVisibility(e.target.value)}
                  >
                    <option value="public">Public — anyone can discover it</option>
                    <option value="private">Private — hidden from discovery</option>
                  </select>
                </div>

                <div style={s.divider} />

                {/* Invite only toggle */}
                <label style={s.toggleRow}>
                  <input
                    type="checkbox" style={s.checkbox}
                    checked={inviteOnly} onChange={e => setInviteOnly(e.target.checked)}
                  />
                  <div>
                    <span style={s.toggleText}>Invite only</span>
                    <p style={s.toggleDesc}>
                      Members must be invited before they can join. The society can still be discovered if public.
                    </p>
                  </div>
                </label>

                {/* Actions */}
                <div style={s.actions}>
                  <button
                    type="submit" className="sc-submit" style={{
                      ...s.submitBtn,
                      opacity: saving ? 0.7 : 1,
                      cursor: saving ? 'not-allowed' : 'pointer',
                    }}
                    disabled={saving}
                  >
                    {saving ? 'Creating…' : 'Create Society →'}
                  </button>
                  <Link to="/societies" style={s.cancelBtn} className="sc-cancel">Cancel</Link>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* ── FOOTER — identical to Feed ── */}
        <footer style={s.footer}>✦ UNIVERSE — made with ♥ ✦</footer>
      </div>
    </>
  )
}

export default SocietyCreate