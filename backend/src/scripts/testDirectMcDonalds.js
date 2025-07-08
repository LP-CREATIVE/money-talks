#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

async function test() {
  const apiKey = process.env.HUNTER_API_KEY;
  
  console.log('Testing Hunter.io directly for McDonald\'s domains...\n');

  const domains = ['us.mcd.com', 'corporate.mcdonalds.com', 'mcdonalds.com'];
  
  for (const domain of domains) {
    try {
      console.log(`Testing ${domain}...`);
      const response = await axios.get('https://api.hunter.io/v2/domain-search', {
        params: {
          domain: domain,
          api_key: apiKey,
          limit: 10
        }
      });
      
      console.log(`  Total results: ${response.data.data.total}`);
      console.log(`  Emails returned: ${response.data.data.emails?.length || 0}`);
      console.log(`  Pattern: ${response.data.data.pattern || 'none'}`);
      
      if (response.data.data.emails?.length > 0) {
        console.log('  First email:', response.data.data.emails[0].value);
      }
      
    } catch (error) {
      console.log(`  Error: ${error.response?.data?.errors?.[0]?.details || error.message}`);
    }
  }
  
  console.log('\nChecking API quota...');
  try {
    const quotaResponse = await axios.get('https://api.hunter.io/v2/account', {
      params: { api_key: apiKey }
    });
    
    const data = quotaResponse.data.data;
    console.log(`Searches used: ${data.requests.searches.used}/${data.requests.searches.available}`);
  } catch (error) {
    console.log('Could not check quota');
  }
}

test();
