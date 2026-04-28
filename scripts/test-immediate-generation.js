import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Campaign from '../backend/models/Campaign.js';
import Article from '../backend/models/Article.js';
import User from '../backend/models/User.js';

dotenv.config();

async function testImmediateGeneration() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🧪 TESTING IMMEDIATE ARTICLE GENERATION');
    console.log('='.repeat(70) + '\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a user
    const user = await User.findOne().sort('-createdAt');
    if (!user) {
      console.log('❌ No users found');
      return;
    }

    console.log(`👤 Using user: ${user.email}\n`);

    // Create a test campaign with scheduling
    const campaignData = {
      userId: user._id,
      title: 'Immediate Test Campaign',
      description: 'Testing immediate article generation for user feedback',
      campaignType: 'CONTENT',
      targetAudience: 'ALL',
      startDate: new Date(),
      campaignData: {
        content: {
          publishingSchedule: {
            scheduledTimes: [
              { time: '14:00', isActive: true },
              { time: '18:00', isActive: true }
            ]
          },
          publishDestination: 'WORDPRESS',
          wordpressConfig: {
            url: 'http://localhost/wordpress',
            username: 'admin',
            appPassword: 'test-password',
            isConnected: true
          }
        }
      },
      autoScheduling: {
        enabled: true,
        frequency: 'DAILY',
        timeOfDay: '14:00',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
        nextScheduledDate: null,
        lastGeneratedAt: null
      }
    };

    const campaign = new Campaign(campaignData);
    await campaign.save();

    console.log('📋 CREATED TEST CAMPAIGN:');
    console.log(`   Title: ${campaign.title}`);
    console.log(`   Scheduled Times: ${campaign.campaignData.content.publishingSchedule.scheduledTimes.map(st => st.time).join(', ')}`);
    console.log(`   Auto-scheduling: ${campaign.autoScheduling.enabled ? 'ENABLED' : 'DISABLED'}`);
    console.log('');

    // Check articles before generation
    const articlesBefore = await Article.find({ campaignId: campaign._id });
    console.log(`📊 ARTICLES BEFORE GENERATION: ${articlesBefore.length}`);

    // Simulate immediate generation (like when campaign is created)
    console.log('🚀 SIMULATING IMMEDIATE GENERATION...\n');

    try {
      const CampaignAutomationService = (await import('../backend/services/CampaignAutomationService.js')).default;
      
      // Calculate next publish time
      const now = new Date();
      const scheduledTimes = campaign.campaignData.content.publishingSchedule.scheduledTimes;
      
      let nextPublishTime = null;
      for (const st of scheduledTimes) {
        const [hours, minutes] = st.time.split(':');
        const publishTime = new Date(now);
        publishTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        if (publishTime > now) {
          nextPublishTime = publishTime;
          break;
        }
      }
      
      if (!nextPublishTime) {
        const [hours, minutes] = scheduledTimes[0].time.split(':');
        nextPublishTime = new Date(now);
        nextPublishTime.setDate(nextPublishTime.getDate() + 1);
        nextPublishTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      console.log(`⏰ Next publish time calculated: ${nextPublishTime.toLocaleString()}`);
      
      // Generate article
      const article = await CampaignAutomationService.generateAndScheduleArticle(campaign, nextPublishTime);
      
      console.log('✅ ARTICLE GENERATED SUCCESSFULLY!');
      console.log(`   Title: ${article.title}`);
      console.log(`   Status: ${article.status}`);
      console.log(`   Scheduled for: ${article.scheduledPublishAt?.toLocaleString()}`);
      console.log(`   Auto-publish: ${article.autoPublish ? 'YES' : 'NO'}`);
      console.log(`   WordPress: ${article.wordpress?.autoPublish ? 'YES' : 'NO'}`);
      console.log('');

    } catch (genError) {
      console.error('❌ Generation failed:', genError.message);
    }

    // Check articles after generation
    const articlesAfter = await Article.find({ campaignId: campaign._id });
    console.log(`📊 ARTICLES AFTER GENERATION: ${articlesAfter.length}`);

    if (articlesAfter.length > articlesBefore.length) {
      console.log('✅ SUCCESS: Article was generated immediately!');
      
      const newArticle = articlesAfter[0];
      console.log('\n📝 GENERATED ARTICLE DETAILS:');
      console.log(`   ID: ${newArticle._id}`);
      console.log(`   Title: ${newArticle.title}`);
      console.log(`   Content Length: ${newArticle.content?.length || 0} characters`);
      console.log(`   Excerpt: ${newArticle.excerpt?.substring(0, 100)}...`);
      console.log(`   Status: ${newArticle.status}`);
      console.log(`   Scheduled: ${newArticle.scheduledPublishAt?.toLocaleString()}`);
      console.log(`   AI Generated: ${newArticle.aiGenerated ? 'YES' : 'NO'}`);
    } else {
      console.log('❌ FAILED: No article was generated');
    }

    console.log('\n' + '─'.repeat(70));
    console.log('\n🎯 USER EXPERIENCE SCENARIO:');
    console.log('   1️⃣ User creates campaign at 1:00 PM with schedule: 2:00 PM, 6:00 PM');
    console.log('   2️⃣ System immediately generates first article');
    console.log('   3️⃣ Article is scheduled for next time: 2:00 PM today');
    console.log('   4️⃣ User sees article in dashboard right away');
    console.log('   5️⃣ At 2:00 PM: Article publishes automatically');
    console.log('   6️⃣ At midnight: System generates tomorrow\'s articles');
    console.log('');

    console.log('💡 MANUAL GENERATION:');
    console.log('   🔘 "Generate Article Now" button available in dashboard');
    console.log('   🔘 Creates article immediately for next scheduled time');
    console.log('   🔘 No waiting until midnight');
    console.log('   🔘 Perfect for testing and immediate content needs');

    // Clean up
    await Article.deleteMany({ campaignId: campaign._id });
    await Campaign.findByIdAndDelete(campaign._id);
    console.log('\n🗑️ Test data cleaned up');

    console.log('\n' + '='.repeat(70));
    console.log('✅ IMMEDIATE GENERATION TEST COMPLETE');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

testImmediateGeneration();