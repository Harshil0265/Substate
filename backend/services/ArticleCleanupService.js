import Article from '../models/Article.js';
import cron from 'node-cron';

class ArticleCleanupService {
  constructor() {
    this.TRASH_RETENTION_DAYS = 15; // Articles in trash for 15+ days will be permanently deleted
    this.isRunning = false;
  }

  /**
   * Start the automatic cleanup scheduler
   * Runs daily at 2:00 AM
   */
  startScheduler() {
    if (this.isRunning) {
      console.log('⚠️ Article cleanup scheduler is already running');
      return;
    }

    // Schedule to run daily at 2:00 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('🗑️ Running scheduled article cleanup...');
      await this.cleanupOldDeletedArticles();
    });

    this.isRunning = true;
    console.log('✅ Article cleanup scheduler started (runs daily at 2:00 AM)');
    console.log(`📅 Articles in trash for ${this.TRASH_RETENTION_DAYS}+ days will be permanently deleted`);
  }

  /**
   * Manually trigger cleanup (for testing or admin actions)
   */
  async cleanupOldDeletedArticles() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.TRASH_RETENTION_DAYS);

      console.log(`🔍 Looking for deleted articles older than ${cutoffDate.toLocaleDateString()}...`);

      // Find articles that are:
      // 1. Marked as deleted (isDeleted = true)
      // 2. Deleted more than 15 days ago
      const articlesToDelete = await Article.find({
        isDeleted: true,
        deletedAt: { $lte: cutoffDate }
      });

      if (articlesToDelete.length === 0) {
        console.log('✅ No articles to permanently delete');
        return {
          success: true,
          deletedCount: 0,
          message: 'No articles found for permanent deletion'
        };
      }

      console.log(`📋 Found ${articlesToDelete.length} articles to permanently delete`);

      // Log details before deletion
      const deletionDetails = articlesToDelete.map(article => ({
        id: article._id,
        title: article.title,
        userId: article.userId,
        deletedAt: article.deletedAt,
        daysInTrash: Math.floor((new Date() - article.deletedAt) / (1000 * 60 * 60 * 24))
      }));

      console.log('📝 Articles to be permanently deleted:', deletionDetails);

      // Permanently delete the articles
      const result = await Article.deleteMany({
        isDeleted: true,
        deletedAt: { $lte: cutoffDate }
      });

      console.log(`✅ Successfully permanently deleted ${result.deletedCount} articles`);

      return {
        success: true,
        deletedCount: result.deletedCount,
        deletedArticles: deletionDetails,
        message: `Permanently deleted ${result.deletedCount} articles that were in trash for ${this.TRASH_RETENTION_DAYS}+ days`
      };

    } catch (error) {
      console.error('❌ Error during article cleanup:', error);
      return {
        success: false,
        error: error.message,
        message: 'Failed to cleanup old deleted articles'
      };
    }
  }

  /**
   * Get articles that will be permanently deleted soon
   * @param {number} daysWarning - Number of days before deletion to warn (default: 3)
   */
  async getArticlesNearingPermanentDeletion(daysWarning = 3) {
    try {
      const warningDate = new Date();
      warningDate.setDate(warningDate.getDate() - (this.TRASH_RETENTION_DAYS - daysWarning));

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.TRASH_RETENTION_DAYS);

      const articles = await Article.find({
        isDeleted: true,
        deletedAt: {
          $gte: cutoffDate,
          $lte: warningDate
        }
      }).select('_id title userId deletedAt');

      return articles.map(article => ({
        id: article._id,
        title: article.title,
        userId: article.userId,
        deletedAt: article.deletedAt,
        daysInTrash: Math.floor((new Date() - article.deletedAt) / (1000 * 60 * 60 * 24)),
        daysUntilPermanentDeletion: this.TRASH_RETENTION_DAYS - Math.floor((new Date() - article.deletedAt) / (1000 * 60 * 60 * 24))
      }));

    } catch (error) {
      console.error('❌ Error getting articles nearing deletion:', error);
      return [];
    }
  }

  /**
   * Get statistics about deleted articles
   */
  async getCleanupStats() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.TRASH_RETENTION_DAYS);

      const [totalDeleted, readyForCleanup, recentlyDeleted] = await Promise.all([
        Article.countDocuments({ isDeleted: true }),
        Article.countDocuments({
          isDeleted: true,
          deletedAt: { $lte: cutoffDate }
        }),
        Article.countDocuments({
          isDeleted: true,
          deletedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
      ]);

      return {
        totalInTrash: totalDeleted,
        readyForPermanentDeletion: readyForCleanup,
        deletedInLast7Days: recentlyDeleted,
        retentionDays: this.TRASH_RETENTION_DAYS
      };

    } catch (error) {
      console.error('❌ Error getting cleanup stats:', error);
      return {
        totalInTrash: 0,
        readyForPermanentDeletion: 0,
        deletedInLast7Days: 0,
        retentionDays: this.TRASH_RETENTION_DAYS
      };
    }
  }

  /**
   * Check if a specific article will be permanently deleted soon
   */
  async checkArticleDeletionStatus(articleId) {
    try {
      const article = await Article.findById(articleId);

      if (!article) {
        return { found: false, message: 'Article not found' };
      }

      if (!article.isDeleted) {
        return { found: true, isDeleted: false, message: 'Article is not in trash' };
      }

      const daysInTrash = Math.floor((new Date() - article.deletedAt) / (1000 * 60 * 60 * 24));
      const daysUntilPermanentDeletion = this.TRASH_RETENTION_DAYS - daysInTrash;

      return {
        found: true,
        isDeleted: true,
        deletedAt: article.deletedAt,
        daysInTrash,
        daysUntilPermanentDeletion: Math.max(0, daysUntilPermanentDeletion),
        willBeDeletedSoon: daysUntilPermanentDeletion <= 3,
        message: daysUntilPermanentDeletion > 0 
          ? `Article will be permanently deleted in ${daysUntilPermanentDeletion} days`
          : 'Article is ready for permanent deletion'
      };

    } catch (error) {
      console.error('❌ Error checking article deletion status:', error);
      return { found: false, error: error.message };
    }
  }
}

// Export singleton instance
export default new ArticleCleanupService();
