import express from 'express';
import Article from '../models/Article.js';
import verifyToken from '../middleware/auth.js';
import ArticleManagementService from '../services/ArticleManagementService.js';
import ContentModerationService from '../services/ContentModerationService.js';
import WordPressSyncService from '../services/WordPressSyncService.js';

const router = express.Router();

// Create article with moderation
router.post('/', verifyToken, async (req, res) => {
  try {
    const result = await ArticleManagementService.createArticle(req.userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all articles for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, campaignId } = req.query;
    const skip = (page - 1) * limit;

    const filter = { userId: req.userId };
    if (status) filter.status = status;
    if (campaignId) filter.campaignId = campaignId;

    const articles = await Article.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Article.countDocuments(filter);

    res.json({
      articles,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get article by ID
router.get('/:articleId', verifyToken, async (req, res) => {
  try {
    const article = await Article.findById(req.params.articleId);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update article
router.put('/:articleId', verifyToken, async (req, res) => {
  try {
    const article = await Article.findById(req.params.articleId);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Create revision before update
    article.createRevision(req.userId, 'Article updated');

    Object.assign(article, req.body);
    article.updatedAt = new Date();

    // Recalculate scores
    article.calculateSeoScore();
    article.calculateQualityScore();

    await article.save();

    res.json(article);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update article status
router.patch('/:articleId/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const result = await ArticleManagementService.updateArticleStatus(
      req.params.articleId,
      req.userId,
      status
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Review article (approve/reject/flag)
router.post('/:articleId/review', verifyToken, async (req, res) => {
  try {
    const { action, notes } = req.body;

    // Check if user is admin (for now, allow all users to review their own articles)
    const result = await ArticleManagementService.reviewArticle(
      req.params.articleId,
      req.userId,
      action,
      notes
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update SEO settings
router.patch('/:articleId/seo', verifyToken, async (req, res) => {
  try {
    const result = await ArticleManagementService.updateSeoSettings(
      req.params.articleId,
      req.userId,
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get SEO recommendations
router.get('/:articleId/seo-recommendations', verifyToken, async (req, res) => {
  try {
    const article = await Article.findById(req.params.articleId);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const recommendations = [];

    // Check focus keyword
    if (!article.seo?.focusKeyword) {
      recommendations.push('Set a focus keyword for better SEO');
    }

    // Check meta description
    if (!article.seo?.metaDescription) {
      recommendations.push('Add a meta description (120-160 characters)');
    } else if (article.seo.metaDescription.length < 120 || article.seo.metaDescription.length > 160) {
      recommendations.push(`Meta description should be 120-160 characters (currently ${article.seo.metaDescription.length})`);
    }

    // Check headings
    if (article.seo?.headingStructure?.h1 !== 1) {
      recommendations.push('Article should have exactly one H1 heading');
    }

    // Check content length
    if (article.wordCount < 300) {
      recommendations.push('Expand content to at least 300 words for better SEO');
    }

    // Check internal links
    if (!article.seo?.internalLinks || article.seo.internalLinks.length === 0) {
      recommendations.push('Add internal links to improve SEO');
    }

    // Check external links
    if (!article.seo?.externalLinks || article.seo.externalLinks.length === 0) {
      recommendations.push('Add external links to authoritative sources');
    }

    // Check image alt texts
    if (!article.seo?.imageAltTexts || article.seo.imageAltTexts.length === 0) {
      recommendations.push('Add alt text to images for better accessibility and SEO');
    }

    res.json({
      seoScore: article.seo?.seoScore || 0,
      recommendations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync to WordPress
router.post('/:articleId/wordpress/sync', verifyToken, async (req, res) => {
  try {
    const result = await ArticleManagementService.syncToWordPress(
      req.params.articleId,
      req.userId,
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get article analytics
router.get('/:articleId/analytics', verifyToken, async (req, res) => {
  try {
    const result = await ArticleManagementService.getArticleAnalytics(
      req.params.articleId,
      req.userId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update article analytics
router.patch('/:articleId/analytics', verifyToken, async (req, res) => {
  try {
    const result = await ArticleManagementService.updateArticleAnalytics(
      req.params.articleId,
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get articles pending review (admin)
router.get('/admin/pending-review', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await ArticleManagementService.getArticlesPendingReview(
      req.userId,
      parseInt(page),
      parseInt(limit)
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk update article status
router.post('/bulk/update-status', verifyToken, async (req, res) => {
  try {
    const { articleIds, status } = req.body;
    const result = await ArticleManagementService.bulkUpdateStatus(
      articleIds,
      status,
      req.userId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get article revisions
router.get('/:articleId/revisions', verifyToken, async (req, res) => {
  try {
    const result = await ArticleManagementService.getArticleRevisions(
      req.params.articleId,
      req.userId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Restore article from revision
router.post('/:articleId/revisions/:version/restore', verifyToken, async (req, res) => {
  try {
    const result = await ArticleManagementService.restoreFromRevision(
      req.params.articleId,
      req.userId,
      parseInt(req.params.version)
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get quality report
router.get('/:articleId/quality-report', verifyToken, async (req, res) => {
  try {
    const result = await ArticleManagementService.getQualityReport(
      req.params.articleId,
      req.userId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete article
router.delete('/:articleId', verifyToken, async (req, res) => {
  try {
    const article = await Article.findById(req.params.articleId);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await Article.deleteOne({ _id: req.params.articleId });

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WordPress Sync Routes

// Sync article to WordPress
router.post('/:articleId/wordpress/sync', verifyToken, async (req, res) => {
  try {
    const result = await WordPressSyncService.syncArticleToWordPress(
      req.params.articleId,
      req.userId,
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Publish article to WordPress
router.post('/:articleId/wordpress/publish', verifyToken, async (req, res) => {
  try {
    const result = await WordPressSyncService.publishToWordPress(
      req.params.articleId,
      req.userId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get WordPress sync status
router.get('/:articleId/wordpress/status', verifyToken, async (req, res) => {
  try {
    const result = await WordPressSyncService.getWordPressSyncStatus(
      req.params.articleId,
      req.userId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Resync from WordPress
router.post('/:articleId/wordpress/resync', verifyToken, async (req, res) => {
  try {
    const result = await WordPressSyncService.resyncFromWordPress(
      req.params.articleId,
      req.userId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Disconnect from WordPress
router.post('/:articleId/wordpress/disconnect', verifyToken, async (req, res) => {
  try {
    const result = await WordPressSyncService.disconnectFromWordPress(
      req.params.articleId,
      req.userId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Bulk sync to WordPress
router.post('/wordpress/bulk-sync', verifyToken, async (req, res) => {
  try {
    const { articleIds, config } = req.body;
    const result = await WordPressSyncService.bulkSyncToWordPress(
      articleIds,
      req.userId,
      config
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get WordPress configuration
router.get('/wordpress/config', verifyToken, async (req, res) => {
  try {
    const result = await WordPressSyncService.getWordPressConfig(req.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
