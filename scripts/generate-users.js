import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Helper functions
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Sample data
const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Mary', 
  'William', 'Patricia', 'Richard', 'Jennifer', 'Thomas', 'Linda', 'Charles', 'Barbara', 'Daniel', 'Susan'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'];

const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'business.io'];

// Subscription scenarios for management with grace periods and lifecycle stages
const subscriptionScenarios = [
  // TRIAL scenarios (30% of users)
  { 
    name: 'Trial - Day 1 (Just Started)',
    subscription: 'TRIAL',
    subscriptionStatus: 'ACTIVE',
    daysFromStart: 1,
    weight: 4
  },
  { 
    name: 'Trial - Day 3 (Early Stage)',
    subscription: 'TRIAL',
    subscriptionStatus: 'ACTIVE',
    daysFromStart: 3,
    weight: 5
  },
  { 
    name: 'Trial - Day 7 (Mid Period)',
    subscription: 'TRIAL',
    subscriptionStatus: 'ACTIVE',
    daysFromStart: 7,
    weight: 6
  },
  { 
    name: 'Trial - Day 11 (3 days left - Send Upgrade Reminder)',
    subscription: 'TRIAL',
    subscriptionStatus: 'ACTIVE',
    daysFromStart: 11,
    weight: 8
  },
  { 
    name: 'Trial - Day 13 (Last Day - Urgent)',
    subscription: 'TRIAL',
    subscriptionStatus: 'ACTIVE',
    daysFromStart: 13,
    weight: 5
  },
  { 
    name: 'Trial - Expired (Grace Period Day 1)',
    subscription: 'TRIAL',
    subscriptionStatus: 'EXPIRED',
    daysFromStart: 15,
    gracePeriod: true,
    weight: 4
  },
  { 
    name: 'Trial - Expired (Grace Period Day 3 - Final Warning)',
    subscription: 'TRIAL',
    subscriptionStatus: 'EXPIRED',
    daysFromStart: 17,
    gracePeriod: true,
    weight: 3
  },
  
  // BASIC scenarios (25% of users)
  { 
    name: 'Basic - Active (Week 1)',
    subscription: 'BASIC',
    subscriptionStatus: 'ACTIVE',
    daysFromStart: 7,
    weight: 8
  },
  { 
    name: 'Basic - Active (Week 2)',
    subscription: 'BASIC',
    subscriptionStatus: 'ACTIVE',
    daysFromStart: 14,
    weight: 7
  },
  { 
    name: 'Basic - Active (Week 3)',
    subscription: 'BASIC',
    subscriptionStatus: 'ACTIVE',
    daysFromStart: 21,
    weight: 6
  },
  { 
    name: 'Basic - Renewal in 7 days',
    subscription: 'BASIC',
    subscriptionStatus: 'ACTIVE',
    daysFromStart: 23,
    weight: 5
  },
  { 
    name: 'Basic - Renewal in 3 days (Send Reminder)',
    subscription: 'BASIC',
    subscriptionStatus: 'ACTIVE',
    daysFromStart: 27,
    weight: 4
  },
  { 
    name: 'Basic - Payment Failed (Retry 1)',
    subscription: 'BASIC',
    subscriptionStatus: 'SUSPENDED',
    daysFromStart: 31,
    paymentRetry: 1,
    weight: 3
  },
  { 
    name: 'Basic - Payment Failed (Retry 2 - Grace Period)',
    subscription: 'BASIC',
    subscriptionStatus: 'SUSPENDED',
    daysFromStart: 33,
    paymentRetry: 2,
    gracePeriod: true,
    weight: 2
  },
  { 
    name: 'Basic - Expired (Grace Period - 3 days)',
    subscription: 'BASIC',
    subscriptionStatus: 'EXPIRED',
    daysFromStart: 32,
    gracePeriod: true,
    weight: 3
  },
  { 
    name: 'Basic - Cancelled (End of Period)',
    subscription: 'BASIC',
    subscriptionStatus: 'CANCELLED',
    daysFromStart: 25,
    weight: 2
  },
  
  // PRO scenarios (25% of users)
  { 
    name: 'Pro - Active (Week 1)',
    subscription: 'PRO',
    subscriptionStatus: 'ACTIVE',
    daysFromStart: 7,
    weight: 9
  },
  { 
    name: 'Pro - Active (Week 2)',
    subscription: 'PRO',
    subscriptionStatus: 'ACTIVE',
    daysFromStart: 14,
    weight: 8
  },
  { 
    name: 'Pro - Active (Week 3)',
    subscription: 'PRO',
    subscriptionStatus: 'ACTIVE',
    daysFromStart: 21,
    weight: 7
  },
  { 
    name: 'Pro - Renewal in 5 days',
    subscription: 'PRO',
    subscriptionStatus: 'ACTIVE',
    daysFromStart: 25,
    weight: 5
  },
  { 
    name: 'Pro - Renewal Tomorrow (Critical)',
    subscription: 'PRO',
    subscriptionStatus: 'ACTIVE',
    daysFromStart: 29,
    weight: 4
  },
  { 
    name: 'Pro - Payment Failed (Retry 1 - Grace Period)',
    subscription: 'PRO',
    subscriptionStatus: 'SUSPENDED',
    daysFromStart: 31,
    paymentRetry: 1,
    gracePeriod: true,
    weight: 3
  },
  { 
    name: 'Pro - Payment Failed (Retry 2 - Final Attempt)',
    subscription: 'PRO',
    subscriptionStatus: 'SUSPENDED',
    daysFromStart: 34,
    paymentRetry: 2,
    gracePeriod: true,
    weight: 2
  },
  { 
    name: 'Pro - Expired (Grace Period)',
    subscription: 'PRO',
    subscriptionStatus: 'EXPIRED',
    daysFromStart: 35,
    gracePeriod: true,
    weight: 2
  },
  { 
    name: 'Pro - Downgraded to Basic',
    subscription: 'PRO',
    subscriptionStatus: 'CANCELLED',
    daysFromStart: 28,
    weight: 1
  },
  
  // ENTERPRISE scenarios (20% of users)
  { 
    name: 'Enterprise - Active (Week 1)',
    subscription: 'ENTERPRISE',
    subscriptionStatus: 'ACTIVE',
    daysFromStart: 7,
    weight: 10
  },
  { 
    name: 'Enterprise - Active (Week 2)',
    subscription: 'ENTERPRISE',
    subscriptionStatus: 'ACTIVE',
    daysFromStart: 14,
    weight: 9
  },
  { 
    name: 'Enterprise - Active (Week 3)',
    subscription: 'ENTERPRISE',
    subscriptionStatus: 'ACTIVE',
    daysFromStart: 21,
    weight: 8
  },
  { 
    name: 'Enterprise - Renewal in 7 days (Account Manager Alert)',
    subscription: 'ENTERPRISE',
    subscriptionStatus: 'ACTIVE',
    daysFromStart: 23,
    weight: 5
  },
  { 
    name: 'Enterprise - Renewal in 2 days (Priority)',
    subscription: 'ENTERPRISE',
    subscriptionStatus: 'ACTIVE',
    daysFromStart: 28,
    weight: 3
  },
  { 
    name: 'Enterprise - Payment Issue (Grace Period - 7 days)',
    subscription: 'ENTERPRISE',
    subscriptionStatus: 'SUSPENDED',
    daysFromStart: 32,
    paymentRetry: 1,
    gracePeriod: true,
    weight: 2
  },
  { 
    name: 'Enterprise - Cancelled (Churn Risk)',
    subscription: 'ENTERPRISE',
    subscriptionStatus: 'CANCELLED',
    daysFromStart: 25,
    weight: 1
  }
];

// Calculate total weight
const totalWeight = subscriptionScenarios.reduce((sum, scenario) => sum + scenario.weight, 0);

// Get scenario based on weighted distribution
const getScenario = () => {
  let random = Math.random() * totalWeight;
  for (const scenario of subscriptionScenarios) {
    random -= scenario.weight;
    if (random <= 0) return scenario;
  }
  return subscriptionScenarios[0];
};

// Generate user based on subscription scenario
const generateUser = (index) => {
  const firstName = getRandomElement(firstNames);
  const lastName = getRandomElement(lastNames);
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${getRandomElement(domains)}`;
  const name = `${firstName} ${lastName}`;
  
  // Get subscription scenario
  const scenario = getScenario();
  
  // Calculate dates based on scenario
  const now = new Date('2026-04-18T22:39:00');
  const subscriptionStartDate = new Date(now);
  subscriptionStartDate.setDate(subscriptionStartDate.getDate() - scenario.daysFromStart);
  
  // Calculate end date based on subscription type
  let subscriptionDuration;
  if (scenario.subscription === 'TRIAL') {
    subscriptionDuration = 14; // 14 days trial
  } else {
    subscriptionDuration = 30; // 30 days for paid plans
  }
  
  const subscriptionEndDate = new Date(subscriptionStartDate);
  subscriptionEndDate.setDate(subscriptionEndDate.getDate() + subscriptionDuration);
  
  // Calculate days remaining
  const daysRemaining = Math.ceil((subscriptionEndDate - now) / (1000 * 60 * 60 * 24));
  
  // Set activity based on subscription status
  let articleCount, campaignCount, lastLogin;
  
  if (scenario.subscriptionStatus === 'ACTIVE') {
    articleCount = getRandomNumber(5, 50);
    campaignCount = getRandomNumber(2, 20);
    lastLogin = new Date(now.getTime() - getRandomNumber(0, 2) * 24 * 60 * 60 * 1000); // Last 2 days
  } else if (scenario.subscriptionStatus === 'EXPIRED') {
    articleCount = getRandomNumber(0, 20);
    campaignCount = getRandomNumber(0, 10);
    lastLogin = new Date(now.getTime() - getRandomNumber(3, 10) * 24 * 60 * 60 * 1000); // 3-10 days ago
  } else if (scenario.subscriptionStatus === 'SUSPENDED') {
    articleCount = getRandomNumber(10, 40);
    campaignCount = getRandomNumber(5, 15);
    lastLogin = new Date(now.getTime() - getRandomNumber(1, 5) * 24 * 60 * 60 * 1000); // 1-5 days ago
  } else { // CANCELLED
    articleCount = getRandomNumber(0, 15);
    campaignCount = getRandomNumber(0, 8);
    lastLogin = new Date(now.getTime() - getRandomNumber(5, 15) * 24 * 60 * 60 * 1000); // 5-15 days ago
  }
  
  // Calculate risk score based on scenario
  let riskScore;
  if (scenario.gracePeriod) {
    riskScore = getRandomNumber(70, 95); // High risk in grace period
  } else if (scenario.paymentRetry) {
    riskScore = getRandomNumber(60, 85); // Medium-high risk on payment retry
  } else if (scenario.subscriptionStatus === 'ACTIVE' && daysRemaining <= 3) {
    riskScore = getRandomNumber(40, 60); // Medium risk near expiry
  } else if (scenario.subscriptionStatus === 'ACTIVE') {
    riskScore = getRandomNumber(0, 30); // Low risk for active users
  } else {
    riskScore = getRandomNumber(50, 90); // High risk for expired/cancelled
  }
  
  return {
    email,
    password: 'Password123!',
    name,
    role: 'USER',
    emailVerified: true,
    verifiedAt: subscriptionStartDate,
    subscription: scenario.subscription,
    subscriptionStatus: scenario.subscriptionStatus,
    subscriptionStartDate,
    subscriptionEndDate,
    lastLogin,
    lastActivityDate: lastLogin,
    articleCount,
    campaignCount,
    riskScore,
    failedLoginAttempts: scenario.paymentRetry || 0,
    accountLocked: false,
    createdAt: subscriptionStartDate,
    _scenario: scenario.name,
    _daysRemaining: daysRemaining,
    _gracePeriod: scenario.gracePeriod || false,
    _paymentRetry: scenario.paymentRetry || 0
  };
};

const generateUsers = async () => {
  try {
    console.log('\n🎯 SUBSTATE Subscription Management User Generator\n');
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('⚠️  Clearing existing users...');
    await User.deleteMany({});
    console.log('✅ Cleared existing data\n');

    console.log('📝 Generating 500 users for subscription management...\n');
    
    const users = [];
    const scenarioCounts = {};
    
    for (let i = 0; i < 500; i++) {
      const userData = generateUser(i + 1);
      
      // Track scenario distribution
      scenarioCounts[userData._scenario] = (scenarioCounts[userData._scenario] || 0) + 1;
      
      // Remove temporary fields
      const { _scenario, _daysRemaining, _gracePeriod, _paymentRetry, ...cleanUserData } = userData;
      users.push(cleanUserData);
      
      if ((i + 1) % 50 === 0) {
        console.log(`✅ Generated ${i + 1}/500 users`);
      }
    }
    
    // Insert all users
    await User.insertMany(users);
    console.log('\n✅ All users created!\n');

    // Generate statistics
    const stats = {
      total: await User.countDocuments(),
      trial: await User.countDocuments({ subscription: 'TRIAL' }),
      basic: await User.countDocuments({ subscription: 'BASIC' }),
      pro: await User.countDocuments({ subscription: 'PRO' }),
      enterprise: await User.countDocuments({ subscription: 'ENTERPRISE' }),
      active: await User.countDocuments({ subscriptionStatus: 'ACTIVE' }),
      expired: await User.countDocuments({ subscriptionStatus: 'EXPIRED' }),
      cancelled: await User.countDocuments({ subscriptionStatus: 'CANCELLED' }),
      suspended: await User.countDocuments({ subscriptionStatus: 'SUSPENDED' })
    };

    console.log('📊 Subscription Management Statistics:\n');
    console.log('═══════════════════════════════════════════════════');
    console.log(`Total Users:                    ${stats.total}`);
    console.log('');
    console.log('Subscription Plans:');
    console.log(`├─ Trial:                       ${stats.trial} (${Math.round(stats.trial/stats.total*100)}%)`);
    console.log(`├─ Basic:                       ${stats.basic} (${Math.round(stats.basic/stats.total*100)}%)`);
    console.log(`├─ Pro:                         ${stats.pro} (${Math.round(stats.pro/stats.total*100)}%)`);
    console.log(`└─ Enterprise:                  ${stats.enterprise} (${Math.round(stats.enterprise/stats.total*100)}%)`);
    console.log('');
    console.log('Subscription Status:');
    console.log(`├─ Active:                      ${stats.active} (${Math.round(stats.active/stats.total*100)}%)`);
    console.log(`├─ Expired (needs renewal):     ${stats.expired} (${Math.round(stats.expired/stats.total*100)}%)`);
    console.log(`├─ Suspended (payment failed):  ${stats.suspended} (${Math.round(stats.suspended/stats.total*100)}%)`);
    console.log(`└─ Cancelled:                   ${stats.cancelled} (${Math.round(stats.cancelled/stats.total*100)}%)`);
    console.log('');
    console.log('Scenario Distribution:');
    Object.entries(scenarioCounts)
      .sort((a, b) => b[1] - a[1])
      .forEach(([scenario, count]) => {
        console.log(`├─ ${scenario.padEnd(35)} ${count} users`);
      });
    console.log('═══════════════════════════════════════════════════\n');

    console.log('🔐 Default Password: Password123!\n');
    
    // Show users needing attention
    console.log('⚠️  Users Requiring Immediate Admin Action:\n');
    
    console.log('🔴 CRITICAL - Grace Period (About to Lose Access):');
    const gracePeriod = await User.find({ 
      subscriptionStatus: { $in: ['EXPIRED', 'SUSPENDED'] },
      riskScore: { $gte: 70 }
    }).limit(5);
    gracePeriod.forEach(user => {
      const daysExpired = Math.ceil((new Date('2026-04-18') - user.subscriptionEndDate) / (1000 * 60 * 60 * 24));
      console.log(`  • ${user.email}`);
      console.log(`    ${user.subscription} - ${user.subscriptionStatus} - ${daysExpired} days past due`);
    });
    
    console.log('\n🟡 HIGH PRIORITY - Trial Ending Soon:');
    const trialExpiring = await User.find({ 
      subscription: 'TRIAL', 
      subscriptionStatus: 'ACTIVE',
      subscriptionEndDate: { $lte: new Date(new Date('2026-04-18').getTime() + 3 * 24 * 60 * 60 * 1000) }
    }).limit(5);
    trialExpiring.forEach(user => {
      const daysLeft = Math.ceil((user.subscriptionEndDate - new Date('2026-04-18')) / (1000 * 60 * 60 * 24));
      console.log(`  • ${user.email} - ${daysLeft} day(s) left`);
    });
    
    console.log('\n🟠 MEDIUM - Payment Retry Needed:');
    const suspended = await User.find({ 
      subscriptionStatus: 'SUSPENDED',
      failedLoginAttempts: { $gt: 0 }
    }).limit(5);
    suspended.forEach(user => {
      console.log(`  • ${user.email}`);
      console.log(`    ${user.subscription} - Retry #${user.failedLoginAttempts}`);
    });
    
    console.log('\n🔵 RENEWAL REMINDERS - Expiring in 7 Days:');
    const renewalSoon = await User.find({ 
      subscriptionStatus: 'ACTIVE',
      subscription: { $ne: 'TRIAL' },
      subscriptionEndDate: { 
        $gte: new Date('2026-04-18'),
        $lte: new Date(new Date('2026-04-18').getTime() + 7 * 24 * 60 * 60 * 1000) 
      }
    }).limit(5);
    renewalSoon.forEach(user => {
      const daysLeft = Math.ceil((user.subscriptionEndDate - new Date('2026-04-18')) / (1000 * 60 * 60 * 24));
      console.log(`  • ${user.email} - ${user.subscription} - ${daysLeft} day(s) until renewal`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

generateUsers();
