import express from 'express';
import User from '../models/User.js';
import RiskScore from '../models/RiskScore.js';
import verifyToken from '../middleware/auth.js';
import UsageService from '../services/UsageService.js';
import ReminderService from '../services/ReminderService.js';

const router = express.Router();

// Get user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    const riskScore = await RiskScore.findOne({ userId: req.userId });
    
    res.json({ user, riskScore });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user subscription data
router.get('/subscription', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('subscription subscriptionStatus subscriptionStartDate subscriptionEndDate');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      subscription: user.subscription,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionEndDate: user.subscriptionEndDate
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.patch('/profile', verifyToken, async (req, res) => {
  try {
    const { name, email, phone, company, website, bio } = req.body;
    
    // Check if email is being changed and if it already exists
    if (email) {
      const existingUser = await User.findOne({ 
        email, 
        _id: { $ne: req.userId } 
      });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }
    
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (company !== undefined) updateData.company = company;
    if (website !== undefined) updateData.website = website;
    if (bio !== undefined) updateData.bio = bio;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
router.patch('/change-password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long' });
    }
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify current password
    const bcrypt = await import('bcryptjs');
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    await User.findByIdAndUpdate(req.userId, { password: hashedPassword });
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update notification preferences
router.patch('/notifications', verifyToken, async (req, res) => {
  try {
    const { 
      emailNotifications, 
      campaignUpdates, 
      articlePublished, 
      weeklyReports, 
      marketingEmails 
    } = req.body;
    
    const updateData = {};
    if (emailNotifications !== undefined) updateData.emailNotifications = emailNotifications;
    if (campaignUpdates !== undefined) updateData.campaignUpdates = campaignUpdates;
    if (articlePublished !== undefined) updateData.articlePublished = articlePublished;
    if (weeklyReports !== undefined) updateData.weeklyReports = weeklyReports;
    if (marketingEmails !== undefined) updateData.marketingEmails = marketingEmails;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true }
    ).select('-password');
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user preferences (timezone, language, dashboard layout)
router.patch('/preferences', verifyToken, async (req, res) => {
  try {
    const { timezone, language, dashboardLayout } = req.body;
    
    const updateData = {};
    if (timezone !== undefined) updateData.timezone = timezone;
    if (language !== undefined) updateData.language = language;
    if (dashboardLayout !== undefined) updateData.dashboardLayout = dashboardLayout;
    
    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete account
router.delete('/account', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Delete user and related data
    await User.findByIdAndDelete(req.userId);
    await RiskScore.deleteMany({ userId: req.userId });
    
    // Note: In a production app, you might want to:
    // 1. Soft delete instead of hard delete
    // 2. Clean up related campaigns, articles, etc.
    // 3. Send confirmation email
    // 4. Add audit logging
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users (admin)
router.get('/list', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = '-createdAt' } = req.query;
    const skip = (page - 1) * limit;
    
    const users = await User.find()
      .select('-password')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await User.countDocuments();
    
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
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID with analytics
router.get('/:userId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('-password');
    const riskScore = await RiskScore.findOne({ userId: req.params.userId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user, riskScore });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user usage and limits
router.get('/usage/current', verifyToken, async (req, res) => {
  try {
    const usage = await UsageService.getUserUsage(req.userId);
    res.json(usage);
  } catch (error) {
    console.error('Error fetching usage:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get usage alerts
router.get('/usage/alerts', verifyToken, async (req, res) => {
  try {
    const alerts = await UsageService.getUsageAlerts(req.userId);
    res.json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if user can create campaign
router.get('/usage/can-create-campaign', verifyToken, async (req, res) => {
  try {
    const result = await UsageService.canCreateCampaign(req.userId);
    res.json(result);
  } catch (error) {
    console.error('Error checking campaign creation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Check if user can create article
router.get('/usage/can-create-article', verifyToken, async (req, res) => {
  try {
    const result = await UsageService.canCreateArticle(req.userId);
    res.json(result);
  } catch (error) {
    console.error('Error checking article creation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get reminder statistics
router.get('/usage/reminder-stats', verifyToken, async (req, res) => {
  try {
    // Check if user is admin (you might want to add admin middleware)
    const user = await User.findById(req.userId);
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = await ReminderService.getReminderStats();
    res.json(stats);
  } catch (error) {
    console.error('Error fetching reminder stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send test reminder (admin only)
router.post('/usage/test-reminder/:userId', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.userId);
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await ReminderService.sendTestReminder(req.params.userId);
    res.json(result);
  } catch (error) {
    console.error('Error sending test reminder:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
