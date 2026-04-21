/**
 * ImageService - Handles image generation and management for articles
 * Uses free placeholder image services for WordPress content
 */

class ImageService {
  /**
   * Get featured image URL for article
   * Uses Unsplash Source API for high-quality, royalty-free images
   * Recommended size: 1200x628px (WordPress standard)
   */
  static getFeaturedImageUrl(keywords, width = 1200, height = 628) {
    // Clean and format keywords for URL
    const searchTerm = keywords
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, ',');

    // Unsplash Source API - Free, high-quality images
    // Returns a random image matching the search term
    return `https://source.unsplash.com/${width}x${height}/?${searchTerm}`;
  }

  /**
   * Get in-content image URL
   * Uses Unsplash for content images
   * Recommended size: 800x450px (16:9 ratio)
   */
  static getContentImageUrl(keywords, width = 800, height = 450) {
    const searchTerm = keywords
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, ',');

    return `https://source.unsplash.com/${width}x${height}/?${searchTerm}`;
  }

  /**
   * Generate image HTML for WordPress
   * Creates properly formatted img tag with WordPress classes
   */
  static generateImageHtml(imageUrl, altText, caption = '', className = 'wp-image') {
    let html = `<figure class="wp-block-image size-large ${className}">`;
    html += `<img src="${imageUrl}" alt="${altText}" class="wp-image" loading="lazy" />`;
    
    if (caption) {
      html += `<figcaption>${caption}</figcaption>`;
    }
    
    html += `</figure>`;
    
    return html;
  }

  /**
   * Replace image placeholders in content with actual images
   * Finds <!-- IMAGE: [alt text] --> and replaces with proper img tags
   */
  static replaceImagePlaceholders(content, baseKeywords) {
    // Find all image placeholders
    const imagePlaceholderRegex = /<!--\s*IMAGE:\s*([^-]+?)\s*-->/gi;
    let imageIndex = 0;
    
    const replacedContent = content.replace(imagePlaceholderRegex, (match, altText) => {
      imageIndex++;
      
      // Extract keywords from alt text for better image matching
      const imageKeywords = altText.trim() || baseKeywords;
      
      // Get image URL
      const imageUrl = this.getContentImageUrl(imageKeywords);
      
      // Generate WordPress-compatible image HTML
      return this.generateImageHtml(imageUrl, altText.trim(), '', 'aligncenter');
    });

    return {
      content: replacedContent,
      imagesReplaced: imageIndex
    };
  }

  /**
   * Get alternative free image services
   * Fallback options if Unsplash is unavailable
   */
  static getAlternativeImageUrl(keywords, width = 800, height = 450, service = 'picsum') {
    const searchTerm = keywords.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
    
    switch (service) {
      case 'picsum':
        // Lorem Picsum - Random placeholder images
        return `https://picsum.photos/${width}/${height}`;
      
      case 'placeholder':
        // Placeholder.com - Simple colored placeholders
        return `https://via.placeholder.com/${width}x${height}/0073aa/ffffff?text=${encodeURIComponent(searchTerm)}`;
      
      case 'dummyimage':
        // DummyImage - Customizable placeholders
        return `https://dummyimage.com/${width}x${height}/0073aa/ffffff&text=${encodeURIComponent(searchTerm)}`;
      
      default:
        return this.getContentImageUrl(keywords, width, height);
    }
  }

  /**
   * Generate complete article with images
   * Takes content with placeholders and returns WordPress-ready content
   */
  static generateArticleWithImages(content, title, category) {
    // Base keywords from title and category
    const baseKeywords = `${title} ${category}`.toLowerCase();
    
    // Replace all image placeholders
    const result = this.replaceImagePlaceholders(content, baseKeywords);
    
    return {
      content: result.content,
      imagesAdded: result.imagesReplaced,
      featuredImageUrl: this.getFeaturedImageUrl(baseKeywords),
      featuredImageAlt: `${title} - Featured Image`
    };
  }

  /**
   * Get image recommendations for article
   * Suggests image placements based on content length
   */
  static getImageRecommendations(wordCount) {
    // WordPress best practice: 1 image per 300-400 words
    const recommendedImages = Math.ceil(wordCount / 350);
    
    return {
      recommended: recommendedImages,
      featuredImage: true,
      inContentImages: Math.max(3, recommendedImages - 1), // At least 3 in-content images
      placement: [
        'After introduction (150-200 words)',
        'Between major sections',
        'Before conclusion',
        'After every 300-400 words'
      ]
    };
  }

  /**
   * Validate image URL
   * Checks if image URL is accessible
   */
  static async validateImageUrl(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error('Image validation error:', error.message);
      return false;
    }
  }

  /**
   * Get WordPress-optimized image sizes
   * Returns recommended dimensions for different use cases
   */
  static getWordPressImageSizes() {
    return {
      featuredImage: {
        width: 1200,
        height: 628,
        ratio: '1.91:1',
        description: 'Featured image (social media optimized)'
      },
      contentImage: {
        width: 800,
        height: 450,
        ratio: '16:9',
        description: 'In-content image (standard)'
      },
      thumbnail: {
        width: 150,
        height: 150,
        ratio: '1:1',
        description: 'Thumbnail (archive pages)'
      },
      medium: {
        width: 300,
        height: 169,
        ratio: '16:9',
        description: 'Medium size (sidebar)'
      },
      large: {
        width: 1024,
        height: 576,
        ratio: '16:9',
        description: 'Large size (full-width)'
      }
    };
  }

  /**
   * Generate image alt text from content
   * Creates SEO-friendly alt text based on context
   */
  static generateAltText(context, keywords) {
    // Combine context and keywords for descriptive alt text
    const altText = `${context} - ${keywords}`;
    
    // Limit to 125 characters (SEO best practice)
    return altText.length > 125 
      ? altText.substring(0, 122) + '...'
      : altText;
  }
}

export default ImageService;
