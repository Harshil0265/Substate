import express from 'express';
import Article from '../models/Article.js';
import verifyToken from '../middleware/auth.js';
import ArticleManagementService from '../services/ArticleManagementService.js';
import ContentModerationService from '../services/ContentModerationService.js';
import WordPressSyncService from '../services/WordPressSyncService.js';
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

// Generate content with AI using Groq
router.post('/generate-content', verifyToken, async (req, res) => {
  try {
    const { title, category, keywords } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const groq = getGroqClient();

    const prompt = `You are a seasoned industry expert and professional writer with 15+ years of hands-on experience in ${category || 'this field'}. You've worked with Fortune 500 companies, consulted for startups, and have deep practical knowledge. Write an authoritative, comprehensive article about "${title}" that showcases your expertise.

CRITICAL: Write like a REAL HUMAN EXPERT, not AI. This must pass as content written by an experienced professional.

WRITING STYLE - SOUND COMPLETELY HUMAN:
- Write from personal experience: "In my 15 years working with...", "I've personally helped over 200 companies...", "What I've learned from..."
- Share specific stories and examples: "Last year, I worked with a client who...", "One of my most successful projects involved..."
- Use natural, conversational language with personality
- Include occasional humor or wit where appropriate
- Use contractions naturally (don't, can't, you'll, I've, we're)
- Vary sentence length dramatically - mix short punchy sentences with longer explanatory ones
- Start sentences with "And", "But", "So" when it flows naturally
- Use rhetorical questions: "Why does this matter?", "What's the real secret?"
- Include personal opinions: "I believe...", "In my view...", "Here's what most people get wrong..."
- Reference real-world scenarios without being generic
- Use specific numbers and data points: "I've seen 73% improvement...", "In a recent study of 500 companies..."
- Add transitional phrases: "Here's the thing...", "Let me break this down...", "Now, here's where it gets interesting..."

CONTENT DEPTH - EXPERT LEVEL:
- Target: 2500-3500 words (comprehensive, authoritative)
- Each section should be 400-600 words with substantial depth
- Include insider knowledge and industry secrets
- Share lessons learned from real experience
- Provide actionable, specific advice (not generic tips)
- Include frameworks, methodologies, and step-by-step processes
- Discuss common misconceptions and myths
- Share what works and what doesn't (with reasons)
- Include cost considerations, time estimates, ROI data
- Discuss tools, resources, and recommendations with specific names

ARTICLE STRUCTURE (PROFESSIONAL FORMAT):

**Opening Hook (1 paragraph, ~100 words):**
Start with a compelling story, surprising statistic, or bold statement that grabs attention immediately. Make it personal and relatable.

**Introduction (2-3 paragraphs, ~250 words):**
- Establish credibility with your experience
- Explain why this topic matters NOW
- Preview the value readers will get
- Set clear expectations
- NO image placeholder here - text only

**Section 1: The Foundation (400-500 words)**
<h2>Understanding [Core Concept] - What Most People Get Wrong</h2>
- Start with common misconceptions
- Explain the fundamentals from an expert perspective
- Share personal insights and observations
- Include specific examples from your experience
- Use bullet points for key concepts (3-5 points)
- End section with: <!-- IMAGE: [relevant descriptive alt text] -->

**Section 2: The Real-World Application (400-500 words)**
<h2>How This Actually Works in Practice</h2>
- Share case studies or real examples
- Discuss what you've seen work (and fail)
- Include specific metrics and results
- Provide actionable frameworks
- Use numbered lists for processes (5-7 steps)
- End section with: <!-- IMAGE: [relevant descriptive alt text] -->

**Section 3: Advanced Strategies (400-500 words)**
<h2>Expert Techniques That Deliver Results</h2>
- Share insider knowledge and advanced tactics
- Discuss what separates good from great
- Include specific tools and resources (name them)
- Provide optimization tips
- Share your personal methodology
- End section with: <!-- IMAGE: [relevant descriptive alt text] -->

**Section 4: Common Pitfalls (300-400 words)**
<h2>Mistakes I've Seen (And How to Avoid Them)</h2>
- List 5-7 critical mistakes with explanations
- Share stories of what went wrong
- Provide solutions for each mistake
- Include cost/time implications
- Use warning callouts for critical points

**Section 5: Implementation Guide (500-600 words)**
<h2>Your Step-by-Step Action Plan</h2>
- Detailed, numbered steps (8-12 steps)
- Include time estimates for each step
- Mention required resources and tools
- Provide tips for each step
- Discuss what to expect at each stage
- End section with: <!-- IMAGE: [relevant descriptive alt text] -->

**Section 6: Tools and Resources (300-400 words)**
<h2>What You Actually Need to Succeed</h2>
- Recommend specific tools (with names)
- Include both free and paid options
- Explain why each tool is valuable
- Provide alternatives
- Share your personal toolkit
- Include approximate costs

**Section 7: Measuring Success (300-400 words)**
<h2>How to Track Results and Optimize</h2>
- Define specific KPIs and metrics
- Explain how to measure each metric
- Provide benchmarks and targets
- Discuss optimization strategies
- Share reporting frameworks
- End section with: <!-- IMAGE: [relevant descriptive alt text] -->

**Section 8: Future Trends (250-300 words)**
<h2>What's Coming Next (And How to Prepare)</h2>
- Discuss emerging trends based on your observations
- Share predictions from your experience
- Explain how to stay ahead
- Provide preparation strategies

**Conclusion (2-3 paragraphs, ~200 words):**
- Summarize key takeaways (3-5 bullet points)
- Provide clear next steps
- Include a motivational closing
- End with a call-to-action
- NO image placeholder here - text only

**Pro Tips Section (Optional):**
<h2>Expert Tips from the Trenches</h2>
- 5-7 quick, actionable tips
- Each tip should be specific and valuable
- Include context for when to use each tip

HTML FORMATTING (CLEAN & PROFESSIONAL):
- Use <h2> for main sections (8-10 sections)
- Use <h3> for subsections within sections
- Use <p> for paragraphs (keep under 4 sentences)
- Use <strong> for emphasis on key terms only
- Use <em> sparingly for subtle emphasis
- Use <ul> and <li> for bullet lists
- Use <ol> and <li> for numbered steps
- Use <blockquote> for important insights or quotes
- NO markdown symbols (#, *, **, etc.)
- NO extra formatting marks
- Clean, readable HTML only

IMAGE PLACEMENT (5-6 IMAGES TOTAL):
- Place <!-- IMAGE: [descriptive alt text] --> at the END of major sections
- Alt text should be descriptive and keyword-rich
- Space images evenly throughout content
- NO images in introduction or conclusion
- Images should enhance understanding, not just decorate

SEO OPTIMIZATION (NATURAL):
- Use main keyword "${keywords || title}" 10-15 times naturally
- Include semantic variations throughout
- Use keyword in 2-3 H2 headings naturally
- Include long-tail keywords in H3 subheadings
- Add LSI keywords contextually
- Write compelling meta description (150-160 chars)
- Optimize image alt text with keywords

TONE & VOICE:
- Confident but not arrogant
- Helpful and educational
- Conversational yet professional
- Authoritative based on experience
- Encouraging and motivational
- Honest about challenges and limitations

CREDIBILITY MARKERS:
- Reference "in my experience", "I've found", "what works best"
- Mention specific timeframes: "over the past 5 years", "recently"
- Include approximate numbers: "I've worked with 200+ clients"
- Reference industry standards and best practices
- Discuss trade-offs and considerations
- Acknowledge when something is difficult or complex

AVOID THESE AI MARKERS:
- NO generic phrases like "in today's digital landscape"
- NO overuse of "delve", "leverage", "utilize", "robust"
- NO repetitive sentence structures
- NO overly formal or academic language
- NO vague statements without specifics
- NO excessive use of "furthermore", "moreover", "additionally"
- NO bullet points that all start the same way
- NO generic conclusions like "in conclusion, we've explored"

Return ONLY valid JSON (no markdown, no code blocks, no extra text):
{
  "content": "Complete HTML article with clean formatting, 2500+ words, proper structure, and image placeholders",
  "excerpt": "Compelling 150-160 character meta description with main keyword that makes people want to click and read",
  "featuredImageAlt": "Detailed, keyword-rich alt text for featured image",
  "imageCount": 5
}`;

    const completion = await groq.chat.completions.create({
      model: 'mixtral-8x7b-32768',
      messages: [
        {
          role: 'system',
          content: 'You are a highly experienced industry expert and professional writer with 15+ years of hands-on experience. You write comprehensive, authoritative articles that showcase deep expertise and practical knowledge. Your writing is completely indistinguishable from human-written content - it has personality, shares real experiences, includes specific examples, and provides genuine value. You NEVER sound like AI. You write like a seasoned professional sharing hard-won knowledge with colleagues. Your content is the kind that gets bookmarked, shared, and referenced. You always return clean, properly formatted HTML with NO markdown symbols or extra marks. You always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.85,
      max_tokens: 8000,
      top_p: 0.9,
      frequency_penalty: 0.5,
      presence_penalty: 0.5
    });

    const responseText = completion.choices[0].message.content;
    
    let parsedContent = { content: '', excerpt: '', featuredImageAlt: '', imageCount: 5 };
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        // If no JSON, treat entire response as content
        parsedContent = {
          content: responseText,
          excerpt: `Expert guide to ${title}. Learn proven strategies, insider tips, and actionable advice from 15+ years of hands-on experience.`,
          featuredImageAlt: `${title} - Expert guide with proven strategies and real-world insights`,
          imageCount: 5
        };
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      parsedContent = {
        content: responseText,
        excerpt: `Expert guide to ${title}. Learn proven strategies, insider tips, and actionable advice from 15+ years of hands-on experience.`,
        featuredImageAlt: `${title} - Expert guide with proven strategies and real-world insights`,
        imageCount: 5
      };
    }

    // Ensure we have substantial content
    if (!parsedContent.content || parsedContent.content.length < 2000) {
      throw new Error('Generated content is too short - regenerating with fallback');
    }

    // Clean and format content - REMOVE ALL AI MARKERS
    let cleanContent = parsedContent.content;
    
    // Remove any markdown formatting that might have slipped through
    cleanContent = cleanContent.replace(/^####\s+(.*$)/gim, '<h4>$1</h4>');
    cleanContent = cleanContent.replace(/^###\s+(.*$)/gim, '<h3>$1</h3>');
    cleanContent = cleanContent.replace(/^##\s+(.*$)/gim, '<h2>$1</h2>');
    cleanContent = cleanContent.replace(/^#\s+(.*$)/gim, '<h2>$1</h2>');
    
    // Remove markdown bold/italic
    cleanContent = cleanContent.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
    cleanContent = cleanContent.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    cleanContent = cleanContent.replace(/__(.+?)__/g, '<strong>$1</strong>');
    cleanContent = cleanContent.replace(/\*(.+?)\*/g, '<em>$1</em>');
    cleanContent = cleanContent.replace(/_(.+?)_/g, '<em>$1</em>');
    
    // Remove any remaining markdown list markers
    cleanContent = cleanContent.replace(/^\*\s+/gm, '');
    cleanContent = cleanContent.replace(/^-\s+/gm, '');
    
    // Clean up any double spaces or extra whitespace
    cleanContent = cleanContent.replace(/\s{2,}/g, ' ');
    cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n');
    
    // Wrap plain text paragraphs in <p> tags if not already wrapped
    const lines = cleanContent.split('\n\n');
    cleanContent = lines.map(line => {
      line = line.trim();
      if (line && !line.startsWith('<') && !line.match(/^<\w+>/) && !line.startsWith('<!--')) {
        return `<p>${line}</p>`;
      }
      return line;
    }).join('\n\n');

    // Process images - replace placeholders with actual Pixabay images
    const imageResult = await ImageService.generateArticleWithImages(
      cleanContent,
      title,
      category || 'General'
    );

    // Calculate actual word count
    const wordCount = cleanContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;

    res.json({
      content: imageResult.content,
      excerpt: parsedContent.excerpt,
      featuredImageUrl: imageResult.featuredImageUrl,
      featuredImageAlt: parsedContent.featuredImageAlt || imageResult.featuredImageAlt,
      imagesAdded: imageResult.imagesAdded,
      imageCount: parsedContent.imageCount || imageResult.imagesAdded,
      source: 'Expert-Level Professional Content',
      wordCount: wordCount,
      formatted: 'WordPress-Ready HTML - Human Quality'
    });
  } catch (apiError) {
    console.error('AI Generation error:', apiError.message);
    
    // Enhanced fallback template with professional, human-like content
    const fallbackContent = {
      content: `<h2>Why ${req.body.title} Matters More Than Ever</h2>
<p>I've spent the better part of 15 years working in this field, and I can tell you with certainty: ${req.body.title} isn't just another buzzword. It's a fundamental shift in how we approach our work, and understanding it properly can make the difference between mediocre results and exceptional success.</p>

<p>What I'm about to share comes from real experience—the kind you get from working with hundreds of clients, making plenty of mistakes, and learning what actually works in the real world. This isn't theory. It's practical knowledge you can use starting today.</p>

<p>Let me walk you through everything I've learned, including the mistakes I've made so you don't have to repeat them.</p>

<!-- IMAGE: ${req.body.title} professional workspace overview -->

<h2>The Foundation: What Most People Get Wrong</h2>
<p>Here's the thing most people don't realize about ${req.body.title}: it's not about having the perfect strategy from day one. I've seen countless businesses fail because they spent months planning instead of taking action and learning from real feedback.</p>

<p>In my experience working with over 200 companies, the ones that succeed share three common traits:</p>

<ul>
<li><strong>They start before they're ready</strong> - Waiting for perfect conditions means never starting. The best time to begin was yesterday; the second best time is now.</li>
<li><strong>They measure everything</strong> - You can't improve what you don't measure. Successful practitioners track their metrics religiously and adjust based on data, not gut feelings.</li>
<li><strong>They're willing to pivot</strong> - What works for one business might not work for yours. The key is staying flexible and adapting your approach based on results.</li>
</ul>

<p>I learned this the hard way. Early in my career, I spent six months developing what I thought was the perfect approach, only to discover it didn't work in practice. That expensive lesson taught me the value of rapid iteration and real-world testing.</p>

<h3>The Core Principles That Actually Matter</h3>
<p>After years of trial and error, I've distilled ${req.body.title} down to five core principles that consistently deliver results:</p>

<ol>
<li><strong>Clarity over complexity</strong> - Simple approaches executed well beat complex strategies executed poorly every single time.</li>
<li><strong>Consistency beats intensity</strong> - Doing something small every day produces better results than occasional bursts of intense effort.</li>
<li><strong>Focus on fundamentals</strong> - Master the basics before chasing advanced techniques. I've seen too many people fail because they skipped the foundation.</li>
<li><strong>Test everything</strong> - What works for others might not work for you. Always validate assumptions with real data.</li>
<li><strong>Optimize continuously</strong> - Success isn't a destination; it's a process of constant improvement.</li>
</ol>

<!-- IMAGE: ${req.body.title} core principles diagram -->

<h2>How This Actually Works in Practice</h2>
<p>Let me share a real example from last year. I worked with a mid-sized company that was struggling with ${req.body.title}. They had all the right tools and a decent budget, but their results were mediocre at best.</p>

<p>The problem? They were following generic advice instead of adapting strategies to their specific situation. Once we customized their approach based on their unique challenges and audience, their results improved by 73% within three months.</p>

<p>Here's what we did differently:</p>

<p>First, we stopped trying to do everything and focused on the 20% of activities that would drive 80% of results. This meant saying no to a lot of "best practices" that didn't fit their context.</p>

<p>Second, we implemented a rapid testing framework. Instead of planning for months, we'd test an idea for two weeks, measure results, and either scale it up or move on. This approach let us try 12 different strategies in the time it would have taken to perfect one.</p>

<p>Third, we built feedback loops into everything. Every action had a corresponding metric, and we reviewed those metrics weekly. This kept us honest and focused on what actually moved the needle.</p>

<h3>The Framework I Use With Every Client</h3>
<p>Over the years, I've developed a framework that works across different industries and situations. Here's the exact process I follow:</p>

<ol>
<li><strong>Audit current state</strong> (Week 1) - Understand where you are now, what's working, and what's not. Be brutally honest.</li>
<li><strong>Define success metrics</strong> (Week 1) - Decide exactly what success looks like with specific, measurable targets.</li>
<li><strong>Identify quick wins</strong> (Week 2) - Find 3-5 things you can improve immediately for fast results and momentum.</li>
<li><strong>Build testing pipeline</strong> (Week 2-3) - Set up systems to test new approaches quickly and measure results accurately.</li>
<li><strong>Execute and measure</strong> (Week 4+) - Implement changes, track results, and iterate based on data.</li>
<li><strong>Scale what works</strong> (Ongoing) - Double down on successful strategies and eliminate what doesn't work.</li>
<li><strong>Optimize continuously</strong> (Ongoing) - Keep improving even when things are working well.</li>
</ol>

<!-- IMAGE: ${req.body.title} implementation framework visualization -->

<h2>Advanced Strategies That Separate Good from Great</h2>
<p>Once you've mastered the fundamentals, these advanced techniques can take your results to the next level. I don't recommend trying these until you've got the basics down solid—I've seen too many people fail by jumping to advanced tactics too early.</p>

<p>The first advanced strategy is what I call "strategic constraint." Instead of trying to do more, you deliberately limit your options to force creative solutions. One client increased their efficiency by 40% simply by cutting their available time in half. The constraint forced them to eliminate busy work and focus on high-impact activities.</p>

<p>Second is "compound optimization." Most people optimize individual elements in isolation. The real magic happens when you optimize how elements work together. A 10% improvement in five connected areas compounds to a 61% overall improvement.</p>

<p>Third is "asymmetric testing." Instead of testing everything equally, you focus 80% of your testing budget on the 20% of variables that have the biggest potential impact. This approach has helped my clients achieve breakthrough results without massive resource investments.</p>

<h3>Tools and Resources That Actually Matter</h3>
<p>I get asked about tools constantly. Here's what I actually use and recommend:</p>

<ul>
<li><strong>For planning and strategy</strong> - I use a combination of spreadsheets and project management software. Nothing fancy, but it keeps everything organized.</li>
<li><strong>For measurement</strong> - Analytics platforms are essential. I prefer tools that integrate with everything else in your stack.</li>
<li><strong>For execution</strong> - Automation tools save countless hours. Start with the free tiers and upgrade only when you hit their limits.</li>
<li><strong>For optimization</strong> - A/B testing platforms are worth their weight in gold. Even basic testing can dramatically improve results.</li>
</ul>

<!-- IMAGE: ${req.body.title} professional tools and resources -->

<h2>Mistakes I've Seen (And How to Avoid Them)</h2>
<p>Let me save you some pain by sharing the most common mistakes I've seen in my 15 years doing this work:</p>

<p><strong>Mistake #1: Analysis paralysis.</strong> Spending months planning instead of taking action. The solution? Set a deadline for planning (I recommend two weeks maximum), then start executing even if you don't feel ready.</p>

<p><strong>Mistake #2: Copying competitors blindly.</strong> What works for them might not work for you. Always test and validate in your own context.</p>

<p><strong>Mistake #3: Ignoring the data.</strong> Making decisions based on opinions instead of metrics. Set up proper tracking from day one and let data guide your decisions.</p>

<p><strong>Mistake #4: Trying to do everything.</strong> Spreading resources too thin across too many initiatives. Focus is your competitive advantage.</p>

<p><strong>Mistake #5: Giving up too early.</strong> Most strategies need 3-6 months to show real results. Stick with what's working long enough to see compound effects.</p>

<p><strong>Mistake #6: Not documenting what works.</strong> Building institutional knowledge is crucial. Document your wins and losses so you can learn from both.</p>

<p><strong>Mistake #7: Neglecting the fundamentals.</strong> Chasing shiny new tactics while ignoring basics. Master the fundamentals first, always.</p>

<h2>Your Action Plan: What to Do Next</h2>
<p>Alright, you've got the knowledge. Now let's talk about implementation. Here's exactly what I recommend you do, starting today:</p>

<p><strong>This week:</strong> Audit your current situation. Spend 2-3 hours honestly assessing where you are now. Write down what's working and what's not. Be specific.</p>

<p><strong>Next week:</strong> Define your success metrics. What does success look like in 3 months? 6 months? 12 months? Make these specific and measurable.</p>

<p><strong>Week 3:</strong> Identify your quick wins. What 3-5 things can you improve immediately? Focus on high-impact, low-effort changes first.</p>

<p><strong>Week 4:</strong> Start testing. Pick one strategy from this article and test it for two weeks. Measure everything.</p>

<p><strong>Month 2:</strong> Scale what works. If your test showed positive results, expand it. If not, try something else.</p>

<p><strong>Month 3+:</strong> Optimize continuously. Keep testing, measuring, and improving. This is where the real magic happens.</p>

<!-- IMAGE: ${req.body.title} action plan roadmap -->

<h2>Measuring Success: What to Track</h2>
<p>You can't improve what you don't measure. Here are the key metrics I track with every client:</p>

<ul>
<li><strong>Primary outcome metric</strong> - The one number that matters most to your success</li>
<li><strong>Leading indicators</strong> - Metrics that predict future success</li>
<li><strong>Efficiency metrics</strong> - How much input is required for each unit of output</li>
<li><strong>Quality metrics</strong> - Ensuring results meet standards</li>
<li><strong>Trend data</strong> - Are things getting better or worse over time?</li>
</ul>

<p>I recommend reviewing metrics weekly for the first three months, then monthly once things stabilize. The key is consistency—pick a schedule and stick to it.</p>

<h2>What's Coming Next</h2>
<p>Based on what I'm seeing with my clients and in the industry, here are the trends I'm watching:</p>

<p>First, there's a shift toward simplification. After years of increasing complexity, smart practitioners are stripping things back to basics and seeing better results.</p>

<p>Second, personalization is becoming table stakes. Generic approaches don't cut it anymore. The winners are those who can adapt quickly to individual needs.</p>

<p>Third, speed is becoming a competitive advantage. The ability to test, learn, and adapt quickly beats having the perfect strategy.</p>

<p>My advice? Focus on building systems that let you move fast and adapt quickly. That's the skill that will serve you best regardless of how the landscape changes.</p>

<h2>Final Thoughts</h2>
<p>Look, ${req.body.title} isn't rocket science, but it does require commitment and consistency. I've shared everything I've learned from 15 years in the trenches—the strategies that work, the mistakes to avoid, and the frameworks that deliver results.</p>

<p>The key takeaways:</p>

<ul>
<li>Start before you're ready and learn by doing</li>
<li>Focus on fundamentals before advanced techniques</li>
<li>Measure everything and let data guide decisions</li>
<li>Test quickly, scale what works, eliminate what doesn't</li>
<li>Stay consistent and give strategies time to work</li>
</ul>

<p>Your next step is simple: pick one thing from this article and implement it this week. Don't try to do everything at once. Small, consistent actions compound into remarkable results over time.</p>

<p>You've got this. Now go make it happen.</p>`,
      excerpt: `Master ${req.body.title} with proven strategies from 15+ years of hands-on experience. Learn what actually works, avoid common mistakes, and get actionable advice you can implement today.`,
      imageCount: 5
    };

    const fallbackImageResult = await ImageService.generateArticleWithImages(
      fallbackContent.content,
      req.body.title,
      req.body.category || 'General'
    );

    const wordCount = fallbackContent.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length;

    res.json({
      content: fallbackImageResult.content,
      excerpt: fallbackContent.excerpt,
      featuredImageUrl: fallbackImageResult.featuredImageUrl,
      featuredImageAlt: `${req.body.title} - Expert guide with proven strategies`,
      imagesAdded: fallbackImageResult.imagesAdded,
      imageCount: fallbackContent.imageCount,
      source: 'Professional Expert Content',
      wordCount: wordCount,
      formatted: 'WordPress-Ready HTML - Human Quality'
    });
  }
});

// Create article with moderation
router.post('/', verifyToken, async (req, res) => {
  try {
    const result = await ArticleManagementService.createArticle(req.userId, req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all articles for user
router.get('/', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, campaignId } = req.query;
    const skip = (page - 1) * limit;

    const filter = { userId: req.userId };
    if (status) filter.status = status;
    if (campaignId) filter.campaignId = campaignId;

    const articles = await Article.find(filter)
      .sort({ createdAt: -1 })
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

// Get article by ID
router.get('/:articleId', verifyToken, async (req, res) => {
  try {
    const article = await Article.findById(req.params.articleId);

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

    // Create revision before update
    article.createRevision(req.userId, 'Article updated');

    Object.assign(article, req.body);
    article.updatedAt = new Date();

    // Recalculate scores
    article.calculateSeoScore();
    article.calculateQualityScore();

    await article.save();

    res.json(article);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update article status
router.patch('/:articleId/status', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const result = await ArticleManagementService.updateArticleStatus(
      req.params.articleId,
      req.userId,
      status
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Review article (approve/reject/flag)
router.post('/:articleId/review', verifyToken, async (req, res) => {
  try {
    const { action, notes } = req.body;

    // Check if user is admin (for now, allow all users to review their own articles)
    const result = await ArticleManagementService.reviewArticle(
      req.params.articleId,
      req.userId,
      action,
      notes
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update SEO settings
router.patch('/:articleId/seo', verifyToken, async (req, res) => {
  try {
    const result = await ArticleManagementService.updateSeoSettings(
      req.params.articleId,
      req.userId,
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get SEO recommendations
router.get('/:articleId/seo-recommendations', verifyToken, async (req, res) => {
  try {
    const article = await Article.findById(req.params.articleId);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.userId.toString() !== req.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const recommendations = [];

    // Check focus keyword
    if (!article.seo?.focusKeyword) {
      recommendations.push('Set a focus keyword for better SEO');
    }

    // Check meta description
    if (!article.seo?.metaDescription) {
      recommendations.push('Add a meta description (120-160 characters)');
    } else if (article.seo.metaDescription.length < 120 || article.seo.metaDescription.length > 160) {
      recommendations.push(`Meta description should be 120-160 characters (currently ${article.seo.metaDescription.length})`);
    }

    // Check headings
    if (article.seo?.headingStructure?.h1 !== 1) {
      recommendations.push('Article should have exactly one H1 heading');
    }

    // Check content length
    if (article.wordCount < 300) {
      recommendations.push('Expand content to at least 300 words for better SEO');
    }

    // Check internal links
    if (!article.seo?.internalLinks || article.seo.internalLinks.length === 0) {
      recommendations.push('Add internal links to improve SEO');
    }

    // Check external links
    if (!article.seo?.externalLinks || article.seo.externalLinks.length === 0) {
      recommendations.push('Add external links to authoritative sources');
    }

    // Check image alt texts
    if (!article.seo?.imageAltTexts || article.seo.imageAltTexts.length === 0) {
      recommendations.push('Add alt text to images for better accessibility and SEO');
    }

    res.json({
      seoScore: article.seo?.seoScore || 0,
      recommendations
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sync to WordPress
router.post('/:articleId/wordpress/sync', verifyToken, async (req, res) => {
  try {
    const result = await ArticleManagementService.syncToWordPress(
      req.params.articleId,
      req.userId,
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get article analytics
router.get('/:articleId/analytics', verifyToken, async (req, res) => {
  try {
    const result = await ArticleManagementService.getArticleAnalytics(
      req.params.articleId,
      req.userId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update article analytics
router.patch('/:articleId/analytics', verifyToken, async (req, res) => {
  try {
    const result = await ArticleManagementService.updateArticleAnalytics(
      req.params.articleId,
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get articles pending review (admin)
router.get('/admin/pending-review', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await ArticleManagementService.getArticlesPendingReview(
      req.userId,
      parseInt(page),
      parseInt(limit)
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk update article status
router.post('/bulk/update-status', verifyToken, async (req, res) => {
  try {
    const { articleIds, status } = req.body;
    const result = await ArticleManagementService.bulkUpdateStatus(
      articleIds,
      status,
      req.userId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get article revisions
router.get('/:articleId/revisions', verifyToken, async (req, res) => {
  try {
    const result = await ArticleManagementService.getArticleRevisions(
      req.params.articleId,
      req.userId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Restore article from revision
router.post('/:articleId/revisions/:version/restore', verifyToken, async (req, res) => {
  try {
    const result = await ArticleManagementService.restoreFromRevision(
      req.params.articleId,
      req.userId,
      parseInt(req.params.version)
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get quality report
router.get('/:articleId/quality-report', verifyToken, async (req, res) => {
  try {
    const result = await ArticleManagementService.getQualityReport(
      req.params.articleId,
      req.userId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
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

    res.json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// WordPress Sync Routes

// Sync article to WordPress
router.post('/:articleId/wordpress/sync', verifyToken, async (req, res) => {
  try {
    const result = await WordPressSyncService.syncArticleToWordPress(
      req.params.articleId,
      req.userId,
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Publish article to WordPress
router.post('/:articleId/wordpress/publish', verifyToken, async (req, res) => {
  try {
    const result = await WordPressSyncService.publishToWordPress(
      req.params.articleId,
      req.userId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get WordPress sync status
router.get('/:articleId/wordpress/status', verifyToken, async (req, res) => {
  try {
    const result = await WordPressSyncService.getWordPressSyncStatus(
      req.params.articleId,
      req.userId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Resync from WordPress
router.post('/:articleId/wordpress/resync', verifyToken, async (req, res) => {
  try {
    const result = await WordPressSyncService.resyncFromWordPress(
      req.params.articleId,
      req.userId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Disconnect from WordPress
router.post('/:articleId/wordpress/disconnect', verifyToken, async (req, res) => {
  try {
    const result = await WordPressSyncService.disconnectFromWordPress(
      req.params.articleId,
      req.userId
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Bulk sync to WordPress
router.post('/wordpress/bulk-sync', verifyToken, async (req, res) => {
  try {
    const { articleIds, config } = req.body;
    const result = await WordPressSyncService.bulkSyncToWordPress(
      articleIds,
      req.userId,
      config
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get WordPress configuration
router.get('/wordpress/config', verifyToken, async (req, res) => {
  try {
    const result = await WordPressSyncService.getWordPressConfig(req.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
