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
    
    // Find user by email
    const user = await User.findOne({ 
      email: 'barotharshil070@gmail.com'
    });
    
    if (!user) {
      console.log('❌ User with email "barotharshil070@gmail.com" not found in database');
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
      console.log('   They need to configure WordPress settings in the app first.');
      process.exit(1);
    }
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔐 WORDPRESS CREDENTIALS FOR HARRY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('   WordPress URL:        ', wpIntegration.wordpressUrl);
    console.log('   WordPress Username:   ', wpIntegration.username);
    console.log('   Application Password: ', wpIntegration.appPassword);
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('📝 Additional Information:');
    console.log('   Status:', wpIntegration.isActive ? '✅ Active' : '❌ Inactive');
    console.log('   Created:', wpIntegration.createdAt?.toLocaleString() || 'N/A');
    console.log('   Last Updated:', wpIntegration.updatedAt?.toLocaleString() || 'N/A');
    
    if (wpIntegration.lastSyncedAt) {
      console.log('   Last Synced:', wpIntegration.lastSyncedAt.toLocaleString());
    }
    
    if (wpIntegration.defaultCategory) {
      console.log('   Default Category:', wpIntegration.defaultCategory);
    }
    
    if (wpIntegration.defaultAuthor) {
      console.log('   Default Author:', wpIntegration.defaultAuthor);
    }
    
    console.log('');
    console.log('✅ WordPress credentials retrieved successfully!');
    console.log('');
    console.log('📋 How to use:');
    console.log('   1. Go to your WordPress site:', wpIntegration.wordpressUrl);
    console.log('   2. Use username:', wpIntegration.username);
    console.log('   3. Use application password:', wpIntegration.appPassword);
    console.log('   4. This password is for REST API access, not regular login');
    console.log('');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Database disconnected');
  }
}

// Run the script
getWordPressPassword();
