import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Article from '../backend/models/Article.js';
import User from '../backend/models/User.js';
import WordPressIntegration from '../backend/models/WordPressIntegration.js';
import WordPressService from '../backend/services/WordPressService.js';
import ImageService from '../backend/services/ImageService.js';

dotenv.config();

async function fixArticleImages() {
  try {
    console.log('🖼️ FIXING ARTICLE IMAGES\n');
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

    // Find the article
    const article = await Article.findOne({
      userId: user._id,
      title: 'Virat Kohli'
    });

    if (!article) {
      console.log('\n❌ Article not found');
      process.exit(1);
    }

    console.log('\n📄 Article:', article.title);
    console.log('   ID:', article._id);

    // Check current images
    const currentImgMatches = article.content.match(/<img[^>]+src="([^"]+)"[^>]*>/g);
    console.log('\n🖼️ Current images:', currentImgMatches ? currentImgMatches.length : 0);

    if (currentImgMatches) {
      console.log('\n📊 Current Image URLs:');
      currentImgMatches.forEach((img, index) => {
        const srcMatch = img.match(/src="([^"]+)"/);
        console.log(`   ${index + 1}. ${srcMatch ? srcMatch[1] : 'N/A'}`);
      });
    }

    // Get real images from Pixabay
    console.log('\n🔍 Fetching real images from Pixabay...');
    const keywords = 'virat kohli cricket india';
    const images = await ImageService.searchPixabayImages(keywords, 'photo', 10);

    if (!images || images.length === 0) {
      console.log('❌ No images found from Pixabay');
      console.log('⚠️ Trying generic cricket images...');
      const fallbackImages = await ImageService.searchPixabayImages('cricket player india', 'photo', 10);
      
      if (!fallbackImages || fallbackImages.length === 0) {
        console.log('❌ No fallback images found either');
        process.exit(1);
      }
      
      console.log(`✅ Found ${fallbackImages.length} fallback images`);
      
      // Use fallback images
      console.log('\n📊 Available Images:');
      fallbackImages.slice(0, 6).forEach((img, index) => {
        console.log(`   ${index + 1}. ${img.largeImageURL}`);
        console.log(`      Size: ${img.imageWidth}x${img.imageHeight}`);
        console.log(`      Tags: ${img.tags}`);
      });

      // Replace images in content
      console.log('\n🔄 Replacing images in article content...');
      let updatedContent = article.content;

      const imgTags = updatedContent.match(/<img[^>]+>/g);
      if (imgTags) {
        imgTags.forEach((imgTag, index) => {
          if (index < fallbackImages.length) {
            const newImg = fallbackImages[index];
            const altMatch = imgTag.match(/alt="([^"]*)"/);
            const altText = altMatch ? altMatch[1] : newImg.tags;
            
            const newImgTag = `<img src="${newImg.largeImageURL}" alt="${altText}" />`;
            updatedContent = updatedContent.replace(imgTag, newImgTag);
            console.log(`   ✅ Replaced image ${index + 1}`);
          }
        });
      }

      // Save updated article
      article.content = updatedContent;
      await article.save();
      console.log('\n✅ Article content updated with real images');

      // Update WordPress
      if (article.wordpress && article.wordpress.postId) {
        console.log('\n🔄 Updating WordPress post...');
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
          console.log('   URL:', result.wordpressPost.url);
          console.log('\n📝 Please check the WordPress post - images should now display:');
          console.log('   ' + result.wordpressPost.url);
        } else {
          console.log('❌ Failed to update WordPress:', result.message);
        }
      }

      console.log('\n' + '='.repeat(80));
      console.log('\n✅ Image fix completed!\n');
      process.exit(0);
    }

    console.log(`✅ Found ${images.length} images from Pixabay`);
    
    // Show available images
    console.log('\n📊 Available Images:');
    images.slice(0, 6).forEach((img, index) => {
      console.log(`   ${index + 1}. ${img.largeImageURL}`);
      console.log(`      Size: ${img.imageWidth}x${img.imageHeight}`);
      console.log(`      Tags: ${img.tags}`);
    });

    // Replace images in content
    console.log('\n🔄 Replacing images in article content...');
    let updatedContent = article.content;

    const imgTags = updatedContent.match(/<img[^>]+>/g);
    if (imgTags) {
      imgTags.forEach((imgTag, index) => {
        if (index < images.length) {
          const newImg = images[index];
          const altMatch = imgTag.match(/alt="([^"]*)"/);
          const altText = altMatch ? altMatch[1] : newImg.tags;
          
          const newImgTag = `<img src="${newImg.largeImageURL}" alt="${altText}" />`;
          updatedContent = updatedContent.replace(imgTag, newImgTag);
          console.log(`   ✅ Replaced image ${index + 1}`);
        }
      });
    }

    // Save updated article
    article.content = updatedContent;
    await article.save();
    console.log('\n✅ Article content updated with real images');

    // Update WordPress
    if (article.wordpress && article.wordpress.postId) {
      console.log('\n🔄 Updating WordPress post...');
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
        console.log('   URL:', result.wordpressPost.url);
        console.log('\n📝 Please check the WordPress post - images should now display:');
        console.log('   ' + result.wordpressPost.url);
      } else {
        console.log('❌ Failed to update WordPress:', result.message);
      }
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Image fix completed!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

fixArticleImages();
