import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/User.js';

dotenv.config();

async function checkUserStatus() {
  try {
    const email = process.argv[2] || 'barotharshil070@gmail.com';

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log('📋 User Status:');
    console.log('   Email:', user.email);
    console.log('   Name:', user.name);
    console.log('   Role:', user.role);
    console.log('   Email Verified:', user.emailVerified);
    console.log('   Account Locked:', user.accountLocked || false);
    console.log('   Failed Login Attempts:', user.failedLoginAttempts || 0);
    console.log('   Locked Until:', user.lockedUntil || 'N/A');
    console.log('   Last Login:', user.lastLogin || 'Never');

    if (user.accountLocked) {
      console.log('\n⚠️ Account is LOCKED!');
      console.log('   Unlocking account...');
      user.accountLocked = false;
      user.lockedUntil = null;
      user.failedLoginAttempts = 0;
      await user.save();
      console.log('✅ Account unlocked successfully!');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUserStatus();
