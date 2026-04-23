// Email template utilities with proper logo display

/**
 * SUBSTATE Logo - Embedded Base64 Data URI
 * This ensures 100% reliable display in all email clients
 * No external requests, no loading issues, always works
 */
export const getSubstateLogo = () => {
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8IS0tIERlZmluZSBHcmFkaWVudHMgLS0+CiAgPGRlZnM+CiAgICA8bGluZWFyR3JhZGllbnQgaWQ9Imljb24tZ3JhZGllbnQxIiB4MT0iMCUiIHkxPSIwJSIgeDI9IjEwMCUiIHkyPSIxMDAlIj4KICAgICAgPHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6I0ZCOTIzQztzdG9wLW9wYWNpdHk6MSIgLz4KICAgICAgPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRjk3MzE2O3N0b3Atb3BhY2l0eToxIiAvPgogICAgPC9saW5lYXJHcmFkaWVudD4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0iaWNvbi1ncmFkaWVudDIiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojRjk3MzE2O3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNFQTU4MEM7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogICAgPGxpbmVhckdyYWRpZW50IGlkPSJpY29uLWdyYWRpZW50MyIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CiAgICAgIDxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNFQTU4MEM7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICAgIDxzdG9wIG9mZnNldD0iMTAwJSIgc3R5bGU9InN0b3AtY29sb3I6I0MyNDEwQztzdG9wLW9wYWNpdHk6MSIgLz4KICAgIDwvbGluZWFyR3JhZGllbnQ+CiAgPC9kZWZzPgogIAogIDwhLS0gQmFja2dyb3VuZCBDaXJjbGUgLS0+CiAgPGNpcmNsZSBjeD0iMjQiIGN5PSIyNCIgcj0iMjMiIGZpbGw9IiNGRkZGRkYiIHN0cm9rZT0iI0YzRjRGNiIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgCiAgPCEtLSBMYXllcmVkIFN0YWNrIEljb24gLSBDZW50ZXJlZCAtLT4KICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg5LCAxMikiPgogICAgPCEtLSBMYXllciAzIChUb3ApIC0gU21hbGxlc3QgLS0+CiAgICA8cmVjdCB4PSI4IiB5PSIwIiB3aWR0aD0iMTQiIGhlaWdodD0iNSIgcng9IjIiIGZpbGw9InVybCgjaWNvbi1ncmFkaWVudDEpIiBvcGFjaXR5PSIwLjk1Ii8+CiAgICAKICAgIDwhLS0gTGF5ZXIgMiAoTWlkZGxlKSAtLT4KICAgIDxyZWN0IHg9IjUiIHk9IjkiIHdpZHRoPSIyMCIgaGVpZ2h0PSI1IiByeD0iMiIgZmlsbD0idXJsKCNpY29uLWdyYWRpZW50MikiIG9wYWNpdHk9IjAuOTciLz4KICAgIAogICAgPCEtLSBMYXllciAxIChCb3R0b20pIC0gTGFyZ2VzdCAtLT4KICAgIDxyZWN0IHg9IjAiIHk9IjE4IiB3aWR0aD0iMzAiIGhlaWdodD0iNSIgcng9IjIiIGZpbGw9InVybCgjaWNvbi1ncmFkaWVudDMpIi8+CiAgICAKICAgIDwhLS0gU3VidGxlIGNvbm5lY3RpbmcgbGluZXMgLS0+CiAgICA8bGluZSB4MT0iMTUiIHkxPSI1IiB4Mj0iMTUiIHkyPSI5IiBzdHJva2U9InVybCgjaWNvbi1ncmFkaWVudDIpIiBzdHJva2Utd2lkdGg9IjEuNSIgb3BhY2l0eT0iMC40Ii8+CiAgICA8bGluZSB4MT0iMTUiIHkxPSIxNCIgeDI9IjE1IiB5Mj0iMTgiIHN0cm9rZT0idXJsKCNpY29uLWdyYWRpZW50MykiIHN0cm9rZS13aWR0aD0iMS41IiBvcGFjaXR5PSIwLjQiLz4KICA8L2c+Cjwvc3ZnPgo=';
};

/**
 * Generate email header with SUBSTATE logo and brand name
 * @param {string} title - Header title
 * @param {string} bgColor - Background color (default: #f97316)
 */
export const getEmailHeader = (title, bgColor = '#f97316') => {
  const logoDataUri = getSubstateLogo();
  
  return `
    <div class="header" style="background: ${bgColor}; padding: 48px 40px; text-align: center; position: relative;">
      <div class="brand-logo" style="display: inline-flex; align-items: center; gap: 16px; margin-bottom: 20px; background: rgba(255, 255, 255, 0.15); padding: 12px 24px; border-radius: 12px; backdrop-filter: blur(10px);">
        <div class="logo-icon" style="width: 48px; height: 48px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          <img src="${logoDataUri}" alt="SUBSTATE" style="width: 100%; height: 100%; object-fit: contain; display: block;" />
        </div>
        <div class="brand-name" style="color: white; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; text-transform: uppercase;">SUBSTATE</div>
      </div>
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">${title}</h1>
    </div>
  `;
};

/**
 * Generate email footer
 */
export const getEmailFooter = () => {
  return `
    <div class="footer" style="background: #111827; padding: 32px 40px; text-align: center;">
      <div class="footer-brand" style="font-weight: 700; color: #ffffff; margin-bottom: 8px; font-size: 18px; letter-spacing: -0.5px;">SUBSTATE</div>
      <div class="footer-content" style="color: #9ca3af; font-size: 13px; line-height: 1.6;">
        Revenue Intelligence & Content Automation Platform<br>
        © ${new Date().getFullYear()} SUBSTATE. All rights reserved.<br>
        This is an automated email. Please do not reply to this message.
      </div>
      <div class="social-links" style="margin-top: 20px;">
        <a href="#" style="display: inline-block; margin: 0 8px; padding: 8px; background: #1f2937; border-radius: 8px; text-decoration: none; color: #9ca3af; border: 1px solid #374151;" title="Website">🌐</a>
        <a href="#" style="display: inline-block; margin: 0 8px; padding: 8px; background: #1f2937; border-radius: 8px; text-decoration: none; color: #9ca3af; border: 1px solid #374151;" title="Support">💬</a>
        <a href="#" style="display: inline-block; margin: 0 8px; padding: 8px; background: #1f2937; border-radius: 8px; text-decoration: none; color: #9ca3af; border: 1px solid #374151;" title="Documentation">📚</a>
      </div>
    </div>
  `;
};

/**
 * Base email styles
 */
export const getBaseEmailStyles = () => {
  return `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
        background: #f5f5f5;
        margin: 0; 
        padding: 20px; 
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
      @media (max-width: 600px) {
        .email-container { margin: 10px; border-radius: 10px; }
        .header { padding: 32px 24px !important; }
        .content { padding: 32px 24px; }
        .footer { padding: 24px !important; }
        .brand-logo { gap: 12px !important; padding: 10px 20px !important; }
        .brand-name { font-size: 24px !important; }
        .logo-icon { width: 40px !important; height: 40px !important; }
      }
    </style>
  `;
};

/**
 * Wrap email content with base HTML structure
 */
export const wrapEmailContent = (title, content) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      ${getBaseEmailStyles()}
    </head>
    <body>
      <div class="email-container">
        ${content}
      </div>
    </body>
    </html>
  `;
};


/**
 * Welcome Email Template
 * @param {Object} user - User object with name and email
 */
export const getWelcomeEmail = (user) => {
  const logoDataUri = getSubstateLogo();
  
  return wrapEmailContent('Welcome to SUBSTATE!', `
    ${getEmailHeader('🎉 Welcome to SUBSTATE!', '#f97316')}
    
    <div class="content">
      <div class="greeting">Hi ${user.name}! 👋</div>
      
      <div class="message">
        Welcome to <strong>SUBSTATE</strong> - your intelligent revenue and content automation platform! 
        We're thrilled to have you join our community of forward-thinking businesses.
      </div>

      <div class="benefits-list">
        <div style="font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 16px;">
          What you can do with SUBSTATE:
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">🚀</span>
          <span>Generate high-quality content automatically</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">📊</span>
          <span>Track revenue and performance analytics</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">⚡</span>
          <span>Automate your marketing campaigns</span>
        </div>
        <div class="benefit-item">
          <span class="benefit-icon">🎯</span>
          <span>Integrate with WordPress and other platforms</span>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${process.env.FRONTEND_URL || 'https://substate.vercel.app'}/dashboard" class="cta-button">
          Get Started Now →
        </a>
      </div>

      <div class="message" style="margin-top: 32px;">
        If you have any questions or need assistance, our support team is here to help!
      </div>

      <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
        Best regards,<br>
        <strong style="color: #111827;">The SUBSTATE Team</strong>
      </div>
    </div>

    ${getEmailFooter()}
  `);
};

/**
 * Email Verification Template
 * @param {Object} user - User object
 * @param {string} verificationUrl - Verification link
 */
export const getEmailVerificationTemplate = (user, verificationUrl) => {
  return wrapEmailContent('Verify Your Email - SUBSTATE', `
    ${getEmailHeader('📧 Verify Your Email', '#f97316')}
    
    <div class="content">
      <div class="greeting">Hi ${user.name}!</div>
      
      <div class="message">
        Thank you for signing up with <strong>SUBSTATE</strong>! To complete your registration and 
        secure your account, please verify your email address by clicking the button below.
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${verificationUrl}" class="cta-button" style="background: #10b981;">
          Verify Email Address
        </a>
      </div>

      <div class="message" style="font-size: 14px; color: #6b7280;">
        This verification link will expire in 24 hours. If you didn't create an account with SUBSTATE, 
        you can safely ignore this email.
      </div>

      <div class="message" style="margin-top: 24px; font-size: 14px; color: #6b7280;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${verificationUrl}" style="color: #f97316; word-break: break-all;">${verificationUrl}</a>
      </div>
    </div>

    ${getEmailFooter()}
  `);
};

/**
 * Password Reset Email Template
 * @param {Object} user - User object
 * @param {string} resetUrl - Password reset link
 */
export const getPasswordResetEmail = (user, resetUrl) => {
  return wrapEmailContent('Reset Your Password - SUBSTATE', `
    ${getEmailHeader('🔐 Reset Your Password', '#f97316')}
    
    <div class="content">
      <div class="greeting">Hi ${user.name}!</div>
      
      <div class="message">
        We received a request to reset your password for your <strong>SUBSTATE</strong> account. 
        Click the button below to create a new password.
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" class="cta-button" style="background: #dc2626;">
          Reset Password
        </a>
      </div>

      <div class="message" style="font-size: 14px; color: #6b7280;">
        This password reset link will expire in 1 hour. If you didn't request a password reset, 
        you can safely ignore this email - your password will remain unchanged.
      </div>

      <div class="message" style="margin-top: 24px; font-size: 14px; color: #6b7280;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #f97316; word-break: break-all;">${resetUrl}</a>
      </div>
    </div>

    ${getEmailFooter()}
  `);
};

/**
 * Discount Coupon Email Template
 * @param {Object} user - User object
 * @param {Object} couponData - Coupon details { code, discount, validUntil }
 */
export const getDiscountCouponEmail = (user, couponData) => {
  const { code, discount, validUntil } = couponData;
  const validDate = new Date(validUntil).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Special Discount Just for You!</title>
      ${getBaseEmailStyles()}
      <style>
        .coupon-box {
          background: linear-gradient(135deg, #fff5f0 0%, #ffe8dc 100%);
          border: 3px dashed #f97316;
          border-radius: 16px;
          padding: 32px;
          text-align: center;
          margin: 32px 0;
          position: relative;
          overflow: hidden;
        }
        .coupon-box::before {
          content: '🎁';
          position: absolute;
          top: -20px;
          right: -20px;
          font-size: 120px;
          opacity: 0.1;
        }
        .discount-badge {
          display: inline-block;
          background: #f97316;
          color: white;
          font-size: 48px;
          font-weight: 900;
          padding: 20px 40px;
          border-radius: 12px;
          margin-bottom: 20px;
          box-shadow: 0 8px 24px rgba(249, 115, 22, 0.3);
          letter-spacing: -2px;
        }
        .coupon-code {
          background: white;
          border: 2px solid #f97316;
          border-radius: 10px;
          padding: 16px 24px;
          font-size: 24px;
          font-weight: 700;
          color: #f97316;
          letter-spacing: 2px;
          font-family: 'Courier New', monospace;
          margin: 20px 0;
          display: inline-block;
        }
        .validity-info {
          font-size: 14px;
          color: #6b7280;
          margin-top: 16px;
        }
        .benefits-list {
          background: #f9fafb;
          border-radius: 12px;
          padding: 24px;
          margin: 24px 0;
        }
        .benefit-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
          font-size: 15px;
          color: #374151;
        }
        .benefit-item:last-child {
          margin-bottom: 0;
        }
        .benefit-icon {
          font-size: 20px;
          flex-shrink: 0;
        }
        .cta-button {
          display: inline-block;
          background: #f97316;
          color: white;
          padding: 16px 40px;
          border-radius: 10px;
          text-decoration: none;
          font-weight: 700;
          font-size: 16px;
          margin: 24px 0;
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);
          transition: all 0.3s ease;
        }
        .cta-button:hover {
          background: #ea580c;
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(249, 115, 22, 0.4);
        }
        .how-to-use {
          background: #eff6ff;
          border-left: 4px solid #3b82f6;
          padding: 20px;
          border-radius: 8px;
          margin: 24px 0;
        }
        .how-to-use h3 {
          color: #1e40af;
          font-size: 16px;
          margin-bottom: 12px;
        }
        .how-to-use ol {
          margin-left: 20px;
          color: #374151;
        }
        .how-to-use li {
          margin-bottom: 8px;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        ${getEmailHeader('🎉 Special Discount Just for You!', '#f97316')}
        
        <div class="content">
          <div class="greeting">Hi ${user.name}! 👋</div>
          
          <div class="message">
            We appreciate you being part of the SUBSTATE community! As a token of our appreciation, 
            we're excited to offer you an <strong>exclusive discount</strong> on your next subscription upgrade.
          </div>

          <div class="coupon-box">
            <div class="discount-badge">${discount}% OFF</div>
            <div style="font-size: 18px; color: #111827; font-weight: 600; margin-bottom: 12px;">
              Your Exclusive Coupon Code
            </div>
            <div class="coupon-code">${code}</div>
            <div class="validity-info">
              ⏰ Valid until ${validDate}
            </div>
          </div>

          <div class="benefits-list">
            <div style="font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 16px;">
              What You Get:
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">✨</span>
              <span><strong>${discount}% discount</strong> on Professional or Enterprise plans</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">🚀</span>
              <span>Unlimited content generation and campaign automation</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">📊</span>
              <span>Advanced analytics and revenue intelligence</span>
            </div>
            <div class="benefit-item">
              <span class="benefit-icon">🎯</span>
              <span>Priority support and dedicated account manager</span>
            </div>
          </div>

          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/subscription" class="cta-button">
              Claim Your Discount Now →
            </a>
          </div>

          <div class="how-to-use">
            <h3>📝 How to Redeem:</h3>
            <ol>
              <li>Visit your subscription page</li>
              <li>Select Professional or Enterprise plan</li>
              <li>Enter coupon code <strong>${code}</strong> at checkout</li>
              <li>Enjoy your ${discount}% discount!</li>
            </ol>
          </div>

          <div class="message" style="margin-top: 32px; font-size: 14px; color: #6b7280;">
            <strong>Note:</strong> This coupon is valid for one-time use only and expires on ${validDate}. 
            Don't miss out on this exclusive offer!
          </div>

          <div class="message" style="margin-top: 24px;">
            If you have any questions or need assistance, our support team is here to help!
          </div>

          <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            Best regards,<br>
            <strong style="color: #111827;">The SUBSTATE Team</strong>
          </div>
        </div>

        ${getEmailFooter()}
      </div>
    </body>
    </html>
  `;
};
