import express from 'express';
import WordPressService from '../services/WordPressService.js';
import WordPressIntegration from '../models/WordPressIntegration.js';
import Article from '../models/Article.js';
import Campaign from '../models/Campaign.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

// Get all WordPress integrations for user
router.get('/integrations', verifyToken, async (req, res) => {
  try {
    const integrations = await WordPressIntegration.find({ 
      userId: req.userId 
    }).select('-applicationPassword').sort('-createdAt');

    res.json({ integrations });
  } catch (error) {
    console.error('Error fetching WordPress integrations:', error);
    res.status(500).json({ error: 'Failed to fetch WordPress integrations' });
  }
});

// Get single WordPress integration
router.get('/integrations/:integrationId', verifyToken, async (req, res) => {
  try {
    const integration = await WordPressIntegration.findOne({
      _id: req.params.integrationId,
      userId: req.userId
    }).select('-applicationPassword');

    if (!integration) {
      return res.status(404).json({ error: 'WordPress integration not found' });
    }

    res.json({ integration });
  } catch (error) {
    console.error('Error fetching WordPress integration:', error);
    res.status(500).json({ error: 'Failed to fetch WordPress integration' });
  }
});

// Create new WordPress integration
router.post('/integrations', verifyToken, async (req, res) => {
  try {
    console.log('📝 Creating WordPress integration...');
    console.log('User ID:', req.userId);
    console.log('Request body:', { ...req.body, applicationPassword: '***' });
    
    const { name, siteUrl, username, applicationPassword, settings } = req.body;

    // Validate required fields
    if (!name || !siteUrl || !username || !applicationPassword) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        error: 'Name, site URL, username, and application password are required' 
      });
    }

    // Validate WordPress configuration
    const wpConfig = { siteUrl, username, applicationPassword };
    const validation = WordPressService.validateConfig(wpConfig);
    
    if (!validation.isValid) {
      console.log('❌ Invalid configuration:', validation.errors);
      return res.status(400).json({ 
        error: 'Invalid WordPress configuration',
        details: validation.errors
      });
    }

    console.log('🔍 Testing WordPress connection...');
    // Test connection
    const testResult = await WordPressService.testConnection(wpConfig);
    
    if (!testResult.success) {
      console.log('❌ Connection test failed:', testResult.message);
      return res.status(400).json({ 
        error: 'WordPress connection test failed',
        details: testResult.message
      });
    }

    console.log('✅ Connection test passed');
    console.log('🔍 Checking existing integrations...');
    
    // Check if this is the first integration (make it default)
    const existingCount = await WordPressIntegration.countDocuments({ 
      userId: req.userId 
    });

    console.log('Existing integrations count:', existingCount);

    const integration = new WordPressIntegration({
      userId: req.userId,
      name,
      siteUrl,
      username,
      applicationPassword,
      isDefault: existingCount === 0,
      settings: settings || {},
      lastTestResult: testResult
    });

    await integration.save();

    // Return integration without password
    const responseIntegration = await WordPressIntegration.findById(integration._id)
      .select('-applicationPassword');

    res.status(201).json({ 
      integration: responseIntegration,
      testResult: testResult
    });
  } catch (error) {
    console.error('❌ Error creating WordPress integration:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Failed to create WordPress integration',
      details: error.message 
    });
  }
});

// Update WordPress integration
router.put('/integrations/:integrationId', verifyToken, async (req, res) => {
  try {
    const { name, siteUrl, username, applicationPassword, settings, isActive, isDefault } = req.body;

    const integration = await WordPressIntegration.findOne({
      _id: req.params.integrationId,
      userId: req.userId
    });

    if (!integration) {
      return res.status(404).json({ error: 'WordPress integration not found' });
    }

    // Update fields
    if (name !== undefined) integration.name = name;
    if (siteUrl !== undefined) integration.siteUrl = siteUrl;
    if (username !== undefined) integration.username = username;
    if (applicationPassword !== undefined) integration.applicationPassword = applicationPassword;
    if (settings !== undefined) integration.settings = { ...integration.settings, ...settings };
    if (isActive !== undefined) integration.isActive = isActive;
    if (isDefault !== undefined) integration.isDefault = isDefault;

    // Test connection if credentials changed
    if (siteUrl !== undefined || username !== undefined || applicationPassword !== undefined) {
      const wpConfig = integration.getConfig();
      const testResult = await WordPressService.testConnection(wpConfig);
      await integration.updateTestResult(testResult);
      
      if (!testResult.success) {
        return res.status(400).json({ 
          error: 'WordPress connection test failed after update',
          details: testResult.message
        });
      }
    }

    await integration.save();

    // Return integration without password
    const responseIntegration = await WordPressIntegration.findById(integration._id)
      .select('-applicationPassword');

    res.json({ integration: responseIntegration });
  } catch (error) {
    console.error('Error updating WordPress integration:', error);
    res.status(500).json({ error: 'Failed to update WordPress integration' });
  }
});

// Delete WordPress integration
router.delete('/integrations/:integrationId', verifyToken, async (req, res) => {
  try {
    const integration = await WordPressIntegration.findOneAndDelete({
      _id: req.params.integrationId,
      userId: req.userId
    });

    if (!integration) {
      return res.status(404).json({ error: 'WordPress integration not found' });
    }

    res.json({ message: 'WordPress integration deleted successfully' });
  } catch (error) {
    console.error('Error deleting WordPress integration:', error);
    res.status(500).json({ error: 'Failed to delete WordPress integration' });
  }
});

// Test WordPress connection
router.post('/integrations/:integrationId/test', verifyToken, async (req, res) => {
  try {
    const integration = await WordPressIntegration.findOne({
      _id: req.params.integrationId,
      userId: req.userId
    });

    if (!integration) {
      return res.status(404).json({ error: 'WordPress integration not found' });
    }

    const wpConfig = integration.getConfig();
    const testResult = await WordPressService.testConnection(wpConfig);
    
    // Update test result
    await integration.updateTestResult(testResult);

    res.json(testResult);
  } catch (error) {
    console.error('Error testing WordPress connection:', error);
    res.status(500).json({ error: 'Failed to test WordPress connection' });
  }
});

// Get WordPress categories and tags
router.get('/integrations/:integrationId/metadata', verifyToken, async (req, res) => {
  try {
    const integration = await WordPressIntegration.findOne({
      _id: req.params.integrationId,
      userId: req.userId
    });

    if (!integration) {
      return res.status(404).json({ error: 'WordPress integration not found' });
    }

    const wpConfig = integration.getConfig();
    
    const [categoriesResult, tagsResult] = await Promise.all([
      WordPressService.getCategories(wpConfig),
      WordPressService.getTags(wpConfig)
    ]);

    res.json({
      categories: categoriesResult.categories || [],
      tags: tagsResult.tags || [],
      success: categoriesResult.success && tagsResult.success
    });
  } catch (error) {
    console.error('Error fetching WordPress metadata:', error);
    res.status(500).json({ error: 'Failed to fetch WordPress metadata' });
  }
});

// Post single article to WordPress
router.post('/integrations/:integrationId/post-article/:articleId', verifyToken, async (req, res) => {
  try {
    const { options } = req.body;

    const integration = await WordPressIntegration.findOne({
      _id: req.params.integrationId,
      userId: req.userId
    });

    if (!integration) {
      return res.status(404).json({ error: 'WordPress integration not found' });
    }

    const article = await Article.findOne({
      _id: req.params.articleId,
      userId: req.userId
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const wpConfig = integration.getConfig();
    const postOptions = {
      status: options?.status || integration.settings.defaultStatus || 'draft',
      categories: options?.categories || integration.settings.defaultCategories || [],
      tags: options?.tags || integration.settings.defaultTags || [],
      ...options
    };

    console.log('Publishing article with options:', {
      articleId: article._id,
      title: article.title,
      options: postOptions
    });

    const result = await WordPressService.postArticle(wpConfig, article, postOptions);

    if (result.success) {
      // Get alternative URLs for better reliability
      const alternativeUrls = WordPressService.getAlternativeUrls(
        result.wordpressPost.id, 
        wpConfig.siteUrl, 
        result.wordpressPost
      );

      // Verify the main URL is accessible
      const urlVerification = await WordPressService.verifyPostUrl(
        result.wordpressPost.url, 
        wpConfig
      );

      // Use the best available URL
      let finalUrl = result.wordpressPost.url;
      if (!urlVerification.accessible) {
        console.warn('Primary URL not accessible, trying alternatives...');
        
        // Try direct link as fallback
        const directLinkVerification = await WordPressService.verifyPostUrl(
          alternativeUrls.directLink, 
          wpConfig
        );
        
        if (directLinkVerification.accessible) {
          finalUrl = alternativeUrls.directLink;
          console.log('Using direct link as fallback:', finalUrl);
        } else if (result.wordpressPost.status === 'draft') {
          // For drafts, use preview URL
          finalUrl = alternativeUrls.preview;
          console.log('Using preview URL for draft:', finalUrl);
        }
      }

      // Update article with WordPress info using correct nested schema fields
      await Article.findByIdAndUpdate(article._id, {
        'wordpress.postId': result.wordpressPost.id,
        'wordpress.url': finalUrl,
        'wordpress.status': result.wordpressPost.status,
        'wordpress.syncStatus': 'SYNCED',
        'wordpress.lastSyncedAt': new Date(),
        'wordpress.publishedAt': result.wordpressPost.publishedAt || new Date(),
        'wordpress.alternativeUrls': alternativeUrls // Store alternative URLs
      });

      // Update integration stats
      await integration.updateStats(true);
      
      console.log('Article published successfully:', {
        articleId: article._id,
        wordpressPostId: result.wordpressPost.id,
        url: finalUrl,
        urlAccessible: urlVerification.accessible
      });

      // Return enhanced response with URL information
      res.json({
        ...result,
        wordpressPost: {
          ...result.wordpressPost,
          url: finalUrl,
          alternativeUrls: alternativeUrls,
          urlVerification: urlVerification
        }
      });
    } else {
      await integration.updateStats(false);
      console.error('WordPress publishing failed:', result.message);
      res.json(result);
    }
  } catch (error) {
    console.error('Error posting article to WordPress:', error);
    
    // Provide more specific error messages
    let errorMessage = 'Failed to post article to WordPress';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Handle specific WordPress API errors
    if (errorMessage.includes('Invalid parameter(s): tags')) {
      errorMessage = 'Error processing tags. Please check your tag names and try again.';
    } else if (errorMessage.includes('Invalid parameter(s): categories')) {
      errorMessage = 'Error processing categories. Please check your category selection.';
    }

    res.status(500).json({ 
      error: errorMessage,
      details: error.response?.data || error.message 
    });
  }
});

// Bulk post campaign articles to WordPress
router.post('/integrations/:integrationId/post-campaign/:campaignId', verifyToken, async (req, res) => {
  try {
    const { options } = req.body;

    const integration = await WordPressIntegration.findOne({
      _id: req.params.integrationId,
      userId: req.userId
    });

    if (!integration) {
      return res.status(404).json({ error: 'WordPress integration not found' });
    }

    const campaign = await Campaign.findOne({
      _id: req.params.campaignId,
      userId: req.userId
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    const wpConfig = integration.getConfig();
    const bulkOptions = {
      defaultStatus: options?.status || integration.settings.defaultStatus || 'draft',
      categories: options?.categories || integration.settings.defaultCategories || [],
      tags: options?.tags || integration.settings.defaultTags || [],
      batchSize: options?.batchSize || 5,
      delay: options?.delay || 2000,
      ...options
    };

    const result = await WordPressService.bulkPostCampaignArticles(
      req.userId, 
      req.params.campaignId, 
      wpConfig, 
      bulkOptions
    );

    // Update integration stats
    if (result.success && result.summary) {
      integration.stats.totalPosts += result.summary.total;
      integration.stats.successfulPosts += result.summary.successful;
      integration.stats.failedPosts += result.summary.failed;
      integration.stats.lastPostAt = new Date();
      await integration.save();
    }

    res.json(result);
  } catch (error) {
    console.error('Error bulk posting campaign to WordPress:', error);
    res.status(500).json({ error: 'Failed to bulk post campaign to WordPress' });
  }
});

// Update WordPress post
router.put('/integrations/:integrationId/posts/:wordpressPostId', verifyToken, async (req, res) => {
  try {
    const { articleId, options } = req.body;

    const integration = await WordPressIntegration.findOne({
      _id: req.params.integrationId,
      userId: req.userId
    });

    if (!integration) {
      return res.status(404).json({ error: 'WordPress integration not found' });
    }

    const article = await Article.findOne({
      _id: articleId,
      userId: req.userId
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    const wpConfig = integration.getConfig();
    const result = await WordPressService.updateArticle(
      wpConfig, 
      req.params.wordpressPostId, 
      article, 
      options || {}
    );

    if (result.success) {
      // Update article sync info
      await Article.findByIdAndUpdate(article._id, {
        wordpressStatus: result.wordpressPost.status,
        lastSyncedAt: new Date()
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error updating WordPress post:', error);
    res.status(500).json({ error: 'Failed to update WordPress post' });
  }
});

// Sync article status from WordPress
router.post('/integrations/:integrationId/sync/:articleId', verifyToken, async (req, res) => {
  try {
    const integration = await WordPressIntegration.findOne({
      _id: req.params.integrationId,
      userId: req.userId
    });

    if (!integration) {
      return res.status(404).json({ error: 'WordPress integration not found' });
    }

    const article = await Article.findOne({
      _id: req.params.articleId,
      userId: req.userId
    });

    if (!article || !article.wordpressPostId) {
      return res.status(404).json({ error: 'Article not found or not synced with WordPress' });
    }

    const wpConfig = integration.getConfig();
    const result = await WordPressService.syncArticleStatus(wpConfig, article.wordpressPostId);

    if (result.success) {
      // Update article with synced data
      await Article.findByIdAndUpdate(article._id, {
        wordpressStatus: result.status,
        wordpressUrl: result.url,
        lastSyncedAt: new Date()
      });
    }

    res.json(result);
  } catch (error) {
    console.error('Error syncing article status:', error);
    res.status(500).json({ error: 'Failed to sync article status' });
  }
});

// Get integration statistics
router.get('/integrations/:integrationId/stats', verifyToken, async (req, res) => {
  try {
    const integration = await WordPressIntegration.findOne({
      _id: req.params.integrationId,
      userId: req.userId
    }).select('stats lastTestResult');

    if (!integration) {
      return res.status(404).json({ error: 'WordPress integration not found' });
    }

    // Get additional stats from articles
    const articleStats = await Article.aggregate([
      {
        $match: {
          userId: req.userId,
          wordpressPostId: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$wordpressStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {};
    articleStats.forEach(stat => {
      statusCounts[stat._id || 'unknown'] = stat.count;
    });

    res.json({
      stats: integration.stats,
      lastTestResult: integration.lastTestResult,
      statusBreakdown: statusCounts
    });
  } catch (error) {
    console.error('Error fetching integration stats:', error);
    res.status(500).json({ error: 'Failed to fetch integration statistics' });
  }
});

// Verify WordPress post URL accessibility
router.get('/verify-url/:articleId', verifyToken, async (req, res) => {
  try {
    const article = await Article.findOne({
      _id: req.params.articleId,
      userId: req.userId
    });

    if (!article || !article.wordpress?.url) {
      return res.status(404).json({ error: 'Article or WordPress URL not found' });
    }

    // Try to verify the URL
    const verification = await WordPressService.verifyPostUrl(article.wordpress.url);
    
    let workingUrl = article.wordpress.url;
    let urlStatus = 'working';

    if (!verification.accessible && article.wordpress.alternativeUrls) {
      // Try alternative URLs
      const alternatives = article.wordpress.alternativeUrls;
      
      for (const [key, url] of Object.entries(alternatives)) {
        if (url) {
          const altVerification = await WordPressService.verifyPostUrl(url);
          if (altVerification.accessible) {
            workingUrl = url;
            urlStatus = `working_alternative_${key}`;
            
            // Update the article with the working URL
            await Article.findByIdAndUpdate(article._id, {
              'wordpress.url': workingUrl
            });
            break;
          }
        }
      }
      
      if (!verification.accessible && urlStatus === 'working') {
        urlStatus = 'not_accessible';
      }
    }

    res.json({
      accessible: verification.accessible || urlStatus.startsWith('working_alternative'),
      url: workingUrl,
      status: urlStatus,
      alternatives: article.wordpress.alternativeUrls,
      verification: verification
    });
  } catch (error) {
    console.error('Error verifying WordPress URL:', error);
    res.status(500).json({ error: 'Failed to verify WordPress URL' });
  }
});

// Test endpoint to verify route is working
router.get('/integrations/:integrationId/test', verifyToken, async (req, res) => {
  res.json({ 
    message: 'Route is working!',
    integrationId: req.params.integrationId,
    userId: req.userId
  });
});

// Create new category in WordPress
router.post('/integrations/:integrationId/create-category', verifyToken, async (req, res) => {
  try {
    console.log('📁 Create category endpoint hit');
    console.log('   Integration ID:', req.params.integrationId);
    console.log('   User ID:', req.userId);
    console.log('   Request body:', req.body);
    
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      console.log('❌ Category name is missing or empty');
      return res.status(400).json({ 
        success: false,
        error: 'Category name is required' 
      });
    }

    const integration = await WordPressIntegration.findOne({
      _id: req.params.integrationId,
      userId: req.userId
    });

    if (!integration) {
      console.log('❌ WordPress integration not found');
      console.log('   Searched for integration ID:', req.params.integrationId);
      console.log('   User ID:', req.userId);
      return res.status(404).json({ 
        success: false,
        error: 'WordPress integration not found. Please check your WordPress connection.' 
      });
    }

    console.log(`📁 Creating category "${name}" in WordPress...`);
    console.log('   Site URL:', integration.siteUrl);
    console.log('   Username:', integration.username);

    // Create category in WordPress
    const category = await WordPressService.createCategory(integration, name.trim());

    console.log('✅ Category created successfully:', category);

    res.json({
      success: true,
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
        count: category.count || 0
      },
      message: `Category "${name}" created successfully`
    });
  } catch (error) {
    console.error('❌ Error creating category:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
    
    let errorMessage = 'Failed to create category';
    let statusCode = 500;
    
    if (error.message.includes('already exists')) {
      errorMessage = error.message;
      statusCode = 400;
    } else if (error.message.includes('authentication') || error.message.includes('credentials')) {
      errorMessage = error.message;
      statusCode = 401;
    } else if (error.message.includes('permission')) {
      errorMessage = error.message;
      statusCode = 403;
    } else if (error.message.includes('REST API')) {
      errorMessage = error.message;
      statusCode = 404;
    } else if (error.message.includes('connect')) {
      errorMessage = error.message;
      statusCode = 503;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({ 
      success: false,
      error: errorMessage 
    });
  }
});

export default router;