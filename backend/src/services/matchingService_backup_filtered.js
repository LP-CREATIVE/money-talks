const { PrismaClient } = require('@prisma/client');
const nlpService = require('./nlpService');
const linkedinSearchService = require('./linkedinSearchService');
const axios = require('axios');

const prisma = new PrismaClient();

class MatchingService {
  async findMatchingExperts(questionId, options = {}) {
    const { 
      limit = 20, 
      includeExternal = true,
      minVerificationLevel = 1,
      useHunterApi = true
    } = options;

    const question = await prisma.validationQuestion.findUnique({
      where: { id: questionId },
      include: { 
        idea: true,
        escrowSource: true 
      }
    });

    if (!question) {
      throw new Error('Question not found');
    }

    const entities = await nlpService.extractQuestionEntities(question.text);
    
    // Get internal matches
    const internalMatches = await this.findInternalExperts(entities, question, limit);
    
    // ALWAYS search Hunter.io API for external experts
    let externalExperts = [];
    if (includeExternal && useHunterApi) {
      console.log(`🔍 Searching Hunter.io API for experts...`);
      const hunterResults = await this.searchHunterRealtime(entities, question);
      
      if (hunterResults.length > 0) {
        await this.storeNewExpertLeads(hunterResults);
        externalExperts = hunterResults;
      }
    }
    
    let externalSearchParams = null;
    let linkedInProfiles = [];
    
    // LinkedIn search if needed
    const totalMatches = internalMatches.length + externalExperts.length;
    if (includeExternal && totalMatches < 5) {
      externalSearchParams = this.prepareExternalSearch(entities, question, totalMatches);
      
      if (externalSearchParams.searchQuery) {
        linkedInProfiles = await linkedinSearchService.searchExperts(
          externalSearchParams.searchQuery,
          { limit: 10 }
        );
      }
    }

    return {
      question,
      entities,
      internalMatches,
      externalExperts,
      externalSearchParams,
      linkedInProfiles,
      escrowAvailable: question.escrowSource?.amount || 0,
      hunterApiUsed: useHunterApi && includeExternal
    };
  }

  // Real-time Hunter.io search
    async searchHunterRealtime(entities, question) {
    const apiKey = process.env.HUNTER_API_KEY;
    if (!apiKey) {
      console.log('Hunter.io API key not configured');
      return [];
    }

    console.log('\nStarting Hunter.io API search...');
    console.log('Entities:', JSON.stringify(entities, null, 2));
    
    const experts = [];
    const searchedDomains = new Set();
    
    if (entities.companies?.length > 0) {
      for (const company of entities.companies) {
        const domains = this.getAllPossibleDomains(company);
        let foundEmails = false;
        
        for (const domain of domains) {
          if (searchedDomains.has(domain) || foundEmails) continue;
          searchedDomains.add(domain);
          
          try {
            console.log(`\nSearching ${company} at domain: ${domain}...`);
            
            const response = await axios.get('https://api.hunter.io/v2/domain-search', {
              params: {
                domain: domain,
                api_key: apiKey,
                limit: 10
              }
            });

            if (response.data.data.emails && response.data.data.emails.length > 0) {
              const emails = response.data.data.emails;
              console.log(`Found ${emails.length} emails at ${domain}`);
              foundEmails = true;
              
              const companyExperts = emails
                .map(person => {
                  let firstName = person.first_name || 'Unknown';
                  let lastName = person.last_name || 'Unknown';
                  
                  if ((!person.first_name || !person.last_name) && person.value) {
                    const emailParts = person.value.split('@')[0].split('.');
                    if (emailParts.length >= 2) {
                      firstName = person.first_name || emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
                      lastName = person.last_name || emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1);
                    }
                  }
                  
                  const relevanceScore = this.calculateRelevance(person, entities);
                  return {
                    firstName: firstName,
                    lastName: lastName,
                    email: person.value,
                    emailConfidence: person.confidence || 85,
                    emailSource: 'hunter.io_api',
                    title: person.position || 'Not specified',
                    company: company,
                    department: person.department,
                    seniority: person.seniority,
                    linkedinUrl: person.linkedin || null,
                    skills: [],
                    status: 'PENDING_OUTREACH',
                    relevanceScore: relevanceScore,
                    hunterData: {
                      twitter: person.twitter,
                      phone: person.phone_number,
                      sources: person.sources?.length || 0
                    }
                  };
                })
                .filter(person => person.relevanceScore > 0 || emails.length <= 5)
                .sort((a, b) => b.relevanceScore - a.relevanceScore)
                .slice(0, 10);
              
              experts.push(...companyExperts);
            } else {
              console.log(`No emails found at ${domain}`);
            }
          } catch (error) {
            if (error.response?.status === 429) {
              console.error('Hunter.io rate limit reached');
              break;
            }
            console.error(`Error searching ${domain}:`, error.response?.data?.errors?.[0]?.details || error.message);
          }
        }
        
        if (!foundEmails) {
          console.log(`No emails found for ${company} across all domain variations`);
        }
      }
    }

    if (experts.length === 0 && entities.industries?.length > 0) {
      console.log('\nNo company-specific results, searching by industry...');
      
      const industryDomains = {
        'technology': ['apple.com', 'google.com', 'microsoft.com'],
        'finance': ['goldmansachs.com', 'jpmorgan.com', 'morganstanley.com'],
        'automotive': ['tesla.com', 'gm.com', 'ford.com'],
        'battery manufacturing': ['panasonic.com', 'lg.com', 'catl.com'],
        'healthcare': ['jnj.com', 'pfizer.com', 'unitedhealth.com'],
        'fast food': ['us.mcd.com', 'yum.com', 'burgerking.com'],
        'restaurant': ['darden.com', 'starbucks.com', 'chipotle.com']
      };

      for (const industry of entities.industries) {
        const domains = industryDomains[industry.toLowerCase()] || [];
        
        for (const domain of domains.slice(0, 3)) {
          if (searchedDomains.has(domain)) continue;
          searchedDomains.add(domain);
          
          try {
            console.log(`Searching ${domain} for ${industry} experts...`);
            
            const response = await axios.get('https://api.hunter.io/v2/domain-search', {
              params: {
                domain: domain,
                api_key: apiKey,
                limit: 10
              }
            });

            if (response.data.data.emails) {
              const industryExperts = response.data.data.emails
                .map(person => {
                  let firstName = person.first_name || 'Unknown';
                  let lastName = person.last_name || 'Unknown';
                  
                  if ((!person.first_name || !person.last_name) && person.value) {
                    const emailParts = person.value.split('@')[0].split('.');
                    if (emailParts.length >= 2) {
                      firstName = person.first_name || emailParts[0].charAt(0).toUpperCase() + emailParts[0].slice(1);
                      lastName = person.last_name || emailParts[1].charAt(0).toUpperCase() + emailParts[1].slice(1);
                    }
                  }
                  
                  return {
                    firstName: firstName,
                    lastName: lastName,
                    email: person.value,
                    emailConfidence: person.confidence || 85,
                    emailSource: 'hunter.io_api',
                    title: person.position || 'Not specified',
                    company: domain.replace(/\.(com|org|net)$/, '').toUpperCase(),
                    department: person.department,
                    seniority: person.seniority,
                    linkedinUrl: person.linkedin || null,
                    skills: [],
                    status: 'PENDING_OUTREACH',
                    relevanceScore: this.calculateRelevance(person, entities)
                  };
                })
                .filter(person => person.relevanceScore > 0);
              
              experts.push(...industryExperts);
            }
          } catch (error) {
            console.error(`Error searching ${domain}:`, error.message);
          }
        }
      }
    }

    console.log(`\nTotal experts found: ${experts.length}`);
    
    return experts
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20)
      .map(expert => this.formatHunterExpert(expert, entities, question));
  }

  getAllPossibleDomains(company) {
    const cleaned = company.toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    
    const knownMappings = {
      'mcdonalds': ['us.mcd.com', 'corporate.mcdonalds.com', 'mcdonalds.com'],
      'google': ['google.com', 'abc.xyz'],
      'meta': ['meta.com', 'facebook.com'],
      'alphabet': ['abc.xyz', 'google.com'],
      'jpmorgan': ['jpmorgan.com', 'jpmorganchase.com', 'chase.com'],
      'goldmansachs': ['goldmansachs.com', 'gs.com'],
      'berkshirehathaway': ['berkshirehathaway.com', 'brk.com'],
      'johnsonjohnson': ['jnj.com', 'johnsonandjohnson.com'],
      'proctergamble': ['pg.com', 'procterandgamble.com'],
      'generalmotors': ['gm.com', 'generalmotors.com'],
      'fordmotor': ['ford.com', 'fordmotorcompany.com'],
      'waltdisney': ['disney.com', 'thewaltdisneycompany.com'],
      'att': ['att.com', 'about.att.com'],
      'verizon': ['verizon.com', 'verizonwireless.com'],
      'walmart': ['walmart.com', 'corporate.walmart.com'],
      'exxonmobil': ['exxonmobil.com', 'exxon.com', 'mobil.com'],
      'chevron': ['chevron.com', 'chevrontexaco.com'],
      'cvs': ['cvs.com', 'cvshealth.com'],
      'unitedhealth': ['unitedhealthgroup.com', 'uhc.com'],
      'bankofamerica': ['bankofamerica.com', 'bofa.com'],
      'wellsfargo': ['wellsfargo.com', 'wf.com'],
      'citigroup': ['citi.com', 'citigroup.com'],
      'morganstanley': ['morganstanley.com', 'ms.com'],
      'americanexpress': ['americanexpress.com', 'amex.com']
    };
    
    if (knownMappings[cleaned]) {
      return knownMappings[cleaned];
    }
    
    const variations = [
      `${cleaned}.com`,
      `${cleaned}.net`,
      `${cleaned}.org`,
      `corporate.${cleaned}.com`,
      `www.${cleaned}.com`,
      `us.${cleaned}.com`,
      `${cleaned}corp.com`,
      `${cleaned}inc.com`,
      `${cleaned}group.com`
    ];
    
    const withSpaces = company.toLowerCase().replace(/\s+/g, '');
    if (withSpaces !== cleaned) {
      variations.push(`${withSpaces}.com`);
    }
    
    const withDashes = company.toLowerCase().replace(/\s+/g, '-');
    if (withDashes !== cleaned) {
      variations.push(`${withDashes}.com`);
    }
    
    return [...new Set(variations)].slice(0, 5);
  }


  formatHunterExpert(expert, entities, question) {
    const score = this.calculateExpertLeadScore(expert, entities);
    
    return {
      expertLeadId: expert.email,
      userId: null,
      name: `${expert.firstName} ${expert.lastName}`,
      currentRole: expert.title,
      currentEmployer: expert.company,
      email: expert.email,
      department: expert.department,
      seniority: expert.seniority,
      verificationLevel: 0,
      responseRate: 0,
      averageResponseTime: 0,
      totalScore: score.totalScore + (expert.relevanceScore || 0),
      scoreBreakdown: {
        ...score.breakdown,
        relevance: expert.relevanceScore || 0
      },
      estimatedCost: this.calculateExternalOfferAmount(question),
      isExternal: true,
      emailConfidence: expert.emailConfidence,
      source: 'hunter.io_api',
      linkedinUrl: expert.linkedinUrl,
      additionalData: expert.hunterData
    };
  }

  // Store in database
  async storeNewExpertLeads(experts) {
    const stored = [];
    
    for (const expert of experts) {
      try {
        const expertData = {
          firstName: expert.firstName || 'Unknown',
          lastName: expert.lastName || 'Unknown',
          email: expert.email,
          emailConfidence: expert.emailConfidence,
          emailSource: expert.source || 'hunter.io_api',
          title: expert.currentRole || expert.title || null,
          company: expert.currentEmployer || expert.company || null,
          department: expert.department || null,
          seniority: expert.seniority || null,
          linkedinUrl: expert.linkedinUrl || null,
          skills: expert.skills || [],
          status: 'PENDING_OUTREACH'
        };
        
        // Check if exists
        const existing = await prisma.expertLead.findUnique({
          where: { email: expertData.email }
        });
        
        if (!existing) {
          const created = await prisma.expertLead.create({
            data: expertData
          });
          stored.push(created);
        } else {
          // Update if better data
          if (expertData.emailConfidence > (existing.emailConfidence || 0) ||
              (expertData.firstName !== 'Unknown' && existing.firstName === 'Unknown')) {
            await prisma.expertLead.update({
              where: { email: expertData.email },
              data: { 
                emailConfidence: expertData.emailConfidence,
                firstName: expertData.firstName !== 'Unknown' ? expertData.firstName : existing.firstName,
                lastName: expertData.lastName !== 'Unknown' ? expertData.lastName : existing.lastName,
                title: expertData.title || existing.title,
                company: expertData.company || existing.company
              }
            });
          }
        }
      } catch (error) {
        console.error(`Error storing ${expert.email}:`, error.message);
      }
    }
    
    if (stored.length > 0) {
      console.log(`💾 Stored ${stored.length} new experts in database`);
    }
    
    return stored;
  }

  // Helper methods
  guessDomain(company) {
    const cleaned = company.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    const knownDomains = {
      'tesla': 'tesla.com',
      'google': 'google.com',
      'microsoft': 'microsoft.com',
      'apple': 'apple.com',
      'goldmansachs': 'goldmansachs.com',
      'jpmorgan': 'jpmorgan.com',
      'morganstanley': 'morganstanley.com',
      'gm': 'gm.com',
      'generalmotors': 'gm.com',
      'ford': 'ford.com',
      'toyota': 'toyota.com',
      'volkswagen': 'vw.com',
      'bmw': 'bmw.com',
      'mercedes': 'mercedes-benz.com',
      'mercedesbenz': 'mercedes-benz.com',
      'honda': 'honda.com',
      'nissan': 'nissan.com',
      'hyundai': 'hyundai.com',
      'panasonic': 'panasonic.com',
      'lg': 'lg.com',
      'samsung': 'samsung.com',
      'catl': 'catl.com',
      'byd': 'byd.com'
    };
    
    return knownDomains[cleaned] || `${cleaned}.com`;
  }

  mapEntitiesToDepartment(entities) {
    if (entities.functionalExpertise) {
      const expertise = entities.functionalExpertise.toLowerCase();
      if (expertise.includes('supply chain')) return 'operations';
      if (expertise.includes('finance')) return 'finance';
      if (expertise.includes('engineering')) return 'it';
      if (expertise.includes('sales')) return 'sales';
      if (expertise.includes('marketing')) return 'marketing';
    }
    
    if (entities.topics?.length > 0) {
      const topicsStr = entities.topics.join(' ').toLowerCase();
      if (topicsStr.includes('battery') || topicsStr.includes('manufacturing')) return 'it';
      if (topicsStr.includes('supply chain')) return 'operations';
      if (topicsStr.includes('cost') || topicsStr.includes('finance')) return 'finance';
    }
    
    return null;
  }

  calculateExpertLeadScore(lead, entities) {
    const breakdown = {
      companyMatch: 0,
      titleMatch: 0,
      seniorityBonus: 0,
      emailConfidence: 0,
      departmentMatch: 0
    };

    // Company match
    if (entities.companies?.length > 0 && lead.company) {
      entities.companies.forEach(company => {
        if (lead.company.toLowerCase().includes(company.toLowerCase())) {
          breakdown.companyMatch = 40;
        }
      });
    }

    // Title match
    if (entities.topics?.length > 0 && lead.title) {
      const titleLower = lead.title.toLowerCase();
      entities.topics.forEach(topic => {
        if (titleLower.includes(topic.toLowerCase())) {
          breakdown.titleMatch += 15;
        }
      });
      breakdown.titleMatch = Math.min(breakdown.titleMatch, 30);
    }

    // Department match
    const targetDept = this.mapEntitiesToDepartment(entities);
    if (targetDept && lead.department === targetDept) {
      breakdown.departmentMatch = 10;
    }

    // Seniority bonus
    const seniorityScores = {
      'executive': 10,
      'senior': 7,
      'manager': 5,
      'junior': 2
    };
    breakdown.seniorityBonus = seniorityScores[lead.seniority] || 0;

    // Email confidence
    breakdown.emailConfidence = Math.round((lead.emailConfidence || 0) / 10);

    const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);
    return { totalScore, breakdown };
  }

  // Keep all existing internal expert methods...
  async findInternalExperts(entities, question, limit) {
    const experts = await prisma.expertProfile.findMany({
      where: {
        verificationLevel: { gte: 1 },
        user: {
          isVerified: true,
          userType: 'RETAIL'
        }
      },
      include: {
        user: true,
        ExpertAnswer: {
          include: {
            answer: {
              include: {
                question: {
                  include: {
                    idea: true
                  }
                }
              }
            }
          }
        }
      }
    });

    const scoredExperts = experts.map(expert => {
      const score = this.calculateExpertScore(expert, entities, question);
      return { expert, ...score };
    });

    return scoredExperts
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, limit)
      .map(item => ({
        expertId: item.expert.id,
        userId: item.expert.userId,
        name: item.expert.fullName,
        currentRole: item.expert.currentRole,
        currentEmployer: item.expert.currentEmployer,
        verificationLevel: item.expert.verificationLevel,
        responseRate: item.expert.responseRate,
        averageResponseTime: item.expert.averageResponseTime,
        totalScore: item.totalScore,
        scoreBreakdown: item.breakdown,
        estimatedCost: this.calculateExpertCost(item.expert, question),
        isExternal: false
      }));
  }

  calculateExpertScore(expert, entities, question) {
    const breakdown = {
      companyMatch: 0,
      industryMatch: 0,
      topicMatch: 0,
      geographyMatch: 0,
      seniorityMatch: 0,
      performanceScore: 0,
      experienceScore: 0
    };

    if (entities.companies?.length > 0) {
      entities.companies.forEach(company => {
        if (expert.currentEmployer?.toLowerCase().includes(company.toLowerCase())) {
          breakdown.companyMatch += 50;
        }
      });
    }

    if (entities.industries?.length > 0) {
      entities.industries.forEach(industry => {
        if (expert.primaryIndustry?.toLowerCase() === industry.toLowerCase()) {
          breakdown.industryMatch += 30;
        } else if (expert.secondaryIndustries?.includes(industry)) {
          breakdown.industryMatch += 20;
        }
      });
    }

    if (entities.topics?.length > 0) {
      entities.topics.forEach(topic => {
        if (expert.specificExpertiseTags?.some(tag => 
          tag.toLowerCase().includes(topic.toLowerCase())
        )) {
          breakdown.topicMatch += 15;
        }
      });
    }

    if (entities.geography && expert.geographicExpertise?.includes(entities.geography)) {
      breakdown.geographyMatch = 10;
    }

    breakdown.seniorityMatch = this.calculateSeniorityScore(
      entities.seniorityRequired, 
      expert.currentRole
    );

    breakdown.performanceScore = 
      (expert.accuracyScore * 0.2) + 
      (expert.responseRate * 10) + 
      (expert.verificationLevel * 5);

    const answerCount = Array.isArray(expert.ExpertAnswer) ? expert.ExpertAnswer.length : 0;
    breakdown.experienceScore = Math.min(answerCount * 2, 20);

    const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);

    return { totalScore, breakdown };
  }

  calculateSeniorityScore(required, currentRole) {
    if (!required || !currentRole) return 0;

    const seniorityLevels = {
      'analyst': 1,
      'associate': 2,
      'manager': 3,
      'senior manager': 4,
      'director': 5,
      'vp': 6,
      'svp': 7,
      'evp': 8,
      'c-level': 9
    };

    const requiredLevel = seniorityLevels[required.toLowerCase()] || 3;
    const roleLower = currentRole.toLowerCase();
    
    let expertLevel = 3;
    for (const [title, level] of Object.entries(seniorityLevels)) {
      if (roleLower.includes(title)) {
        expertLevel = level;
        break;
      }
    }

    if (expertLevel === requiredLevel) return 10;
    if (expertLevel > requiredLevel) return 8;
    if (expertLevel === requiredLevel - 1) return 5;
    return 0;
  }

  calculateExpertCost(expert, question) {
    let baseCost = 100;
    
    baseCost *= (1 + (expert.verificationLevel * 0.25));
    baseCost *= (1 + (expert.accuracyScore / 100));
    
    if (expert.responseRate > 0.9) baseCost *= 1.2;
    
    const maxBudget = question.escrowSource?.amount || 500;
    return Math.min(baseCost, maxBudget * 0.7);
  }

  prepareExternalSearch(entities, question, internalMatchCount) {
    if (internalMatchCount >= 5) return null;

    return {
      searchQuery: this.buildSearchQuery(entities),
      budget: question.escrowSource?.amount || 0,
      offerAmount: this.calculateExternalOfferAmount(question),
      outreachMessage: this.generateOutreachMessage(question, entities)
    };
  }

  buildSearchQuery(entities) {
    const parts = [];
    if (entities.companies?.length > 0) {
      parts.push(entities.companies.join(' OR '));
    }
    if (entities.industries?.length > 0) {
      parts.push(entities.industries.join(' OR '));
    }
    if (entities.functionalExpertise) {
      parts.push(entities.functionalExpertise);
    }
    return parts.join(' ');
  }

  calculateExternalOfferAmount(question) {
    const budget = question.escrowSource?.amount || 500;
    return budget * 0.8;
  }

  generateOutreachMessage(question, entities) {
    return `We have a paid research opportunity that matches your expertise.

Question: "${question.text}"

We're looking for someone with experience in:
${entities.industries?.join(', ') || 'your industry'}
${entities.companies?.length > 0 ? `Companies: ${entities.companies.join(', ')}` : ''}

Compensation: $${this.calculateExternalOfferAmount(question)}
Response needed within: 48 hours

Interested? Click here to learn more and provide your answer.`;
  }

  async notifyMatchedExperts(matchingResults) {
    const notifications = [];
    
    for (const match of matchingResults.internalMatches) {
      notifications.push({
        userId: match.userId,
        type: 'QUESTION_MATCH',
        title: 'New Question Match',
        message: `You've been matched to a question worth $${match.estimatedCost}`,
        data: {
          questionId: matchingResults.question.id,
          matchScore: match.totalScore,
          estimatedCost: match.estimatedCost
        }
      });
    }

    for (const match of matchingResults.externalExperts || []) {
      notifications.push({
        expertLeadId: match.expertLeadId,
        email: match.email,
        type: 'EXTERNAL_EXPERT_MATCH',
        title: 'Expert Opportunity on Money Talks',
        message: matchingResults.externalSearchParams?.outreachMessage || 
                 this.generateOutreachMessage(matchingResults.question, matchingResults.entities),
        data: {
          questionId: matchingResults.question.id,
          matchScore: match.totalScore,
          estimatedCost: match.estimatedCost,
          isExternal: true
        }
      });
    }

    return notifications;
  }
}

module.exports = new MatchingService();
