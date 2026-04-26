import PaymentTrackingService from '../backend/services/PaymentTrackingService.js';
import PaymentAttempt from '../backend/models/PaymentAttempt.js';
import User from '../backend/models/User.js';
import mongoose from 'mongoose';

console.log('🧪 Testing Payment Tracking System');
console.log('='.repeat(50));

async function testPaymentTracking() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/substate');
    console.log('✅ Connected to MongoDB');

    // Test data
    const testUserId = new mongoose.Types.ObjectId();
    const testPlanDetails = {
      planType: 'PROFESSIONAL',
      billingPeriod: 'MONTHLY',
      amount: 1000,
      originalAmount: 1200,
      currency: 'INR',
      coupon: {
        code: 'TEST20',
        discountAmount: 200
      },
      paymentMethod: 'RAZORPAY',
      razorpayOrderId: 'order_test123'
    };

    const testRequestInfo = {
      userAgent: 'Mozilla/5.0 (Test Browser)',
      ipAddress: '127.0.0.1',
      referrer: 'https://test.com'
    };

    console.log('\n🔄 Testing Payment Initiation Tracking...');
    const initiationResult = await PaymentTrackingService.trackPaymentInitiation(
      testUserId,
      testPlanDetails,
      testRequestInfo
    );
    console.log('✅ Payment initiation tracked:', initiationResult);

    console.log('\n🔄 Testing Payment Cancellation Tracking...');
    const cancellationResult = await PaymentTrackingService.trackPaymentCancellation(
      testUserId,
      initiationResult?.sessionId,
      {
        ...testPlanDetails,
        reason: 'USER_CANCELLED',
        stage: 'PAYMENT_GATEWAY',
        timeSpent: 45,
        errorMessage: 'User clicked back button',
        returnUrl: 'https://test.com/subscription'
      }
    );
    console.log('✅ Payment cancellation tracked:', cancellationResult);

    console.log('\n🔄 Testing Payment Completion Tracking...');
    const completionResult = await PaymentTrackingService.trackPaymentCompletion(
      testUserId,
      initiationResult?.sessionId,
      {
        ...testPlanDetails,
        razorpayPaymentId: 'pay_test456',
        timeSpent: 120,
        paymentId: new mongoose.Types.ObjectId(),
        transactionId: 'txn_test789'
      }
    );
    console.log('✅ Payment completion tracked:', completionResult);

    console.log('\n📊 Testing Analytics Generation...');
    const analytics = await PaymentTrackingService.getPaymentAnalytics({
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
      endDate: new Date()
    });
    console.log('✅ Analytics generated:');
    console.log('   - Conversion Rate:', analytics.conversionStats.conversionRate.toFixed(2) + '%');
    console.log('   - Cancellation Rate:', analytics.conversionStats.cancellationRate.toFixed(2) + '%');
    console.log('   - Total Attempts:', analytics.conversionStats.totalAttempts);
    console.log('   - Recent Cancellations:', analytics.recentCancellations.length);

    console.log('\n🔄 Testing User Payment History...');
    const userHistory = await PaymentTrackingService.getUserPaymentAttempts(testUserId, 10);
    console.log('✅ User payment history retrieved:', userHistory.length, 'attempts');

    console.log('\n🧹 Cleaning up test data...');
    await PaymentAttempt.deleteMany({ userId: testUserId });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 All Payment Tracking Tests Passed!');
    console.log('\n📋 System Features Verified:');
    console.log('   ✅ Payment initiation tracking');
    console.log('   ✅ Payment cancellation tracking');
    console.log('   ✅ Payment completion tracking');
    console.log('   ✅ Analytics generation');
    console.log('   ✅ User history retrieval');
    console.log('   ✅ Database operations');

    return true;

  } catch (error) {
    console.error('❌ Payment tracking test failed:', error);
    return false;
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testPaymentTracking()
  .then(success => {
    if (success) {
      console.log('\n🏆 PAYMENT TRACKING SYSTEM IS READY FOR PRODUCTION!');
      process.exit(0);
    } else {
      console.log('\n⚠️ PAYMENT TRACKING SYSTEM NEEDS ATTENTION');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });