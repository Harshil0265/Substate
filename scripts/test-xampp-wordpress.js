import axios from 'axios';

async function testXAMPPWordPress() {
  console.log('\n🔍 TESTING XAMPP WORDPRESS CONNECTION\n');
  
  try {
    // Test if XAMPP Apache is running
    console.log('1️⃣ Testing XAMPP Apache...');
    const response = await axios.get('http://localhost/wordpress', {
      timeout: 5000,
      validateStatus: () => true // Accept any status
    });
    
    if (response.status === 200) {
      console.log('✅ XAMPP Apache is running');
      console.log('✅ WordPress is accessible at http://localhost/wordpress');
    } else {
      console.log(`⚠️ WordPress responded with status: ${response.status}`);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ XAMPP Apache is NOT running');
      console.log('💡 Start XAMPP Control Panel and start Apache');
    } else {
      console.log(`❌ Error: ${error.message}`);
    }
  }
  
  console.log('\n📋 FOR AUTOMATION TO WORK:');
  console.log('   🖥️ Keep XAMPP running (Apache + MySQL)');
  console.log('   🚀 Keep SUBSTATE running (npm start)');
  console.log('   ⏰ Both must be running at scheduled times');
  console.log('');
  console.log('💡 ALTERNATIVE: Use cloud WordPress for 24/7 automation');
  console.log('');
}

testXAMPPWordPress();