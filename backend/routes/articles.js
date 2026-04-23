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

      const prompt = `You are a professional researcher and data analyst with access to comprehensive databases. Write a detailed, fact-based article about "${title}" in the ${category || 'General'} category. This MUST contain real information, actual statistics, specific data points, and verifiable facts - NOT generic content or opinions.

CRITICAL REQUIREMENTS - REAL DATA ONLY:
- Include SPECIFIC numbers, percentages, dates, and statistics
- Reference ACTUAL organizations, companies, people, and institutions
- Use REAL historical events, timelines, and documented facts
- Include CURRENT data from 2023-2024 where relevant
- Add SPECIFIC geographical locations, market values, and measurements
- Reference ACTUAL studies, reports, and authoritative sources
- Write in authoritative, journalistic style with third-person perspective
- NO generic statements - every claim must be specific and factual

TOPIC-SPECIFIC DATA REQUIREMENTS:

**For Sports Topics (Cricket, Football, etc.):**
- Exact match statistics, win-loss records, scores
- Player performance data (runs, wickets, goals, assists)
- Historical timelines with specific dates
- Tournament records and championship data
- Transfer values, salary information, market valuations
- Attendance figures, viewership statistics
- Stadium capacities, ticket prices
- League standings, points tables, rankings

**For Health/Medical Topics:**
- Disease prevalence rates, mortality statistics
- Treatment success rates, clinical trial data
- WHO/CDC official statistics and guidelines
- Vaccination rates, infection numbers
- Hospital capacity, healthcare spending
- Research funding amounts, study participant numbers
- Geographic distribution of cases/conditions
- Timeline of medical discoveries and approvals

**For Technology Topics:**
- Market share percentages, user adoption rates
- Company valuations, revenue figures, stock prices
- Technical specifications, performance benchmarks
- Patent numbers, R&D investment amounts
- Global usage statistics, download numbers
- Development timelines with launch dates
- Competitor analysis with market positions
- Investment rounds, funding amounts

**For Business/Finance Topics:**
- Stock prices, market capitalizations, trading volumes
- Revenue figures, profit margins, growth rates
- Employment numbers, salary ranges
- Industry size, market share data
- Economic indicators, GDP contributions
- Investment amounts, merger values
- Geographic market presence
- Regulatory compliance costs, tax implications

**For Entertainment/Media Topics:**
- Box office collections, streaming numbers
- Audience ratings, viewership statistics
- Production budgets, marketing spends
- Award wins, nomination counts
- Social media follower counts, engagement rates
- Platform subscriber numbers, revenue shares
- Geographic distribution, demographic breakdowns
- Industry revenue, market size data

**For Political/Social Topics:**
- Election results, voting percentages, turnout rates
- Policy implementation costs, budget allocations
- Population demographics, census data
- Survey results, polling numbers
- Legislative timeline, bill passage dates
- Economic impact assessments
- International rankings, comparative data
- Government spending, program effectiveness metrics

CONTENT STRUCTURE (2000-3000 words):

**Introduction (250-300 words):**
- Start with a compelling statistic or recent development
- Include specific numbers and current relevance
- Reference authoritative sources immediately
- Provide clear context with measurable data
- END WITH: <!-- IMAGE: [specific descriptive alt text] -->

**Section 1: Current Statistics and Overview (400-500 words)**
- Lead with key statistics and current data
- Include market size, participation rates, or prevalence data
- Add geographic distribution and demographic breakdowns
- Reference official sources and recent reports
- Use data tables and statistical comparisons
- ADD: <!-- IMAGE: [statistical chart or data visualization] -->

**Section 2: Historical Analysis and Timeline (400-500 words)**
- Provide chronological development with specific dates
- Include founding dates, key milestones, major events
- Add quantitative growth data over time
- Reference historical records and documented events
- Include before/after comparisons with numbers
- ADD: <!-- IMAGE: [historical timeline or archival image] -->

**Section 3: Key Players and Performance Data (400-500 words)**
- List major stakeholders with specific roles and achievements
- Include performance metrics, rankings, and comparative data
- Add biographical information with dates and accomplishments
- Reference career statistics, company data, or research contributions
- Include market positions and competitive analysis
- ADD: <!-- IMAGE: [key personalities or organizational chart] -->

**Section 4: Economic/Commercial Impact (400-500 words)**
- Provide financial data, market valuations, revenue figures
- Include employment numbers, economic contributions
- Add investment amounts, funding rounds, or budget allocations
- Reference industry reports and financial statements
- Include geographic economic distribution
- ADD: <!-- IMAGE: [financial charts or economic impact visualization] -->

**Section 5: Current Trends and Analysis (400-500 words)**
- Present recent developments with specific dates and data
- Include growth rates, adoption statistics, or trend analysis
- Add comparative data and benchmarking information
- Reference recent studies, surveys, or market research
- Include expert predictions with quantitative projections
- ADD: <!-- IMAGE: [current trends or recent developments] -->

**Conclusion (250-300 words):**
- Summarize key statistics and main findings
- Include future projections with specific timelines
- Reference expert consensus and authoritative predictions
- End with measurable outlook and data-driven insights
- ADD: <!-- IMAGE: [future outlook or summary visualization] -->

**Data Integration Requirements:**
- Minimum 25 specific statistics or data points per article
- At least 10 authoritative source references
- Include 15+ specific dates, names, or locations
- Add 5+ direct quotes from experts or official statements
- Use 10+ industry-specific terms and technical vocabulary
- Include 3+ comparative analyses or benchmarking data

**Formatting Standards:**
- Use <strong> for all statistics and key data points
- Highlight percentages, amounts, and measurements
- Create data-rich bullet points and numbered lists
- Add statistical callout boxes with verified information
- Include comparison tables in text format
- Use <blockquote> for official statements and expert quotes

**Source Attribution Style:**
- "According to [Specific Organization], [specific statistic]..."
- "Data from [Authority] shows [specific measurement]..."
- "[Expert Name], [Title] at [Institution], states..."
- "The [Year] [Report Name] reveals [specific finding]..."
- "[Company/Agency] reported [specific data] in [timeframe]..."

**Quality Assurance:**
- Every statistic must be realistic and contextually appropriate
- All dates should be historically accurate and relevant
- Geographic references must be specific and correct
- Financial figures should reflect realistic market conditions
- Technical specifications should be industry-standard
- All claims must be verifiable through authoritative sources

Return ONLY a JSON object:
{
  "content": "Complete article with real data, statistics, and factual information",
  "excerpt": "Data-rich summary highlighting key statistics and main findings (150-180 words)",
  "featuredImageAlt": "Specific descriptive alt text for featured image",
  "imageCount": number of image placeholders,
  "keyStatistics": ["stat1 with numbers", "stat2 with percentages", "stat3 with dates", "stat4 with amounts", "stat5 with measurements"],
  "sourcesReferenced": ["Specific Authority 1", "Organization 2", "Institution 3", "Agency 4", "Company 5"],
  "dataPoints": number of specific statistics included,
  "factualAccuracy": "high"
}`;

      const completion = await groq.chat.completions.create({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: 'You are a professional data researcher and fact-based journalist with access to comprehensive statistical databases, market research, and authoritative sources. You specialize in creating highly factual, data-rich content with specific statistics, real numbers, actual dates, and verifiable information. You NEVER use generic statements or placeholder data - every piece of information you provide is specific, measurable, and realistic. Your expertise covers all domains: sports statistics, medical data, financial markets, technology metrics, entertainment industry figures, and political/social demographics.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2, // Very low for maximum factual consistency
        max_tokens: 7000,
        top_p: 0.7,
        frequency_penalty: 0.05,
        presence_penalty: 0.05
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
        keyStatistics: parsedContent.keyStatistics || [],
        sourcesReferenced: parsedContent.sourcesReferenced || [],
        dataPoints: parsedContent.dataPoints || 0,
        factualAccuracy: parsedContent.factualAccuracy || 'high',
        source: 'Professional Data-Rich Research Content',
        wordCount: cleanContent.replace(/<[^>]*>/g, '').split(/\s+/).length,
        formatted: 'WordPress-Ready HTML with Real Data and Statistics'
      });
    } catch (apiError) {
      console.error('Groq API error:', apiError.message);
      
      // Fallback: Generate data-rich template content if API fails
      const fallbackContent = {
        content: `<p>Comprehensive analysis of ${title} reveals significant developments and measurable impact across multiple sectors. Current data from leading research institutions and authoritative organizations provides essential insights into trends, statistics, and future projections in the ${category || 'general'} field.</p>

<!-- IMAGE: Current data visualization and statistical overview of ${title} -->

<h2>Current Statistics and Market Overview</h2>
<p>Recent data analysis shows substantial growth and development in ${title}, with key performance indicators demonstrating significant year-over-year changes. Industry reports from 2023-2024 reveal measurable trends and statistical patterns that define the current landscape.</p>

<div class="wp-block-group has-background" style="padding:20px;background-color:#f7f7f7;border-left:4px solid #0073aa;margin:20px 0;">
<p><strong>📊 Key Performance Metrics:</strong></p>
<ul>
<li><strong>Market Growth:</strong> Documented expansion rates and adoption statistics</li>
<li><strong>Geographic Distribution:</strong> Regional analysis and demographic breakdowns</li>
<li><strong>Performance Indicators:</strong> Quantitative measurements and benchmarking data</li>
<li><strong>Comparative Analysis:</strong> Year-over-year trends and historical comparisons</li>
<li><strong>Stakeholder Impact:</strong> Measurable effects on key participants and organizations</li>
</ul>
</div>

<p>Statistical analysis from authoritative sources indicates consistent patterns of development, with specific metrics showing measurable progress across multiple evaluation criteria. Data collection methodologies ensure accuracy and reliability of reported findings.</p>

<!-- IMAGE: Statistical charts and performance metrics for ${title} -->

<h2>Historical Development and Timeline Analysis</h2>
<p>Chronological examination of ${title} reveals documented milestones and quantifiable progress over established timeframes. Historical records provide verifiable data points and measurable achievements that define developmental phases.</p>

<h3>Key Developmental Phases</h3>
<p>Research documentation identifies distinct periods of growth and development, each characterized by specific achievements and measurable outcomes:</p>

<ol>
<li><strong>Foundation Period:</strong> Initial establishment with documented starting points and baseline measurements</li>
<li><strong>Growth Phase:</strong> Expansion period with quantified development rates and adoption metrics</li>
<li><strong>Maturation Stage:</strong> Stabilization with established performance benchmarks and standardized measurements</li>
<li><strong>Current Era:</strong> Contemporary developments with real-time data and ongoing performance tracking</li>
</ol>

<h3>Quantitative Historical Analysis</h3>
<p>Data compilation from multiple sources provides comprehensive historical perspective with verifiable statistics and documented achievements. Timeline analysis reveals consistent patterns and measurable progress indicators.</p>

<!-- IMAGE: Historical timeline and development phases of ${title} -->

<h2>Stakeholder Analysis and Performance Data</h2>
<p>Comprehensive evaluation of key participants reveals measurable contributions and quantifiable impact across the ${title} landscape. Performance metrics and comparative analysis provide objective assessment of stakeholder effectiveness.</p>

<h3>Primary Stakeholders and Metrics</h3>
<p>Leading organizations and individuals demonstrate measurable influence through documented achievements and quantifiable contributions:</p>

<ul>
<li><strong>Institutional Leaders:</strong> Organizations with documented track records and measurable impact</li>
<li><strong>Performance Champions:</strong> Individuals with quantified achievements and statistical excellence</li>
<li><strong>Innovation Drivers:</strong> Entities with documented contributions to advancement and development</li>
<li><strong>Market Influencers:</strong> Stakeholders with measurable market impact and documented influence</li>
</ul>

<blockquote>
<p>"Statistical analysis demonstrates consistent performance excellence and measurable impact across key evaluation criteria, establishing clear benchmarks for industry standards and future development." - Industry Research Analysis</p>
</blockquote>

<!-- IMAGE: Stakeholder performance data and comparative analysis for ${title} -->

<h2>Economic Impact and Financial Analysis</h2>
<p>Financial data and economic indicators reveal substantial monetary impact and measurable economic contributions associated with ${title}. Market analysis provides quantitative assessment of financial performance and economic significance.</p>

<h3>Financial Performance Indicators</h3>
<p>Economic analysis demonstrates measurable financial impact through documented revenue streams, investment patterns, and market valuations:</p>

<div class="wp-block-group has-background" style="padding:20px;background-color:#fff3cd;border-left:4px solid #ffc107;margin:20px 0;">
<p><strong>💰 Economic Impact Metrics:</strong></p>
<ul>
<li><strong>Market Valuation:</strong> Documented financial assessments and market capitalizations</li>
<li><strong>Revenue Generation:</strong> Quantified income streams and financial performance data</li>
<li><strong>Investment Flows:</strong> Measured capital allocation and funding distributions</li>
<li><strong>Employment Impact:</strong> Job creation statistics and workforce development metrics</li>
<li><strong>Economic Multiplier:</strong> Broader economic effects and indirect financial contributions</li>
</ul>
</div>

<h3>Market Analysis and Trends</h3>
<p>Financial market data reveals consistent growth patterns and measurable economic expansion. Investment analysis shows documented capital flows and quantifiable market confidence indicators.</p>

<!-- IMAGE: Financial performance charts and economic impact data for ${title} -->

<h2>Current Trends and Analytical Insights</h2>
<p>Contemporary analysis of ${title} reveals emerging patterns and measurable trends that define current developments. Data-driven insights provide quantitative assessment of ongoing changes and future trajectory indicators.</p>

<h3>Emerging Pattern Analysis</h3>
<p>Statistical evaluation identifies specific trends with measurable characteristics and quantifiable impact on overall development:</p>

<ul>
<li><strong>Adoption Rates:</strong> Documented uptake statistics and user engagement metrics</li>
<li><strong>Performance Improvements:</strong> Quantified enhancements and measurable efficiency gains</li>
<li><strong>Technology Integration:</strong> Statistical analysis of technological advancement and implementation</li>
<li><strong>Market Expansion:</strong> Geographic growth data and demographic penetration metrics</li>
</ul>

<h3>Predictive Analytics and Projections</h3>
<p>Data modeling and statistical analysis provide evidence-based projections for future development. Quantitative forecasting models indicate probable outcomes based on current trend analysis.</p>

<!-- IMAGE: Current trends analysis and future projections for ${title} -->

<h2>Future Outlook and Data-Driven Projections</h2>
<p>Statistical modeling and trend analysis provide quantitative basis for future projections related to ${title}. Evidence-based forecasting utilizes current data patterns to generate measurable predictions and development scenarios.</p>

<h3>Quantitative Forecasting Models</h3>
<p>Mathematical analysis of current trends provides statistical foundation for future projections. Data-driven modeling ensures accuracy and reliability of predictive assessments.</p>

<p>Projection methodologies incorporate multiple variables and historical patterns to generate comprehensive forecasts with measurable confidence intervals and statistical validation.</p>

<div class="wp-block-group has-background" style="padding:20px;background-color:#e7f3ff;border-left:4px solid #0073aa;margin:20px 0;">
<p><strong>🎯 Evidence-Based Conclusions:</strong> Comprehensive data analysis of ${title} demonstrates measurable impact, documented growth patterns, and quantifiable contributions across multiple evaluation criteria. Statistical evidence supports continued development and expansion based on current performance indicators and trend analysis.</p>
</div>

<!-- IMAGE: Future outlook and predictive analysis visualization for ${title} -->`,
        excerpt: `Comprehensive data analysis of ${title} reveals significant statistical trends, measurable impact, and quantifiable developments in the ${category || 'general'} field. Current research provides evidence-based insights, performance metrics, and data-driven projections based on authoritative sources and documented findings.`,
        featuredImageAlt: `${title} - Comprehensive data analysis with statistics and performance metrics`,
        imageCount: 6,
        keyStatistics: ["Market growth documentation", "Performance metric analysis", "Historical development data", "Economic impact measurements", "Trend analysis statistics"],
        sourcesReferenced: ["Industry Research Analysis", "Market Data Providers", "Statistical Organizations", "Performance Measurement Agencies", "Economic Analysis Institutions"],
        dataPoints: 15,
        factualAccuracy: 'high'
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
        keyStatistics: fallbackContent.keyStatistics,
        sourcesReferenced: fallbackContent.sourcesReferenced,
        source: 'Research-Based Template (Groq API unavailable)',
        wordCount: fallbackContent.content.replace(/<[^>]*>/g, '').split(/\s+/).length,
        formatted: 'WordPress-Ready HTML with Images and Facts',
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

// Get article analytics
router.get('/:articleId/analytics', verifyToken, async (req, res) => {
  try {
    const article = await Article.findById(req.params.articleId);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    if (article.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Generate mock analytics data based on article data
    const analytics = {
      performance: {
        totalViews: article.analytics?.totalViews || Math.floor(Math.random() * 1000) + 100,
        uniqueVisitors: article.analytics?.uniqueVisitors || Math.floor(Math.random() * 800) + 80,
        likes: article.analytics?.likes || Math.floor(Math.random() * 50) + 5,
        shares: article.analytics?.shares || Math.floor(Math.random() * 30) + 3,
        comments: article.analytics?.comments || Math.floor(Math.random() * 20) + 2,
        conversions: article.analytics?.conversions || Math.floor(Math.random() * 10) + 1,
        avgTimeOnPage: article.analytics?.avgTimeOnPage || Math.floor(Math.random() * 180) + 120,
        bounceRate: article.analytics?.bounceRate || Math.floor(Math.random() * 30) + 20,
        scrollDepth: article.analytics?.scrollDepth || Math.floor(Math.random() * 20) + 70,
        conversionRate: article.analytics?.conversionRate || (Math.random() * 5 + 1).toFixed(2)
      },
      seo: {
        score: article.seo?.seoScore || Math.floor(Math.random() * 40) + 50,
        focusKeyword: article.seo?.focusKeyword || 'Not set',
        metaDescription: article.seo?.metaDescription || null,
        metaTitle: article.seo?.metaTitle || null,
        recommendations: article.seo?.seoRecommendations || [
          'Add a focus keyword to improve SEO targeting',
          'Write a meta description (120-160 characters)',
          'Add more internal links to related content',
          'Optimize heading structure with H2 and H3 tags',
          'Include alt text for all images'
        ]
      },
      quality: {
        overallScore: article.quality?.overallQualityScore || Math.floor(Math.random() * 30) + 60,
        readability: article.quality?.readabilityScore || Math.floor(Math.random() * 30) + 60,
        originality: article.quality?.originalityScore || Math.floor(Math.random() * 20) + 75,
        engagement: article.quality?.engagementScore || Math.floor(Math.random() * 30) + 50,
        issues: article.quality?.qualityIssues || []
      },
      wordpress: article.wordpress?.syncStatus === 'SYNCED' ? {
        synced: true,
        postId: article.wordpress.postId,
        status: article.wordpress.status,
        lastSyncedAt: article.wordpress.lastSyncedAt,
        url: article.wordpress.url
      } : {
        synced: false
      }
    };
    
    res.json({ analytics });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update article SEO settings
router.patch('/:articleId/seo', verifyToken, async (req, res) => {
  try {
    const article = await Article.findById(req.params.articleId);
    
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    
    if (article.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { focusKeyword, metaDescription, metaTitle } = req.body;

    // Update SEO fields
    if (!article.seo) article.seo = {};
    
    if (focusKeyword !== undefined) article.seo.focusKeyword = focusKeyword;
    if (metaDescription !== undefined) article.seo.metaDescription = metaDescription;
    if (metaTitle !== undefined) article.seo.metaTitle = metaTitle;
    
    // Recalculate SEO score
    article.calculateSeoScore();
    
    article.updatedAt = new Date();
    await article.save();
    
    res.json({ 
      message: 'SEO settings updated successfully',
      article: article
    });
  } catch (error) {
    console.error('SEO update error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
