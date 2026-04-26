/**
 * Utility function for consistent word counting across the application
 * Strips HTML tags and counts actual words
 */

export function calculateWordCount(content) {
  if (!content || typeof content !== 'string') {
    return 0;
  }

  // Strip HTML tags and normalize whitespace
  const cleanContent = content
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, ' ') // Remove HTML entities
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  if (!cleanContent) {
    return 0;
  }

  // Split by whitespace and filter out empty strings
  const words = cleanContent.split(/\s+/).filter(word => word.length > 0);
  
  return words.length;
}

export function calculateReadTime(wordCount, wordsPerMinute = 200) {
  return Math.ceil(wordCount / wordsPerMinute);
}

export default {
  calculateWordCount,
  calculateReadTime
};