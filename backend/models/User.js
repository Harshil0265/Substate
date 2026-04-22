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
  phone: {
    type: String,
    default: ''
  },
  company: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: ''
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
  // Notification preferences
  emailNotifications: {
    type: Boolean,
    default: true
  },
  campaignUpdates: {
    type: Boolean,
    default: true
  },
  articlePublished: {
    type: Boolean,
    default: true
  },
  weeklyReports: {
    type: Boolean,
    default: false
  },
  marketingEmails: {
    type: Boolean,
    default: false
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
    enum: ['TRIAL', 'PROFESSIONAL', 'ENTERPRISE'],
    default: 'TRIAL'
  },
  subscriptionStatus: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'LOCKED'],
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
  violationHistory: [{
    date: { type: Date, default: Date.now },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    category: String,
    severity: Number,
    description: String,
    action: String
  }],
  violationCount: {
    type: Number,
    default: 0
  },
  lockReason: {
    type: String,
    default: null
  },
  lastActivityDate: {
    type: Date,
    default: Date.now
  },
  // Usage warning tracking - to prevent sending duplicate emails
  usageWarnings: {
    campaigns75: {
      type: Boolean,
      default: false
    },
    campaigns100: {
      type: Boolean,
      default: false
    },
    articles75: {
      type: Boolean,
      default: false
    },
    articles100: {
      type: Boolean,
      default: false
    }
  },
  // Activity tracking
  loginHistory: [{
    timestamp: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String,
    location: String
  }],
  
  // Password reset tracking
  passwordResetHistory: [{
    timestamp: { type: Date, default: Date.now },
    resetBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin who initiated
    reason: String
  }],
  
  // Trial extension tracking
  trialExtensions: [{
    extendedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Admin who extended
    extensionDate: { type: Date, default: Date.now },
    daysAdded: Number,
    reason: String,
    previousEndDate: Date,
    newEndDate: Date
  }],
  
  // Manual verification tracking
  manualVerification: {
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verificationDate: Date,
    reason: String
  },
  
  // Risk assessment details
  riskAssessment: {
    churnRisk: { type: Number, default: 0, min: 0, max: 100 },
    paymentRisk: { type: Number, default: 0, min: 0, max: 100 },
    activityRisk: { type: Number, default: 0, min: 0, max: 100 },
    lastAssessment: Date,
    assessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  
  // Subscription change history
  subscriptionHistory: [{
    previousPlan: String,
    newPlan: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changeDate: { type: Date, default: Date.now },
    reason: String,
    effectiveDate: Date
  }],
  
  // Payment history reference
  paymentHistory: [{
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    amount: Number,
    status: String,
    date: Date,
    plan: String
  }],
  
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
