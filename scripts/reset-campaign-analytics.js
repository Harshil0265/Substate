import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Campaign from '../backend/models/Campaign.js';

dotenv.config();

async function resetCampaignAnalytics() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🧹 Resetting all campaign analytics to zero...');
    
    // Reset basic metrics for all campaigns
    const result = await Campaign.updateMany(
      {},
      {
        $set: {
          // Reset email metrics
          emailsSent: 0,
          opensCount: 0,
          clicksCount: 0,
          conversionCount: 0,
          
          // Reset engagement
          engagementRate: 0,
          articlesGenerated: 0,
          
          // Reset analytics
          'analytics.totalViews': 0,
          'analytics.uniqueVisitors': 0,
          'analytics.avgTimeOnPage': 0,
          'analytics.bounceRate': 0,
          'analytics.socialShares': 0,
          'analytics.comments': 0,
          
          // Reset ROI
          'roi.investment': 0,
          'roi.revenue': 0,
          'roi.roiPercentage': 0,
          'roi.costPerClick': 0,
          'roi.costPerConversion': 0,
          'roi.revenuePerArticle': 0
        }
      }
    );

    console.log(`✅ Reset ${result.modifiedCount} campaigns (basic metrics)`);
    
    // Reset A/B testing for campaigns that have it
    const abTestResult = await Campaign.updateMany(
      { 'abTesting.enabled': true },
      {
        $set: {
          'abTesting.variants.$[].impressions': 0,
          'abTesting.variants.$[].clicks': 0,
          'abTesting.variants.$[].conversions': 0,
          'abTesting.variants.$[].conversionRate': 0
        }
      }
    );
    
    console.log(`✅ Reset A/B testing for ${abTestResult.modifiedCount} campaigns`);
    console.log('');
    console.log('📊 All campaign analytics have been reset to zero');
    console.log('🎯 Campaigns will now show real-time data only');
    console.log('');
    console.log('Next steps:');
    console.log('1. Restart your server');
    console.log('2. Refresh your dashboard');
    console.log('3. All metrics will start at 0 and update with real data');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error resetting campaign analytics:', error);
    process.exit(1);
  }
}

resetCampaignAnalytics();
