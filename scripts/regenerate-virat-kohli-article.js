/**
 * Regenerate Virat Kohli Article with Images
 * Direct script to update the Virat Kohli article
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import AIContentGenerator from '../backend/services/AIContentGenerator.js';
import ImageService from '../backend/services/ImageService.js';
import Article from '../backend/models/Article.js';

dotenv.config();

async function regenerateViratKohliArticle() {
  try {
    console.log('\n🔄 REGENERATING VIRAT KOHLI ARTICLE WITH IMAGES\n');
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

    // Generate new content with images
    console.log('\n📝 Generating new content with images...');
    console.log('-'.repeat(70));

    const aiGenerator = new AIContentGenerator();
    const content = await aiGenerator.generateComprehensiveArticle('Virat Kohli', {
      minLength: 1200,
      targetLength: 1800,
      includeImages: true
    });

    const placeholders = content.match(/<!--\s*IMAGE:[^-]+-->/gi) || [];
    console.log(`✅ Generated content with ${placeholders.length} image placeholders`);

    // Replace placeholders with real images
    console.log('\n🖼️ Processing images...');
    const imageResult = await ImageService.replaceImagePlaceholders(content, 'Virat Kohli');
    
    const newImgs = (imageResult.content.match(/<img[^>]+>/gi) || []).length;
    console.log(`✅ ${newImgs} images added to content`);

    // Update article
    console.log('\n💾 Updating article...');
    article.content = imageResult.content;
    article.wordCount = imageResult.content.split(/\s+/).filter(w => w.length > 0).length;
    article.excerpt = imageResult.content.substring(0, 200).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() + '...';
    article.updatedAt = new Date();
    article.metadata = {
      ...article.metadata,
      imagesAdded: imageResult.imagesReplaced,
      regeneratedAt: new Date(),
      regeneratedWithImages: true
    };

    await article.save();
    console.log('✅ Article updated successfully');

    // Verify
    console.log('\n✅ Verification:');
    const updated = await Article.findById(article._id);
    const finalImgs = (updated.content.match(/<img[^>]+>/gi) || []).length;
    
    console.log(`📊 Title: ${updated.title}`);
    console.log(`📊 Word Count: ${updated.wordCount}`);
    console.log(`📊 Images: ${finalImgs}`);
    console.log(`📊 Content Length: ${updated.content.length} characters`);

    // Show first image
    const firstImg = updated.content.match(/<img[^>]+>/i);
    if (firstImg) {
      console.log('\n🖼️ First image tag:');
      console.log(firstImg[0].substring(0, 150) + '...');
    }

    // Show preview
    console.log('\n👁️ Content Preview (first 500 characters):');
    console.log('-'.repeat(70));
    console.log(updated.content.substring(0, 500).replace(/\n+/g, '\n'));
    console.log('...');
    console.log('-'.repeat(70));

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ REGENERATION COMPLETE');
    console.log('='.repeat(70));
    console.log(`✓ Article: ${updated.title}`);
    console.log(`✓ Before: ${currentImgs} images → After: ${finalImgs} images`);
    console.log(`✓ Word Count: ${updated.wordCount} words`);
    console.log(`✓ Added: ${finalImgs - currentImgs} new images`);
    
    console.log('\n📝 To view the updated article:');
    console.log(`   1. Go to Article Management`);
    console.log(`   2. Find "Virat Kohli" article`);
    console.log(`   3. Click Edit button`);
    console.log(`   4. Click Preview button to see images rendered\n`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

console.log('🚀 Starting Virat Kohli Article Regeneration...\n');
regenerateViratKohliArticle()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
