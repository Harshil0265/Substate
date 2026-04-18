import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['USER', 'ADMIN'],
    default: 'USER'
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  failedLoginAttempts: {
    type: Number,
    default: 0
  },
  accountLocked: {
    type: Boolean,
    default: false
  },
  lockedUntil: {
    type: Date,
    default: null
  },
  subscription: {
    type: String,
    enum: ['TRIAL', 'BASIC', 'PRO', 'ENTERPRISE'],
    default: 'TRIAL'
  },
  subscriptionStatus: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED'],
    default: 'ACTIVE'
  },
  subscriptionStartDate: Date,
  subscriptionEndDate: Date,
  lastLogin: {
    type: Date,
    default: Date.now
  },
  articleCount: {
    type: Number,
    default: 0
  },
  campaignCount: {
    type: Number,
    default: 0
  },
  riskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastActivityDate: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Index for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ subscription: 1 });
userSchema.index({ riskScore: 1 });
userSchema.index({ lastLogin: -1 });

const User = mongoose.model('User', userSchema);

export default User;
