import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/User.js';
import UsageService from '../backend/services/UsageService.js';

dotenv.config();

async function verifyFix() {
  try {
    console.log('🔍 Verifying user fix for barotharshil070@gmail.com\n');

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
    console.log(`Plan: ${user.subscription}`);
    console.log(`Status: ${user.subscriptionStatus}\n`);

    // Get usage information
    const usage = await UsageService.getUserUsage(user._id);
    
    console.log('📈 Usage & Limits:');
    console.log('===================');
    console.log(`Campaigns: ${usage.usage.campaigns}/${usage.limits.campaigns === -1 ? 'Unlimited' : usage.limits.campaigns}`);
    console.log(`Articles: ${usage.usage.articles}/${usage.limits.articles === -1 ? 'Unlimited' : usage.limits.articles}`);
    console.log(`Days Remaining: ${usage.remaining.days} days\n`);

    // Check if can create campaign
    const canCreateCampaign = await UsageService.canCreateCampaign(user._id);
    console.log('🎯 Campaign Creation Check:');
    console.log('===================');
    console.log(`Can Create Campaign: ${canCreateCampaign.allowed ? '✅ YES' : '❌ NO'}`);
    if (!canCreateCampaign.allowed) {
      console.log(`Reason: ${canCreateCampaign.reason}`);
    } else {
      console.log(`Remaining: ${canCreateCampaign.remaining === -1 ? 'Unlimited' : canCreateCampaign.remaining}`);
    }
    console.log();

    // Check if can create article
    const canCreateArticle = await UsageService.canCreateArticle(user._id);
    console.log('📝 Article Creation Check:');
    console.log('===================');
    console.log(`Can Create Article: ${canCreateArticle.allowed ? '✅ YES' : '❌ NO'}`);
    if (!canCreateArticle.allowed) {
      console.log(`Reason: ${canCreateArticle.reason}`);
    } else {
      console.log(`Remaining: ${canCreateArticle.remaining === -1 ? 'Unlimited' : canCreateArticle.remaining}`);
    }
    console.log();

    console.log('✅ Verification Complete!');
    console.log('\n📝 Summary:');
    console.log('===================');
    if (canCreateCampaign.allowed && usage.limits.campaigns === -1) {
      console.log('✓ User has UNLIMITED campaigns (PROFESSIONAL plan)');
    }
    if (canCreateArticle.allowed) {
      console.log(`✓ User can create articles (${usage.remaining.articles === -1 ? 'Unlimited' : usage.remaining.articles} remaining)`);
    }
    if (usage.remaining.days > 0) {
      console.log(`✓ Subscription is active (${usage.remaining.days} days remaining)`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
}

verifyFix();
