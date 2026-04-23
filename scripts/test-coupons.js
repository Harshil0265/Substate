import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CouponService from '../backend/services/CouponService.js';
import User from '../backend/models/User.js';

// Load environment variables
dotenv.config();

async function testCoupons() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a test user (or create one)
    let testUser = await User.findOne({ email: { $ne: 'admin@substate.com' } });
    if (!testUser) {
      testUser = new User({
        name: 'Test User',
        email: 'test@example.com',
        password: 'test_password',
        role: 'USER',
        subscription: 'TRIAL',
        subscriptionStatus: 'ACTIVE',
        emailVerified: true
      });
      await testUser.save();
      console.log('✅ Created test user');
    }

    console.log('👤 Using test user:', {
      id: testUser._id,
      email: testUser.email,
      subscription: testUser.subscription
    });

    // Test different coupon scenarios
    const testScenarios = [
      {
        name: 'WELCOME10 with PROFESSIONAL plan',
        code: 'WELCOME10',
        planType: 'PROFESSIONAL',
        orderAmount: 10
      },
      {
        name: 'SAVE20 with PROFESSIONAL plan',
        code: 'SAVE20',
        planType: 'PROFESSIONAL',
        orderAmount: 10
      },
      {
        name: 'SAVE20 with ENTERPRISE plan',
        code: 'SAVE20',
        planType: 'ENTERPRISE',
        orderAmount: 20
      },
      {
        name: 'FIRST50 with PROFESSIONAL plan',
        code: 'FIRST50',
        planType: 'PROFESSIONAL',
        orderAmount: 10
      },
      {
        name: 'ENTERPRISE25 with ENTERPRISE plan',
        code: 'ENTERPRISE25',
        planType: 'ENTERPRISE',
        orderAmount: 20
      },
      {
        name: 'ENTERPRISE25 with PROFESSIONAL plan (should fail)',
        code: 'ENTERPRISE25',
        planType: 'PROFESSIONAL',
        orderAmount: 10
      },
      {
        name: 'HARSHIL50 with PROFESSIONAL plan',
        code: 'HARSHIL50',
        planType: 'PROFESSIONAL',
        orderAmount: 10
      },
      {
        name: 'FIXED5 with PROFESSIONAL plan',
        code: 'FIXED5',
        planType: 'PROFESSIONAL',
        orderAmount: 10
      }
    ];

    console.log('\n🧪 Testing coupon scenarios...\n');

    for (const scenario of testScenarios) {
      console.log(`📝 Testing: ${scenario.name}`);
      
      try {
        const result = await CouponService.validateCoupon(
          scenario.code,
          testUser._id,
          scenario.orderAmount,
          scenario.planType
        );

        if (result.valid) {
          console.log(`✅ SUCCESS: ${scenario.code} applied successfully`);
          console.log(`   Original: ₹${result.originalAmount}`);
          console.log(`   Discount: ₹${result.discount.amount} (${result.discount.percentage}%)`);
          console.log(`   Final: ₹${result.finalAmount}`);
        } else {
          console.log(`❌ FAILED: ${result.reason}`);
        }
      } catch (error) {
        console.log(`💥 ERROR: ${error.message}`);
      }
      
      console.log(''); // Empty line for readability
    }

    console.log('🎉 Coupon testing completed!');

  } catch (error) {
    console.error('❌ Error testing coupons:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
testCoupons();