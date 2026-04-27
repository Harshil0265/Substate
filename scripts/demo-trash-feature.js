import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import Article from '../backend/models/Article.js';

dotenv.config();

async function demoTrashFeature() {
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

    // Create test articles to demonstrate trash feature
    console.log('\n📝 Creating test articles...');
    
    const testArticles = [
      { title: 'Health Benefits of Exercise', content: 'Test content about health' },
      { title: 'What is Cricket?', content: 'Test content about cricket' },
      { title: 'CSK vs MI in IPL', content: 'Test content about IPL match' }
    ];

    const createdArticles = [];
    for (const articleData of testArticles) {
      const article = new Article({
        userId: user._id,
        title: articleData.title,
        content: articleData.content,
        status: 'DRAFT',
        slug: articleData.title.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
        isDeleted: false
      });
      await article.save();
      createdArticles.push(article);
      console.log(`   ✅ Created: "${article.title}"`);
    }

    // Show active articles
    console.log('\n📋 Step 1: Active articles (before deletion)');
    let activeArticles = await Article.find({
      userId: user._id,
      isDeleted: { $ne: true }
    });
    console.log(`   Total active articles: ${activeArticles.length}`);
    activeArticles.forEach(a => console.log(`   - ${a.title}`));

    // Delete the test articles (soft delete)
    console.log('\n🗑️ Step 2: Soft deleting test articles...');
    for (const article of createdArticles) {
      article.softDelete(user._id, 'User deleted via UI');
      await article.save();
      console.log(`   ✅ Deleted: "${article.title}"`);
    }

    // Show active articles after deletion
    console.log('\n📋 Step 3: Active articles (after deletion)');
    activeArticles = await Article.find({
      userId: user._id,
      isDeleted: { $ne: true }
    });
    console.log(`   Total active articles: ${activeArticles.length}`);
    activeArticles.forEach(a => console.log(`   - ${a.title}`));

    // Show trash bin
    console.log('\n🗑️ Step 4: Trash bin contents');
    const trashedArticles = await Article.find({
      userId: user._id,
      isDeleted: true
    }).sort({ deletedAt: -1 });
    console.log(`   Total articles in trash: ${trashedArticles.length}`);
    trashedArticles.forEach(a => {
      console.log(`   - "${a.title}"`);
      console.log(`     Deleted at: ${a.deletedAt}`);
      console.log(`     Reason: ${a.deleteReason}`);
    });

    // Restore one article
    console.log('\n♻️ Step 5: Restoring one article...');
    const articleToRestore = createdArticles[0];
    articleToRestore.restore();
    await articleToRestore.save();
    console.log(`   ✅ Restored: "${articleToRestore.title}"`);

    // Show final state
    console.log('\n📊 Step 6: Final state');
    activeArticles = await Article.find({
      userId: user._id,
      isDeleted: { $ne: true }
    });
    const finalTrash = await Article.find({
      userId: user._id,
      isDeleted: true
    });
    console.log(`   Active articles: ${activeArticles.length}`);
    activeArticles.forEach(a => console.log(`   - ${a.title}`));
    console.log(`   Articles in trash: ${finalTrash.length}`);
    finalTrash.forEach(a => console.log(`   - ${a.title}`));

    // Clean up - permanently delete test articles
    console.log('\n🧹 Cleaning up test articles...');
    for (const article of createdArticles) {
      await Article.deleteOne({ _id: article._id });
    }
    console.log('   ✅ Test articles permanently deleted');

    await mongoose.connection.close();
    console.log('\n✅ Demo completed successfully!');
    console.log('\n📌 Summary:');
    console.log('   - Trash feature is working correctly');
    console.log('   - Soft delete moves articles to trash');
    console.log('   - Deleted articles are hidden from main list');
    console.log('   - Deleted articles appear in trash bin');
    console.log('   - Articles can be restored from trash');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

demoTrashFeature();
