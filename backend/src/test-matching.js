require('dotenv').config();
const nlpService = require('./services/nlpService');

async function testNLPExtraction() {
  console.log('Testing NLP Entity Extraction...\n');
  
  const testQuestions = [
    "What is Tesla's battery cost per kWh outlook for 2025 given current supplier dynamics in China?",
    "How is Amazon's AWS pricing strategy affecting enterprise cloud adoption in Europe?",
    "What are the supply chain challenges facing Apple's iPhone production in India?"
  ];

  for (const question of testQuestions) {
    console.log(`Question: "${question}"`);
    try {
      const entities = await nlpService.extractQuestionEntities(question);
      console.log('Extracted entities:', JSON.stringify(entities, null, 2));
      console.log('\n' + '='.repeat(80) + '\n');
    } catch (error) {
      console.error('Error:', error.message);
      console.log('(Make sure to add your OpenAI API key to .env)\n');
    }
  }
}

// Test matching service with a mock question ID
async function testMatchingService() {
  const matchingService = require('./services/matchingService');
  
  console.log('Testing Matching Service...\n');
  
  // You'll need to replace this with a real question ID from your database
  const testQuestionId = 'your-test-question-id'; 
  
  try {
    // Uncomment this when you have a real question ID:
    // const results = await matchingService.findMatchingExperts(testQuestionId);
    // console.log('Matching results:', JSON.stringify(results, null, 2));
    
    console.log('To test matching, you need a valid question ID from your database.');
    console.log('The service is ready to use via the API endpoints.');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run tests
(async () => {
  await testNLPExtraction();
  // await testMatchingService();
  process.exit(0);
})();
