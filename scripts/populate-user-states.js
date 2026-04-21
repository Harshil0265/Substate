import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../backend/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const sampleUsers = [
  // TRIAL users with ACTIVE status
  {
    name: 'Alice Johnson',
    email: 'alice.johnson@example.com',
    password: 'password123',
    subscription: 'TRIAL',
    subscriptionStatus: 'ACTIVE',
    emailVerified: true,
    company: 'StartupCorp',
    website: 'https://startupcorp.com',
    lastLogin: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    subscriptionStartDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    subscriptionEndDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days from now
  },
  {
    name: 'Bob Smith',
    email: 'bob.smith@example.com',
    password: 'password123',
    subscription: 'TRIAL',
    subscriptionStatus: 'ACTIVE',
    emailVerified: false, // Unverified trial user
    company: 'TechStart',
    lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    subscriptionStartDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    subscriptionEndDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
  },
  
  // PROFESSIONAL users with various statuses
  {
    name: 'Carol Davis',
    email: 'carol.davis@example.com',
    password: 'password123',
    subscription: 'PROFESSIONAL',
    subscriptionStatus: 'ACTIVE',
    emailVerified: true,
    company: 'Marketing Pro',
    website: 'https://marketingpro.com',
    lastLogin: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    subscriptionStartDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    subscriptionEndDate: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000),
    articleCount: 45,
    campaignCount: 8,
  },
  {
    name: 'David Wilson',
    email: 'david.wilson@example.com',
    password: 'password123',
    subscription: 'PROFESSIONAL',
    subscriptionStatus: 'EXPIRED',
    emailVerified: true,
    company: 'Content Kings',
    lastLogin: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    subscriptionStartDate: new Date(Date.now() - 395 * 24 * 60 * 60 * 1000),
    subscriptionEndDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // Expired 10 days ago
    articleCount: 120,
    campaignCount: 25,
  },
  {
    name: 'Eva Martinez',
    email: 'eva.martinez@example.com',
    password: 'password123',
    subscription: 'PROFESSIONAL',
    subscriptionStatus: 'CANCELLED',
    emailVerified: true,
    company: 'Digital Agency',
    website: 'https://digitalagency.com',
    lastLogin: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    subscriptionStartDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
    subscriptionEndDate: new Date(Date.now() + 185 * 24 * 60 * 60 * 1000), // Still has time but cancelled
    articleCount: 78,
    campaignCount: 15,
  },
  {
    name: 'Frank Thompson',
    email: 'frank.thompson@example.com',
    password: 'password123',
    subscription: 'PROFESSIONAL',
    subscriptionStatus: 'SUSPENDED',
    emailVerified: true,
    company: 'Suspended Corp',
    lastLogin: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
    subscriptionStartDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
    subscriptionEndDate: new Date(Date.now() + 275 * 24 * 60 * 60 * 1000),
    articleCount: 32,
    campaignCount: 6,
    violationCount: 2, // Reason for suspension
    riskScore: 75,
  },
  
  // ENTERPRISE users
  {
    name: 'Grace Lee',
    email: 'grace.lee@enterprise.com',
    password: 'password123',
    subscription: 'ENTERPRISE',
    subscriptionStatus: 'ACTIVE',
    emailVerified: true,
    company: 'Enterprise Solutions Inc',
    website: 'https://enterprisesolutions.com',
    lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    subscriptionStartDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    subscriptionEndDate: new Date(Date.now() + 305 * 24 * 60 * 60 * 1000),
    articleCount: 250,
    campaignCount: 45,
  },
  {
    name: 'Henry Brown',
    email: 'henry.brown@bigcorp.com',
    password: 'password123',
    subscription: 'ENTERPRISE',
    subscriptionStatus: 'ACTIVE',
    emailVerified: true,
    company: 'BigCorp Industries',
    website: 'https://bigcorp.com',
    lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    subscriptionStartDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
    subscriptionEndDate: new Date(Date.now() + 245 * 24 * 60 * 60 * 1000),
    articleCount: 180,
    campaignCount: 35,
  },
  
  // LOCKED users (problematic accounts)
  {
    name: 'Ian Problematic',
    email: 'ian.problematic@spam.com',
    password: 'password123',
    subscription: 'PROFESSIONAL',
    subscriptionStatus: 'LOCKED',
    accountLocked: true,
    emailVerified: true,
    company: 'Spam Corp',
    lastLogin: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    subscriptionStartDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
    subscriptionEndDate: new Date(Date.now() + 320 * 24 * 60 * 60 * 1000),
    lockedUntil: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000), // Locked for a year
    lockReason: 'Multiple policy violations - spam content',
    articleCount: 15,
    campaignCount: 3,
    violationCount: 5,
    riskScore: 95,
    failedLoginAttempts: 8,
  },
  {
    name: 'Jane Violator',
    email: 'jane.violator@bad.com',
    password: 'password123',
    subscription: 'TRIAL',
    subscriptionStatus: 'LOCKED',
    accountLocked: true,
    emailVerified: false,
    company: 'Bad Content Co',
    lastLogin: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000), // 25 days ago
    subscriptionStartDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
    subscriptionEndDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Expired
    lockedUntil: new Date(Date.now() + 340 * 24 * 60 * 60 * 1000),
    lockReason: 'Fraudulent activity detected',
    articleCount: 5,
    campaignCount: 1,
    violationCount: 3,
    riskScore: 88,
    failedLoginAttempts: 12,
  },
  
  // More diverse users
  {
    name: 'Kevin Active',
    email: 'kevin.active@good.com',
    password: 'password123',
    subscription: 'TRIAL',
    subscriptionStatus: 'ACTIVE',
    emailVerified: true,
    company: 'Good Content',
    website: 'https://goodcontent.com',
    lastLogin: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    subscriptionStartDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    subscriptionEndDate: new Date(Date.now() + 13 * 24 * 60 * 60 * 1000),
    articleCount: 3,
    campaignCount: 1,
  },
  {
    name: 'Lisa Expired',
    email: 'lisa.expired@old.com',
    password: 'password123',
    subscription: 'ENTERPRISE',
    subscriptionStatus: 'EXPIRED',
    emailVerified: true,
    company: 'Old Enterprise',
    lastLogin: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
    subscriptionStartDate: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000),
    subscriptionEndDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Expired 30 days ago
    articleCount: 300,
    campaignCount: 60,
  }
];

async function populateUserStates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/substate');
    console.log('Connected to MongoDB');

    // Clear existing sample users (optional - be careful in production!)
    const existingEmails = sampleUsers.map(user => user.email);
    await User.deleteMany({ email: { $in: existingEmails } });
    console.log('Cleared existing sample users');

    // Hash passwords and create users
    for (const userData of sampleUsers) {
      const salt = await bcrypt.genSalt(10);
      userData.password = await bcrypt.hash(userData.password, salt);
      
      const user = new User(userData);
      await user.save();
      console.log(`Created user: ${userData.name} (${userData.email}) - ${userData.subscription}/${userData.subscriptionStatus}`);
    }

    console.log('\n✅ Successfully populated database with diverse user states!');
    console.log('\nUser State Summary:');
    console.log('- TRIAL/ACTIVE: 3 users (including 1 unverified)');
    console.log('- PROFESSIONAL/ACTIVE: 1 user');
    console.log('- PROFESSIONAL/EXPIRED: 1 user');
    console.log('- PROFESSIONAL/CANCELLED: 1 user');
    console.log('- PROFESSIONAL/SUSPENDED: 1 user');
    console.log('- ENTERPRISE/ACTIVE: 2 users');
    console.log('- ENTERPRISE/EXPIRED: 1 user');
    console.log('- LOCKED accounts: 2 users (various violations)');
    console.log('\nTotal: 12 sample users with comprehensive state coverage');

  } catch (error) {
    console.error('Error populating user states:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
populateUserStates();