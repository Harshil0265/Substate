import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
  console.log('🧪 Testing MongoDB Atlas connection...');
  console.log('📱 Mobile hotspot connection detected');
  
  const testMethods = [
    { uri: process.env.MONGODB_URI, name: 'SRV Connection (Primary)' },
    { uri: process.env.MONGODB_URI_ALT, name: 'Direct Hosts (Mobile Hotspot Friendly)' }
  ];
  
  for (const method of testMethods) {
    if (!method.uri) continue;
    
    try {
      console.log(`\n🔄 Testing ${method.name}...`);
      
      await mongoose.connect(method.uri, {
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 30000,
        connectTimeoutMS: 10000,
        family: 4, // Force IPv4
      });
      
      console.log('✅ Connection successful!');
      
      // Test database operations
      console.log('🧪 Testing database operations...');
      const testCollection = mongoose.connection.db.collection('test');
      await testCollection.insertOne({ test: 'connection', timestamp: new Date() });
      console.log('✅ Write operation successful!');
      
      const result = await testCollection.findOne({ test: 'connection' });
      console.log('✅ Read operation successful!');
      
      await testCollection.deleteOne({ test: 'connection' });
      console.log('✅ Delete operation successful!');
      
      console.log(`\n🎉 ${method.name} works perfectly!`);
      await mongoose.disconnect();
      process.exit(0);
      
    } catch (error) {
      console.error(`❌ ${method.name} failed:`, error.message);
      await mongoose.disconnect();
    }
  }
  
  console.log('\n❌ All connection methods failed!');
  console.log('\n🔧 Mobile hotspot troubleshooting:');
  console.log('1. Go to MongoDB Atlas Dashboard → Network Access');
  console.log('2. Add 0.0.0.0/0 to IP whitelist (allows all IPs)');
  console.log('3. Try switching to WiFi if available');
  console.log('4. Some mobile carriers block MongoDB ports (27017)');
  console.log('5. Contact your mobile carrier about port restrictions');
  
  process.exit(1);
};

testConnection();