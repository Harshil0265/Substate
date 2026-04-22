// Email template utilities with proper logo display

/**
 * Get the logo URL for emails
 * Priority: 1. Deployed frontend URL, 2. Environment variable, 3. Data URI fallback
 */
export const getLogoUrl = () => {
  // Use your deployed frontend URL from environment variable
  const frontendUrl = process.env.FRONTEND_URL || process.env.VITE_API_URL;
  
  if (frontendUrl && !frontendUrl.includes('localhost')) {
    // Use the deployed URL
    return `${frontendUrl}/substate-icon.svg`;
  }
  
  // Fallback: Use a data URI or emoji icon
  // You can replace this with your actual SVG data URI
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHJ4PSI4IiBmaWxsPSIjZjk3MzE2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIj7wn5OKPC90ZXh0Pjwvc3ZnPg==';
};

/**
 * Generate email header with SUBSTATE logo and brand name
 * @param {string} title - Header title
 * @param {string} bgColor - Background color (default: #f97316)
 */
export const getEmailHeader = (title, bgColor = '#f97316') => {
  const logoUrl = getLogoUrl();
  
  return `
    <div class="header" style="background: ${bgColor}; padding: 48px 40px; text-align: center; position: relative;">
      <div class="brand-logo" style="display: inline-flex; align-items: center; gap: 16px; margin-bottom: 20px; background: rgba(255, 255, 255, 0.15); padding: 12px 24px; border-radius: 12px; backdrop-filter: blur(10px);">
        <div class="logo-icon" style="width: 48px; height: 48px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; padding: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
          <img src="${logoUrl}" alt="SUBSTATE" style="width: 100%; height: 100%; object-fit: contain; display: block;" onerror="this.parentElement.innerHTML='<span style=\\'font-size: 24px;\\'>📊</span>'" />
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
