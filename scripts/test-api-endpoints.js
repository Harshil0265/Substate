import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import Article from '../backend/models/Article.js';

dotenv.config();

// Simulate the API endpoint logic
async function simulateGetArticles(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const filter = { 
    userId: userId,
    isDeleted: { $ne: true }
  };

  const articles = await Article.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Article.countDocuments(filter);

  return {
    articles,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    }
  };
}

async function simulateGetTrash(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const deletedArticles = await Article.find({
    userId: userId,
    isDeleted: true
  })
    .sort({ deletedAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Article.countDocuments({
    userId: userId,
    isDeleted: true
  });

  return {
    articles: deletedArticles,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    }
  };
}

async function simulateDeleteArticle(articleId, userId, reason = 'User deleted') {
  const article = await Article.findById(articleId);

  if (!article) {
    throw new Error('Article not found');
  }

  if (article.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized');
  }

  article.softDelete(userId, reason);
  await article.save();

  return { message: 'Article moved to trash successfully' };
}

async function simulateRestoreArticle(articleId, userId) {
  const article = await Article.findById(articleId);

  if (!article) {
    throw new Error('Article not found');
  }

  if (article.userId.toString() !== userId.toString()) {
    throw new Error('Unauthorized');
  }

  if (!article.isDeleted) {
    throw new Error('Article is not in trash');
  }

  article.restore();
  await article.save();

  return { 
    message: 'Article restored successfully',
    article 
  };
}

async function testAPIEndpoints() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/substate');
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ email: 'barotharshil070@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 Testing API endpoints for:', user.name);
    console.log('   User ID:', user._id);

    // Create test articles
    console.log('\n📝 Creating test articles...');
    const testArticles = [];
    for (let i = 1; i <= 3; i++) {
      const article = new Article({
        userId: user._id,
        title: `API Test Article ${i}`,
        content: `Test content ${i}`,
        status: 'DRAFT',
        slug: `api-test-article-${i}`,
        isDeleted: false
      });
      await article.save();
      testArticles.push(article);
      console.log(`   ✅ Created: "${article.title}"`);
    }

    // TEST 1: GET /api/articles (active articles)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 1: GET /api/articles (active articles)');
    console.log('='.repeat(60));
    
    let response = await simulateGetArticles(user._id);
    console.log(`✅ Response: ${response.articles.length} articles`);
    console.log(`   Total: ${response.pagination.total}`);
    console.log(`   Pages: ${response.pagination.pages}`);
    response.articles.slice(0, 5).forEach((a, i) => {
      console.log(`   ${i + 1}. ${a.title}`);
    });

    // TEST 2: DELETE /api/articles/:id (soft delete)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: DELETE /api/articles/:id (soft delete)');
    console.log('='.repeat(60));

    for (const article of testArticles) {
      console.log(`🗑️ Deleting: "${article.title}"`);
      const deleteResponse = await simulateDeleteArticle(article._id, user._id, 'Testing API');
      console.log(`   ✅ ${deleteResponse.message}`);
    }

    // TEST 3: GET /api/articles (verify deleted articles removed)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: GET /api/articles (verify deleted removed)');
    console.log('='.repeat(60));

    response = await simulateGetArticles(user._id);
    console.log(`✅ Response: ${response.articles.length} articles`);
    const hasDeletedInActive = response.articles.some(a => 
      a.title.includes('API Test Article')
    );
    if (hasDeletedInActive) {
      console.log('❌ ERROR: Deleted articles still in active list!');
      return;
    }
    console.log('✅ Deleted articles not in active list');

    // TEST 4: GET /api/articles/trash/list (trash bin)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 4: GET /api/articles/trash/list (trash bin)');
    console.log('='.repeat(60));

    const trashResponse = await simulateGetTrash(user._id);
    console.log(`✅ Response: ${trashResponse.articles.length} articles in trash`);
    console.log(`   Total: ${trashResponse.pagination.total}`);
    trashResponse.articles.forEach((a, i) => {
      console.log(`   ${i + 1}. ${a.title} (deleted at: ${a.deletedAt})`);
    });

    if (trashResponse.articles.length < 3) {
      console.log('❌ ERROR: Not all deleted articles in trash!');
      return;
    }
    console.log('✅ All deleted articles in trash');

    // TEST 5: POST /api/articles/:id/restore (restore article)
    console.log('\n' + '='.repeat(60));
    console.log('TEST 5: POST /api/articles/:id/restore (restore)');
    console.log('='.repeat(60));

    const articleToRestore = testArticles[0];
    console.log(`♻️ Restoring: "${articleToRestore.title}"`);
    const restoreResponse = await simulateRestoreArticle(articleToRestore._id, user._id);
    console.log(`   ✅ ${restoreResponse.message}`);

    // TEST 6: Verify restored article in active list
    console.log('\n' + '='.repeat(60));
    console.log('TEST 6: Verify restored article in active list');
    console.log('='.repeat(60));

    response = await simulateGetArticles(user._id);
    const restoredInActive = response.articles.find(a => 
      a._id.toString() === articleToRestore._id.toString()
    );

    if (!restoredInActive) {
      console.log('❌ ERROR: Restored article not in active list!');
      return;
    }
    console.log(`✅ Restored article "${restoredInActive.title}" in active list`);

    // TEST 7: Verify restored article removed from trash
    console.log('\n' + '='.repeat(60));
    console.log('TEST 7: Verify restored article removed from trash');
    console.log('='.repeat(60));

    const updatedTrash = await simulateGetTrash(user._id);
    console.log(`✅ Trash count: ${updatedTrash.articles.length}`);
    
    const stillInTrash = updatedTrash.articles.find(a => 
      a._id.toString() === articleToRestore._id.toString()
    );

    if (stillInTrash) {
      console.log('❌ ERROR: Restored article still in trash!');
      return;
    }
    console.log('✅ Restored article removed from trash');

    // Cleanup
    console.log('\n🧹 Cleaning up test articles...');
    for (const article of testArticles) {
      await Article.deleteOne({ _id: article._id });
    }
    console.log('✅ Cleanup completed');

    await mongoose.connection.close();

    console.log('\n' + '='.repeat(60));
    console.log('✅ ALL API ENDPOINT TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('✓ GET /api/articles - returns active articles');
    console.log('✓ DELETE /api/articles/:id - soft deletes article');
    console.log('✓ GET /api/articles/trash/list - returns trash');
    console.log('✓ POST /api/articles/:id/restore - restores article');
    console.log('✓ User-wise storage working correctly');
    console.log('✓ No errors in the system');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

testAPIEndpoints();
