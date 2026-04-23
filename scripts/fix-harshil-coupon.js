import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Coupon from '../backend/models/Coupon.js';

// Load environment variables
dotenv.config();

async function fixHarshilCoupon() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find and fix the HARSHIL50 coupon
    const harshilCoupon = await Coupon.findOne({ code: 'HARSHIL50' });
    
    if (harshilCoupon) {
      console.log('📋 Found HARSHIL50 coupon:', {
        code: harshilCoupon.code,
        applicablePlans: harshilCoupon.applicablePlans,
        discountValue: harshilCoupon.discountValue
      });

      // Fix the plan names
      harshilCoupon.applicablePlans = ['PROFESSIONAL', 'ENTERPRISE'];
      await harshilCoupon.save();

      console.log('✅ Fixed HARSHIL50 coupon - updated applicable plans to:', harshilCoupon.applicablePlans);
    } else {
      console.log('❌ HARSHIL50 coupon not found');
    }

    // Also check and fix any other coupons with incorrect plan names
    const couponsWithIncorrectPlans = await Coupon.find({
      applicablePlans: { $in: ['PRO', 'PROF'] }
    });

    for (const coupon of couponsWithIncorrectPlans) {
      console.log(`📋 Fixing coupon ${coupon.code} with incorrect plans:`, coupon.applicablePlans);
      
      // Replace incorrect plan names
      coupon.applicablePlans = coupon.applicablePlans.map(plan => {
        if (plan === 'PRO' || plan === 'PROF') {
          return 'PROFESSIONAL';
        }
        return plan;
      });
      
      await coupon.save();
      console.log(`✅ Fixed coupon ${coupon.code} - new plans:`, coupon.applicablePlans);
    }

    console.log('🎉 All coupons fixed!');

  } catch (error) {
    console.error('❌ Error fixing coupons:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
fixHarshilCoupon();