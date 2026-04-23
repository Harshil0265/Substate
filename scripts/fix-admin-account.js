import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

const fixAdminAccount = async () => {
  try {
    console.log('\n🔧 SUBSTATE Admin Account Fix Tool\n');
    console.log('=' .repeat(50));

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const email = await question('Enter admin email to fix: ');
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('\n❌ User not found with email:', email);
      rl.close();
      await mongoose.disconnect();
      return;
    }

    console.log('\n📋 Current Status:');
    console.log('  Email:', user.email);
    console.log('  Name:', user.name);
    console.log('  Role:', user.role);
    console.log('  Email Verified:', user.emailVerified ? '✅ Yes' : '❌ No');
    console.log('  Account Locked:', user.accountLocked ? '❌ Yes' : '✅ No');
    console.log('  Failed Attempts:', user.failedLoginAttempts || 0);

    const fixes = [];

    // Fix 1: Verify email
    if (!user.emailVerified) {
      const verify = await question('\n❌ Email not verified. Verify it now? (y/n): ');
      if (verify.toLowerCase() === 'y') {
        user.emailVerified = true;
        user.verifiedAt = new Date();
        fixes.push('Email verified');
      }
    }

    // Fix 2: Unlock account
    if (user.accountLocked) {
      const unlock = await question('❌ Account is locked. Unlock it now? (y/n): ');
      if (unlock.toLowerCase() === 'y') {
        user.accountLocked = false;
        user.lockedUntil = null;
        user.failedLoginAttempts = 0;
        fixes.push('Account unlocked');
      }
    }

    // Fix 3: Reset failed attempts
    if (user.failedLoginAttempts > 0) {
      const reset = await question(`❌ ${user.failedLoginAttempts} failed login attempts. Reset? (y/n): `);
      if (reset.toLowerCase() === 'y') {
        user.failedLoginAttempts = 0;
        fixes.push('Failed attempts reset');
      }
    }

    if (fixes.length === 0) {
      console.log('\n✅ No fixes needed. Account is in good state!\n');
    } else {
      await user.save();
      console.log('\n✅ Applied fixes:');
      fixes.forEach(fix => console.log(`  ✓ ${fix}`));
      console.log('\n✅ Admin account fixed successfully!');
      console.log('You can now login with this account.\n');
    }

    rl.close();
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    await mongoose.disconnect();
    process.exit(1);
  }
};

fixAdminAccount();
