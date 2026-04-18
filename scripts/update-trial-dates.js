import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const updateTrialDates = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Set trial start date to today at 22:39
    const trialStartDate = new Date('2026-04-18T22:39:00');
    
    // Set trial end date to 14 days from start
    const trialEndDate = new Date(trialStartDate);
    trialEndDate.setDate(trialEndDate.getDate() + 14);

    // Update all users with TRIAL subscription
    const result = await User.updateMany(
      { 
        subscription: 'TRIAL',
        $or: [
          { subscriptionStartDate: { $exists: false } },
          { subscriptionEndDate: { $exists: false } }
        ]
      },
      {
        $set: {
          subscriptionStartDate: trialStartDate,
          subscriptionEndDate: trialEndDate,
          subscriptionStatus: 'ACTIVE'
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} users with trial dates`);
    console.log(`Trial starts: ${trialStartDate.toLocaleString('en-GB')}`);
    console.log(`Trial expires: ${trialEndDate.toLocaleString('en-GB')}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error updating trial dates:', error);
    process.exit(1);
  }
};

updateTrialDates();