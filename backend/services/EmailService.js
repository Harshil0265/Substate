import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
  }

  initialize() {
    if (this.transporter) return; // Already initialized
    
    console.log('📧 Initializing Email Service...');
    console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE);
    console.log('EMAIL_USER:', process.env.EMAIL_USER ? '✓ Set' : '✗ Not set');
    console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '✓ Set' : '✗ Not set');
    
    // Create transporter based on environment
    if (process.env.EMAIL_SERVICE === 'gmail') {
      console.log('✅ Configuring Gmail service...');
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD // Use App Password for Gmail
        }
      });
      console.log('✅ Gmail transporter created successfully!');
    } else if (process.env.SMTP_HOST) {
      // Custom SMTP configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD
        }
      });
    } else {
      // Development mode - log to console
      console.log('⚠️  Email service not configured. Emails will be logged to console.');
      this.transporter = null;
    }
  }

  async sendOTP(email, otp, name = 'User') {
    this.initialize(); // Ensure transporter is initialized
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SUBSTATE <noreply@substate.com>',
      to: email,
      subject: 'Verify Your Email - SUBSTATE',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #3B82F6 0%, #A78BFA 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .otp-box { background: #f8f9fa; border: 2px dashed #3B82F6; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0; }
            .otp-code { font-size: 36px; font-weight: bold; color: #3B82F6; letter-spacing: 8px; font-family: 'Courier New', monospace; }
            .info { color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; color: #856404; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .button { display: inline-block; background: #3B82F6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Email Verification</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px; color: #333;">Hi ${name},</p>
              <p class="info">Thank you for registering with SUBSTATE! To complete your registration and secure your account, please verify your email address using the OTP code below:</p>
              
              <div class="otp-box">
                <div style="color: #666; font-size: 12px; margin-bottom: 10px;">YOUR VERIFICATION CODE</div>
                <div class="otp-code">${otp}</div>
              </div>
              
              <p class="info">This code will expire in <strong>10 minutes</strong>. If you didn't request this code, please ignore this email.</p>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong> Never share this code with anyone. SUBSTATE will never ask for your verification code via phone or email.
              </div>
              
              <p class="info">If you have any questions or need assistance, please contact our support team.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} SUBSTATE - Revenue Intelligence Platform</p>
              <p>This is an automated email. Please do not reply.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${name},

Your SUBSTATE verification code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

© ${new Date().getFullYear()} SUBSTATE
      `
    };

    try {
      if (this.transporter) {
        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ OTP email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
      } else {
        // Development mode - log to console
        console.log('\n📧 ===== EMAIL (Development Mode) =====');
        console.log('To:', email);
        console.log('Subject:', mailOptions.subject);
        console.log('OTP Code:', otp);
        console.log('=====================================\n');
        return { success: true, dev: true };
      }
    } catch (error) {
      console.error('❌ Email send error:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendWelcomeEmail(email, name) {
    this.initialize(); // Ensure transporter is initialized
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SUBSTATE <noreply@substate.com>',
      to: email,
      subject: 'Welcome to SUBSTATE! 🎉',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Inter', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #10B981 0%, #3B82F6 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 40px 30px; }
            .feature { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to SUBSTATE!</h1>
            </div>
            <div class="content">
              <p style="font-size: 16px; color: #333;">Hi ${name},</p>
              <p>Your account has been successfully verified! You now have full access to SUBSTATE's powerful features:</p>
              
              <div class="feature">
                <strong>📊 Revenue Intelligence</strong><br>
                Track and predict customer churn with AI-powered analytics
              </div>
              
              <div class="feature">
                <strong>🎯 Campaign Automation</strong><br>
                Create and manage automated marketing campaigns
              </div>
              
              <div class="feature">
                <strong>📝 Content Generation</strong><br>
                Generate high-quality articles with AI assistance
              </div>
              
              <p>You're currently on a <strong>14-day free trial</strong>. Explore all features and see how SUBSTATE can transform your business!</p>
              
              <p style="margin-top: 30px;">Ready to get started? Log in to your dashboard and begin your journey.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} SUBSTATE - Revenue Intelligence Platform</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      if (this.transporter) {
        await this.transporter.sendMail(mailOptions);
        console.log('✅ Welcome email sent to:', email);
      } else {
        console.log('📧 Welcome email (dev mode) for:', email);
      }
    } catch (error) {
      console.error('❌ Welcome email error:', error);
      // Don't throw - welcome email is not critical
    }
  }
}

export default new EmailService();
