import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Coupon from '../backend/models/Coupon.js';
import User from '../backend/models/User.js';

// Load environment variables
dotenv.config();

async function createSpecialCoupon() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user to set as creator (or create a system user)
    let adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) {
      // Create a system admin user if none exists
      adminUser = new User({
        name: 'System Admin',
        email: 'admin@substate.com',
        password: 'temp_password', // This should be hashed in real implementation
        role: 'ADMIN',
        subscription: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE'
      });
      await adminUser.save();
      console.log('✅ Created system admin user');
    }

    // Check if coupon already exists
    const existingCoupon = await Coupon.findOne({ code: 'HARSHIL50' });
    if (existingCoupon) {
      console.log('⚠️ Coupon HARSHIL50 already exists');
      return;
    }

    // Create special 50% off coupon for barotharshil070@gmail.com
    const specialCoupon = new Coupon({
      code: 'HARSHIL50',
      description: 'Special 50% discount for Harshil - Valid on any upgrade',
      discountType: 'PERCENTAGE',
      discountValue: 50, // 50% off
      maxDiscount: null, // No maximum discount limit
      minOrderAmount: 1, // Minimum ₹1 order
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Valid for 1 year
      usageLimit: 1, // Can only be used once
      usedCount: 0,
      applicablePlans: ['PRO', 'ENTERPRISE'], // Applicable to all paid plans
      restrictedToEmails: ['barotharshil070@gmail.com'], // Only for this specific email
      isActive: true,
      createdBy: adminUser._id,
      usedBy: []
    });

    await specialCoupon.save();
    console.log('✅ Special coupon created successfully:', {
      code: specialCoupon.code,
      discount: `${specialCoupon.discountValue}%`,
      validUntil: specialCoupon.validUntil,
      applicablePlans: specialCoupon.applicablePlans
    });

    console.log('🎉 Coupon HARSHIL50 is ready for barotharshil070@gmail.com');
    console.log('📧 The user can now apply this coupon for 50% off on any upgrade!');

  } catch (error) {
    console.error('❌ Error creating special coupon:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
createSpecialCoupon();