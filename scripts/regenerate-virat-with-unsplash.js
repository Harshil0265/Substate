/**
 * Regenerate Virat Kohli Article with Unsplash Images
 * Uses existing content and just replaces images
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import ImageService from '../backend/services/ImageService.js';
import Article from '../backend/models/Article.js';

dotenv.config();

async function regenerateViratKohliWithImages() {
  try {
    console.log('\n🔄 REGENERATING VIRAT KOHLI ARTICLE WITH UNSPLASH IMAGES\n');
    console.log('='.repeat(70));

    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the Virat Kohli article
    const article = await Article.findOne({ title: 'Virat Kohli' });
    
    if (!article) {
      console.log('❌ Virat Kohli article not found');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`✅ Found article: ${article.title}`);
    console.log(`📊 Article ID: ${article._id}`);
    console.log(`📊 Current word count: ${article.wordCount}`);
    
    const currentImgs = (article.content.match(/<img[^>]+>/gi) || []).length;
    console.log(`📊 Current images: ${currentImgs}`);

    // Check if content has image placeholders
    const hasPlaceholders = article.content.includes('<!-- IMAGE:');
    
    if (!hasPlaceholders) {
      console.log('\n⚠️ Article has no image placeholders');
      console.log('Adding image placeholders to existing content...\n');
      
      // Add image placeholders to existing content
      const paragraphs = article.content.split('</p>');
      const newContent = [];
      
      for (let i = 0; i < paragraphs.length; i++) {
        newContent.push(paragraphs[i]);
        
        // Add image after every 3rd paragraph
        if (i > 0 && i < paragraphs.length - 1 && (i + 1) % 3 === 0) {
          newContent.push('\n\n<!-- IMAGE: Virat Kohli cricket action -->\n\n');
        }
      }
      
      article.content = newContent.join('</p>');
    }

    // Replace placeholders with real Unsplash images
    console.log('\n🖼️ Processing images with Unsplash...');
    const imageResult = await ImageService.replaceImagePlaceholders(article.content, 'Virat Kohli cricket');
    
    const newImgs = (imageResult.content.match(/<img[^>]+>/gi) || []).length;
    console.log(`✅ ${newImgs} images added to content`);

    // Count real images vs placeholders
    const unsplashImgs = (imageResult.content.match(/unsplash\.com/g) || []).length;
    const pixabayImgs = (imageResult.content.match(/pixabay\.com/g) || []).length;
    const placeholderImgs = (imageResult.content.match(/placeholder\.com/g) || []).length;
    
    console.log(`📊 Unsplash images: ${unsplashImgs}`);
    console.log(`📊 Pixabay images: ${pixabayImgs}`);
    console.log(`📊 Placeholders: ${placeholderImgs}`);

    // Update article
    console.log('\n💾 Updating article...');
    article.content = imageResult.content;
    article.wordCount = imageResult.content.split(/\s+/).filter(w => w.length > 0).length;
    article.excerpt = imageResult.content.substring(0, 200).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() + '...';
    article.updatedAt = new Date();
    article.metadata = {
      ...article.metadata,
      imagesAdded: imageResult.imagesReplaced,
      unsplashImages: unsplashImgs,
      regeneratedAt: new Date(),
      regeneratedWithUnsplash: true
    };

    await article.save();
    console.log('✅ Article updated successfully');

    // Verify
    console.log('\n✅ Verification:');
    const updated = await Article.findById(article._id);
    const finalImgs = (updated.content.match(/<img[^>]+>/gi) || []).length;
    
    console.log(`📊 Title: ${updated.title}`);
    console.log(`📊 Word Count: ${updated.wordCount}`);
    console.log(`📊 Total Images: ${finalImgs}`);
    console.log(`📊 Content Length: ${updated.content.length} characters`);

    // Show first image
    const firstImg = updated.content.match(/<img[^>]+>/i);
    if (firstImg) {
      console.log('\n🖼️ First image tag:');
      console.log(firstImg[0].substring(0, 150) + '...');
    }

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ REGENERATION COMPLETE');
    console.log('='.repeat(70));
    console.log(`✓ Article: ${updated.title}`);
    console.log(`✓ Before: ${currentImgs} images → After: ${finalImgs} images`);
    console.log(`✓ Real Unsplash images: ${unsplashImgs}`);
    console.log(`✓ Word Count: ${updated.wordCount} words`);
    
    console.log('\n📝 To view the updated article:');
    console.log(`   1. Go to Article Management`);
    console.log(`   2. Find "Virat Kohli" article`);
    console.log(`   3. Click Edit button`);
    console.log(`   4. Click Preview button to see real Unsplash images!\n`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

console.log('🚀 Starting Virat Kohli Article Regeneration with Unsplash...\n');
regenerateViratKohliWithImages()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
