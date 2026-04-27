import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Article from '../backend/models/Article.js';

dotenv.config();

async function testIsDeleted() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/substate');
    console.log('✅ Connected to MongoDB');

    // Get sample articles and check isDeleted field
    const sampleArticles = await Article.find({}).limit(10);
    
    console.log('\n📊 Checking isDeleted field values:');
    sampleArticles.forEach(article => {
      console.log(`  Article: ${article.title}`);
      console.log(`    isDeleted value: ${article.isDeleted}`);
      console.log(`    isDeleted type: ${typeof article.isDeleted}`);
      console.log(`    isDeleted === false: ${article.isDeleted === false}`);
      console.log(`    isDeleted === true: ${article.isDeleted === true}`);
      console.log(`    isDeleted === undefined: ${article.isDeleted === undefined}`);
      console.log('');
    });

    // Count different scenarios
    const totalCount = await Article.countDocuments({});
    const explicitlyFalse = await Article.countDocuments({ isDeleted: false });
    const explicitlyTrue = await Article.countDocuments({ isDeleted: true });
    const isUndefined = await Article.countDocuments({ isDeleted: { $exists: false } });
    const isNull = await Article.countDocuments({ isDeleted: null });

    console.log('\n📊 Count Summary:');
    console.log(`  Total articles: ${totalCount}`);
    console.log(`  isDeleted === false: ${explicitlyFalse}`);
    console.log(`  isDeleted === true: ${explicitlyTrue}`);
    console.log(`  isDeleted field missing: ${isUndefined}`);
    console.log(`  isDeleted === null: ${isNull}`);

    // Query for active articles (not deleted)
    const activeArticles = await Article.find({
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } },
        { isDeleted: null }
      ]
    }).countDocuments();

    console.log(`\n✅ Active articles (should show): ${activeArticles}`);

    await mongoose.connection.close();
    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testIsDeleted();
