const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  try {
    console.log('Migrating existing PaymentTransaction records...');
    
    const transactions = await prisma.paymentTransaction.findMany({
      include: {
        answer: {
          include: {
            question: true
          }
        }
      }
    });
    
    console.log(`Found ${transactions.length} transactions to update`);
    
    for (const transaction of transactions) {
      if (transaction.answer && transaction.answer.question) {
        await prisma.$executeRaw`
          UPDATE "PaymentTransaction" 
          SET "questionId" = ${transaction.answer.question.id},
              "platformFee" = ${transaction.platformAmount || 0}
          WHERE "id" = ${transaction.id}
        `;
        console.log(`Updated transaction ${transaction.id}`);
      }
    }
    
    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
