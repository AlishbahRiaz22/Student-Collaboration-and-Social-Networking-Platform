const express = require('express')
const mongoose = require('mongoose')
const multer = require('multer')
const cloudinary = require('../config/cloudinary')
const auth = require('../middleware/auth')
const User = require('../models/User')
const Society = require('../models/Society')
const Post = require('../models/Post')

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
})

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

const getUserIdString = (value) => value?._id?.toString() || value?.toString() || ''

const normalizeSlug = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

const uploadSocietyPictureToCloudinary = (file) => {
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`

  return cloudinary.uploader.upload(dataUri, {
    folder: 'studentnet/societies',
    resource_type: 'image'
  })
}

const societyPopulateOptions = [
  { path: 'creatorId', select: 'name username avatar' },
  { path: 'members.userId', select: 'name username avatar' },
  { path: 'members.invitedBy', select: 'name username avatar' },
  { path: 'followers.userId', select: 'name username avatar' },
  { path: 'sections.managerIds', select: 'name username avatar' },
  { path: 'sections.members.userId', select: 'name username avatar' },
  { path: 'sections.members.assignedBy', select: 'name username avatar' }
]

const ROLE_PERMISSION_TEMPLATE = {
  creator: {
    manageSociety: true,
    editSociety: true,
    manageMembers: true,
    assignMembers: true,
    removeMembers: true,
    manageSections: true,
    createSections: true,
    createPosts: true,
    moderatePosts: true
  },
  admin: {
    manageSociety: true,
    editSociety: true,
    manageMembers: true,
    assignMembers: true,
    removeMembers: true,
    manageSections: true,
    createSections: true,
    createPosts: true,
    moderatePosts: true
  },
  moderator: {
    manageMembers: true,
    assignMembers: true,
    removeMembers: true,
    manageSections: true,
    createSections: true,
    createPosts: true,
    moderatePosts: true
  },
  member: {}
}

const PRIVILEGE_LEVELS = ['creator', 'admin', 'moderator', 'member']

const getPrivilegeLevel = (member) => member?.privilegeLevel || member?.role || 'member'

const normalizePrivilegeLevel = (value, fallback = 'member') => (
  PRIVILEGE_LEVELS.includes(value) ? value : fallback
)

const hasPermission = (member, permission) => {
  if (!member) return false
  const privilegeLevel = getPrivilegeLevel(member)
  if (privilegeLevel === 'creator' || privilegeLevel === 'admin') return true

  if (permission === 'createPosts' && privilegeLevel === 'member') return false

  return Boolean({
    ...(ROLE_PERMISSION_TEMPLATE[privilegeLevel] || {}),
    ...(member.permissions || {})
  }[permission])
}

const buildMemberDefaults = (society) => ({
  createPosts: false,
  createSections: Boolean(society.settings?.defaultMemberCanCreateSections)
})

const buildCreatorPermissions = () => ({
  manageSociety: true,
  editSociety: true,
  manageMembers: true,
  assignMembers: true,
  removeMembers: true,
  manageSections: true,
  createSections: true,
  createPosts: true,
  moderatePosts: true
})

const memberToObject = (member) => {
  const data = member?.toObject ? member.toObject() : { ...member }
  const privilegeLevel = getPrivilegeLevel(data)

  return {
    ...data,
    privilegeLevel,
    role: data.role || privilegeLevel
  }
}

const getMembershipByUserId = (society, userId) => {
  const normalizedUserId = userId?.toString()
  return society.members.find((member) => getUserIdString(member.userId) === normalizedUserId)
}

const getFollowerByUserId = (society, userId) => {
  const normalizedUserId = userId?.toString()
  return society.followers.find((follower) => getUserIdString(follower.userId) === normalizedUserId)
}

const getSectionById = (society, sectionId) => {
  if (!society || !sectionId) return null
  return society.sections.id(sectionId) || society.sections.find((section) => section._id?.toString() === sectionId.toString()) || null
}

const isSectionManager = (section, userId) => (section?.managerIds || []).some((managerId) => getUserIdString(managerId) === userId?.toString())

const findUniqueSocietySlug = async (baseName, extraQuery = {}) => {
  const normalizedBase = normalizeSlug(baseName) || 'society'
  let candidate = normalizedBase
  let suffix = 2

  while (await Society.findOne({ slug: candidate, ...extraQuery })) {
    candidate = `${normalizedBase}-${suffix}`
    suffix += 1
  }

  return candidate
}

const findUniqueSectionSlug = (society, baseName, excludeSectionId = null) => {
  const normalizedBase = normalizeSlug(baseName) || 'section'
  const usedSlugs = new Set(
    society.sections
      .filter((section) => !excludeSectionId || section._id?.toString() !== excludeSectionId.toString())
      .map((section) => section.slug)
      .filter(Boolean)
  )

  let candidate = normalizedBase
  let suffix = 2

  while (usedSlugs.has(candidate)) {
    candidate = `${normalizedBase}-${suffix}`
    suffix += 1
  }

  return candidate
}

const loadSociety = async (identifier) => {
  const query = isValidObjectId(identifier) ? { _id: identifier } : { slug: identifier }
  return Society.findOne(query).populate(societyPopulateOptions)
}

const loadAccessibleSociety = async (identifier, userId) => {
  const society = await loadSociety(identifier)
  if (!society) return { error: { status: 404, message: 'Society not found' } }

  const membership = userId ? getMembershipByUserId(society, userId) : null

  if (membership?.status === 'banned') {
    return { error: { status: 403, message: 'You are banned from this society' } }
  }

  if (society.visibility === 'private' && !membership) {
    return { error: { status: 403, message: 'Not authorized to view this society' } }
  }

  return { society, membership }
}

const syncUserMembership = async (userId, societyId, member) => {
  const user = await User.findById(userId)
  if (!user) return

  const data = {
    societyId,
    privilegeLevel: getPrivilegeLevel(member),
    role: member.role || getPrivilegeLevel(member),
    permissions: member.permissions,
    status: member.status,
    joinedAt: member.joinedAt || new Date()
  }

  const existing = user.societyMemberships.find((item) => item.societyId?.toString() === societyId.toString())
  if (existing) {
    Object.assign(existing, data)
  } else {
    user.societyMemberships.push(data)
  }

  await user.save()
}

const removeUserMembership = async (userId, societyId) => {
  await User.updateOne(
    { _id: userId },
    { $pull: { societyMemberships: { societyId } } }
  )
}

const syncUserFollow = async (userId, societyId) => {
  const user = await User.findById(userId)
  if (!user) return

  const existing = user.followedSocieties.find((item) => item.societyId?.toString() === societyId.toString())
  if (!existing) {
    user.followedSocieties.push({ societyId, followedAt: new Date() })
    await user.save()
  }
}

const removeUserFollow = async (userId, societyId) => {
  await User.updateOne(
    { _id: userId },
    { $pull: { followedSocieties: { societyId } } }
  )
}

const removeSectionAssignments = (society, userId) => {
  const normalizedUserId = userId.toString()
  society.sections.forEach((section) => {
    section.members = section.members.filter((member) => getUserIdString(member.userId) !== normalizedUserId)
  })
}

const collectSectionIds = (society, rootSectionId, collected = new Set()) => {
  const normalizedSectionId = rootSectionId.toString()
  if (collected.has(normalizedSectionId)) return collected

  collected.add(normalizedSectionId)
  society.sections
    .filter((section) => section.parentSectionId?.toString() === normalizedSectionId)
    .forEach((childSection) => collectSectionIds(society, childSection._id, collected))

  return collected
}

const decoratePosts = (posts) => posts.map((post) => {
  const data = post.toObject ? post.toObject() : { ...post }

  if (data.societyId && data.sectionId && data.societyId.sections) {
    const section = data.societyId.sections.find((entry) => entry._id?.toString() === data.sectionId.toString())
    if (section) {
      data.sectionId = section
    }
  }

  return data
})

const postPopulateOptions = [
  { path: 'userId', select: 'name username avatar' },
  { path: 'societyId', select: 'name slug picture sections' },
  { path: 'comments.userId', select: 'name username avatar' }
]

const maybeUploadSocietyPicture = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    return upload.single('pictureFile')(req, res, next)
  }

  return next()
}

// GET /api/societies/discover
router.get('/discover', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).select('societyMemberships followedSocieties')
    const activeSocietyIds = (currentUser?.societyMemberships || [])
      .filter((membership) => membership.status === 'active')
      .map((membership) => membership.societyId)

    const followedSocietyIds = (currentUser?.followedSocieties || []).map((entry) => entry.societyId)

    const societies = await Society.find({
      visibility: 'public',
      _id: { $nin: activeSocietyIds }
    })
      .sort({ createdAt: -1 })
      .populate(societyPopulateOptions)

    res.json(societies.map((society) => ({
      ...society.toObject(),
      isFollowing: followedSocietyIds.some((id) => id.toString() === society._id.toString()),
      isMember: activeSocietyIds.some((id) => id.toString() === society._id.toString())
    })))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/societies/mine
router.get('/mine', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId)
      .populate({ path: 'societyMemberships.societyId', populate: societyPopulateOptions })

    if (!currentUser) {
      return res.status(404).json({ error: 'Current user not found' })
    }

    const memberships = (currentUser.societyMemberships || [])
      .filter((membership) => membership.status !== 'banned' && membership.societyId)
      .map((membership) => ({
        ...membership.toObject(),
        societyId: membership.societyId?.toObject ? membership.societyId.toObject() : membership.societyId
      }))
      .sort((a, b) => new Date(b.joinedAt || 0) - new Date(a.joinedAt || 0))

    res.json(memberships)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/societies
router.post('/', auth, maybeUploadSocietyPicture, async (req, res) => {
  try {
    const body = req.body || {}
    const { name, description = '', picture = '', visibility = 'public' } = body

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Society name is required' })
    }

    const settings = typeof body.settings === 'string'
      ? JSON.parse(body.settings)
      : (body.settings || {})

    const creatorId = req.user.userId
    const slug = await findUniqueSocietySlug(name)

    let pictureUrl = typeof picture === 'string' ? picture.trim() : ''
    let picturePublicId = ''

    if (req.file) {
      const uploadResult = await uploadSocietyPictureToCloudinary(req.file)
      pictureUrl = uploadResult.secure_url
      picturePublicId = uploadResult.public_id
    }

    const creatorPermissions = buildCreatorPermissions()

    const society = await Society.create({
      creatorId,
      name: name.trim(),
      slug,
      description: typeof description === 'string' ? description.trim() : '',
      picture: pictureUrl,
      picturePublicId,
      visibility: ['public', 'private'].includes(visibility) ? visibility : 'public',
      settings: {
        defaultMemberCanPost: false,
        defaultMemberCanCreateSections: Boolean(settings.defaultMemberCanCreateSections),
        allowMemberInvites: Boolean(settings.allowMemberInvites),
        requireApprovalForJoin: Boolean(settings.requireApprovalForJoin),
        inviteOnly: Boolean(settings.inviteOnly),
        allowFollowersSeePosts: settings.allowFollowersSeePosts !== false
      },
      members: [{
        userId: creatorId,
        privilegeLevel: 'creator',
        role: 'creator',
        permissions: creatorPermissions,
        status: 'active',
        invitedBy: null,
        joinedAt: new Date()
      }],
      followers: [{
        userId: creatorId,
        followedAt: new Date()
      }],
      sections: []
    })

    await syncUserMembership(creatorId, society._id, {
      privilegeLevel: 'creator',
      role: 'creator',
      permissions: creatorPermissions,
      status: 'active',
      joinedAt: new Date()
    })
    await syncUserFollow(creatorId, society._id)

    const populatedSociety = await loadSociety(society._id)
    res.status(201).json({ society: populatedSociety, membership: getMembershipByUserId(populatedSociety, creatorId) })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Society slug already exists' })
    }

    if (err instanceof SyntaxError) {
      return res.status(400).json({ error: 'Invalid settings payload' })
    }

    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/societies/:identifier/posts
router.get('/:identifier/posts', auth, async (req, res) => {
  try {
    const result = await loadAccessibleSociety(req.params.identifier, req.user.userId)
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message })
    }

    const { society } = result
    const { sectionId } = req.query

    if (sectionId && !isValidObjectId(sectionId)) {
      return res.status(400).json({ error: 'Invalid section id' })
    }

    if (sectionId && !getSectionById(society, sectionId)) {
      return res.status(404).json({ error: 'Section not found' })
    }

    const query = { societyId: society._id }
    if (sectionId) {
      query.sectionId = sectionId
    }

    const posts = await Post.find(query)
      .sort({ createdAt: -1 })
      .populate(postPopulateOptions)

    res.json(decoratePosts(posts))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/societies/:identifier
router.get('/:identifier', auth, async (req, res) => {
  try {
    const result = await loadAccessibleSociety(req.params.identifier, req.user.userId)
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message })
    }

    const { society, membership } = result
    const currentUser = await User.findById(req.user.userId).select('followedSocieties')
    const isFollowing = Boolean(getFollowerByUserId(society, req.user.userId)) || Boolean(
      currentUser?.followedSocieties?.some((entry) => entry.societyId?.toString() === society._id.toString())
    )

    const postCount = await Post.countDocuments({ societyId: society._id })

    res.json({
      society,
      membership: memberToObject(membership),
      isFollowing,
      memberCount: society.members.filter((member) => member.status === 'active').length,
      followerCount: society.followers.length,
      sectionCount: society.sections.length,
      postCount
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/societies/:identifier
router.put('/:identifier', auth, maybeUploadSocietyPicture, async (req, res) => {
  try {
    const result = await loadAccessibleSociety(req.params.identifier, req.user.userId)
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message })
    }

    const { society, membership } = result
    if (!membership || (!hasPermission(membership, 'manageSociety') && !hasPermission(membership, 'editSociety'))) {
      return res.status(403).json({ error: 'Not authorized to edit this society' })
    }

    const body = req.body || {}
    const updates = {}

    if (typeof body.name === 'string' && body.name.trim()) {
      updates.name = body.name.trim()
      updates.slug = await findUniqueSocietySlug(body.name, { _id: { $ne: society._id } })
    }

    if (typeof body.description === 'string') {
      updates.description = body.description.trim()
    }

    if (typeof body.visibility === 'string' && ['public', 'private'].includes(body.visibility)) {
      updates.visibility = body.visibility
    }

    if (typeof body.picture === 'string') {
      updates.picture = body.picture.trim()
    }

    if (req.file) {
      const uploadResult = await uploadSocietyPictureToCloudinary(req.file)
      updates.picture = uploadResult.secure_url
      updates.picturePublicId = uploadResult.public_id
    }

    if (body.settings) {
      const settings = typeof body.settings === 'string' ? JSON.parse(body.settings) : body.settings
      updates.settings = {
        ...society.settings,
        defaultMemberCanPost: false,
        ...(typeof settings.defaultMemberCanCreateSections === 'boolean' ? { defaultMemberCanCreateSections: settings.defaultMemberCanCreateSections } : {}),
        ...(typeof settings.allowMemberInvites === 'boolean' ? { allowMemberInvites: settings.allowMemberInvites } : {}),
        ...(typeof settings.requireApprovalForJoin === 'boolean' ? { requireApprovalForJoin: settings.requireApprovalForJoin } : {}),
        ...(typeof settings.inviteOnly === 'boolean' ? { inviteOnly: settings.inviteOnly } : {}),
        ...(typeof settings.allowFollowersSeePosts === 'boolean' ? { allowFollowersSeePosts: settings.allowFollowersSeePosts } : {})
      }
    }

    Object.assign(society, updates)
    await society.save()

    const updatedSociety = await loadSociety(society._id)
    res.json(updatedSociety)
  } catch (err) {
    if (err instanceof SyntaxError) {
      return res.status(400).json({ error: 'Invalid settings payload' })
    }

    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/societies/:identifier/join
router.post('/:identifier/join', auth, async (req, res) => {
  try {
    const { society, error } = await loadAccessibleSociety(req.params.identifier, req.user.userId)
    if (error) {
      return res.status(error.status).json({ error: error.message })
    }

    const existing = getMembershipByUserId(society, req.user.userId)
    if (existing?.status === 'banned') {
      return res.status(403).json({ error: 'You are banned from this society' })
    }

    if (society.settings?.inviteOnly && !existing) {
      return res.status(403).json({ error: 'This society is invite only' })
    }

    if (existing && existing.status === 'active') {
      return res.json(existing)
    }

    const nextPrivilegeLevel = normalizePrivilegeLevel(existing?.privilegeLevel || existing?.role || 'member')
    const nextMember = {
      userId: req.user.userId,
      privilegeLevel: nextPrivilegeLevel,
      role: existing?.role || nextPrivilegeLevel,
      permissions: existing?.permissions || buildMemberDefaults(society),
      status: 'active',
      invitedBy: existing?.invitedBy || null,
      joinedAt: existing?.joinedAt || new Date()
    }

    if (existing) {
      Object.assign(existing, nextMember)
    } else {
      society.members.push(nextMember)
    }

    if (!getFollowerByUserId(society, req.user.userId)) {
      society.followers.push({ userId: req.user.userId, followedAt: new Date() })
    }

    await society.save()
    await syncUserMembership(req.user.userId, society._id, nextMember)
    await syncUserFollow(req.user.userId, society._id)

    const member = getMembershipByUserId(society, req.user.userId)
    res.status(existing ? 200 : 201).json(memberToObject(member))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /api/societies/:identifier/leave
router.delete('/:identifier/leave', auth, async (req, res) => {
  try {
    const { society, error } = await loadAccessibleSociety(req.params.identifier, req.user.userId)
    if (error) {
      return res.status(error.status).json({ error: error.message })
    }

    if (society.creatorId?._id?.toString() === req.user.userId || society.creatorId?.toString() === req.user.userId) {
      return res.status(400).json({ error: 'Creator cannot leave the society' })
    }

    society.members = society.members.filter((member) => getUserIdString(member.userId) !== req.user.userId)
    society.followers = society.followers.filter((follower) => getUserIdString(follower.userId) !== req.user.userId)
    removeSectionAssignments(society, req.user.userId)

    await society.save()
    await removeUserMembership(req.user.userId, society._id)
    await removeUserFollow(req.user.userId, society._id)

    res.json({ message: 'Left society' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/societies/:identifier/follow
router.post('/:identifier/follow', auth, async (req, res) => {
  try {
    const { society, membership, error } = await loadAccessibleSociety(req.params.identifier, req.user.userId)
    if (error) {
      return res.status(error.status).json({ error: error.message })
    }

    if (society.visibility === 'private' && !membership) {
      return res.status(403).json({ error: 'Private societies cannot be followed without membership' })
    }

    if (!getFollowerByUserId(society, req.user.userId)) {
      society.followers.push({ userId: req.user.userId, followedAt: new Date() })
      await society.save()
    }

    await syncUserFollow(req.user.userId, society._id)

    res.status(201).json({ message: 'Followed society' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /api/societies/:identifier/follow
router.delete('/:identifier/follow', auth, async (req, res) => {
  try {
    const society = await loadSociety(req.params.identifier)
    if (!society) {
      return res.status(404).json({ error: 'Society not found' })
    }

    society.followers = society.followers.filter((follower) => getUserIdString(follower.userId) !== req.user.userId)
    await society.save()
    await removeUserFollow(req.user.userId, society._id)

    res.json({ message: 'Unfollowed society' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/societies/:identifier/members
router.get('/:identifier/members', auth, async (req, res) => {
  try {
    const result = await loadAccessibleSociety(req.params.identifier, req.user.userId)
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message })
    }

    const members = [...result.society.members]
      .sort((a, b) => {
        const privilegeOrder = { creator: 0, admin: 1, moderator: 2, member: 3 }
        return (privilegeOrder[getPrivilegeLevel(a)] || 99) - (privilegeOrder[getPrivilegeLevel(b)] || 99)
      })
      .map((member) => memberToObject(member))

    res.json(members)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/societies/:identifier/members
router.post('/:identifier/members', auth, async (req, res) => {
  try {
    const result = await loadAccessibleSociety(req.params.identifier, req.user.userId)
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message })
    }

    const { society, membership } = result
    if (!membership || (!hasPermission(membership, 'manageMembers') && !hasPermission(membership, 'assignMembers'))) {
      return res.status(403).json({ error: 'Not authorized to manage members' })
    }

    const { userId, username, email, privilegeLevel, role, permissions = {}, status } = req.body || {}
    const resolvedPrivilegeLevel = normalizePrivilegeLevel(privilegeLevel || role || 'member')

    let targetUser = null
    if (userId && isValidObjectId(userId)) {
      targetUser = await User.findById(userId)
    } else if (typeof username === 'string' && username.trim()) {
      targetUser = await User.findOne({ username: username.trim() })
    } else if (typeof email === 'string' && email.trim()) {
      targetUser = await User.findOne({ email: email.trim().toLowerCase() })
    }

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    if (society.creatorId?.toString() === targetUser._id.toString()) {
      return res.status(400).json({ error: 'Creator is already a full member' })
    }

    const existing = getMembershipByUserId(society, targetUser._id)
    if (existing?.status === 'active') {
      return res.status(200).json(memberToObject(existing))
    }

    const nextMember = {
      userId: targetUser._id,
      privilegeLevel: resolvedPrivilegeLevel,
      role: resolvedPrivilegeLevel,
      permissions: { ...buildMemberDefaults(society), ...(permissions || {}) },
      status: 'invited',
      invitedBy: req.user.userId,
      joinedAt: new Date()
    }

    if (existing) {
      Object.assign(existing, nextMember)
    } else {
      society.members.push(nextMember)
    }

    await society.save()
    await syncUserMembership(targetUser._id, society._id, nextMember)

    const member = getMembershipByUserId(society, targetUser._id)
    res.status(201).json(memberToObject(member))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// PATCH /api/societies/:identifier/members/:memberUserId
router.patch('/:identifier/members/:memberUserId', auth, async (req, res) => {
  try {
    const result = await loadAccessibleSociety(req.params.identifier, req.user.userId)
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message })
    }

    const { society, membership } = result
    if (!membership || !hasPermission(membership, 'manageMembers')) {
      return res.status(403).json({ error: 'Not authorized to update members' })
    }

    const target = getMembershipByUserId(society, req.params.memberUserId)
    if (!target) {
      return res.status(404).json({ error: 'Member not found' })
    }

    if (society.creatorId?.toString() === req.params.memberUserId) {
      return res.status(400).json({ error: 'Creator membership cannot be edited here' })
    }

    const { privilegeLevel, role, permissions, status } = req.body || {}

    if (typeof privilegeLevel === 'string' && PRIVILEGE_LEVELS.includes(privilegeLevel)) {
      target.privilegeLevel = privilegeLevel
      target.role = privilegeLevel
    } else if (typeof role === 'string' && PRIVILEGE_LEVELS.includes(role)) {
      target.privilegeLevel = role
      target.role = role
    }

    if (permissions && typeof permissions === 'object') {
      target.permissions = {
        ...(target.permissions?.toObject ? target.permissions.toObject() : target.permissions || {}),
        ...permissions
      }
    }

    if (typeof status === 'string' && ['active', 'pending', 'invited', 'banned'].includes(status)) {
      target.status = status
    }

    await society.save()
    await syncUserMembership(req.params.memberUserId, society._id, target)

    if (target.status === 'banned') {
      removeSectionAssignments(society, req.params.memberUserId)
      society.followers = society.followers.filter((follower) => follower.userId?.toString() !== req.params.memberUserId)
      await society.save()
      await removeUserFollow(req.params.memberUserId, society._id)
    }

    res.json(memberToObject(target))
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /api/societies/:identifier/members/:memberUserId
router.delete('/:identifier/members/:memberUserId', auth, async (req, res) => {
  try {
    const result = await loadAccessibleSociety(req.params.identifier, req.user.userId)
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message })
    }

    const { society, membership } = result
    if (!membership || (!hasPermission(membership, 'manageMembers') && !hasPermission(membership, 'removeMembers'))) {
      return res.status(403).json({ error: 'Not authorized to remove members' })
    }

    if (society.creatorId?.toString() === req.params.memberUserId) {
      return res.status(400).json({ error: 'Creator cannot be removed' })
    }

    const memberObjectId = new mongoose.Types.ObjectId(req.params.memberUserId)

    await Society.updateOne(
      { _id: society._id },
      {
        $pull: {
          members: { userId: memberObjectId },
          followers: { userId: memberObjectId },
          'sections.$[].members': { userId: memberObjectId }
        }
      }
    )

    await removeUserMembership(req.params.memberUserId, society._id)
    await removeUserFollow(req.params.memberUserId, society._id)

    res.json({ message: 'Member removed' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/societies/:identifier/sections
router.get('/:identifier/sections', auth, async (req, res) => {
  try {
    const result = await loadAccessibleSociety(req.params.identifier, req.user.userId)
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message })
    }

    const sections = [...result.society.sections]
      .sort((a, b) => (a.order || 0) - (b.order || 0) || new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
      .map((section) => section.toObject ? section.toObject() : section)

    res.json(sections)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/societies/:identifier/sections
router.post('/:identifier/sections', auth, async (req, res) => {
  try {
    const result = await loadAccessibleSociety(req.params.identifier, req.user.userId)
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message })
    }

    const { society, membership } = result
    if (!membership || (!hasPermission(membership, 'manageSections') && !hasPermission(membership, 'createSections'))) {
      return res.status(403).json({ error: 'Not authorized to create sections' })
    }

    const { name, description = '', parentSectionId = null, order = 0, managerIds = [], settings = {} } = req.body || {}

    if (!name?.trim()) {
      return res.status(400).json({ error: 'Section name is required' })
    }

    if (parentSectionId && !isValidObjectId(parentSectionId)) {
      return res.status(400).json({ error: 'Invalid parent section id' })
    }

    if (parentSectionId && !getSectionById(society, parentSectionId)) {
      return res.status(404).json({ error: 'Parent section not found' })
    }

    const section = society.sections.create({
      parentSectionId: parentSectionId || null,
      name: name.trim(),
      slug: findUniqueSectionSlug(society, name),
      description: typeof description === 'string' ? description.trim() : '',
      order: Number.isFinite(Number(order)) ? Number(order) : 0,
      managerIds: Array.isArray(managerIds) ? managerIds.filter((id) => isValidObjectId(id)) : [],
      settings: {
        canMembersPost: typeof settings.canMembersPost === 'boolean' ? settings.canMembersPost : true,
        canMembersInvite: Boolean(settings.canMembersInvite),
        canMembersAssign: Boolean(settings.canMembersAssign),
        canMembersCreateSubsections: Boolean(settings.canMembersCreateSubsections)
      },
      members: []
    })

    society.sections.push(section)
    await society.save()

    res.status(201).json(section.toObject())
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// PATCH /api/societies/:identifier/sections/:sectionId
router.patch('/:identifier/sections/:sectionId', auth, async (req, res) => {
  try {
    const result = await loadAccessibleSociety(req.params.identifier, req.user.userId)
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message })
    }

    const { society, membership } = result
    if (!membership || (!hasPermission(membership, 'manageSections') && !hasPermission(membership, 'createSections'))) {
      return res.status(403).json({ error: 'Not authorized to update sections' })
    }

    const section = getSectionById(society, req.params.sectionId)
    if (!section) {
      return res.status(404).json({ error: 'Section not found' })
    }

    const { name, description, parentSectionId, order, managerIds, settings } = req.body || {}

    if (typeof name === 'string' && name.trim()) {
      section.name = name.trim()
      section.slug = findUniqueSectionSlug(society, name, section._id)
    }

    if (typeof description === 'string') {
      section.description = description.trim()
    }

    if (typeof order !== 'undefined' && !Number.isNaN(Number(order))) {
      section.order = Number(order)
    }

    if (typeof parentSectionId !== 'undefined') {
      if (parentSectionId && !isValidObjectId(parentSectionId)) {
        return res.status(400).json({ error: 'Invalid parent section id' })
      }

      if (parentSectionId && !getSectionById(society, parentSectionId)) {
        return res.status(404).json({ error: 'Parent section not found' })
      }

      section.parentSectionId = parentSectionId || null
    }

    if (Array.isArray(managerIds)) {
      section.managerIds = managerIds.filter((id) => isValidObjectId(id))
    }

    if (settings && typeof settings === 'object') {
      section.settings = {
        ...section.settings,
        ...(typeof settings.canMembersPost === 'boolean' ? { canMembersPost: settings.canMembersPost } : {}),
        ...(typeof settings.canMembersInvite === 'boolean' ? { canMembersInvite: settings.canMembersInvite } : {}),
        ...(typeof settings.canMembersAssign === 'boolean' ? { canMembersAssign: settings.canMembersAssign } : {}),
        ...(typeof settings.canMembersCreateSubsections === 'boolean' ? { canMembersCreateSubsections: settings.canMembersCreateSubsections } : {})
      }
    }

    await society.save()
    res.json(section.toObject())
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /api/societies/:identifier/sections/:sectionId
router.delete('/:identifier/sections/:sectionId', auth, async (req, res) => {
  try {
    const result = await loadAccessibleSociety(req.params.identifier, req.user.userId)
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message })
    }

    const { society, membership } = result
    if (!membership || !hasPermission(membership, 'manageSections')) {
      return res.status(403).json({ error: 'Not authorized to delete sections' })
    }

    const section = getSectionById(society, req.params.sectionId)
    if (!section) {
      return res.status(404).json({ error: 'Section not found' })
    }

    const idsToDelete = [...collectSectionIds(society, section._id)]
    society.sections = society.sections.filter((entry) => !idsToDelete.includes(entry._id?.toString()))
    await society.save()

    await Post.deleteMany({
      societyId: society._id,
      sectionId: { $in: idsToDelete }
    })

    res.json({ message: 'Section deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /api/societies/:identifier/sections/:sectionId/members
router.post('/:identifier/sections/:sectionId/members', auth, async (req, res) => {
  try {
    const result = await loadAccessibleSociety(req.params.identifier, req.user.userId)
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message })
    }

    const { society, membership } = result
    const section = getSectionById(society, req.params.sectionId)

    if (!section) {
      return res.status(404).json({ error: 'Section not found' })
    }

    const canManageSection = membership && (
      hasPermission(membership, 'manageSections') ||
      hasPermission(membership, 'assignMembers') ||
      isSectionManager(section, req.user.userId)
    )

    if (!canManageSection) {
      return res.status(403).json({ error: 'Not authorized to manage this section' })
    }

    const { userId } = req.body || {}
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ error: 'Invalid user id' })
    }

    const targetMember = getMembershipByUserId(society, userId)
    if (!targetMember || targetMember.status !== 'active') {
      return res.status(404).json({ error: 'User must be an active society member first' })
    }

    const existing = section.members.find((member) => member.userId?.toString() === userId.toString())
    const nextAssignment = {
      userId,
      assignedBy: req.user.userId,
      assignedAt: new Date()
    }

    if (existing) {
      Object.assign(existing, nextAssignment)
    } else {
      section.members.push(nextAssignment)
    }

    await society.save()
    res.status(201).json(existing || section.members[section.members.length - 1])
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// DELETE /api/societies/:identifier/sections/:sectionId/members/:userId
router.delete('/:identifier/sections/:sectionId/members/:userId', auth, async (req, res) => {
  try {
    const result = await loadAccessibleSociety(req.params.identifier, req.user.userId)
    if (result.error) {
      return res.status(result.error.status).json({ error: result.error.message })
    }

    const { society, membership } = result
    const section = getSectionById(society, req.params.sectionId)

    if (!section) {
      return res.status(404).json({ error: 'Section not found' })
    }

    const canManageSection = membership && (
      hasPermission(membership, 'manageSections') ||
      hasPermission(membership, 'assignMembers') ||
      isSectionManager(section, req.user.userId)
    )

    if (!canManageSection) {
      return res.status(403).json({ error: 'Not authorized to manage this section' })
    }

    section.members = section.members.filter((member) => member.userId?.toString() !== req.params.userId)
    await society.save()

    res.json({ message: 'Section member removed' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router