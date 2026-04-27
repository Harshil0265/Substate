class ContentValidationService {
  constructor() {
    // Patterns that indicate fake/generic AI content
    this.fakeContentPatterns = {
      // Generic business jargon that appears in fake content
      genericBusinessTerms: [
        'digital transformation spending',
        'operational efficiency through automation',
        'data analytics implementation',
        'comprehensive data analysis reveals',
        'statistical analysis of.*reveals comprehensive performance data',
        'regression analysis indicates strong predictive capabilities',
        'comparative benchmarking against industry standards',
        'longitudinal data analysis spanning.*periods confirms',
        'quantitative measurements include',
        'performance efficiency ratings.*average across measured parameters',
        'quality assurance metrics.*compliance with established standards',
        'cost-benefit ratio.*return on investment calculations'
      ],
      
      // Fake statistics patterns
      fakeStatistics: [
        /\d+(?:\.\d+)?% of (?:companies|businesses|organizations) (?:increased|decreased|implemented)/gi,
        /according to (?:mckinsey|deloitte|pwc|harvard business review|boston consulting group).*\d+(?:\.\d+)?%/gi,
        /\$\d+(?:\.\d+)? million (?:incremental value generation|digital transformation spending)/gi,
        /r-squared values exceeding 0\.\d+/gi,
        /performance levels within the \d+th percentile range/gi,
        /\d+(?:\.\d+)?% improvement in (?:operational efficiency|key performance indicators)/gi
      ],
      
      // Repetitive content patterns
      repetitivePatterns: [
        /statistical analysis of .* reveals comprehensive performance data/gi,
        /data correlation analysis demonstrates significant relationships/gi,
        /quantitative measurements include:/gi,
        /longitudinal data analysis spanning/gi
      ],
      
      // Fake source citations
      fakeSources: [
        /mckinsey global institute.*\d+% (?:revenue growth|improvement)/gi,
        /deloitte research shows \d+% of companies/gi,
        /harvard business review reports \d+% of fortune 500/gi,
        /boston consulting group data shows \$\d+ billion market size/gi,
        /pwc analysis indicates \d+(?:\.\d+)?% improvement/gi
      ],
      
      // Generic methodology claims
      fakeMethodology: [
        /statistical significance testing.*p-values < 0\.05/gi,
        /data collection period:.*january \d+ - october \d+/gi,
        /incorporates data from \d+ verified sources/gi,
        /95% confidence intervals supporting positive trend forecasts/gi
      ]
    };
    
    // Indicators of authentic content
    this.authenticContentIndicators = {
      realSources: [
        'wikipedia.org',
        'census.gov',
        'worldbank.org',
        'who.int',
        'un.org',
        'gov.uk',
        'nih.gov',
        'nature.com',
        'science.org',
        'arxiv.org'
      ],
      
      specificData: [
        /born (?:on|in) \d{1,2} \w+ \d{4}/gi,
        /died (?:on|in) \d{1,2} \w+ \d{4}/gi,
        /established in \d{4}/gi,
        /founded in \d{4}/gi,
        /population of [\d,]+ as of \d{4}/gi,
        /located at coordinates/gi,
        /published in \d{4}/gi
      ],
      
      topicSpecificTerms: {
        sports: ['matches', 'goals', 'runs', 'wickets', 'championships', 'tournaments', 'career statistics'],
        person: ['born', 'education', 'career', 'achievements', 'family', 'early life'],
        place: ['located', 'population', 'area', 'climate', 'geography', 'history'],
        company: ['founded', 'headquarters', 'employees', 'revenue', 'products', 'services'],
        science: ['research', 'study', 'experiment', 'hypothesis', 'methodology', 'results']
      }
    };
  }

  validateContent(content, topic, metadata = {}) {
    console.log('🔍 Validating content authenticity...');
    
    const validation = {
      isAuthentic: true,
      confidence: 100,
      issues: [],
      recommendations: [],
      contentType: this.detectContentType(content, topic),
      fakePatterns: [],
      authenticIndicators: []
    };

    // If this is AI-generated content, use relaxed validation
    const isAIGenerated = metadata.generationMethod === 'ai_comprehensive' || 
                          metadata.authenticity === 'ai_generated';
    
    if (isAIGenerated) {
      console.log('ℹ️ AI-generated content detected, using relaxed validation');
      // For AI content, we only check for critical issues
      this.detectCriticalIssues(content, validation);
      validation.confidence = Math.max(70, validation.confidence); // Minimum 70% for AI content
    } else {
      // Check for fake content patterns (strict validation for research-based content)
      this.detectFakePatterns(content, validation);
      
      // Check for authentic indicators
      this.detectAuthenticIndicators(content, topic, validation);
      
      // Check content relevance to topic
      this.checkTopicRelevance(content, topic, validation);
      
      // Check for repetitive content
      this.checkRepetitiveContent(content, validation);
    }
    
    // Calculate final authenticity score
    this.calculateAuthenticityScore(validation, metadata, isAIGenerated);
    
    console.log('✅ Content validation completed:', {
      isAuthentic: validation.isAuthentic,
      confidence: validation.confidence,
      issuesFound: validation.issues.length,
      contentType: validation.contentType,
      isAIGenerated: isAIGenerated
    });
    
    return validation;
  }

  detectCriticalIssues(content, validation) {
    // Only check for truly problematic content
    const criticalPatterns = [
      /\b(fuck|shit|damn|hell|ass|bitch|bastard)\b/gi, // Profanity
      /\b(viagra|cialis|casino|poker|lottery)\b/gi, // Spam keywords
    ];
    
    criticalPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        validation.fakePatterns.push({
          type: 'critical_content_issue',
          pattern: pattern.toString(),
          matches: matches.length,
          severity: 'critical'
        });
        validation.confidence -= 50;
      }
    });
  }

  detectFakePatterns(content, validation) {
    const contentLower = content.toLowerCase();
    
    // Check for generic business terms
    this.fakeContentPatterns.genericBusinessTerms.forEach(pattern => {
      const regex = new RegExp(pattern, 'gi');
      const matches = content.match(regex);
      if (matches) {
        validation.fakePatterns.push({
          type: 'generic_business_jargon',
          pattern: pattern,
          matches: matches.length,
          severity: 'high'
        });
        validation.confidence -= 20;
      }
    });
    
    // Check for fake statistics
    this.fakeContentPatterns.fakeStatistics.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        validation.fakePatterns.push({
          type: 'fake_statistics',
          pattern: pattern.toString(),
          matches: matches.length,
          severity: 'critical',
          examples: matches.slice(0, 3)
        });
        validation.confidence -= 30;
      }
    });
    
    // Check for fake sources
    this.fakeContentPatterns.fakeSources.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        validation.fakePatterns.push({
          type: 'fake_source_citation',
          pattern: pattern.toString(),
          matches: matches.length,
          severity: 'critical',
          examples: matches.slice(0, 2)
        });
        validation.confidence -= 25;
      }
    });
    
    // Check for repetitive patterns
    this.fakeContentPatterns.repetitivePatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches && matches.length > 2) {
        validation.fakePatterns.push({
          type: 'repetitive_content',
          pattern: pattern.toString(),
          matches: matches.length,
          severity: 'medium'
        });
        validation.confidence -= 15;
      }
    });
  }

  detectAuthenticIndicators(content, topic, validation) {
    // Check for real source URLs
    this.authenticContentIndicators.realSources.forEach(source => {
      if (content.toLowerCase().includes(source)) {
        validation.authenticIndicators.push({
          type: 'real_source_url',
          source: source,
          severity: 'positive'
        });
        validation.confidence += 10;
      }
    });
    
    // Check for specific data patterns
    this.authenticContentIndicators.specificData.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        validation.authenticIndicators.push({
          type: 'specific_factual_data',
          pattern: pattern.toString(),
          matches: matches.length,
          examples: matches.slice(0, 2)
        });
        validation.confidence += 15;
      }
    });
    
    // Check for topic-specific terminology
    const contentType = this.detectContentType(content, topic);
    const relevantTerms = this.authenticContentIndicators.topicSpecificTerms[contentType] || [];
    
    let topicTermsFound = 0;
    relevantTerms.forEach(term => {
      if (content.toLowerCase().includes(term.toLowerCase())) {
        topicTermsFound++;
      }
    });
    
    if (topicTermsFound > 0) {
      validation.authenticIndicators.push({
        type: 'topic_specific_terminology',
        termsFound: topicTermsFound,
        totalTerms: relevantTerms.length,
        relevance: (topicTermsFound / relevantTerms.length) * 100
      });
      validation.confidence += Math.min(20, topicTermsFound * 3);
    }
  }

  checkTopicRelevance(content, topic, validation) {
    const topicWords = topic.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    let topicMentions = 0;
    topicWords.forEach(word => {
      if (word.length > 2) { // Skip short words
        const mentions = (contentLower.match(new RegExp(word, 'g')) || []).length;
        topicMentions += mentions;
      }
    });
    
    const contentWords = content.split(/\s+/).length;
    const relevanceRatio = topicMentions / contentWords;
    
    if (relevanceRatio < 0.01) { // Less than 1% topic relevance
      validation.issues.push({
        type: 'low_topic_relevance',
        severity: 'high',
        message: `Content has very low relevance to topic "${topic}"`
      });
      validation.confidence -= 25;
    } else if (relevanceRatio > 0.05) { // Good topic relevance
      validation.authenticIndicators.push({
        type: 'good_topic_relevance',
        relevanceRatio: relevanceRatio,
        topicMentions: topicMentions
      });
      validation.confidence += 10;
    }
  }

  checkRepetitiveContent(content, validation) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const sentenceMap = new Map();
    
    sentences.forEach(sentence => {
      const normalized = sentence.trim().toLowerCase().replace(/\s+/g, ' ');
      if (normalized.length > 20) {
        const similar = this.findSimilarSentences(normalized, Array.from(sentenceMap.keys()));
        if (similar.length > 0) {
          sentenceMap.set(normalized, (sentenceMap.get(normalized) || 0) + 1);
        } else {
          sentenceMap.set(normalized, 1);
        }
      }
    });
    
    const repetitiveSentences = Array.from(sentenceMap.entries()).filter(([_, count]) => count > 1);
    
    if (repetitiveSentences.length > 0) {
      validation.issues.push({
        type: 'repetitive_sentences',
        severity: 'medium',
        count: repetitiveSentences.length,
        examples: repetitiveSentences.slice(0, 2).map(([sentence, count]) => ({ sentence: sentence.substring(0, 100), count }))
      });
      validation.confidence -= repetitiveSentences.length * 5;
    }
  }

  findSimilarSentences(sentence, existingSentences) {
    return existingSentences.filter(existing => {
      const similarity = this.calculateSimilarity(sentence, existing);
      return similarity > 0.8; // 80% similarity threshold
    });
  }

  calculateSimilarity(str1, str2) {
    const words1 = str1.split(/\s+/);
    const words2 = str2.split(/\s+/);
    const commonWords = words1.filter(word => words2.includes(word));
    return commonWords.length / Math.max(words1.length, words2.length);
  }

  detectContentType(content, topic) {
    const topicLower = topic.toLowerCase();
    const contentLower = content.toLowerCase();
    
    // Sports personality detection
    if (topicLower.includes('cricket') || topicLower.includes('football') || topicLower.includes('tennis') ||
        contentLower.includes('matches') || contentLower.includes('career statistics') || contentLower.includes('championships')) {
      return 'sports';
    }
    
    // Person detection
    if (contentLower.includes('born') || contentLower.includes('education') || contentLower.includes('early life') ||
        contentLower.includes('career') || contentLower.includes('achievements')) {
      return 'person';
    }
    
    // Place detection
    if (contentLower.includes('located') || contentLower.includes('population') || contentLower.includes('geography') ||
        contentLower.includes('climate') || contentLower.includes('area')) {
      return 'place';
    }
    
    // Company detection
    if (contentLower.includes('founded') || contentLower.includes('headquarters') || contentLower.includes('employees') ||
        contentLower.includes('revenue') || contentLower.includes('products')) {
      return 'company';
    }
    
    return 'general';
  }

  calculateAuthenticityScore(validation, metadata, isAIGenerated = false) {
    // Ensure confidence doesn't go below 0 or above 100
    validation.confidence = Math.max(0, Math.min(100, validation.confidence));
    
    // For AI-generated content, be more lenient
    if (isAIGenerated) {
      // Only fail on critical issues
      const criticalIssues = validation.fakePatterns.filter(p => p.severity === 'critical');
      
      if (criticalIssues.length > 0) {
        validation.isAuthentic = false;
        validation.issues.push({
          type: 'critical_content_issues',
          severity: 'critical',
          message: `Found ${criticalIssues.length} critical content issues`,
          patterns: criticalIssues
        });
      } else {
        // AI content is considered authentic if no critical issues
        validation.isAuthentic = true;
        validation.confidence = Math.max(70, validation.confidence);
      }
      return;
    }
    
    // Strict validation for research-based content
    const criticalIssues = validation.fakePatterns.filter(p => p.severity === 'critical');
    
    if (criticalIssues.length > 0) {
      validation.isAuthentic = false;
      validation.issues.push({
        type: 'critical_fake_patterns',
        severity: 'critical',
        message: `Found ${criticalIssues.length} critical fake content patterns`,
        patterns: criticalIssues
      });
    } else if (validation.confidence < 30) {
      validation.isAuthentic = false;
      validation.issues.push({
        type: 'low_authenticity_confidence',
        severity: 'high',
        message: `Authenticity confidence too low: ${validation.confidence}%`
      });
    }
    
    // Add recommendations based on issues
    if (!validation.isAuthentic) {
      validation.recommendations.push('Regenerate content with verified sources');
      validation.recommendations.push('Remove generic business jargon');
      validation.recommendations.push('Use topic-specific, factual information');
      validation.recommendations.push('Include real source citations');
    }
  }

  // Method to check if content should be rejected
  shouldRejectContent(content, topic, metadata = {}) {
    const validation = this.validateContent(content, topic, metadata);
    
    return {
      shouldReject: !validation.isAuthentic,
      reason: validation.issues.map(issue => issue.message).join('; '),
      confidence: validation.confidence,
      validation: validation
    };
  }

  // Method to get improvement suggestions
  getImprovementSuggestions(content, topic) {
    const validation = this.validateContent(content, topic);
    
    const suggestions = [];
    
    if (validation.fakePatterns.length > 0) {
      suggestions.push('Remove generic business terminology and fake statistics');
      suggestions.push('Replace made-up data with real, verifiable information');
    }
    
    if (validation.authenticIndicators.length === 0) {
      suggestions.push('Add real source citations and factual data');
      suggestions.push('Include topic-specific information and terminology');
    }
    
    const topicRelevance = validation.issues.find(i => i.type === 'low_topic_relevance');
    if (topicRelevance) {
      suggestions.push(`Increase relevance to topic "${topic}" by including more specific information`);
    }
    
    return suggestions;
  }
}

export default ContentValidationService;