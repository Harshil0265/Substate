import mongoose from 'mongoose';

const emailVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  expiresAt: {
    type: Date,
    required: true,
    index: true
  },
  attempts: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Document will be automatically deleted after 1 hour
  }
});

// Index for efficient queries
emailVerificationSchema.index({ email: 1, verified: 1 });
emailVerificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

const EmailVerification = mongoose.model('EmailVerification', emailVerificationSchema);

export default EmailVerification;
