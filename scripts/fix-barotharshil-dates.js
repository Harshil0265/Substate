import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/User.js';
import Payment from '../backend/models/Payment.js';

dotenv.config();

async function fixUserDates() {
  try {
    console.log('🔧 Fixing subscription dates for barotharshil070@gmail.com\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const userEmail = 'barotharshil070@gmail.com';
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log('📊 Current Subscription Data:');
    console.log('===================================');
    console.log(`Start Date: ${user.subscriptionStartDate}`);
    console.log(`End Date: ${user.subscriptionEndDate}\n`);

    // Get the PROFESSIONAL payment
    const professionalPayment = await Payment.findOne({ 
      userId: user._id, 
      planType: 'PROFESSIONAL',
      status: 'COMPLETED'
    }).sort({ createdAt: 1 });

    if (!professionalPayment) {
      console.log('❌ No PROFESSIONAL payment found!');
      process.exit(1);
    }

    console.log('💳 PROFESSIONAL Payment Details:');
    console.log('===================================');
    console.log(`Payment Date: ${professionalPayment.createdAt}`);
    console.log(`Payment ID: ${professionalPayment._id}`);
    console.log(`Transaction ID: ${professionalPayment.transactionId || professionalPayment.razorpayPaymentId}\n`);

    // Calculate correct dates based on payment date
    const paymentDate = new Date(professionalPayment.createdAt);
    const subscriptionStartDate = paymentDate; // Start from payment date
    const subscriptionEndDate = new Date(paymentDate);
    subscriptionEndDate.setDate(subscriptionEndDate.getDate() + 30); // 30 days from payment

    console.log('🔧 Applying Fix:');
    console.log('===================================');
    console.log(`New Start Date: ${subscriptionStartDate.toLocaleString('en-IN')}`);
    console.log(`New End Date: ${subscriptionEndDate.toLocaleString('en-IN')}`);
    console.log(`Duration: 30 days\n`);

    // Update user subscription dates
    user.subscriptionStartDate = subscriptionStartDate;
    user.subscriptionEndDate = subscriptionEndDate;
    await user.save();

    console.log('✅ User subscription dates updated!\n');

    // Check if there's a trial payment that needs invoice number
    const trialPayment = await Payment.findOne({
      userId: user._id,
      planType: 'TRIAL'
    });

    if (trialPayment) {
      console.log('📋 Found TRIAL payment:');
      console.log(`   Created: ${trialPayment.createdAt}`);
      console.log(`   Current Invoice: ${trialPayment.invoiceNumber || 'N/A'}`);
      
      // If trial payment doesn't have proper date, update it
      const desiredTrialDate = new Date('2026-04-18T00:00:00.000Z');
      if (trialPayment.createdAt.toDateString() !== desiredTrialDate.toDateString()) {
        console.log(`\n   Updating trial payment date to: ${desiredTrialDate.toLocaleString('en-IN')}`);
        trialPayment.createdAt = desiredTrialDate;
        await trialPayment.save();
        console.log('   ✅ Trial payment date updated!');
      }
    } else {
      console.log('ℹ️  No TRIAL payment found in billing history.');
      console.log('   (This is okay - user may have started directly with PROFESSIONAL plan)\n');
    }

    // Show final summary
    console.log('\n\n📊 Final Summary:');
    console.log('===================================');
    const updatedUser = await User.findOne({ email: userEmail });
    const allPayments = await Payment.find({ userId: user._id }).sort({ createdAt: 1 });
    
    console.log('\n✅ Current Plan:');
    console.log(`   Plan: ${updatedUser.subscription}`);
    console.log(`   Start: ${updatedUser.subscriptionStartDate.toLocaleString('en-IN')}`);
    console.log(`   End: ${updatedUser.subscriptionEndDate.toLocaleString('en-IN')}`);
    
    const now = new Date();
    const daysRemaining = Math.ceil((updatedUser.subscriptionEndDate - now) / (1000 * 60 * 60 * 24));
    console.log(`   Days Remaining: ${daysRemaining} days`);
    
    console.log('\n💳 Billing History:');
    allPayments.forEach((payment, index) => {
      console.log(`\n   ${index + 1}. ${payment.planType} Plan`);
      console.log(`      Date: ${payment.createdAt.toLocaleString('en-IN')}`);
      console.log(`      Amount: ₹${payment.amount}`);
      console.log(`      Status: ${payment.status}`);
      console.log(`      Invoice: ${payment.invoiceNumber || 'N/A'}`);
    });

    console.log('\n\n✅ All dates synchronized successfully!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixUserDates();
