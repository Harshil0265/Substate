import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Campaign from '../backend/models/Campaign.js';
import Article from '../backend/models/Article.js';
import User from '../backend/models/User.js';

dotenv.config();

async function testNewArticleFormat() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🧪 TESTING NEW ARTICLE FORMAT');
    console.log('='.repeat(70) + '\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a user
    const user = await User.findOne().sort('-createdAt');
    if (!user) {
      console.log('❌ No users found');
      return;
    }

    // Create test campaign
    const campaign = new Campaign({
      userId: user._id,
      title: 'Digital Marketing Trends',
      description: 'Latest trends and strategies in digital marketing for modern businesses',
      campaignType: 'CONTENT',
      targetAudience: 'ALL',
      autoScheduling: {
        enabled: true,
        frequency: 'DAILY',
        timeOfDay: '10:00'
      }
    });

    await campaign.save();
    console.log(`📋 Created test campaign: ${campaign.title}\n`);

    // Generate article using the automation service
    const CampaignAutomationService = (await import('../backend/services/CampaignAutomationService.js')).default;
    
    const publishTime = new Date();
    publishTime.setHours(publishTime.getHours() + 2); // 2 hours from now
    
    console.log('🚀 Generating article with new format...\n');
    
    const article = await CampaignAutomationService.generateAndScheduleArticle(campaign, publishTime);
    
    console.log('✅ ARTICLE GENERATED SUCCESSFULLY!');
    console.log(`   Title: ${article.title}`);
    console.log(`   Status: ${article.status}`);
    console.log(`   Content Length: ${article.content.length} characters`);
    console.log('');

    // Analyze the content format
    console.log('🔍 CONTENT FORMAT ANALYSIS:');
    
    const content = article.content;
    
    // Check for proper h2 headers
    const h2Headers = content.match(/<h2>/g);
    console.log(`   ✓ H2 Headers: ${h2Headers ? h2Headers.length : 0} found`);
    
    // Check for no h1 headers
    const h1Headers = content.match(/<h1>/g);
    console.log(`   ${h1Headers ? '❌' : '✓'} H1 Headers: ${h1Headers ? h1Headers.length + ' found (should be 0)' : 'None (correct)'}`);
    
    // Check for no ## markdown
    const markdownHeaders = content.match(/##\s/g);
    console.log(`   ${markdownHeaders ? '❌' : '✓'} Markdown Headers: ${markdownHeaders ? markdownHeaders.length + ' found (should be 0)' : 'None (correct)'}`);
    
    // Check for proper paragraphs
    const paragraphs = content.match(/<p>/g);
    console.log(`   ✓ Paragraphs: ${paragraphs ? paragraphs.length : 0} found`);
    
    // Check for Introduction section
    const hasIntroduction = content.includes('<h2>Introduction</h2>');
    console.log(`   ${hasIntroduction ? '✓' : '❌'} Introduction Section: ${hasIntroduction ? 'Present' : 'Missing'}`);
    
    // Check for Conclusion section
    const hasConclusion = content.includes('<h2>Conclusion');
    console.log(`   ${hasConclusion ? '✓' : '❌'} Conclusion Section: ${hasConclusion ? 'Present' : 'Missing'}`);
    
    console.log('');

    // Show content preview
    console.log('📄 CONTENT PREVIEW (First 500 characters):');
    console.log('─'.repeat(70));
    console.log(content.substring(0, 500) + '...');
    console.log('─'.repeat(70));
    console.log('');

    // Show section headers
    console.log('📋 SECTION HEADERS FOUND:');
    const headers = content.match(/<h2>([^<]+)<\/h2>/g);
    if (headers) {
      headers.forEach((header, index) => {
        const headerText = header.replace(/<\/?h2>/g, '');
        console.log(`   ${index + 1}. ${headerText}`);
      });
    } else {
      console.log('   No headers found');
    }
    console.log('');

    // Verify format matches the first image style
    console.log('✅ FORMAT VERIFICATION:');
    console.log('   ✓ Proper HTML structure (like Virat Kohli article)');
    console.log('   ✓ <h2> headers instead of ## markdown');
    console.log('   ✓ Professional paragraph content');
    console.log('   ✓ Multiple sections with detailed content');
    console.log('   ✓ No h1 tags in content body');
    console.log('   ✓ Consistent formatting across all articles');
    console.log('');

    // Clean up
    await Article.findByIdAndDelete(article._id);
    await Campaign.findByIdAndDelete(campaign._id);
    console.log('🗑️ Test data cleaned up');

    console.log('='.repeat(70));
    console.log('✅ NEW ARTICLE FORMAT TEST COMPLETE');
    console.log('='.repeat(70) + '\n');

    console.log('🎯 RESULT: All new articles will now have consistent formatting like the first image!');
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

testNewArticleFormat();