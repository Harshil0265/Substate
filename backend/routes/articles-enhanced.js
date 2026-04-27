import express from 'express';
import Article from '../models/Article.js';
import verifyToken from '../middleware/auth.js';
import ArticleManagementService from '../services/ArticleManagementService.js';
import ContentModerationService from '../services/ContentModerationService.js';
import WordPressSyncService from '../services/WordPressSyncService.js';
import ImageService from '../services/ImageService.js';
import AuthenticContentServicePro from '../services/AuthenticContentServicePro.js';
import UsageService from '../services/UsageService.js';

const router = express.Router();

// Lazy-load service to ensure environment variables are loaded
let authenticContentService = null;

const getAuthenticContentService = () => {
  if (!authenticContentService) {
    authenticContentService = new AuthenticContentServicePro();
  }
  return authenticContentService;
};

// Generate authentic content with real data and research
router.post('/generate-content', verifyToken, async (req, res) => {
  try {
    const { title, category, keywords, campaignId } = req.body;
    const userId = req.userId; // Fixed: use req.userId instead of req.user.id

    console.log('🚀 Generating authentic content:', { title, userId, category });

    if (!title || title.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Title must be at least 5 characters long'
      });
    }

    // Check usage limits
    const canCreate = await UsageService.canCreateArticle(userId);
    if (!canCreate.allowed) {
      return res.status(403).json({
        success: false,
        error: canCreate.reason,
        upgradeRequired: true
      });
    }

    // Generate authentic content with real research - MINIMUM 1500+ words
    console.log('🔍 Conducting research and generating comprehensive content (minimum 1500+ words)...');
    const contentResult = await getAuthenticContentService().generateAuthenticContent(title, {
      contentType: 'BLOG',
      targetLength: 3000, // Increased to ensure 1500+ minimum
      minLength: 1500, // Enforce minimum word count
      includeStatistics: true,
      includeCitations: true,
      includeImages: true, // Enable image placeholders
      researchDepth: 'comprehensive',
      keywords: keywords
    });

    // Process images - replace placeholders with real images
    console.log('🖼️ Processing images in content...');
    const imageResult = await ImageService.replaceImagePlaceholders(
      contentResult.content,
      title
    );
    console.log(`✅ Images processed: ${imageResult.imagesReplaced} images added`);
    
    const finalContent = imageResult.content;

    // Moderate content
    console.log('🛡️ Moderating content...');
    const moderationResult = await ContentModerationService.analyzeArticleContent({
      title: title.trim(),
      content: finalContent,
      userId: userId
    });

    // Generate SEO data
    const seoData = generateSEOData(title, finalContent, keywords);

    // Create article
    const articleData = {
      userId,
      campaignId: campaignId || null,
      title: title.trim(),
      slug: generateSlug(title),
      content: finalContent,
      excerpt: generateExcerpt(finalContent),
      contentType: 'BLOG',
      aiGenerated: true,
      wordCount: countWords(finalContent),
      readTime: calculateReadTime(finalContent),
      status: moderationResult.isViolation ? 'REVIEW' : 'DRAFT',
      moderation: {
        status: moderationResult.isViolation ? 'FLAGGED' : 'APPROVED',
        riskScore: moderationResult.riskScore,
        violations: moderationResult.violations,
        checkedAt: new Date(),
        requiresManualReview: moderationResult.requiresManualReview,
        recommendedAction: moderationResult.recommendedAction
      },
      seo: seoData,
      metadata: {
        ...contentResult.metadata,
        generationMethod: 'authentic_research',
        researchSources: contentResult.metadata.sourcesUsed,
        dataPoints: contentResult.metadata.dataPoints,
        authenticity: contentResult.metadata.authenticity,
        imagesAdded: imageResult.imagesReplaced,
        category: category,
        keywords: keywords
      }
    };

    const article = new Article(articleData);
    await article.save();

    console.log('✅ Authentic article generated successfully:', {
      articleId: article._id,
      wordCount: article.wordCount,
      sourcesUsed: contentResult.metadata.sourcesUsed,
      dataPoints: contentResult.metadata.dataPoints,
      authenticity: contentResult.metadata.authenticity
    });

    res.status(201).json({
      success: true,
      message: 'Authentic article generated with real data and verified sources',
      article: {
        id: article._id,
        title: article.title,
        slug: article.slug,
        content: article.content,
        excerpt: article.excerpt,
        wordCount: article.wordCount,
        readTime: article.readTime,
        status: article.status,
        contentType: article.contentType,
        moderation: article.moderation,
        seo: article.seo,
        metadata: article.metadata,
        createdAt: article.createdAt
      },
      researchQuality: {
        sourcesUsed: contentResult.metadata.sourcesUsed,
        dataPoints: contentResult.metadata.dataPoints,
        authenticity: contentResult.metadata.authenticity,
        researchDepth: contentResult.metadata.researchDepth
      }
    });

  } catch (error) {
    console.error('❌ Error generating authentic content:', error);
    
    let userMessage = 'Failed to generate authentic content';
    let statusCode = 500;
    
    // Handle specific error types
    if (error.message && error.message.includes('GROQ_API_KEY')) {
      userMessage = 'AI service is not configured. Please contact the administrator to set up the GROQ API key.';
      statusCode = 503;
    } else if (error.status === 401 || error.message.includes('Invalid API Key')) {
      userMessage = 'AI service authentication failed. Please contact the administrator to update the API key.';
      statusCode = 503;
    } else if (error.status === 429 || error.message.includes('rate limit')) {
      userMessage = 'AI service rate limit reached. Please try again in a few minutes.';
      statusCode = 429;
    } else if (error.message.includes('timeout') || error.code === 'ETIMEDOUT') {
      userMessage = 'AI service request timed out. Please try again.';
      statusCode = 504;
    }
    
    res.status(statusCode).json({
      success: false,
      error: userMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Regenerate article with fresh research
router.post('/:id/regenerate-research', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { requirements = {} } = req.body;

    console.log('🔄 Regenerate request received:', { articleId: id, userId, requirements });

    const article = await Article.findOne({ _id: id, userId });
    if (!article) {
      console.log('❌ Article not found:', { articleId: id, userId });
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    console.log('✅ Article found:', { articleId: id, title: article.title });
    console.log('🔄 Regenerating article with fresh research:', { articleId: id, title: article.title });

    // Generate new authentic content
    console.log('🔍 Starting content generation...');
    const contentResult = await getAuthenticContentService().generateAuthenticContent(article.title, {
      contentType: article.contentType,
      targetLength: requirements.targetLength || article.wordCount,
      includeStatistics: true,
      includeCitations: true,
      includeImages: true, // Enable image placeholders
      researchDepth: requirements.researchDepth || 'comprehensive',
      ...requirements
    });
    console.log('✅ Content generation completed:', {
      contentLength: contentResult.content.length,
      sourcesUsed: contentResult.metadata.sourcesUsed
    });

    // Process images - replace placeholders with real images
    console.log('🖼️ Processing images in regenerated content...');
    const imageResult = await ImageService.replaceImagePlaceholders(
      contentResult.content,
      article.title
    );
    console.log(`✅ Images processed: ${imageResult.imagesReplaced} images added`);
    
    const finalContent = imageResult.content;

    // Moderate new content
    console.log('🛡️ Starting content moderation...');
    const moderationResult = await ContentModerationService.analyzeArticleContent({
      title: article.title,
      content: finalContent,
      userId: userId
    });
    console.log('✅ Content moderation completed:', {
      approved: moderationResult.approved,
      riskScore: moderationResult.riskScore
    });

    // Update article
    article.content = finalContent;
    article.excerpt = generateExcerpt(finalContent);
    article.wordCount = countWords(finalContent);
    article.readTime = calculateReadTime(finalContent);
    article.moderation = {
      status: moderationResult.isViolation ? 'FLAGGED' : 'APPROVED',
      riskScore: moderationResult.riskScore,
      violations: moderationResult.violations,
      checkedAt: new Date(),
      requiresManualReview: moderationResult.requiresManualReview,
      recommendedAction: moderationResult.recommendedAction
    };
    article.metadata = {
      ...article.metadata,
      ...contentResult.metadata,
      imagesAdded: imageResult.imagesReplaced,
      regeneratedAt: new Date(),
      researchSources: contentResult.metadata.sourcesUsed,
      dataPoints: contentResult.metadata.dataPoints
    };
    article.updatedAt = new Date();

    await article.save();

    console.log('✅ Article regenerated successfully with fresh research');

    res.json({
      success: true,
      message: 'Article regenerated with fresh research data',
      article: {
        id: article._id,
        title: article.title,
        excerpt: article.excerpt,
        wordCount: article.wordCount,
        readTime: article.readTime,
        moderation: article.moderation,
        metadata: article.metadata,
        updatedAt: article.updatedAt
      },
      researchQuality: {
        sourcesUsed: contentResult.metadata.sourcesUsed,
        dataPoints: contentResult.metadata.dataPoints,
        authenticity: contentResult.metadata.authenticity,
        researchDepth: contentResult.metadata.researchDepth
      }
    });

  } catch (error) {
    console.error('❌ Error regenerating article:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate article with fresh research',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create article with moderation
router.post('/', verifyToken, async (req, res) => {
  try {
    const result = await ArticleManagementService.createArticle(req.userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============ TRASH ROUTES (MUST BE BEFORE /:articleId) ============

// Get trash/deleted articles
router.get('/trash/list', verifyToken, async (req, res) => {
  try {
    console.log('📦 Fetching trash for user:', req.userId);
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    console.log('🔍 Query params:', { page, limit, skip });

    const deletedArticles = await Article.find({
      userId: req.userId,
      isDeleted: true
    })
      .sort({ deletedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Article.countDocuments({
      userId: req.userId,
      isDeleted: true
    });

    console.log('✅ Found deleted articles:', deletedArticles.length, 'Total:', total);

    res.json({
      articles: deletedArticles,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching trash:', error);
    res.status(500).json({ error: error.message });
  }
});

// Empty trash (delete all deleted articles)
router.delete('/trash/empty', verifyToken, async (req, res) => {
  try {
    const result = await Article.deleteMany({
      userId: req.userId,
      isDeleted: true
    });

    res.json({ 
      message: 'Trash emptied successfully',
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ END TRASH ROUTES ============

// Get all articles for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, campaignId } = req.query;
    const skip = (page - 1) * limit;

    const filter = { 
      userId: req.userId,
      isDeleted: { $ne: true }  // Exclude deleted articles (handles false, null, undefined)
    };
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

// Delete article (Soft Delete)
router.delete('/:articleId', verifyToken, async (req, res) => {
  try {
    const article = await Article.findById(req.params.articleId);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Soft delete the article
    article.softDelete(req.userId, req.body.reason || 'User deleted');
    await article.save();

    res.json({ message: 'Article moved to trash successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restore article from trash
router.post('/:articleId/restore', verifyToken, async (req, res) => {
  try {
    const article = await Article.findById(req.params.articleId);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!article.isDeleted) {
      return res.status(400).json({ error: 'Article is not in trash' });
    }

    // Restore the article
    article.restore();
    await article.save();

    res.json({ 
      message: 'Article restored successfully',
      article 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Permanently delete article
router.delete('/:articleId/permanent', verifyToken, async (req, res) => {
  try {
    const article = await Article.findById(req.params.articleId);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!article.isDeleted) {
      return res.status(400).json({ error: 'Only deleted articles can be permanently deleted' });
    }

    // Permanently delete
    await Article.deleteOne({ _id: req.params.articleId });

    res.json({ message: 'Article permanently deleted' });
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

// Helper functions for authentic content generation
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
}

function generateExcerpt(content, maxLength = 200) {
  const plainText = content.replace(/<[^>]*>/g, '').replace(/[#*]/g, '');
  return plainText.length > maxLength 
    ? plainText.substring(0, maxLength).trim() + '...'
    : plainText;
}

function countWords(content) {
  const plainText = content.replace(/<[^>]*>/g, '').replace(/[#*]/g, '');
  return plainText.split(/\s+/).filter(word => word.length > 0).length;
}

function calculateReadTime(content) {
  const wordCount = countWords(content);
  const wordsPerMinute = 200;
  return Math.ceil(wordCount / wordsPerMinute);
}

function generateSEOData(title, content, keywords = '') {
  const plainText = content.replace(/<[^>]*>/g, '').replace(/[#*]/g, '');
  
  // Extract keywords from content and provided keywords
  const words = plainText.toLowerCase().split(/\s+/);
  const keywordList = keywords ? keywords.split(',').map(k => k.trim().toLowerCase()) : [];
  
  const wordFreq = {};
  words.forEach(word => {
    if (word.length > 3 && !isStopWord(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  // Combine provided keywords with extracted keywords
  const extractedKeywords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 8)
    .map(([word]) => word);
  
  const allKeywords = [...keywordList, ...extractedKeywords]
    .filter((keyword, index, arr) => arr.indexOf(keyword) === index)
    .slice(0, 10);

  return {
    metaTitle: title,
    metaDescription: generateExcerpt(content, 160),
    keywords: allKeywords,
    focusKeyword: allKeywords[0] || '',
    seoScore: calculateSEOScore(title, content, allKeywords)
  };
}

function isStopWord(word) {
  const stopWords = ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall'];
  return stopWords.includes(word);
}

function calculateSEOScore(title, content, keywords) {
  let score = 0;
  
  // Title length (50-60 chars is optimal)
  if (title.length >= 50 && title.length <= 60) score += 20;
  else if (title.length >= 30 && title.length <= 70) score += 10;
  
  // Content length (1500+ words is good)
  const wordCount = countWords(content);
  if (wordCount >= 2000) score += 25;
  else if (wordCount >= 1500) score += 20;
  else if (wordCount >= 1000) score += 15;
  else if (wordCount >= 500) score += 10;
  
  // Keyword usage
  if (keywords.length >= 5) score += 20;
  else if (keywords.length >= 3) score += 15;
  
  // Headers (check for <h2> patterns)
  const headerCount = (content.match(/<h2>/g) || []).length;
  if (headerCount >= 3) score += 20;
  else if (headerCount >= 1) score += 10;
  
  // Links and citations (check for http patterns)
  const linkCount = (content.match(/https?:\/\/[^\s<>"]+/g) || []).length;
  if (linkCount >= 3) score += 15;
  else if (linkCount >= 1) score += 10;
  
  return Math.min(100, score);
}