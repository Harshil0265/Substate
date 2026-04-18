import express from 'express';
import User from '../models/User.js';
import RiskScore from '../models/RiskScore.js';
import verifyToken from '../middleware/auth.js';

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

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { name },
      { new: true }
    ).select('-password');
    
    res.json(user);
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

export default router;
