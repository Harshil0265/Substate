import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const diagnoseAdminLogin = async () => {
  try {
    console.log('\n🔍 SUBSTATE Admin Login Diagnostic Tool\n');
    console.log('=' .repeat(50));

    // Check environment variables
    console.log('\n📋 Environment Variables Check:');
    console.log('✓ MONGODB_URI:', process.env.MONGODB_URI ? '✅ Set' : '❌ Missing');
    console.log('✓ JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
    console.log('✓ NODE_ENV:', process.env.NODE_ENV || 'development');

    if (!process.env.JWT_SECRET) {
      console.log('\n❌ CRITICAL: JWT_SECRET is not set!');
      console.log('This will cause token generation to fail.');
      process.exit(1);
    }

    // Connect to MongoDB
    console.log('\n🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check for admin users
    console.log('👥 Checking for admin users...');
    const adminUsers = await User.find({ role: 'ADMIN' });
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found in database!');
      console.log('\n📝 To create an admin user, run:');
      console.log('   npm run create-admin\n');
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):\n`);
      
      for (const admin of adminUsers) {
        console.log(`  📧 Email: ${admin.email}`);
        console.log(`  👤 Name: ${admin.name}`);
        console.log(`  ✉️  Email Verified: ${admin.emailVerified ? '✅ Yes' : '❌ No'}`);
        console.log(`  🔒 Account Locked: ${admin.accountLocked ? '❌ Yes' : '✅ No'}`);
        console.log(`  ❌ Failed Attempts: ${admin.failedLoginAttempts || 0}`);
        
        if (admin.accountLocked && admin.lockedUntil) {
          const minutesLeft = Math.ceil((admin.lockedUntil - new Date()) / 60000);
          console.log(`  ⏱️  Locked until: ${admin.lockedUntil.toISOString()} (${minutesLeft} minutes left)`);
        }
        
        if (!admin.emailVerified) {
          console.log('\n  ⚠️  ACTION REQUIRED: Email is not verified!');
          console.log('  This admin cannot login until email is verified.');
          console.log('  Run: npm run verify-admin-email\n');
        }
        
        if (admin.accountLocked) {
          console.log('\n  ⚠️  ACTION REQUIRED: Account is locked!');
          console.log('  Wait for the lockout period to expire or run:');
          console.log('  npm run unlock-admin\n');
        }
        
        console.log('');
      }
    }

    // Check all users
    console.log('📊 Total users in database:', await User.countDocuments());
    
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

diagnoseAdminLogin();
