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

const createAdmin = async () => {
  try {
    console.log('\n🔧 SUBSTATE Admin User Creator\n');
    console.log('This script will help you create an admin user or upgrade an existing user to admin.\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const choice = await question('Choose an option:\n1. Create new admin user\n2. Upgrade existing user to admin\n\nEnter choice (1 or 2): ');

    if (choice === '1') {
      // Create new admin user
      console.log('\n📝 Creating new admin user...\n');
      
      const name = await question('Enter admin name: ');
      const email = await question('Enter admin email: ');
      const password = await question('Enter admin password: ');

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        console.log('\n❌ Error: A user with this email already exists!');
        console.log('Use option 2 to upgrade them to admin instead.\n');
        rl.close();
        await mongoose.disconnect();
        return;
      }

      // Create admin user
      const adminUser = new User({
        email: email.toLowerCase(),
        password: password,
        name: name,
        role: 'ADMIN',
        emailVerified: true,
        verifiedAt: new Date(),
        subscription: 'TRIAL',
        subscriptionStatus: 'ACTIVE',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      });

      await adminUser.save();

      console.log('\n✅ Admin user created successfully!\n');
      console.log('📧 Email:', email);
      console.log('👤 Name:', name);
      console.log('🔑 Role: ADMIN');
      console.log('✉️  Email Verified: Yes\n');
      console.log('You can now login at: http://localhost:5173/login\n');

    } else if (choice === '2') {
      // Upgrade existing user
      console.log('\n📝 Upgrading existing user to admin...\n');
      
      const email = await question('Enter user email to upgrade: ');

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        console.log('\n❌ Error: User not found with email:', email);
        console.log('Please check the email and try again.\n');
        rl.close();
        await mongoose.disconnect();
        return;
      }

      if (user.role === 'ADMIN') {
        console.log('\n⚠️  This user is already an admin!\n');
        rl.close();
        await mongoose.disconnect();
        return;
      }

      // Upgrade to admin
      user.role = 'ADMIN';
      await user.save();

      console.log('\n✅ User upgraded to admin successfully!\n');
      console.log('📧 Email:', user.email);
      console.log('👤 Name:', user.name);
      console.log('🔑 Role: ADMIN');
      console.log('✉️  Email Verified:', user.emailVerified ? 'Yes' : 'No\n');
      
      if (!user.emailVerified) {
        console.log('⚠️  Note: This user has not verified their email yet.');
        console.log('They need to verify their email before they can login.\n');
      } else {
        console.log('You can now login at: http://localhost:5173/login\n');
      }

    } else {
      console.log('\n❌ Invalid choice. Please run the script again.\n');
    }

    rl.close();
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    rl.close();
    await mongoose.disconnect();
    process.exit(1);
  }
};

createAdmin();
