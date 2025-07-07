const prisma = require('../utils/prisma');
const axios = require('axios');
const nlpService = require('./nlpService');

class MatchingService {
  async findMatchingExperts(questionId, options = {}) {
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

    // Use companies from idea expert search criteria if available
    let targetCompanies = [];
    if (question.idea?.expertSearchCriteria) {
      try {
        const criteria = JSON.parse(question.idea.expertSearchCriteria);
        targetCompanies = criteria.companies || [];
      } catch (e) {
        console.error("Error parsing expert criteria:", e);
      }
    }

    const entities = await nlpService.extractQuestionEntities(question.text);
    
    // Override companies with those from idea if available
    if (targetCompanies.length > 0) {
      entities.companies = targetCompanies;
      console.log("Using companies from idea:", targetCompanies);
    }
    
    const internalMatches = await this.findInternalExperts(entities, question, 20);
    
    let externalExperts = [];
    
    // GENERIC HUNTER.IO SEARCH FOR ANY COMPANY
    if (entities.companies?.length > 0) {
      for (const company of entities.companies) {
        try {
          const domain = this.guessDomain(company);
          console.log(`Searching ${domain} for ${company} experts...`);
          
          const response = await axios.get('https://api.hunter.io/v2/domain-search', {
            params: {
              domain: domain,
              api_key: process.env.HUNTER_API_KEY,
              limit: 10
            }
          });

          if (response.data.data.emails) {
            console.log(`Found ${response.data.data.emails.length} emails for ${company}`);
            
            const companyExperts = response.data.data.emails.map(person => ({
              expertLeadId: person.value,
              name: `${person.first_name || 'Unknown'} ${person.last_name || 'Unknown'}`,
              currentRole: person.position || 'Not specified',
              currentEmployer: company,
              email: person.value,
              department: person.department,
              seniority: person.seniority,
              totalScore: person.confidence || 0,
              scoreBreakdown: { confidence: person.confidence },
              estimatedCost: 800,
              isExternal: true,
              emailConfidence: person.confidence,
              source: 'hunter.io'
            }));
            
            externalExperts.push(...companyExperts);
          }
        } catch (error) {
          console.error(`Hunter.io error for ${company}:`, error.message);
        }
      }
    }
    
    const linkedInProfiles = [];
    
    return {
      question,
      entities,
      internalMatches,
      externalExperts,
      linkedInProfiles,
      escrowAvailable: question.escrowSource?.amount || 0,
      hunterApiUsed: true
    };
  }

  async findInternalExperts(entities, question, limit) {
    const experts = await prisma.expertProfile.findMany({
      include: {
        user: true
      },
      take: limit * 2
    });

    return experts.map(expert => {
      const score = this.calculateMatchScore(expert, entities, question);
      return {
        ...expert,
        totalScore: score.total,
        scoreBreakdown: score.breakdown,
        estimatedCost: 500,
        isExternal: false
      };
    })
    .filter(expert => expert.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, limit);
  }

  calculateMatchScore(expert, entities, question) {
    const breakdown = {
      companyMatch: 0,
      industryMatch: 0,
      skillMatch: 0,
      seniorityBonus: 0
    };

    // Company matching
    if (entities.companies?.length > 0 && expert.currentEmployer) {
      for (const company of entities.companies) {
        if (expert.currentEmployer.toLowerCase().includes(company.toLowerCase())) {
          breakdown.companyMatch = 40;
          break;
        }
      }
    }

    // Industry matching
    if (entities.industries?.length > 0 && expert.primaryIndustry) {
      if (entities.industries.some(ind => 
        expert.primaryIndustry.toLowerCase().includes(ind.toLowerCase())
      )) {
        breakdown.industryMatch = 30;
      }
    }

    // Skill matching
    if (entities.topics?.length > 0 && expert.specificExpertiseTags?.length > 0) {
      const matches = entities.topics.filter(topic =>
        expert.specificExpertiseTags.some(tag => 
          tag.toLowerCase().includes(topic.toLowerCase())
        )
      );
      breakdown.skillMatch = Math.min(matches.length * 15, 30);
    }

    // Seniority bonus
    if (expert.yearsInIndustry > 10) {
      breakdown.seniorityBonus = 10;
    } else if (expert.yearsInIndustry > 5) {
      breakdown.seniorityBonus = 5;
    }

    const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    return { total, breakdown };
  }

  guessDomain(company) {
    const commonDomains = {
      'nike': 'nike.com',
      'adidas': 'adidas.com',
      'under armour': 'underarmour.com',
      'lululemon': 'lululemon.com',
      'apple': 'apple.com',
      'google': 'google.com',
      'microsoft': 'microsoft.com',
      'meta': 'meta.com',
      'facebook': 'facebook.com',
      'amazon': 'amazon.com',
      'tesla': 'tesla.com',
      'walmart': 'walmart.com',
      'target': 'target.com'
    };
    
    const normalized = company.toLowerCase().trim();
    
    if (commonDomains[normalized]) {
      return commonDomains[normalized];
    }
    
    const cleaned = normalized
      .replace(/\b(inc|llc|ltd|limited|corp|corporation|company|co)\b\.?$/i, '')
      .trim()
      .replace(/[^a-z0-9]/g, '');
    
    return `${cleaned}.com`;
  }

  async searchLinkedInProfiles(entities, question, limit) {
    return [];
  }

  prepareExternalSearch(entities, question, internalMatchCount) {
    const searchQueries = [];
    
    if (entities.companies?.length > 0) {
      entities.companies.forEach(company => {
        searchQueries.push({
          type: 'company',
          query: `${company} ${entities.topics?.join(' ')}`,
          company
        });
      });
    }

    return searchQueries;
  }

  calculateExternalOfferAmount(question) {
    const baseAmount = 500;
    const urgencyMultiplier = question.isTop3 ? 1.5 : 1;
    return Math.round(baseAmount * urgencyMultiplier);
  }
}

module.exports = new MatchingService();
