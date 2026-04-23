/**
 * ImageService - Handles image generation and management for articles
 * Uses Pixabay API for high-quality, royalty-free images
 */

import axios from 'axios';

class ImageService {
  static PIXABAY_API_KEY = process.env.PIXABAY_API_KEY || '55565932-eb40af64a47a183ba7243aec2';
  static PIXABAY_API_URL = 'https://pixabay.com/api/';

  /**
   * Search Pixabay for images based on keywords
   * Returns array of high-quality, relevant images
   */
  static async searchPixabayImages(keywords, imageType = 'photo', perPage = 20) {
    try {
      // Clean and enhance keywords for better relevance
      const cleanKeywords = keywords
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .slice(0, 5) // Use top 5 keywords for better matching
        .join('+');

      const response = await axios.get(this.PIXABAY_API_URL, {
        params: {
          key: this.PIXABAY_API_KEY,
          q: cleanKeywords,
          image_type: imageType, // photo, illustration, vector
          orientation: 'horizontal',
          safesearch: 'true',
          per_page: perPage,
          min_width: 1200, // Higher quality images
          min_height: 600,
          order: 'popular', // Get most popular/relevant images
          editors_choice: 'true' // Only high-quality curated images
        }
      });

      if (response.data && response.data.hits && response.data.hits.length > 0) {
        return response.data.hits;
      }

      // Fallback: Try with fewer keywords if no results
      if (cleanKeywords.includes('+')) {
        const simpleKeywords = cleanKeywords.split('+').slice(0, 2).join('+');
        const fallbackResponse = await axios.get(this.PIXABAY_API_URL, {
          params: {
            key: this.PIXABAY_API_KEY,
            q: simpleKeywords,
            image_type: imageType,
            orientation: 'horizontal',
            safesearch: 'true',
            per_page: perPage,
            min_width: 1200,
            min_height: 600,
            order: 'popular'
          }
        });

        if (fallbackResponse.data && fallbackResponse.data.hits && fallbackResponse.data.hits.length > 0) {
          return fallbackResponse.data.hits;
        }
      }

      return null;
    } catch (error) {
      console.error('Pixabay API error:', error.message);
      return null;
    }
  }

  /**
   * Get featured image URL for article
   * Uses Pixabay API for high-quality, emotionally engaging images
   * WordPress recommended size: 1200x628px (16:9 ratio)
   */
  static async getFeaturedImageUrl(keywords, width = 1200, height = 628) {
    const images = await this.searchPixabayImages(keywords, 'photo', 30);
    
    if (images && images.length > 0) {
      // Sort by relevance and quality (views + likes + downloads)
      const sortedImages = images.sort((a, b) => {
        const scoreA = (a.views || 0) + (a.likes || 0) * 10 + (a.downloads || 0) * 5;
        const scoreB = (b.views || 0) + (b.likes || 0) * 10 + (b.downloads || 0) * 5;
        return scoreB - scoreA;
      });

      // Pick from top 5 most relevant images for variety
      const topImages = sortedImages.slice(0, 5);
      const selectedImage = topImages[Math.floor(Math.random() * topImages.length)];
      
      // Return high-resolution image (largeImageURL is ~1280px wide)
      return selectedImage.largeImageURL || selectedImage.webformatURL;
    }

    // Fallback to placeholder if API fails
    return this.getFallbackImageUrl(keywords, width, height);
  }

  /**
   * Get in-content image URL with better keyword matching
   * Uses Pixabay API for emotionally relevant, high-quality images
   * WordPress optimal size: 1024x576px (16:9 ratio)
   */
  static async getContentImageUrl(keywords, width = 1024, height = 576) {
    const images = await this.searchPixabayImages(keywords, 'photo', 25);
    
    if (images && images.length > 0) {
      // Filter for high-quality images (good engagement metrics)
      const qualityImages = images.filter(img => 
        (img.likes || 0) > 50 && (img.views || 0) > 1000
      );

      const imagesToUse = qualityImages.length > 0 ? qualityImages : images;

      // Sort by relevance score
      const sortedImages = imagesToUse.sort((a, b) => {
        const scoreA = (a.likes || 0) * 10 + (a.downloads || 0) * 5;
        const scoreB = (b.likes || 0) * 10 + (b.downloads || 0) * 5;
        return scoreB - scoreA;
      });

      // Pick from top 8 for variety while maintaining quality
      const topImages = sortedImages.slice(0, 8);
      const selectedImage = topImages[Math.floor(Math.random() * topImages.length)];
      
      // Return medium-high resolution (webformatURL is ~640px, largeImageURL is ~1280px)
      // Use largeImageURL for better quality in WordPress
      return selectedImage.largeImageURL || selectedImage.webformatURL;
    }

    // Fallback to placeholder if API fails
    return this.getFallbackImageUrl(keywords, width, height);
  }

  /**
   * Get fallback image URL when Pixabay API fails
   * Uses Lorem Picsum as reliable fallback
   */
  static getFallbackImageUrl(keywords, width = 800, height = 450) {
    const randomId = Math.floor(Math.random() * 1000);
    return `https://picsum.photos/id/${randomId}/${width}/${height}`;
  }

  /**
   * Generate image HTML for WordPress with responsive support and proper sizing
   * Creates properly formatted img tag optimized for WordPress themes
   */
  static generateImageHtml(imageUrl, altText, caption = '', className = 'wp-image') {
    // WordPress standard: images should be responsive and properly styled
    let html = `\n\n<figure class="wp-block-image size-large ${className}" style="margin: 2.5rem 0;">\n`;
    html += `  <img \n`;
    html += `    src="${imageUrl}" \n`;
    html += `    alt="${altText}" \n`;
    html += `    class="wp-image" \n`;
    html += `    loading="lazy" \n`;
    html += `    decoding="async" \n`;
    html += `    width="1024" \n`;
    html += `    height="576" \n`;
    html += `    style="max-width: 100%; height: auto; display: block; margin: 0 auto; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); transition: transform 0.3s ease, box-shadow 0.3s ease;" \n`;
    html += `  />\n`;
    
    if (caption && caption.length > 0 && caption.length < 100) {
      html += `  <figcaption style="text-align: center; font-size: 14px; color: #6b7280; margin-top: 12px; font-style: italic; line-height: 1.6;">\n`;
      html += `    ${caption}\n`;
      html += `  </figcaption>\n`;
    }
    
    html += `</figure>\n\n`;
    
    return html;
  }

  /**
   * Replace image placeholders in content with actual images
   * Enhanced with smart keyword extraction and quality filtering
   */
  static async replaceImagePlaceholders(content, baseKeywords) {
    // Find all image placeholders
    const imagePlaceholderRegex = /<!--\s*IMAGE:\s*([^-]+?)\s*-->/gi;
    const placeholders = [];
    let match;
    
    // Collect all placeholders
    while ((match = imagePlaceholderRegex.exec(content)) !== null) {
      placeholders.push({
        fullMatch: match[0],
        altText: match[1].trim()
      });
    }

    if (placeholders.length === 0) {
      return {
        content: content,
        imagesReplaced: 0
      };
    }

    // Fetch images for all placeholders in parallel
    const imagePromises = placeholders.map(async (placeholder, index) => {
      // Extract and enhance keywords from alt text
      let imageKeywords = placeholder.altText || baseKeywords;
      
      // Extract most relevant keywords (first 3-5 meaningful words)
      const words = imageKeywords.split(/\s+/).filter(word => 
        word.length > 3 && // Skip short words
        !['the', 'and', 'for', 'with', 'this', 'that', 'from'].includes(word.toLowerCase())
      );
      
      const keywordArray = words.slice(0, 4).join(' ');
      
      // Combine with base keywords for better context
      const enhancedKeywords = `${keywordArray} ${baseKeywords}`.trim();
      
      // Get high-quality, relevant image from Pixabay
      const imageUrl = await this.getContentImageUrl(enhancedKeywords);
      
      // Generate descriptive caption (only if alt text is concise and meaningful)
      const caption = (placeholder.altText.length > 10 && placeholder.altText.length < 80) 
        ? placeholder.altText 
        : '';
      
      return {
        placeholder: placeholder.fullMatch,
        html: this.generateImageHtml(imageUrl, placeholder.altText, caption, 'aligncenter')
      };
    });

    // Wait for all images to be fetched
    const imageReplacements = await Promise.all(imagePromises);

    // Replace all placeholders with actual images
    let replacedContent = content;
    imageReplacements.forEach(replacement => {
      replacedContent = replacedContent.replace(replacement.placeholder, replacement.html);
    });

    return {
      content: replacedContent,
      imagesReplaced: imageReplacements.length
    };
  }

  /**
   * Generate complete article with images
   * Takes content with placeholders and returns WordPress-ready content
   */
  static async generateArticleWithImages(content, title, category) {
    // Base keywords from title and category
    const baseKeywords = `${title} ${category}`.toLowerCase();
    
    // Replace all image placeholders (async)
    const result = await this.replaceImagePlaceholders(content, baseKeywords);
    
    // Get featured image
    const featuredImageUrl = await this.getFeaturedImageUrl(baseKeywords);
    
    return {
      content: result.content,
      imagesAdded: result.imagesReplaced,
      featuredImageUrl: featuredImageUrl,
      featuredImageAlt: `${title} - Complete Guide with Expert Insights`
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
      const response = await axios.head(url);
      return response.status === 200;
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

  /**
   * Add styling to images for better presentation
   * Returns CSS that can be injected into WordPress
   */
  static getImageStyling() {
    return `
      .wp-block-image {
        margin: 2rem 0;
      }
      
      .wp-block-image img {
        max-width: 100%;
        height: auto;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transition: transform 0.3s ease;
      }
      
      .wp-block-image img:hover {
        transform: scale(1.02);
      }
      
      .wp-block-image figcaption {
        text-align: center;
        font-size: 14px;
        color: #6b7280;
        margin-top: 8px;
        font-style: italic;
      }
      
      .wp-block-image.aligncenter {
        text-align: center;
      }
    `;
  }

  /**
   * Get image attribution for Pixabay (optional but recommended)
   * Pixabay doesn't require attribution but it's good practice
   */
  static getPixabayAttribution(imageId, photographer) {
    return `Image by ${photographer} from Pixabay`;
  }
}

export default ImageService;
