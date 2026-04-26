import axios from 'axios';
import mongoose from 'mongoose';
import Article from '../backend/models/Article.js';
import User from '../backend/models/User.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Ensure NODE_ENV is set to development for error details
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development';
}

console.log('🧪 Testing Article Regeneration Endpoint');
console.log('='.repeat(50));

async function testRegenerateEndpoint() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/substate');
    console.log('✅ Connected to MongoDB');

    // Clean up any existing test data first
    await User.deleteMany({ email: 'test@example.com' });
    await Article.deleteMany({ title: 'Test Article for Regeneration' });
    console.log('✅ Cleaned up existing test data');

    // Create a test user
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
      subscription: 'PROFESSIONAL',
      subscriptionStatus: 'ACTIVE'
    });
    await testUser.save();
    console.log('✅ Test user created:', testUser._id);

    // Create a test article
    const testArticle = new Article({
      userId: testUser._id,
      title: 'Test Article for Regeneration',
      content: 'This is a test article with generic content that needs to be regenerated.',
      excerpt: 'Test excerpt',
      wordCount: 100,
      readTime: 1,
      status: 'DRAFT',
      contentType: 'BLOG'
    });
    await testArticle.save();
    console.log('✅ Test article created:', testArticle._id);

    // Generate a JWT token for the test user using TokenService
    const TokenService = (await import('../backend/services/TokenService.js')).default;
    
    // Ensure JWT_SECRET is available
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = '3611a29c4ad823fc8a9fafc0856e31cd19a0944835bfac72ce0b0f75d48362a3';
    }
    
    const token = TokenService.generateAccessToken({
      userId: testUser._id,
      email: testUser.email
    });
    console.log('✅ JWT token generated using TokenService');

    // Test the regenerate endpoint
    console.log('\n🔄 Testing regenerate endpoint...');
    console.log('   Endpoint: POST /api/articles-authentic/' + testArticle._id + '/regenerate-research');
    console.log('   Token: ' + token.substring(0, 20) + '...');
    
    const baseURL = process.env.API_URL || 'http://localhost:5000';
    const response = await axios.post(
      `${baseURL}/api/articles-authentic/${testArticle._id}/regenerate-research`,
      {
        requirements: {
          researchDepth: 'comprehensive',
          targetLength: 1500,
          includeStatistics: true,
          includeCitations: true
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 second timeout
      }
    );

    console.log('✅ Regenerate endpoint response:', {
      success: response.data.success,
      message: response.data.message,
      error: response.data.error,
      allData: response.data,
      wordCount: response.data.article?.wordCount,
      sourcesUsed: response.data.researchQuality?.sourcesUsed,
      dataPoints: response.data.researchQuality?.dataPoints,
      authenticity: response.data.researchQuality?.authenticity
    });

    if (response.data.success) {
      console.log('🎉 Article regeneration successful!');
      console.log('📊 Quality metrics:');
      console.log(`   - Word count: ${response.data.article.wordCount}`);
      console.log(`   - Sources used: ${response.data.researchQuality.sourcesUsed}`);
      console.log(`   - Data points: ${response.data.researchQuality.dataPoints}`);
      console.log(`   - Authenticity: ${response.data.researchQuality.authenticity}`);
    } else {
      console.log('❌ Article regeneration failed:', response.data.message);
      if (response.data.error) {
        console.log('   Error details:', response.data.error);
      }
    }

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await Article.findByIdAndDelete(testArticle._id);
    await User.findByIdAndDelete(testUser._id);
    console.log('✅ Test data cleaned up');

    return response.data.success;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('   No response received');
      console.error('   Request:', error.request);
    } else {
      console.error('   Error:', error);
    }
    
    return false;
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testRegenerateEndpoint()
  .then(success => {
    if (success) {
      console.log('\n🏆 ARTICLE REGENERATION ENDPOINT IS WORKING!');
      process.exit(0);
    } else {
      console.log('\n⚠️ ARTICLE REGENERATION ENDPOINT NEEDS ATTENTION');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });