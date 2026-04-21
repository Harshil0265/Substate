import express from 'express';
import User from '../models/User.js';
import Campaign from '../models/Campaign.js';
import Article from '../models/Article.js';
import Payment from '../models/Payment.js';
import ContentModerationService from '../services/ContentModerationService.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get admin overview
router.get('/overview', verifyToken, isAdmin, async (req, res) => {
  try {
    // Get total counts
    const totalUsers = await User.countDocuments();
    const totalCampaigns = await Campaign.countDocuments();
    const totalArticles = await Article.countDocuments();
    
    // Get total revenue from payments
    const payments = await Payment.find({ status: 'SUCCESS' });
    const totalRevenue = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Get recent users (last 10)
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email createdAt subscription emailVerified');
    
    // Get recent campaigns (last 10)
    const recentCampaigns = await Campaign.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .select('title status createdAt userId articlesGenerated');
    
    // Get subscription breakdown
    const subscriptionStats = await User.aggregate([
      {
        $group: {
          _id: '$subscription',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get campaign status breakdown
    const campaignStats = await Campaign.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      totalUsers,
      totalCampaigns,
      totalArticles,
      totalRevenue: totalRevenue / 100, // Convert from paise to rupees
      recentUsers,
      recentCampaigns: recentCampaigns.map(c => ({
        _id: c._id,
        name: c.title,
        status: c.status,
        createdAt: c.createdAt,
        owner: c.userId
      })),
      systemStats: {
        subscriptionBreakdown: subscriptionStats,
        campaignBreakdown: campaignStats
      }
    });
  } catch (error) {
    console.error('Admin overview error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get('/users', verifyToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '', subscription = '' } = req.query;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (subscription) {
      filter.subscription = subscription;
    }
    
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-password');
    
    const total = await User.countDocuments(filter);
    
    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get campaigns with moderation status
router.get('/campaigns', verifyToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status = '', moderationStatus = '' } = req.query;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (status) {
      filter.status = status;
    }
    if (moderationStatus) {
      filter['moderationStatus.status'] = moderationStatus;
    }
    
    const campaigns = await Campaign.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email violationCount')
      .populate('moderationStatus.reviewedBy', 'name');
    
    const total = await Campaign.countDocuments(filter);
    
    res.json({
      campaigns: campaigns.map(c => ({
        _id: c._id,
        name: c.title,
        owner: c.userId,
        budget: c.roi?.investment || 0,
        status: c.status,
        moderationStatus: c.moderationStatus,
        createdAt: c.createdAt,
        articlesGenerated: c.articlesGenerated
      })),
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Admin campaigns error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get campaigns requiring moderation review
router.get('/campaigns/moderation', verifyToken, isAdmin, async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      $or: [
        { 'moderationStatus.status': 'UNDER_REVIEW' },
        { 'moderationStatus.requiresManualReview': true },
        { 'moderationStatus.status': 'PENDING' }
      ]
    })
    .sort({ createdAt: -1 })
    .populate('userId', 'name email violationCount')
    .limit(50);

    res.json({ campaigns });
  } catch (error) {
    console.error('Admin moderation campaigns error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Moderate campaign (approve/reject/block)
router.patch('/campaigns/:campaignId/moderate', verifyToken, isAdmin, async (req, res) => {
  try {
    const { action, adminNotes } = req.body;
    const campaign = await Campaign.findById(req.params.campaignId).populate('userId');
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Update moderation status
    campaign.moderationStatus.reviewedBy = req.userId;
    campaign.moderationStatus.reviewedAt = new Date();
    campaign.moderationStatus.adminNotes = adminNotes;
    
    if (action === 'approve') {
      campaign.moderationStatus.status = 'APPROVED';
      campaign.status = 'RUNNING';
    } else if (action === 'reject') {
      campaign.moderationStatus.status = 'REJECTED';
      campaign.status = 'PAUSED';
    } else if (action === 'block') {
      campaign.moderationStatus.status = 'BLOCKED';
      campaign.status = 'BLOCKED';
      
      // Record violation if there are any
      if (campaign.moderationStatus.violations && campaign.moderationStatus.violations.length > 0) {
        for (const violation of campaign.moderationStatus.violations) {
          await ContentModerationService.recordViolation(
            campaign.userId._id, 
            violation, 
            campaign._id
          );
        }
      }
    }
    
    await campaign.save();
    
    res.json({ 
      message: `Campaign ${action}ed successfully`, 
      campaign,
      userStatus: campaign.userId.accountLocked ? 'suspended' : 'active'
    });
  } catch (error) {
    console.error('Admin campaign moderation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get moderation statistics
router.get('/moderation/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    const stats = await ContentModerationService.getModerationStats();
    
    // Get campaign moderation stats
    const campaignStats = await Campaign.aggregate([
      {
        $group: {
          _id: '$moderationStatus.status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const pendingReview = await Campaign.countDocuments({
      $or: [
        { 'moderationStatus.status': 'UNDER_REVIEW' },
        { 'moderationStatus.requiresManualReview': true }
      ]
    });
    
    res.json({
      ...stats,
      campaignModeration: campaignStats,
      pendingReview
    });
  } catch (error) {
    console.error('Admin moderation stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all articles
router.get('/articles', verifyToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, status = '' } = req.query;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (status) {
      filter.status = status;
    }
    
    const articles = await Article.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .populate('campaignId', 'title');
    
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
    console.error('Admin articles error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user (suspend/activate)
router.patch('/users/:userId', verifyToken, isAdmin, async (req, res) => {
  try {
    const { action } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (action === 'suspend') {
      user.accountLocked = true;
      user.lockedUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
    } else if (action === 'activate') {
      user.accountLocked = false;
      user.lockedUntil = null;
      user.failedLoginAttempts = 0;
    }
    
    await user.save();
    
    res.json({ message: `User ${action}d successfully`, user });
  } catch (error) {
    console.error('Admin user action error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update campaign (approve/reject)
router.patch('/campaigns/:campaignId', verifyToken, isAdmin, async (req, res) => {
  try {
    const { action } = req.body;
    const campaign = await Campaign.findById(req.params.campaignId);
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    if (action === 'approve') {
      campaign.status = 'RUNNING';
    } else if (action === 'reject') {
      campaign.status = 'PAUSED';
    }
    
    await campaign.save();
    
    res.json({ message: `Campaign ${action}d successfully`, campaign });
  } catch (error) {
    console.error('Admin campaign action error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get system statistics
router.get('/stats', verifyToken, isAdmin, async (req, res) => {
  try {
    // User statistics
    const userStats = {
      total: await User.countDocuments(),
      verified: await User.countDocuments({ emailVerified: true }),
      active: await User.countDocuments({ 
        lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
      }),
      bySubscription: await User.aggregate([
        { $group: { _id: '$subscription', count: { $sum: 1 } } }
      ])
    };
    
    // Campaign statistics
    const campaignStats = {
      total: await Campaign.countDocuments(),
      byStatus: await Campaign.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      byType: await Campaign.aggregate([
        { $group: { _id: '$campaignType', count: { $sum: 1 } } }
      ])
    };
    
    // Article statistics
    const articleStats = {
      total: await Article.countDocuments(),
      published: await Article.countDocuments({ status: 'PUBLISHED' }),
      draft: await Article.countDocuments({ status: 'DRAFT' }),
      totalViews: await Article.aggregate([
        { $group: { _id: null, total: { $sum: '$views' } } }
      ])
    };
    
    // Revenue statistics
    const payments = await Payment.find({ status: 'SUCCESS' });
    const revenueStats = {
      total: payments.reduce((sum, p) => sum + (p.amount || 0), 0) / 100,
      count: payments.length,
      byPlan: await Payment.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: '$plan', total: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
    };
    
    res.json({
      users: userStats,
      campaigns: campaignStats,
      articles: articleStats,
      revenue: revenueStats
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
