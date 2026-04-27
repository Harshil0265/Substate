import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import Article from '../backend/models/Article.js';
import jwt from 'jsonwebtoken';

dotenv.config();

async function testAPICall() {
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

    console.log(`\n✅ User found: ${user.name}`);
    console.log(`   User ID: ${user._id}`);

    // Simulate the backend query
    const page = 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const filter = { 
      userId: user._id,
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } },
        { isDeleted: null }
      ]
    };

    console.log('\n🔍 Query filter:', JSON.stringify(filter, null, 2));

    const articles = await Article.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Article.countDocuments(filter);

    console.log(`\n✅ API would return:`);
    console.log(`   Total articles: ${total}`);
    console.log(`   Articles in this page: ${articles.length}`);
    console.log(`   Total pages: ${Math.ceil(total / limit)}`);

    if (articles.length > 0) {
      console.log(`\n📝 Articles:`);
      articles.forEach((article, index) => {
        console.log(`   ${index + 1}. ${article.title}`);
        console.log(`      Status: ${article.status}`);
        console.log(`      Word Count: ${article.wordCount || 0}`);
        console.log(`      Created: ${article.createdAt}`);
        console.log('');
      });
    }

    // Generate a test token
    const token = jwt.sign(
      { id: user._id.toString(), email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    console.log('\n🔑 Test token generated (use this in API calls):');
    console.log(`   Bearer ${token.substring(0, 50)}...`);

    await mongoose.connection.close();
    console.log('\n✅ Test completed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAPICall();
