import mongoose from 'mongoose';
import dotenv from 'dotenv';
import WordPressIntegration from '../backend/models/WordPressIntegration.js';
import WordPressService from '../backend/services/WordPressService.js';

dotenv.config();

async function testCategoryCreation() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find the first WordPress integration
    const integration = await WordPressIntegration.findOne();
    
    if (!integration) {
      console.log('❌ No WordPress integration found');
      console.log('Please add a WordPress integration first');
      process.exit(1);
    }

    console.log('\n📋 WordPress Integration Found:');
    console.log('   Name:', integration.name);
    console.log('   Site URL:', integration.siteUrl);
    console.log('   Username:', integration.username);

    // Test category creation
    const testCategoryName = 'Test Category ' + Date.now();
    console.log(`\n📁 Creating test category: "${testCategoryName}"`);

    const category = await WordPressService.createCategory(integration, testCategoryName);

    console.log('\n✅ Category created successfully!');
    console.log('   ID:', category.id);
    console.log('   Name:', category.name);
    console.log('   Slug:', category.slug);
    console.log('   Count:', category.count);

    // Verify by fetching all categories
    console.log('\n🔍 Fetching all categories to verify...');
    const categoriesResult = await WordPressService.getCategories(integration.getConfig());
    
    if (categoriesResult.success) {
      const foundCategory = categoriesResult.categories.find(cat => cat.id === category.id);
      if (foundCategory) {
        console.log('✅ Category verified in WordPress!');
        console.log('   Found:', foundCategory.name);
      } else {
        console.log('⚠️ Category not found in list (may need to refresh)');
      }
    }

    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testCategoryCreation();
