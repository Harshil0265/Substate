/**
 * Test Article Generation with Images
 * This script generates a complete article with embedded images
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import AIContentGenerator from '../backend/services/AIContentGenerator.js';
import ImageService from '../backend/services/ImageService.js';
import Article from '../backend/models/Article.js';
import User from '../backend/models/User.js';

// Load environment variables
dotenv.config();

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

async function testArticleWithImages() {
  try {
    console.log('\n🧪 TESTING ARTICLE GENERATION WITH IMAGES\n');
    console.log('='.repeat(70));

    // Connect to database
    await connectDB();

    // Find a test user (or use the first user)
    const user = await User.findOne();
    if (!user) {
      console.error('❌ No users found in database. Please create a user first.');
      process.exit(1);
    }
    console.log(`\n✅ Using user: ${user.email}`);

    // Test topic
    const topic = 'Virat Kohli: The Modern Cricket Legend';
    console.log(`\n📝 Topic: ${topic}`);
    console.log('-'.repeat(70));

    // Step 1: Generate AI content with image placeholders
    console.log('\n📝 Step 1: Generating AI content with image placeholders...');
    const aiGenerator = new AIContentGenerator();
    
    const content = await aiGenerator.generateComprehensiveArticle(topic, {
      minLength: 1000,
      targetLength: 1500,
      includeImages: true
    });

    console.log(`✅ Content generated: ${content.length} characters`);
    
    // Count image placeholders
    const placeholders = content.match(/<!--\s*IMAGE:[^-]+-->/gi) || [];
    console.log(`📸 Image placeholders found: ${placeholders.length}`);
    
    if (placeholders.length > 0) {
      console.log('\nPlaceholders:');
      placeholders.forEach((p, i) => console.log(`  ${i + 1}. ${p.substring(0, 80)}...`));
    }

    // Step 2: Replace placeholders with real images
    console.log('\n\n🖼️ Step 2: Replacing placeholders with real images...');
    const imageResult = await ImageService.replaceImagePlaceholders(content, topic);
    
    console.log(`✅ Images processed: ${imageResult.imagesReplaced} images added`);
    
    // Count actual img tags
    const imgTags = imageResult.content.match(/<img[^>]+>/gi) || [];
    console.log(`🖼️ Actual <img> tags in content: ${imgTags.length}`);

    if (imgTags.length > 0) {
      console.log('\nImage tags:');
      imgTags.slice(0, 3).forEach((img, i) => {
        const srcMatch = img.match(/src="([^"]+)"/);
        const altMatch = img.match(/alt="([^"]+)"/);
        console.log(`  ${i + 1}. Alt: ${altMatch ? altMatch[1].substring(0, 50) : 'N/A'}`);
        console.log(`     Src: ${srcMatch ? srcMatch[1].substring(0, 70) + '...' : 'N/A'}`);
      });
      if (imgTags.length > 3) {
        console.log(`  ... and ${imgTags.length - 3} more images`);
      }
    }

    // Step 3: Create or update article in database
    console.log('\n\n💾 Step 3: Saving article to database...');
    
    // Check if article already exists
    const existingArticle = await Article.findOne({ 
      userId: user._id, 
      title: topic 
    });

    let article;
    if (existingArticle) {
      console.log('📝 Updating existing article...');
      existingArticle.content = imageResult.content;
      existingArticle.wordCount = imageResult.content.split(/\s+/).filter(w => w.length > 0).length;
      existingArticle.updatedAt = new Date();
      existingArticle.metadata = {
        ...existingArticle.metadata,
        imagesAdded: imageResult.imagesReplaced,
        regeneratedAt: new Date()
      };
      article = await existingArticle.save();
      console.log('✅ Article updated successfully');
    } else {
      console.log('📝 Creating new article...');
      article = new Article({
        userId: user._id,
        title: topic,
        slug: topic.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        content: imageResult.content,
        excerpt: imageResult.content.substring(0, 200).replace(/<[^>]*>/g, '') + '...',
        wordCount: imageResult.content.split(/\s+/).filter(w => w.length > 0).length,
        readTime: Math.ceil(imageResult.content.split(/\s+/).filter(w => w.length > 0).length / 200),
        status: 'DRAFT',
        contentType: 'BLOG',
        aiGenerated: true,
        metadata: {
          imagesAdded: imageResult.imagesReplaced,
          generatedAt: new Date()
        }
      });
      article = await article.save();
      console.log('✅ Article created successfully');
    }

    // Step 4: Verify the saved article
    console.log('\n\n✅ Step 4: Verifying saved article...');
    const savedArticle = await Article.findById(article._id);
    
    const savedImgTags = savedArticle.content.match(/<img[^>]+>/gi) || [];
    console.log(`📊 Article ID: ${savedArticle._id}`);
    console.log(`📊 Title: ${savedArticle.title}`);
    console.log(`📊 Word Count: ${savedArticle.wordCount}`);
    console.log(`📊 Images in saved content: ${savedImgTags.length}`);
    console.log(`📊 Status: ${savedArticle.status}`);

    // Step 5: Show content preview
    console.log('\n\n👁️ Step 5: Content Preview (first 800 characters)...');
    console.log('-'.repeat(70));
    console.log(savedArticle.content.substring(0, 800));
    console.log('...\n');
    console.log('-'.repeat(70));

    // Summary
    console.log('\n\n' + '='.repeat(70));
    console.log('✅ TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`✓ Article ID: ${savedArticle._id}`);
    console.log(`✓ Title: ${savedArticle.title}`);
    console.log(`✓ Word Count: ${savedArticle.wordCount} words`);
    console.log(`✓ Images Added: ${savedImgTags.length} images`);
    console.log(`✓ Content Length: ${savedArticle.content.length} characters`);
    console.log(`✓ Status: ${savedArticle.status}`);
    
    if (savedImgTags.length >= 3) {
      console.log('\n🎉 SUCCESS! Article has images embedded in content!');
    } else if (savedImgTags.length > 0) {
      console.log('\n⚠️ WARNING: Article has some images but fewer than expected');
    } else {
      console.log('\n❌ ERROR: No images found in saved article!');
    }

    console.log('\n📝 To view this article:');
    console.log(`   1. Go to your article management page`);
    console.log(`   2. Find article: "${savedArticle.title}"`);
    console.log(`   3. Click Edit to see the content with images`);
    console.log(`   4. Click Preview to see how images will look\n`);

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Run the test
console.log('🚀 Starting Article with Images Test...\n');
testArticleWithImages()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
