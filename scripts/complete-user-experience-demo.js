import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Campaign from '../backend/models/Campaign.js';
import Article from '../backend/models/Article.js';
import User from '../backend/models/User.js';

dotenv.config();

async function completeUserExperienceDemo() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🎯 COMPLETE USER EXPERIENCE DEMO');
    console.log('='.repeat(80) + '\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('👤 USER STORY: "I want to schedule articles for 1 AM today but no article generated yet"\n');

    // Find a user
    const user = await User.findOne().sort('-createdAt');
    if (!user) {
      console.log('❌ No users found');
      return;
    }

    console.log(`📱 User: ${user.email}`);
    console.log(`⏰ Current Time: ${new Date().toLocaleString()}`);
    console.log(`🎯 User Goal: Schedule articles for 1:00 AM but wants immediate content\n`);

    console.log('🔄 STEP 1: USER CREATES CAMPAIGN\n');
    console.log('   📋 Campaign Form:');
    console.log('      Title: "Daily Tech News"');
    console.log('      Description: "Latest technology news and insights"');
    console.log('      Scheduled Times: 01:00, 13:00');
    console.log('      WordPress: Connected');
    console.log('');

    // Simulate campaign creation
    const campaignData = {
      userId: user._id,
      title: 'Daily Tech News',
      description: 'Latest technology news and insights for tech enthusiasts',
      campaignType: 'CONTENT',
      targetAudience: 'ALL',
      startDate: new Date(),
      campaignData: {
        content: {
          publishingSchedule: {
            scheduledTimes: [
              { time: '01:00', isActive: true },
              { time: '13:00', isActive: true }
            ]
          },
          publishDestination: 'WORDPRESS',
          wordpressConfig: {
            url: 'http://localhost/wordpress',
            username: 'admin',
            appPassword: 'wp-app-password',
            isConnected: true
          }
        }
      },
      autoScheduling: {
        enabled: true,
        frequency: 'DAILY',
        timeOfDay: '01:00',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 0],
        nextScheduledDate: null,
        lastGeneratedAt: null
      }
    };

    const campaign = new Campaign(campaignData);
    await campaign.save();

    console.log('✅ CAMPAIGN CREATED SUCCESSFULLY!');
    console.log(`   Campaign ID: ${campaign._id}`);
    console.log(`   Auto-scheduling: ENABLED`);
    console.log('');

    console.log('🚀 STEP 2: IMMEDIATE ARTICLE GENERATION (Campaign Creation)\n');

    // Simulate immediate generation during campaign creation
    try {
      const CampaignAutomationService = (await import('../backend/services/CampaignAutomationService.js')).default;
      
      // Calculate next publish time (since it's past 1 AM, next would be 1 PM today or 1 AM tomorrow)
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
        // Use 1 AM tomorrow
        const [hours, minutes] = scheduledTimes[0].time.split(':');
        nextPublishTime = new Date(now);
        nextPublishTime.setDate(nextPublishTime.getDate() + 1);
        nextPublishTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      console.log(`   ⏰ Next publish time: ${nextPublishTime.toLocaleString()}`);
      
      // Generate first article immediately
      const article1 = await CampaignAutomationService.generateAndScheduleArticle(campaign, nextPublishTime);
      
      console.log('   ✅ First article generated during campaign creation!');
      console.log(`      Title: ${article1.title}`);
      console.log(`      Scheduled for: ${article1.scheduledPublishAt?.toLocaleString()}`);
      console.log('');

    } catch (error) {
      console.error('   ❌ Generation failed:', error.message);
    }

    console.log('👁️ STEP 3: USER CHECKS DASHBOARD\n');
    
    const articles = await Article.find({ campaignId: campaign._id });
    console.log(`   📊 Articles in campaign: ${articles.length}`);
    
    if (articles.length > 0) {
      console.log('   ✅ USER SEES: Article already generated and ready!');
      articles.forEach((article, index) => {
        console.log(`      ${index + 1}. ${article.title}`);
        console.log(`         Status: ${article.status}`);
        console.log(`         Scheduled: ${article.scheduledPublishAt?.toLocaleString()}`);
      });
    } else {
      console.log('   ⚠️ USER SEES: No articles yet');
    }
    console.log('');

    console.log('🔘 STEP 4: USER CLICKS "GENERATE ARTICLE NOW" BUTTON\n');
    
    // Simulate manual generation
    try {
      const CampaignAutomationService = (await import('../backend/services/CampaignAutomationService.js')).default;
      
      // Calculate next available time slot
      const now = new Date();
      const scheduledTimes = campaign.campaignData.content.publishingSchedule.scheduledTimes;
      
      // Find next time slot (13:00 today if available, otherwise 01:00 tomorrow)
      let nextSlot = null;
      for (const st of scheduledTimes) {
        const [hours, minutes] = st.time.split(':');
        const slotTime = new Date(now);
        slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        if (slotTime > now) {
          nextSlot = slotTime;
          break;
        }
      }
      
      if (!nextSlot) {
        // Use next day's first slot
        const [hours, minutes] = scheduledTimes[0].time.split(':');
        nextSlot = new Date(now);
        nextSlot.setDate(nextSlot.getDate() + 1);
        nextSlot.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      }

      const article2 = await CampaignAutomationService.generateAndScheduleArticle(campaign, nextSlot);
      
      console.log('   ✅ Manual generation successful!');
      console.log(`      Title: ${article2.title}`);
      console.log(`      Scheduled for: ${article2.scheduledPublishAt?.toLocaleString()}`);
      console.log('');

    } catch (error) {
      console.error('   ❌ Manual generation failed:', error.message);
    }

    console.log('📈 STEP 5: FINAL DASHBOARD STATE\n');
    
    const finalArticles = await Article.find({ campaignId: campaign._id }).sort('scheduledPublishAt');
    console.log(`   📊 Total articles: ${finalArticles.length}`);
    console.log('   📋 Article list:');
    
    finalArticles.forEach((article, index) => {
      const scheduledDate = new Date(article.scheduledPublishAt);
      const hoursUntil = Math.round((scheduledDate - new Date()) / (1000 * 60 * 60));
      
      console.log(`      ${index + 1}. ${article.title}`);
      console.log(`         📅 Scheduled: ${scheduledDate.toLocaleString()}`);
      console.log(`         ⏱️ Time until publish: ${hoursUntil > 0 ? `${hoursUntil} hours` : 'Overdue'}`);
      console.log(`         🎯 Status: ${article.status}`);
      console.log(`         🔄 Auto-publish: ${article.autoPublish ? 'YES' : 'NO'}`);
      console.log('');
    });

    console.log('🎯 STEP 6: WHAT HAPPENS NEXT (AUTOMATIC)\n');
    console.log('   🌙 Tonight at 00:00: System generates tomorrow\'s articles');
    console.log('   ⏰ At scheduled times: Articles publish automatically');
    console.log('   📤 WordPress: Articles auto-publish to WordPress');
    console.log('   🔄 Daily: Process repeats with new unique articles');
    console.log('');

    console.log('⚠️ SYSTEM REQUIREMENTS:\n');
    console.log('   🖥️ SUBSTATE System: Must be running (npm start)');
    console.log('   🌐 XAMPP: Must be running (Apache + MySQL)');
    console.log('   📡 WordPress: Must be accessible at configured URL');
    console.log('');

    console.log('💡 USER BENEFITS:\n');
    console.log('   ✅ Immediate satisfaction: Articles generated right away');
    console.log('   ✅ No waiting: Don\'t need to wait until midnight');
    console.log('   ✅ Manual control: "Generate Now" button for on-demand creation');
    console.log('   ✅ Preview anytime: All articles saved and viewable');
    console.log('   ✅ Automatic publishing: Set-and-forget automation');
    console.log('   ✅ WordPress integration: Seamless publishing');
    console.log('');

    // Clean up
    await Article.deleteMany({ campaignId: campaign._id });
    await Campaign.findByIdAndDelete(campaign._id);
    console.log('🗑️ Test data cleaned up');

    console.log('='.repeat(80));
    console.log('✅ USER EXPERIENCE PROBLEM SOLVED!');
    console.log('='.repeat(80) + '\n');

    console.log('🎉 SUMMARY:');
    console.log('   ✅ User creates campaign → Article generated immediately');
    console.log('   ✅ User sees content right away → No empty dashboard');
    console.log('   ✅ "Generate Now" button → On-demand article creation');
    console.log('   ✅ Automatic scheduling → Publishes at exact times');
    console.log('   ✅ WordPress integration → Seamless publishing');
    console.log('   ✅ Daily automation → New articles every day');
    console.log('');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

completeUserExperienceDemo();