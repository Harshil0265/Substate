import mongoose from 'mongoose';
import dotenv from 'dotenv';
import EmailService from '../backend/services/EmailService.js';

// Load environment variables
dotenv.config();

async function sendCouponEmail() {
  try {
    // Connect to MongoDB (if needed for any database operations)
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Initialize email service
    EmailService.initialize();

    const recipientEmail = 'barotharshil070@gmail.com';
    const recipientName = 'Harshil';
    const couponCode = 'HARSHIL50';

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SUBSTATE <noreply@substate.com>',
      to: recipientEmail,
      subject: '🎉 Special 50% Discount Coupon - Exclusive for You!',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Special Coupon - SUBSTATE</title>
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
              background: linear-gradient(135deg, #F97316 0%, #EA580C 50%, #DC2626 100%); 
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
            .coupon-container { 
              background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
              border: 3px solid #F59E0B;
              border-radius: 16px; 
              padding: 40px; 
              text-align: center; 
              margin: 32px 0;
              position: relative;
              overflow: hidden;
            }
            .coupon-container::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 6px;
              background: linear-gradient(90deg, #F59E0B, #EA580C, #DC2626);
            }
            .coupon-badge {
              display: inline-block;
              background: #DC2626;
              color: white;
              padding: 8px 20px;
              border-radius: 20px;
              font-size: 14px;
              font-weight: 700;
              margin-bottom: 20px;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .coupon-title { 
              color: #92400E; 
              font-size: 28px; 
              font-weight: 800;
              margin-bottom: 16px; 
            }
            .coupon-code { 
              font-size: 48px; 
              font-weight: 900; 
              color: #DC2626; 
              letter-spacing: 4px; 
              font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
              text-shadow: 0 2px 4px rgba(220, 38, 38, 0.2);
              background: white;
              padding: 20px 30px;
              border-radius: 12px;
              border: 2px dashed #F59E0B;
              margin: 20px 0;
              display: inline-block;
            }
            .discount-highlight {
              font-size: 24px;
              font-weight: 700;
              color: #059669;
              margin-top: 16px;
            }
            .features-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 32px 0;
            }
            .feature-card { 
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              border: 1px solid #e2e8f0;
              border-radius: 12px; 
              padding: 24px; 
              text-align: center;
              transition: transform 0.2s ease;
            }
            .feature-card:hover {
              transform: translateY(-2px);
            }
            .feature-icon {
              font-size: 32px;
              margin-bottom: 12px;
              display: block;
            }
            .feature-title {
              font-weight: 600;
              color: #374151;
              margin-bottom: 8px;
              font-size: 16px;
            }
            .feature-desc {
              color: #6b7280;
              font-size: 14px;
              line-height: 1.5;
            }
            .how-to-use { 
              background: linear-gradient(135dg, #EFF6FF 0%, #DBEAFE 100%);
              border: 2px solid #3B82F6;
              border-radius: 16px; 
              padding: 32px; 
              margin: 32px 0;
            }
            .how-to-title {
              font-size: 20px;
              font-weight: 700;
              color: #1E40AF;
              margin-bottom: 20px;
              text-align: center;
            }
            .steps-list {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            .steps-list li {
              display: flex;
              align-items: flex-start;
              gap: 12px;
              padding: 12px 0;
              color: #1E3A8A;
              font-weight: 500;
            }
            .step-number {
              background: #3B82F6;
              color: white;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              font-weight: 700;
              flex-shrink: 0;
            }
            .cta-section {
              text-align: center;
              margin: 40px 0;
            }
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #F97316 0%, #EA580C 100%);
              color: white;
              padding: 18px 36px;
              text-decoration: none;
              border-radius: 12px;
              font-weight: 700;
              font-size: 18px;
              box-shadow: 0 6px 16px rgba(249, 115, 22, 0.3);
              transition: all 0.2s ease;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .cta-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 10px 24px rgba(249, 115, 22, 0.4);
            }
            .expiry-notice { 
              background: #FEF2F2;
              border-left: 4px solid #EF4444; 
              border-radius: 8px;
              padding: 20px; 
              margin: 32px 0; 
              color: #991B1B;
            }
            .expiry-notice strong {
              color: #7F1D1D;
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
            .social-links {
              margin-top: 20px;
            }
            .social-links a {
              display: inline-block;
              margin: 0 8px;
              padding: 8px;
              background: #ffffff;
              border-radius: 8px;
              text-decoration: none;
              color: #6b7280;
              border: 1px solid #e5e7eb;
              transition: all 0.2s ease;
            }
            .social-links a:hover {
              background: #F97316;
              color: white;
              border-color: #F97316;
            }
            @media (max-width: 600px) {
              .email-container { margin: 10px; border-radius: 12px; }
              .header { padding: 30px 20px; }
              .content { padding: 30px 20px; }
              .footer { padding: 20px; }
              .coupon-code { font-size: 36px; letter-spacing: 2px; padding: 16px 20px; }
              .features-grid { grid-template-columns: 1fr; gap: 16px; }
              .coupon-container { padding: 30px 20px; }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="logo-section">
                <div class="brand-logo">
                  <div class="logo-icon">🎁</div>
                  <div class="brand-name">SUBSTATE</div>
                </div>
                <h1>Special Gift for You!</h1>
              </div>
            </div>
            
            <div class="content">
              <div class="greeting">Hi ${recipientName},</div>
              
              <div class="message">
                We have something <strong>special</strong> just for you! As a valued member of the SUBSTATE community, we're excited to offer you an exclusive discount on any of our premium plans.
              </div>
              
              <div class="coupon-container">
                <div class="coupon-badge">EXCLUSIVE OFFER</div>
                <div class="coupon-title">50% OFF Any Upgrade!</div>
                <div class="coupon-code">${couponCode}</div>
                <div class="discount-highlight">Save 50% on PRO or ENTERPRISE plans!</div>
              </div>
              
              <div class="message">
                This exclusive coupon gives you <strong>50% off</strong> when you upgrade to any of our premium plans. Whether you choose PRO or ENTERPRISE, you'll get incredible value with this special discount!
              </div>
              
              <div class="features-grid">
                <div class="feature-card">
                  <div class="feature-icon">🚀</div>
                  <div class="feature-title">PRO Plan</div>
                  <div class="feature-desc">Unlimited campaigns, 500 AI articles/month, advanced analytics, priority support</div>
                </div>
                
                <div class="feature-card">
                  <div class="feature-icon">⭐</div>
                  <div class="feature-title">ENTERPRISE Plan</div>
                  <div class="feature-desc">Unlimited everything, custom AI models, API access, dedicated account manager</div>
                </div>
              </div>
              
              <div class="how-to-use">
                <div class="how-to-title">How to Use Your Coupon</div>
                <ol class="steps-list">
                  <li>
                    <span class="step-number">1</span>
                    <span>Log in to your SUBSTATE account</span>
                  </li>
                  <li>
                    <span class="step-number">2</span>
                    <span>Go to the Subscription page</span>
                  </li>
                  <li>
                    <span class="step-number">3</span>
                    <span>Select your preferred plan (PRO or ENTERPRISE)</span>
                  </li>
                  <li>
                    <span class="step-number">4</span>
                    <span>Enter coupon code <strong>${couponCode}</strong> at checkout</span>
                  </li>
                  <li>
                    <span class="step-number">5</span>
                    <span>Enjoy 50% off your first month!</span>
                  </li>
                </ol>
              </div>
              
              <div class="cta-section">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription" class="cta-button">
                  Upgrade Now & Save 50%
                </a>
              </div>
              
              <div class="expiry-notice">
                <strong>⏰ Limited Time Offer:</strong> This coupon is valid for 1 year and can only be used once. Don't miss out on this exclusive opportunity to save big on your SUBSTATE subscription!
              </div>
              
              <div class="message">
                <strong>Why upgrade with SUBSTATE?</strong><br>
                • Unlimited AI-powered content generation<br>
                • Advanced revenue intelligence and analytics<br>
                • Automated campaign management<br>
                • WordPress integration and auto-publishing<br>
                • Priority support from our expert team<br><br>
                
                Questions about your coupon or our plans? Just reply to this email - our team is here to help!
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-brand">SUBSTATE</div>
              <div class="footer-content">
                Revenue Intelligence & Content Automation Platform<br>
                © ${new Date().getFullYear()} SUBSTATE. All rights reserved.<br>
                This is a special promotional email sent exclusively to you.
              </div>
              <div class="social-links">
                <a href="#" title="Website">🌐</a>
                <a href="#" title="Support">💬</a>
                <a href="#" title="Documentation">📚</a>
                <a href="#" title="Community">👥</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hi ${recipientName},

🎉 SPECIAL EXCLUSIVE OFFER FOR YOU! 🎉

We have something amazing just for you! As a valued SUBSTATE community member, you get an exclusive 50% discount on any premium plan upgrade.

Your Special Coupon Code: ${couponCode}

✨ What You Get:
• 50% OFF PRO Plan (normally ₹10/month)
• 50% OFF ENTERPRISE Plan (normally ₹20/month)
• Valid for 1 year from today
• One-time use (make it count!)

🚀 PRO Plan Features:
- Unlimited campaigns
- 500 AI articles per month
- Advanced revenue analytics
- Priority support
- WordPress integration

⭐ ENTERPRISE Plan Features:
- Unlimited everything
- Custom AI models
- API access
- Dedicated account manager
- White-label options

How to Use Your Coupon:
1. Log in to your SUBSTATE account
2. Go to Subscription page
3. Choose PRO or ENTERPRISE plan
4. Enter code: ${couponCode}
5. Enjoy 50% off!

Upgrade now: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription

⏰ This is a limited-time exclusive offer just for you!

Questions? Just reply to this email.

Best regards,
The SUBSTATE Team

© ${new Date().getFullYear()} SUBSTATE - Revenue Intelligence Platform
      `
    };

    try {
      if (EmailService.transporter) {
        const info = await EmailService.transporter.sendMail(mailOptions);
        console.log('✅ Special coupon email sent successfully!');
        console.log('📧 Message ID:', info.messageId);
        console.log('📬 Sent to:', recipientEmail);
        console.log('🎟️ Coupon Code:', couponCode);
        console.log('💰 Discount: 50% OFF');
      } else {
        console.log('\n📧 ===== COUPON EMAIL (Development Mode) =====');
        console.log('To:', recipientEmail);
        console.log('Subject:', mailOptions.subject);
        console.log('Coupon Code:', couponCode);
        console.log('Discount: 50% OFF');
        console.log('Valid for: 1 year');
        console.log('Usage: One-time only');
        console.log('==============================================\n');
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Failed to send coupon email:', error);
      throw error;
    }

  } catch (error) {
    console.error('❌ Error in coupon email process:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the script
sendCouponEmail();