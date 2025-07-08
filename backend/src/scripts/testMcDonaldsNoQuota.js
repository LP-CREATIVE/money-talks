#!/usr/bin/env node

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  const question = await prisma.validationQuestion.findFirst({
    where: {
      text: {
        contains: 'McDonald',
        mode: 'insensitive'
      }
    },
    include: {
      idea: true
    }
  });

  if (!question) {
    console.log('No McDonald\'s question found');
    return;
  }

  console.log('Question:', question.text.substring(0, 80) + '...');
  console.log('Question ID:', question.id);
  console.log('Idea ID:', question.ideaId);
  console.log('Idea Title:', question.idea?.title);
  
  await prisma.$disconnect();
}

test();
