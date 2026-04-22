import mongoose from 'mongoose';
import dotenv from 'dotenv';
import EmailService from '../backend/services/EmailService.js';

// Load environment variables
dotenv.config();

async function sendProfessionalCouponEmail() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Initialize email service
    EmailService.initialize();

    const recipientEmail = 'barotharshil070@gmail.com';
    const recipientName = 'Harshil';
    const couponCode = 'HARSHIL50';

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'SubState <noreply@substate.com>',
      to: recipientEmail,
      subject: 'Exclusive Offer: 50% Discount on Premium Plans',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Exclusive Discount - SubState</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              background-color: #f5f5f5;
              margin: 0; 
              padding: 40px 20px; 
              line-height: 1.6;
            }
            .email-container { 
              max-width: 600px; 
              margin: 0 auto; 
              background: #ffffff; 
              border-radius: 12px; 
              overflow: hidden; 
              box-shadow: 0 4px 20px rgba(0,0,0,0.08);
              border: 1px solid #e5e7eb;
            }
            .header { 
              background: #f97316;
              padding: 48px 40px; 
              text-align: center;
            }
            .brand-section {
              display: inline-flex;
              align-items: center;
              gap: 12px;
              margin-bottom: 16px;
            }
            .brand-icon {
              width: 40px;
              height: 40px;
              background: white;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            .brand-icon img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            .brand-name { 
              color: white; 
              font-size: 24px; 
              font-weight: 800; 
              letter-spacing: -0.5px;
            }
            .header-title { 
              color: white; 
              font-size: 28px; 
              font-weight: 700;
              letter-spacing: -0.5px;
              line-height: 1.2;
            }
            .content { 
              padding: 48px 40px; 
              background: #ffffff;
            }
            .greeting {
              font-size: 18px;
              color: #111827;
              margin-bottom: 20px;
              font-weight: 600;
            }
            .message {
              color: #4b5563;
              font-size: 16px;
              line-height: 1.7;
              margin-bottom: 28px;
            }
            .coupon-card { 
              background: #ffffff;
              border: 2px solid #f97316;
              border-radius: 12px; 
              padding: 32px; 
              text-align: center; 
              margin: 32px 0;
            }
            .discount-badge {
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: #f97316;
              color: white;
              padding: 8px 16px;
              border-radius: 20px;
              font-size: 13px;
              font-weight: 700;
              margin-bottom: 16px;
              letter-spacing: 0.5px;
              text-transform: uppercase;
            }
            .discount-badge svg {
              width: 16px;
              height: 16px;
              stroke: white;
              fill: none;
              stroke-width: 2;
              stroke-linecap: round;
              stroke-linejoin: round;
            }
            .discount-title { 
              color: #111827; 
              font-size: 24px; 
              font-weight: 700;
              margin-bottom: 20px;
              letter-spacing: -0.5px;
            }
            .coupon-code-container {
              background: #fafafa;
              border: 2px dashed #f97316;
              border-radius: 10px;
              padding: 24px;
              margin: 20px 0;
            }
            .coupon-label {
              font-size: 13px;
              color: #6b7280;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin-bottom: 8px;
            }
            .coupon-code { 
              font-size: 36px; 
              font-weight: 800; 
              color: #f97316; 
              letter-spacing: 0.15em; 
              font-family: 'SF Mono', Monaco, 'Courier New', monospace;
            }
            .discount-value {
              font-size: 15px;
              font-weight: 600;
              color: #059669;
              margin-top: 16px;
            }
            .plans-section {
              margin: 32px 0;
            }
            .section-title {
              font-size: 18px;
              font-weight: 700;
              color: #111827;
              margin-bottom: 16px;
              letter-spacing: -0.5px;
            }
            .plans-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 16px;
              margin-top: 16px;
            }
            .plan-card { 
              background: #fafafa;
              border: 1px solid #e5e7eb;
              border-radius: 10px; 
              padding: 24px; 
              text-align: left;
            }
            .plan-name {
              font-weight: 700;
              color: #111827;
              font-size: 18px;
              margin: 0 0 12px 0;
            }
            .plan-features {
              color: #6b7280;
              font-size: 14px;
              line-height: 1.6;
              margin: 0;
            }
            .steps-section {
              background: #fafafa;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              padding: 24px;
              margin: 32px 0;
            }
            .steps-title {
              font-size: 16px;
              font-weight: 600;
              color: #111827;
              margin-bottom: 16px;
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
              padding: 10px 0;
              color: #4b5563;
              font-size: 15px;
              line-height: 1.6;
            }
            .step-number {
              color: #111827;
              font-size: 16px;
              font-weight: 700;
              flex-shrink: 0;
              min-width: 20px;
            }
            .cta-section {
              text-align: center;
              margin: 32px 0;
            }
            .cta-button {
              display: inline-block;
              background: #f97316;
              color: #111827;
              padding: 16px 32px;
              text-decoration: none;
              border-radius: 10px;
              font-weight: 700;
              font-size: 16px;
              transition: background 0.2s ease;
              box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
            }
            .cta-button:hover {
              background: #ea580c;
              color: #111827;
            }
            .info-box { 
              background: #fff7ed;
              border-left: 4px solid #f97316; 
              border-radius: 8px;
              padding: 20px; 
              margin: 28px 0; 
              color: #92400e;
              font-size: 14px;
              line-height: 1.6;
            }
            .info-box strong {
              color: #78350f;
              font-weight: 600;
            }
            .footer { 
              background: #111827;
              padding: 32px 40px; 
              text-align: center;
            }
            .footer-brand {
              font-weight: 700;
              color: #ffffff;
              margin-bottom: 8px;
              font-size: 18px;
              letter-spacing: -0.5px;
            }
            .footer-text {
              color: #9ca3af; 
              font-size: 13px;
              line-height: 1.8;
              margin-bottom: 24px;
            }
            .footer-links {
              margin-top: 0;
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 16px;
              flex-wrap: wrap;
              padding: 0 20px;
            }
            .footer-link {
              color: #9ca3af;
              text-decoration: none;
              font-size: 14px;
              font-weight: 500;
              white-space: nowrap;
              padding: 0 4px;
            }
            .footer-link:hover {
              color: #f97316;
            }
            .footer-separator {
              color: #6b7280;
              font-size: 14px;
              font-weight: 400;
            }
            @media (max-width: 600px) {
              body { padding: 20px 10px; }
              .email-container { border-radius: 6px; }
              .header { padding: 32px 24px 24px; }
              .content { padding: 24px; }
              .footer { padding: 24px; }
              .coupon-code { font-size: 24px; letter-spacing: 0.08em; }
              .plans-grid { grid-template-columns: 1fr; gap: 12px; }
              .coupon-card { padding: 24px 20px; }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="brand-section">
                <div class="brand-icon">
                  <img src="${process.env.FRONTEND_URL || 'http://localhost:5173'}/substate-icon.svg" alt="SubState Logo" />
                </div>
                <div class="brand-name">SubState</div>
              </div>
              <div class="header-title">Exclusive Offer for You</div>
            </div>
            
            <div class="content">
              <div class="greeting">Hello ${recipientName},</div>
              
              <div class="message">
                As a valued member of our community, we're pleased to offer you an exclusive discount on our premium plans. This is our way of thanking you for being part of SubState.
              </div>
              
              <div class="coupon-card">
                <div class="discount-badge">
                  🏷️ Limited Time Offer
                </div>
                <div class="discount-title">50% Off Premium Plans</div>
                <div class="coupon-code-container">
                  <div class="coupon-label">Promo Code</div>
                  <div class="coupon-code">${couponCode}</div>
                </div>
                <div class="discount-value">Save 50% on Professional or Enterprise</div>
              </div>
              
              <div class="plans-section">
                <div class="section-title">Available Plans</div>
                <div class="plans-grid">
                  <div class="plan-card">
                    <div class="plan-name">Professional</div>
                    <div class="plan-features">Unlimited campaigns, 500 articles/month, priority support</div>
                  </div>
                  
                  <div class="plan-card">
                    <div class="plan-name">Enterprise</div>
                    <div class="plan-features">Unlimited everything, API access, dedicated support</div>
                  </div>
                </div>
              </div>
              
              <div class="steps-section">
                <div class="steps-title">How to Redeem</div>
                <ol class="steps-list">
                  <li>
                    <span class="step-number">1</span>
                    <span>Log in to your SubState account</span>
                  </li>
                  <li>
                    <span class="step-number">2</span>
                    <span>Navigate to the Subscription page</span>
                  </li>
                  <li>
                    <span class="step-number">3</span>
                    <span>Select your preferred plan</span>
                  </li>
                  <li>
                    <span class="step-number">4</span>
                    <span>Enter code <strong>${couponCode}</strong> at checkout</span>
                  </li>
                  <li>
                    <span class="step-number">5</span>
                    <span>Complete your purchase</span>
                  </li>
                </ol>
              </div>
              
              <div class="cta-section">
                <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/subscription" class="cta-button">
                  View Plans
                </a>
              </div>
              
              <div class="info-box">
                <strong>Important:</strong> This promotional code is valid for one year and can be used once. The discount applies to your first billing cycle.
              </div>
              
              <div class="message">
                If you have any questions about this offer or need assistance, please don't hesitate to contact our support team.
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-brand">SubState</div>
              <div class="footer-text">
                Content & Campaign Management Platform<br>
                © ${new Date().getFullYear()} SubState. All rights reserved.
              </div>
              <div class="footer-links">
                <a href="#" class="footer-link">Help Center</a>
                <span class="footer-separator">•</span>
                <a href="#" class="footer-link">Privacy Policy</a>
                <span class="footer-separator">•</span>
                <a href="#" class="footer-link">Terms of Service</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
Hello ${recipientName},

EXCLUSIVE OFFER FOR YOU

As a valued member of our community, we're pleased to offer you an exclusive discount on our premium plans.

Your Promo Code: ${couponCode}

50% OFF PREMIUM PLANS
Save 50% on Professional or Enterprise plans

AVAILABLE PLANS:

Professional Plan
- Unlimited campaigns
- 500 articles per month
- Priority support

Enterprise Plan
- Unlimited everything
- API access
- Dedicated support

HOW TO REDEEM:
1. Log in to your SubState account
2. Navigate to the Subscription page
3. Select your preferred plan
4. Enter code ${couponCode} at checkout
5. Complete your purchase

View Plans: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard/subscription

IMPORTANT: This promotional code is valid for one year and can be used once. The discount applies to your first billing cycle.

If you have any questions, please contact our support team.

Best regards,
The SubState Team

© ${new Date().getFullYear()} SubState - Content & Campaign Management Platform
      `
    };

    try {
      if (EmailService.transporter) {
        const info = await EmailService.transporter.sendMail(mailOptions);
        console.log('✅ Professional coupon email sent successfully!');
        console.log('📧 Message ID:', info.messageId);
        console.log('📬 Sent to:', recipientEmail);
        console.log('🎟️ Coupon Code:', couponCode);
        console.log('💰 Discount: 50% OFF');
      } else {
        console.log('\n📧 ===== PROFESSIONAL COUPON EMAIL (Development Mode) =====');
        console.log('To:', recipientEmail);
        console.log('Subject:', mailOptions.subject);
        console.log('Coupon Code:', couponCode);
        console.log('Discount: 50% OFF');
        console.log('==========================================================\n');
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
sendProfessionalCouponEmail();
