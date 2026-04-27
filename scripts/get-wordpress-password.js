import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import WordPressIntegration from '../backend/models/WordPressIntegration.js';

// Load environment variables
dotenv.config();

async function getWordPressPassword() {
  try {
    console.log('🔍 Searching for WordPress credentials...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Find user Harry (case-insensitive search)
    const user = await User.findOne({ 
      name: { $regex: /harry/i } 
    });
    
    if (!user) {
      console.log('❌ User "Harry" not found in database');
      console.log('\n📋 Available users:');
      const allUsers = await User.find({}, 'name email').limit(10);
      allUsers.forEach(u => {
        console.log(`   - ${u.name} (${u.email})`);
      });
      process.exit(1);
    }
    
    console.log('👤 User Found:');
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   User ID:', user._id);
    console.log('');
    
    // Find WordPress integration for this user
    const wpIntegration = await WordPressIntegration.findOne({ userId: user._id });
    
    if (!wpIntegration) {
      console.log('❌ No WordPress integration found for this user');
      console.log('\n💡 This user has not set up WordPress integration yet.');
      process.exit(1);
    }
    
    console.log('🔐 WordPress Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('   WordPress URL:', wpIntegration.wordpressUrl);
    console.log('   Username:', wpIntegration.username);
    console.log('   Application Password:', wpIntegration.appPassword);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📝 Additional Info:');
    console.log('   Status:', wpIntegration.isActive ? '✅ Active' : '❌ Inactive');
    console.log('   Created:', wpIntegration.createdAt?.toLocaleString() || 'N/A');
    console.log('   Last Updated:', wpIntegration.updatedAt?.toLocaleString() || 'N/A');
    
    if (wpIntegration.lastSyncedAt) {
      console.log('   Last Synced:', wpIntegration.lastSyncedAt.toLocaleString());
    }
    
    console.log('');
    console.log('✅ WordPress credentials retrieved successfully!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📦 Database disconnected');
  }
}

// Run the script
getWordPressPassword();
