const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const societyMembershipSchema = new mongoose.Schema({
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
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
  joinedAt: { type: Date, default: Date.now }
}, { _id: false })

const followedSocietySchema = new mongoose.Schema({
  societyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', required: true },
  followedAt: { type: Date, default: Date.now }
}, { _id: false })

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  avatarPublicId: { type: String, default: '' },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followedSocieties: { type: [followedSocietySchema], default: [] },
  societyMemberships: { type: [societyMembershipSchema], default: [] },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);
