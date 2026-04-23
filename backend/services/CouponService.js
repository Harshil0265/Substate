import Coupon from '../models/Coupon.js';

class CouponService {
  // Validate and apply coupon
  static async validateCoupon(code, userId, orderAmount, planType) {
    try {
      const coupon = await Coupon.findOne({ 
        code: code.toUpperCase(),
        isActive: true 
      });

      if (!coupon) {
        return {
          valid: false,
          reason: 'Invalid coupon code'
        };
      }

      // Get user email for validation
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(userId);
      if (!user) {
        return {
          valid: false,
          reason: 'User not found'
        };
      }

      // Check if coupon is valid for user
      const validation = coupon.isValidForUser(userId, orderAmount, planType, user.email);
      
      if (!validation.valid) {
        return validation;
      }

      // Calculate discount
      const discountAmount = coupon.calculateDiscount(orderAmount);
      const finalAmount = Math.max(0, orderAmount - discountAmount);

      return {
        valid: true,
        coupon: {
          id: coupon._id,
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue
        },
        discount: {
          amount: discountAmount,
          percentage: Math.round((discountAmount / orderAmount) * 100)
        },
        originalAmount: orderAmount,
        finalAmount: finalAmount,
        savings: discountAmount
      };
    } catch (error) {
      console.error('Error validating coupon:', error);
      return {
        valid: false,
        reason: 'Error validating coupon'
      };
    }
  }

  // Apply coupon (mark as used)
  static async applyCoupon(couponId, userId, orderAmount, discountAmount) {
    try {
      const coupon = await Coupon.findById(couponId);
      
      if (!coupon) {
        throw new Error('Coupon not found');
      }

      // Add usage record
      coupon.usedBy.push({
        userId,
        usedAt: new Date(),
        orderAmount,
        discountAmount
      });

      // Increment used count
      coupon.usedCount += 1;

      await coupon.save();

      return {
        success: true,
        message: 'Coupon applied successfully'
      };
    } catch (error) {
      console.error('Error applying coupon:', error);
      throw error;
    }
  }

  // Get available coupons for user
  static async getAvailableCoupons(userId, planType) {
    try {
      const now = new Date();
      
      // Get user email for email-restricted coupons
      const User = (await import('../models/User.js')).default;
      const user = await User.findById(userId);
      if (!user) {
        return [];
      }
      
      const coupons = await Coupon.find({
        isActive: true,
        validFrom: { $lte: now },
        validUntil: { $gte: now },
        $or: [
          { usageLimit: null },
          { $expr: { $lt: ['$usedCount', '$usageLimit'] } }
        ],
        $or: [
          { applicablePlans: 'ALL' },
          { applicablePlans: planType.toUpperCase() }
        ],
        'usedBy.userId': { $ne: userId },
        $or: [
          { restrictedToEmails: { $exists: false } },
          { restrictedToEmails: { $size: 0 } },
          { restrictedToEmails: user.email.toLowerCase() }
        ]
      }).select('code description discountType discountValue maxDiscount minOrderAmount validUntil');

      return coupons;
    } catch (error) {
      console.error('Error getting available coupons:', error);
      return [];
    }
  }

  // Create coupon (admin only)
  static async createCoupon(couponData, adminId) {
    try {
      const coupon = new Coupon({
        ...couponData,
        createdBy: adminId,
        code: couponData.code.toUpperCase()
      });

      await coupon.save();
      return coupon;
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Coupon code already exists');
      }
      throw error;
    }
  }

  // Get coupon usage statistics
  static async getCouponStats(couponId) {
    try {
      const coupon = await Coupon.findById(couponId)
        .populate('usedBy.userId', 'name email')
        .populate('createdBy', 'name email');

      if (!coupon) {
        throw new Error('Coupon not found');
      }

      const totalDiscount = coupon.usedBy.reduce((sum, usage) => sum + usage.discountAmount, 0);
      const totalOrders = coupon.usedBy.length;

      return {
        coupon,
        stats: {
          totalUsage: totalOrders,
          totalDiscount,
          averageDiscount: totalOrders > 0 ? totalDiscount / totalOrders : 0,
          remainingUsage: coupon.usageLimit ? coupon.usageLimit - coupon.usedCount : 'Unlimited'
        }
      };
    } catch (error) {
      console.error('Error getting coupon stats:', error);
      throw error;
    }
  }
}

export default CouponService;