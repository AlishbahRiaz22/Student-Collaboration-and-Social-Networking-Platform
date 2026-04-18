const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const Post = require('../models/Post')
const auth = require('../middleware/auth')
const multer = require('multer')
const cloudinary = require('../config/cloudinary')
const Society = require('../models/Society')

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024
  }
})

const uploadToCloudinary = (file) => {
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`

  return cloudinary.uploader.upload(dataUri, {
    folder: 'studentnet/posts',
    resource_type: 'image'
  })
}

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

const getSocietyMember = (society, userId) => {
  const normalizedUserId = userId?.toString()
  return society?.members?.find((member) => member.userId?.toString() === normalizedUserId)
}

const getSocietySection = (society, sectionId) => {
  if (!society || !sectionId) return null
  return society.sections?.id(sectionId) || society.sections?.find((section) => section._id?.toString() === sectionId.toString()) || null
}

const isSocietyManager = (society, userId) => {
  const member = getSocietyMember(society, userId)
  const privilegeLevel = getPrivilegeLevel(member)
  return Boolean(member && (privilegeLevel === 'creator' || privilegeLevel === 'admin' || member.permissions?.manageSociety || member.permissions?.editSociety))
}

const decoratePosts = (posts) => posts.map((post) => {
  const data = post.toObject ? post.toObject() : { ...post }
  if (data.societyId?.sections && data.sectionId) {
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

const likePopulateOptions = [
  { path: 'likes', select: 'name username avatar' }
]

const societyPostAudience = ['public', 'followers', 'members', 'section']
const getPrivilegeLevel = (member) => member?.privilegeLevel || member?.role || 'member'

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

const isSectionManager = (section, userId) =>
  (section?.managerIds || []).some((managerId) => managerId?.toString() === userId)

const maybeUploadImage = (req, res, next) => {
  if (req.is('multipart/form-data')) {
    return upload.single('image')(req, res, next)
  }

  return next()
}

// GET /api/posts — get all posts, newest first
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate(postPopulateOptions)
    res.json(decoratePosts(posts))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/posts/feed — smart feed, only posts from people you follow (your Day 5 task)
router.get('/feed', auth, async (req, res) => {
  try {
    const User = require('../models/User')
    const currentUser = await User.findById(req.user.userId)
    const followingIds = currentUser?.following || []
    const followedSocietyIds = (currentUser?.followedSocieties || []).map((entry) => entry.societyId)

    const posts = await Post.find({
      $or: [
        { userId: { $in: followingIds } },
        { societyId: { $in: followedSocietyIds } }
      ]
    })
      .sort({ createdAt: -1 })
      .populate(postPopulateOptions)

    res.json(decoratePosts(posts))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/posts/user/:userId — all posts by a specific user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user id' })
    }

    const posts = await Post.find({ userId })
      .sort({ createdAt: -1 })
      .populate(postPopulateOptions)

    res.json(decoratePosts(posts))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/posts/:id — get a single post with comments
router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid post id' })
    }

    const post = await Post.findById(req.params.id).populate(postPopulateOptions)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    res.json(decoratePosts([post])[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/posts/:id/likes — get users who liked a post
router.get('/:id/likes', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid post id' })
    }

    const post = await Post.findById(req.params.id).populate(likePopulateOptions)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    res.json(post.likes || [])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/posts — create a new post
router.post('/', auth, maybeUploadImage, async (req, res) => {
  try {
    const body = req.body || {}
    const { content, graphic, societyId: rawSocietyId, sectionId: rawSectionId, audience } = body
    if (!content?.trim())
      return res.status(400).json({ error: 'Content is required' })

    let graphicUrl = null
    let societyId = isValidObjectId(rawSocietyId) ? rawSocietyId : null
    let sectionId = isValidObjectId(rawSectionId) ? rawSectionId : null
    let postAudience = 'public'

    if (societyId || sectionId) {
      let society = null
      let section = null

      if (sectionId && !societyId) {
        society = await Society.findOne({ 'sections._id': sectionId })
        if (!society) {
          return res.status(404).json({ error: 'Section not found' })
        }
        section = getSocietySection(society, sectionId)
        societyId = society._id.toString()
      } else {
        society = await Society.findById(societyId)
      }

      if (!society) {
        return res.status(404).json({ error: 'Society not found' })
      }

      const member = getSocietyMember(society, req.user.userId)
      if (!member) {
        return res.status(403).json({ error: 'You must be a society member to post here' })
      }

      if (member.status !== 'active') {
        return res.status(403).json({ error: 'Your society membership is not active' })
      }

      if (!hasPermission(member, 'createPosts')) {
        return res.status(403).json({ error: 'You do not have permission to post in this society' })
      }

      if (sectionId) {
        section = section || getSocietySection(society, sectionId)
        if (!section) {
          return res.status(404).json({ error: 'Section not found' })
        }

        const sectionAssignment = section.members?.find((assignment) => assignment.userId?.toString() === req.user.userId)

        if (!sectionAssignment && !isSectionManager(section, req.user.userId) && !hasPermission(member, 'manageSections')) {
          return res.status(403).json({ error: 'You are not assigned to this section' })
        }

        if (section.settings?.canMembersPost === false && !isSectionManager(section, req.user.userId) && !hasPermission(member, 'manageSections')) {
          return res.status(403).json({ error: 'Posting is restricted for this section' })
        }
      }

      postAudience = societyId && sectionId ? 'section' : 'followers'

      if (typeof audience === 'string' && societyPostAudience.includes(audience)) {
        postAudience = audience
      }
    }

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file)
      graphicUrl = uploadResult.secure_url
    } else if (typeof graphic === 'string' && graphic.trim()) {
      graphicUrl = graphic.trim()
    }

    const post = new Post({
      userId: req.user.userId,
      societyId,
      sectionId,
      audience: postAudience,
      content: content.trim(),
      graphic: graphicUrl
    })

    await post.save()

    // populate before sending back so PostCard gets the author name immediately
    const createdPost = await Post.findById(post._id).populate(postPopulateOptions)
    res.status(201).json(decoratePosts([createdPost])[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/posts/:id — update a post
router.put('/:id', auth, async (req, res) => {
  try {
    const { content } = req.body
    if (!content?.trim()) {
      return res.status(400).json({ error: 'Content is required' })
    }

    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    if (post.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to update this post' })
    }

    post.content = content.trim()
    await post.save()
    await post.populate(postPopulateOptions)

    res.json(post)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/posts/:id/comments — add a comment to a post
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    const body = req.body || {}
    const content = body.content?.trim()
    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' })
    }

    post.comments.push({
      userId: req.user.userId,
      content
    })

    await post.save()
    await post.populate(postPopulateOptions)

    res.status(201).json(post)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/posts/:id — delete a post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    if (post.userId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this post' })
    }

    await post.deleteOne()
    res.json({ message: 'Post deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/posts/:id/like — toggle like
router.put('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    const userId = req.user.userId
    const alreadyLiked = post.likes.some(id => id.toString() === userId)

    if (alreadyLiked) {
      await post.updateOne({ $pull: { likes: userId } })
    } else {
      await post.updateOne({ $addToSet: { likes: userId } })
    }

    const updatedPost = await Post.findById(req.params.id).select('likes')
    res.json({
      message: alreadyLiked ? 'Post unliked' : 'Post liked',
      liked: !alreadyLiked,
      likes: updatedPost.likes.length
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router