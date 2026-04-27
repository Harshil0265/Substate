import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Article from '../backend/models/Article.js';

dotenv.config();

async function testArticleEndpoint() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/substate');
    console.log('✅ Connected to MongoDB');

    // Get a sample user ID
    const sampleArticle = await Article.findOne({});
    const userId = sampleArticle.userId;

    console.log(`\n👤 Testing with user ID: ${userId}`);

    // Test the query that the backend uses
    const filter = { 
      userId: userId,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } },
        { isDeleted: null }
      ]
    };

    const articles = await Article.find(filter)
      .sort({ createdAt: -1 })
      .limit(20);

    console.log(`\n✅ Found ${articles.length} articles for this user`);
    
    if (articles.length > 0) {
      console.log('\n📝 Sample articles:');
      articles.slice(0, 5).forEach(article => {
        console.log(`  - ${article.title} (${article.status})`);
      });
    }

    // Test trash query
    const trashedArticles = await Article.find({
      userId: userId,
      isDeleted: true
    });

    console.log(`\n🗑️ Found ${trashedArticles.length} trashed articles for this user`);

    await mongoose.connection.close();
    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testArticleEndpoint();
