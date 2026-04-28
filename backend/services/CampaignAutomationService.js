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
    
    // Check for scheduled EMAIL campaigns every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.processScheduledEmailCampaigns();
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
   * Process scheduled articles and publish them (including WordPress)
   */
  async processScheduledArticles() {
    try {
      const now = new Date();
      const scheduledArticles = await Article.find({
        autoPublish: true,
        status: 'DRAFT',
        scheduledPublishAt: { $lte: now }
      }).populate('campaignId');

      console.log(`📅 Processing ${scheduledArticles.length} scheduled articles`);

      for (const article of scheduledArticles) {
        try {
          // Publish the article
          article.status = 'PUBLISHED';
          article.publishedAt = new Date();
          await article.save();

          console.log(`✅ Published article: ${article.title}`);

          // Update campaign article count
          if (article.campaignId) {
            await Campaign.findByIdAndUpdate(article.campaignId._id, {
              $inc: { articlesGenerated: 1 }
            });
          }

          // Auto-publish to WordPress if configured
          if (article.autoPublishToWordPress && article.campaignId) {
            const campaign = article.campaignId;
            
            if (campaign.campaignData?.content?.publishDestination === 'WORDPRESS' && 
                campaign.campaignData?.content?.wordpressConfig?.isConnected) {
              
              console.log(`📤 Auto-publishing to WordPress: ${article.title}`);
              
              try {
                // Import WordPress service dynamically
                const WordPressService = (await import('./WordPressService.js')).default;
                
                const wpConfig = campaign.campaignData.content.wordpressConfig;
                const result = await WordPressService.publishArticle(
                  article._id.toString(),
                  article.userId.toString(),
                  {
                    url: wpConfig.url,
                    username: wpConfig.username,
                    appPassword: wpConfig.appPassword
                  }
                );
                
                console.log(`✅ Published to WordPress: ${result.wordPressUrl}`);
                
                // Update article with WordPress info
                article.wordPressId = result.wordPressId;
                article.wordPressUrl = result.wordPressUrl;
                await article.save();
                
              } catch (wpError) {
                console.error(`❌ Failed to publish to WordPress: ${wpError.message}`);
                // Don't fail the whole process, just log the error
              }
            }
          }
        } catch (error) {
          console.error(`❌ Failed to publish article ${article._id}:`, error.message);
        }
      }
    } catch (error) {
      console.error('Error processing scheduled articles:', error);
    }
  }

  /**
   * Process scheduled EMAIL campaigns and send them automatically
   */
  async processScheduledEmailCampaigns() {
    try {
      const now = new Date();
      
      // Find EMAIL campaigns that are SCHEDULED and ready to send
      const scheduledCampaigns = await Campaign.find({
        campaignType: 'EMAIL',
        status: 'SCHEDULED',
        'campaignData.email.deliverySettings.scheduledSendTime': { $lte: now }
      }).populate('userId');

      if (scheduledCampaigns.length === 0) {
        return; // No campaigns to process
      }

      console.log(`📧 Processing ${scheduledCampaigns.length} scheduled EMAIL campaigns`);

      for (const campaign of scheduledCampaigns) {
        try {
          console.log(`📤 Sending scheduled campaign: ${campaign.title} (${campaign._id})`);
          
          // Import EmailCampaignService dynamically to avoid circular dependency
          const EmailCampaignService = (await import('./EmailCampaignService.js')).default;
          
          // Send the email campaign
          const result = await EmailCampaignService.sendEmailCampaign(
            campaign._id.toString(),
            campaign.userId._id.toString()
          );
          
          console.log(`✅ Scheduled campaign sent: ${campaign.title}`);
          console.log(`   - Emails sent: ${result.results.sent}`);
          console.log(`   - Failed: ${result.results.failed}`);
          
          // Send notification to user
          await this.sendCampaignStartNotification(campaign);
          
        } catch (error) {
          console.error(`❌ Failed to send scheduled campaign ${campaign._id}:`, error.message);
          
          // Update campaign status to PAUSED on error
          campaign.status = 'PAUSED';
          campaign.campaignData.email.deliverySettings.lastError = error.message;
          campaign.campaignData.email.deliverySettings.lastErrorAt = new Date();
          await campaign.save();
        }
      }
    } catch (error) {
      console.error('❌ Error processing scheduled email campaigns:', error);
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
   * This generates NEW articles daily based on campaign settings
   */
  async processAutoScheduling() {
    try {
      const campaigns = await Campaign.find({
        'autoScheduling.enabled': true,
        status: 'RUNNING',
        campaignType: { $in: ['CONTENT', 'MULTI_CHANNEL'] }
      });

      console.log(`⏰ Processing auto-scheduling for ${campaigns.length} campaigns`);

      for (const campaign of campaigns) {
        try {
          const now = new Date();
          const nextDate = campaign.getNextScheduledDate();
          
          if (!nextDate) continue;
          
          // Check if we should generate an article today
          const shouldGenerateToday = this.shouldGenerateArticleToday(campaign, now);
          
          if (shouldGenerateToday) {
            console.log(`📝 Generating new article for campaign: ${campaign.title}`);
            await this.generateAndScheduleArticle(campaign, nextDate);
            
            // Update next scheduled date
            campaign.autoScheduling.nextScheduledDate = campaign.getNextScheduledDate();
            await campaign.save();
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
   * Check if we should generate an article today based on campaign schedule
   */
  shouldGenerateArticleToday(campaign, now) {
    const schedule = campaign.autoScheduling;
    
    // Check frequency
    switch (schedule.frequency) {
      case 'DAILY':
        return true;
      
      case 'WEEKLY':
        // Check if today is in the daysOfWeek array
        return schedule.daysOfWeek && schedule.daysOfWeek.includes(now.getDay());
      
      case 'BI_WEEKLY':
        // Check if it's been 14 days since last article
        const lastArticleDate = campaign.autoScheduling.lastGeneratedAt;
        if (!lastArticleDate) return true;
        const daysSinceLastArticle = Math.floor((now - new Date(lastArticleDate)) / (1000 * 60 * 60 * 24));
        return daysSinceLastArticle >= 14;
      
      case 'MONTHLY':
        // Check if it's been 30 days since last article
        const lastMonthlyDate = campaign.autoScheduling.lastGeneratedAt;
        if (!lastMonthlyDate) return true;
        const daysSinceLastMonthly = Math.floor((now - new Date(lastMonthlyDate)) / (1000 * 60 * 60 * 24));
        return daysSinceLastMonthly >= 30;
      
      default:
        return false;
    }
  }

  /**
   * Generate and schedule a NEW article for a campaign using AI
   */
  async generateAndScheduleArticle(campaign, scheduledDate) {
    try {
      // Import services dynamically to avoid circular dependencies
      const AuthenticContentServicePro = (await import('./AuthenticContentServicePro.js')).default;
      
      // Generate unique article topic based on campaign title and description
      const articleNumber = (campaign.articlesGenerated || 0) + 1;
      const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      // Create article title variations
      const titleVariations = [
        `${campaign.title}: Insights for ${dateStr}`,
        `${campaign.title} - Part ${articleNumber}`,
        `Understanding ${campaign.title}: A Deep Dive`,
        `${campaign.title}: Latest Trends and Analysis`,
        `${campaign.title}: Expert Perspective`,
        `${campaign.title}: What You Need to Know`,
        `${campaign.title}: Complete Guide`,
        `${campaign.title}: Key Takeaways`
      ];
      
      const articleTitle = titleVariations[articleNumber % titleVariations.length];
      
      console.log(`🤖 Generating AI content for: ${articleTitle}`);
      
      // Generate article using AI with campaign context
      let generatedContent;
      try {
        // Try to use AuthenticContentServicePro first
        generatedContent = await AuthenticContentServicePro.generateArticle({
          title: articleTitle,
          description: campaign.description || `Article about ${campaign.title}`,
          targetWordCount: campaign.campaignData?.content?.targetWordCount || 800,
          tone: campaign.campaignData?.content?.tone || 'PROFESSIONAL',
          keywords: campaign.campaignData?.content?.seoKeywords || [],
          includeImages: true,
          includeResearch: true
        });
      } catch (aiError) {
        console.log('⚠️ AI service unavailable, creating basic article structure');
        // Fallback to basic article structure
        generatedContent = {
          title: articleTitle,
          content: this.generateBasicArticleContent(campaign.title, campaign.description, articleTitle),
          excerpt: campaign.description?.substring(0, 200) || `Article about ${campaign.title}`,
          images: []
        };
      }
      
      // Create the article
      const article = new Article({
        userId: campaign.userId,
        campaignId: campaign._id,
        title: generatedContent.title || articleTitle,
        content: generatedContent.content,
        excerpt: generatedContent.excerpt || campaign.description?.substring(0, 200),
        status: 'DRAFT',
        autoPublish: true,
        scheduledPublishAt: scheduledDate,
        aiGenerated: true,
        metadata: {
          generatedBy: 'campaign-automation',
          generatedAt: new Date(),
          campaignTitle: campaign.title,
          articleNumber: articleNumber
        },
        seoKeywords: campaign.campaignData?.content?.seoKeywords || [],
        images: generatedContent.images || []
      });

      await article.save();
      
      // Update campaign
      campaign.articlesGenerated = articleNumber;
      campaign.autoScheduling.lastGeneratedAt = new Date();
      await campaign.save();
      
      console.log(`✅ Generated and scheduled article: ${article.title}`);
      console.log(`   Scheduled for: ${scheduledDate.toLocaleString()}`);
      
      // If WordPress is configured, prepare for auto-publish
      if (campaign.campaignData?.content?.publishDestination === 'WORDPRESS' && 
          campaign.campaignData?.content?.wordpressConfig?.isConnected) {
        article.autoPublishToWordPress = true;
        await article.save();
        console.log(`   ✓ Will auto-publish to WordPress when scheduled`);
      }
      
      return article;
    } catch (error) {
      console.error('Error generating and scheduling article:', error);
      throw error;
    }
  }

  /**
   * Generate basic article content when AI service is unavailable
   */
  generateBasicArticleContent(campaignTitle, campaignDescription, articleTitle) {
    const content = `
      <h2>Introduction</h2>
      <p>${campaignDescription || `This comprehensive article explores ${campaignTitle} and provides valuable insights for our readers. We'll dive deep into the key aspects and practical applications that matter most.`}</p>
      
      <p>In today's rapidly evolving landscape, understanding ${campaignTitle} has become increasingly important for individuals and organizations alike. This detailed analysis will guide you through the essential concepts, practical strategies, and expert recommendations.</p>
      
      <h2>Key Insights and Analysis</h2>
      <p>When examining ${campaignTitle} in detail, several critical factors emerge that shape our understanding. These elements work synergistically to create a comprehensive framework for success.</p>
      
      <p>The significance of ${campaignTitle} extends far beyond surface-level considerations. It encompasses a broad spectrum of applications that directly impact various aspects of our professional and personal development.</p>
      
      <h2>Practical Implementation Strategies</h2>
      <p>Implementing effective strategies related to ${campaignTitle} requires a systematic approach and careful consideration of multiple variables. Here are the proven methodologies that deliver consistent results:</p>
      
      <p><strong>Strategic Planning:</strong> Begin with a clear vision and well-defined objectives that align with your overall goals. This foundation ensures that all subsequent efforts contribute meaningfully to your desired outcomes.</p>
      
      <p><strong>Systematic Execution:</strong> Develop a structured implementation plan that breaks down complex processes into manageable, actionable steps. This approach minimizes risk while maximizing efficiency and effectiveness.</p>
      
      <p><strong>Continuous Monitoring:</strong> Establish robust tracking mechanisms to monitor progress and identify areas for improvement. Regular assessment enables timely adjustments and optimization of your approach.</p>
      
      <h2>Expert Recommendations and Best Practices</h2>
      <p>Industry leaders and subject matter experts consistently emphasize the importance of adopting proven methodologies when working with ${campaignTitle}. Their collective wisdom provides valuable guidance for achieving optimal results.</p>
      
      <p>Research indicates that organizations and individuals who follow established best practices experience significantly better outcomes compared to those who rely on ad-hoc approaches. This data-driven insight underscores the value of structured methodologies.</p>
      
      <h2>Future Trends and Developments</h2>
      <p>The landscape surrounding ${campaignTitle} continues to evolve at an unprecedented pace. Emerging technologies, changing market dynamics, and shifting consumer preferences are reshaping traditional approaches and creating new opportunities.</p>
      
      <p>Forward-thinking professionals recognize the importance of staying ahead of these trends to maintain competitive advantage and drive innovation. By understanding these developments, you can position yourself for long-term success.</p>
      
      <h2>Conclusion and Next Steps</h2>
      <p>Understanding and effectively implementing ${campaignTitle} strategies is essential for achieving sustainable success in today's competitive environment. The insights and methodologies outlined in this article provide a solid foundation for your journey forward.</p>
      
      <p>We encourage you to apply these concepts systematically and adapt them to your specific circumstances. Remember that success comes from consistent application of proven principles combined with continuous learning and improvement.</p>
      
      <p>Stay tuned for more comprehensive analyses and expert insights that will help you navigate the complexities of ${campaignTitle} and achieve your objectives with confidence.</p>
    `;
    
    return content.trim();
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
