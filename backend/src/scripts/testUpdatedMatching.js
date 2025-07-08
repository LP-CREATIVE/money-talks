#!/usr/bin/env node

require('dotenv').config();
const matchingService = require('../services/matchingService');

async function test() {
  // Use your test question ID
  const questionId = 'cmcrxr96b000cli6wws07vjf3';
  
  console.log('🧪 Testing updated matching service...\n');
  
  try {
    const results = await matchingService.findMatchingExperts(questionId);
    
    console.log(`✅ Question: ${results.question.text.substring(0, 80)}...\n`);
    
    console.log(`📊 Results:`);
    console.log(`   Internal Experts: ${results.internalMatches.length}`);
    console.log(`   External Experts (Hunter.io): ${results.externalExperts.length}`);
    console.log(`   LinkedIn Profiles: ${results.linkedInProfiles.length}`);
    console.log(`   Escrow Available: $${results.escrowAvailable}`);
    
    if (results.externalExperts.length > 0) {
      console.log(`\n🏆 Top External Experts from Hunter.io:`);
      results.externalExperts.slice(0, 3).forEach(expert => {
        console.log(`\n   ${expert.name} - ${expert.currentRole} at ${expert.currentEmployer}`);
        console.log(`   📧 ${expert.email} (${expert.emailConfidence}% confidence)`);
        console.log(`   💯 Match Score: ${expert.totalScore}`);
        console.log(`   💰 Estimated Cost: $${expert.estimatedCost}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

test();
