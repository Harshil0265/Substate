/**
 * Update Existing Article with Images
 * This script finds an existing article and regenerates it with images
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import AIContentGenerator from '../backend/services/AIContentGenerator.js';
import ImageService from '../backend/services/ImageService.js';
import Article from '../backend/models/Article.js';
import readline from 'readline';

// Load environment variables
dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

async function updateArticleWithImages() {
  try {
    console.log('\n🔄 UPDATE EXISTING ARTICLE WITH IMAGES\n');
    console.log('='.repeat(70));

    await connectDB();

    // List all articles
    console.log('\n📚 Fetching all articles...');
    const articles = await Article.find().sort({ createdAt: -1 }).limit(20);
    
    if (articles.length === 0) {
      console.log('❌ No articles found in database.');
      rl.close();
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`\n✅ Found ${articles.length} articles:\n`);
    articles.forEach((article, index) => {
      const imgCount = (article.content.match(/<img[^>]+>/gi) || []).length;
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   ID: ${article._id}`);
      console.log(`   Words: ${article.wordCount} | Images: ${imgCount} | Status: ${article.status}`);
      console.log(`   Created: ${article.createdAt.toLocaleDateString()}\n`);
    });

    // Ask user which article to update
    const answer = await question('Enter article number to update (or "q" to quit): ');
    
    if (answer.toLowerCase() === 'q') {
      console.log('👋 Exiting...');
      rl.close();
      await mongoose.disconnect();
      process.exit(0);
    }

    const articleIndex = parseInt(answer) - 1;
    
    if (isNaN(articleIndex) || articleIndex < 0 || articleIndex >= articles.length) {
      console.log('❌ Invalid article number');
      rl.close();
      await mongoose.disconnect();
      process.exit(1);
    }

    const selectedArticle = articles[articleIndex];
    console.log(`\n✅ Selected: ${selectedArticle.title}`);
    
    const currentImgCount = (selectedArticle.content.match(/<img[^>]+>/gi) || []).length;
    console.log(`📊 Current images: ${currentImgCount}`);
    console.log(`📊 Current word count: ${selectedArticle.wordCount}`);

    // Confirm regeneration
    const confirm = await question('\n⚠️ This will regenerate the article content. Continue? (yes/no): ');
    
    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('❌ Cancelled');
      rl.close();
      await mongoose.disconnect();
      process.exit(0);
    }

    rl.close();

    console.log('\n🔄 Regenerating article with images...');
    console.log('-'.repeat(70));

    // Step 1: Generate new content with image placeholders
    console.log('\n📝 Step 1: Generating AI content...');
    const aiGenerator = new AIContentGenerator();
    
    const content = await aiGenerator.generateComprehensiveArticle(selectedArticle.title, {
      minLength: 1000,
      targetLength: selectedArticle.wordCount || 1500,
      includeImages: true
    });

    const placeholders = content.match(/<!--\s*IMAGE:[^-]+-->/gi) || [];
    console.log(`✅ Content generated with ${placeholders.length} image placeholders`);

    // Step 2: Replace placeholders with real images
    console.log('\n🖼️ Step 2: Processing images...');
    const imageResult = await ImageService.replaceImagePlaceholders(content, selectedArticle.title);
    
    const imgTags = imageResult.content.match(/<img[^>]+>/gi) || [];
    console.log(`✅ ${imgTags.length} images added to content`);

    // Step 3: Update article in database
    console.log('\n💾 Step 3: Updating article in database...');
    
    selectedArticle.content = imageResult.content;
    selectedArticle.wordCount = imageResult.content.split(/\s+/).filter(w => w.length > 0).length;
    selectedArticle.updatedAt = new Date();
    selectedArticle.metadata = {
      ...selectedArticle.metadata,
      imagesAdded: imageResult.imagesReplaced,
      regeneratedAt: new Date(),
      regeneratedWithImages: true
    };

    await selectedArticle.save();
    console.log('✅ Article updated successfully');

    // Step 4: Verify
    console.log('\n✅ Step 4: Verification...');
    const updated = await Article.findById(selectedArticle._id);
    const finalImgCount = (updated.content.match(/<img[^>]+>/gi) || []).length;
    
    console.log(`📊 Article ID: ${updated._id}`);
    console.log(`📊 Title: ${updated.title}`);
    console.log(`📊 Word Count: ${updated.wordCount}`);
    console.log(`📊 Images: ${finalImgCount}`);
    console.log(`📊 Content Length: ${updated.content.length} characters`);

    // Show preview
    console.log('\n👁️ Content Preview (first 600 characters):');
    console.log('-'.repeat(70));
    console.log(updated.content.substring(0, 600));
    console.log('...\n');
    console.log('-'.repeat(70));

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ UPDATE COMPLETE');
    console.log('='.repeat(70));
    console.log(`✓ Article: ${updated.title}`);
    console.log(`✓ Images Added: ${finalImgCount} images`);
    console.log(`✓ Word Count: ${updated.wordCount} words`);
    console.log(`✓ Before: ${currentImgCount} images → After: ${finalImgCount} images`);
    
    if (finalImgCount > currentImgCount) {
      console.log(`\n🎉 SUCCESS! Added ${finalImgCount - currentImgCount} new images!`);
    }

    console.log('\n📝 To view the updated article:');
    console.log(`   1. Go to your article management page`);
    console.log(`   2. Find: "${updated.title}"`);
    console.log(`   3. Click Edit and then Preview to see images\n`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack trace:', error.stack);
    rl.close();
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the script
console.log('🚀 Starting Article Update Script...\n');
updateArticleWithImages()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
