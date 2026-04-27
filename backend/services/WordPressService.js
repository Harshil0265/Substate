import axios from 'axios';
import User from '../models/User.js';
import WordPressImageService from './WordPressImageService.js';

class WordPressService {
  constructor() {
    this.defaultTimeout = 30000; // 30 seconds
    this.imageService = new WordPressImageService();
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
   * Post article to WordPress with proper image handling
   */
  async postArticle(wpConfig, articleData, options = {}) {
    try {
      const { siteUrl, username, applicationPassword } = wpConfig;
      const cleanUrl = this.cleanUrl(siteUrl);
      const apiUrl = `${cleanUrl}/wp-json/wp/v2/posts`;

      console.log('🔄 Preparing article for WordPress with image processing...');

      // Process content and images for WordPress
      const contentPreparation = await this.imageService.prepareContentForWordPress(
        wpConfig, 
        articleData, 
        {
          category: options.category,
          includeFeaturedImage: options.includeFeaturedImage !== false
        }
      );

      if (!contentPreparation.success) {
        console.log('⚠️ Image processing failed, using original content');
      }

      // Use processed content or fallback to original
      const finalContent = contentPreparation.success ? 
        contentPreparation.content : 
        this.formatContent(articleData.content);

      // Process tags - convert names to IDs and create new ones if needed
      let processedTags = [];
      if (options.tags && options.tags.length > 0) {
        processedTags = await this.processTagsForWordPress(wpConfig, options.tags);
      }

      // Prepare WordPress post data
      const postData = {
        title: articleData.title,
        content: finalContent,
        status: options.status || 'draft', // draft, publish, private
        excerpt: articleData.excerpt || this.generateExcerpt(finalContent),
        categories: options.categories || [],
        tags: processedTags, // Now using processed tag IDs
        featured_media: contentPreparation.featuredImage?.success ? 
          contentPreparation.featuredImage.mediaId : null,
        format: 'standard', // Ensure standard post format
        meta: {
          substate_article_id: articleData.id,
          substate_campaign_id: articleData.campaignId || null,
          substate_generated_at: new Date().toISOString(),
          substate_images_processed: contentPreparation.imagesProcessed || 0,
          substate_images_uploaded: contentPreparation.uploadedImages?.length || 0
        }
      };

      console.log('📝 WordPress post data prepared:', {
        title: postData.title,
        contentLength: postData.content.length,
        hasImages: postData.content.includes('<img') || postData.content.includes('wp:image'),
        imagesProcessed: contentPreparation.imagesProcessed || 0,
        imagesUploaded: contentPreparation.uploadedImages?.length || 0,
        featuredImageId: postData.featured_media,
        status: postData.status,
        contentPreview: postData.content.substring(0, 300) + '...'
      });

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
          'User-Agent': 'SUBSTATE-WordPress-Integration/1.0',
          'Accept': 'application/json'
        }
      });

      console.log('✅ WordPress API response received:', {
        status: response.status,
        postId: response.data.id,
        postStatus: response.data.status,
        postUrl: response.data.link,
        imagesInContent: (response.data.content?.rendered || '').includes('<img') ? 'Yes' : 'No'
      });

      return {
        success: true,
        message: 'Article posted to WordPress successfully with images',
        wordpressPost: {
          id: response.data.id,
          url: this.getValidPostUrl(response.data, cleanUrl),
          status: response.data.status,
          title: response.data.title.rendered,
          publishedAt: response.data.date,
          featuredImageId: postData.featured_media,
          imagesProcessed: contentPreparation.imagesProcessed || 0,
          imagesUploaded: contentPreparation.uploadedImages?.length || 0
        },
        imageProcessing: {
          success: contentPreparation.success,
          imagesProcessed: contentPreparation.imagesProcessed || 0,
          imagesUploaded: contentPreparation.uploadedImages?.length || 0,
          uploadSuccessRate: contentPreparation.uploadSuccessRate || 0,
          featuredImageUploaded: contentPreparation.featuredImage?.success || false
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
   * Process tags for WordPress - convert names to IDs and create new tags if needed
   */
  async processTagsForWordPress(wpConfig, tagNames) {
    try {
      const { siteUrl, username, applicationPassword } = wpConfig;
      const cleanUrl = this.cleanUrl(siteUrl);
      
      const processedTagIds = [];

      for (const tagName of tagNames) {
        if (!tagName || !tagName.trim()) continue;
        
        const trimmedTagName = tagName.trim();
        
        try {
          // First, try to find existing tag by name
          const searchUrl = `${cleanUrl}/wp-json/wp/v2/tags?search=${encodeURIComponent(trimmedTagName)}`;
          const searchResponse = await axios.get(searchUrl, {
            auth: { username, password: applicationPassword },
            timeout: this.defaultTimeout
          });

          // Check if we found an exact match
          const existingTag = searchResponse.data.find(tag => 
            tag.name.toLowerCase() === trimmedTagName.toLowerCase()
          );

          if (existingTag) {
            // Use existing tag ID
            processedTagIds.push(existingTag.id);
          } else {
            // Create new tag
            const createUrl = `${cleanUrl}/wp-json/wp/v2/tags`;
            const createResponse = await axios.post(createUrl, {
              name: trimmedTagName,
              slug: trimmedTagName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
            }, {
              auth: { username, password: applicationPassword },
              timeout: this.defaultTimeout,
              headers: { 'Content-Type': 'application/json' }
            });

            processedTagIds.push(createResponse.data.id);
          }
        } catch (tagError) {
          console.error(`Error processing tag "${trimmedTagName}":`, tagError.message);
          // Continue with other tags even if one fails
        }
      }

      return processedTagIds;
    } catch (error) {
      console.error('Error processing tags:', error);
      return []; // Return empty array if tag processing fails
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
              // Update article with WordPress post ID using correct nested schema fields
              await Article.findByIdAndUpdate(article._id, {
                'wordpress.postId': result.wordpressPost.id,
                'wordpress.url': result.wordpressPost.url,
                'wordpress.status': result.wordpressPost.status,
                'wordpress.syncStatus': 'SYNCED',
                'wordpress.lastSyncedAt': new Date(),
                'wordpress.publishedAt': result.wordpressPost.publishedAt || new Date()
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

  /**
   * Get valid post URL with fallback options
   */
  getValidPostUrl(postData, siteUrl) {
    // Try different URL options in order of preference
    const urlOptions = [
      postData.link,                                    // WordPress provided link
      postData.guid?.rendered,                          // GUID as fallback
      `${siteUrl}/?p=${postData.id}`,                  // Permalink fallback
      `${siteUrl}/wp-admin/post.php?post=${postData.id}&action=edit` // Admin edit link as last resort
    ];

    // Return the first valid URL
    for (const url of urlOptions) {
      if (url && this.isValidUrl(url)) {
        return url;
      }
    }

    // If all else fails, return a constructed URL
    return `${siteUrl}/?p=${postData.id}`;
  }

  /**
   * Verify if a WordPress post URL is accessible
   */
  async verifyPostUrl(url, wpConfig) {
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        validateStatus: (status) => status < 400 // Accept redirects
      });
      return { accessible: true, status: response.status };
    } catch (error) {
      console.warn(`Post URL not accessible: ${url}`, error.message);
      return { accessible: false, error: error.message };
    }
  }

  /**
   * Get alternative URLs for a WordPress post
   */
  getAlternativeUrls(postId, siteUrl, postData) {
    return {
      permalink: postData.link,
      directLink: `${siteUrl}/?p=${postId}`,
      adminEdit: `${siteUrl}/wp-admin/post.php?post=${postId}&action=edit`,
      preview: postData.status === 'draft' ? 
        `${siteUrl}/?p=${postId}&preview=true` : 
        postData.link
    };
  }

  formatContent(content) {
    // WordPress expects clean HTML content
    console.log('📝 Formatting content for WordPress...');
    
    // If content already has inline styles (properly formatted), preserve it EXACTLY
    if (content.includes('font-size: 17px') || content.includes('font-size: 28px')) {
      console.log('✅ Content already has inline styles, preserving EXACTLY as is');
      return content;
    }
    
    // If content already contains WordPress blocks, preserve it
    if (content.includes('<!-- wp:')) {
      console.log('📝 Content contains WordPress blocks, preserving structure');
      return content;
    }
    
    // If content already has proper HTML structure with multiple tags, preserve it
    if (content.includes('<figure class="wp-block-image">')) {
      console.log('📝 Content contains WordPress image blocks, preserving structure');
      return content;
    }
    
    console.log('📝 Applying professional formatting to content');
    
    // Clean up the content first
    let formattedContent = content.trim();
    
    // Convert markdown-style headers to HTML headers with inline styles
    formattedContent = formattedContent
      // H1 headers (# Header or ##Header or ## Header)
      .replace(/^#{1,2}\s+(.+?)$/gm, '\n\n<h2 style="font-size: 28px; font-weight: 700; color: #1a1a1a; margin: 32px 0 16px 0; line-height: 1.3;">$1</h2>\n\n')
      // H2 headers (### Header)
      .replace(/^###\s+(.+?)$/gm, '\n\n<h3 style="font-size: 22px; font-weight: 600; color: #2d2d2d; margin: 28px 0 14px 0; line-height: 1.4;">$1</h3>\n\n')
      // H3 headers (#### Header)
      .replace(/^####\s+(.+?)$/gm, '\n\n<h4 style="font-size: 18px; font-weight: 600; color: #3d3d3d; margin: 24px 0 12px 0; line-height: 1.4;">$1</h4>\n\n');
    
    // Handle images - wrap them properly with better styling
    formattedContent = formattedContent.replace(
      /<img([^>]+)>/g,
      '\n\n<img$1 style="max-width: 100%; height: auto; display: block; margin: 30px auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">\n\n'
    );
    
    // Split content into sections (by double newlines)
    const sections = formattedContent.split(/\n\n+/);
    
    // Process each section
    const processedSections = sections.map(section => {
      section = section.trim();
      
      // Skip empty sections
      if (!section) return '';
      
      // If it's already an HTML tag (header, figure, img, div, ul, ol), keep it as is
      if (section.match(/^<(h[1-6]|figure|img|div|ul|ol)/i)) {
        return section;
      }
      
      // Check if this section contains bullet points (-, *, •)
      const bulletLines = section.split('\n').filter(line => line.match(/^[\-\*\•]\s+/));
      if (bulletLines.length > 0) {
        const allLines = section.split('\n');
        const listItems = allLines
          .filter(line => line.trim())
          .map(line => {
            const cleanItem = line.replace(/^[\-\*\•]\s+/, '').replace(/^\*\*(.+?)\*\*:?/, '<strong>$1</strong>:').trim();
            return `  <li style="margin-bottom: 12px; line-height: 1.8; color: #4a4a4a;">${cleanItem}</li>`;
          })
          .join('\n');
        return `<ul style="margin: 24px 0; padding-left: 28px; list-style-type: disc;">\n${listItems}\n</ul>`;
      }
      
      // Check if this section contains numbered list
      const numberedLines = section.split('\n').filter(line => line.match(/^\d+\.\s+/));
      if (numberedLines.length > 0) {
        const allLines = section.split('\n');
        const listItems = allLines
          .filter(line => line.trim())
          .map(line => {
            const cleanItem = line.replace(/^\d+\.\s+/, '').trim();
            return `  <li style="margin-bottom: 12px; line-height: 1.8; color: #4a4a4a;">${cleanItem}</li>`;
          })
          .join('\n');
        return `<ol style="margin: 24px 0; padding-left: 28px;">\n${listItems}\n</ol>`;
      }
      
      // Handle bold text (**text** or __text__)
      section = section.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      section = section.replace(/__(.+?)__/g, '<strong>$1</strong>');
      
      // Handle italic text (*text* or _text_)
      section = section.replace(/\*(.+?)\*/g, '<em>$1</em>');
      section = section.replace(/_(.+?)_/g, '<em>$1</em>');
      
      // Regular paragraph - add proper styling
      return `<p style="font-size: 17px; line-height: 1.8; color: #333333; margin: 20px 0; text-align: justify;">${section}</p>`;
    });
    
    // Join all sections
    let finalContent = processedSections.filter(s => s).join('\n\n');
    
    console.log('✅ Content formatted with professional styling');
    return finalContent;
  }

  generateExcerpt(content, maxLength = 160) {
    // Strip all HTML tags
    let plainText = content.replace(/<[^>]*>/g, '');
    
    // Remove extra whitespace and newlines
    plainText = plainText.replace(/\s+/g, ' ').trim();
    
    // Remove markdown symbols
    plainText = plainText.replace(/[#\*\-\•]/g, '').trim();
    
    // If content is short enough, return it
    if (plainText.length <= maxLength) {
      return plainText;
    }
    
    // Find the last complete sentence within the limit
    const truncated = plainText.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastQuestion = truncated.lastIndexOf('?');
    const lastExclamation = truncated.lastIndexOf('!');
    
    const lastSentenceEnd = Math.max(lastPeriod, lastQuestion, lastExclamation);
    
    // If we found a sentence ending, use it
    if (lastSentenceEnd > maxLength * 0.6) {
      return plainText.substring(0, lastSentenceEnd + 1);
    }
    
    // Otherwise, find the last complete word
    const lastSpace = truncated.lastIndexOf(' ');
    if (lastSpace > 0) {
      return plainText.substring(0, lastSpace) + '...';
    }
    
    // Fallback: just truncate
    return truncated + '...';
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

  /**
   * Create a new category in WordPress
   */
  async createCategory(integration, categoryName) {
    try {
      const siteUrl = this.cleanUrl(integration.siteUrl);
      const auth = Buffer.from(`${integration.username}:${integration.applicationPassword}`).toString('base64');

      console.log(`📁 Creating category "${categoryName}" in WordPress...`);
      console.log(`   Site URL: ${siteUrl}`);
      console.log(`   API endpoint: ${siteUrl}/wp-json/wp/v2/categories`);

      const response = await axios.post(
        `${siteUrl}/wp-json/wp/v2/categories`,
        {
          name: categoryName,
          slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        },
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
            'User-Agent': 'SUBSTATE-WordPress-Integration/1.0'
          },
          timeout: this.defaultTimeout
        }
      );

      console.log('✅ Category created successfully:', response.data);

      return {
        id: response.data.id,
        name: response.data.name,
        slug: response.data.slug,
        count: response.data.count || 0
      };
    } catch (error) {
      console.error('❌ Error creating category:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        code: error.code
      });
      
      // Check if category already exists
      if (error.response?.status === 400 && error.response?.data?.code === 'term_exists') {
        console.log('⚠️ Category already exists, fetching existing category...');
        // Category already exists, fetch it
        const existingCategoryId = error.response.data.data?.term_id;
        if (existingCategoryId) {
          const siteUrl = this.cleanUrl(integration.siteUrl);
          const auth = Buffer.from(`${integration.username}:${integration.applicationPassword}`).toString('base64');
          
          try {
            const categoryResponse = await axios.get(
              `${siteUrl}/wp-json/wp/v2/categories/${existingCategoryId}`,
              {
                headers: { 
                  'Authorization': `Basic ${auth}`,
                  'User-Agent': 'SUBSTATE-WordPress-Integration/1.0'
                },
                timeout: this.defaultTimeout
              }
            );
            
            console.log('✅ Fetched existing category:', categoryResponse.data);
            
            return {
              id: categoryResponse.data.id,
              name: categoryResponse.data.name,
              slug: categoryResponse.data.slug,
              count: categoryResponse.data.count || 0
            };
          } catch (fetchError) {
            console.error('❌ Error fetching existing category:', fetchError.message);
            throw new Error('Category already exists but could not be fetched');
          }
        }
        throw new Error('A category with this name already exists');
      }
      
      // Handle authentication errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('WordPress authentication failed. Please check your credentials and ensure you have permission to create categories.');
      }
      
      // Handle REST API not found
      if (error.response?.status === 404) {
        throw new Error('WordPress REST API endpoint not found. Please ensure your WordPress site has the REST API enabled.');
      }
      
      // Handle network errors
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new Error('Could not connect to WordPress site. Please check the site URL.');
      }
      
      // Generic error with more details
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      throw new Error(`Failed to create category: ${errorMessage}`);
    }
  }
}

export default new WordPressService();