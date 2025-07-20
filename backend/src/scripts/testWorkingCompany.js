#!/usr/bin/env node

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const matchingService = require('../services/matchingService');

const prisma = new PrismaClient();

async function test() {
  const testQuestion = await prisma.validationQuestion.create({
    data: {
      text: "How is Microsoft's Azure cloud division performing against AWS in enterprise market share?",
      ideaId: 'cmcqgnpx60005li6wy8oj8ouu',
      escrowAmount: 500
    }
  });

  console.log('Testing with Microsoft question...');
  console.log('Question ID:', testQuestion.id);

  const results = await matchingService.findMatchingExperts(testQuestion.id);
  
  console.log('\nResults:');
  console.log('   External experts (Hunter.io):', results.externalExperts?.length || 0);
  
  if (results.externalExperts?.length > 0) {
    console.log('\nSample experts:');
    results.externalExperts.slice(0, 3).forEach(expert => {
      console.log(`   ${expert.name} - ${expert.currentRole}`);
      console.log(`   ${expert.email}`);
    });
  }

  await prisma.validationQuestion.delete({ where: { id: testQuestion.id } });
  await prisma.$disconnect();
}

test().catch(console.error);
