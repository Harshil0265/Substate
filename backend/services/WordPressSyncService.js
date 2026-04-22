import Article from '../models/Article.js';
import axios from 'axios';

class WordPressSyncService {
  
  // Sync article to WordPress
  async syncArticleToWordPress(articleId, userId, wordpressConfig) {
    try {
      const article = await Article.findById(articleId);

      if (!article) {
        throw new Error('Article not found');
      }

      if (article.userId.toString() !== userId) {
        throw new Error('Unauthorized');
      }

      // Prepare WordPress post data
      const postData = {
        title: article.title,
        content: article.content,
        excerpt: article.excerpt || article.seo?.metaDescription,
        status: 'draft',
        categories: wordpressConfig.categories || [],
        tags: article.tags || article.seo?.keywords || [],
        meta: {
          _yoast_wpseo_title: article.seo?.metaTitle || article.title,
          _yoast_wpseo_metadesc: article.seo?.metaDescription || '',
          _yoast_wpseo_focuskw: article.seo?.focusKeyword || ''
        }
      };

      // Simulate WordPress API call
      // In production, this would call actual WordPress REST API
      const wordpressPostId = Math.floor(Math.random() * 100000);
      const wordpressUrl = `${wordpressConfig.siteUrl}/posts/${article.slug}`;

      // Update article with WordPress sync info
      article.wordpress = {
        postId: wordpressPostId,
        url: wordpressUrl,
        status: 'draft',
        lastSyncedAt: new Date(),
        autoPublish: wordpressConfig.autoPublish || false,
        syncStatus: 'SYNCED',
        publishedAt: null,
        categories: wordpressConfig.categories || [],
        tags: article.tags || []
      };

      article.publishing.distributionStatus.wordpress = 'PUBLISHED';

      await article.save();

      return {
        success: true,
        article,
        wordpress: {
          postId: wordpressPostId,
          url: wordpressUrl,
          status: 'draft'
        }
      };
    } catch (error) {
      console.error('WordPress sync error:', error);
      throw error;
    }
  }

  // Publish article to WordPress
  async publishToWordPress(articleId, userId) {
    try {
      const article = await Article.findById(articleId);

      if (!article) {
        throw new Error('Article not found');
      }

      if (article.userId.toString() !== userId) {
        throw new Error('Unauthorized');
      }

      if (!article.wordpress?.postId) {
        throw new Error('Article not synced to WordPress');
      }

      // Update WordPress post status to publish
      article.wordpress.status = 'publish';
      article.wordpress.publishedAt = new Date();
      article.publishing.distributionStatus.wordpress = 'PUBLISHED';

      await article.save();

      return {
        success: true,
        message: 'Article published to WordPress',
        wordpress: article.wordpress
      };
    } catch (error) {
      console.error('WordPress publish error:', error);
      throw error;
    }
  }

  // Bulk sync articles to WordPress
  async bulkSyncToWordPress(articleIds, userId, wordpressConfig) {
    try {
      const results = {
        synced: 0,
        failed: 0,
        errors: []
      };

      for (const articleId of articleIds) {
        try {
          await this.syncArticleToWordPress(articleId, userId, wordpressConfig);
          results.synced++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            articleId,
            error: error.message
          });
        }
      }

      return {
        success: true,
        results
      };
    } catch (error) {
      console.error('Bulk sync error:', error);
      throw error;
    }
  }

  // Get WordPress sync status
  async getWordPressSyncStatus(articleId, userId) {
    try {
      const article = await Article.findById(articleId);

      if (!article) {
        throw new Error('Article not found');
      }

      if (article.userId.toString() !== userId) {
        throw new Error('Unauthorized');
      }

      return {
        success: true,
        syncStatus: {
          synced: !!article.wordpress?.postId,
          status: article.wordpress?.syncStatus || 'NOT_SYNCED',
          postId: article.wordpress?.postId,
          url: article.wordpress?.url,
          lastSyncedAt: article.wordpress?.lastSyncedAt,
          publishedAt: article.wordpress?.publishedAt,
          errors: article.wordpress?.syncErrors || []
        }
      };
    } catch (error) {
      console.error('Sync status error:', error);
      throw error;
    }
  }

  // Resync article from WordPress
  async resyncFromWordPress(articleId, userId) {
    try {
      const article = await Article.findById(articleId);

      if (!article) {
        throw new Error('Article not found');
      }

      if (article.userId.toString() !== userId) {
        throw new Error('Unauthorized');
      }

      if (!article.wordpress?.postId) {
        throw new Error('Article not synced to WordPress');
      }

      // Simulate fetching from WordPress
      // In production, this would call WordPress REST API to get latest post data
      article.wordpress.lastSyncedAt = new Date();
      article.wordpress.syncStatus = 'SYNCED';

      await article.save();

      return {
        success: true,
        message: 'Article resynced from WordPress',
        wordpress: article.wordpress
      };
    } catch (error) {
      console.error('Resync error:', error);
      throw error;
    }
  }

  // Disconnect article from WordPress
  async disconnectFromWordPress(articleId, userId) {
    try {
      const article = await Article.findById(articleId);

      if (!article) {
        throw new Error('Article not found');
      }

      if (article.userId.toString() !== userId) {
        throw new Error('Unauthorized');
      }

      article.wordpress = {
        postId: null,
        url: null,
        status: null,
        lastSyncedAt: null,
        autoPublish: false,
        syncStatus: 'NOT_SYNCED'
      };

      article.publishing.distributionStatus.wordpress = 'PENDING';

      await article.save();

      return {
        success: true,
        message: 'Article disconnected from WordPress'
      };
    } catch (error) {
      console.error('Disconnect error:', error);
      throw error;
    }
  }

  // Get WordPress configuration
  async getWordPressConfig(userId) {
    try {
      // In production, this would fetch from user settings
      return {
        success: true,
        config: {
          siteUrl: process.env.WORDPRESS_SITE_URL || 'https://example.com',
          apiUrl: process.env.WORDPRESS_API_URL || 'https://example.com/wp-json',
          username: process.env.WORDPRESS_USERNAME || '',
          autoPublish: false,
          categories: [],
          defaultStatus: 'draft'
        }
      };
    } catch (error) {
      console.error('Config error:', error);
      throw error;
    }
  }
}

export default new WordPressSyncService();
