import AuthenticContentService from '../backend/services/AuthenticContentService.js';

async function testAuthenticContentGeneration() {
  console.log('🧪 Testing Authentic Content Generation Service\n');
  
  const service = new AuthenticContentService();
  
  // Test topics with different types of data
  const testTopics = [
    'Tesla Stock Performance 2024',
    'COVID-19 Economic Impact Analysis',
    'Artificial Intelligence Market Growth',
    'Climate Change Statistics Global',
    'Cryptocurrency Market Trends 2024'
  ];

  for (const topic of testTopics) {
    console.log(`\n📝 Testing topic: "${topic}"`);
    console.log('=' .repeat(50));
    
    try {
      const startTime = Date.now();
      
      // Generate authentic content
      const result = await service.generateAuthenticContent(topic, {
        targetLength: 1000,
        researchDepth: 'basic',
        includeStatistics: true,
        includeCitations: true
      });
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log(`✅ Generation completed in ${duration}s`);
      console.log(`📊 Research Quality:`);
      console.log(`   - Sources Used: ${result.metadata.sourcesUsed}`);
      console.log(`   - Data Points: ${result.metadata.dataPoints}`);
      console.log(`   - Authenticity: ${result.metadata.authenticity}`);
      console.log(`   - Research Depth: ${result.metadata.researchDepth.overall}%`);
      
      // Analyze content quality
      const wordCount = result.content.split(/\s+/).length;
      const hasNumbers = /\d+/.test(result.content);
      const hasPercentages = /%/.test(result.content);
      const hasCitations = /https?:\/\//.test(result.content);
      
      console.log(`📄 Content Analysis:`);
      console.log(`   - Word Count: ${wordCount}`);
      console.log(`   - Contains Numbers: ${hasNumbers ? '✅' : '❌'}`);
      console.log(`   - Contains Percentages: ${hasPercentages ? '✅' : '❌'}`);
      console.log(`   - Contains Citations: ${hasCitations ? '✅' : '❌'}`);
      
      // Check for generic language
      const genericPhrases = [
        'years of experience',
        'proven strategies',
        'best practices',
        'industry leader',
        'cutting-edge'
      ];
      
      const foundGeneric = genericPhrases.filter(phrase => 
        result.content.toLowerCase().includes(phrase)
      );
      
      console.log(`🚫 Generic Language Check:`);
      if (foundGeneric.length === 0) {
        console.log(`   ✅ No generic phrases found`);
      } else {
        console.log(`   ❌ Found generic phrases: ${foundGeneric.join(', ')}`);
      }
      
      // Show content preview
      const preview = result.content.substring(0, 300) + '...';
      console.log(`\n📖 Content Preview:`);
      console.log(preview);
      
    } catch (error) {
      console.error(`❌ Error generating content for "${topic}":`, error.message);
    }
    
    console.log('\n' + '-'.repeat(50));
  }
  
  console.log('\n🎉 Testing completed!');
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testAuthenticContentGeneration().catch(console.error);
}

export { testAuthenticContentGeneration };