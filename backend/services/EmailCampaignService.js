import EmailService from './EmailService.js';
import Campaign from '../models/Campaign.js';
import User from '../models/User.js';
import AIContentGenerator from './AIContentGenerator.js';

class EmailCampaignService {
  
  // Send email campaign to recipients
  async sendEmailCampaign(campaignId, userId) {
    try {
      const campaign = await Campaign.findById(campaignId);
      
      if (!campaign || campaign.userId.toString() !== userId) {
        throw new Error('Campaign not found or unauthorized');
      }
      
      if (campaign.campaignType !== 'EMAIL') {
        throw new Error('Not an email campaign');
      }
      
      const emailData = campaign.campaignData?.email;
      if (!emailData || !emailData.emailList?.length) {
        throw new Error('No email recipients found');
      }
      
      const results = {
        sent: 0,
        failed: 0,
        errors: []
      };
      
      // Send emails with throttling
      const throttleRate = emailData.deliverySettings?.throttleRate || 100;
      const batchSize = Math.min(10, throttleRate); // Process in batches
      
      for (let i = 0; i < emailData.emailList.length; i += batchSize) {
        const batch = emailData.emailList.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (recipient) => {
          try {
            await this.sendSingleEmail(campaign, recipient);
            results.sent++;
          } catch (error) {
            results.failed++;
            results.errors.push({
              email: recipient.email,
              error: error.message
            });
          }
        });
        
        await Promise.all(batchPromises);
        
        // Throttle between batches (if not the last batch)
        if (i + batchSize < emailData.emailList.length) {
          const delayMs = (60 * 1000) / (throttleRate / batchSize); // Convert hourly rate to delay
          await new Promise(resolve => setTimeout(resolve, delayMs));
        }
      }
      
      // Update campaign metrics
      campaign.emailsSent += results.sent;
      campaign.status = results.sent > 0 ? 'RUNNING' : 'PAUSED';
      
      // Initialize delivery stats if not exists
      if (!campaign.campaignData.email.deliveryStats) {
        campaign.campaignData.email.deliveryStats = {
          totalSent: 0,
          delivered: 0,
          bounced: 0,
          deliveryRate: 0,
          bounceRate: 0
        };
      }
      
      campaign.campaignData.email.deliveryStats.totalSent += results.sent;
      campaign.campaignData.email.deliveryStats.delivered += results.sent - results.failed;
      campaign.campaignData.email.deliveryStats.bounced += results.failed;
      
      // Calculate rates
      const stats = campaign.campaignData.email.deliveryStats;
      stats.deliveryRate = stats.totalSent > 0 ? (stats.delivered / stats.totalSent) * 100 : 0;
      stats.bounceRate = stats.totalSent > 0 ? (stats.bounced / stats.totalSent) * 100 : 0;
      
      await campaign.save();
      
      return {
        success: true,
        results,
        campaign: {
          id: campaign._id,
          emailsSent: campaign.emailsSent,
          status: campaign.status,
          deliveryStats: stats
        }
      };
      
    } catch (error) {
      console.error('Email campaign send error:', error);
      throw error;
    }
  }
  
  // Send single email with personalization
  async sendSingleEmail(campaign, recipient) {
    const emailData = campaign.campaignData.email;
    
    // Personalize content
    let subject = emailData.emailTemplate.subject;
    let htmlContent = emailData.emailTemplate.htmlContent;
    let textContent = emailData.emailTemplate.textContent;
    
    // Replace placeholders
    const replacements = {
      '{{name}}': recipient.name || 'Valued Customer',
      '{{email}}': recipient.email,
      '{{campaign_title}}': campaign.title,
      ...recipient.customFields
    };
    
    Object.entries(replacements).forEach(([placeholder, value]) => {
      subject = subject?.replace(new RegExp(placeholder, 'g'), value);
      htmlContent = htmlContent?.replace(new RegExp(placeholder, 'g'), value);
      textContent = textContent?.replace(new RegExp(placeholder, 'g'), value);
    });
    
    // Add tracking pixels and links
    const trackingId = `${campaign._id}_${recipient.email}_${Date.now()}`;
    const baseUrl = process.env.API_URL || process.env.BACKEND_URL || 'http://localhost:3000';
    
    if (htmlContent) {
      // Add open tracking pixel
      htmlContent += `<img src="${baseUrl}/api/campaigns/${campaign._id}/track/open/${trackingId}" width="1" height="1" style="display:none;" />`;
      
      // Add click tracking to links
      htmlContent = htmlContent.replace(
        /<a\s+href="([^"]+)"/g,
        `<a href="${baseUrl}/api/campaigns/${campaign._id}/track/click/${trackingId}?url=$1"`
      );
    }
    
    const mailOptions = {
      from: `${emailData.senderInfo?.fromName || 'SUBSTATE'} <${emailData.senderInfo?.fromEmail || process.env.EMAIL_FROM}>`,
      to: recipient.email,
      replyTo: emailData.senderInfo?.replyTo,
      subject: subject,
      html: htmlContent,
      text: textContent,
      headers: {
        'X-Campaign-ID': campaign._id.toString(),
        'X-Tracking-ID': trackingId
      }
    };
    
    return await EmailService.sendEmail(mailOptions);
  }
  
  // Track email opens
  async trackEmailOpen(campaignId, trackingId) {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        console.log(`❌ Campaign not found for tracking: ${campaignId}`);
        return;
      }
      
      // Increment opens count
      campaign.opensCount = (campaign.opensCount || 0) + 1;
      
      // Update campaign status if it's still in DRAFT or SCHEDULED
      if (campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') {
        campaign.status = 'RUNNING';
      }
      
      // Update analytics timestamp
      campaign.updatedAt = new Date();
      
      // Save with validation disabled to ensure tracking always works
      await campaign.save({ validateBeforeSave: false });
      
      // Log the open event
      console.log(`✅ Email opened - Campaign: ${campaign.title} (${campaignId}), Opens: ${campaign.opensCount}, Tracking: ${trackingId}`);
      
      return { success: true, opensCount: campaign.opensCount };
      
    } catch (error) {
      console.error('❌ Error tracking email open:', error);
      throw error;
    }
  }
  
  // Track email clicks
  async trackEmailClick(campaignId, trackingId, targetUrl) {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        console.log(`❌ Campaign not found for tracking: ${campaignId}`);
        return targetUrl;
      }
      
      // Increment clicks count
      campaign.clicksCount = (campaign.clicksCount || 0) + 1;
      
      // Update campaign status if it's still in DRAFT or SCHEDULED
      if (campaign.status === 'DRAFT' || campaign.status === 'SCHEDULED') {
        campaign.status = 'RUNNING';
      }
      
      // Update analytics timestamp
      campaign.updatedAt = new Date();
      
      // Save with validation disabled to ensure tracking always works
      await campaign.save({ validateBeforeSave: false });
      
      // Log the click event
      console.log(`✅ Email clicked - Campaign: ${campaign.title} (${campaignId}), Clicks: ${campaign.clicksCount}, Tracking: ${trackingId}, URL: ${targetUrl}`);
      
      return targetUrl;
      
    } catch (error) {
      console.error('❌ Error tracking email click:', error);
      return targetUrl;
    }
  }
  
  // Import email list from CSV
  async importEmailList(csvData, campaignId, userId) {
    try {
      const campaign = await Campaign.findById(campaignId);
      
      if (!campaign || campaign.userId.toString() !== userId) {
        throw new Error('Campaign not found or unauthorized');
      }
      
      // Parse CSV data
      const lines = csvData.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const emailIndex = headers.findIndex(h => h.includes('email'));
      const nameIndex = headers.findIndex(h => h.includes('name'));
      
      if (emailIndex === -1) {
        throw new Error('CSV must contain an email column');
      }
      
      const emailList = [];
      const errors = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const email = values[emailIndex];
        
        if (!email || !this.isValidEmail(email)) {
          errors.push(`Line ${i + 1}: Invalid email "${email}"`);
          continue;
        }
        
        const recipient = {
          email: email,
          name: nameIndex >= 0 ? values[nameIndex] : '',
          tags: [],
          customFields: {}
        };
        
        // Add other fields as custom fields
        headers.forEach((header, index) => {
          if (index !== emailIndex && index !== nameIndex && values[index]) {
            recipient.customFields[header] = values[index];
          }
        });
        
        emailList.push(recipient);
      }
      
      // Update campaign with new email list
      if (!campaign.campaignData) campaign.campaignData = {};
      if (!campaign.campaignData.email) campaign.campaignData.email = {};
      
      campaign.campaignData.email.emailList = [
        ...(campaign.campaignData.email.emailList || []),
        ...emailList
      ];
      
      await campaign.save();
      
      return {
        success: true,
        imported: emailList.length,
        errors: errors,
        totalRecipients: campaign.campaignData.email.emailList.length
      };
      
    } catch (error) {
      console.error('Email list import error:', error);
      throw error;
    }
  }
  
  // Validate email address
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  // Get email campaign analytics
  async getEmailCampaignAnalytics(campaignId, userId) {
    try {
      const campaign = await Campaign.findById(campaignId);
      
      if (!campaign || campaign.userId.toString() !== userId) {
        throw new Error('Campaign not found or unauthorized');
      }
      
      if (campaign.campaignType !== 'EMAIL') {
        throw new Error('Not an email campaign');
      }
      
      const emailData = campaign.campaignData?.email;
      const deliveryStats = emailData?.deliveryStats || {};
      
      return {
        campaign: {
          id: campaign._id,
          title: campaign.title,
          status: campaign.status
        },
        recipients: {
          total: emailData?.emailList?.length || 0,
          sent: campaign.emailsSent || 0,
          delivered: deliveryStats.delivered || 0,
          bounced: deliveryStats.bounced || 0
        },
        engagement: {
          opens: campaign.opensCount || 0,
          clicks: campaign.clicksCount || 0,
          conversions: campaign.conversionCount || 0,
          openRate: campaign.emailsSent > 0 ? ((campaign.opensCount || 0) / campaign.emailsSent) * 100 : 0,
          clickRate: (campaign.opensCount || 0) > 0 ? ((campaign.clicksCount || 0) / (campaign.opensCount || 0)) * 100 : 0,
          conversionRate: (campaign.clicksCount || 0) > 0 ? ((campaign.conversionCount || 0) / (campaign.clicksCount || 0)) * 100 : 0
        },
        delivery: {
          deliveryRate: deliveryStats.deliveryRate || 0,
          bounceRate: deliveryStats.bounceRate || 0
        },
        roi: {
          investment: campaign.roi?.investment || 0,
          revenue: campaign.roi?.revenue || 0,
          roiPercentage: campaign.roi?.roiPercentage || 0
        }
      };
      
    } catch (error) {
      console.error('Email campaign analytics error:', error);
      throw error;
    }
  }
  
  // Schedule email campaign
  async scheduleEmailCampaign(campaignId, userId, scheduledTime) {
    try {
      const campaign = await Campaign.findById(campaignId);
      
      if (!campaign || campaign.userId.toString() !== userId) {
        throw new Error('Campaign not found or unauthorized');
      }
      
      if (campaign.campaignType !== 'EMAIL') {
        throw new Error('Not an email campaign');
      }
      
      const scheduledDate = new Date(scheduledTime);
      if (scheduledDate <= new Date()) {
        throw new Error('Scheduled time must be in the future');
      }
      
      // Update campaign with scheduled send time
      if (!campaign.campaignData.email.deliverySettings) {
        campaign.campaignData.email.deliverySettings = {};
      }
      
      campaign.campaignData.email.deliverySettings.sendImmediately = false;
      campaign.campaignData.email.deliverySettings.scheduledSendTime = scheduledDate;
      campaign.status = 'SCHEDULED';
      
      await campaign.save();
      
      return {
        success: true,
        scheduledTime: scheduledDate,
        campaign: {
          id: campaign._id,
          status: campaign.status
        }
      };
      
    } catch (error) {
      console.error('Email campaign scheduling error:', error);
      throw error;
    }
  }

  /**
   * Auto-generate email template using AI based on campaign title and description
   * @param {string} campaignId - Campaign ID
   * @param {string} userId - User ID
   * @param {Object} options - Generation options (tone, style, includeImages)
   * @returns {Object} - Generated email template
   */
  async generateEmailTemplate(campaignId, userId, options = {}) {
    try {
      const campaign = await Campaign.findById(campaignId);
      
      if (!campaign || campaign.userId.toString() !== userId) {
        throw new Error('Campaign not found or unauthorized');
      }
      
      if (campaign.campaignType !== 'EMAIL') {
        throw new Error('Not an email campaign');
      }
      
      if (!campaign.title || !campaign.description) {
        throw new Error('Campaign must have title and description for template generation');
      }
      
      console.log(`🤖 Auto-generating email template for campaign: ${campaign.title}`);
      
      // Initialize AI generator
      const aiGenerator = new AIContentGenerator();
      
      // Generate email template
      const template = await aiGenerator.generateEmailTemplate(
        campaign.title,
        campaign.description,
        {
          tone: options.tone || 'professional',
          style: options.style || 'modern',
          includeImages: options.includeImages !== false
        }
      );
      
      // Update campaign with generated template
      if (!campaign.campaignData) campaign.campaignData = {};
      if (!campaign.campaignData.email) campaign.campaignData.email = {};
      
      campaign.campaignData.email.emailTemplate = {
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        previewText: template.previewText
      };
      
      // Mark as AI-generated
      campaign.campaignData.email.templateGenerated = {
        isAIGenerated: true,
        generatedAt: new Date(),
        options: options
      };
      
      await campaign.save();
      
      console.log(`✅ Email template generated and saved for campaign: ${campaign.title}`);
      
      return {
        success: true,
        template: template,
        campaign: {
          id: campaign._id,
          title: campaign.title
        }
      };
      
    } catch (error) {
      console.error('❌ Email template generation error:', error);
      throw error;
    }
  }

  /**
   * Regenerate email template with different options
   * @param {string} campaignId - Campaign ID
   * @param {string} userId - User ID
   * @param {Object} options - New generation options
   * @returns {Object} - Regenerated email template
   */
  async regenerateEmailTemplate(campaignId, userId, options = {}) {
    console.log(`🔄 Regenerating email template for campaign: ${campaignId}`);
    return await this.generateEmailTemplate(campaignId, userId, options);
  }
}

export default new EmailCampaignService();