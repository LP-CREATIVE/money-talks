#!/usr/bin/env node

require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

class RealtimeExpertFinder {
  constructor() {
    this.hunterApiKey = process.env.HUNTER_API_KEY;
  }

  // Search Hunter.io by company domain
  async searchByCompany(company, title = null, department = null) {
    if (!this.hunterApiKey) {
      console.log('❌ Hunter.io API key not found in .env');
      return [];
    }

    const domain = this.guessDomain(company);
    console.log(`\n🔍 Searching for experts at ${company} (${domain})...`);

    try {
      const params = {
        domain: domain,
        api_key: this.hunterApiKey
      };

      // Add optional filters
      if (department) params.department = department;
      if (title) {
        params.seniority = this.mapTitleToSeniority(title);
      }

      const response = await axios.get('https://api.hunter.io/v2/domain-search', { params });
      
      const data = response.data.data;
      console.log(`✅ Found ${data.emails.length} emails at ${company}`);
      
      let experts = data.emails;

      // Filter by title if provided
      if (title) {
        experts = experts.filter(person => 
          this.isTitleRelevant(person.position, title)
        );
        console.log(`📋 ${experts.length} match the title "${title}"`);
      }

      return experts.map(person => ({
        firstName: person.first_name,
        lastName: person.last_name,
        email: person.value,
        confidence: person.confidence,
        title: person.position || 'Unknown',
        department: person.department,
        seniority: person.seniority,
        company: company
      }));

    } catch (error) {
      if (error.response?.status === 429) {
        console.log('❌ Hunter.io rate limit reached');
      } else {
        console.log(`❌ Error: ${error.message}`);
      }
      return [];
    }
  }

  // Find specific person at company
  async findSpecificPerson(firstName, lastName, company) {
    if (!this.hunterApiKey) {
      console.log('❌ Hunter.io API key not found');
      return null;
    }

    const domain = this.guessDomain(company);
    console.log(`\n🔍 Looking for ${firstName} ${lastName} at ${company}...`);

    try {
      const response = await axios.get('https://api.hunter.io/v2/email-finder', {
        params: {
          domain: domain,
          first_name: firstName,
          last_name: lastName,
          api_key: this.hunterApiKey
        }
      });

      if (response.data.data.email) {
        const data = response.data.data;
        console.log(`✅ Found: ${data.email} (${data.confidence}% confidence)`);
        
        return {
          firstName: firstName,
          lastName: lastName,
          email: data.email,
          confidence: data.confidence,
          title: data.position || 'Unknown',
          company: company
        };
      } else {
        console.log('❌ Email not found');
        return null;
      }

    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      return null;
    }
  }

  // Interactive mode
  async interactiveSearch() {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const question = (q) => new Promise(resolve => readline.question(q, resolve));

    console.log('\n🔍 Expert Finder - Interactive Mode\n');

    const searchType = await question('Search type (1: By Company, 2: Specific Person): ');

    if (searchType === '1') {
      // Company search
      const company = await question('Company name: ');
      const title = await question('Job title filter (optional, press Enter to skip): ');
      const dept = await question('Department (it/finance/executive/sales, or Enter to skip): ');

      const experts = await this.searchByCompany(
        company,
        title || null,
        dept || null
      );

      if (experts.length > 0) {
        await this.saveResults(experts, `${company.toLowerCase().replace(/\s/g, '-')}-experts`);
      }

    } else {
      // Specific person search
      const firstName = await question('First name: ');
      const lastName = await question('Last name: ');
      const company = await question('Company: ');

      const expert = await this.findSpecificPerson(firstName, lastName, company);
      
      if (expert) {
        await this.saveResults([expert], 'specific-person');
      }
    }

    readline.close();
  }

  // Save results to CSV
  async saveResults(experts, prefix) {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = path.join('data', 'results', `${prefix}-${timestamp}.csv`);

    const csvContent = [
      'firstName,lastName,email,confidence,title,department,seniority,company',
      ...experts.map(e => 
        `"${e.firstName}","${e.lastName}","${e.email}",${e.confidence},"${e.title}","${e.department || ''}","${e.seniority || ''}","${e.company}"`
      )
    ].join('\n');

    await fs.mkdir(path.dirname(filename), { recursive: true });
    await fs.writeFile(filename, csvContent);
    
    console.log(`\n📁 Results saved to: ${filename}`);
    console.log(`📊 Total experts: ${experts.length}`);
  }

  // Helper methods
  mapTitleToSeniority(title) {
    const titleLower = title.toLowerCase();
    if (titleLower.includes('ceo') || titleLower.includes('cfo') || 
        titleLower.includes('cto') || titleLower.includes('president')) {
      return 'executive';
    }
    if (titleLower.includes('vp') || titleLower.includes('vice president') ||
        titleLower.includes('director') || titleLower.includes('head')) {
      return 'senior';
    }
    return null;
  }

  isTitleRelevant(position, requestedTitle) {
    if (!position || !requestedTitle) return true;
    const posLower = position.toLowerCase();
    const reqLower = requestedTitle.toLowerCase();
    
    // Check if position contains key words from requested title
    const keywords = reqLower.split(' ').filter(word => word.length > 3);
    return keywords.some(keyword => posLower.includes(keyword));
  }

  guessDomain(company) {
    const cleaned = company.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const known = {
      'google': 'google.com',
      'microsoft': 'microsoft.com',
      'apple': 'apple.com',
      'goldmansachs': 'goldmansachs.com',
      'jpmorgan': 'jpmorgan.com',
      'morganstanley': 'morganstanley.com',
      'bankofamerica': 'bankofamerica.com',
      'wellsfargo': 'wellsfargo.com',
      'uber': 'uber.com',
      'netflix': 'netflix.com',
      'amazon': 'amazon.com',
      'meta': 'meta.com',
      'facebook': 'meta.com'
    };
    
    return known[cleaned] || `${cleaned}.com`;
  }
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);
  const finder = new RealtimeExpertFinder();

  if (args.length === 0) {
    console.log(`
📧 Real-Time Expert Finder (Hunter.io)

Usage:
  node findExpertsRealtime.js <command> [options]

Commands:
  company <name> [title] [dept]    - Find all experts at a company
  person <first> <last> <company>  - Find specific person
  interactive                      - Interactive mode
  quota                           - Check API quota

Examples:
  node findExpertsRealtime.js company "Goldman Sachs"
  node findExpertsRealtime.js company Microsoft "VP Engineering" it
  node findExpertsRealtime.js person John Doe Google
  node findExpertsRealtime.js interactive

Departments: it, finance, executive, sales, marketing, hr, legal
    `);
    return;
  }

  const command = args[0];

  switch (command) {
    case 'company':
      if (args.length < 2) {
        console.log('❌ Usage: node findExpertsRealtime.js company <name> [title] [department]');
        return;
      }
      
      const experts = await finder.searchByCompany(args[1], args[2], args[3]);
      if (experts.length > 0) {
        await finder.saveResults(experts, args[1].toLowerCase().replace(/\s/g, '-'));
      }
      break;

    case 'person':
      if (args.length < 4) {
        console.log('❌ Usage: node findExpertsRealtime.js person <firstName> <lastName> <company>');
        return;
      }
      
      const expert = await finder.findSpecificPerson(args[1], args[2], args.slice(3).join(' '));
      if (expert) {
        await finder.saveResults([expert], 'specific-person');
      }
      break;

    case 'interactive':
      await finder.interactiveSearch();
      break;

    case 'quota':
      // Check quota using the other script
      const { execSync } = require('child_process');
      execSync('node src/scripts/email-finder/findEmails.js quota', { stdio: 'inherit' });
      break;

    default:
      console.log(`❌ Unknown command: ${command}`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { RealtimeExpertFinder };
