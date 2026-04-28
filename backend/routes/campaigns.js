import express from 'express';
import mongoose from 'mongoose';
import Campaign from '../models/Campaign.js';
import Article from '../models/Article.js';
import User from '../models/User.js';
import verifyToken from '../middleware/auth.js';
import UsageService from '../services/UsageService.js';
import CampaignAutomationService from '../services/CampaignAutomationService.js';
import ContentModerationService from '../services/ContentModerationService.js';
import EmailCampaignService from '../services/EmailCampaignService.js';
import AIContentGenerator from '../services/AIContentGenerator.js';

const router = express.Router();

// Helper function to check if user can access campaign (owner or admin)
const canAccessCampaign = async (userId, campaign) => {
  // Check if user owns the campaign
  if (campaign.userId.toString() === userId.toString()) {
    return true;
  }
  
  // Check if user is admin
  const user = await User.findById(userId);
  if (user && user.role === 'ADMIN') {
    return true;
  }
  
  return false;
};

// Health check for campaigns endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'Campaigns API is working',
    timestamp: new Date().toISOString(),
    groqConfigured: !!process.env.GROQ_API_KEY,
    groqKeyPrefix: process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.substring(0, 10) + '...' : 'NOT SET'
  });
});

// Generate email template without campaign (for new campaigns)
router.post('/generate-template', verifyToken, async (req, res) => {
  try {
    const { title, description, tone, style, includeImages } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    
    console.log('🤖 Generating email template for new campaign:', title);
    console.log('📝 Description:', description);
    console.log('🎨 Options:', { tone, style, includeImages });
    
    // Initialize AI generator
    const aiGenerator = new AIContentGenerator();
    
    // Generate email template
    const template = await aiGenerator.generateEmailTemplate(
      title,
      description,
      {
        tone: tone || 'professional',
        style: style || 'modern',
        includeImages: includeImages !== false
      }
    );
    
    console.log('✅ Email template generated successfully');
    console.log('📧 Subject:', template.subject);
    console.log('📄 Content length:', template.htmlContent?.length || 0);
    
    res.json({
      success: true,
      template: template
    });
    
  } catch (error) {
    console.error('❌ Email template generation error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Failed to generate email template',
      details: 'Failed to generate email template. Please try again.'
    });
  }
});

// Get all campaigns for user
router.get('/', verifyToken, async (req, res) => {
  try {
    console.log('GET /campaigns - User requesting campaigns:', {
      userId: req.userId,
      userEmail: req.userEmail
    })
    
    const { page = 1, limit = 20, status, includeDeleted } = req.query;
    const skip = (page - 1) * limit;
    
    const filter = { userId: req.userId };
    if (status) filter.status = status;
    
    // By default, exclude deleted campaigns unless explicitly requested
    if (includeDeleted !== 'true') {
      filter.isDeleted = { $ne: true };
    }
    
    console.log('Campaign filter:', JSON.stringify(filter, null, 2))
    
    const campaigns = await Campaign.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Campaign.countDocuments(filter);
    
    console.log('Found campaigns:', {
      count: campaigns.length,
      total,
      campaignIds: campaigns.map(c => c._id.toString()),
      campaigns: campaigns.map(c => ({ id: c._id, title: c.title, isDeleted: c.isDeleted }))
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

    const { title, description, campaignType, targetAudience, startDate, endDate, scheduledTimes, publishDestination, wordpressConfig, customWebsiteConfig, emailList, emailScheduledTime, emailThrottleRate, emailTimezone, emailTemplate, socialPlatforms, socialPostTimes, socialTimezone } = req.body;
    
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
    
    // Add scheduled times for CONTENT campaigns
    if (campaignType === 'CONTENT' && scheduledTimes && Array.isArray(scheduledTimes)) {
      campaignData.campaignData = {
        content: {
          publishingSchedule: {
            scheduledTimes: scheduledTimes.map(st => ({
              time: st.time,
              contentIndex: st.contentIndex,
              isActive: st.isActive !== undefined ? st.isActive : true
            }))
          },
          publishDestination: publishDestination || 'NONE',
          wordpressConfig: wordpressConfig || null,
          customWebsiteConfig: customWebsiteConfig || null
        }
      };
      
      // Auto-enable scheduling if times are provided
      if (scheduledTimes.length > 0 && scheduledTimes.some(st => st.isActive !== false)) {
        campaignData.autoScheduling = {
          enabled: true,
          frequency: 'DAILY', // Default to daily
          timeOfDay: scheduledTimes[0].time, // Use first scheduled time
          daysOfWeek: [1, 2, 3, 4, 5, 6, 0], // All days by default
          nextScheduledDate: null,
          lastGeneratedAt: null
        };
        
        console.log(`✅ Auto-scheduling enabled for campaign with ${scheduledTimes.length} scheduled time(s)`);
      }
    }
    
    // Add email campaign data for EMAIL campaigns
    if (campaignType === 'EMAIL') {
      campaignData.campaignData = {
        email: {
          emailList: emailList || [],
          emailTemplate: emailTemplate || {
            subject: '',
            htmlContent: '',
            textContent: '',
            previewText: ''
          },
          senderInfo: {
            fromName: emailTemplate?.senderName || 'SUBSTATE',
            fromEmail: process.env.EMAIL_FROM || 'noreply@substate.com',
            replyTo: process.env.EMAIL_FROM || 'noreply@substate.com'
          },
          deliverySettings: {
            sendImmediately: false,
            scheduledSendTime: emailScheduledTime ? new Date(`1970-01-01T${emailScheduledTime}:00`) : new Date('1970-01-01T09:00:00'),
            timezone: emailTimezone || 'UTC',
            throttleRate: emailThrottleRate !== undefined ? emailThrottleRate : 100
          },
          deliveryStats: {
            totalSent: 0,
            delivered: 0,
            bounced: 0,
            deliveryRate: 0,
            bounceRate: 0
          }
        }
      };
    }
    
    // Add social campaign data for SOCIAL campaigns
    if (campaignType === 'SOCIAL') {
      campaignData.campaignData = {
        social: {
          platforms: (socialPlatforms || []).map(platformId => ({
            platform: platformId,
            isActive: true
          })),
          postingSchedule: {
            timesPerDay: (socialPostTimes || []).length,
            preferredTimes: (socialPostTimes || []).map(pt => pt.time)
          },
          timezone: socialTimezone || 'UTC',
          scheduledPosts: (socialPostTimes || []).map((pt, index) => ({
            time: pt.time,
            platforms: pt.platforms || [],
            postIndex: index + 1
          }))
        }
      };
    }
    
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
    
    // If it's a CONTENT campaign with auto-scheduling, generate first article immediately
    if (campaignType === 'CONTENT' && campaignData.autoScheduling?.enabled) {
      console.log(`🚀 Generating initial article for new campaign: ${campaign.title}`);
      
      try {
        // Import automation service to generate first article
        const CampaignAutomationService = (await import('../services/CampaignAutomationService.js')).default;
        
        // Calculate next publish time based on scheduled times
        const now = new Date();
        const today = new Date(now);
        const scheduledTimes = campaignData.campaignData?.content?.publishingSchedule?.scheduledTimes || [];
        
        let nextPublishTime = null;
        if (scheduledTimes.length > 0) {
          // Find next scheduled time today or tomorrow
          for (const st of scheduledTimes) {
            const [hours, minutes] = st.time.split(':');
            const publishTime = new Date(today);
            publishTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            
            if (publishTime > now) {
              nextPublishTime = publishTime;
              break;
            }
          }
          
          // If no time today, use first time tomorrow
          if (!nextPublishTime) {
            const [hours, minutes] = scheduledTimes[0].time.split(':');
            nextPublishTime = new Date(today);
            nextPublishTime.setDate(nextPublishTime.getDate() + 1);
            nextPublishTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
          }
        }
        
        // Generate first article immediately
        if (nextPublishTime) {
          await CampaignAutomationService.generateAndScheduleArticle(campaign, nextPublishTime);
          console.log(`✅ Initial article generated and scheduled for: ${nextPublishTime.toLocaleString()}`);
        }
        
      } catch (error) {
        console.error('❌ Failed to generate initial article:', error.message);
        // Don't fail campaign creation if article generation fails
      }
    }
    
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
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
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
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
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
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    console.log('✅ Campaign found:', {
      id: campaign._id.toString(),
      title: campaign.title,
      ownerId: campaign.userId.toString(),
      requestUserId: req.userId,
      currentStatus: campaign.status
    });
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      console.log('❌ Unauthorized access attempt:', {
        campaignUserId: campaign.userId.toString(),
        requestUserId: req.userId
      });
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    console.log('✅ Access granted - User is', campaign.userId.toString() === req.userId.toString() ? 'owner' : 'admin');

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
    
    // If EMAIL campaign status changed to RUNNING, send emails
    if (campaign.campaignType === 'EMAIL' && 
        req.body.status === 'RUNNING' && 
        oldStatus !== 'RUNNING') {
      console.log('📧 Triggering email campaign send...');
      
      // Send emails asynchronously (don't wait for completion)
      EmailCampaignService.sendEmailCampaign(campaign._id.toString(), req.userId)
        .then(result => {
          console.log('✅ Email campaign sent successfully:', result);
        })
        .catch(error => {
          console.error('❌ Email campaign send error:', error);
        });
    }
    
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

// Get campaign analytics
router.get('/:campaignId/analytics', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    // Get campaign articles
    const articles = await Article.find({ campaignId: campaign._id });
    
    // Use ONLY real data - no dummy/demo data
    const totalViews = campaign.analytics.totalViews || 0;
    const uniqueVisitors = campaign.analytics.uniqueVisitors || 0;
    const clicks = campaign.clicksCount || 0;
    const conversions = campaign.conversionCount || 0;
    const investment = campaign.roi.investment || 0;
    const revenue = campaign.roi.revenue || 0;
    
    // Calculate metrics
    const engagementRate = totalViews > 0 ? ((clicks / totalViews) * 100) : 0;
    const roiPercentage = investment > 0 ? (((revenue - investment) / investment) * 100) : 0;
    const costPerClick = clicks > 0 ? (investment / clicks) : 0;
    const costPerConversion = conversions > 0 ? (investment / conversions) : 0;
    
    // Calculate detailed analytics with REAL data only
    const analytics = {
      campaign: {
        id: campaign._id,
        title: campaign.title,
        status: campaign.status,
        progress: campaign.getProgress ? campaign.getProgress() : 0
      },
      articles: {
        total: articles.length,
        published: articles.filter(a => a.status === 'PUBLISHED').length,
        draft: articles.filter(a => a.status === 'DRAFT').length,
        scheduled: articles.filter(a => a.autoPublish && a.scheduledPublishAt).length
      },
      performance: {
        totalViews,
        uniqueVisitors,
        avgTimeOnPage: campaign.analytics.avgTimeOnPage || 0,
        bounceRate: campaign.analytics.bounceRate || 0,
        engagementRate: engagementRate.toFixed(2),
        socialShares: campaign.analytics.socialShares || 0
      },
      roi: {
        investment,
        revenue,
        roiPercentage: roiPercentage.toFixed(2),
        costPerClick: costPerClick.toFixed(2),
        costPerConversion: costPerConversion.toFixed(2),
        revenuePerArticle: articles.length > 0 ? (revenue / articles.length).toFixed(2) : 0
      },
      engagement: {
        emailsSent: campaign.emailsSent || 0,
        opensCount: campaign.opensCount || 0,
        clicksCount: clicks,
        conversionCount: conversions,
        openRate: campaign.emailsSent > 0 ? ((campaign.opensCount / campaign.emailsSent) * 100).toFixed(2) : 0,
        clickRate: clicks > 0 ? ((clicks / totalViews) * 100).toFixed(2) : 0,
        conversionRate: clicks > 0 ? ((conversions / clicks) * 100).toFixed(2) : 0
      },
      abTesting: campaign.abTesting && campaign.abTesting.enabled ? {
        enabled: true,
        variants: campaign.abTesting.variants.map(v => ({
          name: v.name,
          title: v.title,
          description: v.description,
          impressions: v.impressions || 0,
          clicks: v.clicks || 0,
          conversions: v.conversions || 0,
          conversionRate: v.conversionRate || 0
        })),
        winningVariant: campaign.abTesting.winningVariant || null,
        testDuration: campaign.abTesting.testDuration
      } : null,
      topArticles: articles.length > 0 ? articles
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 5)
        .map(a => ({
          id: a._id,
          title: a.title,
          views: a.views || 0,
          likes: a.likes || 0,
          shares: a.shares || 0,
          status: a.status
        })) : []
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
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
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
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
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
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
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
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
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
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
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
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
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
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
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
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, originalCampaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
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
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
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
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
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
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
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
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
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
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
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

// Send test email (before creating campaign)
router.post('/send-test-email', verifyToken, async (req, res) => {
  try {
    const { to, subject, content, senderName, campaignTitle } = req.body;
    
    if (!to || !subject || !content) {
      return res.status(400).json({ error: 'Missing required fields: to, subject, content' });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Personalize content for test
    let personalizedContent = content
      .replace(/\{\{name\}\}/g, 'Test User')
      .replace(/\{\{email\}\}/g, to)
      .replace(/\{\{campaign_title\}\}/g, campaignTitle || 'Test Campaign');

    // Add test email notice
    const testNotice = `
<div style="background: #fef3c7; border: 2px solid #fbbf24; padding: 16px; margin-bottom: 20px; border-radius: 8px; text-align: center;">
  <strong style="color: #92400e;">🧪 TEST EMAIL</strong>
  <p style="color: #92400e; margin: 8px 0 0 0; font-size: 14px;">This is a test email. Your actual campaign will be sent to your recipient list.</p>
</div>
`;

    const htmlContent = testNotice + personalizedContent.replace(/\n/g, '<br>');

    // Send email using EmailService
    const EmailService = (await import('../services/EmailService.js')).default;
    
    await EmailService.sendEmail({
      from: `${senderName || 'SUBSTATE'} <${process.env.EMAIL_FROM}>`,
      to: to,
      subject: `[TEST] ${subject}`,
      html: htmlContent,
      text: `TEST EMAIL\n\n${personalizedContent}`
    });

    console.log('✅ Test email sent successfully to:', to);

    res.json({ 
      success: true, 
      message: `Test email sent to ${to}`,
      sentTo: to
    });
  } catch (error) {
    console.error('❌ Test email error:', error);
    res.status(500).json({ error: error.message || 'Failed to send test email' });
  }
});

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
    console.log(`📧 Email open tracked - Campaign: ${req.params.campaignId}, Tracking: ${req.params.trackingId}`);
    await EmailCampaignService.trackEmailOpen(req.params.campaignId, req.params.trackingId);
    
    // Return 1x1 transparent pixel
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.set('Content-Length', pixel.length);
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.send(pixel);
  } catch (error) {
    console.error('❌ Error in tracking endpoint:', error);
    // Still return pixel even on error
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.send(pixel);
  }
});

// Track email clicks (public endpoint for click tracking)
router.get('/:campaignId/track/click/:trackingId', async (req, res) => {
  try {
    const { url } = req.query;
    console.log(`🖱️ Email click tracked - Campaign: ${req.params.campaignId}, Tracking: ${req.params.trackingId}, URL: ${url}`);
    const targetUrl = await EmailCampaignService.trackEmailClick(req.params.campaignId, req.params.trackingId, url);
    res.redirect(targetUrl);
  } catch (error) {
    console.error('❌ Error in click tracking endpoint:', error);
    res.redirect(req.query.url || 'https://substate.com'); // Fallback redirect
  }
});

// Generate article now (on-demand generation)
router.post('/:campaignId/generate-article-now', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Check if user can access this campaign
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    if (campaign.campaignType !== 'CONTENT') {
      return res.status(400).json({ error: 'Article generation is only available for CONTENT campaigns' });
    }
    
    console.log(`🚀 Manual article generation requested for campaign: ${campaign.title}`);
    
    // Import automation service
    const CampaignAutomationService = (await import('../services/CampaignAutomationService.js')).default;
    
    // Calculate next publish time based on scheduled times
    const now = new Date();
    const scheduledTimes = campaign.campaignData?.content?.publishingSchedule?.scheduledTimes || [];
    
    let nextPublishTime = null;
    if (scheduledTimes.length > 0) {
      // Find next scheduled time today or tomorrow
      for (const st of scheduledTimes) {
        const [hours, minutes] = st.time.split(':');
        const publishTime = new Date(now);
        publishTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        if (publishTime > now) {
          nextPublishTime = publishTime;
          break;
        }
      }
      
      // If no time today, use first time tomorrow
      if (!nextPublishTime) {
        const [hours, minutes] = scheduledTimes[0].time.split(':');
        nextPublishTime = new Date(now);
        nextPublishTime.setDate(nextPublishTime.getDate() + 1);
        nextPublishTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }
    } else {
      // If no scheduled times, publish in 1 hour
      nextPublishTime = new Date(now.getTime() + 60 * 60 * 1000);
    }
    
    // Generate article
    const article = await CampaignAutomationService.generateAndScheduleArticle(campaign, nextPublishTime);
    
    console.log(`✅ Manual article generated: ${article.title}`);
    console.log(`   Scheduled for: ${nextPublishTime.toLocaleString()}`);
    
    res.json({
      success: true,
      message: 'Article generated successfully',
      article: {
        id: article._id,
        title: article.title,
        scheduledPublishAt: article.scheduledPublishAt,
        status: article.status
      },
      scheduledFor: nextPublishTime.toLocaleString()
    });
    
  } catch (error) {
    console.error('❌ Manual article generation failed:', error);
    res.status(500).json({ 
      error: 'Failed to generate article: ' + error.message 
    });
  }
});

// Get real-time tracking stats (lightweight endpoint for dashboard polling)
router.get('/:campaignId/tracking-stats', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId)
      .select('opensCount clicksCount conversionCount emailsSent status updatedAt')
      .lean();
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Check if user can access this campaign
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    res.json({
      opensCount: campaign.opensCount || 0,
      clicksCount: campaign.clicksCount || 0,
      conversionCount: campaign.conversionCount || 0,
      emailsSent: campaign.emailsSent || 0,
      openRate: campaign.emailsSent > 0 ? ((campaign.opensCount || 0) / campaign.emailsSent * 100).toFixed(2) : 0,
      clickRate: (campaign.opensCount || 0) > 0 ? ((campaign.clicksCount || 0) / (campaign.opensCount || 0) * 100).toFixed(2) : 0,
      status: campaign.status,
      lastUpdated: campaign.updatedAt
    });
  } catch (error) {
    console.error('Error fetching tracking stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== TRASH MANAGEMENT ====================

// Get trashed campaigns
router.get('/trash/list', verifyToken, async (req, res) => {
  try {
    console.log('📋 Fetching trashed campaigns for user:', req.userId);
    
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    
    const campaigns = await Campaign.find({
      userId: req.userId,
      isDeleted: true
    })
      .sort('-deletedAt')
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Campaign.countDocuments({
      userId: req.userId,
      isDeleted: true
    });
    
    console.log(`✅ Found ${campaigns.length} trashed campaigns (total: ${total})`);
    
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
    console.error('❌ Error fetching trashed campaigns:', error);
    res.status(500).json({ error: error.message });
  }
});

// Empty trash (delete all trashed campaigns) - Must be before /:campaignId/trash
router.delete('/trash/empty', verifyToken, async (req, res) => {
  try {
    const trashedCampaigns = await Campaign.find({
      userId: req.userId,
      isDeleted: true
    });
    
    // Delete associated articles for all trashed campaigns
    const campaignIds = trashedCampaigns.map(c => c._id);
    await Article.deleteMany({ campaignId: { $in: campaignIds } });
    
    // Permanently delete all trashed campaigns
    const result = await Campaign.deleteMany({
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

// Soft delete campaign (move to trash) - Must be before generic /:campaignId
router.delete('/:campaignId/trash', verifyToken, async (req, res) => {
  try {
    console.log('🗑️ Trash endpoint hit:', {
      campaignId: req.params.campaignId,
      userId: req.userId,
      path: req.path,
      body: req.body
    });
    
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      console.log('❌ Campaign not found:', req.params.campaignId);
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      console.log('❌ Unauthorized access:', {
        userId: req.userId,
        campaignUserId: campaign.userId
      });
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    // Get reason from body if provided, otherwise use empty string
    const reason = req.body?.reason || '';
    campaign.softDelete(req.userId, reason);
    await campaign.save({ validateBeforeSave: false });
    
    // Update user counts after moving to trash
    await UsageService.updateUserCounts(req.userId);
    
    console.log('✅ Campaign moved to trash successfully:', campaign._id);
    
    res.json({ 
      message: 'Campaign moved to trash',
      campaign 
    });
  } catch (error) {
    console.error('❌ Error moving campaign to trash:', error);
    res.status(500).json({ error: error.message });
  }
});

// Permanently delete campaign - Must be before generic /:campaignId
router.delete('/:campaignId/permanent', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    // Delete associated articles if any
    await Article.deleteMany({ campaignId: campaign._id });
    
    // Permanently delete the campaign
    await Campaign.findByIdAndDelete(req.params.campaignId);
    
    res.json({ 
      message: 'Campaign permanently deleted',
      campaignId: req.params.campaignId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Restore campaign from trash
router.post('/:campaignId/restore', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    if (!campaign.isDeleted) {
      return res.status(400).json({ error: 'Campaign is not in trash' });
    }
    
    campaign.restore();
    await campaign.save({ validateBeforeSave: false });
    
    // Update user counts after restoring
    await UsageService.updateUserCounts(req.userId);
    
    res.json({ 
      message: 'Campaign restored successfully',
      campaign 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Auto-generate email template using AI
router.post('/:campaignId/generate-email-template', verifyToken, async (req, res) => {
  try {
    console.log('🤖 Generating email template for campaign:', req.params.campaignId);
    
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    if (campaign.campaignType !== 'EMAIL') {
      return res.status(400).json({ error: 'This endpoint is only for EMAIL campaigns' });
    }
    
    // Get generation options from request body
    const { tone, style, includeImages } = req.body;
    
    // Generate email template
    const result = await EmailCampaignService.generateEmailTemplate(
      req.params.campaignId,
      req.userId,
      { tone, style, includeImages }
    );
    
    console.log('✅ Email template generated successfully');
    
    res.json({
      success: true,
      message: 'Email template generated successfully',
      template: result.template,
      campaign: result.campaign
    });
  } catch (error) {
    console.error('❌ Email template generation error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to generate email template. Please try again.'
    });
  }
});

// Regenerate email template with different options
router.post('/:campaignId/regenerate-email-template', verifyToken, async (req, res) => {
  try {
    console.log('🔄 Regenerating email template for campaign:', req.params.campaignId);
    
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    if (campaign.campaignType !== 'EMAIL') {
      return res.status(400).json({ error: 'This endpoint is only for EMAIL campaigns' });
    }
    
    // Get generation options from request body
    const { tone, style, includeImages } = req.body;
    
    // Regenerate email template
    const result = await EmailCampaignService.regenerateEmailTemplate(
      req.params.campaignId,
      req.userId,
      { tone, style, includeImages }
    );
    
    console.log('✅ Email template regenerated successfully');
    
    res.json({
      success: true,
      message: 'Email template regenerated successfully',
      template: result.template,
      campaign: result.campaign
    });
  } catch (error) {
    console.error('❌ Email template regeneration error:', error);
    res.status(500).json({ 
      error: error.message,
      details: 'Failed to regenerate email template. Please try again.'
    });
  }
});

// Get email campaign analytics
router.get('/:campaignId/email-analytics', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    if (campaign.campaignType !== 'EMAIL') {
      return res.status(400).json({ error: 'This endpoint is only for EMAIL campaigns' });
    }
    
    // Get email campaign analytics
    const analytics = await EmailCampaignService.getEmailCampaignAnalytics(
      req.params.campaignId,
      req.userId
    );
    
    res.json(analytics);
  } catch (error) {
    console.error('❌ Email campaign analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Schedule email campaign
router.post('/:campaignId/schedule-email', verifyToken, async (req, res) => {
  try {
    const { scheduledTime } = req.body;
    
    if (!scheduledTime) {
      return res.status(400).json({ error: 'scheduledTime is required' });
    }
    
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    if (campaign.campaignType !== 'EMAIL') {
      return res.status(400).json({ error: 'This endpoint is only for EMAIL campaigns' });
    }
    
    // Schedule email campaign
    const result = await EmailCampaignService.scheduleEmailCampaign(
      req.params.campaignId,
      req.userId,
      scheduledTime
    );
    
    console.log('✅ Email campaign scheduled successfully');
    
    res.json(result);
  } catch (error) {
    console.error('❌ Email campaign scheduling error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete campaign (generic) - Must be AFTER all specific routes
router.delete('/:campaignId', verifyToken, async (req, res) => {
  try {
    console.log('🗑️ Generic delete endpoint hit:', {
      campaignId: req.params.campaignId,
      userId: req.userId,
      path: req.path
    });
    
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Check if user can access this campaign (owner or admin)
    const hasAccess = await canAccessCampaign(req.userId, campaign);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    await Campaign.deleteOne({ _id: req.params.campaignId });
    res.json({ message: 'Campaign deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


export default router;


