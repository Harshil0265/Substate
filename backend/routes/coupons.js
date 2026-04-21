import express from 'express';
import CouponService from '../services/CouponService.js';
import verifyToken from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// Validate coupon
router.post('/validate', verifyToken, async (req, res) => {
  try {
    const { code, orderAmount, planType } = req.body;

    if (!code || !orderAmount || !planType) {
      return res.status(400).json({ 
        error: 'Coupon code, order amount, and plan type are required' 
      });
    }

    const result = await CouponService.validateCoupon(
      code, 
      req.userId, 
      orderAmount, 
      planType
    );

    res.json(result);
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

// Get available coupons for user
router.get('/available', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    const coupons = await CouponService.getAvailableCoupons(
      req.userId, 
      user.subscription
    );

    res.json({ coupons });
  } catch (error) {
    console.error('Error getting available coupons:', error);
    res.status(500).json({ error: 'Failed to get available coupons' });
  }
});

// Apply coupon (called during payment)
router.post('/apply', verifyToken, async (req, res) => {
  try {
    const { couponId, orderAmount, discountAmount } = req.body;

    if (!couponId || !orderAmount || discountAmount === undefined) {
      return res.status(400).json({ 
        error: 'Coupon ID, order amount, and discount amount are required' 
      });
    }

    const result = await CouponService.applyCoupon(
      couponId, 
      req.userId, 
      orderAmount, 
      discountAmount
    );

    res.json(result);
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin routes
// Create coupon (admin only)
router.post('/admin/create', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const coupon = await CouponService.createCoupon(req.body, req.userId);
    res.status(201).json({ coupon });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get all coupons (admin only)
router.get('/admin/list', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const coupons = await Coupon.find()
      .populate('createdBy', 'name email')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Coupon.countDocuments();

    res.json({
      coupons,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting coupons:', error);
    res.status(500).json({ error: 'Failed to get coupons' });
  }
});

// Get coupon statistics (admin only)
router.get('/admin/stats/:couponId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = await CouponService.getCouponStats(req.params.couponId);
    res.json(stats);
  } catch (error) {
    console.error('Error getting coupon stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update coupon (admin only)
router.put('/admin/:couponId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const coupon = await Coupon.findByIdAndUpdate(
      req.params.couponId,
      req.body,
      { new: true }
    );

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.json({ coupon });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete coupon (admin only)
router.delete('/admin/:couponId', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const coupon = await Coupon.findByIdAndDelete(req.params.couponId);

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    res.json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;