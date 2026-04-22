import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/User.js';
import Payment from '../backend/models/Payment.js';

dotenv.config();

async function checkUserDates() {
  try {
    console.log('🔍 Checking dates for barotharshil070@gmail.com\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const userEmail = 'barotharshil070@gmail.com';
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log('📊 Current User Subscription Data:');
    console.log('===================================');
    console.log(`Plan: ${user.subscription}`);
    console.log(`Status: ${user.subscriptionStatus}`);
    console.log(`Start Date: ${user.subscriptionStartDate}`);
    console.log(`End Date: ${user.subscriptionEndDate}`);
    console.log();

    // Get all payments for this user
    const payments = await Payment.find({ userId: user._id }).sort({ createdAt: 1 });
    
    console.log('💳 Payment History (Billing Section):');
    console.log('===================================');
    payments.forEach((payment, index) => {
      console.log(`\n${index + 1}. Payment ID: ${payment._id}`);
      console.log(`   Invoice: ${payment.invoiceNumber || 'N/A'}`);
      console.log(`   Plan: ${payment.planType}`);
      console.log(`   Amount: ₹${payment.amount}`);
      console.log(`   Status: ${payment.status}`);
      console.log(`   Created: ${payment.createdAt}`);
      console.log(`   Updated: ${payment.updatedAt}`);
      console.log(`   Transaction ID: ${payment.transactionId || payment.razorpayPaymentId || 'N/A'}`);
    });

    console.log('\n\n📝 Analysis:');
    console.log('===================================');
    
    // Find the PROFESSIONAL plan payment
    const professionalPayment = payments.find(p => p.planType === 'PROFESSIONAL' && p.status === 'COMPLETED');
    
    if (professionalPayment) {
      console.log('✅ Found PROFESSIONAL plan payment:');
      console.log(`   Payment Date: ${professionalPayment.createdAt}`);
      console.log(`   Current Subscription Start: ${user.subscriptionStartDate}`);
      console.log();
      
      const paymentDate = new Date(professionalPayment.createdAt);
      const currentStartDate = new Date(user.subscriptionStartDate);
      
      if (paymentDate.toDateString() !== currentStartDate.toDateString()) {
        console.log('⚠️  MISMATCH DETECTED!');
        console.log(`   Billing shows: ${paymentDate.toLocaleString('en-IN')}`);
        console.log(`   Current plan shows: ${currentStartDate.toLocaleString('en-IN')}`);
        console.log('\n   Should update subscription start date to match payment date.');
      } else {
        console.log('✅ Dates match correctly!');
      }
    }

    // Find TRIAL payment
    const trialPayment = payments.find(p => p.planType === 'TRIAL');
    if (trialPayment) {
      console.log('\n📋 Trial Payment:');
      console.log(`   Date: ${trialPayment.createdAt}`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

checkUserDates();
