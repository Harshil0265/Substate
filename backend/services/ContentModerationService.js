import User from '../models/User.js';

class ContentModerationService {
  constructor() {
    // Prohibited content patterns - ONLY truly harmful content
    this.prohibitedPatterns = [
      // Explicit violence and terrorism (very specific)
      /\b(how to make (a )?bomb|build (a )?weapon|terrorist attack plan|mass shooting|assassination guide)\b/gi,
      
      // Explicit hate speech (very specific)
      /\b(kill all|death to|exterminate|genocide plan|racial slur)\b/gi,
      
      // Explicit adult content (very specific)
      /\b(hardcore porn|xxx video|explicit sex|nude photos)\b/gi,
      
      // Explicit illegal activities (very specific)
      /\b(buy drugs online|sell cocaine|money laundering guide|hack bank account)\b/gi
    ];

    // Severity levels
    this.severityLevels = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 4
    };

    // Category mappings - reduced to only critical issues
    this.categoryMappings = {
      'explicit_violence': { severity: this.severityLevels.CRITICAL, action: 'BLOCK_AND_SUSPEND' },
      'explicit_hate': { severity: this.severityLevels.CRITICAL, action: 'BLOCK_AND_SUSPEND' },
      'explicit_adult': { severity: this.severityLevels.HIGH, action: 'BLOCK_AND_WARN' },
      'explicit_illegal': { severity: this.severityLevels.CRITICAL, action: 'BLOCK_AND_SUSPEND' }
    };
  }

  // Analyze article content for prohibited material
  async analyzeArticleContent(articleData) {
    const { title, content, userId } = articleData;
    const contentToAnalyze = `${title || ''} ${content || ''}`.toLowerCase();

    const violations = [];
    let maxSeverity = 0;
    let recommendedAction = 'APPROVE';

    for (let i = 0; i < this.prohibitedPatterns.length; i++) {
      const pattern = this.prohibitedPatterns[i];
      const matches = contentToAnalyze.match(pattern);

      if (matches) {
        const category = this.getCategoryFromPattern(i);
        const categoryInfo = this.categoryMappings[category];

        violations.push({
          category,
          matches: matches.map(match => match.toLowerCase()),
          severity: categoryInfo.severity,
          action: categoryInfo.action,
          description: this.getCategoryDescription(category)
        });

        if (categoryInfo.severity > maxSeverity) {
          maxSeverity = categoryInfo.severity;
          recommendedAction = categoryInfo.action;
        }
      }
    }

    const user = await User.findById(userId);
    const violationHistory = user?.violationHistory || [];
    const riskScore = this.calculateRiskScore(violations, violationHistory);

    return {
      isViolation: violations.length > 0,
      violations,
      maxSeverity,
      recommendedAction,
      riskScore,
      userViolationCount: violationHistory.length,
      requiresManualReview: maxSeverity >= this.severityLevels.MEDIUM || violationHistory.length >= 2
    };
  }

  // Analyze campaign content for prohibited material
  async analyzeCampaignContent(campaignData) {
    const { title, description, userId } = campaignData;
    const contentToAnalyze = `${title} ${description}`.toLowerCase();
    
    const violations = [];
    let maxSeverity = 0;
    let recommendedAction = 'APPROVE';

    // Check against prohibited patterns
    for (let i = 0; i < this.prohibitedPatterns.length; i++) {
      const pattern = this.prohibitedPatterns[i];
      const matches = contentToAnalyze.match(pattern);
      
      if (matches) {
        const category = this.getCategoryFromPattern(i);
        const categoryInfo = this.categoryMappings[category];
        
        violations.push({
          category,
          matches: matches.map(match => match.toLowerCase()),
          severity: categoryInfo.severity,
          action: categoryInfo.action,
          description: this.getCategoryDescription(category)
        });

        if (categoryInfo.severity > maxSeverity) {
          maxSeverity = categoryInfo.severity;
          recommendedAction = categoryInfo.action;
        }
      }
    }

    // Get user's violation history
    const user = await User.findById(userId);
    const violationHistory = user.violationHistory || [];

    // Calculate risk score based on history
    const riskScore = this.calculateRiskScore(violations, violationHistory);

    return {
      isViolation: violations.length > 0,
      violations,
      maxSeverity,
      recommendedAction,
      riskScore,
      userViolationCount: violationHistory.length,
      requiresManualReview: maxSeverity >= this.severityLevels.MEDIUM || violationHistory.length >= 2
    };
  }

  // Get category from pattern index
  getCategoryFromPattern(patternIndex) {
    const categories = [
      'explicit_violence',
      'explicit_hate',
      'explicit_adult',
      'explicit_illegal'
    ];
    return categories[patternIndex] || 'unknown';
  }

  // Get human-readable category description
  getCategoryDescription(category) {
    const descriptions = {
      'explicit_violence': 'Explicit violent or terrorist content',
      'explicit_hate': 'Explicit hate speech or discriminatory content',
      'explicit_adult': 'Explicit adult or pornographic content',
      'explicit_illegal': 'Explicit illegal activity instructions'
    };
    return descriptions[category] || 'Unspecified violation';
  }

  // Calculate risk score based on violations and history
  calculateRiskScore(violations, history) {
    let score = 0;
    
    // Add points for current violations
    violations.forEach(violation => {
      score += violation.severity * 10;
    });
    
    // Add points for violation history
    score += history.length * 15;
    
    // Recent violations are weighted more heavily
    const recentViolations = history.filter(v => {
      const violationDate = new Date(v.date);
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return violationDate > thirtyDaysAgo;
    });
    
    score += recentViolations.length * 25;
    
    return Math.min(score, 100); // Cap at 100
  }

  // Record violation in user's history
  async recordViolation(userId, violation, campaignId) {
    const user = await User.findById(userId);
    
    if (!user.violationHistory) {
      user.violationHistory = [];
    }
    
    user.violationHistory.push({
      date: new Date(),
      campaignId,
      category: violation.category,
      severity: violation.severity,
      description: violation.description,
      action: violation.action
    });
    
    // Update violation count
    user.violationCount = (user.violationCount || 0) + 1;
    
    // Auto-suspend after 3 violations
    if (user.violationCount >= 3) {
      user.accountLocked = true;
      user.lockedUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      user.lockReason = 'Multiple content policy violations';
    }
    
    await user.save();
    
    return {
      violationCount: user.violationCount,
      accountLocked: user.accountLocked,
      lockReason: user.lockReason
    };
  }

  // Get moderation statistics
  async getModerationStats() {
    const users = await User.find({});
    
    const stats = {
      totalViolations: 0,
      violationsByCategory: {},
      suspendedUsers: 0,
      usersWithViolations: 0,
      recentViolations: 0
    };
    
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    users.forEach(user => {
      if (user.violationHistory && user.violationHistory.length > 0) {
        stats.usersWithViolations++;
        stats.totalViolations += user.violationHistory.length;
        
        user.violationHistory.forEach(violation => {
          // Count by category
          if (!stats.violationsByCategory[violation.category]) {
            stats.violationsByCategory[violation.category] = 0;
          }
          stats.violationsByCategory[violation.category]++;
          
          // Count recent violations
          if (new Date(violation.date) > thirtyDaysAgo) {
            stats.recentViolations++;
          }
        });
      }
      
      if (user.accountLocked) {
        stats.suspendedUsers++;
      }
    });
    
    return stats;
  }
}

export default new ContentModerationService();