import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function backupUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/substate');
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({}).lean();
    console.log(`📦 Found ${users.length} users to backup`);

    // Create backup directory if it doesn't exist
    const backupDir = 'backups';
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir);
    }

    // Create backup file with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `users-backup-${timestamp}.json`);

    // Write backup file
    fs.writeFileSync(backupFile, JSON.stringify(users, null, 2));

    console.log(`✅ Backup created successfully: ${backupFile}`);
    console.log(`📊 Backed up ${users.length} users`);

    // Show current state distribution
    const currentStats = {
      total: users.length,
      verified: users.filter(u => u.emailVerified).length,
      unverified: users.filter(u => !u.emailVerified).length,
      withSubscription: users.filter(u => u.subscription).length,
      withoutSubscription: users.filter(u => !u.subscription).length,
      trial: users.filter(u => u.subscription === 'TRIAL').length,
      professional: users.filter(u => u.subscription === 'PROFESSIONAL').length,
      enterprise: users.filter(u => u.subscription === 'ENTERPRISE').length,
    };

    console.log('\n📈 Current User Statistics:');
    console.log(`- Total Users: ${currentStats.total}`);
    console.log(`- Email Verified: ${currentStats.verified} (${((currentStats.verified/currentStats.total)*100).toFixed(1)}%)`);
    console.log(`- Email Unverified: ${currentStats.unverified} (${((currentStats.unverified/currentStats.total)*100).toFixed(1)}%)`);
    console.log(`- With Subscription: ${currentStats.withSubscription}`);
    console.log(`- Without Subscription: ${currentStats.withoutSubscription}`);
    
    if (currentStats.withSubscription > 0) {
      console.log('\n📋 Subscription Breakdown:');
      console.log(`- TRIAL: ${currentStats.trial}`);
      console.log(`- PROFESSIONAL: ${currentStats.professional}`);
      console.log(`- ENTERPRISE: ${currentStats.enterprise}`);
    }

    return backupFile;

  } catch (error) {
    console.error('❌ Error creating backup:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run backup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  backupUsers();
}

export default backupUsers;