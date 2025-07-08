#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

async function testHunter() {
  const apiKey = process.env.HUNTER_API_KEY;
  
  if (!apiKey) {
    console.log('No Hunter.io API key found in .env');
    return;
  }

  console.log('Testing Hunter.io API directly...\n');

  try {
    console.log('1. Searching mcdonalds.com...');
    const response1 = await axios.get('https://api.hunter.io/v2/domain-search', {
      params: {
        domain: 'mcdonalds.com',
        api_key: apiKey,
        limit: 5
      }
    });
    console.log('   Results:', response1.data.data.emails?.length || 0, 'emails found');

    console.log('\n2. Searching corporate.mcdonalds.com...');
    const response2 = await axios.get('https://api.hunter.io/v2/domain-search', {
      params: {
        domain: 'corporate.mcdonalds.com',
        api_key: apiKey,
        limit: 5
      }
    });
    console.log('   Results:', response2.data.data.emails?.length || 0, 'emails found');

    console.log('\n3. Searching us.mcd.com...');
    const response3 = await axios.get('https://api.hunter.io/v2/domain-search', {
      params: {
        domain: 'us.mcd.com',
        api_key: apiKey,
        limit: 5
      }
    });
    console.log('   Results:', response3.data.data.emails?.length || 0, 'emails found');

    console.log('\n4. Testing with a known domain (microsoft.com)...');
    const response4 = await axios.get('https://api.hunter.io/v2/domain-search', {
      params: {
        domain: 'microsoft.com',
        api_key: apiKey,
        department: 'executive',
        limit: 5
      }
    });
    console.log('   Results:', response4.data.data.emails?.length || 0, 'emails found');
    
    if (response4.data.data.emails?.length > 0) {
      console.log('\n   Sample Microsoft results:');
      response4.data.data.emails.slice(0, 2).forEach(email => {
        console.log(`   - ${email.first_name} ${email.last_name}: ${email.position}`);
      });
    }

  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testHunter();
