/**
 * Instructions to Create New Unrestricted API Key
 */

console.log('\n🔧 CREATE NEW UNRESTRICTED API KEY\n');
console.log('='.repeat(70));

console.log('\n📝 Follow these steps:\n');

console.log('1. Go to: https://console.cloud.google.com/apis/credentials?project=substate-494614\n');

console.log('2. Click "CREATE CREDENTIALS" button (blue button at top)\n');

console.log('3. Select "API key"\n');

console.log('4. A popup will show your new API key - COPY IT\n');

console.log('5. Click "CLOSE" (don\'t click "RESTRICT KEY" yet)\n');

console.log('6. Open your .env file\n');

console.log('7. Replace the GOOGLE_API_KEY line with your new key:\n');
console.log('   GOOGLE_API_KEY=your_new_key_here\n');

console.log('8. Save the .env file\n');

console.log('9. Run this command to test:\n');
console.log('   node scripts/diagnose-google-api.js\n');

console.log('='.repeat(70));
console.log('\n💡 TIP: New unrestricted keys work immediately!\n');
console.log('You can add restrictions later after confirming it works.\n');
