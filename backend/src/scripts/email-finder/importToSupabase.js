#!/usr/bin/env node

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const prisma = new PrismaClient();

async function importCSVToSupabase(csvFile) {
  console.log(`\n📥 Importing ${csvFile} to Supabase...\n`);
  
  const results = [];
  let imported = 0;
  let skipped = 0;
  let errors = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvFile)
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', async () => {
        console.log(`📊 Found ${results.length} experts in CSV\n`);
        
        for (const expert of results) {
          try {
            // Skip if no email
            if (!expert.email) {
              console.log(`⚠️  Skipping ${expert.firstName} ${expert.lastName} - no email`);
              skipped++;
              continue;
            }

            // Check if expert already exists
            const existing = await prisma.expertLead.findUnique({
              where: { email: expert.email }
            });

            if (existing) {
              // Update if we have better confidence
              const newConfidence = parseInt(expert.confidence) || 0;
              const oldConfidence = existing.emailConfidence || 0;
              
              if (newConfidence > oldConfidence) {
                await prisma.expertLead.update({
                  where: { id: existing.id },
                  data: {
                    emailConfidence: newConfidence,
                    title: expert.title || existing.title,
                    department: expert.department || existing.department,
                    seniority: expert.seniority || existing.seniority,
                    updatedAt: new Date()
                  }
                });
                console.log(`📝 Updated: ${expert.email} (confidence: ${oldConfidence} → ${newConfidence})`);
              } else {
                console.log(`⏭️  Skipped: ${expert.email} (already exists)`);
              }
              skipped++;
            } else {
              // Create new expert
              await prisma.expertLead.create({
                data: {
                  firstName: expert.firstName || 'Unknown',
                  lastName: expert.lastName || 'Unknown',
                  email: expert.email,
                  emailConfidence: parseInt(expert.confidence) || 0,
                  emailSource: expert.source || 'hunter.io',
                  title: expert.title || null,
                  company: expert.company || null,
                  department: expert.department || null,
                  seniority: expert.seniority || null,
                  linkedinUrl: expert.linkedinUrl || null,
                  status: 'PENDING_OUTREACH'
                }
              });
              console.log(`✅ Imported: ${expert.email} - ${expert.title} at ${expert.company}`);
              imported++;
            }
          } catch (error) {
            console.error(`❌ Error with ${expert.email}:`, error.message);
            errors++;
          }
        }
        
        console.log(`\n📊 Import Summary:`);
        console.log(`   ✅ Imported: ${imported}`);
        console.log(`   ⏭️  Skipped: ${skipped}`);
        console.log(`   ❌ Errors: ${errors}`);
        console.log(`   📁 Total: ${results.length}`);
        
        resolve();
      })
      .on('error', reject);
  });
}

async function importAllResults() {
  const resultsDir = path.join('data', 'results');
  
  try {
    const files = fs.readdirSync(resultsDir)
      .filter(f => f.endsWith('.csv'))
      .map(f => path.join(resultsDir, f));
    
    console.log(`\n🔍 Found ${files.length} CSV files to import`);
    
    for (const file of files) {
      await importCSVToSupabase(file);
    }
    
    // Show total experts in database
    const totalExperts = await prisma.expertLead.count();
    console.log(`\n🎯 Total experts in database: ${totalExperts}`);
    
  } catch (error) {
    console.error('Error reading directory:', error);
  }
}

async function showStats() {
  console.log('\n📊 Database Statistics:');
  
  const total = await prisma.expertLead.count();
  const byCompany = await prisma.expertLead.groupBy({
    by: ['company'],
    _count: true,
    orderBy: { _count: { company: 'desc' } },
    take: 10
  });
  
  const bySource = await prisma.expertLead.groupBy({
    by: ['emailSource'],
    _count: true
  });
  
  const byStatus = await prisma.expertLead.groupBy({
    by: ['status'],
    _count: true
  });
  
  console.log(`\n   Total Experts: ${total}`);
  
  console.log(`\n   Top Companies:`);
  byCompany.forEach(c => {
    console.log(`     ${c.company || 'Unknown'}: ${c._count}`);
  });
  
  console.log(`\n   By Source:`);
  bySource.forEach(s => {
    console.log(`     ${s.emailSource || 'Unknown'}: ${s._count}`);
  });
  
  console.log(`\n   By Status:`);
  byStatus.forEach(s => {
    console.log(`     ${s.status}: ${s._count}`);
  });
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
📥 Supabase Expert Importer

Usage:
  node importToSupabase.js <command> [file]

Commands:
  single <file.csv>    - Import a single CSV file
  all                  - Import all CSV files in data/results/
  stats               - Show database statistics
  list                - List all CSV files

Examples:
  node importToSupabase.js single data/results/goldman-sachs-2025-07-07.csv
  node importToSupabase.js all
  node importToSupabase.js stats
    `);
    return;
  }

  try {
    switch (args[0]) {
      case 'single':
        if (!args[1]) {
          console.error('❌ Please specify a CSV file');
          return;
        }
        await importCSVToSupabase(args[1]);
        break;
        
      case 'all':
        await importAllResults();
        break;
        
      case 'stats':
        await showStats();
        break;
        
      case 'list':
        const files = fs.readdirSync('data/results')
          .filter(f => f.endsWith('.csv'));
        console.log('\n📁 Available CSV files:');
        files.forEach(f => console.log(`   - ${f}`));
        break;
        
      default:
        console.error(`❌ Unknown command: ${args[0]}`);
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}

module.exports = { importCSVToSupabase };
