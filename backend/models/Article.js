import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    unique: true
  },
  description: String,
  excerpt: String,
  content: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'],
    default: 'DRAFT'
  },
  category: {
    type: String,
    default: 'General'
  },
  tags: [String],
  contentType: {
    type: String,
    enum: ['BLOG', 'NEWSLETTER', 'SOCIAL_POST', 'WHITEPAPER'],
    default: 'BLOG'
  },
  aiGenerated: {
    type: Boolean,
    default: true
  },
  wordCount: Number,
  readTime: Number,
  views: {
    type: Number,
    default: 0
  },
  likes: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  seoScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  keywords: [String],
  metaDescription: String,
  publishedAt: Date,
  scheduledPublishAt: Date,
  autoPublish: {
    type: Boolean,
    default: false
  },
  abTestVariant: {
    type: String,
    default: null
  },
  // Content Moderation Fields
  moderation: {
    status: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW', 'FLAGGED'],
      default: 'PENDING'
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: Date,
    violations: [{
      category: String,
      severity: { type: Number, min: 1, max: 5 }, // 1=low, 5=critical
      description: String,
      matches: [String]
    }],
    riskScore: { type: Number, default: 0, min: 0, max: 100 },
    requiresManualReview: { type: Boolean, default: false },
    adminNotes: String,
    rejectionReason: String
  },

  // SEO Management Fields
  seo: {
    keywords: [String],
    metaDescription: String,
    metaTitle: String,
    focusKeyword: String,
    seoScore: { type: Number, default: 0, min: 0, max: 100 },
    readability: { type: Number, default: 0, min: 0, max: 100 },
    keywordDensity: { type: Number, default: 0 },
    internalLinks: [String],
    externalLinks: [String],
    imageAltTexts: [String],
    headingStructure: {
      h1: { type: Number, default: 0 },
      h2: { type: Number, default: 0 },
      h3: { type: Number, default: 0 }
    },
    lastSeoAnalysis: Date,
    seoRecommendations: [String]
  },

  // WordPress Integration Fields
  wordpress: {
    postId: { type: Number, default: null },
    url: { type: String, default: null },
    status: {
      type: String,
      enum: ['draft', 'publish', 'private', 'pending', 'future'],
      default: null
    },
    lastSyncedAt: { type: Date, default: null },
    autoPublish: { type: Boolean, default: false },
    syncStatus: {
      type: String,
      enum: ['NOT_SYNCED', 'SYNCED', 'OUT_OF_SYNC', 'SYNC_FAILED'],
      default: 'NOT_SYNCED'
    },
    syncErrors: [String],
    lastSyncError: String,
    publishedAt: Date,
    featuredImageUrl: String,
    categories: [String],
    tags: [String]
  },

  // Article Analytics Fields
  analytics: {
    totalViews: { type: Number, default: 0 },
    uniqueVisitors: { type: Number, default: 0 },
    avgTimeOnPage: { type: Number, default: 0 }, // seconds
    bounceRate: { type: Number, default: 0 },
    scrollDepth: { type: Number, default: 0 }, // percentage
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    conversionRate: { type: Number, default: 0 },
    socialShares: {
      facebook: { type: Number, default: 0 },
      twitter: { type: Number, default: 0 },
      linkedin: { type: Number, default: 0 },
      pinterest: { type: Number, default: 0 }
    },
    referrers: [{
      source: String,
      count: Number
    }],
    deviceBreakdown: {
      desktop: { type: Number, default: 0 },
      mobile: { type: Number, default: 0 },
      tablet: { type: Number, default: 0 }
    },
    lastAnalyticsUpdate: Date
  },

  // A/B Testing Fields
  abTesting: {
    enabled: { type: Boolean, default: false },
    variantName: String,
    originalArticleId: mongoose.Schema.Types.ObjectId,
    variants: [{
      name: String,
      title: String,
      excerpt: String,
      views: { type: Number, default: 0 },
      conversions: { type: Number, default: 0 },
      conversionRate: { type: Number, default: 0 }
    }],
    winningVariant: String,
    testDuration: { type: Number, default: 7 }, // days
    testStartDate: Date,
    testEndDate: Date
  },

  // Content Quality Metrics
  quality: {
    readabilityScore: { type: Number, default: 0, min: 0, max: 100 },
    originalityScore: { type: Number, default: 0, min: 0, max: 100 },
    engagementScore: { type: Number, default: 0, min: 0, max: 100 },
    overallQualityScore: { type: Number, default: 0, min: 0, max: 100 },
    grammarErrors: { type: Number, default: 0 },
    spellErrors: { type: Number, default: 0 },
    plagiarismScore: { type: Number, default: 0 },
    lastQualityCheck: Date,
    qualityIssues: [String]
  },

  // Publishing & Distribution
  publishing: {
    publishedAt: Date,
    scheduledPublishAt: Date,
    autoPublish: { type: Boolean, default: false },
    publishToChannels: {
      blog: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false },
      social: { type: Boolean, default: false },
      wordpress: { type: Boolean, default: false }
    },
    distributionStatus: {
      blog: { type: String, enum: ['PENDING', 'PUBLISHED', 'FAILED'], default: 'PENDING' },
      newsletter: { type: String, enum: ['PENDING', 'PUBLISHED', 'FAILED'], default: 'PENDING' },
      social: { type: String, enum: ['PENDING', 'PUBLISHED', 'FAILED'], default: 'PENDING' },
      wordpress: { type: String, enum: ['PENDING', 'PUBLISHED', 'FAILED'], default: 'PENDING' }
    },
    distributionErrors: [String]
  },

  // Revision History
  revisions: [{
    version: Number,
    title: String,
    content: String,
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changeDescription: String,
    createdAt: { type: Date, default: Date.now }
  }],

  // Comments & Feedback
  feedback: {
    totalComments: { type: Number, default: 0 },
    approvedComments: { type: Number, default: 0 },
    pendingComments: { type: Number, default: 0 },
    lastCommentAt: Date,
    commentsEnabled: { type: Boolean, default: true }
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

// Auto-generate slug from title
articleSchema.pre('save', function() {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  }
});

// Calculate read time
articleSchema.pre('save', function() {
  if (this.content) {
    this.wordCount = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(this.wordCount / 200); // Average 200 words per minute
  }
});

// Methods for article management

// Calculate SEO score
articleSchema.methods.calculateSeoScore = function() {
  let score = 0;
  const checks = [];

  // Check focus keyword
  if (this.seo?.focusKeyword) {
    if (this.title?.toLowerCase().includes(this.seo.focusKeyword.toLowerCase())) score += 10;
    if (this.content?.toLowerCase().includes(this.seo.focusKeyword.toLowerCase())) score += 10;
    if (this.seo?.metaDescription?.toLowerCase().includes(this.seo.focusKeyword.toLowerCase())) score += 5;
  }

  // Check meta description
  if (this.seo?.metaDescription && this.seo.metaDescription.length >= 120 && this.seo.metaDescription.length <= 160) {
    score += 10;
  }

  // Check headings
  if (this.seo?.headingStructure?.h1 === 1) score += 10;
  if (this.seo?.headingStructure?.h2 > 0) score += 5;

  // Check internal links
  if (this.seo?.internalLinks?.length > 0) score += 10;

  // Check external links
  if (this.seo?.externalLinks?.length > 0) score += 5;

  // Check image alt texts
  if (this.seo?.imageAltTexts?.length > 0) score += 10;

  // Check content length
  if (this.wordCount >= 300) score += 10;
  if (this.wordCount >= 600) score += 5;

  // Check readability
  if (this.quality?.readabilityScore >= 60) score += 10;

  this.seo.seoScore = Math.min(score, 100);
  return this.seo.seoScore;
};

// Calculate quality score
articleSchema.methods.calculateQualityScore = function() {
  let score = 0;

  // Readability
  if (this.quality?.readabilityScore) score += this.quality.readabilityScore * 0.3;

  // Originality
  if (this.quality?.originalityScore) score += this.quality.originalityScore * 0.3;

  // Engagement
  if (this.quality?.engagementScore) score += this.quality.engagementScore * 0.2;

  // Grammar and spelling
  const errorPenalty = Math.min((this.quality?.grammarErrors || 0) + (this.quality?.spellErrors || 0), 10) * 2;
  score -= errorPenalty;

  this.quality.overallQualityScore = Math.max(Math.min(score, 100), 0);
  return this.quality.overallQualityScore;
};

// Calculate engagement score
articleSchema.methods.calculateEngagementScore = function() {
  const totalInteractions = (this.analytics?.likes || 0) + (this.analytics?.shares || 0) + (this.analytics?.comments || 0);
  const views = this.analytics?.totalViews || 1;
  const engagementRate = (totalInteractions / views) * 100;

  this.analytics.conversionRate = engagementRate;
  this.quality.engagementScore = Math.min(engagementRate * 10, 100);

  return this.quality.engagementScore;
};

// Update WordPress sync status
articleSchema.methods.updateWordPressSync = function(status, error = null) {
  this.wordpress.syncStatus = status;
  this.wordpress.lastSyncedAt = new Date();
  
  if (error) {
    this.wordpress.syncErrors = this.wordpress.syncErrors || [];
    this.wordpress.syncErrors.push(error);
    this.wordpress.lastSyncError = error;
  }

  return this;
};

// Create article revision
articleSchema.methods.createRevision = function(userId, description) {
  if (!this.revisions) this.revisions = [];

  const revision = {
    version: (this.revisions.length || 0) + 1,
    title: this.title,
    content: this.content,
    changedBy: userId,
    changeDescription: description,
    createdAt: new Date()
  };

  this.revisions.push(revision);
  return revision;
};

// Get article performance metrics
articleSchema.methods.getPerformanceMetrics = function() {
  return {
    views: this.analytics?.totalViews || 0,
    uniqueVisitors: this.analytics?.uniqueVisitors || 0,
    avgTimeOnPage: this.analytics?.avgTimeOnPage || 0,
    bounceRate: this.analytics?.bounceRate || 0,
    scrollDepth: this.analytics?.scrollDepth || 0,
    likes: this.analytics?.likes || 0,
    shares: this.analytics?.shares || 0,
    comments: this.analytics?.comments || 0,
    conversions: this.analytics?.conversions || 0,
    conversionRate: this.analytics?.conversionRate || 0,
    engagementScore: this.quality?.engagementScore || 0,
    seoScore: this.seo?.seoScore || 0,
    qualityScore: this.quality?.overallQualityScore || 0
  };
};

// Check if article needs review
articleSchema.methods.needsReview = function() {
  return this.moderation?.status === 'PENDING' || 
         this.moderation?.status === 'UNDER_REVIEW' ||
         this.moderation?.requiresManualReview;
};

// Approve article
articleSchema.methods.approve = function(reviewerId, notes = '') {
  this.moderation.status = 'APPROVED';
  this.moderation.reviewedBy = reviewerId;
  this.moderation.reviewedAt = new Date();
  this.moderation.adminNotes = notes;
  return this;
};

// Reject article
articleSchema.methods.reject = function(reviewerId, reason, notes = '') {
  this.moderation.status = 'REJECTED';
  this.moderation.reviewedBy = reviewerId;
  this.moderation.reviewedAt = new Date();
  this.moderation.rejectionReason = reason;
  this.moderation.adminNotes = notes;
  return this;
};

// Flag article for review
articleSchema.methods.flag = function(reason, notes = '') {
  this.moderation.status = 'FLAGGED';
  this.moderation.requiresManualReview = true;
  this.moderation.adminNotes = notes;
  return this;
};

// Index for efficient queries
articleSchema.index({ userId: 1 });
articleSchema.index({ campaignId: 1 });
articleSchema.index({ status: 1 });
articleSchema.index({ slug: 1 });
articleSchema.index({ createdAt: -1 });
articleSchema.index({ views: -1 });
articleSchema.index({ scheduledPublishAt: 1 });
articleSchema.index({ autoPublish: 1 });

const Article = mongoose.model('Article', articleSchema);

export default Article;
