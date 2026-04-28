import Groq from 'groq-sdk';

class AIContentGenerator {
  constructor() {
    // Initialize multiple AI providers for fallback
    this.providers = [];
    
    // Provider 1: Groq (Primary - Fast and Free)
    if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'YOUR_GROQ_API_KEY_HERE') {
      this.providers.push({
        name: 'Groq',
        client: new Groq({ apiKey: process.env.GROQ_API_KEY }),
        model: 'llama-3.3-70b-versatile',
        type: 'groq'
      });
      console.log('✅ Groq AI provider initialized');
    }
    
    // Provider 2: Groq Alternative Key (if provided)
    if (process.env.GROQ_API_KEY_2 && process.env.GROQ_API_KEY_2 !== 'YOUR_GROQ_API_KEY_HERE') {
      this.providers.push({
        name: 'Groq-2',
        client: new Groq({ apiKey: process.env.GROQ_API_KEY_2 }),
        model: 'llama-3.3-70b-versatile',
        type: 'groq'
      });
      console.log('✅ Groq AI provider 2 initialized');
    }
    
    // Provider 3: Groq Alternative Key 3 (if provided)
    if (process.env.GROQ_API_KEY_3 && process.env.GROQ_API_KEY_3 !== 'YOUR_GROQ_API_KEY_HERE') {
      this.providers.push({
        name: 'Groq-3',
        client: new Groq({ apiKey: process.env.GROQ_API_KEY_3 }),
        model: 'llama-3.3-70b-versatile',
        type: 'groq'
      });
      console.log('✅ Groq AI provider 3 initialized');
    }
    
    if (this.providers.length === 0) {
      console.error('❌ No AI providers configured!');
      console.error('📝 Please add at least one API key to your .env file:');
      console.error('   GROQ_API_KEY=your_key_here');
      console.error('   GROQ_API_KEY_2=your_second_key_here (optional)');
      console.error('   GROQ_API_KEY_3=your_third_key_here (optional)');
      console.error('');
      console.error('Get free API keys at: https://console.groq.com');
      throw new Error('No AI providers configured. Please add API keys to your .env file.');
    }
    
    console.log(`✅ Initialized ${this.providers.length} AI provider(s) for fallback`);
  }

  /**
   * Call AI provider with automatic fallback
   */
  async callAIWithFallback(messages, options = {}) {
    const errors = [];
    
    for (let i = 0; i < this.providers.length; i++) {
      const provider = this.providers[i];
      
      try {
        console.log(`🤖 Trying provider ${i + 1}/${this.providers.length}: ${provider.name}`);
        
        const completion = await provider.client.chat.completions.create({
          messages: messages,
          model: provider.model,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 4000,
          top_p: options.top_p || 0.9
        });
        
        const content = completion.choices[0]?.message?.content || '';
        
        if (!content || content.trim().length === 0) {
          throw new Error('AI generated empty content');
        }
        
        console.log(`✅ Success with provider: ${provider.name}`);
        return content;
        
      } catch (error) {
        console.error(`❌ Provider ${provider.name} failed:`, error.message);
        errors.push({
          provider: provider.name,
          error: error.message
        });
        
        // Check if it's a rate limit error
        if (error.status === 429 || error.message.includes('rate limit')) {
          console.log(`⚠️ Rate limit hit on ${provider.name}, trying next provider...`);
        } else if (error.status === 401) {
          console.log(`⚠️ Authentication failed on ${provider.name}, trying next provider...`);
        } else {
          console.log(`⚠️ Error on ${provider.name}, trying next provider...`);
        }
        
        // If this is the last provider, throw error
        if (i === this.providers.length - 1) {
          console.error('❌ All AI providers failed!');
          console.error('Errors:', errors);
          throw new Error(`All AI providers failed. Last error: ${error.message}`);
        }
        
        // Wait a bit before trying next provider
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  async generateComprehensiveArticle(topic, requirements = {}) {
    const minWords = requirements.minLength || 1500;
    const targetWords = requirements.targetLength || 3000;
    const includeImages = requirements.includeImages !== false; // Default true
    
    const prompt = `Write a comprehensive, detailed, and engaging article about "${topic}".

CRITICAL REQUIREMENTS:
- Minimum ${minWords} words, target ${targetWords} words
- Write ACTUAL informative content about the topic, not generic business jargon
- Include specific facts, details, and real information
- Use proper article structure with multiple sections
- Make it engaging and easy to read
- Include relevant examples and explanations
- DO NOT use fake statistics like "According to McKinsey" or "Deloitte research shows"
- DO NOT use generic phrases like "digital transformation spending" or "operational efficiency through automation"
- Focus on REAL, verifiable information about ${topic}
${includeImages ? '- Add image placeholders between sections using this format: <!-- IMAGE: descriptive text about what image should show -->' : ''}

STRUCTURE:
1. Introduction - Explain what ${topic} is clearly and comprehensively
${includeImages ? '   [Add image placeholder after introduction]' : ''}
2. History and Background - Real historical information and context
${includeImages ? '   [Add image placeholder after this section]' : ''}
3. Key Concepts/Rules/Features - Detailed explanation with examples
${includeImages ? '   [Add image placeholder after this section]' : ''}
4. Important Aspects - Multiple subsections with detailed information
${includeImages ? '   [Add image placeholder between subsections]' : ''}
5. Current State/Modern Context - Recent developments and current status
${includeImages ? '   [Add image placeholder after this section]' : ''}
6. Impact and Significance - Real-world impact and importance
7. Interesting Facts or Notable Points - Specific, verifiable information
8. Conclusion - Summary and future outlook

${includeImages ? 'IMPORTANT: Add 4-6 image placeholders throughout the article using this exact format:\n<!-- IMAGE: brief description of relevant image -->\n\nExample:\n<!-- IMAGE: professional cricket player batting in stadium -->\n\nPlace image placeholders strategically between major sections to break up text and enhance visual appeal.' : ''}

WRITING STYLE:
- Professional and informative
- Focus on REAL information about ${topic}
- Avoid generic business jargon and fake statistics
- Use specific examples and concrete details
- Make every paragraph informative and valuable
- Write naturally without repetitive patterns

Start writing the comprehensive article now:`;

    try {
      console.log(`🤖 Generating AI content for: ${topic}`);
      console.log(`📏 Target: ${targetWords} words, Minimum: ${minWords} words`);
      
      const content = await this.callAIWithFallback([
        {
          role: 'system',
          content: 'You are an expert content writer who creates comprehensive, detailed, and engaging articles. You write informative content with real facts and details, never generic filler or fake statistics. You avoid business jargon and focus on providing genuine, valuable information. Your articles are well-structured, easy to read, and based on real knowledge about the topic.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.7,
        max_tokens: 8000,
        top_p: 0.9
      });
      
      if (!content || content.trim().length === 0) {
        throw new Error('AI generated empty content');
      }
      
      const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
      console.log(`✅ AI generated ${wordCount} words`);
      
      // If still too short, generate additional sections
      let finalContent = content;
      if (wordCount < minWords) {
        console.log(`⚠️ Content too short (${wordCount} words), generating additional sections...`);
        try {
          const additionalContent = await this.generateAdditionalSections(topic, content, minWords - wordCount);
          if (additionalContent && additionalContent.trim().length > 0) {
            finalContent = content + '\n\n' + additionalContent;
            const finalWordCount = finalContent.split(/\s+/).filter(w => w.length > 0).length;
            console.log(`✅ Expanded to ${finalWordCount} words`);
          }
        } catch (expandError) {
          console.log('⚠️ Could not expand content, using original:', expandError.message);
        }
      }
      
      // If AI didn't add image placeholders, add them automatically
      if (requirements.includeImages !== false && !finalContent.includes('<!-- IMAGE:')) {
        console.log('📸 AI did not add image placeholders, adding them automatically...');
        finalContent = this.addImagePlaceholders(finalContent, topic);
      }
      
      return finalContent;
      
    } catch (error) {
      console.error('❌ Error generating AI content:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        type: error.type
      });
      
      // Provide more specific error message
      if (error.message && error.message.includes('API key')) {
        throw new Error('AI API key is invalid or not configured properly. Please check your .env file.');
      } else if (error.message && error.message.includes('rate limit')) {
        throw new Error('All AI providers have hit rate limits. Please try again in a few minutes.');
      } else if (error.status === 401) {
        throw new Error('AI API authentication failed. Please check your API keys.');
      } else {
        throw new Error(`Failed to generate content: ${error.message}`);
      }
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

IMPORTANT:
- DO NOT use fake statistics or generic business jargon
- Focus on REAL, verifiable information
- Avoid repetitive patterns
- Make content informative and engaging

Write approximately ${neededWords} words of NEW, informative content:`;

    try {
      const content = await this.callAIWithFallback([
        {
          role: 'system',
          content: 'You are an expert content writer adding valuable supplementary information to articles. You provide real facts and details, never generic filler or fake statistics.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.9
      });
      
      if (!content || content.trim().length === 0) {
        console.log('⚠️ AI generated empty additional content');
        return '';
      }
      
      return content;
      
    } catch (error) {
      console.error('❌ Error generating additional sections:', error);
      console.log('⚠️ Continuing with existing content');
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

  /**
   * Generate professional email template based on campaign title and description
   * @param {string} title - Campaign title
   * @param {string} description - Campaign description
   * @param {Object} options - Additional options (tone, style, includeImages)
   * @returns {Object} - { subject, htmlContent, textContent, previewText }
   */
  async generateEmailTemplate(title, description, options = {}) {
    const tone = options.tone || 'professional';
    const style = options.style || 'modern';
    const includeImages = options.includeImages !== false;
    
    const prompt = `Generate a professional email template for an email marketing campaign.

CAMPAIGN DETAILS:
Title: ${title}
Description: ${description}

REQUIREMENTS:
- Create an engaging subject line (50-70 characters)
- Write compelling preview text (40-100 characters)
- Generate professional HTML email content
- Include clear call-to-action (CTA)
- Make it ${tone} in tone
- Use ${style} design style
- Include personalization placeholders: {{name}}, {{email}}
${includeImages ? '- Add image placeholders using: <img src="{{image_url}}" alt="description" style="max-width: 100%; height: auto;" />' : ''}

EMAIL STRUCTURE:
1. Header with brand/campaign title
2. Personalized greeting
3. Engaging introduction
4. Main content (2-3 paragraphs)
5. Clear call-to-action button
6. Supporting information or benefits
7. Footer with contact info

DESIGN GUIDELINES:
- Mobile-responsive HTML
- Professional color scheme
- Clear typography
- Proper spacing and padding
- Accessible design

Generate the email template in this JSON format:
{
  "subject": "engaging subject line here",
  "previewText": "preview text here",
  "htmlContent": "full HTML email here",
  "textContent": "plain text version here"
}

IMPORTANT: Return ONLY valid JSON, no additional text or explanation.`;

    try {
      console.log(`📧 Generating email template for: ${title}`);
      
      const response = await this.callAIWithFallback([
        {
          role: 'system',
          content: 'You are an expert email marketing copywriter and designer. You create engaging, conversion-focused email templates that are professional, mobile-responsive, and follow email marketing best practices. You always return valid JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.7,
        max_tokens: 4000,
        top_p: 0.9
      });
      
      if (!response || response.trim().length === 0) {
        throw new Error('AI generated empty response');
      }
      
      // Clean up response - remove markdown code blocks if present
      let cleanedResponse = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Parse JSON response
      let emailTemplate;
      try {
        emailTemplate = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('❌ Failed to parse AI response as JSON:', parseError);
        console.log('Raw response:', cleanedResponse.substring(0, 500));
        
        // Fallback: create basic template
        emailTemplate = this.createFallbackEmailTemplate(title, description);
      }
      
      // Validate required fields
      if (!emailTemplate.subject || !emailTemplate.htmlContent) {
        console.log('⚠️ AI response missing required fields, using fallback');
        emailTemplate = this.createFallbackEmailTemplate(title, description);
      }
      
      // Ensure textContent exists
      if (!emailTemplate.textContent) {
        emailTemplate.textContent = this.htmlToText(emailTemplate.htmlContent);
      }
      
      // Ensure previewText exists
      if (!emailTemplate.previewText) {
        emailTemplate.previewText = description.substring(0, 100);
      }
      
      console.log(`✅ Email template generated successfully`);
      console.log(`   Subject: ${emailTemplate.subject}`);
      console.log(`   Preview: ${emailTemplate.previewText}`);
      
      return emailTemplate;
      
    } catch (error) {
      console.error('❌ Error generating email template:', error);
      
      // Return fallback template
      console.log('⚠️ Using fallback email template');
      return this.createFallbackEmailTemplate(title, description);
    }
  }

  /**
   * Create a fallback email template when AI generation fails
   */
  createFallbackEmailTemplate(title, description) {
    const subject = `${title} - Important Update`;
    const previewText = description.substring(0, 100);
    
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; color: #111827; margin-bottom: 20px; font-weight: 600; }
    .message { color: #4b5563; font-size: 16px; line-height: 1.7; margin-bottom: 28px; }
    .cta-button { display: inline-block; background: #f97316; color: #ffffff; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .footer { background: #111827; padding: 30px; text-align: center; color: #9ca3af; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      <div class="greeting">Hi {{name}},</div>
      <div class="message">
        ${description}
      </div>
      <div class="message">
        We're excited to share this update with you. Click the button below to learn more.
      </div>
      <div style="text-align: center;">
        <a href="#" class="cta-button">Learn More</a>
      </div>
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} SUBSTATE. All rights reserved.</p>
      <p>You're receiving this email because you subscribed to our updates.</p>
    </div>
  </div>
</body>
</html>`;

    const textContent = `
${title}

Hi {{name}},

${description}

We're excited to share this update with you.

© ${new Date().getFullYear()} SUBSTATE. All rights reserved.
    `.trim();

    return {
      subject,
      previewText,
      htmlContent,
      textContent
    };
  }

  /**
   * Convert HTML to plain text
   */
  htmlToText(html) {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

export default AIContentGenerator;
