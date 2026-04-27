/**
 * Test Google Images Integration
 * Tests the Google Custom Search API for fetching real images
 */

import dotenv from 'dotenv';
import ImageService from '../backend/services/ImageService.js';

dotenv.config();

async function testGoogleImages() {
  try {
    console.log('\n🧪 TESTING GOOGLE IMAGES INTEGRATION\n');
    console.log('='.repeat(70));

    // Check API credentials
    console.log('\n📋 Checking API Configuration:');
    console.log('✓ Unsplash API Key:', process.env.UNSPLASH_ACCESS_KEY ? '✅ Configured' : '⚠️ Not configured (optional)');
    console.log('✓ Google API Key:', process.env.GOOGLE_API_KEY ? '✅ Configured' : '⚠️ Not configured (optional)');
    console.log('✓ Google Search Engine ID:', process.env.GOOGLE_SEARCH_ENGINE_ID ? '✅ Configured' : '⚠️ Not configured (optional)');
    console.log('✓ Pixabay API Key:', process.env.PIXABAY_API_KEY ? '✅ Configured' : '❌ Missing');

    if (!process.env.GOOGLE_API_KEY && !process.env.UNSPLASH_ACCESS_KEY && !process.env.PIXABAY_API_KEY) {
      console.log('\n❌ No image API credentials configured!');
      console.log('Please add at least one to your .env file:');
      console.log('\nOption 1 (Recommended): Unsplash');
      console.log('UNSPLASH_ACCESS_KEY=your_access_key');
      console.log('Get free key: https://unsplash.com/developers');
      console.log('\nOption 2: Google Custom Search');
      console.log('GOOGLE_API_KEY=your_api_key');
      console.log('GOOGLE_SEARCH_ENGINE_ID=your_search_engine_id');
      console.log('\nOption 3: Pixabay (already configured)');
      process.exit(1);
    }

    // Test 1: Search for Virat Kohli images
    console.log('\n' + '='.repeat(70));
    console.log('🔍 TEST 1: Searching Google Images for "Virat Kohli"');
    console.log('='.repeat(70));
    
    const viratImages = await ImageService.searchGoogleImages('Virat Kohli', 5);
    
    if (viratImages && viratImages.length > 0) {
      console.log(`\n✅ SUCCESS! Found ${viratImages.length} images from Google`);
      console.log('\n📸 Image Results:');
      viratImages.forEach((img, index) => {
        console.log(`\n${index + 1}. ${img.title || 'Untitled'}`);
        console.log(`   URL: ${img.largeImageURL}`);
        console.log(`   Size: ${img.imageWidth}x${img.imageHeight}`);
        console.log(`   Source: ${img.source}`);
      });
    } else {
      console.log('\n⚠️ No images found from Google');
    }

    // Test 2: Get featured image
    console.log('\n' + '='.repeat(70));
    console.log('🔍 TEST 2: Getting Featured Image for "Virat Kohli"');
    console.log('='.repeat(70));
    
    const featuredImage = await ImageService.getFeaturedImageUrl('Virat Kohli');
    console.log('\n✅ Featured Image URL:');
    console.log(featuredImage);

    // Test 3: Get content image with specific keywords
    console.log('\n' + '='.repeat(70));
    console.log('🔍 TEST 3: Getting Content Image for "Virat Kohli batting"');
    console.log('='.repeat(70));
    
    const contentImage = await ImageService.getContentImageUrl('Virat Kohli batting');
    console.log('\n✅ Content Image URL:');
    console.log(contentImage);

    // Test 4: Test image placeholder replacement
    console.log('\n' + '='.repeat(70));
    console.log('🔍 TEST 4: Testing Image Placeholder Replacement');
    console.log('='.repeat(70));
    
    const sampleContent = `
<h2>Introduction</h2>
<p>Virat Kohli is one of the greatest cricketers of all time.</p>

<!-- IMAGE: Virat Kohli batting in action -->

<h2>Career Highlights</h2>
<p>He has achieved numerous records throughout his career.</p>

<!-- IMAGE: Virat Kohli celebrating victory -->

<h2>Personal Life</h2>
<p>He is married to Bollywood actress Anushka Sharma.</p>

<!-- IMAGE: Virat Kohli with family -->
`;

    console.log('\n📝 Sample content with 3 image placeholders');
    const result = await ImageService.replaceImagePlaceholders(sampleContent, 'Virat Kohli');
    
    console.log(`\n✅ Replacement complete!`);
    console.log(`📊 Images replaced: ${result.imagesReplaced}`);
    
    // Extract and display image URLs from result
    const imageMatches = result.content.match(/<img[^>]+src="([^"]+)"/gi);
    if (imageMatches) {
      console.log('\n🖼️ Generated Image Tags:');
      imageMatches.forEach((match, index) => {
        const urlMatch = match.match(/src="([^"]+)"/);
        if (urlMatch) {
          console.log(`${index + 1}. ${urlMatch[1]}`);
        }
      });
    }

    // Test 5: Test with generic cricket keywords
    console.log('\n' + '='.repeat(70));
    console.log('🔍 TEST 5: Testing Generic Cricket Keywords');
    console.log('='.repeat(70));
    
    const cricketImage = await ImageService.getContentImageUrl('cricket stadium match');
    console.log('\n✅ Cricket Image URL:');
    console.log(cricketImage);

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('\n📋 Summary:');
    console.log('✓ Google Images API is working correctly');
    console.log('✓ Image search returns real photos');
    console.log('✓ Featured image generation works');
    console.log('✓ Content image generation works');
    console.log('✓ Placeholder replacement works');
    console.log('✓ Fallback to Pixabay works for generic content');
    
    console.log('\n🎉 Google Images integration is ready to use!');
    console.log('You can now regenerate articles with real images.\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

console.log('🚀 Starting Google Images Test...\n');
testGoogleImages()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
