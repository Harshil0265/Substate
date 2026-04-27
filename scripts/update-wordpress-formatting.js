import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Article from '../backend/models/Article.js';
import WordPressIntegration from '../backend/models/WordPressIntegration.js';
import WordPressService from '../backend/services/WordPressService.js';

dotenv.config();

async function updateWordPressFormatting() {
  try {
    console.log('🎨 UPDATE WORDPRESS ARTICLE FORMATTING\n');
    console.log('=' .repeat(80));
    
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get user email from command line
    const userEmail = process.argv[2];
    
    if (!userEmail) {
      console.log('❌ Please provide your email address');
      console.log('\n📝 USAGE:');
      console.log('   node scripts/update-wordpress-formatting.js <your-email>');
      console.log('\n📝 EXAMPLE:');
      console.log('   node scripts/update-wordpress-formatting.js barotharshil070@gmail.com\n');
      process.exit(1);
    }

    // Find user
    const { default: User } = await import('../backend/models/User.js');
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.log(`❌ User not found: ${userEmail}`);
      process.exit(1);
    }

    console.log('📋 User found:', user.name);
    console.log('   Email:', user.email);

    // Find WordPress integration
    const integration = await WordPressIntegration.findOne({ userId: user._id });
    
    if (!integration) {
      console.log('\n❌ No WordPress integration found for this user');
      console.log('   Please set up WordPress integration first');
      process.exit(1);
    }

    console.log('\n📋 WordPress Integration:');
    console.log('   Name:', integration.name);
    console.log('   Site URL:', integration.siteUrl);

    // Find all articles that have been published to WordPress
    const articles = await Article.find({
      userId: user._id,
      'wordpress.postId': { $exists: true, $ne: null }
    });

    if (articles.length === 0) {
      console.log('\n⚠️ No articles found that are published to WordPress');
      process.exit(0);
    }

    console.log(`\n📊 Found ${articles.length} article(s) published to WordPress`);
    console.log('=' .repeat(80));

    // Ask for confirmation
    console.log('\n⚠️  This will update ALL your WordPress articles with new formatting');
    console.log('   This operation cannot be undone!');
    console.log('\n   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🔄 Starting update process...\n');

    const wpConfig = integration.getConfig();
    let successCount = 0;
    let failCount = 0;
    const results = [];

    for (let i = 0; i < articles.length; i++) {
      const article = articles[i];
      const progress = `[${i + 1}/${articles.length}]`;
      
      console.log(`${progress} Updating: "${article.title}"`);
      console.log(`   WordPress Post ID: ${article.wordpress.postId}`);

      try {
        // Update the article in WordPress with new formatting
        const result = await WordPressService.updateArticle(
          wpConfig,
          article.wordpress.postId,
          article,
          {
            status: article.wordpress.status || 'draft'
          }
        );

        if (result.success) {
          successCount++;
          console.log(`   ✅ Updated successfully`);
          results.push({
            title: article.title,
            postId: article.wordpress.postId,
            status: 'success',
            url: result.wordpressPost.url
          });
        } else {
          failCount++;
          console.log(`   ❌ Failed: ${result.message}`);
          results.push({
            title: article.title,
            postId: article.wordpress.postId,
            status: 'failed',
            error: result.message
          });
        }
      } catch (error) {
        failCount++;
        console.log(`   ❌ Error: ${error.message}`);
        results.push({
          title: article.title,
          postId: article.wordpress.postId,
          status: 'error',
          error: error.message
        });
      }

      console.log(); // Empty line for readability

      // Add a small delay to avoid overwhelming WordPress
      if (i < articles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Summary
    console.log('=' .repeat(80));
    console.log('\n📊 UPDATE SUMMARY:');
    console.log('   Total articles:', articles.length);
    console.log('   ✅ Successfully updated:', successCount);
    console.log('   ❌ Failed:', failCount);

    if (successCount > 0) {
      console.log('\n✅ SUCCESSFUL UPDATES:');
      results.filter(r => r.status === 'success').forEach(r => {
        console.log(`   • ${r.title}`);
        console.log(`     URL: ${r.url}`);
      });
    }

    if (failCount > 0) {
      console.log('\n❌ FAILED UPDATES:');
      results.filter(r => r.status !== 'success').forEach(r => {
        console.log(`   • ${r.title}`);
        console.log(`     Error: ${r.error}`);
      });
    }

    console.log('\n' + '=' .repeat(80));
    console.log('\n✅ Update process completed!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

updateWordPressFormatting();
