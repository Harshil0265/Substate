import express from 'express';
import mongoose from 'mongoose';
import Campaign from '../models/Campaign.js';
import Article from '../models/Article.js';
import verifyToken from '../middleware/auth.js';
import UsageService from '../services/UsageService.js';
import CampaignAutomationService from '../services/CampaignAutomationService.js';
import ContentModerationService from '../services/ContentModerationService.js';
import EmailCampaignService from '../services/EmailCampaignService.js';

const router = express.Router();

// Health check for campaigns endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'Campaigns API is working',
    timestamp: new Date().toISOString()
  });
});

// Get all campaigns for user
router.get('/', verifyToken, async (req, res) => {
  try {
    console.log('GET /campaigns - User requesting campaigns:', {
      userId: req.userId,
      userEmail: req.userEmail
    })
    
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;
    
    const filter = { userId: req.userId };
    if (status) filter.status = status;
    
    console.log('Campaign filter:', filter)
    
    const campaigns = await Campaign.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Campaign.countDocuments(filter);
    
    console.log('Found campaigns:', {
      count: campaigns.length,
      total,
      campaignIds: campaigns.map(c => c._id.toString())
    })
    
    res.json({
      campaigns,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    res.status(500).json({ error: error.message });
  }
});

// Create campaign
router.post('/', verifyToken, async (req, res) => {
  try {
    // Check if user can create campaign
    const canCreate = await UsageService.canCreateCampaign(req.userId);
    
    if (!canCreate.allowed) {
      return res.status(403).json({ 
        error: canCreate.reason,
        code: canCreate.code,
        usage: canCreate.usage,
        limit: canCreate.limit
      });
    }

    const { title, description, campaignType, targetAudience, startDate, endDate } = req.body;
    
    const campaignData = {
      userId: req.userId,
      title,
      description,
      campaignType: campaignType || 'CONTENT',
      targetAudience: targetAudience || 'ALL',
      status: 'DRAFT'
    };

    // Add dates if provided
    if (startDate) campaignData.startDate = new Date(startDate);
    if (endDate) campaignData.endDate = new Date(endDate);
    
    // CONTENT MODERATION - Analyze campaign content
    const moderationResult = await ContentModerationService.analyzeCampaignContent({
      title,
      description,
      userId: req.userId
    });
    
    // Set moderation status based on analysis
    campaignData.moderationStatus = {
      status: moderationResult.isViolation ? 'UNDER_REVIEW' : 'APPROVED',
      violations: moderationResult.violations,
      riskScore: moderationResult.riskScore,
      requiresManualReview: moderationResult.requiresManualReview
    };
    
    // If high-risk content, block immediately
    if (moderationResult.maxSeverity >= 4) { // CRITICAL level
      campaignData.moderationStatus.status = 'BLOCKED';
      campaignData.status = 'BLOCKED';
    } else if (moderationResult.requiresManualReview) {
      campaignData.status = 'UNDER_REVIEW';
    }
    
    const campaign = new Campaign(campaignData);
    await campaign.save();
    
    // Record violations if any
    if (moderationResult.isViolation && moderationResult.maxSeverity >= 3) {
      for (const violation of moderationResult.violations) {
        await ContentModerationService.recordViolation(req.userId, violation, campaign._id);
      }
    }
    
    // Update user counts
    await UsageService.updateUserCounts(req.userId);
    
    // Send usage notifications if approaching limits
    await UsageService.sendUsageNotifications(req.userId);
    
    // Return response with moderation info
    const response = { 
      campaign,
      remaining: canCreate.remaining
    };
    
    // Add moderation warnings if needed
    if (moderationResult.isViolation) {
      response.moderationWarning = {
        message: 'Your campaign content has been flagged for review',
        violations: moderationResult.violations.map(v => v.description),
        status: campaignData.moderationStatus.status,
        requiresReview: moderationResult.requiresManualReview
      };
    }
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Campaign creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get campaign by ID
router.get('/:campaignId', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update campaign
router.put('/:campaignId', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    Object.assign(campaign, req.body);
    campaign.updatedAt = new Date();
    await campaign.save();
    
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint for debugging
router.patch('/test/:campaignId', verifyToken, async (req, res) => {
  try {
    console.log('Test PATCH endpoint hit:', {
      campaignId: req.params.campaignId,
      userId: req.userId,
      body: req.body
    })
    
    res.json({ 
      message: 'Test PATCH endpoint working',
      campaignId: req.params.campaignId,
      userId: req.userId,
      body: req.body
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update campaign status (PATCH)
// Update campaign status (PATCH)
router.patch('/:campaignId', verifyToken, async (req, res) => {
  try {
    console.log('🔄 PATCH /campaigns/:campaignId - Request details:', {
      campaignId: req.params.campaignId,
      userId: req.userId,
      userEmail: req.userEmail,
      body: req.body,
      timestamp: new Date().toISOString()
    });

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.campaignId)) {
      console.log('❌ Invalid ObjectId format:', req.params.campaignId);
      return res.status(400).json({ error: 'Invalid campaign ID format' });
    }
    
    console.log('🔍 Looking for campaign with ID:', req.params.campaignId);
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      console.log('❌ Campaign not found in database:', req.params.campaignId);
      
      // Let's also check if any campaigns exist for this user
      const userCampaigns = await Campaign.find({ userId: req.userId });
      console.log('📊 User has', userCampaigns.length, 'campaigns total');
      console.log('📋 User campaign IDs:', userCampaigns.map(c => c._id.toString()));
      
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    console.log('✅ Campaign found:', {
      id: campaign._id.toString(),
      title: campaign.title,
      ownerId: campaign.userId.toString(),
      ownerIdType: typeof campaign.userId,
      requestUserId: req.userId,
      requestUserIdType: typeof req.userId,
      currentStatus: campaign.status
    });
    
    // Check ownership - ensure both IDs are strings for comparison
    const campaignOwnerIdStr = campaign.userId.toString();
    const requestUserIdStr = req.userId.toString(); // req.userId should already be string now
    
    console.log('🔐 Ownership check:', {
      campaignOwnerId: campaignOwnerIdStr,
      requestUserId: requestUserIdStr,
      campaignOwnerIdType: typeof campaignOwnerIdStr,
      requestUserIdType: typeof requestUserIdStr,
      match: campaignOwnerIdStr === requestUserIdStr
    });
    
    if (campaignOwnerIdStr !== requestUserIdStr) {
      console.log('❌ Unauthorized access attempt:', {
        campaignUserId: campaignOwnerIdStr,
        requestUserId: requestUserIdStr
      });
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Validate status if it's being updated
    if (req.body.status) {
      const validStatuses = ['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'PAUSED'];
      if (!validStatuses.includes(req.body.status)) {
        console.log('❌ Invalid status provided:', req.body.status);
        return res.status(400).json({ 
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
        });
      }
    }
    
    // Update campaign fields
    const oldStatus = campaign.status;
    Object.assign(campaign, req.body);
    campaign.updatedAt = new Date();
    
    await campaign.save();
    
    console.log('✅ Campaign updated successfully:', {
      id: campaign._id.toString(),
      oldStatus,
      newStatus: campaign.status,
      updatedAt: campaign.updatedAt
    });
    
    res.json(campaign);
  } catch (error) {
    console.error('❌ Campaign update error:', {
      message: error.message,
      stack: error.stack,
      campaignId: req.params.campaignId,
      userId: req.userId,
      body: req.body
    });
    res.status(400).json({ error: error.message });
  }
});

// Delete campaign
router.delete('/:campaignId', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await Campaign.deleteOne({ _id: req.params.campaignId });
    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get campaign analytics
router.get('/:campaignId/analytics', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Get campaign articles
    const articles = await Article.find({ campaignId: campaign._id });
    
    // Calculate detailed analytics
    const analytics = {
      campaign: {
        id: campaign._id,
        title: campaign.title,
        status: campaign.status,
        progress: campaign.getProgress()
      },
      articles: {
        total: articles.length,
        published: articles.filter(a => a.status === 'PUBLISHED').length,
        draft: articles.filter(a => a.status === 'DRAFT').length,
        scheduled: articles.filter(a => a.autoPublish && a.scheduledPublishAt).length
      },
      performance: {
        totalViews: campaign.analytics.totalViews,
        uniqueVisitors: campaign.analytics.uniqueVisitors,
        avgTimeOnPage: campaign.analytics.avgTimeOnPage,
        bounceRate: campaign.analytics.bounceRate,
        engagementRate: campaign.engagementRate,
        socialShares: campaign.analytics.socialShares
      },
      roi: {
        investment: campaign.roi.investment,
        revenue: campaign.roi.revenue,
        roiPercentage: campaign.roi.roiPercentage,
        costPerClick: campaign.roi.costPerClick,
        costPerConversion: campaign.roi.costPerConversion,
        revenuePerArticle: campaign.roi.revenuePerArticle
      },
      engagement: {
        emailsSent: campaign.emailsSent,
        opensCount: campaign.opensCount,
        clicksCount: campaign.clicksCount,
        conversionCount: campaign.conversionCount,
        openRate: campaign.emailsSent > 0 ? (campaign.opensCount / campaign.emailsSent) * 100 : 0,
        clickRate: campaign.opensCount > 0 ? (campaign.clicksCount / campaign.opensCount) * 100 : 0,
        conversionRate: campaign.clicksCount > 0 ? (campaign.conversionCount / campaign.clicksCount) * 100 : 0
      },
      abTesting: campaign.abTesting.enabled ? {
        enabled: true,
        variants: campaign.abTesting.variants,
        winningVariant: campaign.abTesting.winningVariant,
        testDuration: campaign.abTesting.testDuration
      } : null,
      topArticles: articles
        .sort((a, b) => b.views - a.views)
        .slice(0, 5)
        .map(a => ({
          id: a._id,
          title: a.title,
          views: a.views,
          likes: a.likes,
          shares: a.shares,
          status: a.status
        }))
    };
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get campaign articles
router.get('/:campaignId/articles', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;
    
    const filter = { campaignId: campaign._id };
    if (status) filter.status = status;
    
    const articles = await Article.find(filter)
      .sort('-createdAt')
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

// Bulk publish articles to WordPress
router.post('/:campaignId/bulk-publish', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const articles = await Article.find({
      campaignId: campaign._id,
      status: 'PUBLISHED',
      wordpressPostId: null
    });
    
    res.json({
      message: 'Bulk publish initiated',
      articlesCount: articles.length,
      articles: articles.map(a => ({ id: a._id, title: a.title }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk update article status
router.post('/:campaignId/bulk-update-status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const result = await Article.updateMany(
      { campaignId: campaign._id },
      { status, updatedAt: new Date() }
    );
    
    res.json({
      message: 'Articles updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk delete articles
router.post('/:campaignId/bulk-delete', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const result = await Article.deleteMany({ campaignId: campaign._id });
    
    res.json({
      message: 'Articles deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update campaign automation settings
router.patch('/:campaignId/automation', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { autoScheduling, abTesting, notifications, roi } = req.body;
    
    if (autoScheduling) {
      Object.assign(campaign.autoScheduling, autoScheduling);
      if (autoScheduling.enabled) {
        campaign.autoScheduling.nextScheduledDate = campaign.getNextScheduledDate();
      }
    }
    
    if (abTesting) {
      Object.assign(campaign.abTesting, abTesting);
    }
    
    if (notifications) {
      if (notifications.milestones) {
        Object.assign(campaign.notifications.milestones, notifications.milestones);
      }
      if (notifications.emailAlerts) {
        Object.assign(campaign.notifications.emailAlerts, notifications.emailAlerts);
      }
    }
    
    if (roi) {
      Object.assign(campaign.roi, roi);
      campaign.calculateROI();
    }
    
    campaign.updatedAt = new Date();
    await campaign.save();
    
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get campaign templates
router.get('/templates/list', verifyToken, async (req, res) => {
  try {
    const templates = await Campaign.find({
      'template.isTemplate': true
    }).select('title description campaignType targetAudience template');
    
    res.json({ templates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create campaign from template
router.post('/templates/:templateId/create', verifyToken, async (req, res) => {
  try {
    const campaign = await CampaignAutomationService.createFromTemplate(
      req.params.templateId,
      req.userId,
      req.body
    );
    
    res.status(201).json({ campaign });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Save campaign as template
router.post('/:campaignId/save-as-template', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { templateName, templateCategory } = req.body;
    
    // Create a new template from this campaign
    const templateData = campaign.toObject();
    delete templateData._id;
    delete templateData.createdAt;
    delete templateData.updatedAt;
    
    templateData.template = {
      isTemplate: true,
      templateName: templateName || campaign.title,
      templateCategory: templateCategory || 'Custom',
      usageCount: 0
    };
    templateData.status = 'DRAFT';
    templateData.articlesGenerated = 0;
    
    const template = new Campaign(templateData);
    await template.save();
    
    res.status(201).json({ template });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Pause/Resume campaign
router.patch('/:campaignId/pause-resume', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const action = campaign.pauseResume();
    await campaign.save();
    
    res.json({ 
      message: `Campaign ${action} successfully`,
      status: campaign.status,
      campaign 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Clone campaign
router.post('/:campaignId/clone', verifyToken, async (req, res) => {
  try {
    const { title } = req.body;
    
    // Check if user can create campaign
    const canCreate = await UsageService.canCreateCampaign(req.userId);
    
    if (!canCreate.allowed) {
      return res.status(403).json({ 
        error: canCreate.reason,
        code: canCreate.code,
        usage: canCreate.usage,
        limit: canCreate.limit
      });
    }
    
    const originalCampaign = await Campaign.findById(req.params.campaignId);
    
    if (!originalCampaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (originalCampaign.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const clonedData = originalCampaign.clone(title);
    const clonedCampaign = new Campaign(clonedData);
    await clonedCampaign.save();
    
    // Update user counts
    await UsageService.updateUserCounts(req.userId);
    
    res.status(201).json({ 
      message: 'Campaign cloned successfully',
      campaign: clonedCampaign,
      remaining: canCreate.remaining - 1
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get campaign analytics with enhanced metrics
router.get('/:campaignId/analytics/enhanced', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Get campaign articles
    const articles = await Article.find({ campaignId: campaign._id });
    
    // Get campaign-specific metrics
    const campaignMetrics = campaign.getCampaignMetrics();
    
    // Calculate time-based analytics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentArticles = articles.filter(a => new Date(a.createdAt) >= thirtyDaysAgo);
    const weeklyArticles = articles.filter(a => new Date(a.createdAt) >= sevenDaysAgo);
    
    const analytics = {
      campaign: {
        id: campaign._id,
        title: campaign.title,
        type: campaign.campaignType,
        status: campaign.status,
        progress: campaign.getProgress(),
        createdAt: campaign.createdAt,
        metrics: campaignMetrics
      },
      performance: {
        overall: {
          totalViews: campaign.analytics.totalViews,
          uniqueVisitors: campaign.analytics.uniqueVisitors,
          avgTimeOnPage: campaign.analytics.avgTimeOnPage,
          bounceRate: campaign.analytics.bounceRate,
          engagementRate: campaign.engagementRate,
          socialShares: campaign.analytics.socialShares
        },
        timeframes: {
          last30Days: {
            articlesCreated: recentArticles.length,
            totalViews: recentArticles.reduce((sum, a) => sum + (a.views || 0), 0),
            avgViewsPerArticle: recentArticles.length > 0 ? 
              recentArticles.reduce((sum, a) => sum + (a.views || 0), 0) / recentArticles.length : 0
          },
          last7Days: {
            articlesCreated: weeklyArticles.length,
            totalViews: weeklyArticles.reduce((sum, a) => sum + (a.views || 0), 0),
            avgViewsPerArticle: weeklyArticles.length > 0 ? 
              weeklyArticles.reduce((sum, a) => sum + (a.views || 0), 0) / weeklyArticles.length : 0
          }
        }
      },
      articles: {
        total: articles.length,
        published: articles.filter(a => a.status === 'PUBLISHED').length,
        draft: articles.filter(a => a.status === 'DRAFT').length,
        scheduled: articles.filter(a => a.autoPublish && a.scheduledPublishAt).length,
        topPerforming: articles
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 10)
          .map(a => ({
            id: a._id,
            title: a.title,
            views: a.views || 0,
            likes: a.likes || 0,
            shares: a.shares || 0,
            status: a.status,
            createdAt: a.createdAt
          }))
      },
      roi: {
        investment: campaign.roi.investment,
        revenue: campaign.roi.revenue,
        roiPercentage: campaign.roi.roiPercentage,
        costPerClick: campaign.roi.costPerClick,
        costPerConversion: campaign.roi.costPerConversion,
        revenuePerArticle: campaign.roi.revenuePerArticle,
        projectedROI: campaign.roi.investment > 0 ? 
          ((campaign.roi.revenue * 1.2 - campaign.roi.investment) / campaign.roi.investment) * 100 : 0
      },
      abTesting: campaign.abTesting.enabled ? {
        enabled: true,
        variants: campaign.abTesting.variants,
        winningVariant: campaign.abTesting.winningVariant,
        testDuration: campaign.abTesting.testDuration,
        statisticalSignificance: campaign.abTesting.variants.length > 1 ? 
          Math.random() * 100 : 0 // Placeholder for actual calculation
      } : null,
      automation: {
        autoScheduling: campaign.autoScheduling,
        nextScheduledAction: campaign.autoScheduling.enabled ? 
          campaign.getNextScheduledDate() : null,
        notifications: campaign.notifications
      }
    };
    
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update campaign data (for campaign-specific settings)
router.patch('/:campaignId/campaign-data', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Validate campaign data based on type
    const tempCampaign = { ...campaign.toObject(), campaignData: req.body };
    const validationErrors = Campaign.prototype.validateCampaignData.call(tempCampaign);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    // Update campaign data
    campaign.campaignData = { ...campaign.campaignData, ...req.body };
    campaign.updatedAt = new Date();
    await campaign.save();
    
    res.json({ 
      message: 'Campaign data updated successfully',
      campaign 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Export campaign data
router.get('/:campaignId/export', verifyToken, async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Get related articles
    const articles = await Article.find({ campaignId: campaign._id });
    
    const exportData = {
      campaign: {
        id: campaign._id,
        title: campaign.title,
        description: campaign.description,
        type: campaign.campaignType,
        targetAudience: campaign.targetAudience,
        status: campaign.status,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
        metrics: campaign.getCampaignMetrics(),
        campaignData: campaign.campaignData
      },
      articles: articles.map(a => ({
        id: a._id,
        title: a.title,
        content: a.content,
        status: a.status,
        views: a.views,
        likes: a.likes,
        shares: a.shares,
        createdAt: a.createdAt,
        publishedAt: a.publishedAt
      })),
      analytics: {
        totalArticles: articles.length,
        totalViews: articles.reduce((sum, a) => sum + (a.views || 0), 0),
        totalLikes: articles.reduce((sum, a) => sum + (a.likes || 0), 0),
        totalShares: articles.reduce((sum, a) => sum + (a.shares || 0), 0),
        avgViewsPerArticle: articles.length > 0 ? 
          articles.reduce((sum, a) => sum + (a.views || 0), 0) / articles.length : 0
      },
      exportedAt: new Date().toISOString()
    };
    
    if (format === 'csv') {
      // Convert to CSV format
      const csv = [
        // Campaign header
        'Campaign Data',
        `Title,${campaign.title}`,
        `Type,${campaign.campaignType}`,
        `Status,${campaign.status}`,
        `Created,${campaign.createdAt}`,
        '',
        // Articles header
        'Articles',
        'Title,Status,Views,Likes,Shares,Created',
        ...articles.map(a => 
          `"${a.title}",${a.status},${a.views || 0},${a.likes || 0},${a.shares || 0},${a.createdAt}`
        )
      ].join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${campaign.title}-export.csv"`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${campaign.title}-export.json"`);
      res.json(exportData);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// A/B Test management
router.post('/:campaignId/ab-test/create', verifyToken, async (req, res) => {
  try {
    const { variants, testDuration = 7 } = req.body;
    
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Validate variants
    if (!variants || variants.length < 2) {
      return res.status(400).json({ error: 'A/B test requires at least 2 variants' });
    }
    
    // Initialize A/B testing
    campaign.abTesting = {
      enabled: true,
      variants: variants.map(v => ({
        name: v.name,
        title: v.title,
        description: v.description,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        conversionRate: 0
      })),
      winningVariant: null,
      testDuration
    };
    
    await campaign.save();
    
    res.json({ 
      message: 'A/B test created successfully',
      abTesting: campaign.abTesting
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Track A/B test event
router.post('/:campaignId/ab-test/track', verifyToken, async (req, res) => {
  try {
    const { variantName, action } = req.body;
    
    await CampaignAutomationService.updateABTestResults(
      req.params.campaignId,
      variantName,
      action
    );
    
    res.json({ message: 'Event tracked successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get campaign templates
router.get('/templates/list', verifyToken, async (req, res) => {
  try {
    const templates = await Campaign.find({
      'template.isTemplate': true
    }).select('title description campaignType targetAudience template');
    
    res.json({ templates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create campaign from template
router.post('/templates/:templateId/create', verifyToken, async (req, res) => {
  try {
    const campaign = await CampaignAutomationService.createFromTemplate(
      req.params.templateId,
      req.userId,
      req.body
    );
    
    res.status(201).json({ campaign });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Save campaign as template
router.post('/:campaignId/save-as-template', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (campaign.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const { templateName, templateCategory } = req.body;
    
    // Create a new template from this campaign
    const templateData = campaign.toObject();
    delete templateData._id;
    delete templateData.createdAt;
    delete templateData.updatedAt;
    
    templateData.template = {
      isTemplate: true,
      templateName: templateName || campaign.title,
      templateCategory: templateCategory || 'Custom',
      usageCount: 0
    };
    templateData.status = 'DRAFT';
    templateData.articlesGenerated = 0;
    
    const template = new Campaign(templateData);
    await template.save();
    
    res.status(201).json({ template });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Track A/B test event
router.post('/:campaignId/ab-test/track', verifyToken, async (req, res) => {
  try {
    const { variantName, action } = req.body;
    
    await CampaignAutomationService.updateABTestResults(
      req.params.campaignId,
      variantName,
      action
    );
    
    res.json({ message: 'Event tracked successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Email Campaign specific routes

// Send email campaign
router.post('/:campaignId/email/send', verifyToken, async (req, res) => {
  try {
    const result = await EmailCampaignService.sendEmailCampaign(req.params.campaignId, req.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Import email list
router.post('/:campaignId/email/import-list', verifyToken, async (req, res) => {
  try {
    const { csvData } = req.body;
    const result = await EmailCampaignService.importEmailList(csvData, req.params.campaignId, req.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Schedule email campaign
router.post('/:campaignId/email/schedule', verifyToken, async (req, res) => {
  try {
    const { scheduledTime } = req.body;
    const result = await EmailCampaignService.scheduleEmailCampaign(req.params.campaignId, req.userId, scheduledTime);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get email campaign analytics
router.get('/:campaignId/email/analytics', verifyToken, async (req, res) => {
  try {
    const analytics = await EmailCampaignService.getEmailCampaignAnalytics(req.params.campaignId, req.userId);
    res.json(analytics);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Track email opens (public endpoint for tracking pixels)
router.get('/:campaignId/track/open/:trackingId', async (req, res) => {
  try {
    await EmailCampaignService.trackEmailOpen(req.params.campaignId, req.params.trackingId);
    
    // Return 1x1 transparent pixel
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.set('Content-Length', pixel.length);
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(pixel);
  } catch (error) {
    res.status(200).send(); // Don't expose errors to tracking requests
  }
});

// Track email clicks (public endpoint for click tracking)
router.get('/:campaignId/track/click/:trackingId', async (req, res) => {
  try {
    const { url } = req.query;
    const targetUrl = await EmailCampaignService.trackEmailClick(req.params.campaignId, req.params.trackingId, url);
    res.redirect(targetUrl);
  } catch (error) {
    res.redirect(req.query.url || 'https://substate.com'); // Fallback redirect
  }
});

export default router;
