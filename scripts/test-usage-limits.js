import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/User.js';
import Campaign from '../backend/models/Campaign.js';
import Article from '../backend/models/Article.js';
import UsageService from '../backend/services/UsageService.js';

dotenv.config();

async function testUsageLimits() {
  try {
    console.log('🧪 Testing Usage Limits & Email Notifications\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a test user (or create one)
    let testUser = await User.findOne({ email: 'test@example.com' });
    
    if (!testUser) {
      console.log('❌ Test user not found. Please create a user with email: test@example.com');
      console.log('   Or modify this script to use an existing user email.\n');
      process.exit(1);
    }

    console.log('📊 Test User:', {
      name: testUser.name,
      email: testUser.email,
      plan: testUser.subscription,
      status: testUser.subscriptionStatus
    });
    console.log();

    // Get current usage
    const usage = await UsageService.getUserUsage(testUser._id);
    console.log('📈 Current Usage:');
    console.log('   Campaigns:', usage.usage.campaigns, '/', usage.limits.campaigns);
    console.log('   Articles:', usage.usage.articles, '/', usage.limits.articles);
    console.log();

    // Check if can create campaign
    const canCreateCampaign = await UsageService.canCreateCampaign(testUser._id);
    console.log('🎯 Can Create Campaign:', canCreateCampaign.allowed ? '✅ Yes' : '❌ No');
    if (!canCreateCampaign.allowed) {
      console.log('   Reason:', canCreateCampaign.reason);
    }
    console.log();

    // Check if can create article
    const canCreateArticle = await UsageService.canCreateArticle(testUser._id);
    console.log('📝 Can Create Article:', canCreateArticle.allowed ? '✅ Yes' : '❌ No');
    if (!canCreateArticle.allowed) {
      console.log('   Reason:', canCreateArticle.reason);
    }
    console.log();

    // Check usage warnings status
    console.log('📧 Email Notification Status:');
    console.log('   Campaigns 75% warning sent:', testUser.usageWarnings?.campaigns75 || false);
    console.log('   Campaigns 100% limit sent:', testUser.usageWarnings?.campaigns100 || false);
    console.log('   Articles 75% warning sent:', testUser.usageWarnings?.articles75 || false);
    console.log('   Articles 100% limit sent:', testUser.usageWarnings?.articles100 || false);
    console.log();

    // Calculate percentages
    if (usage.limits.campaigns !== -1) {
      const campaignPercentage = (usage.usage.campaigns / usage.limits.campaigns) * 100;
      console.log('📊 Campaign Usage:', Math.round(campaignPercentage) + '%');
      
      if (campaignPercentage >= 75 && campaignPercentage < 100) {
        console.log('   ⚠️  Should trigger 75% warning email');
      } else if (campaignPercentage >= 100) {
        console.log('   🚫 Should trigger 100% limit email');
      }
    }

    if (usage.limits.articles !== -1) {
      const articlePercentage = (usage.usage.articles / usage.limits.articles) * 100;
      console.log('📊 Article Usage:', Math.round(articlePercentage) + '%');
      
      if (articlePercentage >= 75 && articlePercentage < 100) {
        console.log('   ⚠️  Should trigger 75% warning email');
      } else if (articlePercentage >= 100) {
        console.log('   🚫 Should trigger 100% limit email');
      }
    }
    console.log();

    // Test sending notifications
    console.log('📧 Testing Email Notification System...');
    await UsageService.sendUsageNotifications(testUser._id);
    console.log('✅ Notification check complete (check email inbox)\n');

    // Get usage alerts
    const alerts = await UsageService.getUsageAlerts(testUser._id);
    if (alerts.length > 0) {
      console.log('🚨 Active Alerts:');
      alerts.forEach((alert, index) => {
        console.log(`   ${index + 1}. [${alert.severity.toUpperCase()}] ${alert.message}`);
      });
    } else {
      console.log('✅ No active alerts');
    }
    console.log();

    console.log('✅ Test Complete!\n');

  } catch (error) {
    console.error('❌ Test Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the test
testUsageLimits();
