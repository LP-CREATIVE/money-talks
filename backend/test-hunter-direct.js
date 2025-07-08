const axios = require('axios');

async function testHunter() {
  const apiKey = process.env.HUNTER_API_KEY;
  console.log('API Key exists:', !!apiKey);
  
  try {
    console.log('Testing nike.com...');
    const response = await axios.get('https://api.hunter.io/v2/domain-search', {
      params: {
        domain: 'nike.com',
        api_key: apiKey,
        limit: 10
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Emails found:', response.data.data.emails?.length || 0);
    
    if (response.data.data.emails?.length > 0) {
      console.log('First email:', response.data.data.emails[0]);
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testHunter();
