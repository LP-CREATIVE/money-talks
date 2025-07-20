require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkIdeas() {
  try {
    const ideas = await prisma.institutionalIdea.findMany({
      include: {
        createdBy: true,
        contributions: true,
        questions: true
      }
    });
    
    console.log(`Found ${ideas.length} ideas:`);
    ideas.forEach(idea => {
      console.log(`\n- ${idea.title}`);
      console.log(`  Status: ${idea.status}`);
      console.log(`  Created by: ${idea.createdBy?.email || 'Unknown'}`);
      console.log(`  Contributions: ${idea.contributions.length}`);
      console.log(`  Questions: ${idea.questions.length}`);
      console.log(`  Total Escrow: $${idea.totalEscrow}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIdeas();
