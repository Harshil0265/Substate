import User from '../models/User.js';
import Campaign from '../models/Campaign.js';
import Article from '../models/Article.js';

class UsageService {
  // Plan limits configuration
  static PLAN_LIMITS = {
    TRIAL: {
      campaigns: 5,
      articles: 100,
      duration: 14 // days
    },
    PROFESSIONAL: {
      campaigns: -1, // unlimited
      articles: 500,
      duration: 30 // days (monthly)
    },
    ENTERPRISE: {
      campaigns: -1, // unlimited
      articles: -1, // unlimited
      duration: 30 // days (monthly)
    }
  };

  // Get user's current usage
  static async getUserUsage(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Count campaigns and articles (excluding deleted ones)
      const campaignCount = await Campaign.countDocuments({ userId, isDeleted: { $ne: true } });
      const articleCount = await Article.countDocuments({ userId });

      // Get plan limits
      const planLimits = this.PLAN_LIMITS[user.subscription] || this.PLAN_LIMITS.TRIAL;

      // Calculate remaining usage
      const campaignsRemaining = planLimits.campaigns === -1 ? -1 : Math.max(0, planLimits.campaigns - campaignCount);
      const articlesRemaining = planLimits.articles === -1 ? -1 : Math.max(0, planLimits.articles - articleCount);

      // Calculate subscription days remaining
      const now = new Date();
      const endDate = user.subscriptionEndDate || now;
      const daysRemaining = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));

      return {
        usage: {
          campaigns: campaignCount,
          articles: articleCount
        },
        limits: {
          campaigns: planLimits.campaigns,
          articles: planLimits.articles
        },
        remaining: {
          campaigns: campaignsRemaining,
          articles: articlesRemaining,
          days: daysRemaining
        },
        subscription: {
          plan: user.subscription,
          status: user.subscriptionStatus,
          startDate: user.subscriptionStartDate,
          endDate: user.subscriptionEndDate
        }
      };
    } catch (error) {
      console.error('Error getting user usage:', error);
      throw error;
    }
  }

  // Check if user can create a campaign
  static async canCreateCampaign(userId) {
    try {
      const usage = await this.getUserUsage(userId);
      
      // Check if subscription is active
      if (usage.subscription.status !== 'ACTIVE') {
        return {
          allowed: false,
          reason: 'Subscription is not active',
          code: 'SUBSCRIPTION_INACTIVE'
        };
      }

      // Check campaign limit
      if (usage.limits.campaigns !== -1 && usage.remaining.campaigns <= 0) {
        return {
          allowed: false,
          reason: `Campaign limit reached (${usage.limits.campaigns}/${usage.limits.campaigns})`,
          code: 'CAMPAIGN_LIMIT_REACHED',
          usage: usage.usage.campaigns,
          limit: usage.limits.campaigns
        };
      }

      return {
        allowed: true,
        remaining: usage.remaining.campaigns
      };
    } catch (error) {
      console.error('Error checking campaign creation:', error);
      return {
        allowed: false,
        reason: 'Error checking limits',
        code: 'ERROR'
      };
    }
  }

  // Check if user can create an article
  static async canCreateArticle(userId) {
    try {
      const usage = await this.getUserUsage(userId);
      
      // Check if subscription is active
      if (usage.subscription.status !== 'ACTIVE') {
        return {
          allowed: false,
          reason: 'Subscription is not active',
          code: 'SUBSCRIPTION_INACTIVE'
        };
      }

      // Check article limit
      if (usage.limits.articles !== -1 && usage.remaining.articles <= 0) {
        return {
          allowed: false,
          reason: `Article limit reached (${usage.limits.articles}/${usage.limits.articles})`,
          code: 'ARTICLE_LIMIT_REACHED',
          usage: usage.usage.articles,
          limit: usage.limits.articles
        };
      }

      return {
        allowed: true,
        remaining: usage.remaining.articles
      };
    } catch (error) {
      console.error('Error checking article creation:', error);
      return {
        allowed: false,
        reason: 'Error checking limits',
        code: 'ERROR'
      };
    }
  }

  // Update user counts after creating campaign/article
  static async updateUserCounts(userId) {
    try {
      const campaignCount = await Campaign.countDocuments({ userId, isDeleted: { $ne: true } });
      const articleCount = await Article.countDocuments({ userId });

      await User.findByIdAndUpdate(userId, {
        campaignCount,
        articleCount,
        lastActivityDate: new Date()
      });

      return { campaignCount, articleCount };
    } catch (error) {
      console.error('Error updating user counts:', error);
      throw error;
    }
  }

  // Get usage alerts for user
  static async getUsageAlerts(userId) {
    try {
      const usage = await this.getUserUsage(userId);
      const alerts = [];

      // Check campaign usage alerts
      if (usage.limits.campaigns !== -1) {
        const campaignUsagePercent = (usage.usage.campaigns / usage.limits.campaigns) * 100;
        
        if (campaignUsagePercent >= 90) {
          alerts.push({
            type: 'warning',
            category: 'campaigns',
            message: `You've used ${usage.usage.campaigns} of ${usage.limits.campaigns} campaigns (${Math.round(campaignUsagePercent)}%)`,
            remaining: usage.remaining.campaigns,
            severity: campaignUsagePercent >= 100 ? 'critical' : 'high'
          });
        } else if (campaignUsagePercent >= 75) {
          alerts.push({
            type: 'info',
            category: 'campaigns',
            message: `You've used ${usage.usage.campaigns} of ${usage.limits.campaigns} campaigns (${Math.round(campaignUsagePercent)}%)`,
            remaining: usage.remaining.campaigns,
            severity: 'medium'
          });
        }
      }

      // Check article usage alerts
      if (usage.limits.articles !== -1) {
        const articleUsagePercent = (usage.usage.articles / usage.limits.articles) * 100;
        
        if (articleUsagePercent >= 90) {
          alerts.push({
            type: 'warning',
            category: 'articles',
            message: `You've used ${usage.usage.articles} of ${usage.limits.articles} articles (${Math.round(articleUsagePercent)}%)`,
            remaining: usage.remaining.articles,
            severity: articleUsagePercent >= 100 ? 'critical' : 'high'
          });
        } else if (articleUsagePercent >= 75) {
          alerts.push({
            type: 'info',
            category: 'articles',
            message: `You've used ${usage.usage.articles} of ${usage.limits.articles} articles (${Math.round(articleUsagePercent)}%)`,
            remaining: usage.remaining.articles,
            severity: 'medium'
          });
        }
      }

      // Check subscription expiry alerts
      if (usage.remaining.days <= 7 && usage.remaining.days > 0) {
        alerts.push({
          type: 'warning',
          category: 'subscription',
          message: `Your ${usage.subscription.plan} plan expires in ${usage.remaining.days} day${usage.remaining.days === 1 ? '' : 's'}`,
          remaining: usage.remaining.days,
          severity: usage.remaining.days <= 3 ? 'critical' : 'high'
        });
      } else if (usage.remaining.days <= 0) {
        alerts.push({
          type: 'error',
          category: 'subscription',
          message: 'Your subscription has expired. Please upgrade to continue using SUBSTATE.',
          remaining: 0,
          severity: 'critical'
        });
      }

      return alerts;
    } catch (error) {
      console.error('Error getting usage alerts:', error);
      return [];
    }
  }

  // Check if user needs upgrade reminder
  static async needsUpgradeReminder(userId) {
    try {
      const usage = await this.getUserUsage(userId);
      
      // Send reminder if:
      // 1. Trial user with 3 days or less remaining
      // 2. Any plan with 7 days or less remaining
      // 3. Usage is above 80% on any metric
      
      const needsReminder = 
        (usage.subscription.plan === 'TRIAL' && usage.remaining.days <= 3) ||
        (usage.remaining.days <= 7) ||
        (usage.limits.campaigns !== -1 && (usage.usage.campaigns / usage.limits.campaigns) >= 0.8) ||
        (usage.limits.articles !== -1 && (usage.usage.articles / usage.limits.articles) >= 0.8);

      return {
        needsReminder,
        usage,
        reasons: this.getUpgradeReasons(usage)
      };
    } catch (error) {
      console.error('Error checking upgrade reminder:', error);
      return { needsReminder: false, usage: null, reasons: [] };
    }
  }

  // Get reasons for upgrade
  static getUpgradeReasons(usage) {
    const reasons = [];

    if (usage.subscription.plan === 'TRIAL' && usage.remaining.days <= 3) {
      reasons.push(`Trial expires in ${usage.remaining.days} day${usage.remaining.days === 1 ? '' : 's'}`);
    }

    if (usage.limits.campaigns !== -1 && usage.remaining.campaigns <= 2) {
      reasons.push(`Only ${usage.remaining.campaigns} campaign${usage.remaining.campaigns === 1 ? '' : 's'} remaining`);
    }

    if (usage.limits.articles !== -1 && usage.remaining.articles <= 10) {
      reasons.push(`Only ${usage.remaining.articles} article${usage.remaining.articles === 1 ? '' : 's'} remaining`);
    }

    return reasons;
  }

  // Send usage notification emails
  static async sendUsageNotifications(userId) {
    try {
      const User = (await import('../models/User.js')).default;
      const EmailService = (await import('./EmailService.js')).default;
      
      const user = await User.findById(userId);
      if (!user || !user.email) return;

      const usage = await this.getUserUsage(userId);

      // Check campaign usage
      if (usage.limits.campaigns !== -1) {
        const campaignPercentage = (usage.usage.campaigns / usage.limits.campaigns) * 100;
        
        // Send warning at 75%
        if (campaignPercentage >= 75 && campaignPercentage < 100 && !user.usageWarnings?.campaigns75) {
          await EmailService.sendUsageWarning(user.email, user.name, {
            type: 'campaigns',
            current: usage.usage.campaigns,
            limit: usage.limits.campaigns,
            percentage: campaignPercentage,
            plan: usage.subscription.plan
          });
          
          // Mark as sent
          await User.findByIdAndUpdate(userId, {
            'usageWarnings.campaigns75': true
          });
        }
        
        // Send limit reached at 100%
        if (campaignPercentage >= 100 && !user.usageWarnings?.campaigns100) {
          await EmailService.sendLimitReached(user.email, user.name, {
            type: 'campaigns',
            limit: usage.limits.campaigns,
            plan: usage.subscription.plan
          });
          
          // Mark as sent
          await User.findByIdAndUpdate(userId, {
            'usageWarnings.campaigns100': true
          });
        }
      }

      // Check article usage
      if (usage.limits.articles !== -1) {
        const articlePercentage = (usage.usage.articles / usage.limits.articles) * 100;
        
        // Send warning at 75%
        if (articlePercentage >= 75 && articlePercentage < 100 && !user.usageWarnings?.articles75) {
          await EmailService.sendUsageWarning(user.email, user.name, {
            type: 'articles',
            current: usage.usage.articles,
            limit: usage.limits.articles,
            percentage: articlePercentage,
            plan: usage.subscription.plan
          });
          
          // Mark as sent
          await User.findByIdAndUpdate(userId, {
            'usageWarnings.articles75': true
          });
        }
        
        // Send limit reached at 100%
        if (articlePercentage >= 100 && !user.usageWarnings?.articles100) {
          await EmailService.sendLimitReached(user.email, user.name, {
            type: 'articles',
            limit: usage.limits.articles,
            plan: usage.subscription.plan
          });
          
          // Mark as sent
          await User.findByIdAndUpdate(userId, {
            'usageWarnings.articles100': true
          });
        }
      }
    } catch (error) {
      console.error('Error sending usage notifications:', error);
    }
  }
}

export default UsageService;