import nodemailer from 'nodemailer';
import { getEmailHeader, getEmailFooter, wrapEmailContent, getBaseEmailStyles, getDiscountCouponEmail } from '../utils/emailTemplates.js';

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
    
    const emailContent = `
      ${getEmailHeader('Email Verification')}
      
      <div class="content">
        <div class="greeting">Hi ${name},</div>
        
        <div class="message">
          Welcome to <strong>SUBSTATE</strong>! To complete your registration and secure your account, please verify your email address using the verification code below.
        </div>
        
        <div style="background: #ffffff; border: 2px solid #f97316; border-radius: 12px; padding: 32px; text-align: center; margin: 32px 0;">
          <div style="color: #6b7280; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 16px;">Your Verification Code</div>
          <div style="font-size: 48px; font-weight: 800; color: #f97316; letter-spacing: 12px; font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;">${otp}</div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 32px 0;">
          <div style="text-align: center; padding: 20px; background: #fafafa; border-radius: 10px; border: 1px solid #e5e7eb;">
            <div style="font-size: 24px; margin-bottom: 8px;">⏰</div>
            <div style="font-weight: 600; color: #111827; margin-bottom: 4px; font-size: 15px;">Valid for 10 minutes</div>
            <div style="font-size: 13px; color: #6b7280;">Code expires automatically</div>
          </div>
          <div style="text-align: center; padding: 20px; background: #fafafa; border-radius: 10px; border: 1px solid #e5e7eb;">
            <div style="font-size: 24px; margin-bottom: 8px;">🔒</div>
            <div style="font-weight: 600; color: #111827; margin-bottom: 4px; font-size: 15px;">Secure & Private</div>
            <div style="font-size: 13px; color: #6b7280;">Never share this code</div>
          </div>
        </div>
        
        <div style="background: #fff7ed; border-left: 4px solid #f97316; border-radius: 8px; padding: 20px; margin: 32px 0; color: #92400e; font-size: 14px; line-height: 1.6;">
          <strong style="color: #78350f;">🛡️ Security Notice:</strong> This verification code is confidential and should never be shared with anyone. SUBSTATE will never ask for your verification code via phone, email, or any other communication method.
        </div>
        
        <div class="message">
          Once verified, you'll have access to our powerful features including AI content generation, campaign automation, and revenue analytics.
        </div>
      </div>
      
      ${getEmailFooter()}
    `;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SUBSTATE <noreply@substate.com>',
      to: email,
      subject: '🔐 Verify Your SUBSTATE Account - OTP Inside',
      html: wrapEmailContent('Verify Your SUBSTATE Account', emailContent),
      text: `
Hi ${name},

Welcome to SUBSTATE! 

Your verification code is: ${otp}

This code will expire in 10 minutes.

Please enter this code to complete your email verification and activate your account.

Security Notice: Never share this code with anyone. SUBSTATE will never ask for your verification code via phone or email.

If you didn't request this verification, please ignore this email.

© ${new Date().getFullYear()} SUBSTATE - Revenue Intelligence Platform
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
    
    const emailContent = `
      ${getEmailHeader('Welcome Aboard!')}
      
      <div class="content">
        <div class="greeting">Hi ${name},</div>
        
        <div class="message">
          🎉 <strong>Congratulations!</strong> Your SUBSTATE account has been successfully verified and activated. You're now part of an exclusive community leveraging AI-powered revenue intelligence and content automation.
        </div>
        
        <div style="background: #fff7ed; border: 2px solid #f97316; border-radius: 12px; padding: 32px; text-align: center; margin: 32px 0;">
          <div style="display: inline-block; background: #f97316; color: white; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.5px;">Free Trial Active</div>
          <div style="font-size: 24px; font-weight: 700; color: #111827; margin-bottom: 12px;">14-Day Premium Access</div>
          <div style="color: #4b5563; font-size: 16px; line-height: 1.6;">
            Explore all our powerful features with no limitations. Create campaigns, generate AI content, and analyze revenue intelligence - completely free!
          </div>
        </div>
        
        <div class="message">
          <strong>Here's what you can do right now:</strong>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 32px 0;">
          <div style="background: #fafafa; border: 1px solid #e5e7eb; border-radius: 10px; padding: 24px; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 12px;">📊</div>
            <div style="font-weight: 600; color: #111827; margin-bottom: 8px; font-size: 16px;">Revenue Intelligence</div>
            <div style="color: #6b7280; font-size: 14px; line-height: 1.5;">Track customer value, predict churn, and optimize revenue streams</div>
          </div>
          
          <div style="background: #fafafa; border: 1px solid #e5e7eb; border-radius: 10px; padding: 24px; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 12px;">🎯</div>
            <div style="font-weight: 600; color: #111827; margin-bottom: 8px; font-size: 16px;">Campaign Automation</div>
            <div style="color: #6b7280; font-size: 14px; line-height: 1.5;">Create and manage automated marketing campaigns</div>
          </div>
          
          <div style="background: #fafafa; border: 1px solid #e5e7eb; border-radius: 10px; padding: 24px; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 12px;">✍️</div>
            <div style="font-weight: 600; color: #111827; margin-bottom: 8px; font-size: 16px;">AI Content Generation</div>
            <div style="color: #6b7280; font-size: 14px; line-height: 1.5;">Generate high-quality articles and marketing content</div>
          </div>
          
          <div style="background: #fafafa; border: 1px solid #e5e7eb; border-radius: 10px; padding: 24px; text-align: center;">
            <div style="font-size: 32px; margin-bottom: 12px;">📈</div>
            <div style="font-weight: 600; color: #111827; margin-bottom: 8px; font-size: 16px;">Analytics Dashboard</div>
            <div style="color: #6b7280; font-size: 14px; line-height: 1.5;">Monitor performance with real-time insights</div>
          </div>
        </div>
        
        <div style="text-align: center; margin: 40px 0;">
          <a href="${process.env.FRONTEND_URL || process.env.VITE_API_URL || 'http://localhost:5173'}/dashboard" style="display: inline-block; background: #f97316; color: white; padding: 16px 32px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);">Access Your Dashboard →</a>
        </div>
        
        <div class="message">
          <strong>Need help getting started?</strong><br>
          Our comprehensive documentation and support team are here to help you maximize your SUBSTATE experience.
        </div>
      </div>
      
      ${getEmailFooter()}
    `;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SUBSTATE <noreply@substate.com>',
      to: email,
      subject: '🎉 Welcome to SUBSTATE - Your Revenue Intelligence Journey Begins!',
      html: wrapEmailContent('Welcome to SUBSTATE', emailContent)
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

  async sendUpgradeReminder(email, name, usage) {
    this.initialize(); // Ensure transporter is initialized
    
    const daysLeft = usage.remaining.days;
    const planName = usage.subscription.plan;
    const isTrialUser = planName === 'TRIAL';
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SUBSTATE <noreply@substate.com>',
      to: email,
      subject: `⏰ ${isTrialUser ? 'Trial Ending Soon' : 'Subscription Expiring'} - Upgrade Your SUBSTATE Plan`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Upgrade Your SUBSTATE Plan</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              margin: 0; 
              padding: 20px; 
              line-height: 1.6;
            }
            .email-container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: #ffffff; 
              border-radius: 16px; 
              overflow: hidden; 
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            }
            .header { 
              background: linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #dc2626 100%); 
              padding: 40px 30px; 
              text-align: center; 
              position: relative;
            }
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
              opacity: 0.3;
            }
            .logo-section {
              position: relative;
              z-index: 2;
            }
            .brand-logo { 
              display: inline-flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 20px;
            }
            .logo-icon {
              width: 48px;
              height: 48px;
              background: rgba(255,255,255,0.2);
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 24px;
              backdrop-filter: blur(10px);
            }
            .brand-name { 
              color: white; 
              font-size: 28px; 
              font-weight: 700; 
              letter-spacing: -0.5px;
            }
            .header h1 { 
              color: white; 
              margin: 0; 
              font-size: 32px; 
              font-weight: 600;
              position: relative;
              z-index: 2;
            }
            .content { 
              padding: 50px 40px; 
              background: #ffffff;
            }
            .greeting {
              font-size: 18px;
              color: #1f2937;
              margin-bottom: 24px;
              font-weight: 500;
            }
            .message {
              color: #4b5563;
              font-size: 16px;
              line-height: 1.7;
              margin-bottom: 32px;
            }
            .urgency-banner { 
              background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
              border: 2px solid #f59e0b;
              border-radius: 16px; 
              padding: 32px; 
              text-align: center; 
              margin: 32px 0;
              position: relative;
              overflow: hidden;
            }
            .urgency-banner::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 4px;
              background: linear-gradient(90deg, #f59e0b, #ef4444, #dc2626);
            }
            .urgency-badge {
              display: inline-block;
              background: #ef4444;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 600;
              margin-bottom: 16px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .urgency-title {
              font-size: 28px;
              font-weight: 700;
              color: #92400e;
              margin-bottom: 12px;
            }
            .urgency-desc {
              color: #92400e;
              font-size: 18px;
              line-height: 1.6;
              font-weight: 500;
            }
            .usage-stats {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 12px;
              padding: 24px;
              margin: 32px 0;
            }
            .usage-title {
              font-size: 18px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 16px;
              text-align: center;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
            }
            .stat-item {
              text-align: center;
              padding: 16px;
              background: white;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            .stat-number {
              font-size: 24px;
              font-weight: 700;
              color: #1f2937;
              margin-bottom: 4px;
            }
            .stat-label {
              font-size: 14px;
              color: #6b7280;
            }
            .plans-section {
              margin: 40px 0;
            }
            .plans-title {
              font-size: 20px;
              font-weight: 600;
              color: #374151;
              text-align: center;
              margin-bottom: 24px;
            }
            .plans-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
            }
            .plan-card {
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border: 2px solid #e2e8f0;
              border-radius: 12px;
              padding: 24px;
              text-align: center;
              transition: all 0.2s ease;
            }
            .plan-card.popular {
              border-color: #3b82f6;
              background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            }
            .plan-name {
              font-size: 18px;
              font-weight: 600;
              color: #374151;
              margin-bottom: 8px;
            }
            .plan-price {
              font-size: 32px;
              font-weight: 700;
              color: #1f2937;
              margin-bottom: 16px;
            }
            .plan-features {
              list-style: none;
              padding: 0;
              margin: 0 0 20px 0;
            }
            .plan-features li {
              font-size: 14px;
              color: #4b5563;
              margin-bottom: 8px;
              padding-left: 20px;
              position: relative;
            }
            .plan-features li::before {
              content: '✓';
              position: absolute;
              left: 0;
              color: #10b981;
              font-weight: bold;
            }
            .cta-section {
              text-align: center;
              margin: 40px 0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
              color: white;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 600;
              font-size: 16px;
              box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
              transition: all 0.2s ease;
            }
            .cta-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 20px rgba(239, 68, 68, 0.4);
            }
            .footer { 
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              padding: 32px 40px; 
              text-align: center; 
              border-top: 1px solid #e5e7eb;
            }
            .footer-content {
              color: #6b7280; 
              font-size: 14px;
              line-height: 1.6;
            }
            .footer-brand {
              font-weight: 600;
              color: #374151;
              margin-bottom: 8px;
            }
            @media (max-width: 600px) {
              .email-container { margin: 10px; border-radius: 12px; }
              .header { padding: 30px 20px; }
              .content { padding: 30px 20px; }
              .footer { padding: 20px; }
              .stats-grid { grid-template-columns: 1fr; gap: 12px; }
              .plans-grid { grid-template-columns: 1fr; gap: 16px; }
              .urgency-banner { padding: 24px; }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="logo-section">
                <div class="brand-logo">
                  <div class="logo-icon">⏰</div>
                  <div class="brand-name">SUBSTATE</div>
                </div>
                <h1>${isTrialUser ? 'Trial Ending Soon!' : 'Subscription Expiring'}</h1>
              </div>
            </div>
            
            <div class="content">
              <div class="greeting">Hi ${name},</div>
              
              <div class="message">
                ${isTrialUser 
                  ? `Your <strong>14-day free trial</strong> is coming to an end! You have been exploring SUBSTATE's powerful revenue intelligence and content automation features.`
                  : `Your <strong>${planName}</strong> subscription is about to expire. Don't lose access to your revenue intelligence dashboard and AI-powered tools.`
                }
              </div>
              
              <div class="urgency-banner">
                <div class="urgency-badge">${daysLeft <= 1 ? 'Expires Today!' : `${daysLeft} Days Left`}</div>
                <div class="urgency-title">${daysLeft <= 1 ? 'Last Chance!' : `Only ${daysLeft} Days Remaining`}</div>
                <div class="urgency-desc">
                  ${isTrialUser 
                    ? 'Upgrade now to continue accessing all premium features without interruption.'
                    : 'Renew your subscription to maintain access to your campaigns, articles, and analytics.'
                  }
                </div>
              </div>
              
              <div class="usage-stats">
                <div class="usage-title">Your SUBSTATE Journey So Far</div>
                <div class="stats-grid">
                  <div class="stat-item">
                    <div class="stat-number">${usage.usage.campaigns}</div>
                    <div class="stat-label">Campaigns Created</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-number">${usage.usage.articles}</div>
                    <div class="stat-label">Articles Generated</div>
                  </div>
                </div>
              </div>
              
              <div class="plans-section">
                <div class="plans-title">Choose Your Plan</div>
                <div class="plans-grid">
                  <div class="plan-card">
                    <div class="plan-name">PRO</div>
                    <div class="plan-price">₹10<span style="font-size: 16px; color: #6b7280;">/month</span></div>
                    <ul class="plan-features">
                      <li>Unlimited campaigns</li>
                      <li>500 AI articles/month</li>
                      <li>Advanced analytics</li>
                      <li>Priority support</li>
                    </ul>
                  </div>
                  <div class="plan-card popular">
                    <div class="plan-name">ENTERPRISE</div>
                    <div class="plan-price">₹20<span style="font-size: 16px; color: #6b7280;">/month</span></div>
                    <ul class="plan-features">
                      <li>Everything unlimited</li>
                      <li>Custom AI models</li>
                      <li>API access</li>
                      <li>24/7 phone support</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div class="cta-section">
                <a href="#" class="cta-button">Upgrade Now - Don't Lose Access!</a>
              </div>
              
              <div class="message">
                <strong>Why upgrade now?</strong><br>
                • Keep all your campaigns and articles<br>
                • Maintain your analytics history<br>
                • Continue AI-powered content generation<br>
                • Access advanced revenue intelligence<br><br>
                
                Questions? Our support team is here to help you choose the perfect plan for your needs.
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-brand">SUBSTATE</div>
              <div class="footer-content">
                Revenue Intelligence & Content Automation Platform<br>
                © ${new Date().getFullYear()} SUBSTATE. All rights reserved.<br>
                You're receiving this email because your subscription is expiring soon.
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      if (this.transporter) {
        await this.transporter.sendMail(mailOptions);
        console.log('✅ Upgrade reminder email sent to:', email);
      } else {
        console.log('📧 Upgrade reminder email (dev mode) for:', email);
      }
    } catch (error) {
      console.error('❌ Upgrade reminder email error:', error);
      // Don't throw - reminder email is not critical
    }
  }

  // Send usage warning email (75% limit reached)
  async sendUsageWarning(email, name, usageData) {
    this.initialize();

    const { type, current, limit, percentage, plan } = usageData;
    const remaining = limit - current;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SUBSTATE <noreply@substate.com>',
      to: email,
      subject: `⚠️ You're approaching your ${type} limit - ${Math.round(percentage)}% used`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center; }
            .logo { font-size: 32px; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -1px; }
            .content { padding: 40px 30px; }
            .warning-box { background: #fff7ed; border-left: 4px solid #f97316; padding: 20px; margin: 30px 0; border-radius: 8px; }
            .usage-stats { background: #f9fafb; padding: 25px; border-radius: 12px; margin: 25px 0; }
            .stat-row { display: flex; justify-content: space-between; align-items: center; margin: 15px 0; padding: 15px; background: white; border-radius: 8px; }
            .stat-label { font-size: 14px; color: #6b7280; font-weight: 500; }
            .stat-value { font-size: 24px; font-weight: 700; color: #1f2937; }
            .progress-bar { width: 100%; height: 12px; background: #e5e7eb; border-radius: 6px; overflow: hidden; margin-top: 10px; }
            .progress-fill { height: 100%; background: linear-gradient(90deg, #f97316 0%, #ea580c 100%); transition: width 0.3s ease; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 14px; }
            .footer-brand { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SUBSTATE</div>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Usage Alert</p>
            </div>
            
            <div class="content">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hi ${name},</h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                We wanted to give you a heads up - you're approaching your ${type} limit on your <strong>${plan}</strong> plan.
              </p>

              <div class="warning-box">
                <h3 style="color: #ea580c; margin: 0 0 10px 0; font-size: 18px;">⚠️ ${Math.round(percentage)}% of your ${type} limit used</h3>
                <p style="color: #6b7280; margin: 0; font-size: 14px;">
                  You have <strong>${remaining} ${type}</strong> remaining this month.
                </p>
              </div>

              <div class="usage-stats">
                <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px;">Your Current Usage</h3>
                
                <div class="stat-row">
                  <div>
                    <div class="stat-label">${type.charAt(0).toUpperCase() + type.slice(1)} Used</div>
                    <div class="stat-value">${current} / ${limit}</div>
                  </div>
                  <div style="text-align: right;">
                    <div class="stat-label">Remaining</div>
                    <div class="stat-value" style="color: ${remaining <= 5 ? '#ef4444' : '#f97316'};">${remaining}</div>
                  </div>
                </div>

                <div class="progress-bar">
                  <div class="progress-fill" style="width: ${percentage}%;"></div>
                </div>
              </div>

              <h3 style="color: #1f2937; margin: 30px 0 15px 0;">What happens next?</h3>
              <ul style="color: #4b5563; line-height: 1.8; padding-left: 20px;">
                <li>You can continue using SUBSTATE until you reach your limit</li>
                <li>Once you hit ${limit} ${type}, you'll need to upgrade to create more</li>
                <li>Upgrade anytime to get unlimited access and premium features</li>
              </ul>

              <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.VITE_API_URL || 'http://localhost:3000'}/subscription" class="cta-button">
                  Upgrade Your Plan
                </a>
              </div>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                <strong>Need help choosing a plan?</strong><br>
                Our team is here to help you find the perfect plan for your needs. Just reply to this email!
              </p>
            </div>
            
            <div class="footer">
              <div class="footer-brand">SUBSTATE</div>
              <div class="footer-content">
                AI-Powered Content Generation Platform<br>
                © ${new Date().getFullYear()} SUBSTATE. All rights reserved.
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return this.sendEmail(mailOptions);
  }

  // Send limit reached email (100% limit reached)
  async sendLimitReached(email, name, usageData) {
    this.initialize();

    const { type, limit, plan } = usageData;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SUBSTATE <noreply@substate.com>',
      to: email,
      subject: `🚫 ${type.charAt(0).toUpperCase() + type.slice(1)} Limit Reached - Upgrade to Continue`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
            .header { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 30px; text-align: center; }
            .logo { font-size: 32px; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -1px; }
            .content { padding: 40px 30px; }
            .limit-box { background: #fef2f2; border-left: 4px solid #ef4444; padding: 25px; margin: 30px 0; border-radius: 8px; text-align: center; }
            .limit-icon { font-size: 48px; margin-bottom: 15px; }
            .plan-comparison { background: #f9fafb; padding: 30px; border-radius: 12px; margin: 30px 0; }
            .plan-card { background: white; padding: 25px; border-radius: 8px; margin: 15px 0; border: 2px solid #e5e7eb; }
            .plan-card.recommended { border-color: #f97316; position: relative; }
            .recommended-badge { background: #f97316; color: white; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; position: absolute; top: -10px; right: 20px; }
            .plan-name { font-size: 20px; font-weight: 700; color: #1f2937; margin: 0 0 10px 0; }
            .plan-price { font-size: 32px; font-weight: 800; color: #f97316; margin: 10px 0; }
            .plan-features { list-style: none; padding: 0; margin: 20px 0; }
            .plan-features li { padding: 8px 0; color: #4b5563; font-size: 14px; }
            .plan-features li:before { content: "✓ "; color: #10b981; font-weight: bold; margin-right: 8px; }
            .cta-button { display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
            .footer { background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 14px; }
            .footer-brand { font-size: 20px; font-weight: 700; color: #ffffff; margin-bottom: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">SUBSTATE</div>
              <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px;">Limit Reached</p>
            </div>
            
            <div class="content">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hi ${name},</h2>
              
              <div class="limit-box">
                <div class="limit-icon">🚫</div>
                <h3 style="color: #ef4444; margin: 0 0 15px 0; font-size: 22px;">You've reached your ${type} limit</h3>
                <p style="color: #6b7280; margin: 0; font-size: 16px;">
                  You've used all <strong>${limit} ${type}</strong> included in your <strong>${plan}</strong> plan this month.
                </p>
              </div>

              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Don't worry! You can upgrade your plan right now to continue creating amazing content without interruption.
              </p>

              <div class="plan-comparison">
                <h3 style="color: #1f2937; margin: 0 0 25px 0; text-align: center;">Choose Your Plan</h3>
                
                <div class="plan-card recommended">
                  <span class="recommended-badge">RECOMMENDED</span>
                  <div class="plan-name">PRO Plan</div>
                  <div class="plan-price">₹999<span style="font-size: 16px; color: #6b7280;">/month</span></div>
                  <ul class="plan-features">
                    <li>Unlimited Campaigns</li>
                    <li>500 Articles per month</li>
                    <li>Advanced AI Content Generation</li>
                    <li>WordPress Auto-Publishing</li>
                    <li>Priority Support</li>
                    <li>Analytics & Insights</li>
                  </ul>
                  <div style="text-align: center;">
                    <a href="${process.env.VITE_API_URL || 'http://localhost:3000'}/subscription?plan=PRO" class="cta-button">
                      Upgrade to PRO
                    </a>
                  </div>
                </div>

                <div class="plan-card">
                  <div class="plan-name">ENTERPRISE Plan</div>
                  <div class="plan-price">₹2,499<span style="font-size: 16px; color: #6b7280;">/month</span></div>
                  <ul class="plan-features">
                    <li>Unlimited Everything</li>
                    <li>Unlimited Articles</li>
                    <li>White-label Options</li>
                    <li>API Access</li>
                    <li>Dedicated Account Manager</li>
                    <li>Custom Integrations</li>
                  </ul>
                  <div style="text-align: center;">
                    <a href="${process.env.VITE_API_URL || 'http://localhost:3000'}/subscription?plan=ENTERPRISE" class="cta-button" style="background: linear-gradient(135deg, #1f2937 0%, #111827 100%);">
                      Upgrade to ENTERPRISE
                    </a>
                  </div>
                </div>
              </div>

              <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <h4 style="color: #1e40af; margin: 0 0 10px 0;">💡 Why Upgrade?</h4>
                <ul style="color: #1e3a8a; margin: 10px 0; padding-left: 20px; line-height: 1.8;">
                  <li>Never hit limits again with higher quotas</li>
                  <li>Access premium AI models for better content</li>
                  <li>Automate your entire content workflow</li>
                  <li>Get priority support when you need help</li>
                </ul>
              </div>

              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; text-align: center; margin-top: 30px;">
                Questions about upgrading? Our team is here to help!<br>
                Reply to this email or contact us at support@substate.com
              </p>
            </div>
            
            <div class="footer">
              <div class="footer-brand">SUBSTATE</div>
              <div class="footer-content">
                AI-Powered Content Generation Platform<br>
                © ${new Date().getFullYear()} SUBSTATE. All rights reserved.
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    return this.sendEmail(mailOptions);
  }

  // Generic send email method
  async sendEmail(mailOptions) {
    this.initialize();
    
    try {
      if (this.transporter) {
        const info = await this.transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
      } else {
        console.log('📧 Email (dev mode):', mailOptions.subject);
        return { success: true, dev: true };
      }
    } catch (error) {
      console.error('❌ Email send error:', error);
      throw new Error('Failed to send email');
    }
  }

  /**
   * Send discount coupon email to user
   * @param {Object} user - User object
   * @param {Object} couponData - Coupon details { code, discount, validUntil }
   */
  async sendDiscountCouponEmail(user, couponData) {
    try {
      this.initialize();
      
      const htmlContent = getDiscountCouponEmail(user, couponData);

      const mailOptions = {
        from: `"SUBSTATE" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: `🎁 Special ${couponData.discount}% Discount Just for You!`,
        html: htmlContent
      };

      if (this.transporter) {
        await this.transporter.sendMail(mailOptions);
        console.log(`✅ Discount coupon email sent to ${user.email}`);
      } else {
        console.log('📧 [DEV MODE] Discount Coupon Email:');
        console.log(`To: ${user.email}`);
        console.log(`Subject: ${mailOptions.subject}`);
        console.log(`Coupon Code: ${couponData.code}`);
        console.log(`Discount: ${couponData.discount}%`);
      }
      
      return true;
    } catch (error) {
      console.error('Error sending discount coupon email:', error);
      throw error;
    }
  }
}

export default new EmailService();
