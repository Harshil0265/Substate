import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import RiskScore from '../backend/models/RiskScore.js';
import dotenv from 'dotenv';

dotenv.config();

// Helper function to generate random data
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Sample data
const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Mary', 
  'William', 'Patricia', 'Richard', 'Jennifer', 'Thomas', 'Linda', 'Charles', 'Barbara', 'Daniel', 'Susan',
  'Matthew', 'Jessica', 'Anthony', 'Karen', 'Mark', 'Nancy', 'Donald', 'Betty', 'Steven', 'Helen',
  'Paul', 'Sandra', 'Andrew', 'Donna', 'Joshua', 'Carol', 'Kenneth', 'Ruth', 'Kevin', 'Sharon',
  'Brian', 'Michelle', 'George', 'Laura', 'Edward', 'Sarah', 'Ronald', 'Kimberly', 'Timothy', 'Deborah'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
  'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
  'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'company.com', 'business.io', 'tech.co', 'startup.com'];

const subscriptionPlans = ['TRIAL', 'BASIC', 'PRO', 'ENTERPRISE'];
const subscriptionStatuses = ['ACTIVE', 'EXPIRED', 'CANCELLED', 'SUSPENDED'];
const roles = ['USER', 'ADMIN'];
const riskTrends = ['INCREASING', 'DECREASING', 'STABLE'];

// Generate user data
const generateUser = (index) => {
  const firstName = getRandomElement(firstNames);
  const lastName = getRandomElement(lastNames);
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${getRandomElement(domains)}`;
  const name = `${firstName} ${lastName}`;
  
  // 90% users, 10% admins
  const role = Math.random() < 0.9 ? 'USER' : 'ADMIN';
  
  // 85% verified, 15% unverified
  const emailVerified = Math.random() < 0.85;
  
  // Subscription distribution: 40% TRIAL, 30% BASIC, 20% PRO, 10% ENTERPRISE
  const rand = Math.random();
  let subscription;
  if (rand < 0.4) subscription = 'TRIAL';
  else if (rand < 0.7) subscription = 'BASIC';
  else if (rand < 0.9) subscription = 'PRO';
  else subscription = 'ENTERPRISE';
  
  // Status distribution: 70% ACTIVE, 15% EXPIRED, 10% CANCELLED, 5% SUSPENDED
  const statusRand = Math.random();
  let subscriptionStatus;
  if (statusRand < 0.7) subscriptionStatus = 'ACTIVE';
  else if (statusRand < 0.85) subscriptionStatus = 'EXPIRED';
  else if (statusRand < 0.95) subscriptionStatus = 'CANCELLED';
  else subscriptionStatus = 'SUSPENDED';
  
  // Generate dates
  const createdAt = getRandomDate(new Date('2024-01-01'), new Date('2026-04-18'));
  const subscriptionStartDate = new Date(createdAt.getTime() + getRandomNumber(0, 7) * 24 * 60 * 60 * 1000);
  
  // Calculate subscription end date based on plan
  let daysToAdd;
  if (subscription === 'TRIAL') daysToAdd = 14;
  else daysToAdd = 30; // Monthly for paid plans
  
  const subscriptionEndDate = new Date(subscriptionStartDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
  
  // Last login (80% logged in recently, 20% inactive)
  const lastLogin = Math.random() < 0.8 
    ? getRandomDate(new Date('2026-04-01'), new Date('2026-04-18'))
    : getRandomDate(createdAt, new Date('2026-03-01'));
  
  return {
    email,
    password: 'Password123!', // Will be hashed by the model
    name,
    role,
    emailVerified,
    verifiedAt: emailVerified ? new Date(createdAt.getTime() + getRandomNumber(1, 60) * 60 * 1000) : null,
    subscription,
    subscriptionStatus,
    subscriptionStartDate,
    subscriptionEndDate,
    lastLogin,
    lastActivityDate: lastLogin,
    articleCount: getRandomNumber(0, 50),
    campaignCount: getRandomNumber(0, 20),
    riskScore: getRandomNumber(0, 100),
    failedLoginAttempts: 0,
    accountLocked: false,
    createdAt
  };
};

// Generate risk score data
const generateRiskScore = (userId, userRiskScore) => {
  return {
    userId,
    overallRiskScore: userRiskScore,
    paymentRisk: getRandomNumber(0, 100),
    behaviorRisk: getRandomNumber(0, 100),
    accountAgeRisk: getRandomNumber(0, 100),
    activityRisk: getRandomNumber(0, 100),
    riskFactors: [
      'Multiple failed login attempts',
      'Unusual activity pattern',
      'High transaction volume'
    ].slice(0, getRandomNumber(0, 3)),
    riskTrend: getRandomElement(riskTrends),
    lastCalculated: new Date()
  };
};

const generateUsers = async () => {
  try {
    console.log('\n🚀 SUBSTATE User Data Generator\n');
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Clear existing data (optional - comment out if you want to keep existing users)
    console.log('⚠️  Clearing existing users and risk scores...');
    await User.deleteMany({});
    await RiskScore.deleteMany({});
    console.log('✅ Cleared existing data\n');

    console.log('📝 Generating 500 users...\n');
    
    const users = [];
    const riskScores = [];
    
    // Generate users in batches for better performance
    const batchSize = 50;
    const totalUsers = 500;
    
    for (let i = 0; i < totalUsers; i++) {
      const userData = generateUser(i + 1);
      users.push(userData);
      
      // Insert batch
      if (users.length === batchSize || i === totalUsers - 1) {
        const insertedUsers = await User.insertMany(users);
        
        // Generate risk scores for inserted users
        for (const user of insertedUsers) {
          riskScores.push(generateRiskScore(user._id, user.riskScore));
        }
        
        console.log(`✅ Created ${i + 1}/${totalUsers} users`);
        users.length = 0; // Clear array
      }
    }
    
    // Insert all risk scores
    console.log('\n📊 Creating risk score records...');
    await RiskScore.insertMany(riskScores);
    console.log('✅ Created risk scores\n');

    // Generate statistics
    const stats = {
      total: await User.countDocuments(),
      verified: await User.countDocuments({ emailVerified: true }),
      unverified: await User.countDocuments({ emailVerified: false }),
      admins: await User.countDocuments({ role: 'ADMIN' }),
      users: await User.countDocuments({ role: 'USER' }),
      trial: await User.countDocuments({ subscription: 'TRIAL' }),
      basic: await User.countDocuments({ subscription: 'BASIC' }),
      pro: await User.countDocuments({ subscription: 'PRO' }),
      enterprise: await User.countDocuments({ subscription: 'ENTERPRISE' }),
      active: await User.countDocuments({ subscriptionStatus: 'ACTIVE' }),
      expired: await User.countDocuments({ subscriptionStatus: 'EXPIRED' }),
      cancelled: await User.countDocuments({ subscriptionStatus: 'CANCELLED' }),
      suspended: await User.countDocuments({ subscriptionStatus: 'SUSPENDED' })
    };

    console.log('📊 Generation Complete! Statistics:\n');
    console.log('═══════════════════════════════════════');
    console.log(`Total Users:           ${stats.total}`);
    console.log(`├─ Verified:           ${stats.verified}`);
    console.log(`└─ Unverified:         ${stats.unverified}`);
    console.log('');
    console.log('Roles:');
    console.log(`├─ Users:              ${stats.users}`);
    console.log(`└─ Admins:             ${stats.admins}`);
    console.log('');
    console.log('Subscriptions:');
    console.log(`├─ Trial:              ${stats.trial}`);
    console.log(`├─ Basic:              ${stats.basic}`);
    console.log(`├─ Pro:                ${stats.pro}`);
    console.log(`└─ Enterprise:         ${stats.enterprise}`);
    console.log('');
    console.log('Status:');
    console.log(`├─ Active:             ${stats.active}`);
    console.log(`├─ Expired:            ${stats.expired}`);
    console.log(`├─ Cancelled:          ${stats.cancelled}`);
    console.log(`└─ Suspended:          ${stats.suspended}`);
    console.log('═══════════════════════════════════════\n');

    console.log('🔐 Default Password: Password123!\n');
    console.log('💡 Sample Login Credentials:');
    const sampleUsers = await User.find({ emailVerified: true }).limit(5);
    sampleUsers.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   Name: ${user.name}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Subscription: ${user.subscription}`);
      console.log('');
    });

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

generateUsers();
