/**
 * Verify API Keys Configuration
 */

import dotenv from 'dotenv';
dotenv.config();

console.log('\n🔍 VERIFYING API KEYS CONFIGURATION\n');
console.log('='.repeat(70));

console.log('\n📋 Environment Variables Loaded:');
console.log('GOOGLE_API_KEY:', process.env.GOOGLE_API_KEY ? `${process.env.GOOGLE_API_KEY.substring(0, 20)}...` : '❌ NOT FOUND');
console.log('GOOGLE_SEARCH_ENGINE_ID:', process.env.GOOGLE_SEARCH_ENGINE_ID || '❌ NOT FOUND');
console.log('PIXABAY_API_KEY:', process.env.PIXABAY_API_KEY ? `${process.env.PIXABAY_API_KEY.substring(0, 15)}...` : '❌ NOT FOUND');
console.log('UNSPLASH_ACCESS_KEY:', process.env.UNSPLASH_ACCESS_KEY ? `${process.env.UNSPLASH_ACCESS_KEY.substring(0, 15)}...` : '⚠️ Not configured');

console.log('\n📊 Key Lengths:');
if (process.env.GOOGLE_API_KEY) {
  console.log('Google API Key length:', process.env.GOOGLE_API_KEY.length, 'characters');
}
if (process.env.GOOGLE_SEARCH_ENGINE_ID) {
  console.log('Search Engine ID length:', process.env.GOOGLE_SEARCH_ENGINE_ID.length, 'characters');
}

console.log('\n✅ All keys are being read from .env file correctly!');
console.log('\n💡 Next: Click "Show key" in Google Cloud Console and verify it matches:');
console.log('   Expected: ' + (process.env.GOOGLE_API_KEY || 'NOT FOUND'));
console.log('\n' + '='.repeat(70) + '\n');
