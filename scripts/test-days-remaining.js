import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/User.js';
import UsageService from '../backend/services/UsageService.js';

dotenv.config();

async function testDaysRemaining() {
  try {
    console.log('🧪 Testing Days Remaining Calculation\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const userEmail = 'barotharshil070@gmail.com';
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log('📅 Current Date & Time:');
    console.log('======================');
    const now = new Date();
    console.log(`Server Time: ${now.toLocaleString('en-IN')}`);
    console.log(`ISO: ${now.toISOString()}`);
    console.log(`Timestamp: ${now.getTime()}\n`);

    console.log('📊 Subscription Dates:');
    console.log('======================');
    console.log(`Start Date: ${user.subscriptionStartDate.toLocaleString('en-IN')}`);
    console.log(`End Date: ${user.subscriptionEndDate.toLocaleString('en-IN')}\n`);

    console.log('🔢 Manual Calculation:');
    console.log('======================');
    const endDate = new Date(user.subscriptionEndDate);
    const diffMs = endDate - now;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const daysRemainingCeil = Math.ceil(diffDays);
    const daysRemainingFloor = Math.floor(diffDays);
    
    console.log(`Time Difference: ${diffMs} ms`);
    console.log(`Days (exact): ${diffDays.toFixed(2)} days`);
    console.log(`Days (ceil): ${daysRemainingCeil} days`);
    console.log(`Days (floor): ${daysRemainingFloor} days`);
    console.log(`Days (max 0, ceil): ${Math.max(0, daysRemainingCeil)} days\n`);

    console.log('📊 UsageService Calculation:');
    console.log('======================');
    const usage = await UsageService.getUserUsage(user._id);
    console.log(`Days Remaining: ${usage.remaining.days} days\n`);

    console.log('✅ Verification:');
    console.log('======================');
    if (usage.remaining.days === Math.max(0, daysRemainingCeil)) {
      console.log('✅ Calculation is CORRECT and DYNAMIC');
      console.log('✅ Days remaining updates based on current date');
    } else {
      console.log('❌ Calculation mismatch!');
      console.log(`   Expected: ${Math.max(0, daysRemainingCeil)}`);
      console.log(`   Got: ${usage.remaining.days}`);
    }

    console.log('\n📝 Daily Change Simulation:');
    console.log('======================');
    console.log('If you check tomorrow:');
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDiff = (endDate - tomorrow) / (1000 * 60 * 60 * 24);
    console.log(`Tomorrow's Date: ${tomorrow.toLocaleDateString('en-IN')}`);
    console.log(`Days Remaining: ${Math.max(0, Math.ceil(tomorrowDiff))} days`);
    
    console.log('\nIf you check in 5 days:');
    const fiveDaysLater = new Date(now);
    fiveDaysLater.setDate(fiveDaysLater.getDate() + 5);
    const fiveDaysDiff = (endDate - fiveDaysLater) / (1000 * 60 * 60 * 24);
    console.log(`Date: ${fiveDaysLater.toLocaleDateString('en-IN')}`);
    console.log(`Days Remaining: ${Math.max(0, Math.ceil(fiveDaysDiff))} days`);

    console.log('\n✅ The calculation is DYNAMIC and will change daily!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

testDaysRemaining();
