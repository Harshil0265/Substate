import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Article from '../backend/models/Article.js';
import User from '../backend/models/User.js';
import WordPressIntegration from '../backend/models/WordPressIntegration.js';
import WordPressService from '../backend/services/WordPressService.js';

dotenv.config();

async function testWordPressImages() {
  try {
    console.log('🖼️ TESTING WORDPRESS IMAGE DISPLAY\n');
    console.log('=' .repeat(80));
    
    console.log('\n🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get user
    const user = await User.findOne({ email: 'barotharshil070@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }

    // Get WordPress integration
    const integration = await WordPressIntegration.findOne({ userId: user._id });
    if (!integration) {
      console.log('❌ No WordPress integration found');
      process.exit(1);
    }

    console.log('📋 User:', user.name);
    console.log('📋 WordPress Site:', integration.siteUrl);

    // Find an article with images
    const article = await Article.findOne({
      userId: user._id,
      'wordpress.postId': { $exists: true }
    });

    if (!article) {
      console.log('\n❌ No published articles found');
      process.exit(1);
    }

    console.log('\n📄 Article:', article.title);
    console.log('   WordPress Post ID:', article.wordpress.postId);
    console.log('   WordPress URL:', article.wordpress.url);

    // Check if article has images
    const imgMatches = article.content.match(/<img[^>]+>/g);
    console.log('\n🖼️ Images in content:', imgMatches ? imgMatches.length : 0);

    if (imgMatches) {
      console.log('\n📊 Image Analysis:');
      imgMatches.forEach((img, index) => {
        const srcMatch = img.match(/src="([^"]+)"/);
        const altMatch = img.match(/alt="([^"]*)"/);
        console.log(`\n   Image ${index + 1}:`);
        console.log(`   - Source: ${srcMatch ? srcMatch[1] : 'N/A'}`);
        console.log(`   - Alt text: ${altMatch ? altMatch[1] : 'N/A'}`);
        console.log(`   - Full tag: ${img.substring(0, 100)}...`);
      });
    }

    // Test the formatting
    console.log('\n🔄 Testing content formatting with images...\n');
    const formattedContent = WordPressService.formatContent(article.content);

    // Check formatted content for images
    const formattedImgMatches = formattedContent.match(/<img[^>]+>/g);
    console.log('🖼️ Images after formatting:', formattedImgMatches ? formattedImgMatches.length : 0);

    if (formattedImgMatches) {
      console.log('\n📊 Formatted Image Analysis:');
      formattedImgMatches.forEach((img, index) => {
        const srcMatch = img.match(/src="([^"]+)"/);
        const styleMatch = img.match(/style="([^"]*)"/);
        console.log(`\n   Image ${index + 1}:`);
        console.log(`   - Source: ${srcMatch ? srcMatch[1] : 'N/A'}`);
        console.log(`   - Has styling: ${styleMatch ? 'Yes' : 'No'}`);
        if (styleMatch) {
          console.log(`   - Style: ${styleMatch[1]}`);
        }
      });
    }

    // Check if images are wrapped in figure tags
    const figureMatches = formattedContent.match(/<figure[^>]*>[\s\S]*?<\/figure>/g);
    console.log('\n📦 Figure wrappers:', figureMatches ? figureMatches.length : 0);

    if (figureMatches) {
      console.log('\n📊 Figure Analysis:');
      figureMatches.forEach((figure, index) => {
        console.log(`\n   Figure ${index + 1}:`);
        console.log(`   ${figure.substring(0, 150)}...`);
      });
    }

    // Now update the article in WordPress with proper image formatting
    console.log('\n' + '='.repeat(80));
    console.log('\n🔄 Updating WordPress post with proper image formatting...\n');

    const wpConfig = integration.getConfig();
    const result = await WordPressService.updateArticle(
      wpConfig,
      article.wordpress.postId,
      article,
      {
        status: article.wordpress.status || 'draft'
      }
    );

    if (result.success) {
      console.log('✅ WordPress post updated successfully!');
      console.log('   Post ID:', result.wordpressPost.id);
      console.log('   URL:', result.wordpressPost.url);
      console.log('\n📝 Please check the WordPress post to verify images are displaying correctly:');
      console.log('   ' + result.wordpressPost.url);
    } else {
      console.log('❌ Failed to update WordPress post:', result.message);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Test completed!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testWordPressImages();
