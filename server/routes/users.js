const express = require('express')
const router = express.Router()
const User = require('../models/User')
const auth = require('../middleware/auth')

// GET /api/users/:id — get any user's profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

// PUT /api/users/:id — update own profile (protected)
router.put('/:id', auth, async (req, res) => {
  try {
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