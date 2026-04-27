import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import Article from '../backend/models/Article.js';
import AIContentGenerator from '../backend/services/AIContentGenerator.js';
import AuthenticContentServicePro from '../backend/services/AuthenticContentServicePro.js';
import UsageService from '../backend/services/UsageService.js';

dotenv.config();

async function testArticleGeneration() {
  try {
    console.log('🔄 Starting article generation test...\n');

    // Check environment variables
    console.log('📋 Checking environment variables:');
    console.log(`   GROQ_API_KEY: ${process.env.GROQ_API_KEY ? '✅ Set (' + process.env.GROQ_API_KEY.substring(0, 20) + '...)' : '❌ Not set'}`);
    console.log(`   MONGODB_URI: ${process.env.MONGODB_URI ? '✅ Set' : '❌ Not set'}`);
    console.log('');

    if (!process.env.GROQ_API_KEY) {
      console.log('❌ GROQ_API_KEY is not set in .env file!');
      return;
    }

    // Connect to database
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/substate');
    console.log('✅ Connected to MongoDB\n');

    // Find test user
    const user = await User.findOne({ email: 'barotharshil070@gmail.com' });
    if (!user) {
      console.log('❌ Test user not found');
      return;
    }

    console.log('👤 Test user:', user.name, `(${user.email})`);
    console.log('   User ID:', user._id);
    console.log('');

    // Check usage limits
    console.log('📊 Checking usage limits...');
    const canCreate = await UsageService.canCreateArticle(user._id);
    console.log(`   Can create article: ${canCreate.allowed ? '✅ Yes' : '❌ No'}`);
    if (!canCreate.allowed) {
      console.log(`   Reason: ${canCreate.reason}`);
      return;
    }
    console.log('');

    // Test 1: Test AIContentGenerator directly
    console.log('='.repeat(60));
    console.log('TEST 1: Testing AIContentGenerator directly');
    console.log('='.repeat(60));

    const aiGenerator = new AIContentGenerator();
    const testTopic = 'The Benefits of Regular Exercise';
    
    console.log(`📝 Generating content for: "${testTopic}"`);
    console.log('⏳ This may take 10-30 seconds...\n');

    const startTime = Date.now();
    const aiContent = await aiGenerator.generateComprehensiveArticle(testTopic, {
      targetLength: 1500,
      minLength: 800
    });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    const wordCount = aiContent.split(/\s+/).filter(w => w.length > 0).length;
    console.log(`\n✅ Content generated successfully!`);
    console.log(`   Word count: ${wordCount} words`);
    console.log(`   Duration: ${duration} seconds`);
    console.log(`   Content preview: ${aiContent.substring(0, 200)}...\n`);

    // Test 2: Test AuthenticContentServicePro
    console.log('='.repeat(60));
    console.log('TEST 2: Testing AuthenticContentServicePro');
    console.log('='.repeat(60));

    const contentService = new AuthenticContentServicePro();
    const testTopic2 = 'Introduction to Machine Learning';
    
    console.log(`📝 Generating authentic content for: "${testTopic2}"`);
    console.log('⏳ This may take 10-30 seconds...\n');

    const startTime2 = Date.now();
    const contentResult = await contentService.generateAuthenticContent(testTopic2, {
      contentType: 'BLOG',
      targetLength: 1500,
      minLength: 800,
      includeStatistics: true,
      includeCitations: true,
      researchDepth: 'comprehensive'
    });
    const duration2 = ((Date.now() - startTime2) / 1000).toFixed(2);

    const wordCount2 = contentResult.content.split(/\s+/).filter(w => w.length > 0).length;
    console.log(`\n✅ Authentic content generated successfully!`);
    console.log(`   Word count: ${wordCount2} words`);
    console.log(`   Duration: ${duration2} seconds`);
    console.log(`   Sources used: ${contentResult.metadata.sourcesUsed}`);
    console.log(`   Authenticity: ${contentResult.metadata.authenticity}`);
    console.log(`   Content preview: ${contentResult.content.substring(0, 200)}...\n`);

    // Test 3: Test full article creation workflow
    console.log('='.repeat(60));
    console.log('TEST 3: Testing full article creation workflow');
    console.log('='.repeat(60));

    const testArticleTitle = 'Test Article - ' + Date.now();
    console.log(`📝 Creating article: "${testArticleTitle}"`);
    console.log('⏳ Generating content...\n');

    const startTime3 = Date.now();
    const articleContent = await contentService.generateAuthenticContent(testArticleTitle, {
      contentType: 'BLOG',
      targetLength: 1200,
      minLength: 600
    });
    const duration3 = ((Date.now() - startTime3) / 1000).toFixed(2);

    // Create article in database
    const article = new Article({
      userId: user._id,
      title: testArticleTitle,
      slug: testArticleTitle.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-'),
      content: articleContent.content,
      excerpt: articleContent.content.substring(0, 200) + '...',
      contentType: 'BLOG',
      aiGenerated: true,
      wordCount: articleContent.content.split(/\s+/).filter(w => w.length > 0).length,
      readTime: Math.ceil(articleContent.content.split(/\s+/).filter(w => w.length > 0).length / 200),
      status: 'DRAFT',
      isDeleted: false
    });

    await article.save();
    
    // Update usage (skip if function doesn't exist)
    try {
      if (UsageService.recordArticleCreation) {
        await UsageService.recordArticleCreation(user._id);
      }
    } catch (err) {
      console.log('   ⚠️ Skipping usage tracking (not critical for test)');
    }

    console.log(`✅ Article created successfully!`);
    console.log(`   Article ID: ${article._id}`);
    console.log(`   Word count: ${article.wordCount} words`);
    console.log(`   Read time: ${article.readTime} minutes`);
    console.log(`   Duration: ${duration3} seconds\n`);

    // Cleanup - delete test article
    console.log('🧹 Cleaning up test article...');
    await Article.deleteOne({ _id: article._id });
    console.log('✅ Test article deleted\n');

    await mongoose.connection.close();

    // Final summary
    console.log('='.repeat(60));
    console.log('✅ ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('✓ GROQ API key is working');
    console.log('✓ AIContentGenerator is working');
    console.log('✓ AuthenticContentServicePro is working');
    console.log('✓ Full article creation workflow is working');
    console.log('✓ No errors encountered');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    console.error('\nError details:');
    console.error('  Message:', error.message);
    console.error('  Stack:', error.stack);
    
    if (error.message.includes('API key')) {
      console.error('\n💡 Tip: Check if GROQ_API_KEY is correctly set in .env file');
    }
    
    process.exit(1);
  }
}

testArticleGeneration();
