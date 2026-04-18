import express from 'express';
import Article from '../models/Article.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

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

// Create article
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, content, campaignId, contentType } = req.body;
    
    const article = new Article({
      userId: req.userId,
      title,
      content,
      campaignId,
      contentType,
      status: 'DRAFT',
      aiGenerated: true
    });
    
    await article.save();
    res.status(201).json(article);
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
