const express = require('express')
const mongoose = require('mongoose')
const router = express.Router()

const Conversation = require('../models/Conversation')
const Message = require('../models/Message')
const auth = require('../middleware/auth')
const { getIo } = require('../socket')

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id)

const ensureParticipant = (conversation, userId) =>
  conversation.participants.some((participantId) => participantId.toString() === userId)

router.post('/', auth, async (req, res) => {
  try {
    const { conversationId, content, attachments = [] } = req.body || {}

    if (!isValidObjectId(conversationId)) {
      return res.status(400).json({ error: 'Invalid conversation id' })
    }

    const trimmedContent = content?.trim()
    if (!trimmedContent) {
      return res.status(400).json({ error: 'Message content is required' })
    }

    const conversation = await Conversation.findById(conversationId)
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' })
    }

    if (!ensureParticipant(conversation, req.user.userId)) {
      return res.status(403).json({ error: 'Not authorized to send messages in this conversation' })
    }

    const message = await Message.create({
      conversationId,
      senderId: req.user.userId,
      content: trimmedContent,
      attachments: Array.isArray(attachments) ? attachments : []
    })

    conversation.latestMessage = message._id
    await conversation.save()

    const populatedMessage = await Message.findById(message._id).populate('senderId', 'name username avatar')

    const io = getIo()
    if (io) {
      io.to(`conversation:${conversationId}`).emit('message:new', populatedMessage)
      conversation.participants.forEach((participantId) => {
        if (participantId.toString() !== req.user.userId) {
        io.to(`user:${participantId.toString()}`).emit('message:received', populatedMessage)
        }
      })
    }

    res.status(201).json(populatedMessage)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/:id/read', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid message id' })
    }

    const message = await Message.findById(req.params.id)
    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    const conversation = await Conversation.findById(message.conversationId)
    if (!conversation || !ensureParticipant(conversation, req.user.userId)) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await Message.updateOne(
      { _id: req.params.id },
      { $addToSet: { readBy: req.user.userId } }
    )

    const updatedMessage = await Message.findById(req.params.id).populate('senderId', 'name username avatar')
    res.json(updatedMessage)
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

router.delete('/:id', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: 'Invalid message id' })
    }

    const message = await Message.findById(req.params.id)
    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }

    if (message.senderId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'You can only delete your own messages' })
    }

    await message.deleteOne()

    const conversation = await Conversation.findById(message.conversationId)
    if (conversation && conversation.latestMessage?.toString() === message._id.toString()) {
      const nextLatestMessage = await Message.findOne({ conversationId: message.conversationId })
        .sort({ createdAt: -1 })

      conversation.latestMessage = nextLatestMessage ? nextLatestMessage._id : null
      await conversation.save()
    }

    res.json({ message: 'Message deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router