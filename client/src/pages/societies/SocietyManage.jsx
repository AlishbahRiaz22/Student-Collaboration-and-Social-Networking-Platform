import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { searchUsers } from '../../api/users'
import {
  getSociety,
  getSocietyMembers,
  inviteSocietyMember,
  removeSocietyMember,
  updateSociety,
  updateSocietyMember
} from '../../api/societies'
import Avatar from '../../components/Avatar'
import { getPrivilegeInfo, getPrivilegeLabel, getPrivilegeLevel, PRIVILEGE_GUIDE } from '../../utils/societyPrivileges'

const privilegeLevels = ['member', 'moderator', 'admin']

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

const SocietyManage = () => {
  const { identifier } = useParams()
  const navigate = useNavigate()
  const { logout } = useAuth()

  const [society, setSociety] = useState(null)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingSettings, setSavingSettings] = useState(false)
  const [savingMemberId, setSavingMemberId] = useState('')
  const [inviting, setInviting] = useState(false)
  const [settingsInviteOnly, setSettingsInviteOnly] = useState(false)
  const [inviteLookup, setInviteLookup] = useState('')
  const [inviteResults, setInviteResults] = useState([])
  const [inviteSearchLoading, setInviteSearchLoading] = useState(false)
  const [selectedInviteUser, setSelectedInviteUser] = useState(null)
  const [inviteLookupFocused, setInviteLookupFocused] = useState(false)
  const [invitePrivilegeLevel, setInvitePrivilegeLevel] = useState('member')
  const [memberPrivilegeChanges, setMemberPrivilegeChanges] = useState({})
  const [notice, setNotice] = useState('')

  const currentMembership = society?.membership
  const canManageSociety = Boolean(
    currentMembership && (
      getPrivilegeLevel(currentMembership) === 'creator' ||
      getPrivilegeLevel(currentMembership) === 'admin' ||
      currentMembership.permissions?.manageSociety ||
      currentMembership.permissions?.editSociety ||
      currentMembership.permissions?.manageMembers
    )
  )

  const loadData = useCallback(async () => {
    try {
      setLoading(true); setError('')
      const [detail, memberList] = await Promise.all([getSociety(identifier), getSocietyMembers(identifier)])
      setSociety(detail)
      setMembers(memberList)
      setSettingsInviteOnly(Boolean(detail.society?.settings?.inviteOnly))
      setInviteResults([]); setSelectedInviteUser(null); setInviteLookupFocused(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load society management')
    } finally { setLoading(false) }
  }, [identifier])

  useEffect(() => { loadData() }, [loadData])

  useEffect(() => {
    let cancelled = false
    const query = inviteLookup.trim()
    if (query.length < 2) { setInviteResults([]); setSelectedInviteUser(null); setInviteSearchLoading(false); return undefined }
    const timeout = window.setTimeout(async () => {
      try {
        setInviteSearchLoading(true)
        const results = await searchUsers(query)
        if (!cancelled) { setInviteResults(results.filter((u) => u._id !== currentMembership?.userId?._id)); setSelectedInviteUser(null) }
      } catch { if (!cancelled) setInviteResults([]) }
      finally { if (!cancelled) setInviteSearchLoading(false) }
    }, 250)
    return () => { cancelled = true; window.clearTimeout(timeout) }
  }, [inviteLookup, currentMembership?.userId?._id])

  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }

  const handleSaveSettings = async (event) => {
    event.preventDefault()
    if (!canManageSociety || !society?.society) return
    try {
      setSavingSettings(true); setError('')
      await updateSociety(identifier, { settings: { ...(society.society.settings || {}), inviteOnly: settingsInviteOnly } })
      await loadData()
    } catch (err) { setError(err.response?.data?.error || 'Failed to save settings') }
    finally { setSavingSettings(false) }
  }

  const handleInviteMember = async (event) => {
    event.preventDefault()
    if (!canManageSociety || !inviteLookup.trim()) return
    const inviteTarget = selectedInviteUser || inviteResults.find((u) => u.username === inviteLookup.trim())
    if (!inviteTarget) { setError('Choose a user from the dropdown before inviting'); return }
    try {
      setInviting(true); setError(''); setNotice('')
      await inviteSocietyMember(identifier, { userId: inviteTarget._id, privilegeLevel: invitePrivilegeLevel })
      setNotice(`Invited ${inviteTarget.name || inviteTarget.username} successfully.`)
      setInviteLookup(''); setInviteResults([]); setSelectedInviteUser(null); setInvitePrivilegeLevel('member')
      await loadData()
    } catch (err) { setError(err.response?.data?.error || 'Failed to invite member') }
    finally { setInviting(false) }
  }

  const handleSaveMember = async (member) => {
    try {
      setSavingMemberId(member.userId?._id); setError('')
      await updateSocietyMember(identifier, member.userId?._id, {
        privilegeLevel: memberPrivilegeChanges[member.userId?._id] || getPrivilegeLevel(member),
        status: member.status
      })
      await loadData()
    } catch (err) { setError(err.response?.data?.error || 'Failed to update member') }
    finally { setSavingMemberId('') }
  }

  const handleBanMember = async (member) => {
    try {
      setSavingMemberId(member.userId?._id); setError('')
      await updateSocietyMember(identifier, member.userId?._id, { status: 'banned' })
      await loadData()
    } catch (err) { setError(err.response?.data?.error || 'Failed to ban member') }
    finally { setSavingMemberId('') }
  }

  const handleUnbanMember = async (member) => {
    try {
      setSavingMemberId(member.userId?._id); setError('')
      await updateSocietyMember(identifier, member.userId?._id, { status: 'active' })
      await loadData()
    } catch (err) { setError(err.response?.data?.error || 'Failed to unban member') }
    finally { setSavingMemberId('') }
  }

  const handleKickMember = async (member) => {
    try {
      setSavingMemberId(member.userId?._id); setError('')
      await removeSocietyMember(identifier, member.userId?._id)
      await loadData()
    } catch (err) { setError(err.response?.data?.error || 'Failed to remove member') }
    finally { setSavingMemberId('') }
  }

  const managedMembers = useMemo(() => {
    const order = { creator: 0, admin: 1, moderator: 2, member: 3 }
    return [...members].sort((a, b) => (order[getPrivilegeLevel(a)] || 99) - (order[getPrivilegeLevel(b)] || 99))
  }, [members])

  const activeMembers  = managedMembers.filter((m) => m.status === 'active')
  const invitedMembers = managedMembers.filter((m) => m.status === 'invited' || m.status === 'pending')
  const bannedMembers  = managedMembers.filter((m) => m.status === 'banned')

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
      flex: 1, position: 'relative', padding: '80px 20px 48px',
    },
    shell: {
      maxWidth: 820, margin: '0 auto', width: '100%', boxSizing: 'border-box', position: 'relative', zIndex: 5,
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
    cardTitle: {
      fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
      fontSize: '1.1rem', color: '#1a4a1a', margin: 0,
    },
    cardSub: { fontSize: '0.83rem', color: '#5a7a3a', margin: '4px 0 0' },
    panelHeader: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16,
    },
    badge: {
      display: 'inline-block', padding: '4px 12px', borderRadius: 999,
      background: '#d4e6a5', border: '1.5px solid #1a4a1a',
      fontWeight: 700, fontSize: '0.78rem', color: '#1a4a1a', whiteSpace: 'nowrap',
    },
    badgeWarn: { background: '#fff3cd', border: '1.5px solid #e6a817', color: '#7a4a00' },
    badgeDanger: { background: '#ffeef0', border: '1.5px solid #f48fb1', color: '#c62828' },
    kicker: { fontSize: '0.78rem', fontWeight: 700, color: '#5a7a3a', margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' },
    heroName: {
      fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
      fontSize: '1.7rem', color: '#1a4a1a', margin: '0 0 6px',
    },
    heroDesc: { color: '#4a6a2a', fontSize: '0.88rem', margin: 0, lineHeight: 1.6 },
    statsRow: { display: 'flex', borderTop: '1.5px solid #dce8c0', marginTop: 20, paddingTop: 16 },
    statNum: {
      display: 'block', fontFamily: "'Playfair Display', Georgia, serif",
      fontWeight: 900, fontSize: '1.4rem', color: '#1a4a1a',
    },
    statLabel: { fontSize: '0.75rem', color: '#5a7a3a', fontWeight: 700 },

    /* form */
    fieldWrap: { marginBottom: 14 },
    label: { display: 'block', fontWeight: 700, fontSize: '0.83rem', color: '#1a1a1a', marginBottom: 5 },
    input: {
      width: '100%', padding: '10px 13px', boxSizing: 'border-box',
      border: '2px solid #43a047', borderRadius: 10, background: '#f0f7f0',
      fontSize: '0.9rem', fontFamily: "'Nunito', sans-serif", color: '#111', outline: 'none',
    },
    select: {
      width: '100%', padding: '10px 13px', boxSizing: 'border-box',
      border: '2px solid #43a047', borderRadius: 10, background: '#f0f7f0',
      fontSize: '0.9rem', fontFamily: "'Nunito', sans-serif", color: '#111', outline: 'none', cursor: 'pointer',
    },
    toggleRow: {
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '14px 16px', borderRadius: 12, border: '2px solid #dce8c0',
      background: '#fff', marginBottom: 16,
    },
    toggleText: { fontWeight: 700, fontSize: '0.88rem', color: '#1a4a1a', display: 'block' },
    toggleDesc: { fontSize: '0.8rem', color: '#666', margin: '3px 0 0', lineHeight: 1.5 },
    checkbox: { marginTop: 3, accentColor: '#1a4a1a', width: 16, height: 16, cursor: 'pointer' },

    actionsRow: { display: 'flex', gap: 10, marginTop: 8, flexWrap: 'wrap' },
    aBtn: {
      padding: '8px 18px', borderRadius: 10, fontWeight: 700, fontSize: '0.85rem',
      border: '2px solid #1a4a1a', background: 'none', color: '#1a4a1a',
      cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
    },
    aBtnP: { background: '#1a4a1a', color: '#fff', border: 'none' },
    aBtnW: { borderColor: '#e6a817', color: '#7a4a00' },
    aBtnD: { borderColor: '#c62828', color: '#c62828' },

    errorBox: {
      background: '#ffeef0', border: '1.5px solid #f48fb1', borderRadius: 10,
      padding: '10px 14px', color: '#c62828', fontSize: '0.85rem', fontWeight: 700, marginBottom: 16,
    },
    noticeBox: {
      background: '#e8f5e0', border: '1.5px solid #43a047', borderRadius: 10,
      padding: '10px 14px', color: '#1a4a1a', fontSize: '0.85rem', fontWeight: 700, marginBottom: 16,
    },
    emptyText: { color: '#5a7a3a', fontSize: '0.88rem', fontStyle: 'italic', margin: 0 },
    divider: { borderTop: '1.5px solid #dce8c0', margin: '16px 0' },

    /* privilege grid */
    privGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 },
    privCard: {
      borderRadius: 14, border: '2px solid #dce8c0', background: '#fff',
      padding: '14px 16px',
    },
    privName: { fontWeight: 800, fontSize: '0.88rem', color: '#1a4a1a', margin: '0 0 4px' },
    privDesc: { fontSize: '0.78rem', color: '#5a7a3a', margin: '0 0 8px', lineHeight: 1.5 },
    privGrants: { paddingLeft: 16, margin: 0, fontSize: '0.75rem', color: '#444', lineHeight: 1.8 },

    /* member rows */
    memberRow: {
      display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 0',
      borderBottom: '1px solid #eef3e2', flexWrap: 'wrap',
    },
    memberInfo: { flex: 1, minWidth: 120 },
    memberName: { fontWeight: 700, fontSize: '0.9rem', color: '#1a1a1a', margin: 0 },
    memberSub: { fontSize: '0.78rem', color: '#5a7a3a', margin: '2px 0 0' },
    memberControls: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
    miniSelect: {
      padding: '6px 10px', border: '2px solid #43a047', borderRadius: 8,
      background: '#f0f7f0', fontSize: '0.82rem', fontFamily: "'Nunito', sans-serif",
      color: '#111', cursor: 'pointer', outline: 'none',
    },

    /* invite dropdown */
    dropdownWrap: { position: 'relative', marginBottom: 14 },
    dropdown: {
      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
      background: '#fff', border: '2px solid #43a047', borderRadius: 10,
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden',
    },
    dropItem: {
      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
      background: 'none', border: 'none', width: '100%', textAlign: 'left',
      cursor: 'pointer', fontFamily: "'Nunito', sans-serif", borderBottom: '1px solid #eef3e2',
    },
    dropItemName: { fontWeight: 700, fontSize: '0.88rem', color: '#1a4a1a', display: 'block' },
    dropItemUser: { fontSize: '0.78rem', color: '#5a7a3a', display: 'block' },
    dropEmpty: { padding: '10px 14px', fontSize: '0.85rem', color: '#5a7a3a', fontStyle: 'italic' },
  }

  const aBtn = (extra = {}) => ({ ...s.aBtn, ...extra })

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes floatKey {
          0%,100% { transform: translateY(0) rotate(var(--rot,0deg)); }
          50%      { transform: translateY(-7px) rotate(var(--rot,0deg)); }
        }
        .sm-navA:hover { color:#2e7d32 !important; }
        .sm-aBtn:hover { background:#e8f5e0 !important; }
        .sm-aBtnP:hover { background:#2e7d32 !important; }
        .sm-aBtnW:hover { background:#fff8e1 !important; }
        .sm-aBtnD:hover { background:#ffeef0 !important; }
        .sm-drop:hover { background:#eef3e2 !important; }
        @media(max-width:640px){
          .sm-navA{display:none !important;}
          .sm-nav{padding:0 16px !important;}
        }
      `}</style>

      <div style={s.page}>
        {/* NAV */}
        <nav style={s.nav} className="sm-nav">
          <div style={s.navLeft}>
            <Link to="/" style={s.logo}>★ UNIVERSE</Link>
            <Link to="/feed"        style={s.navA} className="sm-navA">Feed</Link>
            <Link to="/create-post" style={s.navA} className="sm-navA">Create Post</Link>
            <Link to="/societies"   style={s.navA} className="sm-navA">Societies</Link>
            <Link to="/explore"   style={s.navA} className="sm-navA">Explore</Link>
            <Link to="/messages"  style={s.navA} className="sm-navA">Messages</Link>
            <Link to="/settings"  style={s.navA} className="sm-navA">Settings</Link>
            <Link to="/about"     style={s.navA} className="sm-navA">About</Link>
            <Link to="/contact"   style={s.navA} className="sm-navA">Contact</Link>
          </div>
          <div style={s.navRight}>
            {society && (
              <Link to={`/societies/${society.society?.slug || society.society?._id}`} style={s.btnOutline}>
                ← Back to society
              </Link>
            )}
            <button style={s.btnFill} onClick={handleLogout}>Logout</button>
          </div>
        </nav>

        {/* BODY */}
        <div style={s.body}>
          {/* Floating keys spell M-A-N-A-G-E */}
          <Key letter="M" color="#f4845f" style={{ left: '1.5%', top: '8%',  '--rot': '-9deg' }} />
          <Key letter="A" color="#f6c94e" style={{ left: '3%',   top: '30%', '--rot': '7deg',  animationDelay: '0.4s' }} />
          <Key letter="N" color="#60c4f4" style={{ left: '1.5%', top: '56%', '--rot': '-5deg', animationDelay: '0.8s' }} />
          <Key letter="A" color="#49c4a0" style={{ right: '3%',  top: '8%',  '--rot': '8deg',  animationDelay: '0.2s' }} />
          <Key letter="G" color="#a78bfa" style={{ right: '1.5%',top: '30%', '--rot': '-6deg', animationDelay: '0.6s' }} />
          <Key letter="E" color="#f4845f" style={{ right: '3%',  top: '56%', '--rot': '5deg',  animationDelay: '1.0s' }} />
          <div style={s.shell}>
          {loading && (
            <div style={{ textAlign: 'center', color: '#1a4a1a', fontWeight: 700, padding: 60 }}>
              Loading management page…
            </div>
          )}
          {error && <div style={s.errorBox}>⚠ {error}</div>}
          {notice && <div style={s.noticeBox}>✓ {notice}</div>}

          {!loading && society && (
            <>
              {/* HERO */}
              <div style={s.card}>
                <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <Avatar src={society.society.picture} name={society.society.name} size={72} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={s.kicker}>People and access</p>
                    <h1 style={s.heroName}>Manage {society.society.name}</h1>
                    <p style={s.heroDesc}>Control privileges, ban or remove users, and configure access policy.</p>
                  </div>
                </div>
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

              {!canManageSociety ? (
                <div style={s.errorBox}>⚠ You do not have permission to manage this society.</div>
              ) : (
                <>
                  {/* ACCESS POLICY */}
                  <div style={s.card}>
                    <div style={s.panelHeader}>
                      <div>
                        <h2 style={s.cardTitle}>Access policy</h2>
                        <p style={s.cardSub}>Invite-only societies only accept members invited by a manager.</p>
                      </div>
                      <span style={s.badge}>{settingsInviteOnly ? 'Invite only' : 'Open'}</span>
                    </div>
                    <label style={s.toggleRow}>
                      <input
                        type="checkbox" style={s.checkbox}
                        checked={settingsInviteOnly}
                        onChange={(e) => setSettingsInviteOnly(e.target.checked)}
                      />
                      <div>
                        <span style={s.toggleText}>Invite only</span>
                        <p style={s.toggleDesc}>Members can only join after a manager invites them. Public discovery still works.</p>
                      </div>
                    </label>
                    <div style={s.actionsRow}>
                      <button style={{ ...aBtn(), ...s.aBtnP }} className="sm-aBtnP" onClick={handleSaveSettings} disabled={savingSettings}>
                        {savingSettings ? 'Saving…' : 'Save access policy'}
                      </button>
                    </div>
                  </div>

                  {/* PRIVILEGE GUIDE */}
                  <div style={s.card}>
                    <div style={s.panelHeader}>
                      <div>
                        <h2 style={s.cardTitle}>Privilege levels</h2>
                        <p style={s.cardSub}>Use these to grant access without changing membership itself.</p>
                      </div>
                      <span style={s.badge}>{Object.keys(PRIVILEGE_GUIDE).length} levels</span>
                    </div>
                    <div style={s.privGrid}>
                      {Object.entries(PRIVILEGE_GUIDE).map(([level, info]) => (
                        <div key={level} style={s.privCard}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <p style={s.privName}>{info.label}</p>
                            <span style={s.badge}>{level}</span>
                          </div>
                          <p style={s.privDesc}>{info.description}</p>
                          <ul style={s.privGrants}>
                            {info.grants.map((g) => <li key={g}>{g}</li>)}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* INVITE */}
                  <div style={s.card}>
                    <div style={s.panelHeader}>
                      <div>
                        <h2 style={s.cardTitle}>Invite people</h2>
                        <p style={s.cardSub}>Search by username or email, then select from results.</p>
                      </div>
                    </div>

                    <div style={s.dropdownWrap}>
                      <label style={s.label}>User lookup</label>
                      <input
                        style={s.input}
                        value={inviteLookup}
                        onChange={(e) => { setInviteLookup(e.target.value); setSelectedInviteUser(null) }}
                        onFocus={() => setInviteLookupFocused(true)}
                        onBlur={() => setInviteLookupFocused(false)}
                        placeholder="username or email"
                        autoComplete="off"
                      />
                      {inviteLookupFocused && (
                        <div style={s.dropdown}>
                          {inviteSearchLoading && <div style={s.dropEmpty}>Searching…</div>}
                          {!inviteSearchLoading && inviteLookup.trim().length >= 2 && inviteResults.length === 0 && (
                            <div style={s.dropEmpty}>No matching users found.</div>
                          )}
                          {!inviteSearchLoading && inviteResults.map((user) => (
                            <button
                              key={user._id} type="button"
                              style={s.dropItem} className="sm-drop"
                              onMouseDown={(e) => {
                                e.preventDefault()
                                setInviteLookup(user.username)
                                setSelectedInviteUser(user)
                                setInviteResults([])
                                setInviteLookupFocused(false)
                                setNotice('')
                              }}
                            >
                              <Avatar src={user.avatar} name={user.name || user.username} size={30} />
                              <div>
                                <span style={s.dropItemName}>{user.name || user.username}</span>
                                <span style={s.dropItemUser}>@{user.username}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={s.fieldWrap}>
                      <label style={s.label}>Privilege level</label>
                      <select style={s.select} value={invitePrivilegeLevel} onChange={(e) => setInvitePrivilegeLevel(e.target.value)}>
                        {privilegeLevels.map((level) => (
                          <option key={level} value={level}>{getPrivilegeLabel(level)}</option>
                        ))}
                      </select>
                    </div>

                    <div style={s.actionsRow}>
                      <button style={{ ...aBtn(), ...s.aBtnP }} className="sm-aBtnP" onClick={handleInviteMember} disabled={inviting}>
                        {inviting ? 'Sending invite…' : 'Invite member'}
                      </button>
                    </div>
                  </div>

                  {/* ACTIVE MEMBERS */}
                  <div style={s.card}>
                    <div style={s.panelHeader}>
                      <div>
                        <h2 style={s.cardTitle}>Members</h2>
                        <p style={s.cardSub}>Adjust privileges, ban, or remove members.</p>
                      </div>
                      <span style={s.badge}>{activeMembers.length} active</span>
                    </div>

                    {activeMembers.length === 0
                      ? <p style={s.emptyText}>No members loaded.</p>
                      : activeMembers.map((member) => {
                        const privilegeLevel = getPrivilegeLevel(member)
                        const privilegeInfo  = getPrivilegeInfo(privilegeLevel)
                        const locked  = privilegeLevel === 'creator'
                        const memberId = member.userId?._id
                        return (
                          <div key={member._id} style={s.memberRow}>
                            <Avatar src={member.userId?.avatar} name={member.userId?.name || member.userId?.username} size={42} />
                            <div style={s.memberInfo}>
                              <p style={s.memberName}>{member.userId?.name || member.userId?.username || 'Member'}</p>
                              <p style={s.memberSub}>@{member.userId?.username} · {privilegeInfo.label}{member.status !== 'active' ? ` · ${member.status}` : ''}</p>
                            </div>
                            <div style={s.memberControls}>
                              <select
                                style={s.miniSelect}
                                value={memberPrivilegeChanges[memberId] || privilegeLevel}
                                onChange={(e) => setMemberPrivilegeChanges((prev) => ({ ...prev, [memberId]: e.target.value }))}
                                disabled={locked}
                              >
                                {privilegeLevels.map((lvl) => <option key={lvl} value={lvl}>{getPrivilegeLabel(lvl)}</option>)}
                              </select>
                              <button style={aBtn()} className="sm-aBtn" onClick={() => handleSaveMember(member)} disabled={locked || savingMemberId === memberId}>
                                {savingMemberId === memberId ? 'Saving…' : 'Save'}
                              </button>
                              <button style={aBtn(s.aBtnW)} className="sm-aBtnW" onClick={() => handleBanMember(member)} disabled={locked || savingMemberId === memberId}>
                                Ban
                              </button>
                              <button style={aBtn(s.aBtnD)} className="sm-aBtnD" onClick={() => handleKickMember(member)} disabled={locked || savingMemberId === memberId}>
                                Kick
                              </button>
                            </div>
                          </div>
                        )
                      })
                    }
                  </div>

                  {/* INVITED */}
                  {invitedMembers.length > 0 && (
                    <div style={s.card}>
                      <div style={s.panelHeader}>
                        <div>
                          <h2 style={s.cardTitle}>Invited users</h2>
                          <p style={s.cardSub}>These users haven't joined yet — they'll see Accept Invite on the society page.</p>
                        </div>
                        <span style={{ ...s.badge, ...s.badgeWarn }}>{invitedMembers.length} invited</span>
                      </div>
                      {invitedMembers.map((member) => {
                        const memberId = member.userId?._id
                        return (
                          <div key={member._id} style={s.memberRow}>
                            <Avatar src={member.userId?.avatar} name={member.userId?.name || member.userId?.username} size={42} />
                            <div style={s.memberInfo}>
                              <p style={s.memberName}>{member.userId?.name || member.userId?.username || 'Member'}</p>
                              <p style={s.memberSub}>@{member.userId?.username} · waiting to accept</p>
                            </div>
                            <button style={aBtn(s.aBtnD)} className="sm-aBtnD" onClick={() => handleKickMember(member)} disabled={savingMemberId === memberId}>
                              {savingMemberId === memberId ? 'Removing…' : 'Cancel invite'}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* BANNED */}
                  <div style={s.card}>
                    <div style={s.panelHeader}>
                      <div>
                        <h2 style={s.cardTitle}>Banned users</h2>
                        <p style={s.cardSub}>Review and restore access when needed.</p>
                      </div>
                      <span style={{ ...s.badge, ...s.badgeDanger }}>{bannedMembers.length} banned</span>
                    </div>
                    {bannedMembers.length === 0
                      ? <p style={s.emptyText}>No banned users.</p>
                      : bannedMembers.map((member) => {
                        const memberId = member.userId?._id
                        return (
                          <div key={member._id} style={s.memberRow}>
                            <Avatar src={member.userId?.avatar} name={member.userId?.name || member.userId?.username} size={42} />
                            <div style={s.memberInfo}>
                              <p style={s.memberName}>{member.userId?.name || member.userId?.username || 'Member'}</p>
                              <p style={s.memberSub}>@{member.userId?.username} · banned</p>
                            </div>
                            <button style={{ ...aBtn(), ...s.aBtnP }} className="sm-aBtnP" onClick={() => handleUnbanMember(member)} disabled={savingMemberId === memberId}>
                              {savingMemberId === memberId ? 'Restoring…' : 'Unban'}
                            </button>
                          </div>
                        )
                      })
                    }
                  </div>
                </>
              )}
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

export default SocietyManage