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
      console.log('🔍 Searching Pixabay for:', keywords);
      
      // Clean and enhance keywords for better relevance
      const cleanKeywords = keywords
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .slice(0, 5) // Use top 5 keywords for better matching
        .join('+');

      console.log('🔑 Clean keywords:', cleanKeywords);

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
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('📊 Pixabay API response status:', response.status);
      console.log('📊 Images found:', response.data?.hits?.length || 0);

      if (response.data && response.data.hits && response.data.hits.length > 0) {
        return response.data.hits;
      }

      // Fallback: Try with fewer keywords if no results
      if (cleanKeywords.includes('+')) {
        console.log('🔄 Trying with fewer keywords...');
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
          },
          timeout: 10000
        });

        console.log('📊 Fallback search results:', fallbackResponse.data?.hits?.length || 0);

        if (fallbackResponse.data && fallbackResponse.data.hits && fallbackResponse.data.hits.length > 0) {
          return fallbackResponse.data.hits;
        }
      }

      console.log('⚠️ No images found on Pixabay');
      return null;
    } catch (error) {
      console.error('❌ Pixabay API error:', error.message);
      if (error.response) {
        console.error('📊 Response status:', error.response.status);
        console.error('📊 Response data:', error.response.data);
      }
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
    console.log('🔍 Searching for image with keywords:', keywords);
    
    const images = await this.searchPixabayImages(keywords, 'photo', 25);
    
    if (images && images.length > 0) {
      console.log('✅ Found', images.length, 'images from Pixabay');
      
      // Filter for high-quality images (good engagement metrics)
      const qualityImages = images.filter(img => 
        (img.likes || 0) > 50 && (img.views || 0) > 1000
      );

      const imagesToUse = qualityImages.length > 0 ? qualityImages : images;
      console.log('📊 Using', imagesToUse.length, 'quality images');

      // Sort by relevance score
      const sortedImages = imagesToUse.sort((a, b) => {
        const scoreA = (a.likes || 0) * 10 + (a.downloads || 0) * 5;
        const scoreB = (b.likes || 0) * 10 + (b.downloads || 0) * 5;
        return scoreB - scoreA;
      });

      // Pick from top 8 for variety while maintaining quality
      const topImages = sortedImages.slice(0, 8);
      const selectedImage = topImages[Math.floor(Math.random() * topImages.length)];
      
      const imageUrl = selectedImage.largeImageURL || selectedImage.webformatURL;
      console.log('🖼️ Selected image URL:', imageUrl);
      
      return imageUrl;
    }

    console.log('⚠️ No images found from Pixabay, using fallback');
    // Fallback to placeholder if API fails
    return this.getFallbackImageUrl(keywords, width, height);
  }

  /**
   * Get fallback image URL when Pixabay API fails
   * Uses Lorem Picsum as reliable fallback with better image quality
   */
  static getFallbackImageUrl(keywords, width = 800, height = 450) {
    console.log('🔄 Using fallback image for keywords:', keywords);
    
    // Use Unsplash Source for better quality fallback images
    // This service provides high-quality, relevant images
    const cleanKeywords = keywords.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .slice(0, 2)
      .join(',');
    
    // Try Unsplash Source first (better quality)
    if (cleanKeywords) {
      const unsplashUrl = `https://source.unsplash.com/${width}x${height}/?${cleanKeywords}`;
      console.log('🖼️ Fallback image URL (Unsplash):', unsplashUrl);
      return unsplashUrl;
    }
    
    // Final fallback to Lorem Picsum
    const randomId = Math.floor(Math.random() * 1000);
    const picsumUrl = `https://picsum.photos/id/${randomId}/${width}/${height}`;
    console.log('🖼️ Fallback image URL (Picsum):', picsumUrl);
    return picsumUrl;
  }

  /**
   * Generate image HTML for WordPress with responsive support and proper sizing
   * Creates properly formatted img tag optimized for WordPress themes
   */
  static generateImageHtml(imageUrl, altText, caption = '', className = 'wp-image') {
    // WordPress standard: Absolute simplest HTML that WordPress will definitely render
    // Using the most basic HTML structure possible
    let html = `\n\n<img src="${imageUrl}" alt="${altText}" style="max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 8px;" />\n\n`;
    
    if (caption && caption.length > 0 && caption.length < 100) {
      html += `<p style="text-align: center; font-size: 14px; color: #666; margin: 10px 0; font-style: italic;">${caption}</p>\n\n`;
    }
    
    return html;
  }

  /**
   * Replace image placeholders in content with actual images
   * Enhanced with smart keyword extraction and quality filtering
   */
  static async replaceImagePlaceholders(content, baseKeywords) {
    console.log('🖼️ Starting image placeholder replacement...');
    console.log('📝 Content length:', content.length);
    
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

    console.log('🔍 Found', placeholders.length, 'image placeholders');

    if (placeholders.length === 0) {
      console.log('⚠️ No image placeholders found in content');
      return {
        content: content,
        imagesReplaced: 0
      };
    }

    // Log found placeholders
    placeholders.forEach((placeholder, index) => {
      console.log(`📷 Placeholder ${index + 1}:`, placeholder.altText);
    });

    // Fetch images for all placeholders in parallel
    const imagePromises = placeholders.map(async (placeholder, index) => {
      console.log(`🔄 Processing image ${index + 1}:`, placeholder.altText);
      
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
      
      console.log(`🔑 Enhanced keywords for image ${index + 1}:`, enhancedKeywords);
      
      // Get high-quality, relevant image from Pixabay
      const imageUrl = await this.getContentImageUrl(enhancedKeywords);
      
      console.log(`🖼️ Image URL for ${index + 1}:`, imageUrl);
      
      // Generate descriptive caption (only if alt text is concise and meaningful)
      const caption = (placeholder.altText.length > 10 && placeholder.altText.length < 80) 
        ? placeholder.altText 
        : '';
      
      const imageHtml = this.generateImageHtml(imageUrl, placeholder.altText, caption, 'aligncenter');
      
      console.log(`✅ Generated HTML for image ${index + 1}:`, imageHtml.substring(0, 100) + '...');
      
      return {
        placeholder: placeholder.fullMatch,
        html: imageHtml
      };
    });

    // Wait for all images to be fetched
    const imageReplacements = await Promise.all(imagePromises);

    // Replace all placeholders with actual images
    let replacedContent = content;
    imageReplacements.forEach((replacement, index) => {
      console.log(`🔄 Replacing placeholder ${index + 1}:`, replacement.placeholder);
      replacedContent = replacedContent.replace(replacement.placeholder, replacement.html);
    });

    console.log('✅ Image replacement completed. Images replaced:', imageReplacements.length);
    console.log('📝 Final content length:', replacedContent.length);

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
