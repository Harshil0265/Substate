import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'PAUSED'],
    default: 'DRAFT'
  },
  campaignType: {
    type: String,
    enum: ['EMAIL', 'CONTENT', 'SOCIAL', 'MULTI_CHANNEL'],
    default: 'CONTENT'
  },
  targetAudience: {
    type: String,
    enum: ['ALL', 'PREMIUM', 'TRIAL', 'AT_RISK'],
    default: 'ALL'
  },
  startDate: Date,
  endDate: Date,
  articlesGenerated: {
    type: Number,
    default: 0
  },
  engagementRate: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  emailsSent: {
    type: Number,
    default: 0
  },
  opensCount: {
    type: Number,
    default: 0
  },
  clicksCount: {
    type: Number,
    default: 0
  },
  conversionCount: {
    type: Number,
    default: 0
  },
  automationEnabled: {
    type: Boolean,
    default: false
  },
  aiGenerationEnabled: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for efficient queries
campaignSchema.index({ userId: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ createdAt: -1 });

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;
