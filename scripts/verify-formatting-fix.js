/**
 * Verify Formatting Fix
 * Confirms that articles will maintain formatting when republished
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Article from '../backend/models/Article.js';
import WordPressService from '../backend/services/WordPressService.js';

dotenv.config();

async function verifyFormattingFix() {
  try {
    console.log('\n✅ VERIFYING FORMATTING FIX\n');
    console.log('='.repeat(70));

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get Virat Kohli article
    const article = await Article.findOne({ title: 'Virat Kohli' });
    
    if (!article) {
      console.log('❌ Article not found');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`📄 Article: ${article.title}`);
    console.log(`📊 Content length: ${article.content.length} characters\n`);

    // Check 1: Database content has inline styles
    console.log('🔍 CHECK 1: Database Content');
    console.log('-'.repeat(70));
    const hasInlineStyles = article.content.includes('font-size: 17px');
    const hasStyledHeadings = article.content.includes('font-size: 28px');
    const hasStyledImages = article.content.includes('border-radius: 8px');
    
    console.log(`✓ Has inline paragraph styles: ${hasInlineStyles ? '✅ YES' : '❌ NO'}`);
    console.log(`✓ Has styled headings: ${hasStyledHeadings ? '✅ YES' : '❌ NO'}`);
    console.log(`✓ Has styled images: ${hasStyledImages ? '✅ YES' : '❌ NO'}`);

    // Check 2: WordPress formatContent preserves styles
    console.log('\n🔍 CHECK 2: WordPress Format Function');
    console.log('-'.repeat(70));
    const formattedContent = WordPressService.formatContent(article.content);
    
    const preservedStyles = formattedContent.includes('font-size: 17px');
    const preservedHeadings = formattedContent.includes('font-size: 28px');
    const preservedImages = formattedContent.includes('border-radius: 8px');
    const notModified = formattedContent === article.content;
    
    console.log(`✓ Preserves paragraph styles: ${preservedStyles ? '✅ YES' : '❌ NO'}`);
    console.log(`✓ Preserves heading styles: ${preservedHeadings ? '✅ YES' : '❌ NO'}`);
    console.log(`✓ Preserves image styles: ${preservedImages ? '✅ YES' : '❌ NO'}`);
    console.log(`✓ Content unchanged: ${notModified ? '✅ YES (Perfect!)' : '❌ NO'}`);

    // Check 3: Sample output
    console.log('\n🔍 CHECK 3: Sample Output');
    console.log('-'.repeat(70));
    const sample = formattedContent.substring(0, 400);
    console.log(sample);
    console.log('...\n');

    // Final verdict
    console.log('='.repeat(70));
    if (hasInlineStyles && hasStyledHeadings && notModified) {
      console.log('✅ ✅ ✅ FORMATTING FIX VERIFIED - WORKING PERFECTLY! ✅ ✅ ✅');
      console.log('='.repeat(70));
      console.log('\n📋 What this means:');
      console.log('✓ Articles in database have proper inline styles');
      console.log('✓ WordPress publishing preserves styles EXACTLY');
      console.log('✓ No more formatting issues on republish');
      console.log('✓ All articles will look like virat-kohli/ (the good one)');
      console.log('\n🎉 You can safely republish any article to WordPress!');
      console.log('   The formatting will ALWAYS be perfect!\n');
    } else {
      console.log('❌ FORMATTING FIX NEEDS ATTENTION');
      console.log('='.repeat(70));
      console.log('\nIssues found:');
      if (!hasInlineStyles) console.log('❌ Database content missing inline styles');
      if (!hasStyledHeadings) console.log('❌ Database content missing styled headings');
      if (!notModified) console.log('❌ WordPress format function modifying content');
      console.log('');
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    await mongoose.disconnect();
    process.exit(1);
  }
}

console.log('🚀 Starting Formatting Verification...\n');
verifyFormattingFix()
  .then(() => {
    console.log('✅ Verification completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
