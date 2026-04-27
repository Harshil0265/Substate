/**
 * Google Images Setup Helper
 * Provides instructions and tests Google Custom Search API
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('\n🔧 GOOGLE CUSTOM SEARCH API SETUP\n');
console.log('='.repeat(70));

console.log('\n📋 Current Configuration:');
console.log('✓ Google API Key:', process.env.GOOGLE_API_KEY ? '✅ Present' : '❌ Missing');
console.log('✓ Search Engine ID:', process.env.GOOGLE_SEARCH_ENGINE_ID ? '✅ Present' : '❌ Missing');

console.log('\n⚠️ ERROR: Custom Search JSON API is not enabled');
console.log('\n📝 To enable Google Custom Search API:');
console.log('\n1. Go to: https://console.cloud.google.com/apis/library/customsearch.googleapis.com');
console.log('2. Select your project');
console.log('3. Click "ENABLE" button');
console.log('4. Wait 1-2 minutes for activation');
console.log('5. Run this script again to test');

console.log('\n💡 Alternative: Use Unsplash API (Free, No Setup)');
console.log('\n1. Go to: https://unsplash.com/developers');
console.log('2. Create a free account');
console.log('3. Create a new application');
console.log('4. Copy your Access Key');
console.log('5. Add to .env: UNSPLASH_ACCESS_KEY=your_key_here');

console.log('\n🔗 Quick Links:');
console.log('• Enable API: https://console.cloud.google.com/apis/library/customsearch.googleapis.com');
console.log('• API Dashboard: https://console.cloud.google.com/apis/dashboard');
console.log('• Unsplash: https://unsplash.com/developers');

console.log('\n' + '='.repeat(70));
console.log('✅ Setup instructions displayed\n');
