import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './backend/routes/auth.js';
import userRoutes from './backend/routes/users.js';
import campaignRoutes from './backend/routes/campaigns.js';
import articleRoutes from './backend/routes/articles-enhanced.js';
import authenticArticleRoutes from './backend/routes/articles-authentic.js';
import paymentRoutes from './backend/routes/payments.js';
import couponRoutes from './backend/routes/coupons.js';
import wordpressRoutes from './backend/routes/wordpress.js';
import adminRoutes from './backend/routes/admin.js';
import ReminderService from './backend/services/ReminderService.js';
import CampaignAutomationService from './backend/services/CampaignAutomationService.js';
import ArticleCleanupService from './backend/services/ArticleCleanupService.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

// MongoDB Connection - Optimized for mobile hotspot
const connectDB = async () => {
  const attemptConnection = async (uri, description) => {
    try {
      console.log(`🔄 Attempting ${description}...`);
      
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 15000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 15000,
        maxPoolSize: 10,
        family: 4, // Use IPv4 for better mobile hotspot compatibility
      });
      
      console.log(`✅ ${description} successful!`);
      return true;
    } catch (err) {
      console.error(`❌ ${description} failed:`, err.message);
      return false;
    }
  };
  
  // Try Atlas connection
  if (process.env.MONGODB_URI) {
    const success = await attemptConnection(process.env.MONGODB_URI, 'MongoDB Atlas connection');
    if (success) return;
  }
  
  // Fallback to local MongoDB
  console.log('🔄 Trying local MongoDB as fallback...');
  const localSuccess = await attemptConnection('mongodb://localhost:27017/substate', 'Local MongoDB connection');
  
  if (!localSuccess) {
    console.log('⚠️  All connection attempts failed. Server will continue without database.');
  }
};

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/articles-authentic', authenticArticleRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/wordpress', wordpressRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error' 
  });
});

// Serve frontend for all non-API routes (SPA fallback)
app.use((req, res, next) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  } else {
    next();
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start article cleanup service (runs in all environments)
  ArticleCleanupService.startScheduler();
  console.log('🗑️ Article Cleanup Service started');
  
  // Start services in production
  if (process.env.NODE_ENV === 'production') {
    ReminderService.start();
    CampaignAutomationService.start();
    console.log('🤖 Campaign Automation Service started');
  } else {
    console.log('📧 Reminder service disabled in development mode');
    console.log('🤖 Campaign Automation service disabled in development mode');
  }
});
