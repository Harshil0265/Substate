import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/User.js';
import Payment from '../backend/models/Payment.js';

dotenv.config();

const migrateSubscriptionPlans = async () => {
  try {
    console.log('🔄 Starting subscription plan migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 15000,
      maxPoolSize: 10,
      family: 4,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Migration mappings
    const planMigrations = {
      'BASIC': 'PROFESSIONAL',
      'PRO': 'PROFESSIONAL',
      'STARTER': 'PROFESSIONAL'
    };
    
    // Update Users collection
    console.log('\n📊 Analyzing current user subscriptions...');
    
    const userStats = await User.aggregate([
      {
        $group: {
          _id: '$subscription',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('Current user subscription distribution:');
    userStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} users`);
    });
    
    // Migrate users
    let totalUsersMigrated = 0;
    
    for (const [oldPlan, newPlan] of Object.entries(planMigrations)) {
      const result = await User.updateMany(
        { subscription: oldPlan },
        { 
          $set: { 
            subscription: newPlan,
            updatedAt: new Date()
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Migrated ${result.modifiedCount} users from ${oldPlan} to ${newPlan}`);
        totalUsersMigrated += result.modifiedCount;
      }
    }
    
    // Update Payments collection
    console.log('\n📊 Analyzing current payment plans...');
    
    const paymentStats = await Payment.aggregate([
      {
        $group: {
          _id: '$planType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('Current payment plan distribution:');
    paymentStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} payments`);
    });
    
    // Migrate payments
    let totalPaymentsMigrated = 0;
    
    for (const [oldPlan, newPlan] of Object.entries(planMigrations)) {
      const result = await Payment.updateMany(
        { planType: oldPlan },
        { 
          $set: { 
            planType: newPlan,
            updatedAt: new Date()
          }
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Migrated ${result.modifiedCount} payments from ${oldPlan} to ${newPlan}`);
        totalPaymentsMigrated += result.modifiedCount;
      }
    }
    
    // Show final statistics
    console.log('\n📈 Final subscription distribution:');
    
    const finalUserStats = await User.aggregate([
      {
        $group: {
          _id: '$subscription',
          count: { $sum: 1 }
        }
      }
    ]);
    
    finalUserStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} users`);
    });
    
    const finalPaymentStats = await Payment.aggregate([
      {
        $group: {
          _id: '$planType',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\nFinal payment plan distribution:');
    finalPaymentStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count} payments`);
    });
    
    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - ${totalUsersMigrated} users migrated`);
    console.log(`   - ${totalPaymentsMigrated} payments migrated`);
    console.log(`   - Available plans: TRIAL, PROFESSIONAL, ENTERPRISE`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run migration
migrateSubscriptionPlans();