import express from 'express';
import mongoose from 'mongoose';
import Campaign from '../models/Campaign.js';
import verifyToken from '../middleware/auth.js';
import UsageService from '../services/UsageService.js';

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
    
    const campaign = new Campaign(campaignData);
    await campaign.save();
    
    // Update user counts
    await UsageService.updateUserCounts(req.userId);
    
    // Send usage notifications if approaching limits
    await UsageService.sendUsageNotifications(req.userId);
    
    res.status(201).json({ 
      campaign,
      remaining: canCreate.remaining
    });
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

export default router;
