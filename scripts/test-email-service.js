import dotenv from 'dotenv';
import EmailService from '../backend/services/EmailService.js';

// Load environment variables
dotenv.config();

async function testEmailService() {
  console.log('🧪 Testing Email Service...\n');
  
  // Display configuration
  console.log('📧 Email Configuration:');
  console.log('   Service:', process.env.EMAIL_SERVICE);
  console.log('   User:', process.env.EMAIL_USER);
  console.log('   Password:', process.env.EMAIL_PASSWORD ? '✓ Set (length: ' + process.env.EMAIL_PASSWORD.length + ')' : '✗ Not set');
  console.log('   From:', process.env.EMAIL_FROM);
  console.log('');

  try {
    // Test 1: Send a simple test email
    console.log('📤 Sending test email...');
    
    const testEmail = process.env.EMAIL_USER; // Send to yourself
    
    await EmailService.sendEmail({
      from: process.env.EMAIL_FROM,
      to: testEmail,
      subject: '🧪 SUBSTATE Email Service Test',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-box { background: #d1fae5; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 5px; }
            .info { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">✅ Email Service Test</h1>
              <p style="margin: 10px 0 0 0;">SUBSTATE Platform</p>
            </div>
            <div class="content">
              <div class="success-box">
                <strong>🎉 Success!</strong> Your email service is working perfectly!
              </div>
              
              <div class="info">
                <h3 style="margin-top: 0;">Test Details:</h3>
                <ul>
                  <li><strong>Service:</strong> ${process.env.EMAIL_SERVICE}</li>
                  <li><strong>From:</strong> ${process.env.EMAIL_FROM}</li>
                  <li><strong>To:</strong> ${testEmail}</li>
                  <li><strong>Time:</strong> ${new Date().toLocaleString()}</li>
                </ul>
              </div>
              
              <p>This test email confirms that:</p>
              <ul>
                <li>✅ Email credentials are valid</li>
                <li>✅ SMTP connection is working</li>
                <li>✅ Email service can send messages</li>
                <li>✅ HTML formatting is supported</li>
              </ul>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                If you received this email, your SUBSTATE email service is configured correctly and ready to use!
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
SUBSTATE Email Service Test

Success! Your email service is working perfectly!

Test Details:
- Service: ${process.env.EMAIL_SERVICE}
- From: ${process.env.EMAIL_FROM}
- To: ${testEmail}
- Time: ${new Date().toLocaleString()}

This test email confirms that:
✅ Email credentials are valid
✅ SMTP connection is working
✅ Email service can send messages
✅ HTML formatting is supported

If you received this email, your SUBSTATE email service is configured correctly and ready to use!
      `
    });
    
    console.log('✅ Test email sent successfully!');
    console.log('📬 Check your inbox:', testEmail);
    console.log('');
    console.log('🎉 Email service is working perfectly!');
    
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    console.error('');
    console.error('🔍 Troubleshooting tips:');
    console.error('   1. Verify EMAIL_USER and EMAIL_PASSWORD in .env file');
    console.error('   2. For Gmail, make sure you are using an App Password (not your regular password)');
    console.error('   3. Enable "Less secure app access" or use App Passwords in Gmail settings');
    console.error('   4. Check if 2-factor authentication is enabled (requires App Password)');
    console.error('');
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the test
testEmailService();
