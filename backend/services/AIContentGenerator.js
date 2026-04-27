import Groq from 'groq-sdk';

class AIContentGenerator {
  constructor() {
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'YOUR_GROQ_API_KEY_HERE') {
      console.error('❌ GROQ_API_KEY is not configured!');
      console.error('📝 Please follow these steps:');
      console.error('   1. Go to https://console.groq.com');
      console.error('   2. Sign up for a free account (no credit card required)');
      console.error('   3. Generate an API key');
      console.error('   4. Add it to your .env file: GROQ_API_KEY=your_key_here');
      throw new Error('GROQ_API_KEY is not configured. Please add a valid API key to your .env file.');
    }

    this.groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }

  async generateComprehensiveArticle(topic, requirements = {}) {
    const minWords = requirements.minLength || 1500;
    const targetWords = requirements.targetLength || 3000;
    const includeImages = requirements.includeImages !== false; // Default true
    
    const prompt = `Write a comprehensive, detailed, and engaging article about "${topic}".

REQUIREMENTS:
- Minimum ${minWords} words, target ${targetWords} words
- Write ACTUAL informative content about the topic, not generic filler
- Include specific facts, details, and information
- Use proper article structure with multiple sections
- Make it engaging and easy to read
- Include relevant examples and explanations
${includeImages ? '- Add image placeholders between sections using this format: <!-- IMAGE: descriptive text about what image should show -->' : ''}

STRUCTURE:
1. Introduction - Explain what ${topic} is clearly
${includeImages ? '   [Add image placeholder after introduction]' : ''}
2. History and Background - Real historical information
${includeImages ? '   [Add image placeholder after this section]' : ''}
3. Key Concepts/Rules/Features - Detailed explanation
${includeImages ? '   [Add image placeholder after this section]' : ''}
4. Important Aspects - Multiple subsections with details
${includeImages ? '   [Add image placeholder between subsections]' : ''}
5. Current State/Modern Context
${includeImages ? '   [Add image placeholder after this section]' : ''}
6. Impact and Significance
7. Interesting Facts or Notable Points
8. Conclusion

${includeImages ? 'IMPORTANT: Add 4-6 image placeholders throughout the article using this exact format:\n<!-- IMAGE: brief description of relevant image -->\n\nExample:\n<!-- IMAGE: professional cricket player batting in stadium -->\n\nPlace image placeholders strategically between major sections to break up text and enhance visual appeal.' : ''}

Write in a professional, informative style. Focus on providing REAL information about ${topic}, not generic statements. Make every paragraph count with actual content.

Start writing the article now:`;

    try {
      console.log(`🤖 Generating AI content for: ${topic}`);
      console.log(`📏 Target: ${targetWords} words, Minimum: ${minWords} words`);
      
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert content writer who creates comprehensive, detailed, and engaging articles. You write informative content with real facts and details, never generic filler. Your articles are well-structured, easy to read, and provide genuine value to readers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.3-70b-versatile', // Updated to current model
        temperature: 0.7,
        max_tokens: 8000, // Allow for long-form content
        top_p: 0.9
      });

      let content = completion.choices[0]?.message?.content || '';
      const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
      
      console.log(`✅ AI generated ${wordCount} words`);
      
      // If still too short, generate additional sections
      if (wordCount < minWords) {
        console.log(`⚠️ Content too short (${wordCount} words), generating additional sections...`);
        const additionalContent = await this.generateAdditionalSections(topic, content, minWords - wordCount);
        content = content + '\n\n' + additionalContent;
        const finalWordCount = content.split(/\s+/).filter(w => w.length > 0).length;
        console.log(`✅ Expanded to ${finalWordCount} words`);
      }
      
      // If AI didn't add image placeholders, add them automatically
      if (requirements.includeImages !== false && !content.includes('<!-- IMAGE:')) {
        console.log('📸 AI did not add image placeholders, adding them automatically...');
        content = this.addImagePlaceholders(content, topic);
      }
      
      return content;
      
    } catch (error) {
      console.error('❌ Error generating AI content:', error);
      throw error;
    }
  }

  async generateAdditionalSections(topic, existingContent, neededWords) {
    const prompt = `The article about "${topic}" needs approximately ${neededWords} more words of REAL, informative content.

EXISTING CONTENT SUMMARY:
${existingContent.substring(0, 500)}...

Generate additional detailed sections with REAL information about ${topic}. Do NOT repeat what's already covered. Add NEW valuable information such as:
- Detailed explanations of specific aspects
- Examples and case studies
- Technical details or specifications
- Cultural or regional variations
- Common misconceptions and clarifications
- Practical tips or applications
- Expert insights or analysis

Write approximately ${neededWords} words of NEW, informative content:`;

    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: 'You are an expert content writer adding valuable supplementary information to articles. You provide real facts and details, never generic filler.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        model: 'llama-3.3-70b-versatile', // Updated to current model
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.9
      });

      return completion.choices[0]?.message?.content || '';
      
    } catch (error) {
      console.error('❌ Error generating additional sections:', error);
      return '';
    }
  }

  /**
   * Automatically add image placeholders to content
   * Inserts placeholders between major sections for visual appeal
   */
  addImagePlaceholders(content, topic) {
    console.log('🖼️ Adding image placeholders to content...');
    
    // Split content into paragraphs
    const paragraphs = content.split(/\n\n+/);
    
    if (paragraphs.length < 4) {
      console.log('⚠️ Content too short for image placeholders');
      return content;
    }
    
    // Calculate optimal image placement (every 3-4 paragraphs)
    const imageInterval = Math.max(3, Math.floor(paragraphs.length / 5));
    const result = [];
    let imageCount = 0;
    
    // Extract key phrases from topic for image descriptions
    const topicWords = topic.split(/\s+/).filter(w => w.length > 3);
    
    for (let i = 0; i < paragraphs.length; i++) {
      result.push(paragraphs[i]);
      
      // Add image placeholder after certain intervals
      // Skip first paragraph (introduction) and last paragraph (conclusion)
      if (i > 0 && i < paragraphs.length - 1 && (i + 1) % imageInterval === 0 && imageCount < 6) {
        // Generate contextual image description based on surrounding content
        const contextWords = paragraphs[i]
          .split(/\s+/)
          .filter(w => w.length > 4 && /^[a-zA-Z]+$/.test(w))
          .slice(0, 3)
          .join(' ');
        
        const imageDescription = contextWords || topicWords.slice(0, 3).join(' ');
        const placeholder = `\n\n<!-- IMAGE: ${imageDescription} related to ${topic} -->\n\n`;
        
        result.push(placeholder);
        imageCount++;
        console.log(`📸 Added image placeholder ${imageCount}: ${imageDescription}`);
      }
    }
    
    console.log(`✅ Added ${imageCount} image placeholders to content`);
    return result.join('\n\n');
  }
}

export default AIContentGenerator;
