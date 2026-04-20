import express from 'express';
import Article from '../models/Article.js';
import verifyToken from '../middleware/auth.js';
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
    const { title, category } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    try {
      const groq = getGroqClient();

      const prompt = `Write a professional article about "${title}" in the ${category || 'General'} category. 

Please write:
1. A compelling article content (600-800 words) with proper headings and structure
2. A brief excerpt (80-120 words) summarizing the article

Return ONLY a JSON object with "content" and "excerpt" keys. No other text.`;

      const completion = await groq.chat.completions.create({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
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
          // If no JSON found, create structured content
          parsedContent = {
            content: `# ${title}\n\n${responseText}`,
            excerpt: responseText.substring(0, 150) + '...'
          };
        }
      } catch (parseError) {
        // If parsing fails, create structured content from raw response
        parsedContent = {
          content: `# ${title}\n\n${responseText}`,
          excerpt: responseText.substring(0, 150) + '...'
        };
      }

      // Ensure we have content
      if (!parsedContent.content || parsedContent.content.length < 50) {
        throw new Error('Generated content is too short');
      }

      res.json({
        content: parsedContent.content,
        excerpt: parsedContent.excerpt,
        source: 'Groq AI (Free)'
      });
    } catch (apiError) {
      console.error('Groq API error:', apiError.message);
      
      // Fallback: Generate template content if API fails
      const fallbackContent = {
        content: `# ${title}

## Introduction
${title} is an important topic in the ${category || 'general'} field that deserves careful attention and understanding. This comprehensive guide will explore the key aspects, benefits, and practical applications.

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
    res.status(201).json({ article });
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
