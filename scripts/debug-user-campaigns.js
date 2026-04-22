import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/User.js';
import Campaign from '../backend/models/Campaign.js';
import UsageService from '../backend/services/UsageService.js';

dotenv.config();

async function debugUserCampaigns() {
  try {
    console.log('🔍 Debugging campaign data for barotharshil070@gmail.com\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const userEmail = 'barotharshil070@gmail.com';
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log('❌ User not found!');
      process.exit(1);
    }

    console.log('📊 User Information:');
    console.log('===================');
    console.log(`Name: ${user.name}`);
    console.log(`Email: ${user.email}`);
    console.log(`User ID: ${user._id}`);
    console.log(`Plan: ${user.subscription}`);
    console.log(`Status: ${user.subscriptionStatus}\n`);

    // Count campaigns directly
    const campaignCount = await Campaign.countDocuments({ userId: user._id });
    console.log(`📈 Campaign Count from Database: ${campaignCount}\n`);

    // Get all campaigns for this user
    const campaigns = await Campaign.find({ userId: user._id }).select('title status createdAt');
    console.log('📋 User Campaigns:');
    console.log('===================');
    campaigns.forEach((campaign, index) => {
      console.log(`${index + 1}. ${campaign.title}`);
      console.log(`   Status: ${campaign.status}`);
      console.log(`   Created: ${campaign.createdAt}`);
      console.log(`   ID: ${campaign._id}\n`);
    });

    // Get usage from service
    const usage = await UsageService.getUserUsage(user._id);
    console.log('📊 Usage Service Data:');
    console.log('===================');
    console.log(`Campaigns Used: ${usage.usage.campaigns}`);
    console.log(`Campaign Limit: ${usage.limits.campaigns === -1 ? 'Unlimited' : usage.limits.campaigns}`);
    console.log(`Campaigns Remaining: ${usage.remaining.campaigns === -1 ? 'Unlimited' : usage.remaining.campaigns}`);
    console.log(`Can Create Campaign: ${usage.remaining.campaigns === -1 || usage.remaining.campaigns > 0 ? 'YES' : 'NO'}\n`);

    // Check if can create campaign
    const canCreate = await UsageService.canCreateCampaign(user._id);
    console.log('✅ Can Create Campaign Check:');
    console.log('===================');
    console.log(`Allowed: ${canCreate.allowed ? 'YES ✅' : 'NO ❌'}`);
    if (!canCreate.allowed) {
      console.log(`Reason: ${canCreate.reason}`);
      console.log(`Code: ${canCreate.code}`);
    }
    console.log();

    // Check plan limits configuration
    console.log('⚙️ Plan Limits Configuration:');
    console.log('===================');
    const planLimits = UsageService.PLAN_LIMITS[user.subscription];
    if (planLimits) {
      console.log(`Plan: ${user.subscription}`);
      console.log(`Campaign Limit: ${planLimits.campaigns === -1 ? 'Unlimited' : planLimits.campaigns}`);
      console.log(`Article Limit: ${planLimits.articles === -1 ? 'Unlimited' : planLimits.articles}`);
      console.log(`Duration: ${planLimits.duration} days`);
    } else {
      console.log(`❌ No plan limits found for: ${user.subscription}`);
      console.log('Available plans:', Object.keys(UsageService.PLAN_LIMITS));
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

debugUserCampaigns();
