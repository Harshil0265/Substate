import express from 'express';
import Article from '../models/Article.js';
import Campaign from '../models/Campaign.js';
import User from '../models/User.js';
import auth from '../middleware/auth.js';
import AuthenticContentServicePro from '../services/AuthenticContentServicePro.js';
import UsageService from '../services/UsageService.js';
import ContentModerationService from '../services/ContentModerationService.js';
import ImageService from '../services/ImageService.js';

const router = express.Router();

// Lazy-load service to ensure environment variables are loaded
let authenticContentService = null;

const getAuthenticContentService = () => {
  if (!authenticContentService) {
    authenticContentService = new AuthenticContentServicePro();
  }
  return authenticContentService;
};

// Generate authentic article with real data
router.post('/generate-authentic', auth, async (req, res) => {
  try {
    const { title, campaignId, contentType = 'BLOG', requirements = {} } = req.body;
    const userId = req.userId; // Fixed: use req.userId instead of req.user.id

    console.log('🚀 Starting authentic article generation:', { title, userId, contentType });

    // Validate input
    if (!title || title.trim().length < 5) {
      return res.status(400).json({
        success: false,
        message: 'Title must be at least 5 characters long'
      });
    }

    // Check usage limits
    const canCreate = await UsageService.canCreateArticle(userId);
    if (!canCreate.allowed) {
      return res.status(403).json({
        success: false,
        message: canCreate.reason,
        upgradeRequired: true
      });
    }

    // Validate campaign if provided
    let campaign = null;
    if (campaignId) {
      campaign = await Campaign.findOne({ _id: campaignId, userId });
      if (!campaign) {
        return res.status(404).json({
          success: false,
          message: 'Campaign not found'
        });
      }
    }

    // Generate authentic content - MINIMUM 1500+ words
    console.log('🔍 Generating authentic content with minimum 1500+ words...');
    const contentResult = await getAuthenticContentService().generateAuthenticContent(title, {
      contentType,
      targetLength: requirements.targetLength || 3000, // Increased to ensure 1500+ minimum
      minLength: 1500, // Enforce minimum word count
      includeStatistics: true,
      includeCitations: true,
      includeImages: true, // Enable image placeholders
      researchDepth: requirements.researchDepth || 'comprehensive',
      ...requirements
    });

    // Process images - replace placeholders with real images
    console.log('🖼️ Processing images in content...');
    const imageResult = await ImageService.replaceImagePlaceholders(
      contentResult.content,
      title
    );
    
    console.log(`✅ Images processed: ${imageResult.imagesReplaced} images added`);
    
    // Use content with images
    const finalContent = imageResult.content;

    // Moderate content
    console.log('🛡️ Moderating content...');
    const moderationResult = await ContentModerationService.analyzeArticleContent({
      title: title.trim(),
      content: finalContent,
      userId: userId
    });

    // Generate SEO data
    const seoData = generateSEOData(title, finalContent);

    // Create article
    const articleData = {
      userId,
      campaignId: campaign?._id,
      title: title.trim(),
      slug: generateSlug(title),
      content: finalContent,
      excerpt: generateExcerpt(finalContent),
      contentType,
      aiGenerated: true,
      wordCount: countWords(finalContent),
      readTime: calculateReadTime(finalContent),
      status: moderationResult.isViolation ? 'REVIEW' : 'DRAFT',
      moderation: {
        status: moderationResult.isViolation ? 'FLAGGED' : 'APPROVED',
        riskScore: moderationResult.riskScore,
        violations: moderationResult.violations,
        checkedAt: new Date(),
        notes: moderationResult.notes
      },
      seo: seoData,
      metadata: {
        ...contentResult.metadata,
        generationMethod: 'authentic_research',
        researchSources: contentResult.metadata.sourcesUsed,
        dataPoints: contentResult.metadata.dataPoints,
        authenticity: contentResult.metadata.authenticity,
        imagesAdded: imageResult.imagesReplaced
      }
    };

    const article = new Article(articleData);
    await article.save();

    // Update campaign if provided
    if (campaign) {
      campaign.articlesGenerated = (campaign.articlesGenerated || 0) + 1;
      await campaign.save();
    }

    // Update user usage
    await UsageService.recordArticleCreation(userId);

    console.log('✅ Authentic article generated successfully:', {
      articleId: article._id,
      wordCount: article.wordCount,
      sourcesUsed: contentResult.metadata.sourcesUsed,
      dataPoints: contentResult.metadata.dataPoints,
      researchDepth: contentResult.metadata.researchDepth.overall
    });

    res.status(201).json({
      success: true,
      message: 'Authentic article generated successfully',
      article: {
        id: article._id,
        title: article.title,
        slug: article.slug,
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
    console.error('❌ Error generating authentic article:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate authentic article',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get article with research sources
router.get('/:id/research-data', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId; // Fixed: use req.userId instead of req.user.id

    const article = await Article.findOne({ _id: id, userId });
    if (!article) {
      return res.status(404).json({
        success: false,
        message: 'Article not found'
      });
    }

    // Get research data if available
    const researchData = article.metadata?.researchSources || [];
    const dataPoints = article.metadata?.dataPoints || 0;
    const authenticity = article.metadata?.authenticity || 'unknown';

    res.json({
      success: true,
      research: {
        sourcesUsed: researchData,
        dataPoints,
        authenticity,
        researchDepth: article.metadata?.researchDepth || {},
        lastUpdated: article.metadata?.lastUpdated || article.createdAt
      }
    });

  } catch (error) {
    console.error('Error fetching research data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch research data'
    });
  }
});

// Regenerate article with fresh research
router.post('/:id/regenerate-research', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId; // Fixed: use req.userId instead of req.user.id
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
      wordCount: contentResult.metadata.wordCount,
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
      isViolation: moderationResult.isViolation,
      riskScore: moderationResult.riskScore,
      requiresManualReview: moderationResult.requiresManualReview
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
      regeneratedAt: new Date(),
      researchSources: contentResult.metadata.sourcesUsed,
      dataPoints: contentResult.metadata.dataPoints,
      imagesAdded: imageResult.imagesReplaced
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
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to regenerate article with fresh research',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Validate content authenticity
router.post('/validate-authenticity', auth, async (req, res) => {
  try {
    const { content, title } = req.body;

    if (!content || !title) {
      return res.status(400).json({
        success: false,
        message: 'Content and title are required'
      });
    }

    // Analyze content for authenticity markers
    const analysis = analyzeContentAuthenticity(content);
    
    // Check for real data and statistics
    const dataAnalysis = analyzeDataContent(content);
    
    // Generate authenticity score
    const authenticityScore = calculateAuthenticityScore(analysis, dataAnalysis);

    res.json({
      success: true,
      authenticity: {
        score: authenticityScore,
        analysis: analysis,
        dataAnalysis: dataAnalysis,
        recommendations: generateAuthenticityRecommendations(analysis, dataAnalysis)
      }
    });

  } catch (error) {
    console.error('Error validating authenticity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate content authenticity'
    });
  }
});

// Helper functions
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

function generateSEOData(title, content) {
  const plainText = content.replace(/<[^>]*>/g, '').replace(/[#*]/g, '');
  
  // Extract keywords from content
  const words = plainText.toLowerCase().split(/\s+/);
  const wordFreq = {};
  words.forEach(word => {
    if (word.length > 3 && !isStopWord(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });
  
  const keywords = Object.entries(wordFreq)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);

  return {
    metaTitle: title,
    metaDescription: generateExcerpt(content, 160),
    keywords: keywords,
    focusKeyword: keywords[0] || '',
    seoScore: calculateSEOScore(title, content, keywords)
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
  if (wordCount >= 1500) score += 20;
  else if (wordCount >= 1000) score += 15;
  else if (wordCount >= 500) score += 10;
  
  // Keyword usage
  if (keywords.length >= 5) score += 20;
  else if (keywords.length >= 3) score += 15;
  
  // Headers (check for ## patterns)
  const headerCount = (content.match(/##\s/g) || []).length;
  if (headerCount >= 3) score += 20;
  else if (headerCount >= 1) score += 10;
  
  // Links and citations (check for http patterns)
  const linkCount = (content.match(/https?:\/\/[^\s)]+/g) || []).length;
  if (linkCount >= 3) score += 20;
  else if (linkCount >= 1) score += 10;
  
  return Math.min(100, score);
}

function analyzeContentAuthenticity(content) {
  const analysis = {
    hasRealData: false,
    hasStatistics: false,
    hasCitations: false,
    hasSpecificNumbers: false,
    hasGenericLanguage: false,
    hasPersonalLanguage: false
  };

  // Check for real data indicators
  const dataPatterns = [
    /\d+(?:\.\d+)?\s*%/g, // Percentages
    /\$\d+(?:,\d{3})*(?:\.\d{2})?/g, // Money amounts
    /\d{4}/g, // Years
    /\d+(?:,\d{3})+/g, // Large numbers with commas
  ];

  dataPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      analysis.hasRealData = true;
      analysis.hasStatistics = true;
      analysis.hasSpecificNumbers = true;
    }
  });

  // Check for citations
  if (/https?:\/\/[^\s)]+/g.test(content) || /\[\d+\]/.test(content)) {
    analysis.hasCitations = true;
  }

  // Check for generic language
  const genericPhrases = [
    'years of experience',
    'proven strategies',
    'best practices',
    'industry leader',
    'cutting-edge',
    'state-of-the-art',
    'world-class',
    'innovative solutions'
  ];

  genericPhrases.forEach(phrase => {
    if (content.toLowerCase().includes(phrase)) {
      analysis.hasGenericLanguage = true;
    }
  });

  // Check for personal language
  const personalPatterns = [
    /\bi\s+/gi,
    /\bmy\s+/gi,
    /\bwe\s+/gi,
    /\bour\s+/gi,
    /\byou\s+should\b/gi,
    /\byou\s+can\b/gi
  ];

  personalPatterns.forEach(pattern => {
    if (pattern.test(content)) {
      analysis.hasPersonalLanguage = true;
    }
  });

  return analysis;
}

function analyzeDataContent(content) {
  const analysis = {
    statisticsCount: 0,
    citationsCount: 0,
    numbersCount: 0,
    dateReferences: 0,
    sourceTypes: []
  };

  // Count statistics
  const statPatterns = [
    /\d+(?:\.\d+)?\s*%/g,
    /\$\d+(?:,\d{3})*(?:\.\d{2})?/g,
    /\d+(?:,\d{3})+/g
  ];

  statPatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    analysis.statisticsCount += matches.length;
    analysis.numbersCount += matches.length;
  });

  // Count citations
  const citations = content.match(/https?:\/\/[^\s)]+/g) || [];
  analysis.citationsCount = citations.length;

  // Identify source types
  citations.forEach(url => {
    if (url.includes('.gov')) analysis.sourceTypes.push('government');
    else if (url.includes('.edu')) analysis.sourceTypes.push('academic');
    else if (url.includes('reuters') || url.includes('bloomberg')) analysis.sourceTypes.push('news');
    else analysis.sourceTypes.push('other');
  });

  // Count date references
  const dateMatches = content.match(/\d{4}/g) || [];
  analysis.dateReferences = dateMatches.length;

  return analysis;
}

function calculateAuthenticityScore(analysis, dataAnalysis) {
  let score = 0;

  // Positive factors
  if (analysis.hasRealData) score += 25;
  if (analysis.hasStatistics) score += 20;
  if (analysis.hasCitations) score += 20;
  if (analysis.hasSpecificNumbers) score += 15;
  if (dataAnalysis.statisticsCount >= 5) score += 10;
  if (dataAnalysis.citationsCount >= 3) score += 10;

  // Negative factors
  if (analysis.hasGenericLanguage) score -= 20;
  if (analysis.hasPersonalLanguage) score -= 15;

  return Math.max(0, Math.min(100, score));
}

function generateAuthenticityRecommendations(analysis, dataAnalysis) {
  const recommendations = [];

  if (!analysis.hasRealData) {
    recommendations.push('Add specific statistics and numerical data from reliable sources');
  }

  if (!analysis.hasCitations) {
    recommendations.push('Include citations to government, academic, or industry sources');
  }

  if (analysis.hasGenericLanguage) {
    recommendations.push('Remove generic phrases like "years of experience" and "proven strategies"');
  }

  if (analysis.hasPersonalLanguage) {
    recommendations.push('Eliminate personal pronouns and subjective language');
  }

  if (dataAnalysis.statisticsCount < 5) {
    recommendations.push('Include more specific statistics and measurable data points');
  }

  if (dataAnalysis.citationsCount < 3) {
    recommendations.push('Add more authoritative sources and references');
  }

  return recommendations;
}

export default router;