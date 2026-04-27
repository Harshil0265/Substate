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

    // Find payments that are PENDING for more than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    console.log('🔍 Looking for abandoned payments older than:', oneHourAgo);
    
    const abandonedPayments = await Payment.find({
      status: 'PENDING',
      createdAt: { $lt: oneHourAgo }
    });

    console.log(`📊 Found ${abandonedPayments.length} abandoned payments`);

    if (abandonedPayments.length > 0) {
      // Update them to CANCELLED
      const updateResult = await Payment.updateMany(
        {
          status: 'PENDING',
          createdAt: { $lt: oneHourAgo }
        },
        {
          $set: {
            status: 'CANCELLED',
            failureReason: 'Payment abandoned - automatically cancelled after 1 hour'
          }
        }
      );

      console.log(`✅ Updated ${updateResult.modifiedCount} payments to CANCELLED status`);

      // Show details of updated payments
      abandonedPayments.forEach(payment => {
        console.log(`   - Payment ${payment._id}: ${payment.planType} plan, ₹${payment.amount}, created ${payment.createdAt}`);
      });
    } else {
      console.log('✅ No abandoned payments found');
    }

    console.log('🎉 Cleanup completed successfully!');

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