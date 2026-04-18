import { useEffect, useState } from 'react'
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
  removeSocietySectionMember,
  updateSociety,
  unfollowSociety
} from '../../api/societies'
import Avatar from '../../components/Avatar'
import { getPrivilegeLabel, getPrivilegeLevel } from '../../utils/societyPrivileges'
import '../Feed.css'
import './societies.css'

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

  const updateSocietyState = (updater) => {
    setSociety((prev) => (prev ? updater(prev) : prev))
  }

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

  const loadDetail = async (sectionId = selectedSectionId) => {
    try {
      setLoading(true)
      setError('')

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
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (isMember) return

    try {
      setBusyAction('join')
      const membershipResult = await joinSociety(identifier)
      setSociety((prev) => (prev ? {
        ...prev,
        membership: membershipResult,
      } : prev))
      await loadDetail(selectedSectionId)
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed')
    } finally {
      setBusyAction('')
    }
  }

  const handleFollow = async () => {
    try {
      setBusyAction('follow')
      await (isFollowing ? unfollowSociety(identifier) : followSociety(identifier))
      setFollowState(!isFollowing)
      await loadDetail(selectedSectionId)
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed')
    } finally {
      setBusyAction('')
    }
  }

  const handleLeave = async () => {
    if (!isMember) return

    try {
      setBusyAction('leave')
      await leaveSociety(identifier)
      setLeaveState()

      if (society?.society?.visibility !== 'private') {
        await loadDetail('')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Action failed')
    } finally {
      setBusyAction('')
    }
  }

  const handleSaveSociety = async (event) => {
    event.preventDefault()

    if (!canManageSociety) return

    try {
      setSavingSociety(true)
      setError('')

      const formData = new FormData()
      formData.append('name', editName)
      formData.append('description', editDescription)
      formData.append('picture', editPicture)
      formData.append('settings', JSON.stringify(society.society.settings || {}))

      if (pictureFile) {
        formData.append('pictureFile', pictureFile)
      }

      await updateSociety(identifier, formData)
      await loadDetail(selectedSectionId)
      setEditing(false)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save society')
    } finally {
      setSavingSociety(false)
    }
  }

  const handleCreateSection = async (event) => {
    event.preventDefault()

    if (!canManageSociety || !sectionName.trim()) return

    try {
      setCreatingSection(true)
      setError('')

      await createSocietySection(identifier, {
        name: sectionName.trim(),
        description: sectionDescription.trim(),
        order: sections.length
      })

      await loadDetail(selectedSectionId)
      setSectionName('')
      setSectionDescription('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create section')
    } finally {
      setCreatingSection(false)
    }
  }

  const handleCreatePost = async (event) => {
    event.preventDefault()

    if (!postContent.trim()) return

    try {
      setPosting(true)
      setError('')

      const createdPost = await postToSociety({
        content: postContent.trim(),
        societyId: society.society._id,
        sectionId: postSectionId || undefined
      })

      setPosts((prev) => [createdPost, ...prev])
      setPostContent('')
      setPostSectionId('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create post')
    } finally {
      setPosting(false)
    }
  }

  const handleAssignMemberToSection = async (event) => {
    event.preventDefault()

    if (!assignSectionUserId || !assignSectionSectionId) return

    try {
      setAssigningMember(true)
      setError('')

      await assignSocietySectionMember(identifier, assignSectionSectionId, { userId: assignSectionUserId })
      await loadDetail(selectedSectionId)
      setAssignSectionUserId('')
      setAssignSectionSectionId('')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to assign member')
    } finally {
      setAssigningMember(false)
    }
  }

  const handleRemoveSectionAssignment = async (sectionId, userId) => {
    try {
      setBusyAction(`section:${sectionId}:${userId}`)
      setError('')

      await removeSocietySectionMember(identifier, sectionId, userId)
      await loadDetail(selectedSectionId)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to remove assignment')
    } finally {
      setBusyAction('')
    }
  }

  useEffect(() => {
    loadDetail('')
  }, [identifier])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
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

      <div className="feed-container societies-container societies-container--wide">
        {loading && <div className="feed-status">Loading society...</div>}
        {error && <div className="feed-status feed-error">{error}</div>}
        {!loading && society && (
          <>
            <section className="society-header-card">
              <div className="society-header-top">
                <div className="society-header-brand">
                  <Avatar src={society.society.picture} name={society.society.name} size={72} />
                  <div>
                    <p className="societies-kicker">{society.society.visibility} society</p>
                    <h1 className="society-title-black">{society.society.name}</h1>
                    <p className="societies-summary">{society.society.description || 'No description yet.'}</p>
                    <div className="society-detail-badges">
                      <span className="society-role-badge">{society.society.visibility}</span>
                      {society.society.settings?.inviteOnly && <span className="society-role-badge society-role-badge--accent">invite only</span>}
                      {isInvited && <span className="society-role-badge society-role-badge--accent">invited</span>}
                      {showMembershipTag && <span className="society-role-badge">{getPrivilegeLabel(membership)}</span>}
                    </div>
                  </div>
                </div>
                <div className="society-header-actions">
                  {canManageSociety && (
                    <Link to={`/societies/${society.society.slug || society.society._id}/manage`} className="settings-btn">
                      Manage people
                    </Link>
                  )}
                  {(canJoinSociety || canAcceptInvite) && (
                    <button
                      className="settings-btn settings-btn-primary"
                      onClick={handleJoin}
                      disabled={busyAction === 'join' || isMember}
                    >
                      {busyAction === 'join' ? 'Joining...' : (canAcceptInvite ? 'Accept Invite' : 'Join')}
                    </button>
                  )}
                  <button
                    className="settings-btn"
                    onClick={handleFollow}
                    disabled={busyAction === 'follow'}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                  {canLeaveSociety && (
                    <button
                      className="settings-btn"
                      onClick={handleLeave}
                      disabled={busyAction === 'leave'}
                    >
                      {busyAction === 'leave' ? 'Leaving...' : 'Leave'}
                    </button>
                  )}
                </div>
              </div>

              <div className="society-stats">
                <div><strong>{society.memberCount}</strong><span>Members</span></div>
                <div><strong>{society.followerCount}</strong><span>Followers</span></div>
                <div><strong>{society.sectionCount}</strong><span>Sections</span></div>
                <div><strong>{society.postCount}</strong><span>Posts</span></div>
              </div>
            </section>

            {canCreateSocietyPosts && (
              <section className="societies-panel">
                <div className="societies-panel-header">
                  <h2>Write a post</h2>
                  <span>Instant</span>
                </div>

                <form className="society-form" onSubmit={handleCreatePost}>
                  <label className="society-field">
                    <span>Content</span>
                    <textarea
                      value={postContent}
                      onChange={(event) => setPostContent(event.target.value)}
                      className="profile-textarea"
                      rows={4}
                      placeholder="Share an update with the society..."
                    />
                  </label>

                  <label className="society-field">
                    <span>Section</span>
                    <select
                      value={postSectionId}
                      onChange={(event) => setPostSectionId(event.target.value)}
                      className="profile-input"
                    >
                      <option value="">General</option>
                      {sections.map((section) => (
                        <option key={section._id} value={section._id}>{section.name}</option>
                      ))}
                    </select>
                  </label>

                  <div className="settings-actions">
                    <button type="submit" disabled={posting || !postContent.trim()} className="settings-btn settings-btn-primary">
                      {posting ? 'Posting...' : 'Post to society'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {isMember && !canCreateSocietyPosts && (
              <section className="societies-panel">
                <div className="societies-panel-header">
                  <h2>Posting access</h2>
                  <span>Restricted</span>
                </div>
                <p className="societies-summary">Only society moderators and admins can create posts here.</p>
              </section>
            )}

            {canManageSociety && (
              <section className="societies-panel">
                <div className="societies-panel-header">
                  <h2>Manage society</h2>
                  <button
                    type="button"
                    className="settings-btn"
                    onClick={() => setEditing((prev) => !prev)}
                  >
                    {editing ? 'Close editor' : 'Edit details'}
                  </button>
                </div>

                {editing && (
                  <form className="society-form" onSubmit={handleSaveSociety}>
                    <label className="society-field">
                      <span>Title</span>
                      <input
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        className="profile-input"
                      />
                    </label>

                    <label className="society-field">
                      <span>Description</span>
                      <textarea
                        value={editDescription}
                        onChange={(event) => setEditDescription(event.target.value)}
                        className="profile-textarea"
                        rows={4}
                      />
                    </label>

                    <label className="society-field">
                      <span>Picture URL</span>
                      <input
                        value={editPicture}
                        onChange={(event) => setEditPicture(event.target.value)}
                        className="profile-input"
                        placeholder="https://..."
                      />
                    </label>

                    <label className="society-field">
                      <span>Upload picture</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => setPictureFile(event.target.files?.[0] || null)}
                        className="profile-input"
                      />
                    </label>

                    <div className="settings-actions">
                      <button type="submit" disabled={savingSociety} className="settings-btn settings-btn-primary">
                        {savingSociety ? 'Saving...' : 'Save society'}
                      </button>
                      <button type="button" className="settings-btn" onClick={() => setEditing(false)}>
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <form className="society-form society-section-form" onSubmit={handleCreateSection}>
                  <h3 className="society-subtitle">Create section</h3>
                  <label className="society-field">
                    <span>Section name</span>
                    <input
                      value={sectionName}
                      onChange={(event) => setSectionName(event.target.value)}
                      className="profile-input"
                      placeholder="Finance, HR, Logistics..."
                    />
                  </label>

                  <label className="society-field">
                    <span>Description</span>
                    <textarea
                      value={sectionDescription}
                      onChange={(event) => setSectionDescription(event.target.value)}
                      className="profile-textarea"
                      rows={3}
                    />
                  </label>

                  <div className="settings-actions">
                    <button type="submit" disabled={creatingSection} className="settings-btn settings-btn-primary">
                      {creatingSection ? 'Creating...' : 'Add section'}
                    </button>
                  </div>
                </form>

                <form className="society-form society-section-form" onSubmit={handleAssignMemberToSection}>
                  <h3 className="society-subtitle">Assign member to section</h3>
                  <label className="society-field">
                    <span>Member</span>
                    <select
                      value={assignSectionUserId}
                      onChange={(event) => setAssignSectionUserId(event.target.value)}
                      className="profile-input"
                    >
                      <option value="">Select member</option>
                      {members.map((member) => (
                        <option key={member._id} value={member.userId?._id}>{member.userId?.name || member.userId?.username}</option>
                      ))}
                    </select>
                  </label>

                  <label className="society-field">
                    <span>Section</span>
                    <select
                      value={assignSectionSectionId}
                      onChange={(event) => setAssignSectionSectionId(event.target.value)}
                      className="profile-input"
                    >
                      <option value="">Select section</option>
                      {sections.map((section) => (
                        <option key={section._id} value={section._id}>{section.name}</option>
                      ))}
                    </select>
                  </label>

                  <div className="settings-actions">
                    <button type="submit" disabled={assigningMember} className="settings-btn settings-btn-primary">
                      {assigningMember ? 'Assigning...' : 'Assign to section'}
                    </button>
                  </div>
                </form>
              </section>
            )}

            <div className="societies-grid">
              <section className="societies-panel">
                <div className="societies-panel-header">
                  <h2>Sections</h2>
                  <span>{sections.length} total</span>
                </div>
                {sections.length === 0 ? (
                  <p className="societies-empty">No sections yet.</p>
                ) : (
                  <div className="societies-list">
                    {sections.map((section) => (
                      <button
                        type="button"
                        key={section._id}
                        className={`society-card-button${selectedSectionId === section._id ? ' is-selected' : ''}`}
                        onClick={async () => {
                          setSelectedSectionId(section._id)
                          await loadDetail(section._id)
                        }}
                      >
                        <div className="society-card-top">
                          <strong>{section.name}</strong>
                          <span className="society-role-badge">section</span>
                        </div>
                        <p>{section.description || 'No description.'}</p>
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section className="societies-panel">
                <div className="societies-panel-header">
                  <h2>Members</h2>
                  <span>{members.length} total</span>
                </div>
                {members.length === 0 ? (
                  <p className="societies-empty">No members loaded.</p>
                ) : (
                  <div className="society-member-list">
                    {members.map((member) => (
                      <div key={member._id} className="society-member-row">
                        <Avatar src={member.userId?.avatar} name={member.userId?.name || member.userId?.username} size={40} />
                        <div style={{ minWidth: 0 }}>
                          <strong>{member.userId?.name || member.userId?.username || 'Member'}</strong>
                          <p>@{member.userId?.username}</p>
                          <p className="society-member-meta">{getPrivilegeLabel(member)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            <section className="societies-panel">
              <div className="societies-panel-header">
                <h2>Recent posts</h2>
                <span>{posts.length} posts</span>
              </div>
              {posts.length === 0 ? (
                <p className="societies-empty">No posts yet.</p>
              ) : (
                <div className="society-post-list">
                  {posts.map((post) => (
                    <article key={post._id} className="society-post-card">
                      <div className="society-post-meta">
                        <div className="society-post-author-wrap">
                          <strong>
                            <Link to={`/societies/${society.society.slug || society.society._id}`} className="profile-link-inline">
                              {society.society.name}
                            </Link>
                          </strong>
                          <span className="society-post-author-subtitle">
                            by {post.userId?._id ? (
                              <Link to={`/profile/${post.userId._id}`} className="profile-link-inline">
                                {post.userId?.name || post.userId?.username || 'Member'}
                              </Link>
                            ) : (
                              post.userId?.name || post.userId?.username || 'Member'
                            )}
                          </span>
                        </div>
                        <span>{post.sectionId?.name ? `in ${post.sectionId.name}` : 'society post'}</span>
                      </div>
                      <p>{post.content}</p>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}

export default SocietyDetail