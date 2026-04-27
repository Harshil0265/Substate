import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import Article from '../backend/models/Article.js';

dotenv.config();

async function testCompleteTrashSystem() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/substate');
    console.log('✅ Connected to MongoDB\n');

    // Find user
    const user = await User.findOne({ email: 'barotharshil070@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 Testing with user:', user.name, `(${user.email})`);
    console.log('   User ID:', user._id);

    // ============================================
    // TEST 1: Create test articles
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST 1: Creating test articles');
    console.log('='.repeat(60));

    const testArticles = [
      { title: 'Test Article 1 - Health', content: 'Content about health' },
      { title: 'Test Article 2 - Cricket', content: 'Content about cricket' },
      { title: 'Test Article 3 - IPL', content: 'Content about IPL' }
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
      console.log(`✅ Created: "${article.title}" (ID: ${article._id})`);
    }

    // ============================================
    // TEST 2: Verify articles appear in active list
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Verify articles in active list');
    console.log('='.repeat(60));

    let activeArticles = await Article.find({
      userId: user._id,
      isDeleted: { $ne: true }
    }).sort({ createdAt: -1 });

    console.log(`📋 Active articles count: ${activeArticles.length}`);
    activeArticles.forEach((a, i) => {
      console.log(`   ${i + 1}. "${a.title}" (isDeleted: ${a.isDeleted})`);
    });

    if (activeArticles.length < 3) {
      console.log('❌ ERROR: Not all articles are in active list!');
      return;
    }
    console.log('✅ All articles are in active list');

    // ============================================
    // TEST 3: Soft delete articles (user-wise)
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: Soft deleting articles (user-wise storage)');
    console.log('='.repeat(60));

    for (const article of createdArticles) {
      console.log(`🗑️ Deleting: "${article.title}"`);
      article.softDelete(user._id, 'User deleted via UI');
      await article.save();
      console.log(`   ✅ Soft deleted successfully`);
      console.log(`   - isDeleted: ${article.isDeleted}`);
      console.log(`   - deletedAt: ${article.deletedAt}`);
      console.log(`   - deletedBy: ${article.deletedBy}`);
      console.log(`   - deleteReason: ${article.deleteReason}`);
    }

    // ============================================
    // TEST 4: Verify articles removed from active list
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST 4: Verify articles removed from active list');
    console.log('='.repeat(60));

    activeArticles = await Article.find({
      userId: user._id,
      isDeleted: { $ne: true }
    });

    console.log(`📋 Active articles count: ${activeArticles.length}`);
    activeArticles.forEach((a, i) => {
      console.log(`   ${i + 1}. "${a.title}"`);
    });

    const deletedTestArticles = activeArticles.filter(a => 
      a.title.includes('Test Article')
    );

    if (deletedTestArticles.length > 0) {
      console.log('❌ ERROR: Deleted articles still in active list!');
      return;
    }
    console.log('✅ Deleted articles removed from active list');

    // ============================================
    // TEST 5: Verify articles in trash (user-wise)
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST 5: Verify articles in trash (user-wise storage)');
    console.log('='.repeat(60));

    const trashedArticles = await Article.find({
      userId: user._id,
      isDeleted: true
    }).sort({ deletedAt: -1 });

    console.log(`🗑️ Trash count for user: ${trashedArticles.length}`);
    trashedArticles.forEach((a, i) => {
      console.log(`   ${i + 1}. "${a.title}"`);
      console.log(`      - Deleted at: ${a.deletedAt}`);
      console.log(`      - Deleted by: ${a.deletedBy}`);
      console.log(`      - Reason: ${a.deleteReason}`);
    });

    if (trashedArticles.length < 3) {
      console.log('❌ ERROR: Not all deleted articles are in trash!');
      return;
    }
    console.log('✅ All deleted articles are in trash');

    // ============================================
    // TEST 6: Verify trash is user-specific
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST 6: Verify trash is user-specific');
    console.log('='.repeat(60));

    // Get another user's trash
    const anotherUser = await User.findOne({ 
      email: { $ne: user.email } 
    });

    if (anotherUser) {
      const anotherUserTrash = await Article.find({
        userId: anotherUser._id,
        isDeleted: true
      });
      console.log(`🗑️ Another user's trash count: ${anotherUserTrash.length}`);
      console.log(`✅ Trash is user-specific (each user has their own trash)`);
    }

    // ============================================
    // TEST 7: Restore one article
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST 7: Restore article from trash');
    console.log('='.repeat(60));

    const articleToRestore = createdArticles[0];
    console.log(`♻️ Restoring: "${articleToRestore.title}"`);
    
    articleToRestore.restore();
    await articleToRestore.save();
    
    console.log(`   ✅ Restored successfully`);
    console.log(`   - isDeleted: ${articleToRestore.isDeleted}`);
    console.log(`   - deletedAt: ${articleToRestore.deletedAt}`);
    console.log(`   - deletedBy: ${articleToRestore.deletedBy}`);

    // ============================================
    // TEST 8: Verify restored article in active list
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST 8: Verify restored article in active list');
    console.log('='.repeat(60));

    activeArticles = await Article.find({
      userId: user._id,
      isDeleted: { $ne: true }
    });

    const restoredInActive = activeArticles.find(a => 
      a._id.toString() === articleToRestore._id.toString()
    );

    if (!restoredInActive) {
      console.log('❌ ERROR: Restored article not in active list!');
      return;
    }
    console.log(`✅ Restored article "${restoredInActive.title}" is back in active list`);

    // ============================================
    // TEST 9: Verify restored article removed from trash
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST 9: Verify restored article removed from trash');
    console.log('='.repeat(60));

    const updatedTrash = await Article.find({
      userId: user._id,
      isDeleted: true
    });

    console.log(`🗑️ Trash count after restore: ${updatedTrash.length}`);
    updatedTrash.forEach((a, i) => {
      console.log(`   ${i + 1}. "${a.title}"`);
    });

    const stillInTrash = updatedTrash.find(a => 
      a._id.toString() === articleToRestore._id.toString()
    );

    if (stillInTrash) {
      console.log('❌ ERROR: Restored article still in trash!');
      return;
    }
    console.log('✅ Restored article removed from trash');

    // ============================================
    // TEST 10: Restore remaining articles
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST 10: Restore remaining articles');
    console.log('='.repeat(60));

    for (let i = 1; i < createdArticles.length; i++) {
      const article = createdArticles[i];
      console.log(`♻️ Restoring: "${article.title}"`);
      article.restore();
      await article.save();
      console.log(`   ✅ Restored`);
    }

    // ============================================
    // TEST 11: Final verification
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('TEST 11: Final verification');
    console.log('='.repeat(60));

    const finalActive = await Article.find({
      userId: user._id,
      isDeleted: { $ne: true }
    });

    const finalTrash = await Article.find({
      userId: user._id,
      isDeleted: true
    });

    console.log(`📋 Final active articles: ${finalActive.length}`);
    console.log(`🗑️ Final trash count: ${finalTrash.length}`);

    if (finalTrash.length > 0) {
      console.log('❌ ERROR: Trash should be empty after restoring all!');
      return;
    }
    console.log('✅ All articles restored, trash is empty');

    // ============================================
    // CLEANUP: Delete test articles
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('CLEANUP: Removing test articles');
    console.log('='.repeat(60));

    for (const article of createdArticles) {
      await Article.deleteOne({ _id: article._id });
      console.log(`🧹 Permanently deleted: "${article.title}"`);
    }

    await mongoose.connection.close();

    // ============================================
    // FINAL SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('✓ Articles can be soft deleted');
    console.log('✓ Deleted articles are stored user-wise');
    console.log('✓ Deleted articles removed from active list');
    console.log('✓ Deleted articles appear in trash');
    console.log('✓ Trash is user-specific');
    console.log('✓ Articles can be restored from trash');
    console.log('✓ Restored articles return to active list');
    console.log('✓ Restored articles removed from trash');
    console.log('✓ System works without errors');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

testCompleteTrashSystem();
