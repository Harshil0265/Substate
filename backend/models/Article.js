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
  // WordPress Integration Fields
  wordpressPostId: {
    type: Number,
    default: null
  },
  wordpressUrl: {
    type: String,
    default: null
  },
  wordpressStatus: {
    type: String,
    enum: ['draft', 'publish', 'private', 'pending', 'future'],
    default: null
  },
  lastSyncedAt: {
    type: Date,
    default: null
  },
  autoPublishToWordPress: {
    type: Boolean,
    default: false
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
