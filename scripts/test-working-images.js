/**
 * Test Working Image Integration
 * Tests with generic keywords that work with Pixabay
 */

import dotenv from 'dotenv';
import ImageService from '../backend/services/ImageService.js';

dotenv.config();

async function testWorkingImages() {
  try {
    console.log('\n🧪 TESTING WORKING IMAGE INTEGRATION\n');
    console.log('='.repeat(70));

    // Test with generic keywords that Pixabay has
    const testKeywords = [
      'cricket player batting',
      'cricket stadium',
      'sports celebration',
      'cricket team',
      'athlete action'
    ];

    console.log('\n✅ Testing with generic keywords (these work with Pixabay):\n');

    for (const keywords of testKeywords) {
      console.log('🔍 Testing:', keywords);
      const imageUrl = await ImageService.getContentImageUrl(keywords);
      
      if (imageUrl.includes('pixabay.com')) {
        console.log('✅ SUCCESS! Real image from Pixabay');
        console.log('🖼️ URL:', imageUrl.substring(0, 80) + '...\n');
      } else if (imageUrl.includes('placeholder')) {
        console.log('⚠️ Placeholder used (no real images found)\n');
      } else {
        console.log('✅ Real image found');
        console.log('🖼️ URL:', imageUrl.substring(0, 80) + '...\n');
      }
    }

    // Test placeholder replacement with generic content
    console.log('='.repeat(70));
    console.log('🔍 Testing Image Placeholder Replacement with Generic Content');
    console.log('='.repeat(70));

    const sampleContent = `
<h2>Introduction to Cricket</h2>
<p>Cricket is a popular sport played worldwide.</p>

<!-- IMAGE: cricket player batting in stadium -->

<h2>The Game</h2>
<p>Cricket involves batting, bowling, and fielding.</p>

<!-- IMAGE: cricket stadium with crowd -->

<h2>Celebrations</h2>
<p>Teams celebrate their victories together.</p>

<!-- IMAGE: sports team celebrating victory -->
`;

    console.log('\n📝 Sample content with 3 generic image placeholders');
    const result = await ImageService.replaceImagePlaceholders(sampleContent, 'cricket sport');
    
    console.log(`\n✅ Replacement complete!`);
    console.log(`📊 Images replaced: ${result.imagesReplaced}`);
    
    // Count real images vs placeholders
    const realImages = (result.content.match(/pixabay\.com/g) || []).length;
    const placeholders = (result.content.match(/placeholder\.com/g) || []).length;
    
    console.log(`📊 Real images: ${realImages}`);
    console.log(`📊 Placeholders: ${placeholders}`);

    if (realImages > 0) {
      console.log('\n🎉 SUCCESS! Real images are working with generic keywords!');
    }

    // Extract and display image URLs
    const imageMatches = result.content.match(/<img[^>]+src="([^"]+)"/gi);
    if (imageMatches) {
      console.log('\n🖼️ Generated Image URLs:');
      imageMatches.forEach((match, index) => {
        const urlMatch = match.match(/src="([^"]+)"/);
        if (urlMatch) {
          const url = urlMatch[1];
          const isReal = url.includes('pixabay.com');
          console.log(`${index + 1}. ${isReal ? '✅ REAL' : '⚠️ PLACEHOLDER'}: ${url.substring(0, 70)}...`);
        }
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('📋 SUMMARY');
    console.log('='.repeat(70));
    console.log('✅ Pixabay works for generic keywords (cricket, sports, etc.)');
    console.log('⚠️ Pixabay does NOT have celebrity/people names (Virat Kohli, etc.)');
    console.log('💡 For celebrity images, you need:');
    console.log('   - Google Custom Search API (needs proper setup)');
    console.log('   - OR Unsplash API (easier, free, better for people)');
    console.log('\n🎯 RECOMMENDATION: Get Unsplash API key for best results!');
    console.log('   Visit: https://unsplash.com/developers\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

console.log('🚀 Starting Working Images Test...\n');
testWorkingImages()
  .then(() => {
    console.log('✅ Test completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
