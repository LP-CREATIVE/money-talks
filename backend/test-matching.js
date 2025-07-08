const prisma = require('./src/utils/prisma');
const matchingService = require('./src/services/matchingService');

async function test() {
  const questions = await prisma.validationQuestion.findMany({
    where: { ideaId: 'cmctdx9h90001li5cvd0kt3wv' },
    orderBy: { createdAt: 'desc' },
    take: 1
  });
  
  if (questions.length === 0) {
    console.log('No questions found for this idea');
    await prisma.$disconnect();
    return;
  }

  console.log('Testing question:', questions[0].id);
  console.log('Question text:', questions[0].text);
  
  const results = await matchingService.findMatchingExperts(questions[0].id);
  
  console.log('\nResults:');
  console.log('- Companies extracted:', results.entities.companies);
  console.log('- External experts found:', results.externalExperts.length);
  
  if (results.externalExperts.length > 0) {
    console.log('\nFirst expert:', results.externalExperts[0]);
  }
  
  await prisma.$disconnect();
}

test().catch(console.error);
