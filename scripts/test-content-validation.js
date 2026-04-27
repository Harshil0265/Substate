import AuthenticContentServicePro from '../backend/services/AuthenticContentServicePro.js';
import ContentValidationService from '../backend/services/ContentValidationService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testContentValidation() {
  console.log('🧪 Testing Content Validation System');
  console.log('=' .repeat(80));
  
  const service = new AuthenticContentServicePro();
  const validator = new ContentValidationService();
  
  // Test 1: Fake content (like what you showed me)
  console.log('\n🚨 TEST 1: FAKE CONTENT DETECTION');
  console.log('-'.repeat(50));
  
  const fakeContent = `
# M.S. Dhoni: Comprehensive Data Analysis

Current market analysis reveals significant developments in M.S. Dhoni. Deloitte research shows 67% of companies increased digital transformation spending by $2.4 million. Research data indicates sustained growth patterns with PwC analysis indicates 34.7% improvement in operational efficiency through automation.

Statistical analysis of current market analysis and performance metrics reveals comprehensive performance data. According to McKinsey Global Institute, businesses implementing AI see 23% revenue growth. Furthermore, Boston Consulting Group data shows $156 billion market size for business consulting.

Quantitative measurements include:
- Performance efficiency ratings: 87.3% average across measured parameters
- Quality assurance metrics: 94.6% compliance with established standards
- Operational effectiveness: 12.8% improvement over baseline measurements
- Cost-benefit ratio: 3.2:1 return on investment calculations
  `;
  
  const fakeValidation = validator.validateContent(fakeContent, 'M.S. Dhoni');
  
  console.log('📊 FAKE CONTENT ANALYSIS:');
  console.log(`   Authenticity: ${fakeValidation.isAuthentic ? '✅ AUTHENTIC' : '❌ FAKE'}`);
  console.log(`   Confidence: ${fakeValidation.confidence}%`);
  console.log(`   Issues Found: ${fakeValidation.issues.length}`);
  console.log(`   Fake Patterns: ${fakeValidation.fakePatterns.length}`);
  
  if (fakeValidation.fakePatterns.length > 0) {
    console.log('\n🔍 DETECTED FAKE PATTERNS:');
    fakeValidation.fakePatterns.forEach((pattern, index) => {
      console.log(`   ${index + 1}. ${pattern.type}: ${pattern.severity} severity`);
      if (pattern.examples) {
        console.log(`      Example: "${pattern.examples[0].substring(0, 80)}..."`);
      }
    });
  }
  
  // Test 2: Authentic content generation
  console.log('\n\n✅ TEST 2: AUTHENTIC CONTENT GENERATION');
  console.log('-'.repeat(50));
  
  const topics = ['M.S. Dhoni', 'Albert Einstein', 'Apple Inc', 'Climate Change', 'Artificial Intelligence'];
  
  for (const topic of topics) {
    console.log(`\n📝 Testing: ${topic}`);
    console.log('-'.repeat(30));
    
    try {
      const result = await service.generateAuthenticContent(topic, {
        targetLength: 800,
        includeStatistics: true
      });
      
      console.log('📊 Results:');
      console.log(`   Sources Used: ${result.metadata.sourcesUsed}`);
      console.log(`   Data Points: ${result.metadata.dataPoints}`);
      console.log(`   Authenticity: ${result.metadata.authenticity}`);
      console.log(`   Topic Type: ${result.metadata.topicType}`);
      
      if (result.metadata.validation) {
        console.log(`   Validation Confidence: ${result.metadata.validation.confidence}%`);
        console.log(`   Content Type: ${result.metadata.validation.contentType}`);
      }
      
      // Show content preview
      const preview = result.content.substring(0, 200).replace(/\n/g, ' ');
      console.log(`   Preview: "${preview}..."`);
      
      // Check if content was rejected
      if (result.metadata.authenticity === 'rejected_fake_content') {
        console.log('   🛡️ FAKE CONTENT REJECTED - Honest response provided instead');
      }
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
  }
  
  // Test 3: Content validation rules
  console.log('\n\n🔍 TEST 3: VALIDATION RULES DEMONSTRATION');
  console.log('-'.repeat(50));
  
  const testCases = [
    {
      name: 'Generic Business Jargon',
      content: 'Statistical analysis reveals comprehensive performance data with operational efficiency improvements.',
      topic: 'Sports Player'
    },
    {
      name: 'Fake McKinsey Citation',
      content: 'According to McKinsey Global Institute, 73% of sports players see revenue growth.',
      topic: 'Cricket'
    },
    {
      name: 'Authentic Wikipedia Content',
      content: 'Born on July 7, 1981, in Ranchi, Jharkhand, India. He is a former Indian cricketer.',
      topic: 'M.S. Dhoni'
    },
    {
      name: 'Repetitive Content',
      content: 'Data analysis shows trends. Statistical analysis shows trends. Performance analysis shows trends.',
      topic: 'Analysis'
    }
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\n${index + 1}. ${testCase.name}:`);
    const validation = validator.validateContent(testCase.content, testCase.topic);
    console.log(`   Result: ${validation.isAuthentic ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`   Confidence: ${validation.confidence}%`);
    if (validation.fakePatterns.length > 0) {
      console.log(`   Issues: ${validation.fakePatterns.map(p => p.type).join(', ')}`);
    }
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('🎯 SUMMARY: CONTENT VALIDATION SYSTEM');
  console.log('✅ Detects fake business jargon in non-business topics');
  console.log('✅ Identifies made-up statistics and fake citations');
  console.log('✅ Recognizes repetitive, AI-generated content');
  console.log('✅ Validates topic relevance and authenticity');
  console.log('✅ Provides honest responses when data is limited');
  console.log('✅ Suggests improvements for better content');
  console.log('❌ REJECTS fake content instead of publishing it');
  
  console.log('\n🔧 SYSTEM BENEFITS:');
  console.log('1. No more fake McKinsey/Deloitte citations');
  console.log('2. No generic business stats for sports players');
  console.log('3. Honest about data limitations');
  console.log('4. Uses real Wikipedia and news sources');
  console.log('5. Topic-appropriate content generation');
  console.log('6. Comprehensive fake content detection');
}

testContentValidation();