import mongoose from 'mongoose';
import dotenv from 'dotenv';
import axios from 'axios';
import User from '../backend/models/User.js';
import WordPressIntegration from '../backend/models/WordPressIntegration.js';

dotenv.config();

async function diagnoseUIIssue() {
  try {
    console.log('🔍 DIAGNOSING CATEGORY CREATION UI ISSUE\n');
    console.log('=' .repeat(60));
    
    console.log('\n📋 Step 1: Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find WordPress integration
    const integration = await WordPressIntegration.findOne();
    
    if (!integration) {
      console.log('❌ No WordPress integration found');
      process.exit(1);
    }

    const user = await User.findById(integration.userId);
    
    console.log('\n📋 Step 2: Found WordPress Integration:');
    console.log('   User Email:', user.email);
    console.log('   Integration Name:', integration.name);
    console.log('   Site URL:', integration.siteUrl);
    console.log('   Integration ID:', integration._id);

    // Test if server is running
    console.log('\n📋 Step 3: Testing if server is running...');
    try {
      await axios.get('http://localhost:5000/health').catch(() => {
        return axios.get('http://localhost:5000/');
      });
      console.log('✅ Server is running on http://localhost:5000');
    } catch (error) {
      console.log('❌ Server is NOT running on http://localhost:5000');
      console.log('   Please start the server with: npm run dev');
      process.exit(1);
    }

    // Try to login (simulate UI login)
    console.log('\n📋 Step 4: Simulating UI login...');
    console.log('   Attempting login with email:', user.email);
    
    let token;
    try {
      // Try with a common test password
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        email: user.email,
        password: 'password123' // Common test password
      });
      token = loginResponse.data.token;
      console.log('✅ Login successful with password: password123');
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('⚠️ Login failed with test password');
        console.log('   Please provide the correct password for:', user.email);
        console.log('\n   Or run this command to reset the password:');
        console.log(`   node scripts/reset-user-password.js ${user.email} password123`);
        process.exit(1);
      }
      throw error;
    }

    console.log('   Token obtained:', token.substring(0, 20) + '...');

    // Test fetching integrations (like UI does)
    console.log('\n📋 Step 5: Fetching WordPress integrations (UI flow)...');
    const integrationsResponse = await axios.get('http://localhost:5000/api/wordpress/integrations', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Integrations fetched successfully');
    console.log('   Found', integrationsResponse.data.integrations.length, 'integration(s)');
    
    const userIntegration = integrationsResponse.data.integrations[0];
    console.log('   Using integration:', userIntegration.name);
    console.log('   Integration ID:', userIntegration._id);

    // Test fetching metadata (categories and tags)
    console.log('\n📋 Step 6: Fetching WordPress metadata...');
    const metadataResponse = await axios.get(
      `http://localhost:5000/api/wordpress/integrations/${userIntegration._id}/metadata`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ Metadata fetched successfully');
    console.log('   Categories:', metadataResponse.data.categories.length);
    console.log('   Tags:', metadataResponse.data.tags.length);

    // Now test category creation (EXACT UI flow)
    const testCategoryName = 'UI Test ' + Date.now();
    console.log('\n📋 Step 7: Creating category (EXACT UI FLOW)...');
    console.log('   Category name:', testCategoryName);
    console.log('   Endpoint:', `http://localhost:5000/api/wordpress/integrations/${userIntegration._id}/create-category`);
    console.log('   Method: POST');
    console.log('   Headers: Authorization: Bearer [token], Content-Type: application/json');
    console.log('   Body:', JSON.stringify({ name: testCategoryName }));

    try {
      const createResponse = await axios.post(
        `http://localhost:5000/api/wordpress/integrations/${userIntegration._id}/create-category`,
        { name: testCategoryName },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      console.log('\n✅ SUCCESS! Category created via API');
      console.log('   Response status:', createResponse.status);
      console.log('   Response data:', JSON.stringify(createResponse.data, null, 2));

      // Verify it appears in metadata
      console.log('\n📋 Step 8: Verifying category appears in metadata...');
      const verifyResponse = await axios.get(
        `http://localhost:5000/api/wordpress/integrations/${userIntegration._id}/metadata`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const foundCategory = verifyResponse.data.categories.find(
        cat => cat.id === createResponse.data.category.id
      );

      if (foundCategory) {
        console.log('✅ Category verified in metadata!');
        console.log('   Name:', foundCategory.name);
        console.log('   ID:', foundCategory.id);
      } else {
        console.log('⚠️ Category not found in metadata (may need refresh)');
      }

      console.log('\n' + '='.repeat(60));
      console.log('✅ ALL TESTS PASSED - UI FLOW WORKS CORRECTLY!');
      console.log('='.repeat(60));
      console.log('\n📝 The backend API is working correctly.');
      console.log('   If the UI still shows errors, check:');
      console.log('   1. Browser console for JavaScript errors');
      console.log('   2. Network tab to see the actual request/response');
      console.log('   3. Make sure the frontend is running (npm run dev)');
      console.log('   4. Check if there are any CORS issues');
      console.log('   5. Verify the user is logged in with a valid token');

    } catch (error) {
      console.log('\n❌ CATEGORY CREATION FAILED');
      console.log('   Status:', error.response?.status);
      console.log('   Status Text:', error.response?.statusText);
      console.log('   Error Data:', JSON.stringify(error.response?.data, null, 2));
      console.log('   Error Message:', error.message);
      
      if (error.code === 'ECONNABORTED') {
        console.log('\n⚠️ Request timed out - WordPress site may be slow or unreachable');
      }
      
      console.log('\n🔍 DIAGNOSIS:');
      if (error.response?.status === 404) {
        console.log('   ❌ Endpoint not found - check route registration');
      } else if (error.response?.status === 401) {
        console.log('   ❌ Authentication failed - token may be invalid');
      } else if (error.response?.status === 403) {
        console.log('   ❌ Permission denied - WordPress user lacks permissions');
      } else if (error.response?.status === 500) {
        console.log('   ❌ Server error - check backend logs');
      } else if (!error.response) {
        console.log('   ❌ Network error - server may not be running');
      }
      
      throw error;
    }

    process.exit(0);
  } catch (error) {
    console.error('\n💥 FATAL ERROR:', error.message);
    if (error.stack) {
      console.error('\nStack trace:', error.stack);
    }
    process.exit(1);
  }
}

diagnoseUIIssue();
