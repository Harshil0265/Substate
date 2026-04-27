import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Campaign from '../backend/models/Campaign.js';

dotenv.config();

const deleteInvalidCampaign = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find campaigns with invalid targetAudience values
    console.log('🔍 Searching for campaigns with invalid targetAudience...');
    const invalidCampaigns = await Campaign.find({
      targetAudience: { $in: ['PREMIUM', 'BASIC', 'ENTERPRISE'] }
    }).lean();

    if (invalidCampaigns.length === 0) {
      console.log('✅ No campaigns found with invalid targetAudience values');
      process.exit(0);
    }

    console.log(`\n📋 Found ${invalidCampaigns.length} campaign(s) with invalid targetAudience:\n`);
    
    invalidCampaigns.forEach((campaign, index) => {
      console.log(`${index + 1}. Campaign: "${campaign.title}"`);
      console.log(`   ID: ${campaign._id}`);
      console.log(`   Target Audience: ${campaign.targetAudience}`);
      console.log(`   Type: ${campaign.campaignType}`);
      console.log(`   Status: ${campaign.status}`);
      console.log(`   Created: ${campaign.createdAt}`);
      console.log('');
    });

    // Delete all invalid campaigns
    console.log('🗑️  Deleting campaigns with invalid targetAudience...');
    const result = await Campaign.deleteMany({
      targetAudience: { $in: ['PREMIUM', 'BASIC', 'ENTERPRISE'] }
    });

    console.log(`✅ Successfully deleted ${result.deletedCount} campaign(s)\n`);

    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

deleteInvalidCampaign();
