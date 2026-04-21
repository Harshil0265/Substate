import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Protected users - NEVER suspend, block, or lock these accounts
const PROTECTED_USERS = [
  'barotashokbhai03044@gmail.com', // Admin user
  'barotharshil070@gmail.com'      // Active user
];

// Realistic distribution percentages for 500+ users
const STATE_DISTRIBUTION = {
  // Subscription Plans
  TRIAL: 0.45,        // 45% - Most new users start with trial
  PROFESSIONAL: 0.40, // 40% - Main paid tier
  ENTERPRISE: 0.15,   // 15% - Premium tier
  
  // Account Status (within each subscription)
  ACTIVE: 0.75,       // 75% - Most users are active
  EXPIRED: 0.12,      // 12% - Some expired subscriptions
  CANCELLED: 0.08,    // 8% - Some cancelled
  SUSPENDED: 0.03,    // 3% - Few suspended for violations
  LOCKED: 0.02,       // 2% - Very few locked accounts
};

// Risk factors for determining problematic users
const RISK_FACTORS = {
  HIGH_ARTICLE_COUNT: 200,    // Users with too many articles might be spammy
  LOW_ACTIVITY: 60,           // Days since last login
  HIGH_CAMPAIGN_COUNT: 50,    // Too many campaigns
  UNVERIFIED_OLD: 30,         // Unverified for more than 30 days
};

async function migrateExistingUsersToStates() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/substate');
    console.log('Connected to MongoDB');

    // Get all existing users
    const allUsers = await User.find({}).sort({ createdAt: 1 }); // Oldest first
    const totalUsers = allUsers.length;
    
    console.log(`\n📊 Found ${totalUsers} existing users to migrate`);
    
    if (totalUsers === 0) {
      console.log('No users found to migrate');
      return;
    }

    // Calculate distribution numbers
    const trialCount = Math.floor(totalUsers * STATE_DISTRIBUTION.TRIAL);
    const professionalCount = Math.floor(totalUsers * STATE_DISTRIBUTION.PROFESSIONAL);
    const enterpriseCount = totalUsers - trialCount - professionalCount;

    console.log(`\n📈 Target Distribution:`);
    console.log(`- TRIAL: ${trialCount} users (${(trialCount/totalUsers*100).toFixed(1)}%)`);
    console.log(`- PROFESSIONAL: ${professionalCount} users (${(professionalCount/totalUsers*100).toFixed(1)}%)`);
    console.log(`- ENTERPRISE: ${enterpriseCount} users (${(enterpriseCount/totalUsers*100).toFixed(1)}%)`);

    let updatedCount = 0;
    let stateStats = {
      'TRIAL/ACTIVE': 0, 'TRIAL/EXPIRED': 0, 'TRIAL/CANCELLED': 0, 'TRIAL/SUSPENDED': 0, 'TRIAL/LOCKED': 0,
      'PROFESSIONAL/ACTIVE': 0, 'PROFESSIONAL/EXPIRED': 0, 'PROFESSIONAL/CANCELLED': 0, 'PROFESSIONAL/SUSPENDED': 0, 'PROFESSIONAL/LOCKED': 0,
      'ENTERPRISE/ACTIVE': 0, 'ENTERPRISE/EXPIRED': 0, 'ENTERPRISE/CANCELLED': 0, 'ENTERPRISE/SUSPENDED': 0, 'ENTERPRISE/LOCKED': 0
    };

    // Helper function to calculate risk score
    const calculateRiskScore = (user) => {
      let risk = 0;
      const daysSinceLastLogin = user.lastLogin ? 
        (Date.now() - new Date(user.lastLogin).getTime()) / (1000 * 60 * 60 * 24) : 999;
      const daysSinceCreated = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);

      // High article count risk
      if (user.articleCount > RISK_FACTORS.HIGH_ARTICLE_COUNT) risk += 30;
      
      // Inactive user risk
      if (daysSinceLastLogin > RISK_FACTORS.LOW_ACTIVITY) risk += 25;
      
      // High campaign count risk
      if (user.campaignCount > RISK_FACTORS.HIGH_CAMPAIGN_COUNT) risk += 20;
      
      // Unverified old account risk
      if (!user.emailVerified && daysSinceCreated > RISK_FACTORS.UNVERIFIED_OLD) risk += 35;
      
      // Existing violation count
      if (user.violationCount > 0) risk += user.violationCount * 15;

      return Math.min(risk, 100);
    };

    // Helper function to determine subscription status based on risk and patterns
    const determineSubscriptionStatus = (user, subscription, userIndex, totalInGroup) => {
      // PROTECTION: Never suspend/lock protected users
      if (PROTECTED_USERS.includes(user.email.toLowerCase())) {
        console.log(`🛡️  Protected user: ${user.email} - ensuring ACTIVE status`);
        return 'ACTIVE';
      }

      const riskScore = calculateRiskScore(user);
      const daysSinceCreated = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      const daysSinceLastLogin = user.lastLogin ? 
        (Date.now() - new Date(user.lastLogin).getTime()) / (1000 * 60 * 60 * 24) : 999;

      // High risk users are more likely to be locked/suspended (but not protected users)
      if (riskScore > 80) {
        return Math.random() < 0.7 ? 'LOCKED' : 'SUSPENDED';
      }
      
      if (riskScore > 60) {
        return Math.random() < 0.4 ? 'SUSPENDED' : (Math.random() < 0.3 ? 'EXPIRED' : 'ACTIVE');
      }

      // Old inactive accounts are likely expired or cancelled
      if (daysSinceLastLogin > 90) {
        return Math.random() < 0.6 ? 'EXPIRED' : 'CANCELLED';
      }

      if (daysSinceLastLogin > 45) {
        return Math.random() < 0.3 ? 'EXPIRED' : (Math.random() < 0.2 ? 'CANCELLED' : 'ACTIVE');
      }

      // For trial users, some should be expired (trial period over)
      if (subscription === 'TRIAL' && daysSinceCreated > 14) {
        if (Math.random() < 0.3) return 'EXPIRED';
      }

      // Distribute remaining users according to percentages
      const position = userIndex / totalInGroup;
      
      if (position < STATE_DISTRIBUTION.ACTIVE) return 'ACTIVE';
      if (position < STATE_DISTRIBUTION.ACTIVE + STATE_DISTRIBUTION.EXPIRED) return 'EXPIRED';
      if (position < STATE_DISTRIBUTION.ACTIVE + STATE_DISTRIBUTION.EXPIRED + STATE_DISTRIBUTION.CANCELLED) return 'CANCELLED';
      if (position < STATE_DISTRIBUTION.ACTIVE + STATE_DISTRIBUTION.EXPIRED + STATE_DISTRIBUTION.CANCELLED + STATE_DISTRIBUTION.SUSPENDED) return 'SUSPENDED';
      
      return 'LOCKED';
    };

    // Helper function to set subscription dates
    const setSubscriptionDates = (user, subscription, status) => {
      const now = new Date();
      let startDate, endDate;

      if (subscription === 'TRIAL') {
        // Trial started when user was created, lasts 14 days
        startDate = user.createdAt;
        endDate = new Date(user.createdAt.getTime() + 14 * 24 * 60 * 60 * 1000);
      } else {
        // Paid subscriptions - vary the start dates
        const daysAgo = Math.floor(Math.random() * 365) + 30; // 30-395 days ago
        startDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        
        if (subscription === 'PROFESSIONAL') {
          endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
        } else { // ENTERPRISE
          endDate = new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year
        }
      }

      // Adjust end date based on status
      if (status === 'EXPIRED') {
        // Make sure it's actually expired
        endDate = new Date(now.getTime() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000); // Expired 1-60 days ago
      } else if (status === 'CANCELLED') {
        // Cancelled but might still have time left
        if (Math.random() < 0.5) {
          endDate = new Date(now.getTime() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000); // Some expired
        }
        // Others still have time but cancelled
      }

      return { startDate, endDate };
    };

    // Separate protected users and admin users
    const adminUsers = allUsers.filter(user => user.role === 'ADMIN');
    const protectedUsers = allUsers.filter(user => 
      PROTECTED_USERS.includes(user.email.toLowerCase()) && user.role !== 'ADMIN'
    );
    const regularUsers = allUsers.filter(user => 
      !PROTECTED_USERS.includes(user.email.toLowerCase()) && user.role !== 'ADMIN'
    );

    console.log(`\n👑 Found ${adminUsers.length} admin users (above subscription system):`);
    adminUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.name}) - ADMIN ROLE`);
    });

    console.log(`\n🛡️  Found ${protectedUsers.length} protected users:`);
    protectedUsers.forEach(user => {
      console.log(`   - ${user.email} (${user.name})`);
    });

    // First, handle admin users - they don't need subscriptions, just ensure they're active
    for (const user of adminUsers) {
      // Admin users don't get subscription assignments - they're above the system
      await User.findByIdAndUpdate(user._id, {
        // Keep existing subscription or set to null - admins don't need it
        subscriptionStatus: 'ACTIVE', // Always active
        riskScore: 0, // Admin users have no risk
        accountLocked: false,
        lockReason: null,
        lockedUntil: null,
        emailVerified: true, // Ensure admin users are verified
        violationCount: 0 // No violations for admin users
      });

      updatedCount++;
      console.log(`👑 Admin user ${user.email} - unlimited access (no subscription needed)`);
    }

    // Handle the specific admin user if they're not already marked as ADMIN role
    const specificAdminUser = allUsers.find(user => user.email.toLowerCase() === 'barotashokbhai03044@gmail.com');
    if (specificAdminUser && specificAdminUser.role !== 'ADMIN') {
      // Update them to ADMIN role
      await User.findByIdAndUpdate(specificAdminUser._id, {
        role: 'ADMIN',
        subscriptionStatus: 'ACTIVE',
        riskScore: 0,
        accountLocked: false,
        lockReason: null,
        lockedUntil: null,
        emailVerified: true,
        violationCount: 0
      });
      
      updatedCount++;
      console.log(`👑 Updated ${specificAdminUser.email} to ADMIN role - unlimited access`);
      
      // Remove from other arrays to avoid double processing
      const index = protectedUsers.findIndex(u => u.email.toLowerCase() === 'barotashokbhai03044@gmail.com');
      if (index > -1) protectedUsers.splice(index, 1);
      
      const regIndex = regularUsers.findIndex(u => u.email.toLowerCase() === 'barotashokbhai03044@gmail.com');
      if (regIndex > -1) regularUsers.splice(regIndex, 1);
    }

    // First, handle protected users - give them appropriate subscriptions and ACTIVE status
    for (const user of protectedUsers) {
      let subscription, subscriptionStatus;
      
      if (user.email.toLowerCase() === 'barotashokbhai03044@gmail.com') {
        // Admin user gets ADMIN subscription (unlimited access)
        subscription = 'ADMIN';
        subscriptionStatus = 'ACTIVE';
      } else {
        // Other protected users get PROFESSIONAL
        subscription = 'PROFESSIONAL';
        subscriptionStatus = 'ACTIVE';
      }

      // Set subscription dates for protected users
      const { startDate, endDate } = setSubscriptionDates(user, subscription, subscriptionStatus);

      // Ensure protected users have low risk scores and are verified
      await User.findByIdAndUpdate(user._id, {
        subscription,
        subscriptionStatus,
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
        riskScore: 0, // Protected users have no risk
        accountLocked: false,
        lockReason: null,
        lockedUntil: null,
        emailVerified: true, // Ensure protected users are verified
        violationCount: 0 // No violations for protected users
      });

      stateStats[`${subscription}/${subscriptionStatus}`]++;
      updatedCount++;
      console.log(`🛡️  Protected user ${user.email} assigned: ${subscription}/${subscriptionStatus}`);
    }

    // Adjust counts for remaining users (excluding admins and protected users)
    const remainingUsers = totalUsers - adminUsers.length - protectedUsers.length;
    const adjustedTrialCount = Math.floor(remainingUsers * STATE_DISTRIBUTION.TRIAL);
    const adjustedProfessionalCount = Math.floor(remainingUsers * STATE_DISTRIBUTION.PROFESSIONAL);
    const adjustedEnterpriseCount = remainingUsers - adjustedTrialCount - adjustedProfessionalCount;

    // Shuffle regular users for random distribution
    const shuffledUsers = [...regularUsers].sort(() => Math.random() - 0.5);

    // Now assign subscription plans to regular users
    for (let i = 0; i < shuffledUsers.length; i++) {
      const user = shuffledUsers[i];
      let subscription, subscriptionStatus;

      // Determine subscription plan for regular users
      if (i < adjustedTrialCount) {
        subscription = 'TRIAL';
      } else if (i < adjustedTrialCount + adjustedProfessionalCount) {
        subscription = 'PROFESSIONAL';
      } else {
        subscription = 'ENTERPRISE';
      }

      // Determine subscription status
      const groupStart = subscription === 'TRIAL' ? 0 : 
                        subscription === 'PROFESSIONAL' ? adjustedTrialCount : 
                        adjustedTrialCount + adjustedProfessionalCount;
      const groupSize = subscription === 'TRIAL' ? adjustedTrialCount :
                       subscription === 'PROFESSIONAL' ? adjustedProfessionalCount :
                       adjustedEnterpriseCount;
      const indexInGroup = i - groupStart;

      subscriptionStatus = determineSubscriptionStatus(user, subscription, indexInGroup, groupSize);

      // Set subscription dates
      const { startDate, endDate } = setSubscriptionDates(user, subscription, subscriptionStatus);

      // Calculate and update risk score
      const riskScore = calculateRiskScore(user);

      // Set account locked status
      const accountLocked = subscriptionStatus === 'LOCKED';
      const lockReason = accountLocked ? 
        (riskScore > 80 ? 'Multiple policy violations detected' :
         riskScore > 60 ? 'Suspicious activity pattern' :
         'Security review required') : null;
      const lockedUntil = accountLocked ? 
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null; // 1 year

      // Update user
      await User.findByIdAndUpdate(user._id, {
        subscription,
        subscriptionStatus,
        subscriptionStartDate: startDate,
        subscriptionEndDate: endDate,
        riskScore,
        accountLocked,
        lockReason,
        lockedUntil,
        // Ensure some users are unverified for realistic data
        emailVerified: user.emailVerified !== false ? 
          (Math.random() < 0.85 ? true : false) : false, // 85% verified
        // Update violation count for high-risk users
        violationCount: riskScore > 70 ? Math.floor(riskScore / 20) : user.violationCount || 0
      });

      // Track statistics
      const stateKey = `${subscription}/${subscriptionStatus}`;
      stateStats[stateKey]++;
      updatedCount++;

      // Progress indicator
      if (updatedCount % 50 === 0) {
        console.log(`📝 Updated ${updatedCount}/${totalUsers} users...`);
      }
    }

    console.log(`\n✅ Successfully migrated ${updatedCount} users!`);
    console.log('\n📊 Final Distribution:');
    
    Object.entries(stateStats).forEach(([state, count]) => {
      if (count > 0) {
        const percentage = ((count / totalUsers) * 100).toFixed(1);
        console.log(`- ${state}: ${count} users (${percentage}%)`);
      }
    });

    // Summary by subscription
    console.log('\n📈 Summary by Subscription:');
    const trialTotal = Object.entries(stateStats)
      .filter(([key]) => key.startsWith('TRIAL/'))
      .reduce((sum, [, count]) => sum + count, 0);
    const proTotal = Object.entries(stateStats)
      .filter(([key]) => key.startsWith('PROFESSIONAL/'))
      .reduce((sum, [, count]) => sum + count, 0);
    const entTotal = Object.entries(stateStats)
      .filter(([key]) => key.startsWith('ENTERPRISE/'))
      .reduce((sum, [, count]) => sum + count, 0);

    console.log(`- TRIAL: ${trialTotal} users`);
    console.log(`- PROFESSIONAL: ${proTotal} users`);
    console.log(`- ENTERPRISE: ${entTotal} users`);

    // Summary by status
    console.log('\n📋 Summary by Status:');
    const activeTotal = Object.entries(stateStats)
      .filter(([key]) => key.endsWith('/ACTIVE'))
      .reduce((sum, [, count]) => sum + count, 0);
    const expiredTotal = Object.entries(stateStats)
      .filter(([key]) => key.endsWith('/EXPIRED'))
      .reduce((sum, [, count]) => sum + count, 0);
    const cancelledTotal = Object.entries(stateStats)
      .filter(([key]) => key.endsWith('/CANCELLED'))
      .reduce((sum, [, count]) => sum + count, 0);
    const suspendedTotal = Object.entries(stateStats)
      .filter(([key]) => key.endsWith('/SUSPENDED'))
      .reduce((sum, [, count]) => sum + count, 0);
    const lockedTotal = Object.entries(stateStats)
      .filter(([key]) => key.endsWith('/LOCKED'))
      .reduce((sum, [, count]) => sum + count, 0);

    console.log(`- ACTIVE: ${activeTotal} users (${((activeTotal/totalUsers)*100).toFixed(1)}%)`);
    console.log(`- EXPIRED: ${expiredTotal} users (${((expiredTotal/totalUsers)*100).toFixed(1)}%)`);
    console.log(`- CANCELLED: ${cancelledTotal} users (${((cancelledTotal/totalUsers)*100).toFixed(1)}%)`);
    console.log(`- SUSPENDED: ${suspendedTotal} users (${((suspendedTotal/totalUsers)*100).toFixed(1)}%)`);
    console.log(`- LOCKED: ${lockedTotal} users (${((lockedTotal/totalUsers)*100).toFixed(1)}%)`);

    console.log('\n🎯 Migration completed successfully!');
    console.log('Your existing user base now has realistic state distributions.');

  } catch (error) {
    console.error('❌ Error migrating users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the migration
migrateExistingUsersToStates();