import mongoose from 'mongoose';
import User from '../backend/models/User.js';
import Campaign from '../backend/models/Campaign.js';
import Article from '../backend/models/Article.js';
import dotenv from 'dotenv';

dotenv.config();

// Helper functions
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];
const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const getRandomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

const campaignTypes = ['EMAIL', 'CONTENT', 'SOCIAL', 'MULTI_CHANNEL'];
const campaignStatuses = ['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'PAUSED'];

const articleCategories = ['Technology', 'Business', 'Marketing', 'Finance', 'Health', 'Education', 'Lifestyle'];
const articleStatuses = ['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED'];
const contentTypes = ['BLOG', 'NEWSLETTER', 'SOCIAL_POST', 'WHITEPAPER'];

// Generate campaign with engagement metrics based on user subscription
const generateCampaign = (user) => {
  const campaignNames = [
    'Summer Sale Campaign', 'Product Launch', 'Newsletter Series', 'Welcome Sequence',
    'Black Friday Promo', 'Customer Onboarding', 'Re-engagement Campaign', 'Holiday Special',
    'New Feature Announcement', 'Webinar Promotion', 'Survey Campaign', 'Referral Program',
    'Lead Nurturing Series', 'Brand Awareness Drive', 'Customer Feedback Loop', 'Loyalty Program',
    'Content Marketing Push', 'Social Media Blitz', 'Email Automation Series', 'Product Demo Campaign'
  ];
  
  const title = getRandomElement(campaignNames);
  const campaignType = getRandomElement(campaignTypes);
  const status = getRandomElement(campaignStatuses);
  
  // Generate realistic engagement metrics based on user subscription level
  const subscriptionMultiplier = {
    'ENTERPRISE': 5,
    'PRO': 3,
    'BASIC': 2,
    'TRIAL': 1
  }[user.subscription] || 1;
  
  // Active users get better engagement
  const statusMultiplier = user.subscriptionStatus === 'ACTIVE' ? 1.5 : 
                          user.subscriptionStatus === 'SUSPENDED' ? 0.8 : 
                          user.subscriptionStatus === 'EXPIRED' ? 0.5 : 0.3;
  
  const finalMultiplier = subscriptionMultiplier * statusMultiplier;
  
  let emailsSent, opensCount, clicksCount, conversionCount, engagementRate;
  
  if (status === 'RUNNING' || status === 'COMPLETED') {
    emailsSent = Math.floor(getRandomNumber(100, 3000) * finalMultiplier);
    opensCount = Math.floor(emailsSent * (getRandomNumber(15, 45) / 100));
    clicksCount = Math.floor(opensCount * (getRandomNumber(10, 30) / 100));
    conversionCount = Math.floor(clicksCount * (getRandomNumber(2, 15) / 100));
    engagementRate = Math.round((opensCount / emailsSent) * 100);
  } else if (status === 'SCHEDULED') {
    emailsSent = 0;
    opensCount = 0;
    clicksCount = 0;
    conversionCount = 0;
    engagementRate = 0;
  } else { // DRAFT or PAUSED
    emailsSent = Math.floor(getRandomNumber(0, 500) * finalMultiplier);
    opensCount = Math.floor(emailsSent * 0.2);
    clicksCount = Math.floor(opensCount * 0.1);
    conversionCount = Math.floor(clicksCount * 0.05);
    engagementRate = emailsSent > 0 ? Math.round((opensCount / emailsSent) * 100) : 0;
  }
  
  const createdAt = getRandomDate(user.subscriptionStartDate, new Date('2026-04-18'));
  
  return {
    title,
    description: `${title} - ${campaignType.toLowerCase()} marketing campaign targeting ${getRandomElement(['new users', 'existing customers', 'premium subscribers', 'trial users'])}`,
    campaignType,
    status,
    userId: user._id,
    targetAudience: getRandomElement(['ALL', 'PREMIUM', 'TRIAL', 'AT_RISK']),
    startDate: createdAt,
    endDate: new Date(createdAt.getTime() + getRandomNumber(7, 60) * 24 * 60 * 60 * 1000),
    emailsSent,
    opensCount,
    clicksCount,
    conversionCount,
    engagementRate,
    articlesGenerated: status === 'COMPLETED' ? getRandomNumber(1, 8) : getRandomNumber(0, 3),
    automationEnabled: Math.random() < 0.7,
    aiGenerationEnabled: Math.random() < 0.8,
    createdAt
  };
};

// Generate article following DRAFT → REVIEW → PUBLISHED → ARCHIVED workflow
const generateArticle = (user, campaignId = null, counter = 0) => {
  const articleTitles = [
    'The Future of AI in Business', 'Marketing Automation Best Practices', 'Customer Retention Strategies',
    'Digital Transformation Guide', 'Content Marketing Trends 2026', 'Email Marketing Success Tips',
    'Social Media Strategy Guide', 'SEO Optimization Techniques', 'Lead Generation Methods',
    'Brand Building Essentials', 'Data Analytics Insights', 'Customer Experience Design',
    'Revenue Growth Strategies', 'Product Management Tips', 'Sales Funnel Optimization',
    'User Engagement Tactics', 'Conversion Rate Optimization', 'Market Research Methods',
    'Customer Journey Mapping', 'Brand Storytelling Secrets', 'Influencer Marketing Guide',
    'E-commerce Best Practices', 'Mobile Marketing Strategies', 'Video Content Creation'
  ];
  
  const title = getRandomElement(articleTitles);
  const category = getRandomElement(articleCategories);
  const contentType = getRandomElement(contentTypes);
  
  // Status workflow: DRAFT → REVIEW → PUBLISHED → ARCHIVED
  // More active users have more published content
  let status;
  if (user.subscriptionStatus === 'ACTIVE') {
    const rand = Math.random();
    if (rand < 0.5) status = 'PUBLISHED';
    else if (rand < 0.7) status = 'REVIEW';
    else if (rand < 0.9) status = 'DRAFT';
    else status = 'ARCHIVED';
  } else if (user.subscriptionStatus === 'SUSPENDED' || user.subscriptionStatus === 'EXPIRED') {
    const rand = Math.random();
    if (rand < 0.3) status = 'PUBLISHED';
    else if (rand < 0.5) status = 'REVIEW';
    else if (rand < 0.8) status = 'DRAFT';
    else status = 'ARCHIVED';
  } else { // CANCELLED
    const rand = Math.random();
    if (rand < 0.2) status = 'PUBLISHED';
    else if (rand < 0.3) status = 'ARCHIVED';
    else if (rand < 0.6) status = 'DRAFT';
    else status = 'REVIEW';
  }
  
  // Generate engagement metrics based on subscription level and status
  const subscriptionMultiplier = {
    'ENTERPRISE': 4,
    'PRO': 3,
    'BASIC': 2,
    'TRIAL': 1
  }[user.subscription] || 1;
  
  let views, likes, shares, seoScore;
  
  if (status === 'PUBLISHED') {
    views = getRandomNumber(50, 1500) * subscriptionMultiplier;
    likes = Math.floor(views * (getRandomNumber(2, 8) / 100));
    shares = Math.floor(views * (getRandomNumber(1, 5) / 100));
    seoScore = getRandomNumber(70, 100);
  } else if (status === 'ARCHIVED') {
    views = getRandomNumber(100, 800) * subscriptionMultiplier;
    likes = Math.floor(views * (getRandomNumber(1, 4) / 100));
    shares = Math.floor(views * (getRandomNumber(0.5, 2) / 100));
    seoScore = getRandomNumber(60, 90);
  } else { // DRAFT or REVIEW
    views = getRandomNumber(0, 50);
    likes = Math.floor(views * 0.02);
    shares = Math.floor(views * 0.01);
    seoScore = getRandomNumber(40, 80);
  }
  
  const createdAt = getRandomDate(user.subscriptionStartDate, new Date('2026-04-18'));
  const content = `This is a comprehensive ${contentType.toLowerCase()} about ${title.toLowerCase()}. It covers various aspects of ${category.toLowerCase()} and provides valuable insights for readers. The content includes detailed analysis, practical tips, and actionable strategies that can help businesses improve their performance and achieve better results in today's competitive market.`;
  
  // Auto-generated URL slugs with timestamp for uniqueness
  const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const timestamp = Date.now();
  const randomSuffix = getRandomNumber(1000, 9999);
  const slug = `${baseSlug}-${counter}-${timestamp}-${randomSuffix}`;
  
  // Automatic read time calculation (200 words per minute)
  const wordCount = content.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / 200);
  
  return {
    title,
    slug,
    content,
    description: `Comprehensive guide to ${title.toLowerCase()} with practical insights and strategies for ${category.toLowerCase()}.`,
    category,
    status,
    contentType,
    userId: user._id,
    campaignId,
    tags: [category.toLowerCase(), 'business', 'strategy', contentType.toLowerCase()],
    seoScore,
    keywords: [category.toLowerCase(), 'business', 'marketing', title.toLowerCase().split(' ')[0]],
    metaDescription: `Learn about ${title.toLowerCase()} and discover proven strategies for success in ${category.toLowerCase()}.`,
    views,
    likes,
    shares,
    readTime,
    wordCount,
    aiGenerated: Math.random() < 0.6,
    createdAt,
    publishedAt: status === 'PUBLISHED' ? createdAt : null
  };
};

const generateCampaignsAndArticles = async () => {
  let articleCounter = 0; // Add counter for unique slugs
  
  try {
    console.log('\n📊 SUBSTATE Campaigns & Articles Generator\n');
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check existing users
    const existingUsers = await User.find({});
    if (existingUsers.length === 0) {
      console.log('❌ No users found! Please run "pnpm run generate-users" first.\n');
      await mongoose.disconnect();
      process.exit(1);
    }

    console.log(`✅ Found ${existingUsers.length} existing users\n`);

    // Clear existing campaigns and articles
    console.log('⚠️  Clearing existing campaigns and articles...');
    await Campaign.deleteMany({});
    await Article.deleteMany({});
    console.log('✅ Cleared existing campaigns and articles\n');

    // Generate 1500+ campaigns based on existing users
    console.log('📊 Generating 1500+ campaigns with engagement tracking...');
    const campaigns = [];
    const campaignsPerUser = Math.ceil(1500 / existingUsers.length);
    
    for (const user of existingUsers) {
      const userCampaignCount = getRandomNumber(1, Math.max(1, campaignsPerUser + 2));
      
      for (let i = 0; i < userCampaignCount && campaigns.length < 1500; i++) {
        campaigns.push(generateCampaign(user));
      }
      
      if (campaigns.length >= 1500) break;
    }
    
    const insertedCampaigns = await Campaign.insertMany(campaigns);
    console.log(`✅ Created ${insertedCampaigns.length} campaigns with engagement metrics\n`);

    // Generate 5000+ articles following workflow
    console.log('📝 Generating 5000+ articles following DRAFT → REVIEW → PUBLISHED → ARCHIVED workflow...');
    const articles = [];
    const articlesPerUser = Math.ceil(5000 / existingUsers.length);
    
    for (const user of existingUsers) {
      const userArticleCount = getRandomNumber(5, Math.max(5, articlesPerUser + 5));
      const userCampaigns = insertedCampaigns.filter(c => c.userId.toString() === user._id.toString());
      
      for (let i = 0; i < userArticleCount && articles.length < 5000; i++) {
        // 30% of articles are linked to campaigns
        const linkedCampaign = Math.random() < 0.3 && userCampaigns.length > 0 
          ? getRandomElement(userCampaigns)._id 
          : null;
          
        articles.push(generateArticle(user, linkedCampaign, ++articleCounter));
      }
      
      if (articles.length >= 5000) break;
      
      if ((articles.length) % 1000 === 0) {
        console.log(`   Generated ${articles.length}/5000 articles`);
      }
    }
    
    await Article.insertMany(articles);
    console.log(`✅ Created ${articles.length} articles with workflow statuses\n`);

    // Create indexes for performance
    console.log('🔍 Creating database indexes for performance...');
    
    // Campaign indexes
    await Campaign.collection.createIndex({ userId: 1 });
    await Campaign.collection.createIndex({ status: 1 });
    await Campaign.collection.createIndex({ campaignType: 1 });
    await Campaign.collection.createIndex({ createdAt: -1 });
    await Campaign.collection.createIndex({ emailsSent: -1 });
    await Campaign.collection.createIndex({ engagementRate: -1 });
    
    // Article indexes
    await Article.collection.createIndex({ userId: 1 });
    await Article.collection.createIndex({ status: 1 });
    await Article.collection.createIndex({ category: 1 });
    await Article.collection.createIndex({ slug: 1 }, { unique: true });
    await Article.collection.createIndex({ publishedAt: -1 });
    await Article.collection.createIndex({ views: -1 });
    await Article.collection.createIndex({ campaignId: 1 });
    
    console.log('✅ Created database indexes for optimal performance\n');

    // Generate comprehensive statistics
    const stats = {
      users: {
        total: await User.countDocuments(),
        active: await User.countDocuments({ subscriptionStatus: 'ACTIVE' }),
        trial: await User.countDocuments({ subscription: 'TRIAL' }),
        basic: await User.countDocuments({ subscription: 'BASIC' }),
        pro: await User.countDocuments({ subscription: 'PRO' }),
        enterprise: await User.countDocuments({ subscription: 'ENTERPRISE' })
      },
      campaigns: {
        total: await Campaign.countDocuments(),
        draft: await Campaign.countDocuments({ status: 'DRAFT' }),
        scheduled: await Campaign.countDocuments({ status: 'SCHEDULED' }),
        running: await Campaign.countDocuments({ status: 'RUNNING' }),
        completed: await Campaign.countDocuments({ status: 'COMPLETED' }),
        paused: await Campaign.countDocuments({ status: 'PAUSED' }),
        email: await Campaign.countDocuments({ campaignType: 'EMAIL' }),
        content: await Campaign.countDocuments({ campaignType: 'CONTENT' }),
        social: await Campaign.countDocuments({ campaignType: 'SOCIAL' }),
        multiChannel: await Campaign.countDocuments({ campaignType: 'MULTI_CHANNEL' }),
        totalEmails: await Campaign.aggregate([{ $group: { _id: null, total: { $sum: '$emailsSent' } } }]),
        totalOpens: await Campaign.aggregate([{ $group: { _id: null, total: { $sum: '$opensCount' } } }]),
        totalClicks: await Campaign.aggregate([{ $group: { _id: null, total: { $sum: '$clicksCount' } } }])
      },
      articles: {
        total: await Article.countDocuments(),
        draft: await Article.countDocuments({ status: 'DRAFT' }),
        review: await Article.countDocuments({ status: 'REVIEW' }),
        published: await Article.countDocuments({ status: 'PUBLISHED' }),
        archived: await Article.countDocuments({ status: 'ARCHIVED' }),
        blog: await Article.countDocuments({ contentType: 'BLOG' }),
        newsletter: await Article.countDocuments({ contentType: 'NEWSLETTER' }),
        socialPost: await Article.countDocuments({ contentType: 'SOCIAL_POST' }),
        whitepaper: await Article.countDocuments({ contentType: 'WHITEPAPER' }),
        totalViews: await Article.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
        totalLikes: await Article.aggregate([{ $group: { _id: null, total: { $sum: '$likes' } } }]),
        avgSeoScore: await Article.aggregate([{ $group: { _id: null, avg: { $avg: '$seoScore' } } }])
      }
    };

    console.log('📊 Campaigns & Articles Generation Complete!\n');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('EXISTING USERS:');
    console.log(`├─ Total Users:                 ${stats.users.total}`);
    console.log(`├─ Active Users:                ${stats.users.active}`);
    console.log(`├─ Trial:                       ${stats.users.trial}`);
    console.log(`├─ Basic:                       ${stats.users.basic}`);
    console.log(`├─ Pro:                         ${stats.users.pro}`);
    console.log(`└─ Enterprise:                  ${stats.users.enterprise}`);
    console.log('');
    console.log('CAMPAIGNS (1500+) - Management & Engagement:');
    console.log(`├─ Total Campaigns:             ${stats.campaigns.total}`);
    console.log(`├─ Draft:                       ${stats.campaigns.draft}`);
    console.log(`├─ Scheduled:                   ${stats.campaigns.scheduled}`);
    console.log(`├─ Running:                     ${stats.campaigns.running}`);
    console.log(`├─ Completed:                   ${stats.campaigns.completed}`);
    console.log(`├─ Paused:                      ${stats.campaigns.paused}`);
    console.log('│');
    console.log('├─ Campaign Types:');
    console.log(`│  ├─ EMAIL:                   ${stats.campaigns.email}`);
    console.log(`│  ├─ CONTENT:                 ${stats.campaigns.content}`);
    console.log(`│  ├─ SOCIAL:                  ${stats.campaigns.social}`);
    console.log(`│  └─ MULTI_CHANNEL:           ${stats.campaigns.multiChannel}`);
    console.log('│');
    console.log('└─ Engagement Tracking:');
    console.log(`   ├─ Total Emails Sent:       ${stats.campaigns.totalEmails[0]?.total || 0}`);
    console.log(`   ├─ Total Opens:              ${stats.campaigns.totalOpens[0]?.total || 0}`);
    console.log(`   └─ Total Clicks:             ${stats.campaigns.totalClicks[0]?.total || 0}`);
    console.log('');
    console.log('ARTICLES (5000+) - Workflow & Content:');
    console.log(`├─ Total Articles:              ${stats.articles.total}`);
    console.log(`├─ Workflow Status:`);
    console.log(`│  ├─ DRAFT:                   ${stats.articles.draft}`);
    console.log(`│  ├─ REVIEW:                  ${stats.articles.review}`);
    console.log(`│  ├─ PUBLISHED:               ${stats.articles.published}`);
    console.log(`│  └─ ARCHIVED:                ${stats.articles.archived}`);
    console.log('│');
    console.log('├─ Content Types:');
    console.log(`│  ├─ BLOG:                    ${stats.articles.blog}`);
    console.log(`│  ├─ NEWSLETTER:              ${stats.articles.newsletter}`);
    console.log(`│  ├─ SOCIAL_POST:             ${stats.articles.socialPost}`);
    console.log(`│  └─ WHITEPAPER:              ${stats.articles.whitepaper}`);
    console.log('│');
    console.log('└─ Engagement Metrics:');
    console.log(`   ├─ Total Views:              ${stats.articles.totalViews[0]?.total || 0}`);
    console.log(`   ├─ Total Likes:              ${stats.articles.totalLikes[0]?.total || 0}`);
    console.log(`   └─ Avg SEO Score:            ${Math.round(stats.articles.avgSeoScore[0]?.avg || 0)}`);
    console.log('');
    console.log('FEATURES IMPLEMENTED:');
    console.log('├─ Campaign Management:         ✅ CRUD, Filtering, Pagination');
    console.log('├─ Campaign Types:              ✅ EMAIL, CONTENT, SOCIAL, MULTI_CHANNEL');
    console.log('├─ Engagement Tracking:        ✅ Emails sent, opens, clicks');
    console.log('├─ Article Workflow:           ✅ DRAFT → REVIEW → PUBLISHED → ARCHIVED');
    console.log('├─ Auto-generated Slugs:       ✅ SEO-friendly URLs');
    console.log('├─ SEO Scoring:                ✅ Keywords & optimization');
    console.log('├─ Engagement Metrics:         ✅ Views, likes, shares');
    console.log('├─ Read Time Calculation:      ✅ Automatic based on word count');
    console.log('└─ Database Indexing:          ✅ Performance optimized');
    console.log('═══════════════════════════════════════════════════════════════\n');

    console.log('🎯 Ready for Testing:');
    console.log('├─ Campaign filtering by status and type');
    console.log('├─ Article workflow management');
    console.log('├─ Engagement metrics analysis');
    console.log('├─ SEO scoring and optimization');
    console.log('└─ Performance with proper indexing\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    console.log('🚀 Campaigns & Articles ready for production use!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
};

generateCampaignsAndArticles();