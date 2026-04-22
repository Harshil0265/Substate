import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/User.js';

dotenv.config();

async function simulateDaysPassing() {
  try {
    console.log('📅 Simulating Days Passing - Days Remaining Calculation\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const userEmail = 'barotharshil070@gmail.com';
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log('📊 Subscription Details:');
    console.log('========================');
    console.log(`Plan: ${user.subscription}`);
    console.log(`Start: ${user.subscriptionStartDate.toLocaleDateString('en-IN')}`);
    console.log(`End: ${user.subscriptionEndDate.toLocaleDateString('en-IN')}\n`);

    const endDate = new Date(user.subscriptionEndDate);
    const startDate = new Date(user.subscriptionStartDate);

    console.log('📆 Days Remaining Simulation:');
    console.log('========================\n');

    // Simulate from start date to end date
    const currentDate = new Date();
    
    // Show today
    const todayDiff = (endDate - currentDate) / (1000 * 60 * 60 * 24);
    console.log(`📍 TODAY (${currentDate.toLocaleDateString('en-IN')})`);
    console.log(`   Days Remaining: ${Math.max(0, Math.ceil(todayDiff))} days\n`);

    // Show next 7 days
    console.log('📅 Next 7 Days:');
    console.log('---------------');
    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setDate(futureDate.getDate() + i);
      const diff = (endDate - futureDate) / (1000 * 60 * 60 * 24);
      const daysRemaining = Math.max(0, Math.ceil(diff));
      
      console.log(`Day ${i} (${futureDate.toLocaleDateString('en-IN')}): ${daysRemaining} days remaining`);
    }

    console.log('\n📅 Key Milestones:');
    console.log('------------------');
    
    // 7 days before expiry
    const sevenDaysBefore = new Date(endDate);
    sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
    console.log(`7 days before expiry (${sevenDaysBefore.toLocaleDateString('en-IN')}): 7 days remaining`);
    
    // 3 days before expiry
    const threeDaysBefore = new Date(endDate);
    threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);
    console.log(`3 days before expiry (${threeDaysBefore.toLocaleDateString('en-IN')}): 3 days remaining`);
    
    // 1 day before expiry
    const oneDayBefore = new Date(endDate);
    oneDayBefore.setDate(oneDayBefore.getDate() - 1);
    console.log(`1 day before expiry (${oneDayBefore.toLocaleDateString('en-IN')}): 1 day remaining`);
    
    // Expiry day
    console.log(`Expiry day (${endDate.toLocaleDateString('en-IN')}): 0 days remaining`);

    console.log('\n✅ How It Works:');
    console.log('================');
    console.log('1. Backend calculates: Math.ceil((endDate - currentDate) / (1000 * 60 * 60 * 24))');
    console.log('2. Frontend also calculates using the same formula');
    console.log('3. Both use new Date() which gets the CURRENT date/time');
    console.log('4. The calculation is DYNAMIC and updates automatically');
    console.log('5. User sees updated count when they:');
    console.log('   - Refresh the page');
    console.log('   - Log out and log back in');
    console.log('   - Navigate to a different page and back');
    console.log('\n✅ The days remaining WILL decrease by 1 each day automatically!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

simulateDaysPassing();
