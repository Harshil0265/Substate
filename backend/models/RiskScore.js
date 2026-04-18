import mongoose from 'mongoose';

const riskScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  overallRiskScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  churnRisk: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  paymentFailureRisk: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  inactivityRisk: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lowEngagementRisk: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  daysSinceLastLogin: Number,
  daysSinceLastPayment: Number,
  consecutiveFailedPayments: {
    type: Number,
    default: 0
  },
  avgArticlesPerMonth: Number,
  avgCampaignsPerMonth: Number,
  supportTicketsOpened: {
    type: Number,
    default: 0
  },
  lastRecalculatedAt: {
    type: Date,
    default: Date.now
  },
  riskTrend: {
    type: String,
    enum: ['INCREASING', 'STABLE', 'DECREASING'],
    default: 'STABLE'
  },
  recommendedAction: {
    type: String,
    enum: ['NONE', 'OUTREACH', 'OFFER_DISCOUNT', 'PRIORITY_SUPPORT', 'RETENTION_CAMPAIGN'],
    default: 'NONE'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for efficient queries
riskScoreSchema.index({ userId: 1 });
riskScoreSchema.index({ overallRiskScore: -1 });
riskScoreSchema.index({ churnRisk: -1 });
riskScoreSchema.index({ lastRecalculatedAt: -1 });

const RiskScore = mongoose.model('RiskScore', riskScoreSchema);

export default RiskScore;
