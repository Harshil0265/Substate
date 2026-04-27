import dotenv from 'dotenv';
import AuthenticContentServicePro from '../backend/services/AuthenticContentServicePro.js';

dotenv.config();

async function testAIGeneration() {
  console.log('🧪 Testing AI Content Generation...\n');
  
  try {
    const service = new AuthenticContentServicePro();
    
    console.log('📝 Generating content for: "What is cricket?"');
    console.log('⏳ This may take 30-60 seconds...\n');
    
    const result = await service.generateAuthenticContent('What is cricket?', {
      targetLength: 2000,
      minLength: 1500,
      includeImages: true
    });
    
    console.log('✅ Content generated successfully!\n');
    console.log('📊 Metadata:');
    console.log('   - Word Count:', result.metadata.wordCount);
    console.log('   - Generation Method:', result.metadata.generationMethod);
    console.log('   - Authenticity:', result.metadata.authenticity);
    console.log('   - Validation Confidence:', result.metadata.validation?.confidence + '%');
    console.log('\n📄 Content Preview (first 500 characters):');
    console.log(result.content.substring(0, 500) + '...\n');
    
    // Check if content is generic template
    if (result.content.includes('Comprehensive information about') || 
        result.content.includes('Historical context and background information relevant to')) {
      console.log('❌ ERROR: Generated generic template content instead of AI content!');
      console.log('🔍 This means the AI generation failed and fallback was used.');
      process.exit(1);
    }
    
    console.log('✅ Content looks good - not generic template!');
    console.log('✅ Test passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testAIGeneration();
