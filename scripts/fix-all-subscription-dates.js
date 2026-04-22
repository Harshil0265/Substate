import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/User.js';
import Campaign from '../backend/models/Campaign.js';
import Article from '../backend/models/Article.js';

dotenv.config();

async function fixAllSubscriptions() {
  try {
    console.log('🔧 Fixing all users with subscription date issues\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all users with active subscriptions
    const users = await User.find({ 
      subscriptionStatus: 'ACTIVE',
      subscription: { $in: ['PROFESSIONAL', 'ENTERPRISE'] }
    });

    console.log(`Found ${users.length} users with PROFESSIONAL/ENTERPRISE plans\n`);

    let fixedCount = 0;
    const now = new Date();

    for (const user of users) {
      const endDate = user.subscriptionEndDate || now;
      const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      // Check if subscription dates are incorrect (more than 60 days or expired)
      if (daysRemaining > 60 || daysRemaining < 0) {
        console.log(`\n🔧 Fixing user: ${user.email}`);
        console.log(`   Current days remaining: ${daysRemaining}`);

        // Set proper dates
        const newStartDate = new Date();
        const newEndDate = new Date();
        newEndDate.setDate(newEndDate.getDate() + 30);

        // Get actual counts
        const actualCampaignCount = await Campaign.countDocuments({ userId: user._id });
        const actualArticleCount = await Article.countDocuments({ userId: user._id });

        // Update user
        user.subscriptionStartDate = newStartDate;
        user.subscriptionEndDate = newEndDate;
        user.campaignCount = actualCampaignCount;
        user.articleCount = actualArticleCount;
        user.usageWarnings = {
          campaigns75: false,
          campaigns100: false,
          articles75: false,
          articles100: false
        };

        await user.save();

        console.log(`   ✅ Fixed: Now has 30 days remaining`);
        console.log(`   Campaigns: ${actualCampaignCount}, Articles: ${actualArticleCount}`);
        fixedCount++;
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} users`);
    console.log(`✓ ${users.length - fixedCount} users already had correct dates`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixAllSubscriptions();
