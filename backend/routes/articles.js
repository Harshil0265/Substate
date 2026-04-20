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

      const prompt = `Write a professional article with the following details:
Title: ${title}
Category: ${category || 'General'}

Please provide:
1. A compelling article content (600-800 words)
2. A brief excerpt (80-120 words)

Format your response as JSON with keys "content" and "excerpt".`;

      const message = await groq.messages.create({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      });

      // Parse the response
      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      
      // Try to extract JSON from the response
      let parsedContent = { content: '', excerpt: '' };
      try {
        // Look for JSON in the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsedContent = JSON.parse(jsonMatch[0]);
        } else {
          // If no JSON found, split the response
          const parts = responseText.split('\n\n');
          parsedContent = {
            content: parts[0] || responseText,
            excerpt: parts[1] || responseText.substring(0, 150)
          };
        }
      } catch (parseError) {
        // If parsing fails, use the raw response
        parsedContent = {
          content: responseText,
          excerpt: responseText.substring(0, 150)
        };
      }

      res.json({
        content: parsedContent.content,
        excerpt: parsedContent.excerpt,
        source: 'Groq AI (Free)'
      });
    } catch (apiError) {
      console.error('Groq API error:', apiError.message);
      
      // If Groq fails, provide helpful error message
      if (apiError.message.includes('API key')) {
        return res.status(500).json({ 
          error: 'Groq API key not configured. Please add GROQ_API_KEY to .env file.',
          setup: 'Get free API key at https://console.groq.com'
        });
      }
      
      throw apiError;
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
