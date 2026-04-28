import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Campaign from '../backend/models/Campaign.js';
import axios from 'axios';

dotenv.config();

async function testEmailTracking() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🧪 EMAIL TRACKING TEST');
    console.log('='.repeat(70) + '\n');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find an email campaign
    const campaign = await Campaign.findOne({ campaignType: 'EMAIL' }).sort('-createdAt');
    
    if (!campaign) {
      console.log('❌ No email campaigns found. Please create one first.');
      process.exit(1);
    }

    console.log('📧 Testing Campaign:');
    console.log('   ID:', campaign._id);
    console.log('   Title:', campaign.title);
    console.log('   Status:', campaign.status);
    console.log('   Current Opens:', campaign.opensCount || 0);
    console.log('   Current Clicks:', campaign.clicksCount || 0);
    console.log('');

    // Test tracking pixel URL
    const trackingId = `test_${Date.now()}`;
    const baseUrl = process.env.API_URL || 'http://localhost:5000';
    const trackingPixelUrl = `${baseUrl}/api/campaigns/${campaign._id}/track/open/${trackingId}`;
    
    console.log('🔗 Tracking Pixel URL:');
    console.log('   ' + trackingPixelUrl);
    console.log('');

    // Simulate email open by calling the tracking pixel
    console.log('📊 Simulating email open...');
    try {
      const response = await axios.get(trackingPixelUrl, {
        responseType: 'arraybuffer',
        validateStatus: () => true
      });
      
      console.log('   Status:', response.status);
      console.log('   Content-Type:', response.headers['content-type']);
      console.log('');

      // Wait a moment for database to update
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch updated campaign data
      const updatedCampaign = await Campaign.findById(campaign._id);
      
      console.log('📈 Updated Campaign Stats:');
      console.log('   Opens Count:', updatedCampaign.opensCount || 0);
      console.log('   Status:', updatedCampaign.status);
      console.log('');

      if ((updatedCampaign.opensCount || 0) > (campaign.opensCount || 0)) {
        console.log('✅ Email tracking is working correctly!');
        console.log('   Opens increased from', campaign.opensCount || 0, 'to', updatedCampaign.opensCount);
      } else {
        console.log('⚠️ Opens count did not increase. Check server logs for errors.');
      }

    } catch (error) {
      console.error('❌ Error calling tracking pixel:', error.message);
      if (error.code === 'ECONNREFUSED') {
        console.log('\n💡 Make sure your server is running on', baseUrl);
      }
    }

    // Test click tracking URL
    console.log('\n🖱️ Testing Click Tracking...');
    const clickTrackingUrl = `${baseUrl}/api/campaigns/${campaign._id}/track/click/${trackingId}?url=https://example.com`;
    console.log('   URL:', clickTrackingUrl);
    
    try {
      const clickResponse = await axios.get(clickTrackingUrl, {
        maxRedirects: 0,
        validateStatus: () => true
      });
      
      console.log('   Status:', clickResponse.status);
      console.log('   Redirect Location:', clickResponse.headers.location);
      console.log('');

      // Wait a moment for database to update
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Fetch updated campaign data
      const finalCampaign = await Campaign.findById(campaign._id);
      
      console.log('📈 Final Campaign Stats:');
      console.log('   Opens Count:', finalCampaign.opensCount || 0);
      console.log('   Clicks Count:', finalCampaign.clicksCount || 0);
      console.log('   Status:', finalCampaign.status);
      console.log('');

      if ((finalCampaign.clicksCount || 0) > (campaign.clicksCount || 0)) {
        console.log('✅ Click tracking is working correctly!');
        console.log('   Clicks increased from', campaign.clicksCount || 0, 'to', finalCampaign.clicksCount);
      } else {
        console.log('⚠️ Clicks count did not increase. Check server logs for errors.');
      }

    } catch (error) {
      console.error('❌ Error calling click tracking:', error.message);
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Email Tracking Test Complete');
    console.log('='.repeat(70) + '\n');

    console.log('💡 Next Steps:');
    console.log('   1. Check your campaign dashboard to see if the data updated');
    console.log('   2. The dashboard auto-refreshes every 30 seconds for EMAIL campaigns');
    console.log('   3. You can also click the "Refresh" button to update immediately');
    console.log('   4. Make sure API_URL is set correctly in your .env file');
    console.log('');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

testEmailTracking();
