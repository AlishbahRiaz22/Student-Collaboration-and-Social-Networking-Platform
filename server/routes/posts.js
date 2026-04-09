const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const Post = require('../models/Post')
const auth = require('../middleware/auth')
const multer = require('multer')
const cloudinary = require('../config/cloudinary')

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

const postPopulateOptions = [
  { path: 'userId', select: 'name username avatar' },
  { path: 'comments.userId', select: 'name username avatar' }
]

const likePopulateOptions = [
  { path: 'likes', select: 'name username avatar' }
]

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
    res.json(posts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/posts/feed — smart feed, only posts from people you follow (your Day 5 task)
router.get('/feed', auth, async (req, res) => {
  try {
    const User = require('../models/User')
    const currentUser = await User.findById(req.user.userId)
    const followingIds = currentUser.following

    const posts = await Post.find({ userId: { $in: followingIds } })
      .sort({ createdAt: -1 })
      .populate(postPopulateOptions)

    res.json(posts)
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

    res.json(posts)
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

    res.json(post)
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
    const { content, graphic } = body
    if (!content?.trim())
      return res.status(400).json({ error: 'Content is required' })

    let graphicUrl = null

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file)
      graphicUrl = uploadResult.secure_url
    } else if (typeof graphic === 'string' && graphic.trim()) {
      graphicUrl = graphic.trim()
    }

    const post = new Post({
      userId: req.user.userId,
      content: content.trim(),
      graphic: graphicUrl
    })

    await post.save()

    // populate before sending back so PostCard gets the author name immediately
    await post.populate(postPopulateOptions)
    res.status(201).json(post)
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