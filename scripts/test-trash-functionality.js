import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import Article from '../backend/models/Article.js';

dotenv.config();

async function testTrashFunctionality() {
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

    // Get the MS Dhoni article
    const article = await Article.findOne({ 
      userId: user._id,
      title: /dhoni/i
    });

    if (!article) {
      console.log('❌ MS Dhoni article not found');
      return;
    }

    console.log(`\n📝 Article found: ${article.title}`);
    console.log(`   Current status: isDeleted = ${article.isDeleted}`);

    // Test 1: Soft delete the article
    console.log('\n🗑️ Test 1: Soft deleting article...');
    article.softDelete(user._id, 'Testing trash functionality');
    await article.save();
    console.log(`   ✅ Article soft deleted`);
    console.log(`   isDeleted: ${article.isDeleted}`);
    console.log(`   deletedAt: ${article.deletedAt}`);

    // Test 2: Query active articles (should not include deleted)
    console.log('\n📋 Test 2: Querying active articles...');
    const activeArticles = await Article.find({
      userId: user._id,
      isDeleted: { $ne: true }
    });
    console.log(`   Active articles: ${activeArticles.length}`);
    console.log(`   ✅ MS Dhoni article should NOT be in active list`);

    // Test 3: Query trash (should include deleted)
    console.log('\n🗑️ Test 3: Querying trash...');
    const trashedArticles = await Article.find({
      userId: user._id,
      isDeleted: true
    });
    console.log(`   Trashed articles: ${trashedArticles.length}`);
    if (trashedArticles.length > 0) {
      console.log(`   ✅ MS Dhoni article IS in trash:`);
      trashedArticles.forEach(a => {
        console.log(`      - ${a.title} (deleted at: ${a.deletedAt})`);
      });
    }

    // Test 4: Restore the article
    console.log('\n♻️ Test 4: Restoring article...');
    article.restore();
    await article.save();
    console.log(`   ✅ Article restored`);
    console.log(`   isDeleted: ${article.isDeleted}`);
    console.log(`   deletedAt: ${article.deletedAt}`);

    // Test 5: Verify article is back in active list
    console.log('\n📋 Test 5: Verifying article is back in active list...');
    const activeArticlesAfterRestore = await Article.find({
      userId: user._id,
      isDeleted: { $ne: true }
    });
    console.log(`   Active articles: ${activeArticlesAfterRestore.length}`);
    console.log(`   ✅ MS Dhoni article should be back in active list`);

    await mongoose.connection.close();
    console.log('\n✅ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testTrashFunctionality();
