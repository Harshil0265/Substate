import EmailService from '../backend/services/EmailService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testEmail() {
  console.log('🧪 Testing Email Service...\n');
  
  // Test email address - CHANGE THIS TO YOUR EMAIL
  const testEmail = 'your-email@gmail.com'; // ⚠️ CHANGE THIS!
  const testName = 'Test User';
  const testOTP = '123456';
  
  console.log(`📧 Sending test email to: ${testEmail}`);
  console.log(`📝 Test OTP: ${testOTP}\n`);
  
  try {
    const result = await EmailService.sendOTP(testEmail, testOTP, testName);
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('📬 Check your inbox for the email with SUBSTATE logo\n');
      
      if (result.dev) {
        console.log('⚠️  Running in development mode - email logged to console');
      } else {
        console.log(`📨 Message ID: ${result.messageId}`);
      }
    }
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
  }
  
  process.exit(0);
}

testEmail();
