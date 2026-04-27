import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../backend/models/User.js';

dotenv.config();

async function resetPassword() {
  try {
    const email = process.argv[2];
    const newPassword = process.argv[3] || 'password123';

    if (!email) {
      console.log('Usage: node scripts/reset-user-password.js <email> [newPassword]');
      console.log('Example: node scripts/reset-user-password.js user@example.com password123');
      process.exit(1);
    }

    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`❌ User not found: ${email}`);
      process.exit(1);
    }

    console.log(`\n📋 Found user: ${user.email}`);
    console.log(`   Name: ${user.name}`);
    console.log(`   Role: ${user.role}`);

    // Set the new password (it will be automatically hashed by the pre-save hook)
    user.password = newPassword; // Don't hash manually - the model will do it
    await user.save();

    console.log(`\n✅ Password reset successfully!`);
    console.log(`   Email: ${email}`);
    console.log(`   New Password: ${newPassword}`);
    console.log(`\n   You can now login with these credentials.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

resetPassword();
