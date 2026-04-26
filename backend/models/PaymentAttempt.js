import mongoose from 'mongoose';

const paymentAttemptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionId: {
    type: String,
    required: true // Unique session identifier for tracking
  },
  planType: {
    type: String,
    enum: ['TRIAL', 'PROFESSIONAL', 'ENTERPRISE'],
    required: true
  },
  billingPeriod: {
    type: String,
    enum: ['MONTHLY', 'YEARLY'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  originalAmount: {
    type: Number,
    default: null
  },
  currency: {
    type: String,
    default: 'INR'
  },
  coupon: {
    code: String,
    discountAmount: Number,
    couponId: mongoose.Schema.Types.ObjectId
  },
  attemptType: {
    type: String,
    enum: ['INITIATED', 'CANCELLED', 'FAILED', 'COMPLETED'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['RAZORPAY', 'STRIPE', 'DIRECT'],
    default: 'RAZORPAY'
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  cancellationReason: {
    type: String,
    enum: [
      'USER_CANCELLED', // User clicked back/cancel
      'PAYMENT_FAILED', // Payment gateway failure
      'INSUFFICIENT_FUNDS', // Bank declined
      'NETWORK_ERROR', // Connection issues
      'TIMEOUT', // Session timeout
      'OTHER'
    ]
  },
  cancellationStage: {
    type: String,
    enum: [
      'PLAN_SELECTION', // Cancelled during plan selection
      'PAYMENT_GATEWAY', // Cancelled at payment gateway
      'PROCESSING', // Cancelled during processing
      'VERIFICATION' // Cancelled during verification
    ]
  },
  userAgent: String,
  ipAddress: String,
  referrer: String,
  timeSpent: Number, // Time spent on payment page in seconds
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes for efficient queries
paymentAttemptSchema.index({ userId: 1 });
paymentAttemptSchema.index({ attemptType: 1 });
paymentAttemptSchema.index({ createdAt: -1 });
paymentAttemptSchema.index({ sessionId: 1 });
paymentAttemptSchema.index({ planType: 1, billingPeriod: 1 });

// Virtual for conversion tracking
paymentAttemptSchema.virtual('isConversion').get(function() {
  return this.attemptType === 'COMPLETED';
});

// Static method to get conversion rate
paymentAttemptSchema.statics.getConversionRate = async function(dateRange = {}) {
  const matchStage = {};
  
  if (dateRange.startDate || dateRange.endDate) {
    matchStage.createdAt = {};
    if (dateRange.startDate) matchStage.createdAt.$gte = new Date(dateRange.startDate);
    if (dateRange.endDate) matchStage.createdAt.$lte = new Date(dateRange.endDate);
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalAttempts: { $sum: 1 },
        initiatedAttempts: {
          $sum: { $cond: [{ $eq: ['$attemptType', 'INITIATED'] }, 1, 0] }
        },
        cancelledAttempts: {
          $sum: { $cond: [{ $eq: ['$attemptType', 'CANCELLED'] }, 1, 0] }
        },
        failedAttempts: {
          $sum: { $cond: [{ $eq: ['$attemptType', 'FAILED'] }, 1, 0] }
        },
        completedAttempts: {
          $sum: { $cond: [{ $eq: ['$attemptType', 'COMPLETED'] }, 1, 0] }
        }
      }
    },
    {
      $project: {
        totalAttempts: 1,
        initiatedAttempts: 1,
        cancelledAttempts: 1,
        failedAttempts: 1,
        completedAttempts: 1,
        conversionRate: {
          $cond: [
            { $gt: ['$initiatedAttempts', 0] },
            { $multiply: [{ $divide: ['$completedAttempts', '$initiatedAttempts'] }, 100] },
            0
          ]
        },
        cancellationRate: {
          $cond: [
            { $gt: ['$initiatedAttempts', 0] },
            { $multiply: [{ $divide: ['$cancelledAttempts', '$initiatedAttempts'] }, 100] },
            0
          ]
        }
      }
    }
  ]);

  return stats[0] || {
    totalAttempts: 0,
    initiatedAttempts: 0,
    cancelledAttempts: 0,
    failedAttempts: 0,
    completedAttempts: 0,
    conversionRate: 0,
    cancellationRate: 0
  };
};

// Static method to get cancellation reasons breakdown
paymentAttemptSchema.statics.getCancellationBreakdown = async function(dateRange = {}) {
  const matchStage = { attemptType: 'CANCELLED' };
  
  if (dateRange.startDate || dateRange.endDate) {
    matchStage.createdAt = {};
    if (dateRange.startDate) matchStage.createdAt.$gte = new Date(dateRange.startDate);
    if (dateRange.endDate) matchStage.createdAt.$lte = new Date(dateRange.endDate);
  }

  return await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$cancellationReason',
        count: { $sum: 1 },
        avgTimeSpent: { $avg: '$timeSpent' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

const PaymentAttempt = mongoose.model('PaymentAttempt', paymentAttemptSchema);

export default PaymentAttempt;