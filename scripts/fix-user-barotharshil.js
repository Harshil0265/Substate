import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/User.js';
import Campaign from '../backend/models/Campaign.js';
import Article from '../backend/models/Article.js';

dotenv.config();

async function fixUser() {
  try {
    console.log('🔧 Fixing user barotharshil070@gmail.com\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const userEmail = 'barotharshil070@gmail.com';
    
    // Find the user
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log('📊 Current User Data:');
    console.log('-------------------');
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`Subscription: ${user.subscription}`);
    console.log(`Status: ${user.subscriptionStatus}`);
    console.log(`Start Date: ${user.subscriptionStartDate}`);
    console.log(`End Date: ${user.subscriptionEndDate}`);
    console.log(`Campaign Count: ${user.campaignCount}`);
    console.log(`Article Count: ${user.articleCount}\n`);

    // Count actual campaigns and articles
    const actualCampaignCount = await Campaign.countDocuments({ userId: user._id });
    const actualArticleCount = await Article.countDocuments({ userId: user._id });

    console.log('📈 Actual Counts from Database:');
    console.log('-------------------');
    console.log(`Campaigns: ${actualCampaignCount}`);
    console.log(`Articles: ${actualArticleCount}\n`);

    // Calculate days remaining
    const now = new Date();
    const endDate = user.subscriptionEndDate || now;
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    console.log(`Days Remaining: ${daysRemaining} days\n`);

    // Fix the issues
    console.log('🔧 Applying Fixes:');
    console.log('-------------------');

    // Set current date as start date and 30 days from now as end date
    const newStartDate = new Date();
    const newEndDate = new Date();
    newEndDate.setDate(newEndDate.getDate() + 30);

    console.log(`1. Setting proper subscription dates:`);
    console.log(`   Start: ${newStartDate.toISOString()}`);
    console.log(`   End: ${newEndDate.toISOString()}`);
    console.log(`   Duration: 30 days\n`);

    console.log(`2. Updating campaign count: ${user.campaignCount} → ${actualCampaignCount}`);
    console.log(`3. Updating article count: ${user.articleCount} → ${actualArticleCount}\n`);

    // Update the user
    user.subscriptionStartDate = newStartDate;
    user.subscriptionEndDate = newEndDate;
    user.campaignCount = actualCampaignCount;
    user.articleCount = actualArticleCount;
    user.subscriptionStatus = 'ACTIVE';
    
    // Reset usage warnings so they can create campaigns
    user.usageWarnings = {
      campaigns75: false,
      campaigns100: false,
      articles75: false,
      articles100: false
    };

    await user.save();

    console.log('✅ User updated successfully!\n');

    // Show updated data
    const updatedUser = await User.findOne({ email: userEmail });
    const newDaysRemaining = Math.ceil((updatedUser.subscriptionEndDate - now) / (1000 * 60 * 60 * 24));

    console.log('📊 Updated User Data:');
    console.log('-------------------');
    console.log(`Subscription: ${updatedUser.subscription}`);
    console.log(`Status: ${updatedUser.subscriptionStatus}`);
    console.log(`Start Date: ${updatedUser.subscriptionStartDate}`);
    console.log(`End Date: ${updatedUser.subscriptionEndDate}`);
    console.log(`Days Remaining: ${newDaysRemaining} days`);
    console.log(`Campaign Count: ${updatedUser.campaignCount}`);
    console.log(`Article Count: ${updatedUser.articleCount}\n`);

    console.log('✅ All fixes applied successfully!');
    console.log('\n📝 Summary:');
    console.log('-------------------');
    console.log('✓ Subscription dates corrected (30 days duration)');
    console.log('✓ Campaign and article counts synchronized');
    console.log('✓ Usage warnings reset');
    console.log('✓ User can now create unlimited campaigns (PROFESSIONAL plan)');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

fixUser();
