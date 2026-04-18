import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../backend/models/User.js';
import Campaign from '../backend/models/Campaign.js';
import Article from '../backend/models/Article.js';
import Payment from '../backend/models/Payment.js';
import RiskScore from '../backend/models/RiskScore.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/substate';
const NUM_USERS = 500;
const CAMPAIGNS_PER_USER = 3;
const ARTICLES_PER_CAMPAIGN = 3;

// Helper functions
const generateRandomEmail = (index) => {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'test.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `user${index}_${Date.now()}@${domain}`;
};

const getRandomSubscription = () => {
  const subscriptions = ['TRIAL', 'ACTIVE', 'FAILED', 'SUSPENDED'];
  const weights = [0.15, 0.55, 0.15, 0.15];
  const rand = Math.random();
  let sum = 0;
  for (let i = 0; i < weights.length; i++) {
    sum += weights[i];
    if (rand < sum) return subscriptions[i];
  }
  return 'ACTIVE';
};

const getRandomDate = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
};

const calculateRiskScore = (user) => {
  let score = 0;
  
  // Last login risk
  const daysSinceLogin = Math.floor((Date.now() - user.lastLogin) / (1000 * 60 * 60 * 24));
  if (daysSinceLogin > 60) score += 30;
  else if (daysSinceLogin > 30) score += 15;
  else if (daysSinceLogin > 7) score += 5;
  
  // Subscription status risk
  if (user.subscription === 'FAILED') score += 30;
  else if (user.subscription === 'SUSPENDED') score += 40;
  else if (user.subscription === 'TRIAL') score += 10;
  
  // Activity risk
  if (user.articleCount === 0 && user.campaignCount === 0) score += 20;
  else if (user.articleCount < 5) score += 10;
  
  return Math.min(score, 100);
};

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Campaign.deleteMany({});
    await Article.deleteMany({});
    await Payment.deleteMany({});
    await RiskScore.deleteMany({});
    console.log('Data cleared');

    // Create users
    console.log(`Creating ${NUM_USERS} users...`);
    const users = [];
    for (let i = 0; i < NUM_USERS; i++) {
      const subscription = getRandomSubscription();
      const user = new User({
        email: generateRandomEmail(i),
        password: 'password123', // Will be hashed
        name: `User ${i + 1}`,
        subscription,
        subscriptionStartDate: getRandomDate(180),
        subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lastLogin: getRandomDate(90),
        lastActivityDate: getRandomDate(90),
        articleCount: Math.floor(Math.random() * 100),
        campaignCount: Math.floor(Math.random() * 10)
      });
      users.push(user);
    }
    await User.insertMany(users);
    console.log(`Created ${NUM_USERS} users`);

    // Create campaigns
    console.log(`Creating ${NUM_USERS * CAMPAIGNS_PER_USER} campaigns...`);
    const campaigns = [];
    const campaignTypes = ['EMAIL', 'CONTENT', 'SOCIAL', 'MULTI_CHANNEL'];
    const statuses = ['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'PAUSED'];
    
    for (let i = 0; i < users.length; i++) {
      for (let j = 0; j < CAMPAIGNS_PER_USER; j++) {
        const campaign = new Campaign({
          userId: users[i]._id,
          title: `Campaign ${j + 1} - User ${i + 1}`,
          description: `Description for campaign ${j + 1}`,
          status: statuses[Math.floor(Math.random() * statuses.length)],
          campaignType: campaignTypes[Math.floor(Math.random() * campaignTypes.length)],
          startDate: getRandomDate(90),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          articlesGenerated: Math.floor(Math.random() * 20),
          engagementRate: Math.random() * 100,
          emailsSent: Math.floor(Math.random() * 1000),
          opensCount: Math.floor(Math.random() * 500),
          clicksCount: Math.floor(Math.random() * 200),
          conversionCount: Math.floor(Math.random() * 50)
        });
        campaigns.push(campaign);
      }
    }
    await Campaign.insertMany(campaigns);
    console.log(`Created ${campaigns.length} campaigns`);

    // Create articles
    console.log(`Creating ${campaigns.length * ARTICLES_PER_CAMPAIGN} articles...`);
    const articles = [];
    const contentTypes = ['BLOG', 'NEWSLETTER', 'SOCIAL_POST', 'WHITEPAPER'];
    const articleStatuses = ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'];
    
    const sampleContent = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.`;
    
    for (let i = 0; i < campaigns.length; i++) {
      for (let j = 0; j < ARTICLES_PER_CAMPAIGN; j++) {
        const article = new Article({
          userId: campaigns[i].userId,
          campaignId: campaigns[i]._id,
          title: `Article ${j + 1} - Campaign ${i + 1}`,
          content: sampleContent,
          status: articleStatuses[Math.floor(Math.random() * articleStatuses.length)],
          contentType: contentTypes[Math.floor(Math.random() * contentTypes.length)],
          category: 'Technology',
          tags: ['ai', 'automation', 'content'],
          aiGenerated: true,
          views: Math.floor(Math.random() * 5000),
          likes: Math.floor(Math.random() * 500),
          shares: Math.floor(Math.random() * 100),
          seoScore: Math.floor(Math.random() * 100)
        });
        articles.push(article);
      }
    }
    await Article.insertMany(articles);
    console.log(`Created ${articles.length} articles`);

    // Create risk scores
    console.log(`Creating ${NUM_USERS} risk scores...`);
    const riskScores = [];
    
    for (let i = 0; i < users.length; i++) {
      const daysSinceLogin = Math.floor((Date.now() - users[i].lastLogin) / (1000 * 60 * 60 * 24));
      const overallRiskScore = calculateRiskScore(users[i]);
      
      const riskScore = new RiskScore({
        userId: users[i]._id,
        overallRiskScore,
        churnRisk: overallRiskScore * 0.4,
        paymentFailureRisk: users[i].subscription === 'FAILED' ? 80 : Math.random() * 30,
        inactivityRisk: daysSinceLogin > 30 ? 70 : daysSinceLogin > 7 ? 40 : 10,
        lowEngagementRisk: users[i].articleCount < 5 ? 60 : 20,
        daysSinceLastLogin: daysSinceLogin,
        avgArticlesPerMonth: users[i].articleCount > 0 ? Math.floor(users[i].articleCount / 6) : 0,
        avgCampaignsPerMonth: users[i].campaignCount > 0 ? Math.floor(users[i].campaignCount / 6) : 0,
        riskTrend: ['INCREASING', 'STABLE', 'DECREASING'][Math.floor(Math.random() * 3)]
      });
      riskScores.push(riskScore);
    }
    await RiskScore.insertMany(riskScores);
    console.log(`Created ${riskScores.length} risk scores`);

    // Update users with risk scores
    for (let i = 0; i < users.length; i++) {
      users[i].riskScore = riskScores[i].overallRiskScore;
    }
    await User.updateMany({}, { $set: {} });

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedDatabase();
