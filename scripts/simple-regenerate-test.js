import axios from 'axios';

console.log('🧪 Simple Regenerate Endpoint Test');
console.log('='.repeat(40));

async function testEndpoint() {
  try {
    // Test if server is running
    const healthResponse = await axios.get('http://localhost:5000/api/users/me', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    console.log('Server response:', healthResponse.status);
  } catch (error) {
    if (error.response) {
      console.log('✅ Server is running (got expected auth error)');
      console.log('   Status:', error.response.status);
      console.log('   Error:', error.response.data);
      
      if (error.response.status === 401) {
        console.log('✅ Authentication middleware is working');
        return true;
      }
    } else {
      console.log('❌ Server is not running or not accessible');
      console.log('   Error:', error.message);
      return false;
    }
  }
}

testEndpoint()
  .then(success => {
    if (success) {
      console.log('\n✅ Server is accessible and auth middleware is working');
      console.log('The issue is likely in the regeneration logic itself.');
      console.log('Check server logs for detailed error information.');
    } else {
      console.log('\n❌ Server connectivity issue');
    }
  })
  .catch(error => {
    console.error('❌ Test failed:', error.message);
  });