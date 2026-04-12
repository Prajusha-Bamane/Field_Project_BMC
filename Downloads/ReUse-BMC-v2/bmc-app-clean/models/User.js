const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['donor', 'ngo', 'admin'], required: true },
  phone: { type: String, default: '' },
  address: { type: String, default: '' },
  points: { type: Number, default: 0 },

  // Donor fields
  city: { type: String, default: '' },

  // NGO fields
  organizationName: { type: String, default: '' },
  registrationNumber: { type: String, default: '' },
  ngoCategory: {
    type: String,
    enum: ['food', 'education', 'health', 'clothes', 'general', ''],
    default: ''
  },
  website: { type: String, default: '' },
  description: { type: String, default: '' },
  // BMC Verification
  isVerified: { type: Boolean, default: false },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationNote: { type: String, default: '' },
  verifiedAt: { type: Date, default: null },
  // NGO performance (for priority scoring)
  totalReceived: { type: Number, default: 0 },
  totalDistributed: { type: Number, default: 0 },
  priorityScore: { type: Number, default: 50 }, // 0-100

  // BMC Officer fields
  badgeNumber: { type: String, default: '' },
  zone: { type: String, default: '' },

  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Virtual: compute priority score based on performance
userSchema.methods.computePriority = function () {
  if (this.totalReceived === 0) return 50;
  const ratio = this.totalDistributed / this.totalReceived;
  return Math.round(Math.min(100, ratio * 100));
};

module.exports = mongoose.model('User', userSchema);
