import https from 'https';

const getPublicIP = () => {
  return new Promise((resolve, reject) => {
    https.get('https://api.ipify.org?format=json', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result.ip);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
};

const main = async () => {
  try {
    console.log('🔍 Getting your current public IP address...');
    const ip = await getPublicIP();
    console.log(`📍 Your current IP: ${ip}`);
    console.log('\n📋 Steps to whitelist this IP in MongoDB Atlas:');
    console.log('1. Go to https://cloud.mongodb.com/');
    console.log('2. Select your project');
    console.log('3. Click "Network Access" in the left sidebar');
    console.log('4. Click "Add IP Address"');
    console.log(`5. Add this IP: ${ip}`);
    console.log('6. Click "Confirm"');
    console.log('\n💡 Or for testing, you can add 0.0.0.0/0 to allow all IPs');
  } catch (error) {
    console.error('❌ Failed to get IP:', error.message);
    console.log('\n🔧 Alternative: Go to https://whatismyipaddress.com/ to find your IP');
  }
};

main();