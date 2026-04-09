const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const User = require('../models/User')
const auth = require('../middleware/auth')

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

// GET /api/users/suggestions — suggested users to follow (protected)
router.get('/suggestions', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId).select('following')
    if (!currentUser) {
      return res.status(404).json({ error: 'Current user not found' })
    }

    const excludedIds = [req.user.userId, ...(currentUser.following || [])]

    const suggestions = await User.find({ _id: { $nin: excludedIds } })
      .select('name username followers following')
      .limit(6)

    const data = suggestions.map((u) => ({
      _id: u._id,
      name: u.name,
      username: u.username,
      isFollowing: currentUser.following.some((id) => id.toString() === u._id.toString())
    }))

    res.json(data)
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
      { new: true }
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

    await userToFollow.updateOne({ $push: { followers: req.user.userId } })
    await currentUser.updateOne({ $push: { following: req.params.id } })

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