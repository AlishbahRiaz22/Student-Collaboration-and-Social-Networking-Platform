const express = require('express')
const router = express.Router()
const User = require('../models/User')
const auth = require('../middleware/auth')

// GET /api/users/:id — get user profile
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/users/:id — update bio
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.userId !== req.params.id)
      return res.status(403).json({ error: 'Unauthorized' })
    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { bio: req.body.bio },
      { new: true }
    ).select('-password')
    res.json(updated)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router