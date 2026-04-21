import axios from 'axios';
import User from '../models/User.js';

class WordPressService {
  constructor() {
    this.defaultTimeout = 30000; // 30 seconds
  }

  /**
   * Test WordPress connection
   */
  async testConnection(wpConfig) {
    try {
      const { siteUrl, username, applicationPassword } = wpConfig;
      
      if (!siteUrl || !username || !applicationPassword) {
        throw new Error('Missing WordPress configuration');
      }

      // Clean and validate URL
      const cleanUrl = this.cleanUrl(siteUrl);
      const apiUrl = `${cleanUrl}/wp-json/wp/v2/users/me`;

      const response = await axios.get(apiUrl, {
        auth: {
          username: username,
          password: applicationPassword
        },
        timeout: this.defaultTimeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SUBSTATE-WordPress-Integration/1.0'
        }
      });

      return {
        success: true,
        message: 'WordPress connection successful',
        userInfo: {
          id: response.data.id,
          name: response.data.name,
          email: response.data.email,
          roles: response.data.roles
        }
      };
    } catch (error) {
      console.error('WordPress connection test failed:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Post article to WordPress
   */
  async postArticle(wpConfig, articleData, options = {}) {
    try {
      const { siteUrl, username, applicationPassword } = wpConfig;
      const cleanUrl = this.cleanUrl(siteUrl);
      const apiUrl = `${cleanUrl}/wp-json/wp/v2/posts`;

      // Prepare WordPress post data
      const postData = {
        title: articleData.title,
        content: this.formatContent(articleData.content),
        status: options.status || 'draft', // draft, publish, private
        excerpt: articleData.excerpt || this.generateExcerpt(articleData.content),
        categories: options.categories || [],
        tags: options.tags || [],
        featured_media: options.featuredImageId || null,
        meta: {
          substate_article_id: articleData.id,
          substate_campaign_id: articleData.campaignId || null,
          substate_generated_at: new Date().toISOString()
        }
      };

      // Add custom fields if supported
      if (options.customFields) {
        postData.acf = options.customFields;
      }

      const response = await axios.post(apiUrl, postData, {
        auth: {
          username: username,
          password: applicationPassword
        },
        timeout: this.defaultTimeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SUBSTATE-WordPress-Integration/1.0'
        }
      });

      return {
        success: true,
        message: 'Article posted to WordPress successfully',
        wordpressPost: {
          id: response.data.id,
          url: response.data.link,
          status: response.data.status,
          title: response.data.title.rendered,
          publishedAt: response.data.date
        }
      };
    } catch (error) {
      console.error('WordPress article posting failed:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Update existing WordPress post
   */
  async updateArticle(wpConfig, wordpressPostId, articleData, options = {}) {
    try {
      const { siteUrl, username, applicationPassword } = wpConfig;
      const cleanUrl = this.cleanUrl(siteUrl);
      const apiUrl = `${cleanUrl}/wp-json/wp/v2/posts/${wordpressPostId}`;

      const updateData = {
        title: articleData.title,
        content: this.formatContent(articleData.content),
        excerpt: articleData.excerpt || this.generateExcerpt(articleData.content),
        categories: options.categories || [],
        tags: options.tags || [],
        meta: {
          substate_article_id: articleData.id,
          substate_updated_at: new Date().toISOString()
        }
      };

      if (options.status) {
        updateData.status = options.status;
      }

      const response = await axios.post(apiUrl, updateData, {
        auth: {
          username: username,
          password: applicationPassword
        },
        timeout: this.defaultTimeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SUBSTATE-WordPress-Integration/1.0'
        }
      });

      return {
        success: true,
        message: 'WordPress post updated successfully',
        wordpressPost: {
          id: response.data.id,
          url: response.data.link,
          status: response.data.status,
          title: response.data.title.rendered,
          updatedAt: response.data.modified
        }
      };
    } catch (error) {
      console.error('WordPress article update failed:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get WordPress categories
   */
  async getCategories(wpConfig) {
    try {
      const { siteUrl, username, applicationPassword } = wpConfig;
      const cleanUrl = this.cleanUrl(siteUrl);
      const apiUrl = `${cleanUrl}/wp-json/wp/v2/categories?per_page=100`;

      const response = await axios.get(apiUrl, {
        auth: {
          username: username,
          password: applicationPassword
        },
        timeout: this.defaultTimeout
      });

      return {
        success: true,
        categories: response.data.map(cat => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          count: cat.count
        }))
      };
    } catch (error) {
      console.error('Failed to get WordPress categories:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        categories: []
      };
    }
  }

  /**
   * Get WordPress tags
   */
  async getTags(wpConfig) {
    try {
      const { siteUrl, username, applicationPassword } = wpConfig;
      const cleanUrl = this.cleanUrl(siteUrl);
      const apiUrl = `${cleanUrl}/wp-json/wp/v2/tags?per_page=100`;

      const response = await axios.get(apiUrl, {
        auth: {
          username: username,
          password: applicationPassword
        },
        timeout: this.defaultTimeout
      });

      return {
        success: true,
        tags: response.data.map(tag => ({
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          count: tag.count
        }))
      };
    } catch (error) {
      console.error('Failed to get WordPress tags:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        tags: []
      };
    }
  }

  /**
   * Upload media to WordPress
   */
  async uploadMedia(wpConfig, mediaData) {
    try {
      const { siteUrl, username, applicationPassword } = wpConfig;
      const cleanUrl = this.cleanUrl(siteUrl);
      const apiUrl = `${cleanUrl}/wp-json/wp/v2/media`;

      const formData = new FormData();
      formData.append('file', mediaData.buffer, mediaData.filename);
      formData.append('title', mediaData.title || mediaData.filename);
      formData.append('alt_text', mediaData.altText || '');

      const response = await axios.post(apiUrl, formData, {
        auth: {
          username: username,
          password: applicationPassword
        },
        timeout: this.defaultTimeout * 2, // Longer timeout for uploads
        headers: {
          'Content-Type': 'multipart/form-data',
          'User-Agent': 'SUBSTATE-WordPress-Integration/1.0'
        }
      });

      return {
        success: true,
        media: {
          id: response.data.id,
          url: response.data.source_url,
          title: response.data.title.rendered,
          altText: response.data.alt_text
        }
      };
    } catch (error) {
      console.error('WordPress media upload failed:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Delete WordPress post
   */
  async deletePost(wpConfig, wordpressPostId) {
    try {
      const { siteUrl, username, applicationPassword } = wpConfig;
      const cleanUrl = this.cleanUrl(siteUrl);
      const apiUrl = `${cleanUrl}/wp-json/wp/v2/posts/${wordpressPostId}`;

      const response = await axios.delete(apiUrl, {
        auth: {
          username: username,
          password: applicationPassword
        },
        timeout: this.defaultTimeout,
        headers: {
          'User-Agent': 'SUBSTATE-WordPress-Integration/1.0'
        }
      });

      return {
        success: true,
        message: 'WordPress post deleted successfully',
        deletedPost: response.data
      };
    } catch (error) {
      console.error('WordPress post deletion failed:', error);
      return {
        success: false,
        message: this.getErrorMessage(error),
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Bulk post articles from campaign
   */
  async bulkPostCampaignArticles(userId, campaignId, wpConfig, options = {}) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Import here to avoid circular dependency
      const { default: Article } = await import('../models/Article.js');
      const { default: Campaign } = await import('../models/Campaign.js');

      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        throw new Error('Campaign not found');
      }

      const articles = await Article.find({ 
        campaignId: campaignId,
        userId: userId 
      });

      if (articles.length === 0) {
        return {
          success: false,
          message: 'No articles found in this campaign'
        };
      }

      const results = [];
      const batchSize = options.batchSize || 5; // Process 5 articles at a time
      const delay = options.delay || 2000; // 2 second delay between batches

      for (let i = 0; i < articles.length; i += batchSize) {
        const batch = articles.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (article) => {
          try {
            const postOptions = {
              status: options.defaultStatus || 'draft',
              categories: options.categories || [],
              tags: [...(options.tags || []), campaign.title],
              customFields: {
                campaign_name: campaign.title,
                campaign_id: campaignId,
                generated_by: 'SUBSTATE'
              }
            };

            const result = await this.postArticle(wpConfig, article, postOptions);
            
            if (result.success) {
              // Update article with WordPress post ID
              await Article.findByIdAndUpdate(article._id, {
                wordpressPostId: result.wordpressPost.id,
                wordpressUrl: result.wordpressPost.url,
                wordpressStatus: result.wordpressPost.status,
                lastSyncedAt: new Date()
              });
            }

            return {
              articleId: article._id,
              articleTitle: article.title,
              ...result
            };
          } catch (error) {
            return {
              articleId: article._id,
              articleTitle: article.title,
              success: false,
              message: error.message
            };
          }
        });

        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Add delay between batches to avoid overwhelming WordPress
        if (i + batchSize < articles.length) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      return {
        success: true,
        message: `Bulk posting completed: ${successful} successful, ${failed} failed`,
        results: results,
        summary: {
          total: articles.length,
          successful: successful,
          failed: failed
        }
      };
    } catch (error) {
      console.error('Bulk posting failed:', error);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  /**
   * Sync article status from WordPress
   */
  async syncArticleStatus(wpConfig, wordpressPostId) {
    try {
      const { siteUrl, username, applicationPassword } = wpConfig;
      const cleanUrl = this.cleanUrl(siteUrl);
      const apiUrl = `${cleanUrl}/wp-json/wp/v2/posts/${wordpressPostId}`;

      const response = await axios.get(apiUrl, {
        auth: {
          username: username,
          password: applicationPassword
        },
        timeout: this.defaultTimeout
      });

      return {
        success: true,
        status: response.data.status,
        url: response.data.link,
        publishedAt: response.data.date,
        modifiedAt: response.data.modified
      };
    } catch (error) {
      console.error('WordPress status sync failed:', error);
      return {
        success: false,
        message: this.getErrorMessage(error)
      };
    }
  }

  // Helper methods
  cleanUrl(url) {
    return url.replace(/\/+$/, ''); // Remove trailing slashes
  }

  formatContent(content) {
    // Convert markdown to HTML if needed
    // Add proper WordPress formatting
    return content
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p>')
      .replace(/$/, '</p>');
  }

  generateExcerpt(content, maxLength = 160) {
    const plainText = content.replace(/<[^>]*>/g, ''); // Strip HTML
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...'
      : plainText;
  }

  getErrorMessage(error) {
    if (error.code === 'ENOTFOUND') {
      return 'WordPress site not found. Please check the URL.';
    }
    if (error.code === 'ECONNREFUSED') {
      return 'Connection refused. Please check if WordPress site is accessible.';
    }
    if (error.response?.status === 401) {
      return 'Authentication failed. Please check username and application password.';
    }
    if (error.response?.status === 403) {
      return 'Permission denied. User may not have sufficient privileges.';
    }
    if (error.response?.status === 404) {
      return 'WordPress REST API not found. Please ensure REST API is enabled.';
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    return error.message || 'Unknown WordPress integration error';
  }

  /**
   * Validate WordPress configuration
   */
  validateConfig(wpConfig) {
    const errors = [];

    if (!wpConfig.siteUrl) {
      errors.push('WordPress site URL is required');
    } else if (!this.isValidUrl(wpConfig.siteUrl)) {
      errors.push('Invalid WordPress site URL format');
    }

    if (!wpConfig.username) {
      errors.push('WordPress username is required');
    }

    if (!wpConfig.applicationPassword) {
      errors.push('WordPress application password is required');
    }

    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }

  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
}

export default new WordPressService();