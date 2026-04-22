import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

async function testUsageAPI() {
  try {
    console.log('🧪 Testing Usage API for barotharshil070@gmail.com\n');

    const API_URL = process.env.VITE_API_URL || 'http://localhost:5000';
    
    // First, login to get token
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'barotharshil070@gmail.com',
      password: 'Harshil@123' // You'll need to provide the actual password
    });

    const token = loginResponse.data.token;
    console.log('✅ Login successful\n');

    // Test usage endpoint
    console.log('2️⃣ Fetching usage data from API...');
    const usageResponse = await axios.get(`${API_URL}/api/users/usage/current`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📊 Usage API Response:');
    console.log('===================');
    console.log(JSON.stringify(usageResponse.data, null, 2));
    console.log();

    // Test can create campaign endpoint
    console.log('3️⃣ Testing can-create-campaign endpoint...');
    const canCreateResponse = await axios.get(`${API_URL}/api/users/usage/can-create-campaign`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Can Create Campaign Response:');
    console.log('===================');
    console.log(JSON.stringify(canCreateResponse.data, null, 2));
    console.log();

    console.log('✅ All API tests completed!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testUsageAPI();
