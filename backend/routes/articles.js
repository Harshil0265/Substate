import express from 'express';
import Article from '../models/Article.js';
import verifyToken from '../middleware/auth.js';
import UsageService from '../services/UsageService.js';
import ImageService from '../services/ImageService.js';
import Groq from 'groq-sdk';

const router = express.Router();

// Initialize Groq client
let groqClient = null;

const getGroqClient = () => {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('Groq API key not configured');
    }
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }
  return groqClient;
};

// Get all articles for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, campaignId } = req.query;
    const skip = (page - 1) * limit;
    
    const filter = { userId: req.userId };
    if (status) filter.status = status;
    if (campaignId) filter.campaignId = campaignId;
    
    const articles = await Article.find(filter)
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Article.countDocuments(filter);
    
    res.json({
      articles,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate content with AI using Groq (FREE - No credit card needed!)
router.post('/generate-content', verifyToken, async (req, res) => {
  try {
    const { title, category, keywords } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    try {
      const groq = getGroqClient();

      const prompt = `You are an experienced human writer and researcher. Write a comprehensive, authentic article about "${title}" in the ${category || 'General'} category as if you've personally researched this topic extensively.

CRITICAL REQUIREMENTS - Make it sound 100% HUMAN:
- Write in first person occasionally ("I've found that...", "In my research...", "What I discovered...")
- Use conversational transitions ("Here's the thing...", "Let me explain...", "You might be wondering...")
- Include personal observations and real-world examples
- Use varied sentence structures (short punchy sentences mixed with longer explanatory ones)
- Add rhetorical questions to engage readers
- Use contractions naturally (don't, can't, you'll, it's)
- Include occasional informal phrases while maintaining professionalism
- Reference "recent studies", "experts suggest", "research shows" without being too formal
- Add specific details and numbers (even if illustrative) to sound researched

WORDPRESS BEST PRACTICES (CRITICAL):
- Featured Image: Will be added separately (1200x628px recommended)
- In-content Images: Add image placeholders every 300-400 words using: <!-- IMAGE: [descriptive alt text] -->
- Proper Heading Hierarchy: H1 is the title (don't include), use H2 for main sections, H3 for subsections
- Image Placement: After introduction, between major sections, before conclusion
- Alt Text: Descriptive, keyword-rich but natural
- Paragraph Length: 2-4 sentences maximum (50-100 words)
- White Space: Use line breaks between paragraphs for readability

CONTENT STRUCTURE (1500-2000 words):

**Introduction (150-200 words):**
- Start with a relatable scenario, surprising fact, or common problem
- Hook the reader emotionally
- Briefly explain why this topic matters NOW
- Preview what they'll learn (without being robotic)
- END WITH: <!-- IMAGE: [relevant descriptive alt text for intro image] -->

**Main Content (4-6 sections):**
Each section should:
- Have a clear, benefit-driven H2 heading (not generic)
- Start with a mini-introduction explaining why this section matters
- Include 2-3 subsections with H3 headings
- Use real-world examples, case studies, or scenarios
- Add practical tips in bullet points or numbered lists
- Include transitional phrases between sections
- Mix paragraph lengths for readability
- ADD IMAGE PLACEHOLDER after every 2-3 paragraphs: <!-- IMAGE: [descriptive alt text] -->

**Visual Elements to Include:**
- Callout boxes using <div class="wp-block-group has-background">
- Pro Tips in highlighted sections
- Common mistakes in warning boxes
- Step-by-step processes with numbered lists
- Before/after scenarios with comparison
- Key takeaways in summary boxes

**Conclusion (150-200 words):**
- Summarize key takeaways naturally (not as a list)
- End with an actionable next step
- Include a thought-provoking final sentence
- Make it feel like a conversation ending, not an essay
- ADD FINAL IMAGE: <!-- IMAGE: [conclusion/call-to-action related image] -->

**Writing Style Guidelines:**
- Tone: Knowledgeable friend sharing valuable insights
- Avoid: Corporate jargon, robotic phrases, overly formal language
- Use: Active voice, specific examples, conversational flow
- Sentence variety: Mix short (5-10 words) and medium (15-25 words) sentences
- Paragraph length: 2-4 sentences max for web readability
- Add emphasis with <strong> for key points
- Use <em> for emphasis or introducing new terms

**SEO Integration (Natural, not forced):**
- Weave keywords naturally into sentences
- Use semantic variations of main keywords
- Include long-tail keyword phrases in headings
- Don't repeat keywords awkwardly
- Add keywords to image alt text naturally

**WordPress-Ready HTML Formatting:**
Use proper HTML tags:
- <h2> for main section headings (4-6 sections)
- <h3> for subsection headings
- <p> for paragraphs (keep short!)
- <strong> for bold text
- <em> for italics
- <ul><li> for bullet lists
- <ol><li> for numbered lists
- <blockquote> for quotes or callouts
- <div class="wp-block-group has-background" style="padding:20px;background-color:#f7f7f7;border-left:4px solid #0073aa;margin:20px 0;"> for callout boxes
- <!-- IMAGE: [alt text] --> for image placeholders

Return ONLY a JSON object:
{
  "content": "Full article in HTML format with proper tags, image placeholders, and human-written style",
  "excerpt": "Engaging 130-160 word summary written in conversational tone that makes people want to click and read",
  "featuredImageAlt": "Descriptive alt text for the featured image (1200x628px)",
  "imageCount": number of image placeholders included
}`;

      const completion = await groq.chat.completions.create({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: 'You are a professional human writer with 10+ years of experience. You write authentic, research-based content that sounds natural and engaging. You NEVER sound like AI - your writing has personality, uses contractions, includes personal observations, and flows conversationally. You format content perfectly for WordPress using HTML tags.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 5000,
        top_p: 0.95,
        frequency_penalty: 0.3,
        presence_penalty: 0.3
      });

      // Parse the response
      const responseText = completion.choices[0].message.content;
      
      // Try to extract JSON from the response
      let parsedContent = { content: '', excerpt: '' };
      try {
        // Look for JSON in the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedContent = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON found, create structured content with HTML
          parsedContent = {
            content: `<h2>${title}</h2>\n\n<p>${responseText}</p>`,
            excerpt: responseText.substring(0, 150) + '...'
          };
        }
      } catch (parseError) {
        // If parsing fails, create structured content from raw response
        parsedContent = {
          content: `<h2>${title}</h2>\n\n<p>${responseText}</p>`,
          excerpt: responseText.substring(0, 150) + '...'
        };
      }

      // Ensure we have substantial content
      if (!parsedContent.content || parsedContent.content.length < 800) {
        throw new Error('Generated content is too short');
      }

      // Clean up content - ensure proper HTML formatting
      let cleanContent = parsedContent.content;
      
      // Convert markdown headings to HTML if present
      cleanContent = cleanContent.replace(/^### (.*$)/gim, '<h3>$1</h3>');
      cleanContent = cleanContent.replace(/^## (.*$)/gim, '<h2>$1</h2>');
      cleanContent = cleanContent.replace(/^# (.*$)/gim, '<h2>$1</h2>');
      
      // Wrap plain text paragraphs in <p> tags if not already wrapped
      const lines = cleanContent.split('\n\n');
      cleanContent = lines.map(line => {
        line = line.trim();
        if (line && !line.startsWith('<') && !line.match(/^<\w+>/)) {
          return `<p>${line}</p>`;
        }
        return line;
      }).join('\n\n');

      // Process images - replace placeholders with actual image URLs
      const imageResult = ImageService.generateArticleWithImages(
        cleanContent,
        title,
        category || 'General'
      );

      res.json({
        content: imageResult.content,
        excerpt: parsedContent.excerpt,
        featuredImageUrl: imageResult.featuredImageUrl,
        featuredImageAlt: parsedContent.featuredImageAlt || imageResult.featuredImageAlt,
        imagesAdded: imageResult.imagesAdded,
        imageCount: parsedContent.imageCount || imageResult.imagesAdded,
        source: 'Professional Human-Style Content',
        wordCount: cleanContent.replace(/<[^>]*>/g, '').split(/\s+/).length,
        formatted: 'WordPress-Ready HTML with Images'
      });
    } catch (apiError) {
      console.error('Groq API error:', apiError.message);
      
      // Fallback: Generate template content if API fails
      const fallbackContent = {
        content: `<p>Let me share something interesting about ${title} that I've discovered through extensive research and real-world experience.</p>

<!-- IMAGE: Introduction image showing ${title} concept -->

<h2>Why This Matters Right Now</h2>
<p>${title} has become increasingly important in the ${category || 'general'} field, and here's why you should pay attention. Recent developments have shown that understanding this topic can make a significant difference in your approach.</p>

<p>In my research, I've found that professionals who master this area see measurable improvements in their results. Let me break down what you need to know.</p>

<h2>What You Need to Know</h2>
<p>Here's what I've learned after diving deep into this subject. The key is understanding not just the what, but the why and how.</p>

<h3>The Fundamentals</h3>
<p>Starting with the basics is crucial. You can't build a solid strategy without understanding the foundation.</p>

<div class="wp-block-group has-background" style="padding:20px;background-color:#f7f7f7;border-left:4px solid #0073aa;margin:20px 0;">
<p><strong>💡 Pro Tip:</strong> Focus on mastering one aspect at a time rather than trying to learn everything at once. This approach leads to better retention and practical application.</p>
</div>

<!-- IMAGE: Diagram or infographic explaining ${title} fundamentals -->

<h2>Practical Applications</h2>
<p>Let's get practical. Here are some real-world ways you can apply this knowledge:</p>

<ul>
<li><strong>Start with the fundamentals</strong> and build from there - rushing leads to mistakes</li>
<li><strong>Focus on what actually works</strong> in practice, not just theory</li>
<li><strong>Test and iterate</strong> based on your specific situation</li>
<li><strong>Learn from others</strong> who've successfully implemented these strategies</li>
</ul>

<h3>Step-by-Step Implementation</h3>
<p>Here's a practical approach I recommend:</p>

<ol>
<li><strong>Assess your current situation</strong> - understand where you're starting from</li>
<li><strong>Set clear, measurable goals</strong> - know what success looks like</li>
<li><strong>Create an action plan</strong> - break it down into manageable steps</li>
<li><strong>Execute consistently</strong> - small daily actions compound over time</li>
<li><strong>Monitor and adjust</strong> - track progress and refine your approach</li>
</ol>

<!-- IMAGE: Step-by-step process visualization for ${title} -->

<h2>Common Mistakes to Avoid</h2>
<p>I've seen people make these mistakes time and again. Don't fall into these traps:</p>

<div class="wp-block-group has-background" style="padding:20px;background-color:#fff3cd;border-left:4px solid #ffc107;margin:20px 0;">
<p><strong>⚠️ Warning:</strong> Avoid these common pitfalls:</p>
<ul>
<li>Rushing without proper understanding</li>
<li>Ignoring the basics in favor of advanced techniques</li>
<li>Not adapting strategies to your unique context</li>
<li>Giving up too soon before seeing results</li>
</ul>
</div>

<h2>Real-World Examples</h2>
<p>Let me share some examples of how this works in practice. These aren't theoretical - they're based on real implementations.</p>

<p>Consider a scenario where someone applied these principles correctly. They started small, focused on fundamentals, and gradually built up their expertise. Within months, they saw significant improvements.</p>

<blockquote>
<p>"The key isn't knowing everything - it's knowing what matters most and executing on that consistently." - Industry Expert</p>
</blockquote>

<!-- IMAGE: Success story or case study related to ${title} -->

<h2>Moving Forward</h2>
<p>The bottom line? ${title} isn't just another buzzword. It's a practical approach that can deliver real results when applied correctly.</p>

<p>Start small, stay consistent, and you'll see progress. Even small changes can lead to significant improvements over time.</p>

<h3>Your Next Steps</h3>
<p>Here's what I recommend you do right now:</p>

<ol>
<li>Review the key concepts we've covered</li>
<li>Choose one area to focus on first</li>
<li>Create a simple action plan</li>
<li>Take your first step today - not tomorrow</li>
</ol>

<p>What's your next move? Take what you've learned here and put it into action. The difference between knowing and doing is what separates success from mediocrity.</p>

<!-- IMAGE: Call-to-action or motivational image for ${title} -->

<div class="wp-block-group has-background" style="padding:20px;background-color:#e7f3ff;border-left:4px solid #0073aa;margin:20px 0;">
<p><strong>🎯 Key Takeaway:</strong> Success with ${title} comes from consistent application of proven principles, not from knowing everything. Start where you are, use what you have, and do what you can.</p>
</div>`,
        excerpt: `Explore the essential aspects of ${title} in this comprehensive guide. Learn about key concepts, best practices, and practical applications that can help you succeed in the ${category || 'general'} field. Discover real-world examples and actionable strategies.`,
        featuredImageAlt: `${title} - Complete guide with practical tips and strategies`,
        imageCount: 5
      };

      // Process fallback content with images
      const fallbackImageResult = ImageService.generateArticleWithImages(
        fallbackContent.content,
        title,
        category || 'General'
      );

      res.json({
        content: fallbackImageResult.content,
        excerpt: fallbackContent.excerpt,
        featuredImageUrl: fallbackImageResult.featuredImageUrl,
        featuredImageAlt: fallbackContent.featuredImageAlt,
        imagesAdded: fallbackImageResult.imagesAdded,
        imageCount: fallbackContent.imageCount,
        source: 'Template (Groq API unavailable)',
        wordCount: fallbackContent.content.replace(/<[^>]*>/g, '').split(/\s+/).length,
        formatted: 'WordPress-Ready HTML with Images',
        warning: 'Using template content due to API error'
      });
<p>Let's get practical. Here are some real-world ways you can apply this knowledge:</p>
<ul>
<li>Start with the fundamentals and build from there</li>
<li>Focus on what actually works in practice, not just theory</li>
<li>Test and iterate based on your specific situation</li>
</ul>

<h3>Common Mistakes to Avoid</h3>
<p>I've seen people make these mistakes time and again. Don't fall into these traps:</p>
<ul>
<li>Rushing without proper understanding</li>
<li>Ignoring the basics in favor of advanced techniques</li>
<li>Not adapting strategies to their unique context</li>
</ul>

<h3>Moving Forward</h3>
<p>The bottom line? ${title} isn't just another buzzword. It's a practical approach that can deliver real results when applied correctly. Start small, stay consistent, and you'll see progress.</p>

<p>What's your next step? Take what you've learned here and put it into action. Even small changes can lead to significant improvements over time.</p>

## Key Points
- Understanding the fundamentals of ${title}
- Best practices and proven strategies
- Real-world applications and use cases
- Future trends and developments

## Why ${title} Matters
In today's rapidly evolving landscape, ${title} has become increasingly relevant. Whether you're a beginner or an experienced professional, mastering this topic can significantly impact your success.

## Best Practices
1. **Start with the basics**: Build a solid foundation of knowledge
2. **Stay updated**: Keep track of the latest developments and trends
3. **Practice regularly**: Apply what you learn in real-world scenarios
4. **Learn from experts**: Seek guidance from experienced professionals

## Conclusion
${title} offers tremendous opportunities for growth and success. By understanding the core concepts and applying best practices, you can achieve excellent results in this area.

*This content was generated as a template. For more detailed information, consider consulting additional resources or experts in the field.*`,
        excerpt: `Explore the essential aspects of ${title} in this comprehensive guide. Learn about key concepts, best practices, and practical applications that can help you succeed in the ${category || 'general'} field.`
      };

      res.json({
        content: fallbackContent.content,
        excerpt: fallbackContent.excerpt,
        source: 'Template (Groq API unavailable)',
        warning: 'Using template content due to API error'
      });
    }
  } catch (error) {
    console.error('Content Generation Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate content' });
  }
});

// Create article
router.post('/', verifyToken, async (req, res) => {
  try {
    // Check if user can create article
    const canCreate = await UsageService.canCreateArticle(req.userId);
    
    if (!canCreate.allowed) {
      return res.status(403).json({ 
        error: canCreate.reason,
        code: canCreate.code,
        usage: canCreate.usage,
        limit: canCreate.limit
      });
    }

    const { title, content, excerpt, campaignId, contentType, category, tags, status } = req.body;
    
    const article = new Article({
      userId: req.userId,
      title,
      content,
      excerpt,
      category,
      tags,
      campaignId,
      contentType,
      status: status || 'DRAFT',
      aiGenerated: true
    });
    
    await article.save();
    
    // Update user counts
    await UsageService.updateUserCounts(req.userId);
    
    // Send usage notifications if approaching limits
    await UsageService.sendUsageNotifications(req.userId);
    
    res.status(201).json({ 
      article,
      remaining: canCreate.remaining
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get article by ID or slug
router.get('/:identifier', verifyToken, async (req, res) => {
  try {
    let article = await Article.findById(req.params.identifier);
    
    if (!article) {
      article = await Article.findOne({ slug: req.params.identifier });
    }
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    if (article.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update article status
router.patch('/:articleId', verifyToken, async (req, res) => {
  try {
    const article = await Article.findById(req.params.articleId);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    if (article.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    Object.assign(article, req.body);
    if (req.body.status === 'PUBLISHED' && !article.publishedAt) {
      article.publishedAt = new Date();
    }
    article.updatedAt = new Date();
    await article.save();
    
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update article
router.put('/:articleId', verifyToken, async (req, res) => {
  try {
    const article = await Article.findById(req.params.articleId);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    if (article.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    Object.assign(article, req.body);
    if (req.body.status === 'PUBLISHED' && !article.publishedAt) {
      article.publishedAt = new Date();
    }
    article.updatedAt = new Date();
    await article.save();
    
    res.json(article);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete article
router.delete('/:articleId', verifyToken, async (req, res) => {
  try {
    const article = await Article.findById(req.params.articleId);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    if (article.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    await Article.deleteOne({ _id: req.params.articleId });
    res.json({ message: 'Article deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
