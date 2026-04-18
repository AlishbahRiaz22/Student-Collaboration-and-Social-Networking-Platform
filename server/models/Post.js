const mongoose = require('mongoose');
const commentSchema = require('./Comment');

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', default: null, index: true },
  sectionId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
  audience: {
    type: String,
    enum: ['public', 'followers', 'members', 'section'],
    default: 'public'
  },
  content: { type: String, default: '' },
  graphic: { type: String, default: null },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  comments: { type: [commentSchema], default: [] }
}, { timestamps: true });

postSchema.index({ societyId: 1, createdAt: -1 })
postSchema.index({ sectionId: 1, createdAt: -1 })

module.exports = mongoose.model('Post', postSchema);