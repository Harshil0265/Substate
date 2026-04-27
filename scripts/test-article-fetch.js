import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Article from '../backend/models/Article.js';

dotenv.config();

async function testArticleFetch() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/substate');
    console.log('✅ Connected to MongoDB');

    // Get all articles
    const allArticles = await Article.find({});
    console.log('\n📊 Total articles in database:', allArticles.length);

    // Get non-deleted articles
    const activeArticles = await Article.find({ isDeleted: false });
    console.log('📊 Active articles (not deleted):', activeArticles.length);

    // Get deleted articles
    const deletedArticles = await Article.find({ isDeleted: true });
    console.log('📊 Deleted articles (in trash):', deletedArticles.length);

    // Show sample of articles
    if (allArticles.length > 0) {
      console.log('\n📝 Sample articles:');
      allArticles.slice(0, 5).forEach(article => {
        console.log(`  - ${article.title}`);
        console.log(`    ID: ${article._id}`);
        console.log(`    User: ${article.userId}`);
        console.log(`    Status: ${article.status}`);
        console.log(`    Deleted: ${article.isDeleted}`);
        console.log(`    Created: ${article.createdAt}`);
        console.log('');
      });
    }

    // Group by user
    const articlesByUser = {};
    allArticles.forEach(article => {
      const userId = article.userId.toString();
      if (!articlesByUser[userId]) {
        articlesByUser[userId] = { active: 0, deleted: 0 };
      }
      if (article.isDeleted) {
        articlesByUser[userId].deleted++;
      } else {
        articlesByUser[userId].active++;
      }
    });

    console.log('\n👥 Articles by user:');
    Object.entries(articlesByUser).forEach(([userId, counts]) => {
      console.log(`  User ${userId}: ${counts.active} active, ${counts.deleted} deleted`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testArticleFetch();
