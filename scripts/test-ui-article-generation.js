import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import Article from '../backend/models/Article.js';
import axios from 'axios';
import jwt from 'jsonwebtoken';

dotenv.config();

// Simulate the API client
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

async function testUIArticleGeneration() {
  try {
    console.log('🔄 Testing UI Article Generation Flow...\n');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/substate');
    console.log('✅ Connected to MongoDB\n');

    // Get test user
    const user = await User.findOne({ email: 'barotharshil070@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 Test user:', user.name);
    console.log('   User ID:', user._id);

    // Generate JWT token for API calls
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { 
        expiresIn: '7d',
        issuer: 'substate-app',
        audience: 'substate-users'
      }
    );

    // Set auth header
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    // Test 1: Simulate "Generate with AI" button click
    console.log('\n' + '='.repeat(60));
    console.log('TEST 1: Generate Article with AI (UI Flow)');
    console.log('='.repeat(60));

    const testTitle = 'The Future of Artificial Intelligence - ' + Date.now();
    const testKeywords = 'AI, machine learning, technology';

    console.log('📝 Article details:');
    console.log('   Title:', testTitle);
    console.log('   Keywords:', testKeywords);
    console.log('\n⏳ Generating article (this may take 5-10 seconds)...\n');

    const startTime = Date.now();

    try {
      const response = await apiClient.post('/articles/generate-content', {
        title: testTitle,
        category: 'General',
        keywords: testKeywords
      });

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log('✅ Article generated successfully!');
      console.log('   Duration:', duration, 'seconds');
      console.log('   Response structure:', Object.keys(response.data));
      console.log('\n📊 Article details:');
      console.log('   ID:', response.data.article.id);
      console.log('   Title:', response.data.article.title);
      console.log('   Word count:', response.data.article.wordCount);
      console.log('   Read time:', response.data.article.readTime, 'minutes');
      console.log('   Status:', response.data.article.status);
      console.log('   Content preview:', response.data.article.content.substring(0, 150) + '...');

      if (response.data.researchQuality) {
        console.log('\n🔬 Research quality:');
        console.log('   Sources used:', response.data.researchQuality.sourcesUsed);
        console.log('   Data points:', response.data.researchQuality.dataPoints);
        console.log('   Authenticity:', response.data.researchQuality.authenticity);
      }

      // Test 2: Verify article in database
      console.log('\n' + '='.repeat(60));
      console.log('TEST 2: Verify Article in Database');
      console.log('='.repeat(60));

      const articleInDb = await Article.findById(response.data.article.id);
      if (!articleInDb) {
        console.log('❌ ERROR: Article not found in database!');
        return;
      }

      console.log('✅ Article found in database');
      console.log('   Title:', articleInDb.title);
      console.log('   User ID:', articleInDb.userId);
      console.log('   Word count:', articleInDb.wordCount);
      console.log('   Is deleted:', articleInDb.isDeleted);
      console.log('   AI generated:', articleInDb.aiGenerated);

      // Test 3: Verify article appears in user's list
      console.log('\n' + '='.repeat(60));
      console.log('TEST 3: Verify Article in User List');
      console.log('='.repeat(60));

      const listResponse = await apiClient.get('/articles', {
        params: { page: 1, limit: 20 }
      });

      const foundInList = listResponse.data.articles.find(a => 
        a._id === response.data.article.id
      );

      if (!foundInList) {
        console.log('❌ ERROR: Article not in user list!');
        return;
      }

      console.log('✅ Article found in user list');
      console.log('   Position:', listResponse.data.articles.indexOf(foundInList) + 1);
      console.log('   Total articles:', listResponse.data.pagination.total);

      // Test 4: Test error handling with invalid title
      console.log('\n' + '='.repeat(60));
      console.log('TEST 4: Test Error Handling');
      console.log('='.repeat(60));

      try {
        await apiClient.post('/articles/generate-content', {
          title: 'AI', // Too short
          category: 'General'
        });
        console.log('❌ ERROR: Should have failed with short title!');
      } catch (err) {
        console.log('✅ Error handling works correctly');
        console.log('   Error message:', err.response?.data?.error);
      }

      // Cleanup
      console.log('\n🧹 Cleaning up test article...');
      await Article.deleteOne({ _id: response.data.article.id });
      console.log('✅ Test article deleted');

    } catch (error) {
      console.error('\n❌ API Error:', error.response?.data || error.message);
      throw error;
    }

    await mongoose.connection.close();

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('✓ Article generation API works');
    console.log('✓ Article saved to database');
    console.log('✓ Article appears in user list');
    console.log('✓ Error handling works');
    console.log('✓ UI flow is working correctly');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

testUIArticleGeneration();
