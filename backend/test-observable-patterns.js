const axios = require('axios');

async function testObservablePatterns() {
  try {
    // First login as expert
    const loginRes = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'expert@test.com',
      password: 'test123'
    });
    
    const token = loginRes.data.token;
    console.log('✅ Logged in successfully');
    
    // Test getting patterns
    const patternsRes = await axios.get('http://localhost:3001/api/expert/observable/patterns', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('✅ Observable patterns endpoint working');
    console.log('Categories available:', Object.keys(patternsRes.data.categories));
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testObservablePatterns();
