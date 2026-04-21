import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkUserStats() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/substate');
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({}).lean();
    const totalUsers = users.length;

    console.log('\n📊 CURRENT USER STATISTICS');
    console.log('==========================');
    console.log(`Total Users: ${totalUsers}`);

    if (totalUsers === 0) {
      console.log('No users found in database');
      return;
    }

    // Basic stats
    const verified = users.filter(u => u.emailVerified).length;
    const unverified = users.filter(u => !u.emailVerified).length;
    const withLastLogin = users.filter(u => u.lastLogin).length;

    console.log(`\n👤 Basic Information:`);
    console.log(`- Email Verified: ${verified} (${((verified/totalUsers)*100).toFixed(1)}%)`);
    console.log(`- Email Unverified: ${unverified} (${((unverified/totalUsers)*100).toFixed(1)}%)`);
    console.log(`- Have Logged In: ${withLastLogin} (${((withLastLogin/totalUsers)*100).toFixed(1)}%)`);

    // Current subscription distribution
    const subscriptionStats = {};
    users.forEach(user => {
      const sub = user.subscription || 'NONE';
      subscriptionStats[sub] = (subscriptionStats[sub] || 0) + 1;
    });

    console.log(`\n📋 Current Subscription Distribution:`);
    Object.entries(subscriptionStats).forEach(([sub, count]) => {
      console.log(`- ${sub}: ${count} (${((count/totalUsers)*100).toFixed(1)}%)`);
    });

    // Current subscription status distribution
    const statusStats = {};
    users.forEach(user => {
      const status = user.subscriptionStatus || 'NONE';
      statusStats[status] = (statusStats[status] || 0) + 1;
    });

    console.log(`\n📈 Current Status Distribution:`);
    Object.entries(statusStats).forEach(([status, count]) => {
      console.log(`- ${status}: ${count} (${((count/totalUsers)*100).toFixed(1)}%)`);
    });

    // Activity analysis
    const now = new Date();
    const activeUsers = users.filter(user => {
      if (!user.lastLogin) return false;
      const daysSinceLogin = (now - new Date(user.lastLogin)) / (1000 * 60 * 60 * 24);
      return daysSinceLogin <= 30;
    }).length;

    const inactiveUsers = users.filter(user => {
      if (!user.lastLogin) return true;
      const daysSinceLogin = (now - new Date(user.lastLogin)) / (1000 * 60 * 60 * 24);
      return daysSinceLogin > 30;
    }).length;

    console.log(`\n🎯 Activity Analysis (Last 30 days):`);
    console.log(`- Active Users: ${activeUsers} (${((activeUsers/totalUsers)*100).toFixed(1)}%)`);
    console.log(`- Inactive Users: ${inactiveUsers} (${((inactiveUsers/totalUsers)*100).toFixed(1)}%)`);

    // Content creation stats
    const withArticles = users.filter(u => u.articleCount > 0).length;
    const withCampaigns = users.filter(u => u.campaignCount > 0).length;
    const totalArticles = users.reduce((sum, u) => sum + (u.articleCount || 0), 0);
    const totalCampaigns = users.reduce((sum, u) => sum + (u.campaignCount || 0), 0);

    console.log(`\n📝 Content Creation:`);
    console.log(`- Users with Articles: ${withArticles} (${((withArticles/totalUsers)*100).toFixed(1)}%)`);
    console.log(`- Users with Campaigns: ${withCampaigns} (${((withCampaigns/totalUsers)*100).toFixed(1)}%)`);
    console.log(`- Total Articles: ${totalArticles}`);
    console.log(`- Total Campaigns: ${totalCampaigns}`);
    console.log(`- Avg Articles per User: ${(totalArticles/totalUsers).toFixed(1)}`);
    console.log(`- Avg Campaigns per User: ${(totalCampaigns/totalUsers).toFixed(1)}`);

    // Risk analysis
    const lockedUsers = users.filter(u => u.accountLocked).length;
    const usersWithViolations = users.filter(u => u.violationCount > 0).length;
    const highRiskUsers = users.filter(u => (u.riskScore || 0) > 50).length;

    console.log(`\n⚠️  Risk Analysis:`);
    console.log(`- Locked Accounts: ${lockedUsers}`);
    console.log(`- Users with Violations: ${usersWithViolations}`);
    console.log(`- High Risk Users (>50 score): ${highRiskUsers}`);

    // Age distribution
    const ageRanges = {
      'New (0-7 days)': 0,
      'Recent (8-30 days)': 0,
      'Established (31-90 days)': 0,
      'Mature (91-365 days)': 0,
      'Veteran (>365 days)': 0
    };

    users.forEach(user => {
      const daysSinceCreated = (now - new Date(user.createdAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceCreated <= 7) ageRanges['New (0-7 days)']++;
      else if (daysSinceCreated <= 30) ageRanges['Recent (8-30 days)']++;
      else if (daysSinceCreated <= 90) ageRanges['Established (31-90 days)']++;
      else if (daysSinceCreated <= 365) ageRanges['Mature (91-365 days)']++;
      else ageRanges['Veteran (>365 days)']++;
    });

    console.log(`\n📅 User Age Distribution:`);
    Object.entries(ageRanges).forEach(([range, count]) => {
      console.log(`- ${range}: ${count} (${((count/totalUsers)*100).toFixed(1)}%)`);
    });

    console.log(`\n✅ Analysis complete! Ready for migration.`);
    console.log(`\n🚀 To migrate your ${totalUsers} users to the new state system:`);
    console.log(`   npm run safe-migrate-users`);

  } catch (error) {
    console.error('❌ Error checking user stats:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the stats check
checkUserStats();