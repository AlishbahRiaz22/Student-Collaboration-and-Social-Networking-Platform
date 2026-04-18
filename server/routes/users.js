const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const multer = require('multer')
const cloudinary = require('../config/cloudinary')
const User = require('../models/User')
const auth = require('../middleware/auth')

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'))
    }

    cb(null, true)
  }
})

const uploadAvatarToCloudinary = (file) => {
  const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`

  return cloudinary.uploader.upload(dataUri, {
    folder: 'studentnet/avatars',
    resource_type: 'image',
    width: 512,
    height: 512,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto'
  })
}

// GET /api/users/suggestions — suggested users to follow (protected)
router.get('/suggestions', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).select('following')
    if (!currentUser) {
      return res.status(404).json({ error: 'Current user not found' })
    }

    const excludedIds = [req.user.userId, ...(currentUser.following || [])]

    const suggestions = await User.find({ _id: { $nin: excludedIds } })
      .select('name username followers following avatar')
      .limit(6)

    const data = suggestions.map((u) => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      avatar: u.avatar,
      isFollowing: currentUser.following.some((id) => id.toString() === u._id.toString())
    }))

    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/users/search?q=term — search users by username/name
router.get('/search', auth, async (req, res) => {
  try {
    const q = String(req.query.q || '').trim()

    if (!q) {
      return res.json([])
    }

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'i')

    const users = await User.find({
      _id: { $ne: req.user.userId },
      $or: [
        { username: regex },
        { name: regex }
      ]
    })
      .select('name username avatar bio followers following')
      .limit(20)

    res.json(users)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// GET /api/users/:identifier — get any user's profile by id or username
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params

    const user = isValidObjectId(identifier)
      ? await User.findById(identifier).select('-password')
      : await User.findOne({ username: identifier }).select('-password')

    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/users/:id/avatar — upload/change profile picture (protected)
router.put('/:id/avatar', auth, (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user id' })
    }

    if (req.user.userId !== req.params.id) {
      return res.status(403).json({ error: 'You can only edit your own profile' })
    }

    avatarUpload.single('avatar')(req, res, async (err) => {
      try {
        if (err) {
          const message = err.message === 'File too large'
            ? 'Avatar image must be 2MB or smaller'
            : err.message
          return res.status(400).json({ error: message })
        }

        if (!req.file) {
          return res.status(400).json({ error: 'Avatar image is required' })
        }

        const currentUser = await User.findById(req.params.id)
        if (!currentUser) {
          return res.status(404).json({ error: 'User not found' })
        }

        let uploadResult
        try {
          uploadResult = await uploadAvatarToCloudinary(req.file)
        } catch (uploadErr) {
          return res.status(500).json({ error: uploadErr.message })
        }

        try {
          const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            {
              avatar: uploadResult.secure_url,
              avatarPublicId: uploadResult.public_id
            },
            { returnDocument: 'after' }
          ).select('-password')

          if (!updatedUser) {
            await cloudinary.uploader.destroy(uploadResult.public_id).catch(() => {})
            return res.status(404).json({ error: 'User not found' })
          }

          if (currentUser.avatarPublicId && currentUser.avatarPublicId !== uploadResult.public_id) {
            await cloudinary.uploader.destroy(currentUser.avatarPublicId).catch(() => {})
          }

          res.json(updatedUser)
        } catch (updateErr) {
          await cloudinary.uploader.destroy(uploadResult.public_id).catch(() => {})
          res.status(500).json({ error: 'Server error' })
        }
      } catch (handlerErr) {
        res.status(500).json({ error: 'Server error' })
      }
    })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/users/:id — update own profile (protected)
router.put('/:id', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user id' })
    }

    console.log('req.user:', req.user)
    console.log('req.params.id:', req.params.id)
    if (req.user.userId !== req.params.id)
      return res.status(403).json({ error: 'You can only edit your own profile' })

    const { name, bio } = req.body
    console.log('Updating user...')
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, bio },
      { returnDocument: 'after' }
    ).select('-password')
    console.log('Updated user:', user)
    res.json(user)
  } catch (err) {
    console.log('Error:', err.message)
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/users/:id/follow — follow a user (protected)
router.put('/:id/follow', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user id' })
    }

    if (req.user.userId === req.params.id)
      return res.status(400).json({ error: "You can't follow yourself" })

    const userToFollow = await User.findById(req.params.id)
    const currentUser = await User.findById(req.user.userId)

    if (userToFollow.followers.includes(req.user.userId))
      return res.status(400).json({ error: 'Already following' })

    await userToFollow.updateOne({ $addToSet: { followers: req.user.userId } })
    await currentUser.updateOne({ $addToSet: { following: req.params.id } })

    res.json({ message: 'Followed successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/users/:id/unfollow — unfollow a user (protected)
router.put('/:id/unfollow', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid user id' })
    }

    if (req.user.userId === req.params.id)
      return res.status(400).json({ error: "You can't unfollow yourself" })

    const userToUnfollow = await User.findById(req.params.id)
    const currentUser = await User.findById(req.user.userId)

    if (!userToUnfollow.followers.includes(req.user.userId))
      return res.status(400).json({ error: 'Not following this user' })

    await userToUnfollow.updateOne({ $pull: { followers: req.user.userId } })
    await currentUser.updateOne({ $pull: { following: req.params.id } })

    res.json({ message: 'Unfollowed successfully' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router