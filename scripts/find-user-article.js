import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import Article from '../backend/models/Article.js';

dotenv.config();

async function findUserArticle() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/substate');
    console.log('✅ Connected to MongoDB');

    // Find user by email
    const userEmail = 'barotharshil070@gmail.com';
    const user = await User.findOne({ email: userEmail });

    if (!user) {
      console.log(`❌ User not found with email: ${userEmail}`);
      await mongoose.connection.close();
      return;
    }

    console.log(`\n✅ Found user: ${user.name} (${user.email})`);
    console.log(`   User ID: ${user._id}`);
    console.log(`   Plan: ${user.subscription?.plan || 'FREE'}`);

    // Find all articles for this user (including deleted)
    const allArticles = await Article.find({ userId: user._id });
    console.log(`\n📊 Total articles for this user: ${allArticles.length}`);

    // Find MS Dhoni articles
    const dhoniArticles = allArticles.filter(article => 
      article.title.toLowerCase().includes('dhoni') || 
      article.title.toLowerCase().includes('ms dhoni')
    );

    if (dhoniArticles.length > 0) {
      console.log(`\n🏏 Found ${dhoniArticles.length} MS Dhoni article(s):`);
      dhoniArticles.forEach(article => {
        console.log(`\n  📝 Article: ${article.title}`);
        console.log(`     ID: ${article._id}`);
        console.log(`     Status: ${article.status}`);
        console.log(`     Created: ${article.createdAt}`);
        console.log(`     Updated: ${article.updatedAt}`);
        console.log(`     isDeleted: ${article.isDeleted}`);
        console.log(`     deletedAt: ${article.deletedAt}`);
        console.log(`     Word Count: ${article.wordCount || 0}`);
      });
    } else {
      console.log(`\n❌ No MS Dhoni articles found for this user`);
      console.log(`\n📋 All articles for this user:`);
      allArticles.forEach(article => {
        console.log(`  - ${article.title} (${article.status}, isDeleted: ${article.isDeleted})`);
      });
    }

    // Check active articles (not deleted)
    const activeArticles = await Article.find({
      userId: user._id,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } },
        { isDeleted: null }
      ]
    });
    console.log(`\n✅ Active articles (should be visible): ${activeArticles.length}`);

    // Check deleted articles
    const deletedArticles = await Article.find({
      userId: user._id,
      isDeleted: true
    });
    console.log(`🗑️ Deleted articles (in trash): ${deletedArticles.length}`);

    await mongoose.connection.close();
    console.log('\n✅ Search completed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

findUserArticle();
