import crypto from 'crypto';

const generateJWTSecret = () => {
  // Generate a 256-bit (32 bytes) random secret
  const secret = crypto.randomBytes(32).toString('hex');
  
  console.log('🔐 JWT Secret Generation');
  console.log('========================');
  console.log('\n📋 Your new JWT secret:');
  console.log(`JWT_SECRET=${secret}`);
  
  console.log('\n🔧 Steps to integrate:');
  console.log('1. Copy the JWT_SECRET line above');
  console.log('2. Replace the JWT_SECRET in your .env file');
  console.log('3. Restart your server');
  console.log('4. Keep this secret secure and never share it!');
  
  console.log('\n⚠️  Security Notes:');
  console.log('- This secret is used to sign and verify JWT tokens');
  console.log('- Never commit this secret to version control');
  console.log('- Use different secrets for development and production');
  console.log('- Store production secrets in environment variables');
  
  console.log('\n🎯 Secret strength:');
  console.log(`- Length: ${secret.length} characters`);
  console.log('- Entropy: 256 bits (cryptographically secure)');
  console.log('- Format: Hexadecimal');
  
  return secret;
};

// Generate and display the secret
generateJWTSecret();