// Quick test to verify email endpoint without needing server restart
import axios from 'axios';

const testEmail = async () => {
  try {
    // First, test if the server is responding
    console.log('🔍 Testing server health...');
    const healthResponse = await axios.get('http://localhost:5000/api/campaigns/health');
    console.log('✅ Server is running:', healthResponse.data);
    console.log('');
    
    // Now test with a simple request (no auth to see the error)
    console.log('🔍 Testing email endpoint (without auth)...');
    try {
      await axios.post('http://localhost:5000/api/campaigns/send-test-email', {
        to: 'test@example.com',
        subject: 'Test',
        content: 'Test content'
      });
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Endpoint exists! (Got 401 Unauthorized as expected)');
        console.log('   This means the route is working, just needs authentication');
      } else if (error.response?.status === 404) {
        console.log('❌ Endpoint NOT FOUND (404)');
        console.log('   The route might not be registered properly');
      } else {
        console.log('⚠️  Got unexpected status:', error.response?.status);
        console.log('   Response:', error.response?.data);
      }
    }
    
  } catch (error) {
    console.error('❌ Server is not responding');
    console.error('   Make sure the server is running: npm run dev');
    console.error('   Error:', error.message);
  }
};

testEmail();
