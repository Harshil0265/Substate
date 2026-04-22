import Article from '../models/Article.js';
import ContentModerationService from './ContentModerationService.js';

class ArticleManagementService {
  
  // Create article with moderation
  async createArticle(userId, articleData) {
    try {
      const article = new Article({
        userId,
        ...articleData,
        moderation: {
          status: 'PENDING',
          violations: [],
          riskScore: 0,
          requiresManualReview: false
        }
      });

      // Run content moderation
      const moderationResult = await ContentModerationService.analyzeArticleContent({
        title: article.title,
        content: article.content,
        userId
      });

      article.moderation = {
        status: moderationResult.isViolation ? 'UNDER_REVIEW' : 'APPROVED',
        violations: moderationResult.violations,
        riskScore: moderationResult.riskScore,
        requiresManualReview: moderationResult.requiresManualReview
      };

      // If critical violations, flag for review
      if (moderationResult.maxSeverity >= 4) {
        article.moderation.status = 'FLAGGED';
        article.moderation.requiresManualReview = true;
      }

      // Calculate SEO score
      article.calculateSeoScore();

      await article.save();

      return {
        success: true,
        article,
        moderation: article.moderation
      };
    } catch (error) {
      console.error('Article creation error:', error);
      throw error;
    }
  }

  // Update article status
  async updateArticleStatus(articleId, userId, newStatus) {
    try {
      const article = await Article.findById(articleId);

      if (!article) {
        throw new Error('Article not found');
      }

      if (article.userId.toString() !== userId) {
        throw new Error('Unauthorized');
      }

      const validStatuses = ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      // Create revision before status change
      article.createRevision(userId, `Status changed from ${article.status} to ${newStatus}`);

      const oldStatus = article.status;
      article.status = newStatus;

      // If publishing, set published date
      if (newStatus === 'PUBLISHED' && !article.publishing.publishedAt) {
        article.publishing.publishedAt = new Date();
      }

      await article.save();

      return {
        success: true,
        article,
        statusChange: {
          from: oldStatus,
          to: newStatus,
          timestamp: new Date()
        }
      };
    } catch (error) {
      console.error('Article status update error:', error);
      throw error;
    }
  }

  // Review and approve article
  async reviewArticle(articleId, reviewerId, action, notes = '') {
    try {
      const article = await Article.findById(articleId);

      if (!article) {
        throw new Error('Article not found');
      }

      if (action === 'approve') {
        article.approve(reviewerId, notes);
        article.moderation.status = 'APPROVED';
      } else if (action === 'reject') {
        article.reject(reviewerId, 'Content policy violation', notes);
        article.moderation.status = 'REJECTED';
      } else if (action === 'flag') {
        article.flag('Manual review requested', notes);
      } else {
        throw new Error('Invalid action');
      }

      await article.save();

      return {
        success: true,
        article,
        review: {
          action,
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
          notes
        }
      };
    } catch (error) {
      console.error('Article review error:', error);
      throw error;
    }
  }

  // Update SEO settings
  async updateSeoSettings(articleId, userId, seoData) {
    try {
      const article = await Article.findById(articleId);

      if (!article) {
        throw new Error('Article not found');
      }

      if (article.userId.toString() !== userId) {
        throw new Error('Unauthorized');
      }

      article.seo = {
        ...article.seo,
        ...seoData,
        lastSeoAnalysis: new Date()
      };

      // Recalculate SEO score
      article.calculateSeoScore();

      await article.save();

      return {
        success: true,
        article,
        seoScore: article.seo.seoScore
      };
    } catch (error) {
      console.error('SEO update error:', error);
      throw error;
    }
  }

  // Sync article to WordPress
  async syncToWordPress(articleId, userId, wordpressData) {
    try {
      const article = await Article.findById(articleId);

      if (!article) {
        throw new Error('Article not found');
      }

      if (article.userId.toString() !== userId) {
        throw new Error('Unauthorized');
      }

      // Simulate WordPress sync
      article.wordpress = {
        postId: wordpressData.postId || Math.floor(Math.random() * 100000),
        url: wordpressData.url || `https://example.com/posts/${article.slug}`,
        status: wordpressData.status || 'publish',
        lastSyncedAt: new Date(),
        autoPublish: wordpressData.autoPublish || false,
        syncStatus: 'SYNCED',
        publishedAt: new Date(),
        categories: wordpressData.categories || [],
        tags: wordpressData.tags || article.tags
      };

      article.publishing.distributionStatus.wordpress = 'PUBLISHED';

      await article.save();

      return {
        success: true,
        article,
        wordpress: article.wordpress
      };
    } catch (error) {
      console.error('WordPress sync error:', error);
      throw error;
    }
  }

  // Get article analytics
  async getArticleAnalytics(articleId, userId) {
    try {
      const article = await Article.findById(articleId);

      if (!article) {
        throw new Error('Article not found');
      }

      if (article.userId.toString() !== userId) {
        throw new Error('Unauthorized');
      }

      const metrics = article.getPerformanceMetrics();

      return {
        success: true,
        article: {
          id: article._id,
          title: article.title,
          status: article.status,
          createdAt: article.createdAt,
          publishedAt: article.publishing.publishedAt
        },
        analytics: {
          performance: metrics,
          seo: {
            score: article.seo?.seoScore || 0,
            focusKeyword: article.seo?.focusKeyword,
            metaDescription: article.seo?.metaDescription,
            recommendations: article.seo?.seoRecommendations || []
          },
          quality: {
            overallScore: article.quality?.overallQualityScore || 0,
            readability: article.quality?.readabilityScore || 0,
            originality: article.quality?.originalityScore || 0,
            engagement: article.quality?.engagementScore || 0,
            issues: article.quality?.qualityIssues || []
          },
          wordpress: article.wordpress?.syncStatus === 'SYNCED' ? {
            synced: true,
            postId: article.wordpress.postId,
            url: article.wordpress.url,
            status: article.wordpress.status,
            lastSyncedAt: article.wordpress.lastSyncedAt
          } : {
            synced: false
          }
        }
      };
    } catch (error) {
      console.error('Analytics retrieval error:', error);
      throw error;
    }
  }

  // Update article analytics
  async updateArticleAnalytics(articleId, analyticsData) {
    try {
      const article = await Article.findById(articleId);

      if (!article) {
        throw new Error('Article not found');
      }

      article.analytics = {
        ...article.analytics,
        ...analyticsData,
        lastAnalyticsUpdate: new Date()
      };

      // Recalculate engagement score
      article.calculateEngagementScore();

      await article.save();

      return {
        success: true,
        analytics: article.analytics
      };
    } catch (error) {
      console.error('Analytics update error:', error);
      throw error;
    }
  }

  // Get articles pending review
  async getArticlesPendingReview(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const articles = await Article.find({
        $or: [
          { 'moderation.status': 'PENDING' },
          { 'moderation.status': 'UNDER_REVIEW' },
          { 'moderation.status': 'FLAGGED' }
        ]
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Article.countDocuments({
        $or: [
          { 'moderation.status': 'PENDING' },
          { 'moderation.status': 'UNDER_REVIEW' },
          { 'moderation.status': 'FLAGGED' }
        ]
      });

      return {
        success: true,
        articles: articles.map(a => ({
          id: a._id,
          title: a.title,
          author: a.userId,
          status: a.moderation.status,
          riskScore: a.moderation.riskScore,
          violations: a.moderation.violations,
          createdAt: a.createdAt
        })),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Pending review retrieval error:', error);
      throw error;
    }
  }

  // Bulk update article status
  async bulkUpdateStatus(articleIds, newStatus, userId) {
    try {
      const validStatuses = ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const result = await Article.updateMany(
        { _id: { $in: articleIds } },
        {
          status: newStatus,
          'publishing.publishedAt': newStatus === 'PUBLISHED' ? new Date() : null,
          updatedAt: new Date()
        }
      );

      return {
        success: true,
        modifiedCount: result.modifiedCount,
        message: `${result.modifiedCount} articles updated to ${newStatus}`
      };
    } catch (error) {
      console.error('Bulk update error:', error);
      throw error;
    }
  }

  // Get article revisions
  async getArticleRevisions(articleId, userId) {
    try {
      const article = await Article.findById(articleId);

      if (!article) {
        throw new Error('Article not found');
      }

      if (article.userId.toString() !== userId) {
        throw new Error('Unauthorized');
      }

      return {
        success: true,
        revisions: article.revisions || [],
        totalRevisions: (article.revisions || []).length
      };
    } catch (error) {
      console.error('Revisions retrieval error:', error);
      throw error;
    }
  }

  // Restore article from revision
  async restoreFromRevision(articleId, userId, revisionVersion) {
    try {
      const article = await Article.findById(articleId);

      if (!article) {
        throw new Error('Article not found');
      }

      if (article.userId.toString() !== userId) {
        throw new Error('Unauthorized');
      }

      const revision = (article.revisions || []).find(r => r.version === revisionVersion);

      if (!revision) {
        throw new Error('Revision not found');
      }

      // Create revision before restore
      article.createRevision(userId, `Restored from version ${revisionVersion}`);

      article.title = revision.title;
      article.content = revision.content;

      await article.save();

      return {
        success: true,
        article,
        message: `Article restored to version ${revisionVersion}`
      };
    } catch (error) {
      console.error('Restore error:', error);
      throw error;
    }
  }

  // Get article quality report
  async getQualityReport(articleId, userId) {
    try {
      const article = await Article.findById(articleId);

      if (!article) {
        throw new Error('Article not found');
      }

      if (article.userId.toString() !== userId) {
        throw new Error('Unauthorized');
      }

      article.calculateQualityScore();

      return {
        success: true,
        qualityReport: {
          overallScore: article.quality.overallQualityScore,
          readability: {
            score: article.quality.readabilityScore,
            status: article.quality.readabilityScore >= 60 ? 'Good' : 'Needs Improvement'
          },
          originality: {
            score: article.quality.originalityScore,
            plagiarismScore: article.quality.plagiarismScore
          },
          engagement: {
            score: article.quality.engagementScore,
            metrics: {
              likes: article.analytics.likes,
              shares: article.analytics.shares,
              comments: article.analytics.comments
            }
          },
          grammar: {
            errors: article.quality.grammarErrors,
            spellErrors: article.quality.spellErrors
          },
          issues: article.quality.qualityIssues || [],
          recommendations: [
            article.quality.readabilityScore < 60 ? 'Improve readability by using shorter sentences' : null,
            article.quality.grammarErrors > 0 ? 'Fix grammar errors' : null,
            article.wordCount < 300 ? 'Expand content to at least 300 words' : null,
            article.seo?.seoScore < 60 ? 'Improve SEO optimization' : null
          ].filter(Boolean)
        }
      };
    } catch (error) {
      console.error('Quality report error:', error);
      throw error;
    }
  }
}

export default new ArticleManagementService();
