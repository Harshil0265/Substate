import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Article from '../backend/models/Article.js';

dotenv.config();

async function fixArticleFormatting() {
  try {
    console.log('\n' + '='.repeat(70));
    console.log('🔧 FIXING ARTICLE FORMATTING');
    console.log('='.repeat(70) + '\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find articles with problematic formatting
    const articles = await Article.find({
      $or: [
        { content: { $regex: '##\\s*[Ii]ntroduction' } }, // Contains ## Introduction
        { content: { $regex: '<h1>' } }, // Contains h1 tags (should be h2)
        { content: { $regex: 'Welcome to our latest article' } } // Old template format
      ]
    });

    console.log(`🔍 Found ${articles.length} articles with formatting issues\n`);

    if (articles.length === 0) {
      console.log('✅ No articles need formatting fixes!');
      return;
    }

    let fixedCount = 0;

    for (const article of articles) {
      console.log(`📝 Fixing: ${article.title}`);
      
      let content = article.content;
      let needsUpdate = false;

      // Fix ## Introduction to proper h2
      if (content.includes('## Introduction') || content.includes('##Introduction')) {
        content = content.replace(/##\s*[Ii]ntroduction/g, '<h2>Introduction</h2>');
        needsUpdate = true;
        console.log('   ✓ Fixed ## Introduction formatting');
      }

      // Fix other ## headers to h2
      content = content.replace(/##\s*([^#\n]+)/g, '<h2>$1</h2>');

      // Remove h1 tags and replace with h2 (except for main title)
      if (content.includes('<h1>')) {
        content = content.replace(/<h1>/g, '<h2>').replace(/<\/h1>/g, '</h2>');
        needsUpdate = true;
        console.log('   ✓ Fixed h1 tags to h2');
      }

      // Fix old template format
      if (content.includes('Welcome to our latest article')) {
        // Generate new proper content
        const campaignTitle = article.title.split(' - ')[0] || article.title;
        const newContent = generateProperArticleContent(campaignTitle, article.excerpt, article.title);
        content = newContent;
        needsUpdate = true;
        console.log('   ✓ Replaced old template with proper formatting');
      }

      // Ensure proper paragraph structure
      content = content.replace(/\n\s*\n/g, '\n').trim();

      if (needsUpdate) {
        article.content = content;
        await article.save();
        fixedCount++;
        console.log('   ✅ Article updated successfully');
      } else {
        console.log('   ℹ️ No changes needed');
      }
      console.log('');
    }

    console.log('='.repeat(70));
    console.log(`✅ FORMATTING FIX COMPLETE`);
    console.log(`   Articles processed: ${articles.length}`);
    console.log(`   Articles updated: ${fixedCount}`);
    console.log('='.repeat(70) + '\n');

    console.log('📋 PROPER ARTICLE FORMAT:');
    console.log('   ✓ <h2>Introduction</h2>');
    console.log('   ✓ <p>Proper paragraph content...</p>');
    console.log('   ✓ <h2>Section Headers</h2>');
    console.log('   ✓ No ## markdown headers');
    console.log('   ✓ No <h1> tags in content');
    console.log('   ✓ Professional, detailed content');
    console.log('');

  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB\n');
  }
}

function generateProperArticleContent(campaignTitle, description, articleTitle) {
  return `
    <h2>Introduction</h2>
    <p>${description || `This comprehensive article explores ${campaignTitle} and provides valuable insights for our readers. We'll dive deep into the key aspects and practical applications that matter most.`}</p>
    
    <p>In today's rapidly evolving landscape, understanding ${campaignTitle} has become increasingly important for individuals and organizations alike. This detailed analysis will guide you through the essential concepts, practical strategies, and expert recommendations.</p>
    
    <h2>Key Insights and Analysis</h2>
    <p>When examining ${campaignTitle} in detail, several critical factors emerge that shape our understanding. These elements work synergistically to create a comprehensive framework for success.</p>
    
    <p>The significance of ${campaignTitle} extends far beyond surface-level considerations. It encompasses a broad spectrum of applications that directly impact various aspects of our professional and personal development.</p>
    
    <h2>Practical Implementation Strategies</h2>
    <p>Implementing effective strategies related to ${campaignTitle} requires a systematic approach and careful consideration of multiple variables. Here are the proven methodologies that deliver consistent results:</p>
    
    <p><strong>Strategic Planning:</strong> Begin with a clear vision and well-defined objectives that align with your overall goals. This foundation ensures that all subsequent efforts contribute meaningfully to your desired outcomes.</p>
    
    <p><strong>Systematic Execution:</strong> Develop a structured implementation plan that breaks down complex processes into manageable, actionable steps. This approach minimizes risk while maximizing efficiency and effectiveness.</p>
    
    <p><strong>Continuous Monitoring:</strong> Establish robust tracking mechanisms to monitor progress and identify areas for improvement. Regular assessment enables timely adjustments and optimization of your approach.</p>
    
    <h2>Expert Recommendations and Best Practices</h2>
    <p>Industry leaders and subject matter experts consistently emphasize the importance of adopting proven methodologies when working with ${campaignTitle}. Their collective wisdom provides valuable guidance for achieving optimal results.</p>
    
    <p>Research indicates that organizations and individuals who follow established best practices experience significantly better outcomes compared to those who rely on ad-hoc approaches. This data-driven insight underscores the value of structured methodologies.</p>
    
    <h2>Future Trends and Developments</h2>
    <p>The landscape surrounding ${campaignTitle} continues to evolve at an unprecedented pace. Emerging technologies, changing market dynamics, and shifting consumer preferences are reshaping traditional approaches and creating new opportunities.</p>
    
    <p>Forward-thinking professionals recognize the importance of staying ahead of these trends to maintain competitive advantage and drive innovation. By understanding these developments, you can position yourself for long-term success.</p>
    
    <h2>Conclusion and Next Steps</h2>
    <p>Understanding and effectively implementing ${campaignTitle} strategies is essential for achieving sustainable success in today's competitive environment. The insights and methodologies outlined in this article provide a solid foundation for your journey forward.</p>
    
    <p>We encourage you to apply these concepts systematically and adapt them to your specific circumstances. Remember that success comes from consistent application of proven principles combined with continuous learning and improvement.</p>
    
    <p>Stay tuned for more comprehensive analyses and expert insights that will help you navigate the complexities of ${campaignTitle} and achieve your objectives with confidence.</p>
  `.trim();
}

fixArticleFormatting();