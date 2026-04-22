import EmailService from './EmailService.js';
import Campaign from '../models/Campaign.js';
import User from '../models/User.js';

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
    
    if (htmlContent) {
      // Add open tracking pixel
      htmlContent += `<img src="${process.env.VITE_API_URL || 'http://localhost:3000'}/api/campaigns/${campaign._id}/track/open/${trackingId}" width="1" height="1" style="display:none;" />`;
      
      // Add click tracking to links
      htmlContent = htmlContent.replace(
        /<a\s+href="([^"]+)"/g,
        `<a href="${process.env.VITE_API_URL || 'http://localhost:3000'}/api/campaigns/${campaign._id}/track/click/${trackingId}?url=$1"`
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
      if (!campaign) return;
      
      campaign.opensCount = (campaign.opensCount || 0) + 1;
      await campaign.save();
      
      // Log the open event
      console.log(`Email opened - Campaign: ${campaignId}, Tracking: ${trackingId}`);
      
    } catch (error) {
      console.error('Error tracking email open:', error);
    }
  }
  
  // Track email clicks
  async trackEmailClick(campaignId, trackingId, targetUrl) {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) return targetUrl;
      
      campaign.clicksCount = (campaign.clicksCount || 0) + 1;
      await campaign.save();
      
      // Log the click event
      console.log(`Email clicked - Campaign: ${campaignId}, Tracking: ${trackingId}, URL: ${targetUrl}`);
      
      return targetUrl;
      
    } catch (error) {
      console.error('Error tracking email click:', error);
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
}

export default new EmailCampaignService();