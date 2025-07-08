#!/usr/bin/env node

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const matchingService = require('../services/matchingService');

const prisma = new PrismaClient();

async function test() {
  const question = await prisma.validationQuestion.findFirst({
    where: {
      text: {
        contains: 'McDonald',
        mode: 'insensitive'
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  if (!question) {
    console.log('No McDonalds question found');
    return;
  }

  console.log('Found question:', question.text.substring(0, 100) + '...');
  console.log('Question ID:', question.id);

  console.log('\nTesting matching service...');
  const results = await matchingService.findMatchingExperts(question.id);
  
  console.log('\nResults:');
  console.log('   Entities extracted:', JSON.stringify(results.entities, null, 2));
  console.log('   Internal experts:', results.internalMatches.length);
  console.log('   External experts (Hunter.io):', results.externalExperts?.length || 0);
  console.log('   Hunter API used:', results.hunterApiUsed || false);

  await prisma.$disconnect();
}

test().catch(console.error);
