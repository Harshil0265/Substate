import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import WordPressIntegration from '../backend/models/WordPressIntegration.js';

// Load environment variables
dotenv.config();

async function checkFullData() {
  try {
    console.log('🔍 Checking all data for user...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database\n');
    
    // Find user by email
    const user = await User.findOne({ 
      email: 'barotharshil070@gmail.com'
    });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('👤 USER DATA:');
    console.log(JSON.stringify(user.toObject(), null, 2));
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    // Find WordPress integration
    const wpIntegration = await WordPressIntegration.findOne({ userId: user._id });
    
    if (wpIntegration) {
      console.log('🔌 WORDPRESS INTEGRATION DATA:');
      console.log(JSON.stringify(wpIntegration.toObject(), null, 2));
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Check each field
      console.log('📋 FIELD ANALYSIS:');
      console.log('   wordpressUrl:', wpIntegration.wordpressUrl || '❌ NOT SET');
      console.log('   username:', wpIntegration.username || '❌ NOT SET');
      console.log('   appPassword:', wpIntegration.appPassword || '❌ NOT SET');
      console.log('   isActive:', wpIntegration.isActive);
      console.log('');
      
      if (!wpIntegration.wordpressUrl || !wpIntegration.appPassword) {
        console.log('⚠️  ISSUE FOUND:');
        console.log('   The WordPress URL and/or Application Password are missing.');
        console.log('   The user needs to:');
        console.log('   1. Go to WordPress Settings in the app');
        console.log('   2. Enter their WordPress site URL');
        console.log('   3. Generate and enter an Application Password from WordPress');
        console.log('');
      }
    } else {
      console.log('❌ No WordPress integration found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.disconnect();
    console.log('📦 Database disconnected');
  }
}

// Run the script
checkFullData();
