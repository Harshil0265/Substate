import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Coupon from '../backend/models/Coupon.js';
import User from '../backend/models/User.js';

// Load environment variables
dotenv.config();

async function fixCoupons() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find admin user to set as creator
    let adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) {
      // Create a system admin user if none exists
      adminUser = new User({
        name: 'System Admin',
        email: 'admin@substate.com',
        password: 'temp_password',
        role: 'ADMIN',
        subscription: 'ENTERPRISE',
        subscriptionStatus: 'ACTIVE',
        emailVerified: true
      });
      await adminUser.save();
      console.log('✅ Created system admin user');
    }

    // Fix existing coupons - ensure they have proper plan types
    const existingCoupons = await Coupon.find({});
    console.log(`📋 Found ${existingCoupons.length} existing coupons to check`);

    for (const coupon of existingCoupons) {
      let updated = false;
      
      // Ensure applicablePlans is an array and has proper values
      if (!Array.isArray(coupon.applicablePlans)) {
        coupon.applicablePlans = ['ALL'];
        updated = true;
      }
      
      // Convert any lowercase plan names to uppercase
      coupon.applicablePlans = coupon.applicablePlans.map(plan => {
        if (typeof plan === 'string') {
          return plan.toUpperCase();
        }
        return plan;
      });
      
      // Ensure valid plan types
      const validPlans = ['ALL', 'PROFESSIONAL', 'ENTERPRISE', 'TRIAL'];
      coupon.applicablePlans = coupon.applicablePlans.filter(plan => validPlans.includes(plan));
      
      if (coupon.applicablePlans.length === 0) {
        coupon.applicablePlans = ['ALL'];
        updated = true;
      }
      
      if (updated) {
        await coupon.save();
        console.log(`✅ Fixed coupon: ${coupon.code} - Plans: ${coupon.applicablePlans.join(', ')}`);
      }
    }

    // Create some universal coupons for testing
    const testCoupons = [
      {
        code: 'WELCOME10',
        description: 'Welcome discount - 10% off any plan',
        discountType: 'PERCENTAGE',
        discountValue: 10,
        maxDiscount: null,
        minOrderAmount: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        usageLimit: null, // Unlimited
        applicablePlans: ['ALL'],
        restrictedToEmails: [],
        isActive: true
      },
      {
        code: 'SAVE20',
        description: 'Save 20% on Professional and Enterprise plans',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        maxDiscount: null,
        minOrderAmount: 10,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageLimit: null,
        applicablePlans: ['PROFESSIONAL', 'ENTERPRISE'],
        restrictedToEmails: [],
        isActive: true
      },
      {
        code: 'FIRST50',
        description: 'First-time user special - 50% off any plan',
        discountType: 'PERCENTAGE',
        discountValue: 50,
        maxDiscount: null,
        minOrderAmount: 1,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        usageLimit: 100, // Limited to 100 uses
        applicablePlans: ['ALL'],
        restrictedToEmails: [],
        isActive: true
      },
      {
        code: 'ENTERPRISE25',
        description: 'Enterprise plan special - 25% off',
        discountType: 'PERCENTAGE',
        discountValue: 25,
        maxDiscount: null,
        minOrderAmount: 20,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months
        usageLimit: null,
        applicablePlans: ['ENTERPRISE'],
        restrictedToEmails: [],
        isActive: true
      },
      {
        code: 'FIXED5',
        description: 'Fixed ₹5 discount on any plan',
        discountType: 'FIXED',
        discountValue: 5,
        maxDiscount: null,
        minOrderAmount: 10,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        usageLimit: null,
        applicablePlans: ['ALL'],
        restrictedToEmails: [],
        isActive: true
      }
    ];

    console.log('\n📝 Creating test coupons...');
    
    for (const couponData of testCoupons) {
      try {
        // Check if coupon already exists
        const existingCoupon = await Coupon.findOne({ code: couponData.code });
        if (existingCoupon) {
          console.log(`⚠️  Coupon ${couponData.code} already exists - updating...`);
          
          // Update existing coupon
          Object.assign(existingCoupon, couponData);
          existingCoupon.createdBy = adminUser._id;
          await existingCoupon.save();
          
          console.log(`✅ Updated coupon: ${couponData.code}`);
        } else {
          // Create new coupon
          const coupon = new Coupon({
            ...couponData,
            createdBy: adminUser._id,
            usedCount: 0,
            usedBy: []
          });
          
          await coupon.save();
          console.log(`✅ Created coupon: ${couponData.code} - ${couponData.discountValue}${couponData.discountType === 'PERCENTAGE' ? '%' : '₹'} off`);
        }
      } catch (error) {
        console.error(`❌ Error creating coupon ${couponData.code}:`, error.message);
      }
    }

    // Display all active coupons
    console.log('\n📋 All Active Coupons:');
    const allCoupons = await Coupon.find({ isActive: true }).sort({ code: 1 });
    
    for (const coupon of allCoupons) {
      const discount = coupon.discountType === 'PERCENTAGE' 
        ? `${coupon.discountValue}%` 
        : `₹${coupon.discountValue}`;
      
      const plans = coupon.applicablePlans.includes('ALL') 
        ? 'All Plans' 
        : coupon.applicablePlans.join(', ');
      
      const usage = coupon.usageLimit 
        ? `${coupon.usedCount}/${coupon.usageLimit}` 
        : `${coupon.usedCount}/∞`;
      
      console.log(`  ${coupon.code}: ${discount} off | ${plans} | Used: ${usage} | Valid until: ${coupon.validUntil.toDateString()}`);
    }

    console.log('\n🎉 Coupon system fixed and test coupons created!');
    console.log('\n📝 Test these coupons:');
    console.log('  - WELCOME10: 10% off any plan');
    console.log('  - SAVE20: 20% off Professional/Enterprise');
    console.log('  - FIRST50: 50% off any plan (limited time)');
    console.log('  - ENTERPRISE25: 25% off Enterprise plan');
    console.log('  - FIXED5: ₹5 off any plan');

  } catch (error) {
    console.error('❌ Error fixing coupons:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
fixCoupons();