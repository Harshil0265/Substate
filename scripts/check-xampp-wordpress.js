/**
 * Check XAMPP WordPress Connection
 */

import axios from 'axios';

async function checkXAMPPWordPress() {
  try {
    console.log('\n🔍 CHECKING XAMPP WORDPRESS CONNECTION\n');
    console.log('='.repeat(70));

    const siteUrl = 'http://localhost/wordpress';
    
    console.log(`📍 Checking: ${siteUrl}\n`);

    // Check if WordPress site is accessible
    try {
      const siteResponse = await axios.get(siteUrl, { timeout: 5000 });
      console.log('✅ WordPress site is accessible');
      console.log(`   Status: ${siteResponse.status}`);
    } catch (error) {
      console.log('❌ WordPress site is NOT accessible');
      console.log(`   Error: ${error.message}`);
      console.log('\n💡 Make sure:');
      console.log('   1. XAMPP is running (Apache and MySQL)');
      console.log('   2. WordPress is installed at: C:\\xampp\\htdocs\\wordpress');
      console.log('   3. You can access it in browser: http://localhost/wordpress\n');
      return;
    }

    // Check REST API
    try {
      const apiUrl = `${siteUrl}/wp-json/wp/v2`;
      const apiResponse = await axios.get(apiUrl, { timeout: 5000 });
      console.log('✅ WordPress REST API is accessible');
      console.log(`   Status: ${apiResponse.status}`);
    } catch (error) {
      console.log('❌ WordPress REST API is NOT accessible');
      console.log(`   Error: ${error.message}`);
      console.log('\n💡 REST API might be disabled. Check WordPress settings.\n');
      return;
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ XAMPP WORDPRESS IS READY');
    console.log('='.repeat(70));
    console.log('\n📝 Next steps:');
    console.log('   1. Go to WordPress Admin: http://localhost/wordpress/wp-admin');
    console.log('   2. Login with your admin credentials');
    console.log('   3. Go to Users > Your Profile');
    console.log('   4. Scroll to "Application Passwords"');
    console.log('   5. Create a new application password');
    console.log('   6. Use it in the delete-test-category.js script\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

console.log('🚀 Starting XAMPP WordPress Check...\n');
checkXAMPPWordPress()
  .then(() => {
    console.log('✅ Check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
