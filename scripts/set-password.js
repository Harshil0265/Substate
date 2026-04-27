import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../backend/models/User.js';

dotenv.config();

async function setPassword() {
  try {
    const email = process.argv[2];
    const newPassword = process.argv[3];

    if (!email || !newPassword) {
      console.log('\n📝 USAGE:');
      console.log('   node scripts/set-password.js <email> <your-password>');
      console.log('\n📝 EXAMPLE:');
      console.log('   node scripts/set-password.js barotharshil070@gmail.com MySecurePass123!');
      console.log('\n⚠️  NOTE: Replace "MySecurePass123!" with YOUR actual password\n');
      process.exit(1);
    }

    if (newPassword.length < 6) {
      console.log('❌ Password must be at least 6 characters long');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log('📋 User found:');
    console.log('   Name:', user.name);
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log();

    // Set the new password (it will be automatically hashed by the pre-save hook)
    console.log('🔄 Setting your password...');
    user.password = newPassword; // Don't hash manually - the model will do it
    
    // Reset any account locks
    user.accountLocked = false;
    user.lockedUntil = null;
    user.failedLoginAttempts = 0;
    
    await user.save();

    console.log('\n✅ PASSWORD SET SUCCESSFULLY!');
    console.log('=' .repeat(60));
    console.log('\n📝 Your credentials:');
    console.log('   Email:', email);
    console.log('   Password: [Your password - keep it secure]');
    console.log('\n   You can now login with your password.');
    console.log('   ⚠️  IMPORTANT: Keep your password safe and secure!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

setPassword();
