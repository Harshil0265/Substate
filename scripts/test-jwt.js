import dotenv from 'dotenv';
import TokenService from '../backend/services/TokenService.js';

dotenv.config();

const testJWT = () => {
  console.log('🧪 Testing JWT Integration');
  console.log('==========================');
  
  // Check if JWT_SECRET is set
  if (!process.env.JWT_SECRET) {
    console.log('❌ JWT_SECRET not found in environment variables');
    return;
  }
  
  if (process.env.JWT_SECRET === 'your-secret-key-here-change-in-production') {
    console.log('⚠️  You are still using the default JWT_SECRET');
    console.log('   Run: pnpm run generate-jwt to create a secure secret');
    return;
  }
  
  console.log('✅ JWT_SECRET is configured');
  console.log(`   Length: ${process.env.JWT_SECRET.length} characters`);
  
  // Test token generation and verification
  try {
    const testPayload = {
      userId: '507f1f77bcf86cd799439011',
      email: 'test@example.com'
    };
    
    console.log('\n🔄 Testing token generation...');
    
    // Test access token
    const accessToken = TokenService.generateAccessToken(testPayload);
    console.log('✅ Access token generated successfully');
    console.log(`   Expires in: ${process.env.JWT_ACCESS_TOKEN_EXPIRY || '15m'}`);
    
    // Test refresh token
    const refreshToken = TokenService.generateRefreshToken(testPayload);
    console.log('✅ Refresh token generated successfully');
    console.log(`   Expires in: ${process.env.JWT_REFRESH_TOKEN_EXPIRY || '7d'}`);
    
    // Test token verification
    console.log('\n🔄 Testing token verification...');
    const decoded = TokenService.verifyToken(accessToken);
    console.log('✅ Token verification successful');
    console.log(`   User ID: ${decoded.userId}`);
    console.log(`   Email: ${decoded.email}`);
    
    // Test token expiration check
    const isExpired = TokenService.isTokenExpired(accessToken);
    console.log(`✅ Token expiration check: ${isExpired ? 'Expired' : 'Valid'}`);
    
    // Test token pair generation
    console.log('\n🔄 Testing token pair generation...');
    const tokenPair = TokenService.generateTokenPair(testPayload, false);
    console.log('✅ Token pair generated successfully');
    console.log(`   Access token type: ${tokenPair.tokenType}`);
    console.log(`   Expires in: ${tokenPair.expiresIn}`);
    
    console.log('\n🎉 All JWT tests passed! Your JWT integration is working perfectly.');
    
  } catch (error) {
    console.log('\n❌ JWT test failed:', error.message);
    console.log('   Check your JWT_SECRET and configuration');
  }
};

testJWT();