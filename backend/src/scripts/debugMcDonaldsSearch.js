#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');

class TestMatcher {
  async searchHunterDirect() {
    const apiKey = process.env.HUNTER_API_KEY;
    console.log('Testing direct Hunter.io search for McDonald\'s...\n');
    
    try {
      const response = await axios.get('https://api.hunter.io/v2/domain-search', {
        params: {
          domain: 'us.mcd.com',
          api_key: apiKey,
          department: 'operations',
          seniority: 'senior,executive',
          limit: 10
        }
      });

      console.log('Response status:', response.status);
      console.log('Emails found:', response.data.data.emails?.length || 0);
      
      if (response.data.data.emails?.length > 0) {
        console.log('\nEmails:');
        response.data.data.emails.forEach(email => {
          console.log(`  ${email.first_name} ${email.last_name} - ${email.position}`);
          console.log(`  ${email.value} (${email.confidence}%)`);
          console.log(`  Department: ${email.department}, Seniority: ${email.seniority}\n`);
        });
      }
    } catch (error) {
      console.error('Error:', error.response?.data || error.message);
    }
  }

  getAllPossibleDomains(company) {
    const cleaned = company.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const knownMappings = {
      'mcdonalds': ['us.mcd.com', 'corporate.mcdonalds.com', 'mcdonalds.com']
    };
    
    if (knownMappings[cleaned]) {
      return knownMappings[cleaned];
    }
    
    return [`${cleaned}.com`];
  }
}

async function test() {
  const tester = new TestMatcher();
  
  console.log('1. Testing getAllPossibleDomains for "McDonald\'s":');
  const domains = tester.getAllPossibleDomains("McDonald's");
  console.log('   Domains:', domains);
  
  console.log('\n2. Testing direct Hunter.io API:');
  await tester.searchHunterDirect();
}

test();
