import cron from 'node-cron';
import User from '../models/User.js';
import UsageService from './UsageService.js';
import EmailService from './EmailService.js';

class ReminderService {
  static isRunning = false;

  // Start the reminder service
  static start() {
    if (this.isRunning) {
      console.log('⚠️ Reminder service is already running');
      return;
    }

    console.log('🚀 Starting SUBSTATE Reminder Service...');
    
    // Run daily at 9:00 AM
    cron.schedule('0 9 * * *', async () => {
      console.log('📧 Running daily reminder check...');
      await this.checkAndSendReminders();
    });

    // Run every 6 hours for critical reminders (expiring today)
    cron.schedule('0 */6 * * *', async () => {
      console.log('🚨 Running critical reminder check...');
      await this.checkCriticalReminders();
    });

    this.isRunning = true;
    console.log('✅ Reminder service started successfully');
  }

  // Stop the reminder service
  static stop() {
    this.isRunning = false;
    console.log('🛑 Reminder service stopped');
  }

  // Check and send all reminders
  static async checkAndSendReminders() {
    try {
      const users = await User.find({
        subscriptionStatus: 'ACTIVE',
        emailVerified: true
      }).select('_id email name subscription subscriptionEndDate');

      console.log(`📊 Checking ${users.length} users for reminders...`);

      let remindersSent = 0;

      for (const user of users) {
        try {
          const reminderCheck = await UsageService.needsUpgradeReminder(user._id);
          
          if (reminderCheck.needsReminder) {
            await EmailService.sendUpgradeReminder(
              user.email, 
              user.name, 
              reminderCheck.usage
            );
            
            remindersSent++;
            console.log(`✅ Reminder sent to ${user.email} (${user.subscription})`);
            
            // Add a small delay to avoid overwhelming the email service
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (userError) {
          console.error(`❌ Error processing user ${user.email}:`, userError.message);
        }
      }

      console.log(`📧 Reminder check complete. Sent ${remindersSent} reminders.`);
    } catch (error) {
      console.error('❌ Error in reminder service:', error);
    }
  }

  // Check and send only critical reminders (expiring today/tomorrow)
  static async checkCriticalReminders() {
    try {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const users = await User.find({
        subscriptionStatus: 'ACTIVE',
        emailVerified: true,
        subscriptionEndDate: {
          $lte: tomorrow // Expires today or tomorrow
        }
      }).select('_id email name subscription subscriptionEndDate');

      console.log(`🚨 Checking ${users.length} users for critical reminders...`);

      let criticalRemindersSent = 0;

      for (const user of users) {
        try {
          const usage = await UsageService.getUserUsage(user._id);
          
          if (usage.remaining.days <= 1) {
            await EmailService.sendUpgradeReminder(
              user.email, 
              user.name, 
              usage
            );
            
            criticalRemindersSent++;
            console.log(`🚨 Critical reminder sent to ${user.email} (expires in ${usage.remaining.days} days)`);
            
            // Add a small delay
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (userError) {
          console.error(`❌ Error processing critical user ${user.email}:`, userError.message);
        }
      }

      console.log(`🚨 Critical reminder check complete. Sent ${criticalRemindersSent} critical reminders.`);
    } catch (error) {
      console.error('❌ Error in critical reminder service:', error);
    }
  }

  // Manual trigger for testing
  static async sendTestReminder(userId) {
    try {
      const user = await User.findById(userId).select('email name');
      if (!user) {
        throw new Error('User not found');
      }

      const usage = await UsageService.getUserUsage(userId);
      await EmailService.sendUpgradeReminder(user.email, user.name, usage);
      
      console.log(`✅ Test reminder sent to ${user.email}`);
      return { success: true, message: 'Test reminder sent successfully' };
    } catch (error) {
      console.error('❌ Error sending test reminder:', error);
      return { success: false, error: error.message };
    }
  }

  // Get reminder statistics
  static async getReminderStats() {
    try {
      const now = new Date();
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      const stats = {
        totalActiveUsers: await User.countDocuments({ subscriptionStatus: 'ACTIVE' }),
        expiringIn7Days: await User.countDocuments({
          subscriptionStatus: 'ACTIVE',
          subscriptionEndDate: { $lte: sevenDaysFromNow, $gte: now }
        }),
        expiringIn3Days: await User.countDocuments({
          subscriptionStatus: 'ACTIVE',
          subscriptionEndDate: { $lte: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), $gte: now }
        }),
        expiringToday: await User.countDocuments({
          subscriptionStatus: 'ACTIVE',
          subscriptionEndDate: { $lte: new Date(now.getTime() + 24 * 60 * 60 * 1000), $gte: now }
        }),
        trialUsers: await User.countDocuments({
          subscription: 'TRIAL',
          subscriptionStatus: 'ACTIVE'
        })
      };

      return stats;
    } catch (error) {
      console.error('❌ Error getting reminder stats:', error);
      return null;
    }
  }
}

export default ReminderService;