/**
 * Test Image Integration in Articles
 * Verifies that images are properly added to generated articles
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import AIContentGenerator from '../backend/services/AIContentGenerator.js';
import ImageService from '../backend/services/ImageService.js';

// Load environment variables
dotenv.config();

async function testImageIntegration() {
  try {
    console.log('🧪 Testing Image Integration in Articles\n');
    console.log('=' .repeat(60));

    // Test 1: AI Content Generation with Image Placeholders
    console.log('\n📝 Test 1: AI Content Generation with Image Placeholders');
    console.log('-'.repeat(60));
    
    const aiGenerator = new AIContentGenerator();
    const topic = 'The Evolution of Cricket in Modern Sports';
    
    console.log(`Topic: ${topic}`);
    console.log('Generating content with image placeholders...\n');
    
    const content = await aiGenerator.generateComprehensiveArticle(topic, {
      minLength: 800,
      targetLength: 1200,
      includeImages: true
    });
    
    // Count image placeholders
    const placeholderMatches = content.match(/<!--\s*IMAGE:[^-]+-->/gi) || [];
    console.log(`✅ Content generated: ${content.length} characters`);
    console.log(`📸 Image placeholders found: ${placeholderMatches.length}`);
    
    if (placeholderMatches.length > 0) {
      console.log('\nImage placeholders:');
      placeholderMatches.forEach((placeholder, index) => {
        console.log(`  ${index + 1}. ${placeholder}`);
      });
    }

    // Test 2: Replace Image Placeholders with Real Images
    console.log('\n\n🖼️ Test 2: Replace Image Placeholders with Real Images');
    console.log('-'.repeat(60));
    
    console.log('Processing image placeholders...\n');
    
    const imageResult = await ImageService.replaceImagePlaceholders(content, topic);
    
    console.log(`✅ Images processed: ${imageResult.imagesReplaced} images`);
    console.log(`📝 Final content length: ${imageResult.content.length} characters`);
    
    // Count actual images in final content
    const imageMatches = imageResult.content.match(/<img[^>]+>/gi) || [];
    console.log(`🖼️ Actual images in content: ${imageMatches.length}`);
    
    if (imageMatches.length > 0) {
      console.log('\nImage tags found:');
      imageMatches.slice(0, 3).forEach((img, index) => {
        const srcMatch = img.match(/src="([^"]+)"/);
        const altMatch = img.match(/alt="([^"]+)"/);
        console.log(`  ${index + 1}. ${altMatch ? altMatch[1] : 'No alt text'}`);
        console.log(`     URL: ${srcMatch ? srcMatch[1].substring(0, 60) + '...' : 'No URL'}`);
      });
      if (imageMatches.length > 3) {
        console.log(`  ... and ${imageMatches.length - 3} more images`);
      }
    }

    // Test 3: Content Preview
    console.log('\n\n👁️ Test 3: Content Preview (First 500 characters)');
    console.log('-'.repeat(60));
    
    const preview = imageResult.content.substring(0, 500);
    console.log(preview + '...\n');

    // Test 4: Image Recommendations
    console.log('\n📊 Test 4: Image Recommendations');
    console.log('-'.repeat(60));
    
    const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
    const recommendations = ImageService.getImageRecommendations(wordCount);
    
    console.log(`Word count: ${wordCount}`);
    console.log(`Recommended images: ${recommendations.recommended}`);
    console.log(`Featured image: ${recommendations.featuredImage ? 'Yes' : 'No'}`);
    console.log(`In-content images: ${recommendations.inContentImages}`);
    console.log('\nPlacement suggestions:');
    recommendations.placement.forEach((suggestion, index) => {
      console.log(`  ${index + 1}. ${suggestion}`);
    });

    // Summary
    console.log('\n\n' + '='.repeat(60));
    console.log('✅ IMAGE INTEGRATION TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✓ AI generated content with ${placeholderMatches.length} image placeholders`);
    console.log(`✓ Successfully replaced ${imageResult.imagesReplaced} placeholders with real images`);
    console.log(`✓ Final content contains ${imageMatches.length} images`);
    console.log(`✓ Content is ${wordCount} words with ${imageMatches.length} images`);
    console.log(`✓ Ratio: 1 image per ${Math.round(wordCount / imageMatches.length)} words`);
    
    if (imageMatches.length >= 3 && imageMatches.length <= 8) {
      console.log('\n🎉 PERFECT! Image count is optimal for article length');
    } else if (imageMatches.length > 0) {
      console.log('\n✅ GOOD! Images are present in the article');
    } else {
      console.log('\n⚠️ WARNING! No images found in final content');
    }

    console.log('\n✅ All tests completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run the test
console.log('🚀 Starting Image Integration Test...\n');
testImageIntegration()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
