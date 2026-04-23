import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  discountType: {
    type: String,
    enum: ['PERCENTAGE', 'FIXED'],
    required: true
  },
  discountValue: {
    type: Number,
    required: true,
    min: 0
  },
  maxDiscount: {
    type: Number,
    default: null // For percentage discounts, max discount amount
  },
  minOrderAmount: {
    type: Number,
    default: 0
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  applicablePlans: [{
    type: String,
    enum: ['PROFESSIONAL', 'ENTERPRISE', 'ALL'],
    default: 'ALL'
  }],
  restrictedToEmails: [{
    type: String,
    lowercase: true,
    trim: true
  }], // If specified, only these emails can use the coupon
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  usedBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    orderAmount: Number,
    discountAmount: Number
  }]
}, { timestamps: true });

// Index for efficient queries
couponSchema.index({ code: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });
couponSchema.index({ isActive: 1 });

// Method to check if coupon is valid
couponSchema.methods.isValidForUser = function(userId, orderAmount, planType, userEmail) {
  const now = new Date();
  
  // Check if coupon is active
  if (!this.isActive) {
    return { valid: false, reason: 'Coupon is not active' };
  }
  
  // Check date validity
  if (now < this.validFrom || now > this.validUntil) {
    return { valid: false, reason: 'Coupon has expired or not yet valid' };
  }
  
  // Check usage limit
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, reason: 'Coupon usage limit exceeded' };
  }
  
  // Check if user has already used this coupon
  const userUsage = this.usedBy.find(usage => usage.userId.toString() === userId.toString());
  if (userUsage) {
    return { valid: false, reason: 'You have already used this coupon' };
  }
  
  // Check email restriction
  if (this.restrictedToEmails && this.restrictedToEmails.length > 0) {
    if (!userEmail || !this.restrictedToEmails.includes(userEmail.toLowerCase())) {
      return { valid: false, reason: 'This coupon is not available for your account' };
    }
  }
  
  // Check minimum order amount
  if (orderAmount < this.minOrderAmount) {
    return { valid: false, reason: `Minimum order amount is ₹${this.minOrderAmount}` };
  }
  
  // Check applicable plans - normalize plan type to uppercase
  const normalizedPlanType = planType ? planType.toString().toUpperCase() : '';
  const normalizedApplicablePlans = this.applicablePlans.map(plan => plan.toString().toUpperCase());
  
  if (!normalizedApplicablePlans.includes('ALL') && !normalizedApplicablePlans.includes(normalizedPlanType)) {
    return { valid: false, reason: 'Coupon not applicable for this plan!' };
  }
  
  return { valid: true };
};

// Method to calculate discount
couponSchema.methods.calculateDiscount = function(orderAmount) {
  let discountAmount = 0;
  
  if (this.discountType === 'PERCENTAGE') {
    discountAmount = (orderAmount * this.discountValue) / 100;
    if (this.maxDiscount && discountAmount > this.maxDiscount) {
      discountAmount = this.maxDiscount;
    }
  } else if (this.discountType === 'FIXED') {
    discountAmount = Math.min(this.discountValue, orderAmount);
  }
  
  return Math.round(discountAmount * 100) / 100; // Round to 2 decimal places
};

const Coupon = mongoose.model('Coupon', couponSchema);

export default Coupon;