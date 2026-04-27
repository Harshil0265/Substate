/**
 * Fix ALL Articles Formatting
 * Apply proper HTML formatting with inline styles to all articles
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Article from '../backend/models/Article.js';

dotenv.config();

function convertToProperHTML(content, title) {
  console.log(`\n🔧 Converting: ${title}`);
  
  // Remove any existing markdown-style headers (## ##)
  let html = content.replace(/##\s*##\s*/g, '');
  
  // Convert markdown headers to HTML with inline styles
  // Match patterns like "## Header Text" or "### Header Text"
  html = html.replace(/###?\s+([^\n]+)/g, '<h2 style="font-size: 28px; font-weight: 700; color: #1a1a1a; margin: 32px 0 16px 0; line-height: 1.3;">$1</h2>');
  
  // Ensure all paragraphs have inline styles
  // First, wrap any text that's not in tags
  html = html.replace(/<\/h2>\s*([^<][^\n]+)/g, '</h2>\n\n<p style="font-size: 17px; line-height: 1.8; color: #333333; margin: 20px 0; text-align: justify;">$1</p>');
  
  // Fix existing <p> tags to have inline styles
  html = html.replace(/<p(?:\s+[^>]*)?>(?!<)/g, '<p style="font-size: 17px; line-height: 1.8; color: #333333; margin: 20px 0; text-align: justify;">');
  
  // Fix existing <h2> tags to have inline styles
  html = html.replace(/<h2(?:\s+[^>]*)?>(?!<)/g, '<h2 style="font-size: 28px; font-weight: 700; color: #1a1a1a; margin: 32px 0 16px 0; line-height: 1.3;">');
  
  // Fix existing <ul> tags
  html = html.replace(/<ul(?:\s+[^>]*)?>(?!<)/g, '<ul style="margin: 24px 0; padding-left: 28px; list-style-type: disc;">');
  
  // Fix existing <ol> tags
  html = html.replace(/<ol(?:\s+[^>]*)?>(?!<)/g, '<ol style="margin: 24px 0; padding-left: 28px;">');
  
  // Fix existing <li> tags
  html = html.replace(/<li(?:\s+[^>]*)?>(?!<)/g, '<li style="margin-bottom: 12px; line-height: 1.8; color: #4a4a4a;">');
  
  // Fix existing <img> tags to have proper styling
  html = html.replace(/<img([^>]*?)style="[^"]*"([^>]*?)>/g, '<img$1$2>');
  html = html.replace(/<img([^>]*?)>/g, '<img$1 style="max-width: 100%; height: auto; display: block; margin: 30px auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">');
  
  // Clean up multiple spaces and newlines
  html = html.replace(/\n{3,}/g, '\n\n');
  html = html.replace(/\s{2,}/g, ' ');
  
  console.log(`✅ Converted successfully`);
  return html;
}

async function fixAllArticles() {
  try {
    console.log('\n🔧 FIXING ALL ARTICLES FORMATTING\n');
    console.log('='.repeat(70));

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all articles
    const articles = await Article.find({});
    console.log(`📊 Found ${articles.length} articles to process\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const article of articles) {
      try {
        console.log(`\n${'='.repeat(70)}`);
        console.log(`Processing: ${article.title}`);
        console.log(`Current content length: ${article.content.length} characters`);
        
        // Check if already has inline styles
        const hasInlineStyles = article.content.includes('font-size: 17px');
        
        if (hasInlineStyles) {
          console.log('✅ Already has inline styles, skipping...');
          successCount++;
          continue;
        }
        
        // Convert content to proper HTML
        const formattedContent = convertToProperHTML(article.content, article.title);
        
        // Update article
        article.content = formattedContent;
        article.wordCount = formattedContent.split(/\s+/).filter(w => w.length > 0).length;
        article.updatedAt = new Date();
        article.metadata = {
          ...article.metadata,
          formattedAt: new Date(),
          autoFormatted: true
        };
        
        await article.save();
        
        console.log(`✅ Updated successfully`);
        console.log(`📊 New word count: ${article.wordCount}`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error processing ${article.title}:`, error.message);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('📊 SUMMARY');
    console.log('='.repeat(70));
    console.log(`✅ Successfully formatted: ${successCount} articles`);
    console.log(`❌ Errors: ${errorCount} articles`);
    console.log(`📊 Total processed: ${articles.length} articles`);
    
    console.log('\n✅ All articles have been formatted!');
    console.log('📝 Refresh WordPress to see the improvements\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

console.log('🚀 Starting All Articles Formatting Fix...\n');
fixAllArticles()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
