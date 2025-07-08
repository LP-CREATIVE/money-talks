const { PrismaClient } = require('@prisma/client');
const nlpService = require('./nlpService');
const linkedinSearchService = require('./linkedinSearchService');
const axios = require('axios');

const prisma = new PrismaClient();

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

    const entities = await nlpService.extractQuestionEntities(question.text);
    
    const internalMatches = await this.findInternalExperts(entities, question, 20);
    
    let externalExperts = [];
    
    // SIMPLE HUNTER.IO SEARCH
    if (entities.companies?.length > 0) {
      for (const company of entities.companies) {
        if (company.toLowerCase().includes('mcdonald')) {
          // Try us.mcd.com DIRECTLY
          try {
            console.log('Searching us.mcd.com...');
            const response = await axios.get('https://api.hunter.io/v2/domain-search', {
              params: {
                domain: 'us.mcd.com',
                api_key: process.env.HUNTER_API_KEY,
                limit: 10
              }
            });

            if (response.data.data.emails) {
              console.log(`Found ${response.data.data.emails.length} emails`);
              
              externalExperts = response.data.data.emails.map(person => ({
                expertLeadId: person.value,
                name: `${person.first_name || 'Unknown'} ${person.last_name || 'Unknown'}`,
                currentRole: person.position || 'Not specified',
                currentEmployer: 'McDonald\'s',
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
            }
          } catch (error) {
            console.error('Hunter.io error:', error.message);
          }
        }
      }
    }
    
    let linkedInProfiles = [];

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
    return null;
  }

  buildSearchQuery(entities) {
    return '';
  }

  calculateExternalOfferAmount(question) {
    const budget = question.escrowSource?.amount || 500;
    return budget * 0.8;
  }

  generateOutreachMessage(question, entities) {
    return `We have a paid research opportunity.`;
  }

  async notifyMatchedExperts(matchingResults) {
    return [];
  }
}

module.exports = new MatchingService();
