#!/usr/bin/env node

require('dotenv').config();

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const dns = require('dns').promises;
const csv = require('csv-parser');
const { createReadStream } = require('fs');

// Email pattern generator
class EmailFinder {
  constructor() {
    this.results = [];
    this.githubRequestCount = 0;
    this.hunterRequestCount = 0;
  }

  // Generate common email patterns
  generatePatterns(firstName, lastName, domain) {
    const f = firstName.toLowerCase().trim();
    const l = lastName.toLowerCase().trim();
    const first = f.charAt(0);
    const last = l.charAt(0);
    
    return [
      `${f}.${l}@${domain}`,
      `${f}@${domain}`,
      `${l}@${domain}`,
      `${f}${l}@${domain}`,
      `${first}${l}@${domain}`,
      `${first}.${l}@${domain}`,
      `${f}_${l}@${domain}`,
      `${f}-${l}@${domain}`,
      `${first}@${domain}`,
      `${f}${last}@${domain}`,
    ];
  }

  // Verify domain has MX records
  async verifyDomain(domain) {
    try {
      const records = await dns.resolveMx(domain);
      return records && records.length > 0;
    } catch {
      return false;
    }
  }

  // Search GitHub for emails
  async searchGitHub(firstName, lastName, company) {
    if (this.githubRequestCount >= 50) {
      console.log('⚠️  GitHub rate limit approaching, skipping...');
      return null;
    }

    try {
      this.githubRequestCount++;
      const query = `${firstName} ${lastName} ${company}`;
      console.log(`🔍 Searching GitHub for: ${query}`);
      
      const searchUrl = `https://api.github.com/search/users?q=${encodeURIComponent(query)}&per_page=3`;
      const response = await axios.get(searchUrl, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'MoneyTalks-EmailFinder/1.0'
        }
      });

      for (const user of response.data.items) {
        const userResponse = await axios.get(user.url, {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'MoneyTalks-EmailFinder/1.0'
          }
        });

        if (userResponse.data.email && !userResponse.data.email.includes('noreply')) {
          console.log(`✅ Found email on GitHub: ${userResponse.data.email}`);
          return {
            email: userResponse.data.email,
            source: 'github-profile',
            confidence: 95
          };
        }
      }
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('❌ GitHub rate limit exceeded');
        this.githubRequestCount = 999;
      }
    }
    return null;
  }

  // Hunter.io API (with proper API key support)
  async searchHunter(firstName, lastName, domain) {
    const apiKey = process.env.HUNTER_API_KEY;
    
    if (!apiKey) {
      console.log('⚠️  Hunter.io API key not found in .env file');
      return null;
    }

    try {
      console.log(`🔍 Searching Hunter.io for ${firstName} ${lastName} at ${domain}...`);
      
      const response = await axios.get('https://api.hunter.io/v2/email-finder', {
        params: {
          domain: domain,
          first_name: firstName,
          last_name: lastName,
          api_key: apiKey
        },
        timeout: 10000
      });
      
      if (response.data.data.email) {
        this.hunterRequestCount++;
        console.log(`✅ Hunter.io found: ${response.data.data.email} (confidence: ${response.data.data.score}%)`);
        
        return {
          email: response.data.data.email,
          source: 'hunter.io',
          confidence: response.data.data.score || 75,
          position: response.data.data.position,
          company: response.data.data.company
        };
      } else {
        console.log('❌ Hunter.io: No email found for this person');
      }
    } catch (error) {
      if (error.response?.status === 429) {
        console.log('❌ Hunter.io rate limit reached');
        this.hunterRequestCount = 999;
      } else if (error.response?.status === 401) {
        console.log('❌ Hunter.io API key is invalid');
      } else if (error.response?.status === 404) {
        console.log('❌ Hunter.io: Email not found');
      } else {
        console.log(`❌ Hunter.io error: ${error.message}`);
      }
    }
    return null;
  }

  // Check Hunter.io account status
  async checkHunterQuota() {
    const apiKey = process.env.HUNTER_API_KEY;
    if (!apiKey) {
      console.log('❌ Hunter.io API key not found in .env file');
      console.log('Add HUNTER_API_KEY=your_key to backend/.env');
      return null;
    }

    try {
      const response = await axios.get('https://api.hunter.io/v2/account', {
        params: { api_key: apiKey }
      });
      
      const data = response.data.data;
      console.log(`\n📊 Hunter.io Account Status:`);
      console.log(`   Plan: ${data.plan_name}`);
      console.log(`   Requests used: ${data.requests.searches.used}/${data.requests.searches.available}`);
      console.log(`   Resets: ${new Date(data.reset_date).toLocaleDateString()}\n`);
      
      return data.requests.searches.available - data.requests.searches.used;
    } catch (error) {
      console.error('Could not check Hunter.io quota:', error.message);
      return null;
    }
  }

  // Main email finding logic
  async findEmail(person) {
    const { firstName, lastName, company, linkedinUrl } = person;
    console.log(`\n👤 Finding email for: ${firstName} ${lastName} (${company})`);

    // Try GitHub first (free)
    const githubResult = await this.searchGitHub(firstName, lastName, company);
    if (githubResult) return githubResult;

    // Wait a bit to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Guess domain
    const possibleDomains = this.guessDomains(company);
    
    for (const domain of possibleDomains) {
      // Verify domain exists
      const domainValid = await this.verifyDomain(domain);
      if (!domainValid) {
        console.log(`❌ Invalid domain: ${domain}`);
        continue;
      }
      console.log(`✅ Valid domain: ${domain}`);

      // Try Hunter.io (now with proper API key)
      const hunterResult = await this.searchHunter(firstName, lastName, domain);
      if (hunterResult) return hunterResult;

      // If Hunter didn't find it, still try pattern guessing
      const patterns = this.generatePatterns(firstName, lastName, domain);
      return {
        email: patterns[0], // Most common pattern
        source: 'pattern-guess',
        confidence: 65,
        alternatives: patterns.slice(1, 4)
      };
    }

    console.log('❌ No email found');
    return null;
  }

  // Guess company domains
  guessDomains(company) {
    const cleaned = company.toLowerCase()
      .replace(/\s+inc\.?$/i, '')
      .replace(/\s+corp\.?$/i, '')
      .replace(/\s+corporation$/i, '')
      .replace(/\s+llc\.?$/i, '')
      .replace(/\s+ltd\.?$/i, '')
      .replace(/\s+limited$/i, '')
      .replace(/\s+company$/i, '')
      .replace(/\s+co\.?$/i, '')
      .replace(/[^a-z0-9]/g, '');

    const domains = [
      `${cleaned}.com`,
      `${cleaned}.io`,
      `${cleaned}.co`,
      `${company.toLowerCase().replace(/\s/g, '')}.com`,
      `${company.toLowerCase().replace(/\s/g, '-')}.com`
    ];

    // Special cases for known companies
    const knownDomains = {
      'google': 'google.com',
      'alphabet': 'google.com',
      'microsoft': 'microsoft.com',
      'apple': 'apple.com',
      'amazon': 'amazon.com',
      'meta': 'meta.com',
      'facebook': 'meta.com'
    };

    const cleanedLower = cleaned.toLowerCase();
    if (knownDomains[cleanedLower]) {
      domains.unshift(knownDomains[cleanedLower]);
    }

    // Remove duplicates
    return [...new Set(domains)];
  }
}

// Main CLI function
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
📧 Money Talks Email Finder CLI

Usage:
  node findEmails.js <command> [options]

Commands:
  single <firstName> <lastName> <company>  - Find email for one person
  csv <inputFile>                         - Process CSV file
  quota                                   - Check Hunter.io API quota

Examples:
  node findEmails.js single John Doe Microsoft
  node findEmails.js csv data/experts.csv
  node findEmails.js quota
    `);
    return;
  }

  const finder = new EmailFinder();
  const command = args[0];

  switch (command) {
    case 'single':
      if (args.length < 4) {
        console.error('❌ Usage: node findEmails.js single <firstName> <lastName> <company>');
        return;
      }
      
      const result = await finder.findEmail({
        firstName: args[1],
        lastName: args[2],
        company: args.slice(3).join(' ')
      });

      if (result) {
        console.log('\n✅ Email found!');
        console.log(`📧 Email: ${result.email}`);
        console.log(`📊 Confidence: ${result.confidence}%`);
        console.log(`🔍 Source: ${result.source}`);
        if (result.alternatives) {
          console.log(`🔄 Alternatives: ${result.alternatives.join(', ')}`);
        }
      } else {
        console.log('\n❌ No email found');
      }
      break;

    case 'csv':
      if (args.length < 2) {
        console.error('❌ Usage: node findEmails.js csv <inputFile>');
        return;
      }

      await processCSV(args[1], finder);
      break;

    case 'quota':
      await finder.checkHunterQuota();
      break;

    default:
      console.error(`❌ Unknown command: ${command}`);
      console.log('Run: node findEmails.js (without arguments) to see usage');
  }
}

// Process CSV file
async function processCSV(inputFile, finder) {
  const results = [];
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outputFile = path.join('data', 'results', `emails-${timestamp}.csv`);

  // Ensure output directory exists
  await fs.mkdir(path.join('data', 'results'), { recursive: true });

  console.log(`\n📁 Processing: ${inputFile}`);
  console.log('⏳ This may take a while due to rate limits...\n');

  const rows = [];
  
  // First, read all rows
  await new Promise((resolve, reject) => {
    createReadStream(inputFile)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`📊 Found ${rows.length} contacts to process\n`);

  // Process each row
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const result = await finder.findEmail(row);
    
    results.push({
      ...row,
      email: result?.email || '',
      confidence: result?.confidence || 0,
      source: result?.source || 'not-found',
      alternatives: result?.alternatives?.join(';') || ''
    });
    
    // Show progress
    console.log(`Progress: ${i + 1}/${rows.length} processed\n`);
    
    // Rate limiting between requests
    if (i < rows.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Write results
  const csvContent = [
    'firstName,lastName,company,title,linkedinUrl,email,confidence,source,alternatives',
    ...results.map(r => 
      `"${r.firstName}","${r.lastName}","${r.company}","${r.title || ''}","${r.linkedinUrl || ''}","${r.email}",${r.confidence},"${r.source}","${r.alternatives}"`
    )
  ].join('\n');

  await fs.writeFile(outputFile, csvContent);
  
  console.log(`\n✅ Results saved to: ${outputFile}`);
  console.log(`📊 Total processed: ${results.length}`);
  console.log(`📧 Emails found: ${results.filter(r => r.email).length}`);
  console.log(`🎯 High confidence (>80%): ${results.filter(r => r.confidence > 80).length}`);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { EmailFinder };
