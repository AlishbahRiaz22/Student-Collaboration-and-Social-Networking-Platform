import { useEffect, useMemo, useState } from 'react'
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
import '../Feed.css'
import './societies.css'

const privilegeLevels = ['member', 'moderator', 'admin']

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

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')

      const [detail, memberList] = await Promise.all([
        getSociety(identifier),
        getSocietyMembers(identifier)
      ])

      setSociety(detail)
      setMembers(memberList)
      setSettingsInviteOnly(Boolean(detail.society?.settings?.inviteOnly))
      setInviteResults([])
      setSelectedInviteUser(null)
      setInviteLookupFocused(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load society management')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [identifier])

  useEffect(() => {
    let cancelled = false
    const query = inviteLookup.trim()

    if (query.length < 2) {
      setInviteResults([])
      setSelectedInviteUser(null)
      setInviteSearchLoading(false)
      return undefined
    }

    const timeout = window.setTimeout(async () => {
      try {
        setInviteSearchLoading(true)
        const results = await searchUsers(query)

        if (!cancelled) {
          setInviteResults(results.filter((user) => user._id !== currentMembership?.userId?._id))
          setSelectedInviteUser(null)
        }
      } catch {
        if (!cancelled) {
          setInviteResults([])
        }
      } finally {
        if (!cancelled) {
          setInviteSearchLoading(false)
        }
      }
    }, 250)

    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [inviteLookup, currentMembership?.userId?._id])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const handleSaveSettings = async (event) => {
    event.preventDefault()
    if (!canManageSociety || !society?.society) return

    try {
      setSavingSettings(true)
      setError('')

      await updateSociety(identifier, {
        settings: {
          ...(society.society.settings || {}),
          inviteOnly: settingsInviteOnly
        }
      })

      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save society settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleInviteMember = async (event) => {
    event.preventDefault()
    if (!canManageSociety || !inviteLookup.trim()) return

    const inviteTarget = selectedInviteUser || inviteResults.find((user) => user.username === inviteLookup.trim())

    if (!inviteTarget) {
      setError('Choose a user from the dropdown before inviting')
      return
    }

    try {
      setInviting(true)
      setError('')
      setNotice('')

      await inviteSocietyMember(identifier, {
        userId: inviteTarget._id,
        privilegeLevel: invitePrivilegeLevel
      })

      setNotice(`Invited ${inviteTarget.name || inviteTarget.username} successfully.`)
      setInviteLookup('')
      setInviteResults([])
      setSelectedInviteUser(null)
      setInvitePrivilegeLevel('member')
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to invite member')
    } finally {
      setInviting(false)
    }
  }

  const handleSaveMember = async (member) => {
    try {
      setSavingMemberId(member.userId?._id)
      setError('')

      await updateSocietyMember(identifier, member.userId?._id, {
        privilegeLevel: memberPrivilegeChanges[member.userId?._id] || getPrivilegeLevel(member),
        status: member.status
      })

      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update member')
    } finally {
      setSavingMemberId('')
    }
  }

  const handleBanMember = async (member) => {
    try {
      setSavingMemberId(member.userId?._id)
      setError('')

      await updateSocietyMember(identifier, member.userId?._id, {
        status: 'banned'
      })

      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to ban member')
    } finally {
      setSavingMemberId('')
    }
  }

  const handleUnbanMember = async (member) => {
    try {
      setSavingMemberId(member.userId?._id)
      setError('')

      await updateSocietyMember(identifier, member.userId?._id, {
        status: 'active'
      })

      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to unban member')
    } finally {
      setSavingMemberId('')
    }
  }

  const handleKickMember = async (member) => {
    try {
      setSavingMemberId(member.userId?._id)
      setError('')

      await removeSocietyMember(identifier, member.userId?._id)
      await loadData()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove member')
    } finally {
      setSavingMemberId('')
    }
  }

  const managedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const order = { creator: 0, admin: 1, moderator: 2, member: 3 }
      return (order[getPrivilegeLevel(a)] || 99) - (order[getPrivilegeLevel(b)] || 99)
    })
  }, [members])

  const activeMembers = managedMembers.filter((member) => member.status === 'active')
  const invitedMembers = managedMembers.filter((member) => member.status === 'invited' || member.status === 'pending')
  const bannedMembers = managedMembers.filter((member) => member.status === 'banned')

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

      <div className="feed-container societies-container societies-container--wide">
        {loading && <div className="feed-status">Loading management page...</div>}
        {error && <div className="feed-status feed-error">{error}</div>}

        {!loading && society && (
          <>
            <section className="society-header-card">
              <div className="society-header-top">
                <div className="society-header-brand">
                  <Avatar src={society.society.picture} name={society.society.name} size={72} />
                  <div>
                    <p className="societies-kicker">People and access</p>
                    <h1 className="society-title-black">Manage {society.society.name}</h1>
                    <p className="societies-summary">
                      Control privileges, ban or remove users, and lock the society to invite-only access.
                    </p>
                  </div>
                </div>
                <div className="society-header-actions">
                  <Link to={`/societies/${society.society.slug || society.society._id}`} className="settings-btn">
                    Back to society
                  </Link>
                </div>
              </div>

              <div className="society-stats">
                <div><strong>{society.memberCount}</strong><span>Members</span></div>
                <div><strong>{society.followerCount}</strong><span>Followers</span></div>
                <div><strong>{society.sectionCount}</strong><span>Sections</span></div>
                <div><strong>{society.postCount}</strong><span>Posts</span></div>
              </div>
            </section>

            {!canManageSociety ? (
              <div className="feed-status feed-error">You do not have permission to manage this society.</div>
            ) : (
              <>
                <section className="societies-panel">
                  <div className="societies-panel-header">
                    <div>
                      <h2>Access policy</h2>
                      <p className="societies-summary">Invite-only societies only accept members who have been invited by a manager.</p>
                    </div>
                    <span>{settingsInviteOnly ? 'Invite only' : 'Open'}</span>
                  </div>

                  <form className="society-form" onSubmit={handleSaveSettings}>
                    <label className="society-toggle-row">
                      <input
                        type="checkbox"
                        checked={settingsInviteOnly}
                        onChange={(event) => {
                          const nextValue = event.target.checked
                          setSettingsInviteOnly(nextValue)
                        }}
                      />
                      <div>
                        <strong>Invite only</strong>
                        <p>Members can only join after a manager invites them. Public discovery still works.</p>
                      </div>
                    </label>

                    <div className="settings-actions">
                      <button type="submit" className="settings-btn settings-btn-primary" disabled={savingSettings}>
                        {savingSettings ? 'Saving...' : 'Save access policy'}
                      </button>
                    </div>
                  </form>
                </section>

                <section className="societies-panel">
                  <div className="societies-panel-header">
                    <div>
                      <h2>Privilege levels</h2>
                      <p className="societies-summary">Use these levels to grant access without changing membership itself.</p>
                    </div>
                    <span>{Object.keys(PRIVILEGE_GUIDE).length} levels</span>
                  </div>

                  <div className="society-privilege-grid">
                    {Object.entries(PRIVILEGE_GUIDE).map(([level, info]) => (
                      <article key={level} className="society-privilege-card">
                        <div className="society-card-top">
                          <strong>{info.label}</strong>
                          <span className="society-role-badge">{level}</span>
                        </div>
                        <p>{info.description}</p>
                        <ul>
                          {info.grants.map((grant) => (
                            <li key={grant}>{grant}</li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="societies-panel">
                  <div className="societies-panel-header">
                    <div>
                      <h2>Invite people</h2>
                      <p className="societies-summary">Look up a user by username or email and select one of the matching users.</p>
                    </div>
                  </div>

                  <form className="society-form society-invite-form" onSubmit={handleInviteMember}>
                    <div className="society-field">
                      <span>User lookup</span>
                      <input
                        value={inviteLookup}
                        onChange={(event) => {
                          setInviteLookup(event.target.value)
                          setSelectedInviteUser(null)
                        }}
                        onFocus={() => setInviteLookupFocused(true)}
                        onBlur={() => setInviteLookupFocused(false)}
                        className="profile-input"
                        placeholder="username or email"
                        autoComplete="off"
                      />
                      <div className="society-lookup-dropdown">
                        {inviteLookupFocused && inviteSearchLoading && <div className="society-lookup-empty">Searching...</div>}
                        {inviteLookupFocused && !inviteSearchLoading && inviteLookup.trim().length >= 2 && inviteResults.length === 0 && (
                          <div className="society-lookup-empty">No matching users found.</div>
                        )}
                        {inviteLookupFocused && !inviteSearchLoading && inviteResults.length > 0 && (
                          <div className="society-lookup-list" role="listbox">
                            {inviteResults.map((user) => (
                              <button
                                key={user._id}
                                type="button"
                                className="society-lookup-item"
                                onMouseDown={(event) => {
                                  event.preventDefault()
                                  setInviteLookup(user.username)
                                  setSelectedInviteUser(user)
                                  setInviteResults([])
                                  setInviteLookupFocused(false)
                                  setNotice('')
                                }}
                              >
                                <Avatar src={user.avatar} name={user.name || user.username} size={30} />
                                <div>
                                  <strong>{user.name || user.username}</strong>
                                  <span>@{user.username}</span>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <label className="society-field">
                      <span>Privilege level</span>
                      <select
                        value={invitePrivilegeLevel}
                        onChange={(event) => setInvitePrivilegeLevel(event.target.value)}
                        className="profile-input"
                      >
                        {privilegeLevels.map((level) => (
                          <option key={level} value={level}>
                            {getPrivilegeLabel(level)}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="settings-actions">
                      <button type="submit" className="settings-btn settings-btn-primary" disabled={inviting}>
                        {inviting ? 'Sending invite...' : 'Invite member'}
                      </button>
                    </div>

                    {notice && <p className="settings-status" style={{ gridColumn: '1 / -1' }}>{notice}</p>}
                  </form>
                </section>

                <section className="societies-panel">
                  <div className="societies-panel-header">
                    <div>
                      <h2>Members</h2>
                      <p className="societies-summary">Adjust privilege levels, ban users, or remove them from the society.</p>
                    </div>
                    <span>{activeMembers.length} active</span>
                  </div>

                  {activeMembers.length === 0 ? (
                    <p className="societies-empty">No members loaded.</p>
                  ) : (
                    <div className="society-member-list">
                      {activeMembers.map((member) => {
                        const privilegeLevel = getPrivilegeLevel(member)
                        const privilegeInfo = getPrivilegeInfo(privilegeLevel)
                        const locked = privilegeLevel === 'creator'
                        const memberId = member.userId?._id

                        return (
                          <div key={member._id} className="society-member-row">
                            <Avatar src={member.userId?.avatar} name={member.userId?.name || member.userId?.username} size={40} />
                            <div style={{ minWidth: 0 }}>
                              <strong>{member.userId?.name || member.userId?.username || 'Member'}</strong>
                              <p>@{member.userId?.username}</p>
                              <p className="society-member-meta">
                                {privilegeInfo.label} {member.status !== 'active' ? `• ${member.status}` : ''}
                              </p>
                            </div>
                            <div className="society-member-controls">
                              <label className="society-field">
                                <span>Privilege level</span>
                                <select
                                  value={memberPrivilegeChanges[memberId] || privilegeLevel}
                                  onChange={(event) => setMemberPrivilegeChanges((prev) => ({ ...prev, [memberId]: event.target.value }))}
                                  className="profile-input society-mini-select"
                                  disabled={locked}
                                >
                                  {privilegeLevels.map((level) => (
                                    <option key={level} value={level}>{getPrivilegeLabel(level)}</option>
                                  ))}
                                </select>
                              </label>

                              <div className="society-member-actions">
                                <button
                                  type="button"
                                  className="settings-btn"
                                  onClick={() => handleSaveMember(member)}
                                  disabled={locked || savingMemberId === memberId}
                                >
                                  {savingMemberId === memberId ? 'Saving...' : 'Save'}
                                </button>
                                <button
                                  type="button"
                                  className="settings-btn settings-btn-warning"
                                  onClick={() => handleBanMember(member)}
                                  disabled={locked || savingMemberId === memberId}
                                >
                                  Ban
                                </button>
                                <button
                                  type="button"
                                  className="settings-btn settings-btn-danger"
                                  onClick={() => handleKickMember(member)}
                                  disabled={locked || savingMemberId === memberId}
                                >
                                  Kick
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>

                {invitedMembers.length > 0 && (
                  <section className="societies-panel">
                    <div className="societies-panel-header">
                      <div>
                        <h2>Invited users</h2>
                        <p className="societies-summary">These users have not joined yet. They will see Accept Invite on the society page.</p>
                      </div>
                      <span>{invitedMembers.length} invited</span>
                    </div>

                    <div className="society-member-list">
                      {invitedMembers.map((member) => {
                        const memberId = member.userId?._id

                        return (
                          <div key={member._id} className="society-member-row">
                            <Avatar src={member.userId?.avatar} name={member.userId?.name || member.userId?.username} size={40} />
                            <div style={{ minWidth: 0 }}>
                              <strong>{member.userId?.name || member.userId?.username || 'Member'}</strong>
                              <p>@{member.userId?.username}</p>
                              <p className="society-member-meta">Invited member • waiting to accept</p>
                            </div>
                            <div className="society-member-controls">
                              <div className="society-member-actions society-member-actions--single">
                                <button
                                  type="button"
                                  className="settings-btn settings-btn-danger"
                                  onClick={() => handleKickMember(member)}
                                  disabled={savingMemberId === memberId}
                                >
                                  {savingMemberId === memberId ? 'Removing...' : 'Cancel invite'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )}

                <section className="societies-panel">
                  <div className="societies-panel-header">
                    <div>
                      <h2>Banned users</h2>
                      <p className="societies-summary">Review banned users and restore access when needed.</p>
                    </div>
                    <span>{bannedMembers.length} banned</span>
                  </div>

                  {bannedMembers.length === 0 ? (
                    <p className="societies-empty">No banned users.</p>
                  ) : (
                    <div className="society-member-list">
                      {bannedMembers.map((member) => {
                        const memberId = member.userId?._id

                        return (
                          <div key={member._id} className="society-member-row">
                            <Avatar src={member.userId?.avatar} name={member.userId?.name || member.userId?.username} size={40} />
                            <div style={{ minWidth: 0 }}>
                              <strong>{member.userId?.name || member.userId?.username || 'Member'}</strong>
                              <p>@{member.userId?.username}</p>
                              <p className="society-member-meta">Banned member</p>
                            </div>
                            <div className="society-member-controls">
                              <div className="society-member-actions society-member-actions--single">
                                <button
                                  type="button"
                                  className="settings-btn settings-btn-primary"
                                  onClick={() => handleUnbanMember(member)}
                                  disabled={savingMemberId === memberId}
                                >
                                  {savingMemberId === memberId ? 'Restoring...' : 'Unban'}
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </section>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default SocietyManage
