import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import {
  createSocietySection,
  assignSocietySectionMember,
  followSociety,
  getSociety,
  getSocietyPosts,
  joinSociety,
  leaveSociety,
  postToSociety,
  updateSociety,
  unfollowSociety
} from '../../api/societies'
import Avatar from '../../components/Avatar'
import { getPrivilegeLabel, getPrivilegeLevel } from '../../utils/societyPrivileges'

const Key = ({ letter, color, style }) => (
  <div style={{
    position: 'absolute', width: 68, height: 68, borderRadius: 16,
    background: color, border: '3.5px solid #111', boxShadow: '4px 4px 0 #111',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
    fontSize: '2rem', color: '#111', animation: 'floatKey 3s ease-in-out infinite',
    userSelect: 'none', pointerEvents: 'none', zIndex: 0, ...style,
  }}>
    {letter}
  </div>
)

const SocietyDetail = () => {
  const { identifier } = useParams()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [society, setSociety] = useState(null)
  const [members, setMembers] = useState([])
  const [sections, setSections] = useState([])
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyAction, setBusyAction] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editPicture, setEditPicture] = useState('')
  const [pictureFile, setPictureFile] = useState(null)
  const [savingSociety, setSavingSociety] = useState(false)
  const [sectionName, setSectionName] = useState('')
  const [sectionDescription, setSectionDescription] = useState('')
  const [creatingSection, setCreatingSection] = useState(false)
  const [postContent, setPostContent] = useState('')
  const [postSectionId, setPostSectionId] = useState('')
  const [posting, setPosting] = useState(false)
  const [assignSectionUserId, setAssignSectionUserId] = useState('')
  const [assignSectionSectionId, setAssignSectionSectionId] = useState('')
  const [assigningMember, setAssigningMember] = useState(false)

  const membership = society?.membership
  const isInvited = Boolean(membership && membership.status === 'invited')
  const isMember = Boolean(membership && membership.status === 'active')
  const isFollowing = Boolean(society?.isFollowing)
  const isInviteOnly = Boolean(society?.society?.settings?.inviteOnly)
  const canJoinSociety = !isInviteOnly && !isMember && !isInvited
  const canAcceptInvite = isInvited
  const canLeaveSociety = isMember
  const showMembershipTag = Boolean(membership && membership.status === 'active')
  const canCreateSocietyPosts = Boolean(
    isMember && (
      getPrivilegeLevel(membership) === 'creator' ||
      getPrivilegeLevel(membership) === 'admin' ||
      getPrivilegeLevel(membership) === 'moderator'
    )
  )
  const canManageSociety = Boolean(
    membership && (
      getPrivilegeLevel(membership) === 'creator' ||
      getPrivilegeLevel(membership) === 'admin' ||
      membership.permissions?.manageSociety ||
      membership.permissions?.editSociety
    )
  )

  const updateSocietyState = (updater) => setSociety((prev) => (prev ? updater(prev) : prev))
  const setFollowState = (nextIsFollowing) => {
    updateSocietyState((prev) => ({
      ...prev,
      isFollowing: nextIsFollowing,
      followerCount: Math.max(0, (prev.followerCount || 0) + (nextIsFollowing ? 1 : -1))
    }))
  }
  const setLeaveState = () => {
    updateSocietyState((prev) => ({
      ...prev,
      membership: null,
      isFollowing: false,
      memberCount: Math.max(0, (prev.memberCount || 0) - 1),
      followerCount: Math.max(0, (prev.followerCount || 0) - 1)
    }))
  }

  const loadDetail = useCallback(async (sectionId = selectedSectionId) => {
    try {
      setLoading(true); setError('')
      const [detail, postList] = await Promise.all([
        getSociety(identifier),
        getSocietyPosts(identifier, sectionId || undefined)
      ])
      setSociety(detail)
      setMembers(detail.society?.members || [])
      setSections(detail.society?.sections || [])
      setPosts(postList)
      setEditName(detail.society.name || '')
      setEditDescription(detail.society.description || '')
      setEditPicture(detail.society.picture || '')
    } catch (err) {
      const apiError = err.response?.data?.error || 'Failed to load society'
      setError(apiError === 'You are banned from this society' ? apiError : 'Failed to load society')
    } finally { setLoading(false) }
  }, [identifier, selectedSectionId])

  const handleJoin = async () => {
    if (isMember) return
    try {
      setBusyAction('join')
      const membershipResult = await joinSociety(identifier)
      setSociety((prev) => prev ? { ...prev, membership: membershipResult } : prev)
      await loadDetail(selectedSectionId)
    } catch (err) { setError(err.response?.data?.error || 'Action failed') }
    finally { setBusyAction('') }
  }

  const handleFollow = async () => {
    try {
      setBusyAction('follow')
      await (isFollowing ? unfollowSociety(identifier) : followSociety(identifier))
      setFollowState(!isFollowing)
      await loadDetail(selectedSectionId)
    } catch (err) { setError(err.response?.data?.error || 'Action failed') }
    finally { setBusyAction('') }
  }

  const handleLeave = async () => {
    if (!isMember) return
    try {
      setBusyAction('leave')
      await leaveSociety(identifier)
      setLeaveState()
      if (society?.society?.visibility !== 'private') await loadDetail('')
    } catch (err) { setError(err.response?.data?.error || 'Action failed') }
    finally { setBusyAction('') }
  }

  const handleSaveSociety = async (event) => {
    event.preventDefault()
    if (!canManageSociety) return
    try {
      setSavingSociety(true); setError('')
      const formData = new FormData()
      formData.append('name', editName)
      formData.append('description', editDescription)
      formData.append('picture', editPicture)
      formData.append('settings', JSON.stringify(society.society.settings || {}))
      if (pictureFile) formData.append('pictureFile', pictureFile)
      await updateSociety(identifier, formData)
      await loadDetail(selectedSectionId)
      setEditing(false)
    } catch (err) { setError(err.response?.data?.error || 'Failed to save society') }
    finally { setSavingSociety(false) }
  }

  const handleCreateSection = async (event) => {
    event.preventDefault()
    if (!canManageSociety || !sectionName.trim()) return
    try {
      setCreatingSection(true); setError('')
      await createSocietySection(identifier, {
        name: sectionName.trim(), description: sectionDescription.trim(), order: sections.length
      })
      await loadDetail(selectedSectionId)
      setSectionName(''); setSectionDescription('')
    } catch (err) { setError(err.response?.data?.error || 'Failed to create section') }
    finally { setCreatingSection(false) }
  }

  const handleCreatePost = async (event) => {
    event.preventDefault()
    if (!postContent.trim()) return
    try {
      setPosting(true); setError('')
      const createdPost = await postToSociety({
        content: postContent.trim(),
        societyId: society.society._id,
        sectionId: postSectionId || undefined
      })
      setPosts((prev) => [createdPost, ...prev])
      setPostContent(''); setPostSectionId('')
    } catch (err) { setError(err.response?.data?.error || 'Failed to create post') }
    finally { setPosting(false) }
  }

  const handleAssignMemberToSection = async (event) => {
    event.preventDefault()
    if (!assignSectionUserId || !assignSectionSectionId) return
    try {
      setAssigningMember(true); setError('')
      await assignSocietySectionMember(identifier, assignSectionSectionId, { userId: assignSectionUserId })
      await loadDetail(selectedSectionId)
      setAssignSectionUserId(''); setAssignSectionSectionId('')
    } catch (err) { setError(err.response?.data?.error || 'Failed to assign member') }
    finally { setAssigningMember(false) }
  }

  useEffect(() => { loadDetail('') }, [loadDetail])

  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }

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
    navLeft: { display: 'flex', alignItems: 'center', gap: 4 },
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
    body: {
      flex: 1, position: 'relative',
      padding: '80px 20px 48px',
    },
    shell: {
      maxWidth: 860, margin: '0 auto', width: '100%', boxSizing: 'border-box', position: 'relative', zIndex: 5,
    },
    footer: {
      textAlign: 'center', padding: 18, fontSize: '0.82rem',
      color: '#2e7d32', fontWeight: 700, fontFamily: "'Nunito', sans-serif",
    },
    card: {
      background: '#f9faf4', borderRadius: 20, border: '2.5px solid #1a4a1a',
      borderTop: '7px solid #43a047', boxShadow: '0 4px 18px rgba(0,0,0,0.09)',
      padding: '24px 28px', marginBottom: 20,
    },
    sectionTitle: {
      fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
      fontSize: '1.1rem', color: '#1a4a1a', margin: '0 0 0',
    },
    heroBrand: { display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' },
    heroInfo: { flex: 1, minWidth: 0 },
    heroName: {
      fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
      fontSize: '1.9rem', color: '#1a4a1a', margin: '0 0 6px',
    },
    heroDesc: { color: '#4a6a2a', fontSize: '0.92rem', margin: '0 0 12px', lineHeight: 1.6 },
    badgeRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
    badge: {
      display: 'inline-block', padding: '4px 12px', borderRadius: 999,
      background: '#d4e6a5', border: '1.5px solid #1a4a1a',
      fontWeight: 700, fontSize: '0.78rem', color: '#1a4a1a',
    },
    badgeAccent: { background: '#fff3cd', border: '1.5px solid #e6a817', color: '#7a4a00' },
    heroActions: { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 },
    statsRow: {
      display: 'flex', gap: 0, borderTop: '1.5px solid #dce8c0', marginTop: 20, paddingTop: 16,
    },
    statNum: {
      display: 'block', fontFamily: "'Playfair Display', Georgia, serif",
      fontWeight: 900, fontSize: '1.5rem', color: '#1a4a1a',
    },
    statLabel: { fontSize: '0.78rem', color: '#5a7a3a', fontWeight: 700 },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 },
    sectionBtn: {
      width: '100%', textAlign: 'left', padding: '12px 14px', marginBottom: 8,
      borderRadius: 12, border: '2px solid #dce8c0', background: '#f0f7f0',
      cursor: 'pointer', fontFamily: "'Nunito', sans-serif", transition: 'all 0.15s',
      display: 'block',
    },
    sectionBtnActive: { border: '2px solid #1a4a1a', background: '#d4e6a5' },
    sectionBtnName: { fontWeight: 700, fontSize: '0.9rem', color: '#1a4a1a', display: 'block' },
    sectionBtnDesc: { fontSize: '0.8rem', color: '#5a7a3a', marginTop: 2, display: 'block' },
    memberRow: {
      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
      borderBottom: '1px solid #eef3e2',
    },
    memberName: { fontWeight: 700, fontSize: '0.9rem', color: '#1a1a1a', margin: 0 },
    memberSub: { fontSize: '0.78rem', color: '#5a7a3a', margin: 0 },
    postCard: {
      borderRadius: 14, border: '2px solid #dce8c0', background: '#fff',
      padding: '14px 18px', marginBottom: 12,
    },
    postMeta: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      marginBottom: 8, gap: 8,
    },
    postSocName: { fontWeight: 800, fontSize: '0.9rem', color: '#1a4a1a', margin: 0 },
    postBy: { fontSize: '0.8rem', color: '#5a7a3a', margin: '2px 0 0' },
    postTag: {
      fontSize: '0.75rem', fontWeight: 700, color: '#5a7a3a',
      background: '#eef3e2', borderRadius: 8, padding: '3px 10px', whiteSpace: 'nowrap',
    },
    postContent: { fontSize: '0.9rem', color: '#222', lineHeight: 1.6, margin: 0 },
    fieldWrap: { marginBottom: 14 },
    label: { display: 'block', fontWeight: 700, fontSize: '0.83rem', color: '#1a1a1a', marginBottom: 5 },
    input: {
      width: '100%', padding: '10px 13px', boxSizing: 'border-box',
      border: '2px solid #43a047', borderRadius: 10, background: '#f0f7f0',
      fontSize: '0.9rem', fontFamily: "'Nunito', sans-serif", color: '#111', outline: 'none',
    },
    textarea: {
      width: '100%', padding: '10px 13px', boxSizing: 'border-box',
      border: '2px solid #43a047', borderRadius: 10, background: '#f0f7f0',
      fontSize: '0.9rem', fontFamily: "'Nunito', sans-serif", color: '#111', outline: 'none',
      resize: 'vertical', lineHeight: 1.6,
    },
    select: {
      width: '100%', padding: '10px 13px', boxSizing: 'border-box',
      border: '2px solid #43a047', borderRadius: 10, background: '#f0f7f0',
      fontSize: '0.9rem', fontFamily: "'Nunito', sans-serif", color: '#111', outline: 'none', cursor: 'pointer',
    },
    panelHeader: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
    },
    actionBtn: {
      padding: '8px 18px', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem',
      border: '2px solid #1a4a1a', background: 'none', color: '#1a4a1a',
      cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
    },
    actionBtnPrimary: { background: '#1a4a1a', color: '#fff', border: 'none' },
    actionBtnDanger: { borderColor: '#c62828', color: '#c62828' },
    actionsRow: { display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' },
    errorBox: {
      background: '#ffeef0', border: '1.5px solid #f48fb1', borderRadius: 10,
      padding: '10px 14px', color: '#c62828', fontSize: '0.85rem',
      fontWeight: 700, marginBottom: 16,
    },
    emptyText: { color: '#5a7a3a', fontSize: '0.88rem', fontStyle: 'italic', margin: 0 },
    profileLink: { color: '#1a4a1a', fontWeight: 700, textDecoration: 'none' },
    divider: { borderTop: '1.5px solid #dce8c0', margin: '16px 0' },
    subHeading: { fontWeight: 800, fontSize: '0.92rem', color: '#1a4a1a', margin: '16px 0 10px' },
    kicker: { fontSize: '0.78rem', fontWeight: 700, color: '#5a7a3a', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  }

  const aBtn = (extra = {}) => ({ ...s.actionBtn, ...extra })

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes floatKey {
          0%,100% { transform: translateY(0) rotate(var(--rot,0deg)); }
          50%      { transform: translateY(-7px) rotate(var(--rot,0deg)); }
        }
        .sd-navA:hover  { color:#2e7d32 !important; }
        .sd-secBtn:hover { border-color:#1a4a1a !important; background:#e8f5e0 !important; }
        .sd-aBtn:hover { background:#e8f5e0 !important; }
        .sd-aBtnP:hover { background:#2e7d32 !important; }
        .sd-link:hover { text-decoration:underline; }
        @media(max-width:680px){
          .sd-navA{display:none !important;}
          .sd-grid{grid-template-columns:1fr !important;}
        }
      `}</style>

      <div style={s.page}>
        {/* NAV */}
        <nav style={s.nav}>
          <div style={s.navLeft}>
            <Link to="/" style={s.logo}>★ UNIVERSE</Link>
            <Link to="/feed"        style={s.navA} className="sd-navA">Feed</Link>
            <Link to="/create-post" style={s.navA} className="sd-navA">Create Post</Link>
            <Link to="/societies"   style={s.navA} className="sd-navA">Societies</Link>
            <Link to="/explore"    style={s.navA} className="sd-navA">Explore</Link>
            <Link to="/messages"   style={s.navA} className="sd-navA">Messages</Link>
            <Link to="/settings"   style={s.navA} className="sd-navA">Settings</Link>
            <Link to="/about"      style={s.navA} className="sd-navA">About</Link>
            <Link to="/contact"    style={s.navA} className="sd-navA">Contact</Link>
          </div>
          <div style={s.navRight}>
            <Link to="/societies" style={s.btnOutline}>← Societies</Link>
            <button style={s.btnFill} onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        {/* BODY */}
        <div style={s.body}>
          {/* Floating keys spell V-I-E-W */}
          <Key letter="V" color="#f4845f" style={{ left: '1.5%', top: '12%',  '--rot': '-8deg' }} />
          <Key letter="I" color="#f6c94e" style={{ left: '3%',   top: '38%',  '--rot': '6deg',  animationDelay: '0.5s' }} />
          <Key letter="E" color="#49c4a0" style={{ right: '3%',  top: '12%',  '--rot': '9deg',  animationDelay: '0.3s' }} />
          <Key letter="W" color="#a78bfa" style={{ right: '1.5%',top: '38%',  '--rot': '-7deg', animationDelay: '0.8s' }} />
          <div style={s.shell}>
          {loading && (
            <div style={{ textAlign: 'center', color: '#1a4a1a', fontWeight: 700, padding: 60 }}>
              Loading society…
            </div>
          )}
          {error && <div style={s.errorBox}>⚠ {error}</div>}

          {!loading && society && (
            <>
              {/* HERO */}
              <div style={s.card}>
                <div style={s.heroBrand}>
                  <Avatar src={society.society.picture} name={society.society.name} size={72} />
                  <div style={s.heroInfo}>
                    <p style={s.kicker}>{society.society.visibility} society</p>
                    <h1 style={s.heroName}>{society.society.name}</h1>
                    <p style={s.heroDesc}>{society.society.description || 'No description yet.'}</p>
                    <div style={s.badgeRow}>
                      <span style={s.badge}>{society.society.visibility}</span>
                      {society.society.settings?.inviteOnly && <span style={{ ...s.badge, ...s.badgeAccent }}>invite only</span>}
                      {isInvited && <span style={{ ...s.badge, ...s.badgeAccent }}>invited</span>}
                      {showMembershipTag && <span style={s.badge}>{getPrivilegeLabel(membership)}</span>}
                    </div>
                    <div style={s.heroActions}>
                      {canManageSociety && (
                        <Link
                          to={`/societies/${society.society.slug || society.society._id}/manage`}
                          style={{ ...aBtn(), textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                          className="sd-aBtn"
                        >
                          Manage people
                        </Link>
                      )}
                      {(canJoinSociety || canAcceptInvite) && (
                        <button style={{ ...aBtn(), ...s.actionBtnPrimary }} className="sd-aBtnP" onClick={handleJoin} disabled={busyAction === 'join' || isMember}>
                          {busyAction === 'join' ? 'Joining…' : (canAcceptInvite ? 'Accept Invite' : 'Join')}
                        </button>
                      )}
                      <button style={aBtn(isFollowing ? { background: '#e8f5e0' } : {})} className="sd-aBtn" onClick={handleFollow} disabled={busyAction === 'follow'}>
                        {isFollowing ? 'Unfollow' : 'Follow'}
                      </button>
                      {canLeaveSociety && (
                        <button style={aBtn(s.actionBtnDanger)} onClick={handleLeave} disabled={busyAction === 'leave'}>
                          {busyAction === 'leave' ? 'Leaving…' : 'Leave'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={s.statsRow}>
                  {[
                    { num: society.memberCount,   label: 'Members' },
                    { num: society.followerCount, label: 'Followers' },
                    { num: society.sectionCount,  label: 'Sections' },
                    { num: society.postCount,     label: 'Posts' },
                  ].map((item, i, arr) => (
                    <div key={item.label} style={{ flex: 1, textAlign: 'center', borderRight: i === arr.length - 1 ? 'none' : '1.5px solid #dce8c0' }}>
                      <span style={s.statNum}>{item.num ?? 0}</span>
                      <span style={s.statLabel}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* POST FORM */}
              {canCreateSocietyPosts && (
                <div style={s.card}>
                  <div style={s.panelHeader}>
                    <h2 style={s.sectionTitle}>Write a post</h2>
                    <span style={s.badge}>Instant</span>
                  </div>
                  <div style={s.fieldWrap}>
                    <label style={s.label}>Content</label>
                    <textarea style={s.textarea} rows={4} placeholder="Share an update with the society…" value={postContent} onChange={(e) => setPostContent(e.target.value)} />
                  </div>
                  <div style={s.fieldWrap}>
                    <label style={s.label}>Section</label>
                    <select style={s.select} value={postSectionId} onChange={(e) => setPostSectionId(e.target.value)}>
                      <option value="">General</option>
                      {sections.map((sec) => <option key={sec._id} value={sec._id}>{sec.name}</option>)}
                    </select>
                  </div>
                  <div style={s.actionsRow}>
                    <button style={{ ...aBtn(), ...s.actionBtnPrimary, opacity: posting || !postContent.trim() ? 0.6 : 1 }} className="sd-aBtnP" onClick={handleCreatePost} disabled={posting || !postContent.trim()}>
                      {posting ? 'Posting…' : 'Post to society →'}
                    </button>
                  </div>
                </div>
              )}

              {isMember && !canCreateSocietyPosts && (
                <div style={s.card}>
                  <div style={s.panelHeader}>
                    <h2 style={s.sectionTitle}>Posting access</h2>
                    <span style={{ ...s.badge, ...s.badgeAccent }}>Restricted</span>
                  </div>
                  <p style={s.emptyText}>Only society moderators and admins can create posts here.</p>
                </div>
              )}

              {/* MANAGE */}
              {canManageSociety && (
                <div style={s.card}>
                  <div style={s.panelHeader}>
                    <h2 style={s.sectionTitle}>Manage society</h2>
                    <button style={aBtn()} className="sd-aBtn" onClick={() => setEditing((p) => !p)}>
                      {editing ? 'Close editor' : 'Edit details'}
                    </button>
                  </div>

                  {editing && (
                    <>
                      <div style={s.fieldWrap}><label style={s.label}>Name</label><input style={s.input} value={editName} onChange={(e) => setEditName(e.target.value)} /></div>
                      <div style={s.fieldWrap}><label style={s.label}>Description</label><textarea style={s.textarea} rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} /></div>
                      <div style={s.fieldWrap}><label style={s.label}>Picture URL</label><input style={s.input} placeholder="https://…" value={editPicture} onChange={(e) => setEditPicture(e.target.value)} /></div>
                      <div style={s.fieldWrap}><label style={s.label}>Upload picture</label><input type="file" accept="image/*" style={s.input} onChange={(e) => setPictureFile(e.target.files?.[0] || null)} /></div>
                      <div style={s.actionsRow}>
                        <button style={{ ...aBtn(), ...s.actionBtnPrimary }} className="sd-aBtnP" onClick={handleSaveSociety} disabled={savingSociety}>
                          {savingSociety ? 'Saving…' : 'Save society'}
                        </button>
                        <button style={aBtn()} className="sd-aBtn" onClick={() => setEditing(false)}>Cancel</button>
                      </div>
                      <div style={s.divider} />
                    </>
                  )}

                  <p style={s.subHeading}>Create section</p>
                  <div style={s.fieldWrap}><label style={s.label}>Section name</label><input style={s.input} placeholder="Finance, HR, Logistics…" value={sectionName} onChange={(e) => setSectionName(e.target.value)} /></div>
                  <div style={s.fieldWrap}><label style={s.label}>Description</label><textarea style={s.textarea} rows={2} value={sectionDescription} onChange={(e) => setSectionDescription(e.target.value)} /></div>
                  <div style={s.actionsRow}>
                    <button style={{ ...aBtn(), ...s.actionBtnPrimary }} className="sd-aBtnP" onClick={handleCreateSection} disabled={creatingSection}>
                      {creatingSection ? 'Creating…' : 'Add section'}
                    </button>
                  </div>

                  <div style={s.divider} />

                  <p style={s.subHeading}>Assign member to section</p>
                  <div style={s.fieldWrap}>
                    <label style={s.label}>Member</label>
                    <select style={s.select} value={assignSectionUserId} onChange={(e) => setAssignSectionUserId(e.target.value)}>
                      <option value="">Select member</option>
                      {members.map((m) => <option key={m._id} value={m.userId?._id}>{m.userId?.name || m.userId?.username}</option>)}
                    </select>
                  </div>
                  <div style={s.fieldWrap}>
                    <label style={s.label}>Section</label>
                    <select style={s.select} value={assignSectionSectionId} onChange={(e) => setAssignSectionSectionId(e.target.value)}>
                      <option value="">Select section</option>
                      {sections.map((sec) => <option key={sec._id} value={sec._id}>{sec.name}</option>)}
                    </select>
                  </div>
                  <div style={s.actionsRow}>
                    <button style={{ ...aBtn(), ...s.actionBtnPrimary }} className="sd-aBtnP" onClick={handleAssignMemberToSection} disabled={assigningMember}>
                      {assigningMember ? 'Assigning…' : 'Assign to section'}
                    </button>
                  </div>
                </div>
              )}

              {/* SECTIONS + MEMBERS GRID */}
              <div style={s.grid} className="sd-grid">
                <div style={s.card}>
                  <div style={s.panelHeader}>
                    <h2 style={s.sectionTitle}>Sections</h2>
                    <span style={s.badge}>{sections.length} total</span>
                  </div>
                  {sections.length === 0
                    ? <p style={s.emptyText}>No sections yet.</p>
                    : sections.map((sec) => (
                      <button key={sec._id} className="sd-secBtn"
                        style={{ ...s.sectionBtn, ...(selectedSectionId === sec._id ? s.sectionBtnActive : {}) }}
                        onClick={async () => { setSelectedSectionId(sec._id); await loadDetail(sec._id) }}
                      >
                        <span style={s.sectionBtnName}>{sec.name}</span>
                        <span style={s.sectionBtnDesc}>{sec.description || 'No description.'}</span>
                      </button>
                    ))
                  }
                </div>

                <div style={s.card}>
                  <div style={s.panelHeader}>
                    <h2 style={s.sectionTitle}>Members</h2>
                    <span style={s.badge}>{members.length} total</span>
                  </div>
                  {members.length === 0
                    ? <p style={s.emptyText}>No members loaded.</p>
                    : members.map((member) => (
                      <div key={member._id} style={s.memberRow}>
                        <Avatar src={member.userId?.avatar} name={member.userId?.name || member.userId?.username} size={40} />
                        <div style={{ minWidth: 0 }}>
                          <p style={s.memberName}>{member.userId?.name || member.userId?.username || 'Member'}</p>
                          <p style={s.memberSub}>@{member.userId?.username} · {getPrivilegeLabel(member)}</p>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>

              {/* POSTS */}
              <div style={s.card}>
                <div style={s.panelHeader}>
                  <h2 style={s.sectionTitle}>Recent posts</h2>
                  <span style={s.badge}>{posts.length} posts</span>
                </div>
                {posts.length === 0
                  ? <p style={s.emptyText}>No posts yet.</p>
                  : posts.map((post) => (
                    <div key={post._id} style={s.postCard}>
                      <div style={s.postMeta}>
                        <div>
                          <p style={s.postSocName}>
                            <Link to={`/societies/${society.society.slug || society.society._id}`} style={s.profileLink} className="sd-link">
                              {society.society.name}
                            </Link>
                          </p>
                          <p style={s.postBy}>
                            by {post.userId?._id
                              ? <Link to={`/profile/${post.userId._id}`} style={s.profileLink} className="sd-link">{post.userId?.name || post.userId?.username || 'Member'}</Link>
                              : post.userId?.name || post.userId?.username || 'Member'
                            }
                          </p>
                        </div>
                        <span style={s.postTag}>{post.sectionId?.name ? `in ${post.sectionId.name}` : 'society post'}</span>
                      </div>
                      <p style={s.postContent}>{post.content}</p>
                    </div>
                  ))
                }
              </div>
            </>
          )}
          </div>
        </div>

        {/* FOOTER */}
        <footer style={s.footer}>✦ UNIVERSE — made with ♥ ✦</footer>
      </div>
    </>
  )
}

export default SocietyDetail