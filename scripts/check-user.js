import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../backend/models/User.js';

dotenv.config();

const checkUser = async () => {
  try {
    console.log('🔍 Checking user in database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const email = 'barotharshil070@gmail.com';
    
    // Find user
    const user = await User.findOne({ email }).select('-password');
    
    if (user) {
      console.log('\n✅ User found:');
      console.log(`   ID: ${user._id}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Email Verified: ${user.emailVerified}`);
      console.log(`   Subscription: ${user.subscription}`);
      console.log(`   Created: ${user.createdAt}`);
      console.log(`   Last Login: ${user.lastLogin || 'Never'}`);
      console.log(`   Failed Attempts: ${user.failedLoginAttempts || 0}`);
      console.log(`   Account Locked: ${user.accountLocked || false}`);
      
      if (user.lockedUntil) {
        const now = new Date();
        const isStillLocked = user.lockedUntil > now;
        console.log(`   Locked Until: ${user.lockedUntil} (${isStillLocked ? 'STILL LOCKED' : 'EXPIRED'})`);
      }
    } else {
      console.log('\n❌ User not found');
      console.log('   The user needs to register first');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
};

checkUser();