import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import Article from '../backend/models/Article.js';

dotenv.config();

async function testDeleteRestore() {
  try {
    console.log('🔄 Testing delete and restore functionality...\n');

    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/substate');
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ email: 'barotharshil070@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 Test user:', user.name);

    // Create a test article
    console.log('\n📝 Creating test article...');
    const testArticle = new Article({
      userId: user._id,
      title: 'Delete Test Article - ' + Date.now(),
      content: 'This is a test article for delete/restore functionality',
      status: 'DRAFT',
      slug: 'delete-test-' + Date.now(),
      isDeleted: false
    });
    await testArticle.save();
    console.log('✅ Test article created:', testArticle._id);

    // Test 1: Soft delete
    console.log('\n' + '='.repeat(60));
    console.log('TEST 1: Soft Delete');
    console.log('='.repeat(60));
    
    console.log('🗑️ Soft deleting article...');
    testArticle.softDelete(user._id, 'User deleted');
    await testArticle.save();
    
    console.log('✅ Article soft deleted');
    console.log('   isDeleted:', testArticle.isDeleted);
    console.log('   deletedAt:', testArticle.deletedAt);
    console.log('   deletedBy:', testArticle.deletedBy);
    console.log('   deleteReason:', testArticle.deleteReason);

    // Test 2: Verify not in active list
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Verify not in active list');
    console.log('='.repeat(60));
    
    const activeArticles = await Article.find({
      userId: user._id,
      isDeleted: { $ne: true }
    });
    
    const foundInActive = activeArticles.find(a => a._id.toString() === testArticle._id.toString());
    if (foundInActive) {
      console.log('❌ ERROR: Deleted article still in active list!');
      return;
    }
    console.log('✅ Deleted article not in active list');

    // Test 3: Verify in trash
    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: Verify in trash');
    console.log('='.repeat(60));
    
    const trashedArticles = await Article.find({
      userId: user._id,
      isDeleted: true
    });
    
    const foundInTrash = trashedArticles.find(a => a._id.toString() === testArticle._id.toString());
    if (!foundInTrash) {
      console.log('❌ ERROR: Deleted article not in trash!');
      return;
    }
    console.log('✅ Deleted article found in trash');
    console.log('   Title:', foundInTrash.title);
    console.log('   Deleted at:', foundInTrash.deletedAt);

    // Test 4: Restore article
    console.log('\n' + '='.repeat(60));
    console.log('TEST 4: Restore Article');
    console.log('='.repeat(60));
    
    console.log('♻️ Restoring article...');
    testArticle.restore();
    await testArticle.save();
    
    console.log('✅ Article restored');
    console.log('   isDeleted:', testArticle.isDeleted);
    console.log('   deletedAt:', testArticle.deletedAt);
    console.log('   deletedBy:', testArticle.deletedBy);

    // Test 5: Verify back in active list
    console.log('\n' + '='.repeat(60));
    console.log('TEST 5: Verify back in active list');
    console.log('='.repeat(60));
    
    const activeArticlesAfter = await Article.find({
      userId: user._id,
      isDeleted: { $ne: true }
    });
    
    const foundInActiveAfter = activeArticlesAfter.find(a => a._id.toString() === testArticle._id.toString());
    if (!foundInActiveAfter) {
      console.log('❌ ERROR: Restored article not in active list!');
      return;
    }
    console.log('✅ Restored article back in active list');

    // Test 6: Verify not in trash
    console.log('\n' + '='.repeat(60));
    console.log('TEST 6: Verify not in trash');
    console.log('='.repeat(60));
    
    const trashedArticlesAfter = await Article.find({
      userId: user._id,
      isDeleted: true
    });
    
    const stillInTrash = trashedArticlesAfter.find(a => a._id.toString() === testArticle._id.toString());
    if (stillInTrash) {
      console.log('❌ ERROR: Restored article still in trash!');
      return;
    }
    console.log('✅ Restored article not in trash');

    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await Article.deleteOne({ _id: testArticle._id });
    console.log('✅ Test article permanently deleted');

    await mongoose.connection.close();

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('✓ Soft delete works correctly');
    console.log('✓ Deleted articles go to trash');
    console.log('✓ Deleted articles removed from active list');
    console.log('✓ Restore works correctly');
    console.log('✓ Restored articles return to active list');
    console.log('✓ Restored articles removed from trash');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }
}

testDeleteRestore();
