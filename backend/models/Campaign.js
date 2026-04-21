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
  // Advanced Automation Features
  autoScheduling: {
    enabled: { type: Boolean, default: false },
    frequency: { 
      type: String, 
      enum: ['DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY'],
      default: 'WEEKLY'
    },
    timeOfDay: { type: String, default: '09:00' }, // HH:MM format
    daysOfWeek: [{ type: Number, min: 0, max: 6 }], // 0=Sunday, 6=Saturday
    nextScheduledDate: Date
  },
  abTesting: {
    enabled: { type: Boolean, default: false },
    variants: [{
      name: String,
      title: String,
      description: String,
      impressions: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 }
    }],
    winningVariant: String,
    testDuration: { type: Number, default: 7 } // days
  },
  notifications: {
    milestones: {
      enabled: { type: Boolean, default: true },
      thresholds: [{ type: Number, default: 25 }, { type: Number, default: 50 }, { type: Number, default: 75 }, { type: Number, default: 100 }],
      notifiedAt: [Number] // Track which milestones have been notified
    },
    emailAlerts: {
      enabled: { type: Boolean, default: true },
      onStart: { type: Boolean, default: true },
      onComplete: { type: Boolean, default: true },
      onMilestone: { type: Boolean, default: true },
      onLowPerformance: { type: Boolean, default: true }
    }
  },
  roi: {
    investment: { type: Number, default: 0 }, // Campaign cost
    revenue: { type: Number, default: 0 }, // Generated revenue
    roiPercentage: { type: Number, default: 0 },
    costPerClick: { type: Number, default: 0 },
    costPerConversion: { type: Number, default: 0 },
    revenuePerArticle: { type: Number, default: 0 }
  },
  analytics: {
    totalViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    avgTimeOnPage: { type: Number, default: 0 }, // seconds
    bounceRate: { type: Number, default: 0 },
    socialShares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 }
  },
  template: {
    isTemplate: { type: Boolean, default: false },
    templateName: String,
    templateCategory: String,
    usageCount: { type: Number, default: 0 }
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

// Virtual for article count
campaignSchema.virtual('articleCount', {
  ref: 'Article',
  localField: '_id',
  foreignField: 'campaignId',
  count: true
});

// Method to calculate ROI
campaignSchema.methods.calculateROI = function() {
  if (this.roi.investment > 0) {
    this.roi.roiPercentage = ((this.roi.revenue - this.roi.investment) / this.roi.investment) * 100;
  }
  if (this.clicksCount > 0) {
    this.roi.costPerClick = this.roi.investment / this.clicksCount;
  }
  if (this.conversionCount > 0) {
    this.roi.costPerConversion = this.roi.investment / this.conversionCount;
  }
  if (this.articlesGenerated > 0) {
    this.roi.revenuePerArticle = this.roi.revenue / this.articlesGenerated;
  }
};

// Method to update analytics
campaignSchema.methods.updateAnalytics = async function() {
  const Article = mongoose.model('Article');
  const articles = await Article.find({ campaignId: this._id });
  
  this.analytics.totalViews = articles.reduce((sum, article) => sum + (article.views || 0), 0);
  this.analytics.socialShares = articles.reduce((sum, article) => sum + (article.shares || 0), 0);
  this.articlesGenerated = articles.length;
  
  // Calculate engagement rate
  if (this.analytics.totalViews > 0) {
    const totalEngagements = this.clicksCount + this.analytics.socialShares;
    this.engagementRate = (totalEngagements / this.analytics.totalViews) * 100;
  }
};

// Method to check and send milestone notifications
campaignSchema.methods.checkMilestones = function() {
  if (!this.notifications.milestones.enabled) return [];
  
  const progress = this.getProgress();
  const milestones = [];
  
  for (const threshold of this.notifications.milestones.thresholds) {
    if (progress >= threshold && !this.notifications.milestones.notifiedAt.includes(threshold)) {
      milestones.push(threshold);
      this.notifications.milestones.notifiedAt.push(threshold);
    }
  }
  
  return milestones;
};

// Method to get campaign progress
campaignSchema.methods.getProgress = function() {
  if (!this.startDate || !this.endDate) return 0;
  
  const now = new Date();
  const start = new Date(this.startDate);
  const end = new Date(this.endDate);
  
  if (now < start) return 0;
  if (now > end) return 100;
  
  const total = end - start;
  const elapsed = now - start;
  
  return Math.round((elapsed / total) * 100);
};

// Method to get next scheduled publish date
campaignSchema.methods.getNextScheduledDate = function() {
  if (!this.autoScheduling.enabled) return null;
  
  const now = new Date();
  const [hours, minutes] = this.autoScheduling.timeOfDay.split(':');
  
  let nextDate = new Date(now);
  nextDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  // If time has passed today, start from tomorrow
  if (nextDate <= now) {
    nextDate.setDate(nextDate.getDate() + 1);
  }
  
  // Find next valid day based on frequency
  switch (this.autoScheduling.frequency) {
    case 'DAILY':
      // Already set to next day if needed
      break;
    case 'WEEKLY':
      // Find next day in daysOfWeek array
      while (!this.autoScheduling.daysOfWeek.includes(nextDate.getDay())) {
        nextDate.setDate(nextDate.getDate() + 1);
      }
      break;
    case 'BI_WEEKLY':
      nextDate.setDate(nextDate.getDate() + 14);
      break;
    case 'MONTHLY':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
  }
  
  return nextDate;
};

// Index for efficient queries
campaignSchema.index({ userId: 1 });
campaignSchema.index({ status: 1 });
campaignSchema.index({ createdAt: -1 });
campaignSchema.index({ 'template.isTemplate': 1 });
campaignSchema.index({ 'autoScheduling.nextScheduledDate': 1 });

const Campaign = mongoose.model('Campaign', campaignSchema);

export default Campaign;
