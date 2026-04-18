import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const testOpenAI = async () => {
  console.log('🤖 Testing OpenAI API Integration');
  console.log('=================================');
  
  // Check if API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.log('❌ OPENAI_API_KEY not found in environment variables');
    console.log('\n📋 Steps to get OpenAI API key:');
    console.log('1. Go to https://platform.openai.com/api-keys');
    console.log('2. Create new secret key');
    console.log('3. Copy the key and add it to your .env file');
    return;
  }
  
  if (process.env.OPENAI_API_KEY === 'your-openai-api-key-here' || 
      process.env.OPENAI_API_KEY === 'your-openai-api-key') {
    console.log('⚠️  You are still using the placeholder OpenAI API key');
    console.log('   Please replace it with your actual API key from OpenAI');
    return;
  }
  
  console.log('✅ OpenAI API key is configured');
  console.log(`   Key format: ${process.env.OPENAI_API_KEY.substring(0, 7)}...${process.env.OPENAI_API_KEY.slice(-4)}`);
  
  try {
    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    console.log('\n🔄 Testing API connection...');
    
    // Test with a simple completion
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Respond with exactly 'API test successful!' and nothing else."
        },
        {
          role: "user",
          content: "Test message"
        }
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 10,
      temperature: 0
    });
    
    const response = completion.choices[0].message.content.trim();
    console.log('✅ OpenAI API connection successful!');
    console.log(`   Response: "${response}"`);
    console.log(`   Model used: ${completion.model}`);
    console.log(`   Tokens used: ${completion.usage.total_tokens}`);
    
    // Test account info
    console.log('\n🔄 Checking account status...');
    
    // Note: Account info requires different endpoint, we'll just confirm the API works
    console.log('✅ API key is valid and working');
    
    console.log('\n💡 Usage Tips:');
    console.log('- Monitor your usage at https://platform.openai.com/usage');
    console.log('- Set billing limits to control costs');
    console.log('- Use gpt-3.5-turbo for cost-effective content generation');
    console.log('- Use gpt-4 for higher quality but more expensive results');
    
    console.log('\n🎉 OpenAI integration is ready to use!');
    
  } catch (error) {
    console.log('\n❌ OpenAI API test failed:');
    
    if (error.status === 401) {
      console.log('   Invalid API key - check your key is correct');
    } else if (error.status === 429) {
      console.log('   Rate limit exceeded - wait a moment and try again');
    } else if (error.status === 402) {
      console.log('   Billing issue - check your payment method');
    } else {
      console.log(`   Error: ${error.message}`);
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Verify your API key at https://platform.openai.com/api-keys');
    console.log('2. Check billing at https://platform.openai.com/account/billing');
    console.log('3. Ensure you have credits/payment method set up');
  }
};

testOpenAI();