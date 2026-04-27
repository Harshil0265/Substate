import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import Article from '../backend/models/Article.js';

dotenv.config();

async function findDeletedArticles() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/substate');
    console.log('✅ Connected to MongoDB');

    // Find user
    const user = await User.findOne({ email: 'barotharshil070@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`\n✅ User: ${user.name} (${user.email})`);
    console.log(`   User ID: ${user._id}`);

    // Get ALL articles for this user (including deleted)
    const allArticles = await Article.find({ userId: user._id });
    console.log(`\n📊 Total articles for this user: ${allArticles.length}`);

    // Search for the mentioned articles
    const searchTerms = ['health', 'cricket', 'csk', 'mi', 'ipl', 'dhoni'];
    
    console.log(`\n🔍 Searching for articles with keywords: ${searchTerms.join(', ')}`);
    
    const foundArticles = allArticles.filter(article => {
      const title = article.title.toLowerCase();
      return searchTerms.some(term => title.includes(term));
    });

    if (foundArticles.length > 0) {
      console.log(`\n📝 Found ${foundArticles.length} matching article(s):`);
      foundArticles.forEach(article => {
        console.log(`\n  Title: "${article.title}"`);
        console.log(`  ID: ${article._id}`);
        console.log(`  Status: ${article.status}`);
        console.log(`  isDeleted: ${article.isDeleted}`);
        console.log(`  deletedAt: ${article.deletedAt}`);
        console.log(`  deletedBy: ${article.deletedBy}`);
        console.log(`  deleteReason: ${article.deleteReason}`);
        console.log(`  Created: ${article.createdAt}`);
        console.log(`  Updated: ${article.updatedAt}`);
      });
    } else {
      console.log(`\n❌ No matching articles found`);
    }

    // Show ALL articles for this user
    console.log(`\n📋 ALL articles for this user:`);
    allArticles.forEach((article, index) => {
      console.log(`  ${index + 1}. "${article.title}"`);
      console.log(`     Status: ${article.status}, isDeleted: ${article.isDeleted}`);
      console.log(`     Created: ${article.createdAt}`);
      console.log('');
    });

    // Count active vs deleted
    const activeCount = allArticles.filter(a => !a.isDeleted).length;
    const deletedCount = allArticles.filter(a => a.isDeleted).length;

    console.log(`\n📊 Summary:`);
    console.log(`   Active articles: ${activeCount}`);
    console.log(`   Deleted articles (in trash): ${deletedCount}`);

    // Test the trash query
    console.log(`\n🗑️ Testing trash query...`);
    const trashedArticles = await Article.find({
      userId: user._id,
      isDeleted: true
    }).sort({ deletedAt: -1 });

    console.log(`   Trash query returned: ${trashedArticles.length} article(s)`);
    if (trashedArticles.length > 0) {
      trashedArticles.forEach(article => {
        console.log(`   - "${article.title}" (deleted at: ${article.deletedAt})`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Search completed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findDeletedArticles();
