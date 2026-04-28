import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Payment from '../backend/models/Payment.js';

// Load environment variables
dotenv.config();

async function cleanupAbandonedPayments() {
  try {
    console.log('🧹 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find ALL payments that are PENDING (regardless of age)
    // Since we're implementing immediate cancellation, any PENDING payment is abandoned
    
    console.log('🔍 Looking for all PENDING payments...');
    
    const abandonedPayments = await Payment.find({
      status: 'PENDING'
    });

    console.log(`📊 Found ${abandonedPayments.length} PENDING payments to convert to CANCELLED`);

    if (abandonedPayments.length > 0) {
      // Update them all to CANCELLED
      const updateResult = await Payment.updateMany(
        {
          status: 'PENDING'
        },
        {
          $set: {
            status: 'CANCELLED',
            failureReason: 'Payment abandoned - automatically cancelled (user did not complete payment)'
          }
        }
      );

      console.log(`✅ Updated ${updateResult.modifiedCount} payments to CANCELLED status`);

      // Show details of updated payments
      console.log('\n📋 Details of converted payments:');
      abandonedPayments.forEach(payment => {
        console.log(`   - Payment ${payment._id}: ${payment.planType} plan, ₹${payment.amount}, created ${payment.createdAt}`);
      });
    } else {
      console.log('✅ No PENDING payments found - database is clean!');
    }

    console.log('\n🎉 Cleanup completed successfully!');
    console.log('💡 Note: With immediate cancellation enabled, PENDING status should no longer appear.');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the cleanup
cleanupAbandonedPayments();