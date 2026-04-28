import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Campaign from '../backend/models/Campaign.js';
import Article from '../backend/models/Article.js';
import User from '../backend/models/User.js';

dotenv.config();

async function testCampaignAutomation() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🤖 CAMPAIGN AUTOMATION EXPLANATION');
    console.log('='.repeat(70) + '\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('📋 HOW CONTENT CAMPAIGNS WORK:\n');
    console.log('─'.repeat(70));
    
    console.log('\n1️⃣  CAMPAIGN SETUP:');
    console.log('   • User creates a CONTENT campaign');
    console.log('   • Provides: Title & Description');
    console.log('   • Example: Title="Health & Wellness Tips"');
    console.log('   •          Description="Daily health advice and wellness tips"');
    
    console.log('\n2️⃣  AUTO-SCHEDULING CONFIGURATION:');
    console.log('   • Enable auto-scheduling in campaign settings');
    console.log('   • Choose frequency: DAILY, WEEKLY, BI_WEEKLY, or MONTHLY');
    console.log('   • Set time of day (e.g., 09:00 AM)');
    console.log('   • For WEEKLY: Select days (Monday, Wednesday, Friday)');
    
    console.log('\n3️⃣  AUTOMATIC ARTICLE GENERATION:');
    console.log('   • System runs daily at midnight (00:00)');
    console.log('   • Checks all campaigns with auto-scheduling enabled');
    console.log('   • For each campaign:');
    console.log('     ✓ Generates NEW unique article using AI');
    console.log('     ✓ Uses campaign title & description as context');
    console.log('     ✓ Creates variations: "Part 1", "Part 2", "Insights", etc.');
    console.log('     ✓ Includes images, research, SEO keywords');
    console.log('     ✓ Saves as DRAFT with scheduled publish time');
    
    console.log('\n4️⃣  AUTOMATIC PUBLISHING:');
    console.log('   • System checks every hour for scheduled articles');
    console.log('   • When scheduled time arrives:');
    console.log('     ✓ Changes status from DRAFT to PUBLISHED');
    console.log('     ✓ If WordPress is configured:');
    console.log('       → Automatically publishes to WordPress');
    console.log('       → Updates article with WordPress URL');
    
    console.log('\n5️⃣  WORDPRESS INTEGRATION:');
    console.log('   • Configure WordPress in campaign settings');
    console.log('   • Provide: WordPress URL, Username, App Password');
    console.log('   • Articles auto-publish to WordPress when scheduled');
    console.log('   • No manual intervention needed');
    
    console.log('\n' + '─'.repeat(70));
    console.log('\n⚠️  IMPORTANT REQUIREMENTS:\n');
    console.log('   🖥️  System must be RUNNING for automation to work');
    console.log('   📡 Server must be online 24/7 for scheduled publishing');
    console.log('   🔄 Articles are generated and saved even if system is off');
    console.log('   👁️  Users can preview generated articles anytime');
    console.log('   ✋ Manual publishing available if system is offline');
    
    console.log('\n' + '─'.repeat(70));
    console.log('\n📊 EXAMPLE WORKFLOW:\n');
    console.log('   Day 1 (00:00): Generate "Health Tips - Part 1" → Schedule for 09:00');
    console.log('   Day 1 (09:00): Publish to WordPress automatically');
    console.log('   Day 2 (00:00): Generate "Health Tips - Part 2" → Schedule for 09:00');
    console.log('   Day 2 (09:00): Publish to WordPress automatically');
    console.log('   Day 3 (00:00): Generate "Health Tips - Part 3" → Schedule for 09:00');
    console.log('   ... and so on daily/weekly based on frequency');
    
    console.log('\n' + '─'.repeat(70));
    console.log('\n🔍 CHECKING YOUR CAMPAIGNS:\n');

    // Find campaigns with auto-scheduling
    const autoScheduledCampaigns = await Campaign.find({
      'autoScheduling.enabled': true,
      campaignType: { $in: ['CONTENT', 'MULTI_CHANNEL'] }
    });

    if (autoScheduledCampaigns.length > 0) {
      console.log(`   ✅ Found ${autoScheduledCampaigns.length} campaign(s) with auto-scheduling:\n`);
      
      for (const campaign of autoScheduledCampaigns) {
        console.log(`   📋 ${campaign.title}`);
        console.log(`      Status: ${campaign.status}`);
        console.log(`      Frequency: ${campaign.autoScheduling.frequency}`);
        console.log(`      Time: ${campaign.autoScheduling.timeOfDay}`);
        console.log(`      Articles Generated: ${campaign.articlesGenerated || 0}`);
        console.log(`      Last Generated: ${campaign.autoScheduling.lastGeneratedAt ? new Date(campaign.autoScheduling.lastGeneratedAt).toLocaleString() : 'Never'}`);
        console.log(`      Next Scheduled: ${campaign.autoScheduling.nextScheduledDate ? new Date(campaign.autoScheduling.nextScheduledDate).toLocaleString() : 'Not set'}`);
        
        // Check WordPress config
        if (campaign.campaignData?.content?.publishDestination === 'WORDPRESS') {
          const wpConfig = campaign.campaignData.content.wordpressConfig;
          console.log(`      WordPress: ${wpConfig?.isConnected ? '✅ Connected' : '❌ Not connected'}`);
          if (wpConfig?.url) {
            console.log(`      WP URL: ${wpConfig.url}`);
          }
        }
        console.log('');
      }
    } else {
      console.log('   ⚠️  No campaigns with auto-scheduling enabled');
      console.log('   💡 Enable auto-scheduling in campaign settings to start automation');
    }

    // Check for scheduled articles
    const scheduledArticles = await Article.find({
      autoPublish: true,
      status: 'DRAFT',
      scheduledPublishAt: { $exists: true }
    }).sort('scheduledPublishAt').limit(10);

    if (scheduledArticles.length > 0) {
      console.log('\n' + '─'.repeat(70));
      console.log(`\n📅 UPCOMING SCHEDULED ARTICLES (${scheduledArticles.length}):\n`);
      
      scheduledArticles.forEach((article, index) => {
        const scheduledDate = new Date(article.scheduledPublishAt);
        const now = new Date();
        const hoursUntil = Math.round((scheduledDate - now) / (1000 * 60 * 60));
        
        console.log(`   ${index + 1}. ${article.title}`);
        console.log(`      Scheduled: ${scheduledDate.toLocaleString()}`);
        console.log(`      Time until publish: ${hoursUntil > 0 ? `${hoursUntil} hours` : 'Overdue'}`);
        console.log(`      Auto-publish to WP: ${article.wordpress?.autoPublish ? 'Yes' : 'No'}`);
        console.log('');
      });
    }

    console.log('='.repeat(70));
    console.log('✅ AUTOMATION EXPLANATION COMPLETE');
    console.log('='.repeat(70) + '\n');

    console.log('💡 TO ENABLE AUTOMATION:');
    console.log('   1. Go to Campaign Dashboard');
    console.log('   2. Click "Automation" button');
    console.log('   3. Enable "Auto-Scheduling"');
    console.log('   4. Set frequency and time');
    console.log('   5. Configure WordPress (optional)');
    console.log('   6. Keep system running 24/7');
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

testCampaignAutomation();
