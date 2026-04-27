import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Article from '../backend/models/Article.js';
import User from '../backend/models/User.js';

dotenv.config();

async function searchAllArticles() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/substate');
    console.log('✅ Connected to MongoDB');

    // Search for articles with these titles
    const searchTerms = ['health', 'cricket', 'csk', 'mi', 'ipl'];
    
    console.log(`\n🔍 Searching ALL articles for keywords: ${searchTerms.join(', ')}`);
    
    for (const term of searchTerms) {
      console.log(`\n📝 Searching for "${term}"...`);
      
      const articles = await Article.find({
        title: { $regex: term, $options: 'i' }
      }).limit(10);

      if (articles.length > 0) {
        console.log(`   Found ${articles.length} article(s):`);
        for (const article of articles) {
          const user = await User.findById(article.userId);
          console.log(`   - "${article.title}"`);
          console.log(`     User: ${user ? user.email : 'Unknown'}`);
          console.log(`     Status: ${article.status}`);
          console.log(`     isDeleted: ${article.isDeleted}`);
          console.log(`     Created: ${article.createdAt}`);
          console.log('');
        }
      } else {
        console.log(`   No articles found with "${term}"`);
      }
    }

    // Check if there are any permanently deleted articles (this would require checking MongoDB change streams or logs)
    console.log(`\n📊 Database Statistics:`);
    const totalArticles = await Article.countDocuments({});
    const activeArticles = await Article.countDocuments({ isDeleted: { $ne: true } });
    const deletedArticles = await Article.countDocuments({ isDeleted: true });
    
    console.log(`   Total articles in database: ${totalArticles}`);
    console.log(`   Active articles: ${activeArticles}`);
    console.log(`   Soft-deleted articles (in trash): ${deletedArticles}`);

    await mongoose.connection.close();
    console.log('\n✅ Search completed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

searchAllArticles();
