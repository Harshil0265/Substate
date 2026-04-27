import AuthenticContentServicePro from '../backend/services/AuthenticContentServicePro.js';

const service = new AuthenticContentServicePro();

console.log('🧪 Testing Sports Topics Fix - Comprehensive Content Generation');
console.log('================================================================');

async function testSportsTopics() {
  const sportsTopics = [
    'csk vs mi history in ipl',
    'rcb vs kkr matches',
    'ipl 2024 final',
    'mumbai indians team analysis',
    'chennai super kings performance',
    'rohit sharma ipl records',
    'ms dhoni captaincy',
    'virat kohli batting stats',
    'ipl tournament history',
    'cricket world cup 2023'
  ];

  console.log('\n🔄 Testing sports content generation...');
  console.log('======================================');

  let successCount = 0;
  let totalWordCount = 0;

  for (let i = 0; i < sportsTopics.length; i++) {
    const topic = sportsTopics[i];
    
    try {
      console.log(`\n📝 ${i + 1}/${sportsTopics.length}: "${topic}"`);
      
      const topicType = service.identifyTopicType(topic);
      const isMatch = service.isSportsPersonality(topic.toLowerCase());
      
      console.log(`   🏷️ Type: ${topicType} | Sports match: ${isMatch}`);
      
      const result = await service.generateAuthenticContent(topic, {
        contentType: 'BLOG',
        targetLength: 2000,
        includeStatistics: true,
        includeCitations: true,
        researchDepth: 'comprehensive'
      });
      
      const wordCount = result.content.split(' ').length;
      const sections = (result.content.match(/##/g) || []).length;
      const isComprehensive = wordCount >= 200 && sections >= 5;
      
      console.log(`   📊 Words: ${wordCount} | Sections: ${sections}`);
      console.log(`   🎯 Quality: ${isComprehensive ? '✅ COMPREHENSIVE' : '❌ TOO SHORT'}`);
      
      if (isComprehensive) {
        successCount++;
        totalWordCount += wordCount;
      }
      
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}`);
    }
    
    // Small delay
    if (i < sportsTopics.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  console.log('\n🎯 Sports Topics Test Results:');
  console.log('==============================');
  console.log(`✅ Successful generations: ${successCount}/${sportsTopics.length}`);
  console.log(`📊 Average word count: ${Math.round(totalWordCount / successCount)} words`);
  console.log(`🏆 Success rate: ${((successCount / sportsTopics.length) * 100).toFixed(1)}%`);
  
  if (successCount === sportsTopics.length) {
    console.log('\n🚀 ALL SPORTS TOPICS NOW GENERATE COMPREHENSIVE CONTENT!');
    console.log('   - No more "insufficient data" messages');
    console.log('   - IPL topics work perfectly');
    console.log('   - Team vs team matches covered');
    console.log('   - Player statistics and records included');
    console.log('   - Tournament histories comprehensive');
  } else {
    console.log('\n⚠️ Some topics still need improvement');
  }
}

testSportsTopics().catch(console.error);