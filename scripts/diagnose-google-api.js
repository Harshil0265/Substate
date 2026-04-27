/**
 * Diagnose Google Custom Search API Issues
 */

import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

async function diagnoseGoogleAPI() {
  console.log('\n🔍 DIAGNOSING GOOGLE CUSTOM SEARCH API\n');
  console.log('='.repeat(70));

  const apiKey = process.env.GOOGLE_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  console.log('\n📋 Configuration:');
  console.log('API Key:', apiKey);
  console.log('Search Engine ID:', searchEngineId);

  if (!apiKey || !searchEngineId) {
    console.log('\n❌ Missing credentials!');
    return;
  }

  console.log('\n🧪 Testing API with direct request...\n');

  try {
    const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
      params: {
        key: apiKey,
        cx: searchEngineId,
        q: 'test',
        searchType: 'image',
        num: 1
      },
      timeout: 10000
    });

    console.log('✅ SUCCESS! API is working!');
    console.log('Response status:', response.status);
    console.log('Images found:', response.data?.items?.length || 0);

  } catch (error) {
    console.log('❌ API ERROR!\n');
    console.log('Status:', error.response?.status);
    console.log('Error:', error.response?.data?.error);

    if (error.response?.status === 403) {
      const errorMsg = error.response.data?.error?.message || '';
      
      console.log('\n' + '='.repeat(70));
      console.log('🔧 DIAGNOSIS & FIX');
      console.log('='.repeat(70));

      if (errorMsg.includes('does not have the access')) {
        console.log('\n❌ PROBLEM: API is not enabled for this API key');
        console.log('\n✅ SOLUTION:');
        console.log('\n1. Go to: https://console.cloud.google.com/apis/credentials');
        console.log('\n2. Find your API key: "Substate"');
        console.log('\n3. Click on it to edit');
        console.log('\n4. Under "API restrictions":');
        console.log('   - If "Restrict key" is selected:');
        console.log('     → Click "Add an API"');
        console.log('     → Search for "Custom Search API"');
        console.log('     → Select it and Save');
        console.log('\n   - OR change to "Don\'t restrict key" (less secure but easier)');
        console.log('\n5. Click SAVE');
        console.log('\n6. Wait 1-2 minutes for changes to take effect');
        console.log('\n7. Run this script again to test');

      } else if (errorMsg.includes('API key not valid')) {
        console.log('\n❌ PROBLEM: API key is invalid or from wrong project');
        console.log('\n✅ SOLUTION:');
        console.log('\n1. Go to: https://console.cloud.google.com/apis/credentials?project=substate-494614');
        console.log('\n2. Click "CREATE CREDENTIALS" → "API key"');
        console.log('\n3. Copy the new API key');
        console.log('\n4. Update .env file: GOOGLE_API_KEY=new_key_here');
        console.log('\n5. Run this script again');
      }

    } else if (error.response?.status === 400) {
      console.log('\n❌ PROBLEM: Invalid Search Engine ID');
      console.log('\n✅ SOLUTION:');
      console.log('\n1. Go to: https://programmablesearchengine.google.com/controlpanel/all');
      console.log('\n2. Find your search engine or create a new one');
      console.log('\n3. Click on it');
      console.log('\n4. Copy the "Search engine ID"');
      console.log('\n5. Update .env file: GOOGLE_SEARCH_ENGINE_ID=your_id_here');
    }

    console.log('\n' + '='.repeat(70));
  }

  console.log('\n');
}

diagnoseGoogleAPI();
