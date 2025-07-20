const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateEscrow() {
  // First, let's see what questions exist
  const questions = await prisma.validationQuestion.findMany({
    include: {
      idea: {
        include: {
          contributions: true
        }
      },
      answers: true
    }
  });
  
  console.log(`Found ${questions.length} questions\n`);
  
  for (const question of questions) {
    // Calculate escrow based on total contributions
    const totalContributions = question.idea.contributions.reduce((sum, c) => sum + c.amount, 0);
    const questionCount = await prisma.validationQuestion.count({
      where: { ideaId: question.ideaId }
    });
    
    const escrowPerQuestion = questionCount > 0 ? totalContributions / questionCount : 0;
    
    console.log(`Question: ${question.text.substring(0, 50)}...`);
    console.log(`Total contributions for idea: $${totalContributions}`);
    console.log(`Questions for this idea: ${questionCount}`);
    console.log(`Escrow per question: $${escrowPerQuestion}`);
    console.log(`Has answers: ${question.answers.length > 0 ? 'Yes' : 'No'}\n`);
    
    // Update the question with escrow amount
    await prisma.validationQuestion.update({
      where: { id: question.id },
      data: {
        escrowAmount: escrowPerQuestion
      }
    });
  }
  
  // Now let's process existing answers to calculate veracity scores
  const answersWithoutScores = await prisma.userAnswer.findMany({
    where: {
      veracityScore: null,
      question: {
        escrowAmount: { gt: 0 }
      }
    }
  });
  
  console.log(`\nFound ${answersWithoutScores.length} answers without veracity scores`);
  console.log('These answers need to be processed through the payment system');
  
  await prisma.$disconnect();
}

updateEscrow();
