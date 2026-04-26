import axios from 'axios';
import ImageService from './ImageService.js';

class WordPressImageService {
  constructor() {
    this.defaultTimeout = 30000;
  }

  /**
   * Upload image from URL to WordPress Media Library
   */
  async uploadImageFromUrl(wpConfig, imageUrl, imageData = {}) {
    try {
      console.log('📤 Uploading image to WordPress:', imageUrl);
      
      const { siteUrl, username, applicationPassword } = wpConfig;
      const cleanUrl = this.cleanUrl(siteUrl);
      
      // First, download the image
      const imageResponse = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 15000,
        headers: {
          'User-Agent': 'SUBSTATE-WordPress-Integration/1.0'
        }
      });

      // Determine file extension from URL or content type
      const contentType = imageResponse.headers['content-type'] || 'image/jpeg';
      const extension = this.getFileExtension(imageUrl, contentType);
      const filename = imageData.filename || `substate-image-${Date.now()}.${extension}`;

      // Create form data for WordPress media upload
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      
      formData.append('file', Buffer.from(imageResponse.data), {
        filename: filename,
        contentType: contentType
      });
      
      if (imageData.title) {
        formData.append('title', imageData.title);
      }
      
      if (imageData.altText) {
        formData.append('alt_text', imageData.altText);
      }
      
      if (imageData.caption) {
        formData.append('caption', imageData.caption);
      }

      // Upload to WordPress
      const uploadUrl = `${cleanUrl}/wp-json/wp/v2/media`;
      const uploadResponse = await axios.post(uploadUrl, formData, {
        auth: {
          username: username,
          password: applicationPassword
        },
        timeout: this.defaultTimeout,
        headers: {
          ...formData.getHeaders(),
          'User-Agent': 'SUBSTATE-WordPress-Integration/1.0'
        }
      });

      console.log('✅ Image uploaded to WordPress:', uploadResponse.data.id);

      return {
        success: true,
        media: {
          id: uploadResponse.data.id,
          url: uploadResponse.data.source_url,
          title: uploadResponse.data.title?.rendered || imageData.title,
          altText: uploadResponse.data.alt_text || imageData.altText,
          caption: uploadResponse.data.caption?.rendered || imageData.caption,
          sizes: uploadResponse.data.media_details?.sizes || {}
        }
      };

    } catch (error) {
      console.error('❌ Failed to upload image to WordPress:', error.message);
      return {
        success: false,
        error: error.message,
        fallbackUrl: imageUrl // Return original URL as fallback
      };
    }
  }

  /**
   * Process content and upload all images to WordPress
   */
  async processContentImages(wpConfig, content, baseKeywords = '') {
    try {
      console.log('🖼️ Processing content images for WordPress...');
      
      // First, replace image placeholders with actual images
      const imageResult = await ImageService.replaceImagePlaceholders(content, baseKeywords);
      let processedContent = imageResult.content;

      // Find all img tags in the content
      const imgRegex = /<img[^>]+src="([^"]+)"[^>]*alt="([^"]*)"[^>]*>/gi;
      const images = [];
      let match;

      while ((match = imgRegex.exec(processedContent)) !== null) {
        images.push({
          fullTag: match[0],
          url: match[1],
          altText: match[2] || ''
        });
      }

      console.log(`📊 Found ${images.length} images to process`);

      if (images.length === 0) {
        return {
          content: processedContent,
          imagesProcessed: 0,
          uploadedImages: []
        };
      }

      // Upload each image to WordPress and replace with WordPress-native blocks
      const uploadedImages = [];
      let finalContent = processedContent;

      for (let i = 0; i < images.length; i++) {
        const image = images[i];
        console.log(`📤 Processing image ${i + 1}/${images.length}: ${image.url}`);

        try {
          // Upload image to WordPress
          const uploadResult = await this.uploadImageFromUrl(wpConfig, image.url, {
            title: image.altText || `Article Image ${i + 1}`,
            altText: image.altText || `Relevant image for article content`,
            filename: `article-image-${i + 1}-${Date.now()}.jpg`
          });

          if (uploadResult.success) {
            // Create WordPress-native image block
            const wpImageBlock = this.createWordPressImageBlock(
              uploadResult.media.url,
              uploadResult.media.altText,
              uploadResult.media.caption,
              uploadResult.media.id
            );

            // Replace the original img tag with WordPress block
            finalContent = finalContent.replace(image.fullTag, wpImageBlock);
            
            uploadedImages.push({
              originalUrl: image.url,
              wordpressUrl: uploadResult.media.url,
              mediaId: uploadResult.media.id,
              altText: uploadResult.media.altText
            });

            console.log(`✅ Image ${i + 1} uploaded and replaced`);
          } else {
            // Keep original image if upload fails
            console.log(`⚠️ Image ${i + 1} upload failed, keeping original`);
            
            // Convert to simple WordPress-compatible img tag
            const simpleImg = `<img src="${image.url}" alt="${image.altText}" style="max-width: 100%; height: auto; display: block; margin: 20px auto;" />`;
            finalContent = finalContent.replace(image.fullTag, simpleImg);
          }

          // Add delay between uploads to avoid overwhelming WordPress
          if (i < images.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }

        } catch (error) {
          console.error(`❌ Error processing image ${i + 1}:`, error.message);
          
          // Keep original image on error
          const simpleImg = `<img src="${image.url}" alt="${image.altText}" style="max-width: 100%; height: auto; display: block; margin: 20px auto;" />`;
          finalContent = finalContent.replace(image.fullTag, simpleImg);
        }
      }

      console.log(`✅ Image processing complete. ${uploadedImages.length}/${images.length} images uploaded to WordPress`);

      return {
        content: finalContent,
        imagesProcessed: images.length,
        uploadedImages: uploadedImages,
        uploadSuccessRate: (uploadedImages.length / images.length) * 100
      };

    } catch (error) {
      console.error('❌ Error processing content images:', error);
      return {
        content: content,
        imagesProcessed: 0,
        uploadedImages: [],
        error: error.message
      };
    }
  }

  /**
   * Create WordPress-native image block (Gutenberg compatible)
   */
  createWordPressImageBlock(imageUrl, altText, caption = '', mediaId = null) {
    // WordPress Gutenberg image block format
    let block = `
<!-- wp:image${mediaId ? ` {"id":${mediaId}}` : ''} -->
<figure class="wp-block-image">
  <img src="${imageUrl}" alt="${altText}"${mediaId ? ` class="wp-image-${mediaId}"` : ''} style="max-width: 100%; height: auto;" />
  ${caption ? `<figcaption>${caption}</figcaption>` : ''}
</figure>
<!-- /wp:image -->
`;

    return block.trim();
  }

  /**
   * Create simple WordPress-compatible image HTML (fallback)
   */
  createSimpleWordPressImage(imageUrl, altText, caption = '') {
    let html = `<div class="wp-block-image" style="text-align: center; margin: 20px 0;">
  <img src="${imageUrl}" alt="${altText}" style="max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);" />
  ${caption ? `<p style="text-align: center; font-size: 14px; color: #666; margin: 10px 0; font-style: italic;">${caption}</p>` : ''}
</div>`;

    return html;
  }

  /**
   * Upload featured image to WordPress
   */
  async uploadFeaturedImage(wpConfig, imageUrl, imageData = {}) {
    try {
      console.log('🖼️ Uploading featured image to WordPress...');
      
      const uploadResult = await this.uploadImageFromUrl(wpConfig, imageUrl, {
        title: imageData.title || 'Featured Image',
        altText: imageData.altText || 'Article featured image',
        filename: imageData.filename || `featured-image-${Date.now()}.jpg`
      });

      if (uploadResult.success) {
        console.log('✅ Featured image uploaded successfully');
        return {
          success: true,
          mediaId: uploadResult.media.id,
          url: uploadResult.media.url,
          altText: uploadResult.media.altText
        };
      } else {
        console.log('⚠️ Featured image upload failed');
        return {
          success: false,
          error: uploadResult.error,
          fallbackUrl: imageUrl
        };
      }

    } catch (error) {
      console.error('❌ Error uploading featured image:', error);
      return {
        success: false,
        error: error.message,
        fallbackUrl: imageUrl
      };
    }
  }

  /**
   * Process article content and images for WordPress publishing
   */
  async prepareContentForWordPress(wpConfig, articleData, options = {}) {
    try {
      console.log('🔄 Preparing content for WordPress publishing...');
      
      const baseKeywords = `${articleData.title} ${options.category || ''}`.toLowerCase();
      
      // Process content images
      const contentResult = await this.processContentImages(
        wpConfig, 
        articleData.content, 
        baseKeywords
      );

      // Handle featured image if needed
      let featuredImageResult = null;
      if (options.includeFeaturedImage !== false) {
        // Get featured image URL
        const featuredImageUrl = await ImageService.getFeaturedImageUrl(baseKeywords);
        
        // Upload featured image to WordPress
        featuredImageResult = await this.uploadFeaturedImage(wpConfig, featuredImageUrl, {
          title: `${articleData.title} - Featured Image`,
          altText: `${articleData.title} featured image`,
          filename: `featured-${this.slugify(articleData.title)}.jpg`
        });
      }

      console.log('✅ Content preparation complete');

      return {
        success: true,
        content: contentResult.content,
        featuredImage: featuredImageResult,
        imagesProcessed: contentResult.imagesProcessed,
        uploadedImages: contentResult.uploadedImages,
        uploadSuccessRate: contentResult.uploadSuccessRate || 0
      };

    } catch (error) {
      console.error('❌ Error preparing content for WordPress:', error);
      return {
        success: false,
        content: articleData.content, // Return original content
        error: error.message
      };
    }
  }

  /**
   * Batch process multiple articles for WordPress
   */
  async batchProcessArticleImages(wpConfig, articles, options = {}) {
    const results = [];
    const batchSize = options.batchSize || 3; // Process 3 articles at a time
    const delay = options.delay || 2000; // 2 second delay between batches

    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize);
      
      console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(articles.length / batchSize)}`);
      
      const batchPromises = batch.map(async (article) => {
        try {
          const result = await this.prepareContentForWordPress(wpConfig, article, options);
          return {
            articleId: article.id,
            articleTitle: article.title,
            ...result
          };
        } catch (error) {
          return {
            articleId: article.id,
            articleTitle: article.title,
            success: false,
            error: error.message
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    return {
      success: true,
      results: results,
      summary: {
        total: articles.length,
        successful: successful,
        failed: failed,
        successRate: (successful / articles.length) * 100
      }
    };
  }

  // Helper methods
  cleanUrl(url) {
    return url.replace(/\/+$/, '');
  }

  getFileExtension(url, contentType) {
    // Try to get extension from URL first
    const urlExtension = url.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(urlExtension)) {
      return urlExtension;
    }

    // Fallback to content type
    const typeMap = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp'
    };

    return typeMap[contentType] || 'jpg';
  }

  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')
      .substring(0, 50);
  }

  /**
   * Validate WordPress media upload capability
   */
  async validateMediaUploadCapability(wpConfig) {
    try {
      const { siteUrl, username, applicationPassword } = wpConfig;
      const cleanUrl = this.cleanUrl(siteUrl);
      const apiUrl = `${cleanUrl}/wp-json/wp/v2/media`;

      // Test with a HEAD request to check if media endpoint is accessible
      const response = await axios.head(apiUrl, {
        auth: {
          username: username,
          password: applicationPassword
        },
        timeout: 10000
      });

      return {
        canUpload: response.status === 200 || response.status === 405, // 405 is OK for HEAD request
        message: 'Media upload capability confirmed'
      };

    } catch (error) {
      return {
        canUpload: false,
        message: `Media upload not available: ${error.message}`
      };
    }
  }

  /**
   * Get WordPress media library info
   */
  async getMediaLibraryInfo(wpConfig) {
    try {
      const { siteUrl, username, applicationPassword } = wpConfig;
      const cleanUrl = this.cleanUrl(siteUrl);
      const apiUrl = `${cleanUrl}/wp-json/wp/v2/media?per_page=1`;

      const response = await axios.get(apiUrl, {
        auth: {
          username: username,
          password: applicationPassword
        },
        timeout: 10000
      });

      return {
        success: true,
        totalMedia: parseInt(response.headers['x-wp-total'] || '0'),
        maxUploadSize: response.headers['x-wp-upload-size-limit'] || 'Unknown',
        allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

export default WordPressImageService;