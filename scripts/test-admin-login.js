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

const testAdminLogin = async () => {
  try {
    console.log('\n🔐 SUBSTATE Admin Login Test\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const email = await question('Enter admin email: ');
    const password = await question('Enter password: ');

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.log('\n❌ User not found with email:', email);
      rl.close();
      await mongoose.disconnect();
      return;
    }

    console.log('\n📋 User Details:');
    console.log('  Email:', user.email);
    console.log('  Name:', user.name);
    console.log('  Role:', user.role);
    console.log('  Email Verified:', user.emailVerified);
    console.log('  Account Locked:', user.accountLocked);

    // Test password
    console.log('\n🔐 Testing password...');
    const isValid = await user.comparePassword(password);

    if (isValid) {
      console.log('✅ Password is CORRECT!');
      console.log('\n✅ Login should work. If it doesn\'t, check:');
      console.log('  1. Frontend is sending correct data');
      console.log('  2. Backend server is running');
      console.log('  3. CORS is configured properly');
      console.log('  4. JWT_SECRET is set in environment');
    } else {
      console.log('❌ Password is INCORRECT!');
      console.log('\n💡 To reset the password, you can:');
      console.log('  1. Create a new admin with: npm run create-admin');
      console.log('  2. Or update the password directly in MongoDB');
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

testAdminLogin();
