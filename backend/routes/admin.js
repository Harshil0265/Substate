import express from 'express';
import User from '../models/User.js';
import Campaign from '../models/Campaign.js';
import Article from '../models/Article.js';
import Payment from '../models/Payment.js';
import Coupon from '../models/Coupon.js';
import ContentModerationService from '../services/ContentModerationService.js';
import EmailService from '../services/EmailService.js';
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
    const payments = await Payment.find({ status: 'COMPLETED' });
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
    
    // Get subscription status breakdown
    const subscriptionStatusStats = await User.aggregate([
      {
        $group: {
          _id: '$subscriptionStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get user state breakdown (combining locked accounts)
    const userStateStats = await User.aggregate([
      {
        $addFields: {
          userState: {
            $cond: {
              if: { $or: [{ $eq: ['$accountLocked', true] }, { $eq: ['$subscriptionStatus', 'LOCKED'] }] },
              then: 'LOCKED',
              else: {
                $cond: {
                  if: { $eq: ['$subscriptionStatus', 'ACTIVE'] },
                  then: '$subscription',
                  else: '$subscriptionStatus'
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: '$userState',
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
      totalRevenue: totalRevenue, // Amount is already in rupees
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
        subscriptionStatusBreakdown: subscriptionStatusStats,
        userStateBreakdown: userStateStats,
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
    const { page = 1, limit = 50, search = '', subscription = '', status = '' } = req.query;
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Handle subscription filter (TRIAL, PROFESSIONAL, ENTERPRISE)
    if (subscription && ['TRIAL', 'PROFESSIONAL', 'ENTERPRISE'].includes(subscription)) {
      filter.subscription = subscription;
    }
    
    // Handle status filter (ACTIVE, EXPIRED, CANCELLED, SUSPENDED, LOCKED)
    if (status) {
      if (status === 'LOCKED') {
        filter.$or = [
          { accountLocked: true },
          { subscriptionStatus: 'LOCKED' }
        ];
      } else if (['ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED'].includes(status)) {
        filter.subscriptionStatus = status;
      }
    }
    
    // Handle legacy filter parameter (for backward compatibility)
    if (req.query.filter) {
      const filterValue = req.query.filter;
      if (['TRIAL', 'PROFESSIONAL', 'ENTERPRISE'].includes(filterValue)) {
        filter.subscription = filterValue;
      } else if (['ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED', 'LOCKED'].includes(filterValue)) {
        if (filterValue === 'LOCKED') {
          filter.$or = [
            { accountLocked: true },
            { subscriptionStatus: 'LOCKED' }
          ];
        } else {
          filter.subscriptionStatus = filterValue;
        }
      }
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

// Protected users - NEVER suspend, block, or lock these accounts
const PROTECTED_USERS = [
  'barotashokbhai03044@gmail.com', // Admin user
  'barotharshil070@gmail.com'      // Active user
];

// Update user (suspend/activate/reactivate/suspend-subscription)
router.patch('/users/:userId', verifyToken, isAdmin, async (req, res) => {
  try {
    const { action } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // PROTECTION: Prevent actions on admin users
    if (user.role === 'ADMIN') {
      return res.status(403).json({ 
        error: `Cannot ${action} admin user: ${user.email}. Admin users have unlimited access and cannot be modified.` 
      });
    }

    // PROTECTION: Prevent actions on protected users
    if (PROTECTED_USERS.includes(user.email.toLowerCase())) {
      if (['suspend', 'suspend-subscription', 'expire', 'cancel'].includes(action)) {
        return res.status(403).json({ 
          error: `Cannot ${action} protected user: ${user.email}. This account is protected from administrative actions.` 
        });
      }
    }
    
    switch (action) {
      case 'suspend':
        // Lock the account completely
        user.accountLocked = true;
        user.subscriptionStatus = 'LOCKED';
        user.lockedUntil = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year
        user.lockReason = 'Admin action - Account suspended';
        break;
        
      case 'activate':
        // Unlock the account and restore to active
        user.accountLocked = false;
        user.subscriptionStatus = 'ACTIVE';
        user.lockedUntil = null;
        user.lockReason = null;
        user.failedLoginAttempts = 0;
        break;
        
      case 'suspend-subscription':
        // Suspend subscription but keep account accessible
        user.subscriptionStatus = 'SUSPENDED';
        user.accountLocked = false; // Keep account accessible for reactivation
        break;
        
      case 'reactivate':
        // Reactivate suspended subscription
        user.subscriptionStatus = 'ACTIVE';
        user.accountLocked = false;
        break;
        
      case 'expire':
        // Mark subscription as expired
        user.subscriptionStatus = 'EXPIRED';
        break;
        
      case 'cancel':
        // Mark subscription as cancelled
        user.subscriptionStatus = 'CANCELLED';
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
    
    await user.save();
    
    res.json({ 
      message: `User ${action}d successfully`, 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        subscription: user.subscription,
        subscriptionStatus: user.subscriptionStatus,
        accountLocked: user.accountLocked,
        emailVerified: user.emailVerified
      }
    });
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

// Get detailed user information
router.get('/users/:userId/details', verifyToken, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('subscriptionHistory.changedBy', 'name email')
      .populate('passwordResetHistory.resetBy', 'name email')
      .populate('trialExtensions.extendedBy', 'name email')
      .populate('manualVerification.verifiedBy', 'name email')
      .populate('riskAssessment.assessedBy', 'name email')
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get payment history
    const payments = await Payment.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get campaigns and articles count with recent activity
    const [campaigns, articles] = await Promise.all([
      Campaign.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5),
      Article.find({ userId: user._id }).sort({ createdAt: -1 }).limit(5)
    ]);

    // Calculate usage statistics
    const usageStats = {
      totalCampaigns: user.campaignCount || 0,
      totalArticles: user.articleCount || 0,
      recentCampaigns: campaigns,
      recentArticles: articles,
      loginFrequency: user.loginHistory?.length || 0,
      lastLogin: user.lastLogin,
      accountAge: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
    };

    res.json({
      user,
      paymentHistory: payments,
      usageStats,
      riskScores: {
        overall: user.riskScore || 0,
        churn: user.riskAssessment?.churnRisk || 0,
        payment: user.riskAssessment?.paymentRisk || 0,
        activity: user.riskAssessment?.activityRisk || 0
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Change user subscription plan
router.patch('/users/:userId/subscription', verifyToken, isAdmin, async (req, res) => {
  try {
    const { newPlan, reason, effectiveDate } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent changing admin users
    if (user.role === 'ADMIN') {
      return res.status(403).json({ 
        error: 'Cannot change subscription for admin users' 
      });
    }

    // Validate new plan
    if (!['TRIAL', 'PROFESSIONAL', 'ENTERPRISE'].includes(newPlan)) {
      return res.status(400).json({ error: 'Invalid subscription plan' });
    }

    const previousPlan = user.subscription;
    
    // Add to subscription history
    user.subscriptionHistory.push({
      previousPlan,
      newPlan,
      changedBy: req.userId,
      reason: reason || 'Admin initiated change',
      effectiveDate: effectiveDate ? new Date(effectiveDate) : new Date()
    });

    // Update subscription
    user.subscription = newPlan;
    
    // Update subscription dates based on new plan
    const now = new Date();
    if (newPlan === 'TRIAL') {
      user.subscriptionStartDate = now;
      user.subscriptionEndDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
    } else {
      user.subscriptionStartDate = effectiveDate ? new Date(effectiveDate) : now;
      user.subscriptionEndDate = new Date((effectiveDate ? new Date(effectiveDate) : now).getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
    }

    await user.save();

    res.json({ 
      message: `Subscription changed from ${previousPlan} to ${newPlan}`,
      user: {
        _id: user._id,
        subscription: user.subscription,
        subscriptionStartDate: user.subscriptionStartDate,
        subscriptionEndDate: user.subscriptionEndDate
      }
    });
  } catch (error) {
    console.error('Change subscription error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reset user password (admin initiated)
router.patch('/users/:userId/reset-password', verifyToken, isAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent resetting admin passwords
    if (user.role === 'ADMIN') {
      return res.status(403).json({ 
        error: 'Cannot reset password for admin users' 
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    
    // Hash the temporary password
    const bcrypt = await import('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(tempPassword, salt);

    // Add to password reset history
    user.passwordResetHistory.push({
      resetBy: req.userId,
      reason: reason || 'Admin initiated reset'
    });

    // Reset failed login attempts
    user.failedLoginAttempts = 0;
    user.accountLocked = false;
    user.lockedUntil = null;

    await user.save();

    res.json({ 
      message: 'Password reset successfully',
      temporaryPassword: tempPassword,
      note: 'User should change this password on next login'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Extend trial period
router.patch('/users/:userId/extend-trial', verifyToken, isAdmin, async (req, res) => {
  try {
    const { days, reason } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.subscription !== 'TRIAL') {
      return res.status(400).json({ error: 'User is not on trial plan' });
    }

    if (!days || days < 1 || days > 90) {
      return res.status(400).json({ error: 'Days must be between 1 and 90' });
    }

    const previousEndDate = user.subscriptionEndDate;
    const newEndDate = new Date(previousEndDate.getTime() + days * 24 * 60 * 60 * 1000);

    // Add to trial extensions history
    user.trialExtensions.push({
      extendedBy: req.userId,
      daysAdded: days,
      reason: reason || 'Admin extension',
      previousEndDate,
      newEndDate
    });

    user.subscriptionEndDate = newEndDate;
    await user.save();

    res.json({ 
      message: `Trial extended by ${days} days`,
      newEndDate,
      previousEndDate
    });
  } catch (error) {
    console.error('Extend trial error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manual email verification
router.patch('/users/:userId/verify-email', verifyToken, isAdmin, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email is already verified' });
    }

    user.emailVerified = true;
    user.verifiedAt = new Date();
    user.manualVerification = {
      verifiedBy: req.userId,
      verificationDate: new Date(),
      reason: reason || 'Admin manual verification'
    };

    await user.save();

    res.json({ 
      message: 'Email verified manually',
      verifiedAt: user.verifiedAt
    });
  } catch (error) {
    console.error('Manual verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update risk scores
router.patch('/users/:userId/risk-assessment', verifyToken, isAdmin, async (req, res) => {
  try {
    const { churnRisk, paymentRisk, activityRisk, overallRisk, notes } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate risk scores (0-100)
    const validateScore = (score) => score >= 0 && score <= 100;
    
    if (churnRisk !== undefined && !validateScore(churnRisk)) {
      return res.status(400).json({ error: 'Churn risk must be between 0 and 100' });
    }
    if (paymentRisk !== undefined && !validateScore(paymentRisk)) {
      return res.status(400).json({ error: 'Payment risk must be between 0 and 100' });
    }
    if (activityRisk !== undefined && !validateScore(activityRisk)) {
      return res.status(400).json({ error: 'Activity risk must be between 0 and 100' });
    }
    if (overallRisk !== undefined && !validateScore(overallRisk)) {
      return res.status(400).json({ error: 'Overall risk must be between 0 and 100' });
    }

    // Update risk assessment
    user.riskAssessment = {
      churnRisk: churnRisk !== undefined ? churnRisk : user.riskAssessment?.churnRisk || 0,
      paymentRisk: paymentRisk !== undefined ? paymentRisk : user.riskAssessment?.paymentRisk || 0,
      activityRisk: activityRisk !== undefined ? activityRisk : user.riskAssessment?.activityRisk || 0,
      lastAssessment: new Date(),
      assessedBy: req.userId
    };

    if (overallRisk !== undefined) {
      user.riskScore = overallRisk;
    }

    await user.save();

    res.json({ 
      message: 'Risk assessment updated',
      riskAssessment: user.riskAssessment,
      overallRisk: user.riskScore
    });
  } catch (error) {
    console.error('Update risk assessment error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user activity log
router.get('/users/:userId/activity-log', verifyToken, isAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Combine all activity types with timestamps
    const activities = [];

    // Login history
    user.loginHistory?.forEach(login => {
      activities.push({
        type: 'LOGIN',
        timestamp: login.timestamp,
        details: {
          ipAddress: login.ipAddress,
          userAgent: login.userAgent,
          location: login.location
        }
      });
    });

    // Subscription changes
    user.subscriptionHistory?.forEach(change => {
      activities.push({
        type: 'SUBSCRIPTION_CHANGE',
        timestamp: change.changeDate,
        details: {
          from: change.previousPlan,
          to: change.newPlan,
          reason: change.reason,
          changedBy: change.changedBy
        }
      });
    });

    // Password resets
    user.passwordResetHistory?.forEach(reset => {
      activities.push({
        type: 'PASSWORD_RESET',
        timestamp: reset.timestamp,
        details: {
          resetBy: reset.resetBy,
          reason: reset.reason
        }
      });
    });

    // Trial extensions
    user.trialExtensions?.forEach(extension => {
      activities.push({
        type: 'TRIAL_EXTENSION',
        timestamp: extension.extensionDate,
        details: {
          daysAdded: extension.daysAdded,
          reason: extension.reason,
          extendedBy: extension.extendedBy
        }
      });
    });

    // Sort by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedActivities = activities.slice(startIndex, startIndex + parseInt(limit));

    res.json({
      activities: paginatedActivities,
      pagination: {
        total: activities.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(activities.length / limit)
      }
    });
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({ error: error.message });
  }
});
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
    const payments = await Payment.find({ status: 'COMPLETED' });
    const revenueStats = {
      total: payments.reduce((sum, p) => sum + (p.amount || 0), 0), // Amount is already in rupees
      count: payments.length,
      byPlan: await Payment.aggregate([
        { $match: { status: 'COMPLETED' } },
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

// Send discount coupon to user
router.post('/users/:userId/send-discount', verifyToken, isAdmin, async (req, res) => {
  try {
    const { discountPercent } = req.body;
    const user = await User.findById(req.params.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Validate discount percentage
    const validDiscounts = [10, 15, 30, 50];
    if (!validDiscounts.includes(discountPercent)) {
      return res.status(400).json({ error: 'Invalid discount percentage. Must be 10, 15, 30, or 50' });
    }

    // Generate unique coupon code
    const couponCode = `ADMIN${discountPercent}-${user.name.substring(0, 3).toUpperCase()}${Date.now().toString().slice(-6)}`;
    
    // Create coupon in database
    const coupon = new Coupon({
      code: couponCode,
      description: `${discountPercent}% discount - Admin reward for ${user.name}`,
      discountType: 'PERCENTAGE',
      discountValue: discountPercent,
      maxDiscount: null,
      minOrderAmount: 0,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days validity
      usageLimit: 1,
      usedCount: 0,
      applicablePlans: ['PROFESSIONAL', 'ENTERPRISE'],
      restrictedToEmails: [user.email.toLowerCase()],
      isActive: true,
      createdBy: req.userId
    });

    await coupon.save();

    // Send email to user
    await EmailService.sendDiscountCouponEmail(user, {
      code: couponCode,
      discount: discountPercent,
      validUntil: coupon.validUntil
    });

    res.json({ 
      message: `${discountPercent}% discount coupon sent to ${user.email}`,
      couponCode,
      validUntil: coupon.validUntil
    });
  } catch (error) {
    console.error('Send discount error:', error);
    res.status(500).json({ error: error.message });
  }
});
