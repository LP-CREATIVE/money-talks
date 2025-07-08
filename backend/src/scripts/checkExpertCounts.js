#!/usr/bin/env node

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkExperts() {
  // Count internal experts (ExpertProfile)
  const internalExperts = await prisma.expertProfile.count();
  const verifiedExperts = await prisma.expertProfile.count({
    where: { employerVerified: true }
  });
  
  // Count external expert leads
  const externalExperts = await prisma.expertLead.count();
  const pendingExperts = await prisma.expertLead.count({
    where: { status: 'PENDING_OUTREACH' }
  });
  const highConfidenceExperts = await prisma.expertLead.count({
    where: { emailConfidence: { gte: 80 } }
  });
  
  console.log('\n📊 Expert Database Summary:');
  console.log('\n🏢 Internal Experts (ExpertProfile):');
  console.log(`   Total: ${internalExperts}`);
  console.log(`   Verified: ${verifiedExperts}`);
  
  console.log('\n📧 External Expert Leads (ExpertLead):');
  console.log(`   Total: ${externalExperts}`);
  console.log(`   Pending Outreach: ${pendingExperts}`);
  console.log(`   High Confidence Emails (80%+): ${highConfidenceExperts}`);
  
  // Show some sample data
  if (externalExperts > 0) {
    const samples = await prisma.expertLead.findMany({
      take: 3,
      where: { emailConfidence: { gte: 80 } },
      orderBy: { emailConfidence: 'desc' }
    });
    
    console.log('\n📋 Sample External Experts:');
    samples.forEach(expert => {
      console.log(`   ${expert.firstName} ${expert.lastName} - ${expert.title} at ${expert.company}`);
      console.log(`   Email: ${expert.email} (${expert.emailConfidence}% confidence)\n`);
    });
  }
  
  await prisma.$disconnect();
}

checkExperts().catch(console.error);
