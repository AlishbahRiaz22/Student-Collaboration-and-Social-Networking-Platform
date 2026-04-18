const mongoose = require('mongoose')

const societyMemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  privilegeLevel: {
    type: String,
    enum: ['creator', 'admin', 'moderator', 'member'],
    default: 'member'
  },
  role: {
    type: String,
    enum: ['creator', 'admin', 'moderator', 'member'],
    default: 'member'
  },
  permissions: {
    manageSociety: { type: Boolean, default: false },
    editSociety: { type: Boolean, default: false },
    manageMembers: { type: Boolean, default: false },
    assignMembers: { type: Boolean, default: false },
    removeMembers: { type: Boolean, default: false },
    manageSections: { type: Boolean, default: false },
    createSections: { type: Boolean, default: false },
    createPosts: { type: Boolean, default: false },
    moderatePosts: { type: Boolean, default: false }
  },
  status: {
    type: String,
    enum: ['active', 'pending', 'invited', 'banned'],
    default: 'active'
  },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  joinedAt: { type: Date, default: Date.now }
}, { timestamps: true })

const societyFollowerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  followedAt: { type: Date, default: Date.now }
}, { timestamps: true })

const societySectionMemberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedAt: { type: Date, default: Date.now }
}, { timestamps: true })

const societySectionSchema = new mongoose.Schema({
  parentSectionId: { type: mongoose.Schema.Types.ObjectId, default: null },
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  order: { type: Number, default: 0 },
  managerIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  settings: {
    canMembersPost: { type: Boolean, default: true },
    canMembersInvite: { type: Boolean, default: false },
    canMembersAssign: { type: Boolean, default: false },
    canMembersCreateSubsections: { type: Boolean, default: false }
  },
  members: { type: [societySectionMemberSchema], default: [] }
}, { timestamps: true })

const societySchema = new mongoose.Schema(
  {
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true, index: true },
    description: { type: String, default: '' },
    picture: { type: String, default: '' },
    picturePublicId: { type: String, default: '' },
    members: { type: [societyMemberSchema], default: [] },
    followers: { type: [societyFollowerSchema], default: [] },
    sections: { type: [societySectionSchema], default: [] },
    visibility: {
      type: String,
      enum: ['public', 'private'],
      default: 'public'
    },
    settings: {
      defaultMemberCanPost: { type: Boolean, default: false },
      defaultMemberCanCreateSections: { type: Boolean, default: false },
      allowMemberInvites: { type: Boolean, default: false },
      requireApprovalForJoin: { type: Boolean, default: false },
      inviteOnly: { type: Boolean, default: false },
      allowFollowersSeePosts: { type: Boolean, default: true }
    }
  },
  { timestamps: true }
)

societySchema.index({ creatorId: 1, createdAt: -1 })
societySchema.index({ 'members.userId': 1 })
societySchema.index({ 'followers.userId': 1 })
societySchema.index({ 'sections.slug': 1 })

module.exports = mongoose.model('Society', societySchema)