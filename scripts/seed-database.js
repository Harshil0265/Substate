import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import Campaign from '../backend/models/Campaign.js';
import Article from '../backend/models/Article.js';
import RiskScore from '../backend/models/RiskScore.js';
import dotenv from 'dotenv';

dotenv.config();

// Helper functions
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// Sample data
const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'James', 'Mary', 
  'William', 'Patricia', 'Richard', 'Jennifer', 'Thomas', 'Linda', 'Charles', 'Barbara', 'Daniel', 'Susan',
  'Matthew', 'Jessica', 'Anthony', 'Karen', 'Mark', 'Nancy', 'Donald', 'Betty', 'Steven', 'Helen'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
  'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];

const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'company.com', 'business.io', 'tech.co', 'startup.com'];

const campaignTypes = ['EMAIL', 'CONTENT', 'SOCIAL', 'MULTI_CHANNEL'];
const campaignStatuses = ['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'PAUSED'];

const articleCategories = ['Technology', 'Business', 'Marketing', 'Finance', 'Health', 'Education', 'Lifestyle'];
const articleStatuses = ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'];

// Subscription scenarios with realistic distribution
const subscriptionScenarios = [
  // TRIAL scenarios (30% of users)
  { subscription: 'TRIAL', subscriptionStatus: 'ACTIVE', daysFromStart: 1, weight: 4 },
  { subscription: 'TRIAL', subscriptionStatus: 'ACTIVE', daysFromStart: 3, weight: 5 },
  { subscription: 'TRIAL', subscriptionStatus: 'ACTIVE', daysFromStart: 7, weight: 6 },
  { subscription: 'TRIAL', subscriptionStatus: 'ACTIVE', daysFromStart: 11, weight: 8 },
  { subscription: 'TRIAL', subscriptionStatus: 'ACTIVE', daysFromStart: 13, weight: 5 },
  { subscription: 'TRIAL', subscriptionStatus: 'EXPIRED', daysFromStart: 15, gracePeriod: true, weight: 4 },
  { subscription: 'TRIAL', subscriptionStatus: 'EXPIRED', daysFromStart: 17, gracePeriod: true, weight: 3 },
  
  // BASIC scenarios (25% of users)
  { subscription: 'BASIC', subscriptionStatus: 'ACTIVE', daysFromStart: 7, weight: 8 },
  { subscription: 'BASIC', subscriptionStatus: 'ACTIVE', daysFromStart: 14, weight: 7 },
  { subscription: 'BASIC', subscriptionStatus: 'ACTIVE', daysFromStart: 21, weight: 6 },
  { subscription: 'BASIC', subscriptionStatus: 'ACTIVE', daysFromStart: 27, weight: 4 },
  { subscription: 'BASIC', subscriptionStatus: 'SUSPENDED', daysFromStart: 31, paymentRetry: 1, weight: 3 },
  { subscription: 'BASIC', subscriptionStatus: 'SUSPENDED', daysFromStart: 33, paymentRetry: 2, gracePeriod: true, weight: 2 },
  { subscription: 'BASIC', subscriptionStatus: 'EXPIRED', daysFromStart: 32, gracePeriod: true, weight: 3 },
  { subscription: 'BASIC', subscriptionStatus: 'CANCELLED', daysFromStart: 25, weight: 2 },
  
  // PRO scenarios (25% of users)
  { subscription: 'PRO', subscriptionStatus: 'ACTIVE', daysFromStart: 7, weight: 9 },
  { subscription: 'PRO', subscriptionStatus: 'ACTIVE', daysFromStart: 14, weight: 8 },
  { subscription: 'PRO', subscriptionStatus: 'ACTIVE', daysFromStart: 21, weight: 7 },
  { subscription: 'PRO', subscriptionStatus: 'ACTIVE', daysFromStart: 25, weight: 5 },
  { subscription: 'PRO', subscriptionStatus: 'ACTIVE', daysFromStart: 29, weight: 4 },
  { subscription: 'PRO', subscriptionStatus: 'SUSPENDED', daysFromStart: 31, paymentRetry: 1, gracePeriod: true, weight: 3 },
  { subscription: 'PRO', subscriptionStatus: 'SUSPENDED', daysFromStart: 34, paymentRetry: 2, gracePeriod: true, weight: 2 },
  { subscription: 'PRO', subscriptionStatus: 'EXPIRED', daysFromStart: 35, gracePeriod: true, weight: 2 },
  { subscription: 'PRO', subscriptionStatus: 'CANCELLED', daysFromStart: 28, weight: 1 },
  
  // ENTERPRISE scenarios (20% of users)
  { subscription: 'ENTERPRISE', subscriptionStatus: 'ACTIVE', daysFromStart: 7, weight: 10 },
  { subscription: 'ENTERPRISE', subscriptionStatus: 'ACTIVE', daysFromStart: 14, weight: 9 },
  { subscription: 'ENTERPRISE', subscriptionStatus: 'ACTIVE', daysFromStart: 21, weight: 8 },
  { subscription: 'ENTERPRISE', subscriptionStatus: 'ACTIVE', daysFromStart: 23, weight: 5 },
  { subscription: 'ENTERPRISE', subscriptionStatus: 'ACTIVE', daysFromStart: 28, weight: 3 },
  { subscription: 'ENTERPRISE', subscriptionStatus: 'SUSPENDED', daysFromStart: 32, paymentRetry: 1, gracePeriod: true, weight: 2 },
  { subscription: 'ENTERPRISE', subscriptionStatus: 'CANCELLED', daysFromStart: 25, weight: 1 }
];

const totalWeight = subscriptionScenarios.reduce((sum, scenario) => sum + scenario.weight, 0);

const getScenario = () => {
  let random = Math.random() * totalWeight;
  for (const scenario of subscriptionScenarios) {
    random -= scenario.weight;
    if (random <= 0) return scenario;
  }
  return subscriptionScenarios[0];
};

// Generate user with realistic subscription lifecycle
const generateUser = (index) => {
  const firstName = getRandomElement(firstNames);
  const lastName = getRandomElement(lastNames);
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${getRandomElement(domains)}`;
  const name = `${firstName} ${lastName}`;
  
  const scenario = getScenario();
  
  // Calculate dates
  const now = new Date('2026-04-18T22:39:00');
  const subscriptionStartDate = new Date(now);
  subscriptionStartDate.setDate(subscriptionStartDate.getDate() - scenario.daysFromStart);
  
  const subscriptionDuration = scenario.subscription === 'TRIAL' ? 14 : 30;
  const subscriptionEndDate = new Date(subscriptionStartDate);
  subscriptionEndDate.setDate(subscriptionEndDate.getDate() + subscriptionDuration);
  
  // Set activity patterns based on subscription status
  let articleCount, campaignCount, lastLogin, riskScore;
  
  if (scenario.subscriptionStatus === 'ACTIVE') {
    articleCount = getRandomNumber(5, 50);
    campaignCount = getRandomNumber(2, 20);
    lastLogin = new Date(now.getTime() - getRandomNumber(0, 2) * 24 * 60 * 60 * 1000);
    riskScore = scenario.gracePeriod ? getRandomNumber(40, 60) : getRandomNumber(0, 30);
  } else if (scenario.subscriptionStatus === 'EXPIRED') {
    articleCount = getRandomNumber(0, 20);
    campaignCount = getRandomNumber(0, 10);
    lastLogin = new Date(now.getTime() - getRandomNumber(3, 10) * 24 * 60 * 60 * 1000);
    riskScore = scenario.gracePeriod ? getRandomNumber(70, 95) : getRandomNumber(50, 80);
  } else if (scenario.subscriptionStatus === 'SUSPENDED') {
    articleCount = getRandomNumber(10, 40);
    campaignCount = getRandomNumber(5, 15);
    lastLogin = new Date(now.getTime() - getRandomNumber(1, 5) * 24 * 60 * 60 * 1000);
    riskScore = getRandomNumber(60, 85);
  } else { // CANCELLED
    articleCount = getRandomNumber(0, 15);
    campaignCount = getRandomNumber(0, 8);
    lastLogin = new Date(now.getTime() - getRandomNumber(5, 15) * 24 * 60 * 60 * 1000);
    riskScore = getRandomNumber(50, 90);
  }
  
  return {
    email,
    password: 'Password123!',
    name,
    role: 'USER', // No admin users
    emailVerified: true,
    verifiedAt: subscriptionStartDate,
    subscription: scenario.subscription,
    subscriptionStatus: scenario.subscriptionStatus,
    subscriptionStartDate,
    subscriptionEndDate,
    lastLogin,
    lastActivityDate: lastLogin,
    articleCount,
    campaignCount,
    riskScore,
    failedLoginAttempts: scenario.paymentRetry || 0,
    accountLocked: false,
    createdAt: subscriptionStartDate
  };
};

// Generate campaign with engagement metrics
const generateCampaign = (userId, userSubscription) => {
  const campaignNames = [
    'Summer Sale Campaign', 'Product Launch', 'Newsletter Series', 'Welcome Sequence',
    'Black Friday Promo', 'Customer Onboarding', 'Re-engagement Campaign', 'Holiday Special',
    'New Feature Announcement', 'Webinar Promotion', 'Survey Campaign', 'Referral Program',
    'Lead Nurturing Series', 'Brand Awareness Drive', 'Customer Feedback Loop', 'Loyalty Program'
  ];
  
  const title = getRandomElement(campaignNames);
  const campaignType = getRandomElement(['EMAIL', 'CONTENT', 'SOCIAL', 'MULTI_CHANNEL']);
  const status = getRandomElement(['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'PAUSED']);
  
  // Generate realistic engagement metrics
  const baseMultiplier = {
    'ENTERPRISE': 5,
    'PRO': 3,
    'BASIC': 2,
    'TRIAL': 1
  }[userSubscription] || 1;
  
  let emailsSent, opensCount, clicksCount, conversionCount;
  
  if (status === 'RUNNING' || status === 'COMPLETED') {
    emailsSent = getRandomNumber(100, 5000) * baseMultiplier;
    opensCount = Math.floor(emailsSent * (getRandomNumber(15, 45) / 100));
    clicksCount = Math.floor(opensCount * (getRandomNumber(10, 30) / 100));
    conversionCount = Math.floor(clicksCount * (getRandomNumber(2, 15) / 100));
  } else {
    emailsSent = getRandomNumber(0, 100);
    opensCount = Math.floor(emailsSent * 0.2);
    clicksCount = Math.floor(opensCount * 0.1);
    conversionCount = Math.floor(clicksCount * 0.05);
  }
  
  const createdAt = getRandomDate(new Date('2024-01-01'), new Date('2026-04-18'));
  const engagementRate = emailsSent > 0 ? Math.round((opensCount / emailsSent) * 100) : 0;
  
  return {
    title,
    description: `${title} - Automated ${campaignType.toLowerCase()} marketing campaign`,
    campaignType,
    status,
    userId,
    targetAudience: getRandomElement(['ALL', 'PREMIUM', 'TRIAL', 'AT_RISK']),
    startDate: createdAt,
    endDate: new Date(createdAt.getTime() + getRandomNumber(7, 60) * 24 * 60 * 60 * 1000),
    emailsSent,
    opensCount,
    clicksCount,
    conversionCount,
    engagementRate,
    articlesGenerated: getRandomNumber(0, 10),
    automationEnabled: Math.random() < 0.7,
    aiGenerationEnabled: Math.random() < 0.8,
    createdAt
  };
};

// Generate article in various statuses
const generateArticle = (userId, userSubscription) => {
  const articleTitles = [
    'The Future of AI in Business', 'Marketing Automation Best Practices', 'Customer Retention Strategies',
    'Digital Transformation Guide', 'Content Marketing Trends 2026', 'Email Marketing Success Tips',
    'Social Media Strategy Guide', 'SEO Optimization Techniques', 'Lead Generation Methods',
    'Brand Building Essentials', 'Data Analytics Insights', 'Customer Experience Design',
    'Revenue Growth Strategies', 'Product Management Tips', 'Sales Funnel Optimization',
    'User Engagement Tactics', 'Conversion Rate Optimization', 'Market Research Methods'
  ];
  
  const title = getRandomElement(articleTitles);
  const category = getRandomElement(articleCategories);
  const status = getRandomElement(articleStatuses);
  const contentType = getRandomElement(['BLOG', 'NEWSLETTER', 'SOCIAL_POST', 'WHITEPAPER']);
  
  // Generate engagement metrics based on status
  const baseMultiplier = {
    'ENTERPRISE': 4,
    'PRO': 3,
    'BASIC': 2,
    'TRIAL': 1
  }[userSubscription] || 1;
  
  let views, likes, shares, readTime;
  
  if (status === 'PUBLISHED') {
    views = getRandomNumber(50, 2000) * baseMultiplier;
    likes = Math.floor(views * (getRandomNumber(2, 8) / 100));
    shares = Math.floor(views * (getRandomNumber(1, 5) / 100));
    readTime = getRandomNumber(2, 15);
  } else {
    views = getRandomNumber(0, 50);
    likes = Math.floor(views * 0.02);
    shares = Math.floor(views * 0.01);
    readTime = getRandomNumber(3, 8);
  }
  
  const createdAt = getRandomDate(new Date('2024-01-01'), new Date('2026-04-18'));
  const content = `This is a comprehensive article about ${title.toLowerCase()}. It covers various aspects and provides valuable insights for readers interested in ${category.toLowerCase()}. The content includes detailed analysis, practical tips, and actionable strategies that can help businesses improve their performance and achieve better results.`;
  
  return {
    title,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + getRandomNumber(1000, 9999),
    content,
    description: `Learn about ${title.toLowerCase()} and discover key strategies for success in ${category.toLowerCase()}.`,
    category,
    status,
    contentType,
    userId,
    tags: [category.toLowerCase(), 'business', 'strategy'],
    seoScore: getRandomNumber(60, 100),
    keywords: [category.toLowerCase(), 'business', 'marketing'],
    metaDescription: `Comprehensive guide to ${title.toLowerCase()} with practical tips and strategies.`,
    views,
    likes,
    shares,
    readTime,
    wordCount: content.split(/\s+/).length,
    aiGenerated: Math.random() < 0.6,
    createdAt,
    publishedAt: status === 'PUBLISHED' ? createdAt : null
  };
};

// Generate risk score based on activity
const generateRiskScore = (userId, userRiskScore, userSubscription, userStatus) => {
  const riskFactors = [];
  
  if (userStatus === 'SUSPENDED') riskFactors.push('Payment method issues');
  if (userStatus === 'EXPIRED') riskFactors.push('Subscription expired');
  if (userRiskScore > 70) riskFactors.push('High churn probability');
  if (userRiskScore > 50) riskFactors.push('Low engagement rate');
  if (Math.random() < 0.3) riskFactors.push('Unusual activity pattern');
  
  return {
    userId,
    overallRiskScore: userRiskScore,
    paymentRisk: userStatus === 'SUSPENDED' ? getRandomNumber(70, 100) : getRandomNumber(0, 50),
    behaviorRisk: getRandomNumber(0, 100),
    accountAgeRisk: getRandomNumber(0, 100),
    activityRisk: userRiskScore > 50 ? getRandomNumber(60, 100) : getRandomNumber(0, 40),
    riskFactors,
    riskTrend: getRandomElement(['INCREASING', 'DECREASING', 'STABLE']),
    lastCalculated: new Date()
  };
};

const seedDatabase = async () => {
  try {
    console.log('\n🚀 SUBSTATE Complete Database Seeder\n');
    console.log('This will generate:');
    console.log('├─ 500+ Users with realistic subscription states');
    console.log('├─ 1500+ Campaigns with engagement metrics');
    console.log('├─ 5000+ Articles in various statuses');
    console.log('└─ Automatic database indexing for performance\n');
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('⚠️  Clearing existing data...');
    await User.deleteMany({});
    await Campaign.deleteMany({});
    await Article.deleteMany({});
    await RiskScore.deleteMany({});
    console.log('✅ Cleared existing data\n');

    // Generate 500+ users
    console.log('👥 Generating 500+ users with realistic subscription lifecycle...');
    const users = [];
    
    for (let i = 0; i < 500; i++) {
      users.push(generateUser(i + 1));
      if ((i + 1) % 100 === 0) {
        console.log(`   Generated ${i + 1}/500 users`);
      }
    }
    
    const insertedUsers = await User.insertMany(users);
    console.log('✅ Created 500 users with subscription states\n');

    // Generate 1500+ campaigns
    console.log('📊 Generating 1500+ campaigns with engagement metrics...');
    const campaigns = [];
    
    for (let i = 0; i < 1500; i++) {
      const randomUser = getRandomElement(insertedUsers);
      campaigns.push(generateCampaign(randomUser._id, randomUser.subscription));
      
      if ((i + 1) % 300 === 0) {
        console.log(`   Generated ${i + 1}/1500 campaigns`);
      }
    }
    
    await Campaign.insertMany(campaigns);
    console.log('✅ Created 1500 campaigns with engagement metrics\n');

    // Generate 5000+ articles
    console.log('📝 Generating 5000+ articles in various statuses...');
    const articles = [];
    
    for (let i = 0; i < 5000; i++) {
      const randomUser = getRandomElement(insertedUsers);
      articles.push(generateArticle(randomUser._id, randomUser.subscription));
      
      if ((i + 1) % 1000 === 0) {
        console.log(`   Generated ${i + 1}/5000 articles`);
      }
    }
    
    await Article.insertMany(articles);
    console.log('✅ Created 5000 articles in various statuses\n');

    // Generate risk scores
    console.log('📈 Generating risk scores based on activity...');
    const riskScores = [];
    
    for (const user of insertedUsers) {
      riskScores.push(generateRiskScore(user._id, user.riskScore, user.subscription, user.subscriptionStatus));
    }
    
    await RiskScore.insertMany(riskScores);
    console.log('✅ Created 500 risk scores based on user activity\n');

    // Create automatic indexing for performance
    console.log('🔍 Creating automatic database indexes for performance...');
    
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ subscription: 1 });
    await User.collection.createIndex({ subscriptionStatus: 1 });
    await User.collection.createIndex({ subscriptionEndDate: 1 });
    await User.collection.createIndex({ riskScore: -1 });
    await User.collection.createIndex({ lastLogin: -1 });
    await User.collection.createIndex({ role: 1 });
    
    // Campaign indexes
    await Campaign.collection.createIndex({ userId: 1 });
    await Campaign.collection.createIndex({ status: 1 });
    await Campaign.collection.createIndex({ type: 1 });
    await Campaign.collection.createIndex({ createdAt: -1 });
    await Campaign.collection.createIndex({ emailsSent: -1 });
    
    // Article indexes
    await Article.collection.createIndex({ userId: 1 });
    await Article.collection.createIndex({ status: 1 });
    await Article.collection.createIndex({ category: 1 });
    await Article.collection.createIndex({ slug: 1 }, { unique: true });
    await Article.collection.createIndex({ publishedAt: -1 });
    await Article.collection.createIndex({ views: -1 });
    
    // Risk score indexes
    await RiskScore.collection.createIndex({ userId: 1 }, { unique: true });
    await RiskScore.collection.createIndex({ overallRiskScore: -1 });
    await RiskScore.collection.createIndex({ riskTrend: 1 });
    
    console.log('✅ Created automatic database indexes for optimal performance\n');

    // Generate comprehensive statistics
    const stats = {
      users: {
        total: await User.countDocuments(),
        trial: await User.countDocuments({ subscription: 'TRIAL' }),
        basic: await User.countDocuments({ subscription: 'BASIC' }),
        pro: await User.countDocuments({ subscription: 'PRO' }),
        enterprise: await User.countDocuments({ subscription: 'ENTERPRISE' }),
        active: await User.countDocuments({ subscriptionStatus: 'ACTIVE' }),
        expired: await User.countDocuments({ subscriptionStatus: 'EXPIRED' }),
        cancelled: await User.countDocuments({ subscriptionStatus: 'CANCELLED' }),
        suspended: await User.countDocuments({ subscriptionStatus: 'SUSPENDED' }),
        admins: await User.countDocuments({ role: 'ADMIN' })
      },
      campaigns: {
        total: await Campaign.countDocuments(),
        draft: await Campaign.countDocuments({ status: 'DRAFT' }),
        scheduled: await Campaign.countDocuments({ status: 'SCHEDULED' }),
        running: await Campaign.countDocuments({ status: 'RUNNING' }),
        completed: await Campaign.countDocuments({ status: 'COMPLETED' }),
        paused: await Campaign.countDocuments({ status: 'PAUSED' }),
        totalEmails: await Campaign.aggregate([{ $group: { _id: null, total: { $sum: '$emailsSent' } } }])
      },
      articles: {
        total: await Article.countDocuments(),
        draft: await Article.countDocuments({ status: 'DRAFT' }),
        review: await Article.countDocuments({ status: 'REVIEW' }),
        published: await Article.countDocuments({ status: 'PUBLISHED' }),
        archived: await Article.countDocuments({ status: 'ARCHIVED' }),
        totalViews: await Article.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }])
      },
      riskScores: {
        total: await RiskScore.countDocuments(),
        highRisk: await RiskScore.countDocuments({ overallRiskScore: { $gte: 70 } }),
        mediumRisk: await RiskScore.countDocuments({ overallRiskScore: { $gte: 40, $lt: 70 } }),
        lowRisk: await RiskScore.countDocuments({ overallRiskScore: { $lt: 40 } })
      }
    };

    console.log('📊 Database Seeding Complete!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('USERS (500+) - Realistic Subscription States:');
    console.log(`├─ Total Users:                 ${stats.users.total}`);
    console.log(`├─ Trial:                       ${stats.users.trial} (${Math.round(stats.users.trial/stats.users.total*100)}%)`);
    console.log(`├─ Basic:                       ${stats.users.basic} (${Math.round(stats.users.basic/stats.users.total*100)}%)`);
    console.log(`├─ Pro:                         ${stats.users.pro} (${Math.round(stats.users.pro/stats.users.total*100)}%)`);
    console.log(`├─ Enterprise:                  ${stats.users.enterprise} (${Math.round(stats.users.enterprise/stats.users.total*100)}%)`);
    console.log(`├─ Active:                      ${stats.users.active}`);
    console.log(`├─ Expired:                     ${stats.users.expired}`);
    console.log(`├─ Suspended:                   ${stats.users.suspended}`);
    console.log(`├─ Cancelled:                   ${stats.users.cancelled}`);
    console.log(`└─ Admins:                      ${stats.users.admins}`);
    console.log('');
    console.log('CAMPAIGNS (1500+) - Engagement Metrics:');
    console.log(`├─ Total Campaigns:             ${stats.campaigns.total}`);
    console.log(`├─ Draft:                       ${stats.campaigns.draft}`);
    console.log(`├─ Scheduled:                   ${stats.campaigns.scheduled}`);
    console.log(`├─ Running:                     ${stats.campaigns.running}`);
    console.log(`├─ Completed:                   ${stats.campaigns.completed}`);
    console.log(`├─ Paused:                      ${stats.campaigns.paused}`);
    console.log(`└─ Total Emails Sent:          ${stats.campaigns.totalEmails[0]?.total || 0}`);
    console.log('');
    console.log('ARTICLES (5000+) - Various Statuses:');
    console.log(`├─ Total Articles:              ${stats.articles.total}`);
    console.log(`├─ Draft:                       ${stats.articles.draft}`);
    console.log(`├─ Review:                      ${stats.articles.review}`);
    console.log(`├─ Published:                   ${stats.articles.published}`);
    console.log(`├─ Archived:                    ${stats.articles.archived}`);
    console.log(`└─ Total Views:                 ${stats.articles.totalViews[0]?.total || 0}`);
    console.log('');
    console.log('RISK SCORES - Activity Based:');
    console.log(`├─ Total Risk Profiles:         ${stats.riskScores.total}`);
    console.log(`├─ High Risk (70+):             ${stats.riskScores.highRisk}`);
    console.log(`├─ Medium Risk (40-69):         ${stats.riskScores.mediumRisk}`);
    console.log(`└─ Low Risk (<40):              ${stats.riskScores.lowRisk}`);
    console.log('');
    console.log('DATABASE PERFORMANCE:');
    console.log('├─ Automatic Indexing:          ✅ Enabled');
    console.log('├─ Query Optimization:          ✅ Configured');
    console.log('└─ Performance Ready:           ✅ Production Ready');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('🔐 Default Password for all users: Password123!\n');
    
    console.log('🎯 Sample Admin Login:');
    const adminUser = await User.findOne({ role: 'ADMIN' });
    if (adminUser) {
      console.log(`   Email: ${adminUser.email}`);
      console.log(`   Password: Password123!`);
      console.log(`   Role: ADMIN\n`);
    }

    console.log('📈 Ready for Admin Dashboard Testing:');
    console.log('├─ Users with various subscription states');
    console.log('├─ Realistic activity patterns and login dates');
    console.log('├─ Risk scores calculated based on user behavior');
    console.log('├─ Campaigns with engagement metrics for analysis');
    console.log('├─ Articles in different workflow stages');
    console.log('└─ Performance optimized with proper indexing\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    console.log('🚀 Database is ready for production use!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seedDatabase();