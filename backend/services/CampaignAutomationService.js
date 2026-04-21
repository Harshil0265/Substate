import Campaign from '../models/Campaign.js';
import Article from '../models/Article.js';
import EmailService from './EmailService.js';
import User from '../models/User.js';
import cron from 'node-cron';

class CampaignAutomationService {
  constructor() {
    this.scheduledJobs = new Map();
  }

  /**
   * Start the automation service
   */
  start() {
    console.log('🤖 Campaign Automation Service started');
    
    // Check for scheduled articles every hour
    cron.schedule('0 * * * *', () => {
      this.processScheduledArticles();
    });
    
    // Update campaign analytics every 6 hours
    cron.schedule('0 */6 * * *', () => {
      this.updateAllCampaignAnalytics();
    });
    
    // Check campaign milestones daily
    cron.schedule('0 9 * * *', () => {
      this.checkCampaignMilestones();
    });
    
    // Process auto-scheduling daily at midnight
    cron.schedule('0 0 * * *', () => {
      this.processAutoScheduling();
    });
  }

  /**
   * Process scheduled articles and publish them
   */
  async processScheduledArticles() {
    try {
      const now = new Date();
      const scheduledArticles = await Article.find({
        autoPublish: true,
        status: 'DRAFT',
        scheduledPublishAt: { $lte: now }
      });

      console.log(`📅 Processing ${scheduledArticles.length} scheduled articles`);

      for (const article of scheduledArticles) {
        try {
          article.status = 'PUBLISHED';
          article.publishedAt = new Date();
          await article.save();

          // Update campaign article count
          if (article.campaignId) {
            await Campaign.findByIdAndUpdate(article.campaignId, {
              $inc: { articlesGenerated: 1 }
            });
          }

          console.log(`✅ Published article: ${article.title}`);
        } catch (error) {
          console.error(`❌ Failed to publish article ${article._id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Error processing scheduled articles:', error);
    }
  }

  /**
   * Update analytics for all active campaigns
   */
  async updateAllCampaignAnalytics() {
    try {
      const activeCampaigns = await Campaign.find({
        status: { $in: ['RUNNING', 'SCHEDULED'] }
      });

      console.log(`📊 Updating analytics for ${activeCampaigns.length} campaigns`);

      for (const campaign of activeCampaigns) {
        try {
          await campaign.updateAnalytics();
          campaign.calculateROI();
          await campaign.save();
        } catch (error) {
          console.error(`❌ Failed to update campaign ${campaign._id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Error updating campaign analytics:', error);
    }
  }

  /**
   * Check campaign milestones and send notifications
   */
  async checkCampaignMilestones() {
    try {
      const activeCampaigns = await Campaign.find({
        status: { $in: ['RUNNING', 'SCHEDULED'] },
        'notifications.milestones.enabled': true
      }).populate('userId');

      console.log(`🎯 Checking milestones for ${activeCampaigns.length} campaigns`);

      for (const campaign of activeCampaigns) {
        try {
          const milestones = campaign.checkMilestones();
          
          if (milestones.length > 0 && campaign.notifications.emailAlerts.onMilestone) {
            await this.sendMilestoneNotification(campaign, milestones);
            await campaign.save();
          }
        } catch (error) {
          console.error(`❌ Failed to check milestones for campaign ${campaign._id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Error checking campaign milestones:', error);
    }
  }

  /**
   * Process auto-scheduling for campaigns
   */
  async processAutoScheduling() {
    try {
      const campaigns = await Campaign.find({
        'autoScheduling.enabled': true,
        status: 'RUNNING'
      });

      console.log(`⏰ Processing auto-scheduling for ${campaigns.length} campaigns`);

      for (const campaign of campaigns) {
        try {
          const nextDate = campaign.getNextScheduledDate();
          
          if (nextDate) {
            campaign.autoScheduling.nextScheduledDate = nextDate;
            await campaign.save();
            
            // Create a scheduled article if needed
            await this.createScheduledArticle(campaign, nextDate);
          }
        } catch (error) {
          console.error(`❌ Failed to process auto-scheduling for campaign ${campaign._id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Error processing auto-scheduling:', error);
    }
  }

  /**
   * Create a scheduled article for a campaign
   */
  async createScheduledArticle(campaign, scheduledDate) {
    try {
      // Check if there's already a scheduled article for this date
      const existingArticle = await Article.findOne({
        campaignId: campaign._id,
        scheduledPublishAt: scheduledDate
      });

      if (existingArticle) {
        console.log(`Article already scheduled for ${scheduledDate}`);
        return;
      }

      // Create a new article with AI-generated content
      const article = new Article({
        userId: campaign.userId,
        campaignId: campaign._id,
        title: `${campaign.title} - ${scheduledDate.toLocaleDateString()}`,
        content: 'Auto-generated content placeholder',
        excerpt: `Scheduled article for ${campaign.title}`,
        status: 'DRAFT',
        autoPublish: true,
        scheduledPublishAt: scheduledDate,
        aiGenerated: true
      });

      await article.save();
      console.log(`✅ Created scheduled article for campaign ${campaign.title}`);
    } catch (error) {
      console.error('Error creating scheduled article:', error);
    }
  }

  /**
   * Send milestone notification email
   */
  async sendMilestoneNotification(campaign, milestones) {
    try {
      const user = await User.findById(campaign.userId);
      if (!user) return;

      const subject = `🎯 Campaign Milestone Reached: ${campaign.title}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">Campaign Milestone Achieved! 🎉</h2>
          
          <p>Great news! Your campaign "<strong>${campaign.title}</strong>" has reached important milestones:</p>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Milestones Reached:</h3>
            <ul>
              ${milestones.map(m => `<li><strong>${m}%</strong> progress</li>`).join('')}
            </ul>
          </div>
          
          <h3>Campaign Performance:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Articles Generated:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${campaign.articlesGenerated}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Total Views:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${campaign.analytics.totalViews}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Engagement Rate:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${campaign.engagementRate.toFixed(2)}%</td>
            </tr>
            <tr>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>ROI:</strong></td>
              <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${campaign.roi.roiPercentage.toFixed(2)}%</td>
            </tr>
          </table>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.FRONTEND_URL}/dashboard/campaigns" 
               style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Campaign Dashboard
            </a>
          </div>
          
          <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            Keep up the great work! 🚀
          </p>
        </div>
      `;

      await EmailService.sendEmail(user.email, subject, html);
      console.log(`✅ Milestone notification sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending milestone notification:', error);
    }
  }

  /**
   * Send campaign start notification
   */
  async sendCampaignStartNotification(campaign) {
    try {
      const user = await User.findById(campaign.userId);
      if (!user || !campaign.notifications.emailAlerts.onStart) return;

      const subject = `🚀 Campaign Started: ${campaign.title}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10b981;">Your Campaign is Now Live! 🚀</h2>
          
          <p>Your campaign "<strong>${campaign.title}</strong>" has started successfully.</p>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Campaign Details:</h3>
            <ul>
              <li><strong>Type:</strong> ${campaign.campaignType}</li>
              <li><strong>Target Audience:</strong> ${campaign.targetAudience}</li>
              <li><strong>Duration:</strong> ${campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A'} - ${campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'N/A'}</li>
              <li><strong>Auto-Scheduling:</strong> ${campaign.autoScheduling.enabled ? 'Enabled' : 'Disabled'}</li>
            </ul>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.FRONTEND_URL}/dashboard/campaigns" 
               style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Campaign
            </a>
          </div>
        </div>
      `;

      await EmailService.sendEmail(user.email, subject, html);
    } catch (error) {
      console.error('Error sending campaign start notification:', error);
    }
  }

  /**
   * Send campaign completion notification
   */
  async sendCampaignCompletionNotification(campaign) {
    try {
      const user = await User.findById(campaign.userId);
      if (!user || !campaign.notifications.emailAlerts.onComplete) return;

      const subject = `✅ Campaign Completed: ${campaign.title}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6b7280;">Campaign Completed! 🎉</h2>
          
          <p>Your campaign "<strong>${campaign.title}</strong>" has been completed.</p>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Final Results:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Articles Generated:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${campaign.articlesGenerated}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Total Views:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${campaign.analytics.totalViews}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Engagement Rate:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${campaign.engagementRate.toFixed(2)}%</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Conversions:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${campaign.conversionCount}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>ROI:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; color: ${campaign.roi.roiPercentage >= 0 ? '#10b981' : '#ef4444'};">
                  ${campaign.roi.roiPercentage.toFixed(2)}%
                </td>
              </tr>
              <tr>
                <td style="padding: 10px;"><strong>Revenue Generated:</strong></td>
                <td style="padding: 10px; color: #10b981;">$${campaign.roi.revenue.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.FRONTEND_URL}/dashboard/campaigns" 
               style="background: #6b7280; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Full Report
            </a>
          </div>
        </div>
      `;

      await EmailService.sendEmail(user.email, subject, html);
    } catch (error) {
      console.error('Error sending campaign completion notification:', error);
    }
  }

  /**
   * Update A/B test results
   */
  async updateABTestResults(campaignId, variantName, action) {
    try {
      const campaign = await Campaign.findById(campaignId);
      if (!campaign || !campaign.abTesting.enabled) return;

      const variant = campaign.abTesting.variants.find(v => v.name === variantName);
      if (!variant) return;

      switch (action) {
        case 'impression':
          variant.impressions++;
          break;
        case 'click':
          variant.clicks++;
          break;
        case 'conversion':
          variant.conversions++;
          break;
      }

      // Calculate conversion rate
      if (variant.impressions > 0) {
        variant.conversionRate = (variant.conversions / variant.impressions) * 100;
      }

      await campaign.save();

      // Determine winning variant if test duration is complete
      await this.determineWinningVariant(campaign);
    } catch (error) {
      console.error('Error updating A/B test results:', error);
    }
  }

  /**
   * Determine winning variant in A/B test
   */
  async determineWinningVariant(campaign) {
    try {
      if (!campaign.abTesting.enabled || campaign.abTesting.winningVariant) return;

      const testStartDate = new Date(campaign.startDate);
      const testEndDate = new Date(testStartDate);
      testEndDate.setDate(testEndDate.getDate() + campaign.abTesting.testDuration);

      if (new Date() < testEndDate) return; // Test not complete yet

      // Find variant with highest conversion rate
      let winningVariant = null;
      let highestRate = 0;

      for (const variant of campaign.abTesting.variants) {
        if (variant.conversionRate > highestRate) {
          highestRate = variant.conversionRate;
          winningVariant = variant.name;
        }
      }

      if (winningVariant) {
        campaign.abTesting.winningVariant = winningVariant;
        await campaign.save();

        // Send notification about winning variant
        const user = await User.findById(campaign.userId);
        if (user) {
          await this.sendABTestResultsNotification(campaign, user);
        }
      }
    } catch (error) {
      console.error('Error determining winning variant:', error);
    }
  }

  /**
   * Send A/B test results notification
   */
  async sendABTestResultsNotification(campaign, user) {
    try {
      const winningVariant = campaign.abTesting.variants.find(
        v => v.name === campaign.abTesting.winningVariant
      );

      const subject = `🏆 A/B Test Results: ${campaign.title}`;
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">A/B Test Complete! 🏆</h2>
          
          <p>Your A/B test for "<strong>${campaign.title}</strong>" has completed.</p>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Winning Variant: ${winningVariant.name}</h3>
            <p><strong>Conversion Rate:</strong> ${winningVariant.conversionRate.toFixed(2)}%</p>
          </div>
          
          <h3>All Variants Performance:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 10px; text-align: left;">Variant</th>
                <th style="padding: 10px; text-align: right;">Impressions</th>
                <th style="padding: 10px; text-align: right;">Clicks</th>
                <th style="padding: 10px; text-align: right;">Conversions</th>
                <th style="padding: 10px; text-align: right;">Rate</th>
              </tr>
            </thead>
            <tbody>
              ${campaign.abTesting.variants.map(v => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px;">${v.name} ${v.name === winningVariant.name ? '🏆' : ''}</td>
                  <td style="padding: 10px; text-align: right;">${v.impressions}</td>
                  <td style="padding: 10px; text-align: right;">${v.clicks}</td>
                  <td style="padding: 10px; text-align: right;">${v.conversions}</td>
                  <td style="padding: 10px; text-align: right;">${v.conversionRate.toFixed(2)}%</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="${process.env.FRONTEND_URL}/dashboard/campaigns" 
               style="background: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Full Results
            </a>
          </div>
        </div>
      `;

      await EmailService.sendEmail(user.email, subject, html);
    } catch (error) {
      console.error('Error sending A/B test results notification:', error);
    }
  }

  /**
   * Create campaign from template
   */
  async createFromTemplate(templateId, userId, customizations = {}) {
    try {
      const template = await Campaign.findOne({
        _id: templateId,
        'template.isTemplate': true
      });

      if (!template) {
        throw new Error('Template not found');
      }

      // Create new campaign from template
      const campaignData = template.toObject();
      delete campaignData._id;
      delete campaignData.createdAt;
      delete campaignData.updatedAt;
      
      campaignData.userId = userId;
      campaignData.template.isTemplate = false;
      campaignData.status = 'DRAFT';
      
      // Apply customizations
      Object.assign(campaignData, customizations);
      
      const newCampaign = new Campaign(campaignData);
      await newCampaign.save();
      
      // Update template usage count
      template.template.usageCount++;
      await template.save();
      
      return newCampaign;
    } catch (error) {
      console.error('Error creating campaign from template:', error);
      throw error;
    }
  }
}

export default new CampaignAutomationService();
