import dotenv from 'dotenv';
import axios from 'axios';
import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import TokenService from '../backend/services/TokenService.js';

// Load environment variables
dotenv.config();

const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';

async function testEmailEndpoint() {
  console.log('🧪 Testing Email Endpoint...\n');
  
  try {
    // Connect to database
    console.log('📦 Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Database connected\n');
    
    // Find a test user (or use admin)
    const user = await User.findOne({ role: 'admin' }) || await User.findOne();
    
    if (!user) {
      console.error('❌ No users found in database. Please create a user first.');
      process.exit(1);
    }
    
    console.log('👤 Using test user:', user.email);
    console.log('   Name:', user.name);
    console.log('');
    
    // Generate JWT token
    const token = TokenService.generateAccessToken({
      userId: user._id,
      email: user.email
    });
    
    console.log('🔑 JWT token generated');
    console.log('');
    
    // Test the email endpoint
    console.log('📤 Sending test email via API endpoint...');
    console.log('   Endpoint:', `${API_URL}/api/campaigns/send-test-email`);
    console.log('');
    
    const testEmailData = {
      to: user.email, // Send to the test user's email
      subject: 'Test Email from SUBSTATE Campaign',
      content: `
        <h2>Hello ${user.name}!</h2>
        <p>This is a test email from your SUBSTATE campaign system.</p>
        <p>If you're reading this, the email endpoint is working perfectly! 🎉</p>
        <ul>
          <li>✅ API endpoint is accessible</li>
          <li>✅ Authentication is working</li>
          <li>✅ Email service is configured</li>
          <li>✅ Emails are being delivered</li>
        </ul>
        <p>Campaign Title: {{campaign_title}}</p>
        <p>Your email: {{email}}</p>
        <p><strong>Time sent:</strong> ${new Date().toLocaleString()}</p>
      `,
      senderName: 'SUBSTATE Team',
      campaignTitle: 'Email System Test Campaign'
    };
    
    const response = await axios.post(
      `${API_URL}/api/campaigns/send-test-email`,
      testEmailData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ API Response:', response.data);
    console.log('');
    console.log('🎉 Test email sent successfully!');
    console.log('📬 Check inbox:', user.email);
    console.log('');
    console.log('✨ Email endpoint is working perfectly!');
    
  } catch (error) {
    console.error('❌ Test failed!');
    console.error('');
    
    if (error.response) {
      console.error('📡 API Error Response:');
      console.error('   Status:', error.response.status);
      console.error('   Message:', error.response.data?.error || error.response.data?.message);
      console.error('   Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('📡 No response from server');
      console.error('   Make sure the server is running on:', API_URL);
      console.error('   Try running: npm run dev');
    } else {
      console.error('❌ Error:', error.message);
    }
    
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('');
    console.log('📦 Database disconnected');
  }
}

// Run the test
testEmailEndpoint();
