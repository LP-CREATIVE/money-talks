#!/usr/bin/env node
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const commands = {
  // List all philosophies
  list: async (category = null) => {
    const where = category ? { category: category.toUpperCase() } : {};
    const philosophies = await prisma.aIPhilosophy.findMany({ 
      where,
      orderBy: { weight: 'desc' } 
    });
    
    console.log('\n=== AI PHILOSOPHIES ===');
    philosophies.forEach(p => {
      console.log(`\nID: ${p.id}`);
      console.log(`Name: ${p.name}`);
      console.log(`Category: ${p.category}`);
      console.log(`Weight: ${p.weight}`);
      console.log(`Active: ${p.active}`);
      console.log(`Content: ${p.content.substring(0, 100)}...`);
      console.log('---');
    });
  },

  // Add new philosophy
  add: async () => {
    const philosophy = {};
    
    philosophy.name = await prompt('Philosophy name: ');
    philosophy.category = (await prompt('Category (GENERAL/SCORING/QUESTIONS/IDEAS): ')).toUpperCase();
    philosophy.content = await prompt('Content (paste philosophy, then enter "END" on new line):\n');
    
    // Multi-line input
    let content = '';
    while (true) {
      const line = await prompt('');
      if (line === 'END') break;
      content += line + '\n';
    }
    philosophy.content = content.trim();
    
    philosophy.weight = parseFloat(await prompt('Weight (0-1, default 1.0): ') || '1.0');
    
    const created = await prisma.aIPhilosophy.create({ data: philosophy });
    console.log('\n✅ Philosophy created:', created.id);
  },

  // Edit philosophy
  edit: async (id) => {
    const philosophy = await prisma.aIPhilosophy.findUnique({ where: { id } });
    if (!philosophy) {
      console.log('Philosophy not found');
      return;
    }

    console.log('\nCurrent content:');
    console.log(philosophy.content);
    console.log('\nEnter new content (enter "END" on new line to finish):');
    
    let content = '';
    while (true) {
      const line = await prompt('');
      if (line === 'END') break;
      content += line + '\n';
    }
    
    const updated = await prisma.aIPhilosophy.update({
      where: { id },
      data: { 
        content: content.trim(),
        version: { increment: 1 }
      }
    });
    
    console.log('\n✅ Philosophy updated');
  },

  // Toggle active status
  toggle: async (id) => {
    const philosophy = await prisma.aIPhilosophy.findUnique({ where: { id } });
    if (!philosophy) {
      console.log('Philosophy not found');
      return;
    }

    const updated = await prisma.aIPhilosophy.update({
      where: { id },
      data: { active: !philosophy.active }
    });
    
    console.log(`\n✅ Philosophy ${updated.active ? 'activated' : 'deactivated'}`);
  },

  // Delete philosophy
  delete: async (id) => {
    const confirm = await prompt('Are you sure? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') return;
    
    await prisma.aIPhilosophy.delete({ where: { id } });
    console.log('\n✅ Philosophy deleted');
  },

  // Show full philosophy
  show: async (id) => {
    const philosophy = await prisma.aIPhilosophy.findUnique({ where: { id } });
    if (!philosophy) {
      console.log('Philosophy not found');
      return;
    }

    console.log('\n=== PHILOSOPHY DETAILS ===');
    console.log(`Name: ${philosophy.name}`);
    console.log(`Category: ${philosophy.category}`);
    console.log(`Weight: ${philosophy.weight}`);
    console.log(`Active: ${philosophy.active}`);
    console.log(`Version: ${philosophy.version}`);
    console.log(`\nContent:\n${philosophy.content}`);
  },

  // Test philosophy on sample
  test: async (id) => {
    const philosophy = await prisma.aIPhilosophy.findUnique({ where: { id } });
    if (!philosophy) {
      console.log('Philosophy not found');
      return;
    }

    const testQuestion = await prompt('Enter test question: ');
    const testAnswer = await prompt('Enter test answer: ');
    
    // This would call your AI service with this philosophy
    console.log('\n=== TEST RESULT ===');
    console.log('Philosophy applied:', philosophy.name);
    console.log('Would analyze with this philosophy...');
    // Add actual AI call here
  }
};

function prompt(question) {
  return new Promise(resolve => rl.question(question, resolve));
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const param = args[1];

  if (!command || !commands[command]) {
    console.log(`
Money Talks AI Philosophy Manager

Usage:
  node manage-philosophy.js <command> [options]

Commands:
  list [category]     List all philosophies (optionally filtered by category)
  add                 Add new philosophy
  edit <id>          Edit philosophy content
  toggle <id>        Toggle active status
  delete <id>        Delete philosophy
  show <id>          Show full philosophy
  test <id>          Test philosophy on sample

Categories:
  GENERAL    Core investment principles
  SCORING    Answer scoring criteria
  QUESTIONS  Question generation rules
  IDEAS      Daily idea generation

Examples:
  node manage-philosophy.js list
  node manage-philosophy.js list SCORING
  node manage-philosophy.js add
  node manage-philosophy.js edit cuid123
  node manage-philosophy.js show cuid123
    `);
    process.exit(0);
  }

  try {
    await commands[command](param);
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

main();
