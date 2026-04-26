import AuthenticContentServicePro from '../backend/services/AuthenticContentServicePro.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('🧪 Testing AuthenticContentServicePro');
console.log('='.repeat(40));

async function testContentService() {
  try {
    const service = new AuthenticContentServicePro();
    
    console.log('✅ Service instantiated');
    
    // Test content generation
    console.log('\n🔄 Testing content generation...');
    
    const result = await service.generateAuthenticContent('Test Article Title', {
      contentType: 'BLOG',
      targetLength: 1000,
      includeStatistics: true,
      includeCitations: true,
      researchDepth: 'comprehensive'
    });
    
    console.log('✅ Content generated successfully:');
    console.log('   - Content length:', result.content.length);
    console.log('   - Word count:', result.metadata.wordCount);
    console.log('   - Sources used:', result.metadata.sourcesUsed);
    console.log('   - Data points:', result.metadata.dataPoints);
    console.log('   - Authenticity:', result.metadata.authenticity);
    console.log('   - Quality score:', result.metadata.qualityScore);
    
    return true;
    
  } catch (error) {
    console.error('❌ Content service test failed:', error.message);
    console.error('   Stack:', error.stack);
    return false;
  }
}

testContentService()
  .then(success => {
    if (success) {
      console.log('\n🏆 CONTENT SERVICE IS WORKING!');
      process.exit(0);
    } else {
      console.log('\n⚠️ CONTENT SERVICE NEEDS ATTENTION');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });