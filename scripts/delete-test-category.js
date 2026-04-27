/**
 * Delete Test Category from WordPress
 */

import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function deleteTestCategory() {
  try {
    console.log('\n🗑️ DELETING TEST CATEGORY FROM WORDPRESS\n');
    console.log('='.repeat(70));

    // WordPress configuration - using local XAMPP
    const wpConfig = {
      siteUrl: 'http://localhost/wordpress',
      username: 'admin',
      applicationPassword: 'your-xampp-wordpress-app-password' // You need to generate this in WordPress
    };

    const cleanUrl = wpConfig.siteUrl.replace(/\/+$/, '');
    const auth = Buffer.from(`${wpConfig.username}:${wpConfig.applicationPassword}`).toString('base64');

    // First, get all categories to find the test category
    console.log('📋 Fetching all categories...');
    const categoriesUrl = `${cleanUrl}/wp-json/wp/v2/categories?per_page=100`;
    
    const categoriesResponse = await axios.get(categoriesUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'User-Agent': 'SUBSTATE-WordPress-Integration/1.0'
      },
      timeout: 10000
    });

    console.log(`✅ Found ${categoriesResponse.data.length} categories\n`);

    // Find test categories
    const testCategories = categoriesResponse.data.filter(cat => 
      cat.name.toLowerCase().includes('test') || 
      cat.slug.includes('test') ||
      cat.name.includes('1777297967088')
    );

    if (testCategories.length === 0) {
      console.log('✅ No test categories found!');
      return;
    }

    console.log(`🔍 Found ${testCategories.length} test category(ies):\n`);
    testCategories.forEach(cat => {
      console.log(`   - ${cat.name} (ID: ${cat.id}, Posts: ${cat.count})`);
    });

    // Delete each test category
    console.log('\n🗑️ Deleting test categories...\n');
    
    for (const category of testCategories) {
      try {
        const deleteUrl = `${cleanUrl}/wp-json/wp/v2/categories/${category.id}?force=true`;
        
        await axios.delete(deleteUrl, {
          headers: {
            'Authorization': `Basic ${auth}`,
            'User-Agent': 'SUBSTATE-WordPress-Integration/1.0'
          },
          timeout: 10000
        });

        console.log(`✅ Deleted: ${category.name} (ID: ${category.id})`);
      } catch (error) {
        if (error.response?.status === 404) {
          console.log(`⚠️ Category already deleted: ${category.name}`);
        } else {
          console.error(`❌ Failed to delete ${category.name}:`, error.response?.data?.message || error.message);
        }
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ TEST CATEGORY CLEANUP COMPLETE');
    console.log('='.repeat(70));
    console.log('\n📝 Refresh your WordPress admin to see the changes!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.response) {
      console.error('📊 Response status:', error.response.status);
      console.error('📊 Response data:', error.response.data);
    }
    process.exit(1);
  }
}

console.log('🚀 Starting Test Category Deletion...\n');
deleteTestCategory()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
