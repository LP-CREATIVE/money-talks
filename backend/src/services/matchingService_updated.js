const { PrismaClient } = require('@prisma/client');
const nlpService = require('./nlpService');
const linkedinSearchService = require('./linkedinSearchService');

const prisma = new PrismaClient();

class MatchingService {
  async findMatchingExperts(questionId, options = {}) {
    const { 
      limit = 20, 
      includeExternal = true,
      minVerificationLevel = 1 
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
    
    // Get internal matches (existing registered experts)
    const internalMatches = await this.findInternalExperts(entities, question, limit);
    
    // NEW: Get external expert leads from Hunter.io data
    const externalExperts = await this.findExpertLeads(entities, question, limit);
    
    let externalSearchParams = null;
    let linkedInProfiles = [];
    
    // Only do LinkedIn search if we don't have enough matches
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
      externalExperts, // NEW: Include ExpertLead matches
      externalSearchParams,
      linkedInProfiles,
      escrowAvailable: question.escrowSource?.amount || 0
    };
  }

  // NEW METHOD: Find experts from ExpertLead table
  async findExpertLeads(entities, question, limit) {
    const where = {
      AND: [
        { status: 'PENDING_OUTREACH' },
        { emailConfidence: { gte: 70 } }
      ]
    };

    // Build OR conditions for matching
    const orConditions = [];

    // Company matches
    if (entities.companies?.length > 0) {
      entities.companies.forEach(company => {
        orConditions.push({
          company: {
            contains: company,
            mode: 'insensitive'
          }
        });
      });
    }

    // Title/topic matches
    if (entities.topics?.length > 0) {
      entities.topics.forEach(topic => {
        orConditions.push({
          title: {
            contains: topic,
            mode: 'insensitive'
          }
        });
      });
    }

    // If no specific matches, get high-confidence experts from relevant companies
    if (orConditions.length === 0 && entities.industries?.length > 0) {
      const industryCompanyMap = {
        'technology': ['Google', 'Microsoft', 'Apple', 'Amazon', 'Meta'],
        'finance': ['Goldman Sachs', 'JP Morgan', 'Morgan Stanley', 'Bank of America'],
        'banking': ['Goldman Sachs', 'JP Morgan', 'Bank of America', 'Wells Fargo'],
        'consulting': ['McKinsey', 'Bain', 'BCG', 'Deloitte', 'PwC'],
        'healthcare': ['Johnson & Johnson', 'Pfizer', 'UnitedHealth', 'CVS Health']
      };

      entities.industries.forEach(industry => {
        const companies = industryCompanyMap[industry.toLowerCase()] || [];
        companies.forEach(company => {
          orConditions.push({
            company: {
              contains: company,
              mode: 'insensitive'
            }
          });
        });
      });
    }

    if (orConditions.length > 0) {
      where.AND.push({ OR: orConditions });
    }

    const expertLeads = await prisma.expertLead.findMany({
      where,
      take: limit,
      orderBy: [
        { emailConfidence: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Format to match frontend expectations
    return expertLeads.map(lead => {
      const score = this.calculateExpertLeadScore(lead, entities);
      return {
        expertLeadId: lead.id, // Different ID to distinguish from internal experts
        userId: null, // No userId for external experts
        name: `${lead.firstName} ${lead.lastName}`,
        currentRole: lead.title,
        currentEmployer: lead.company,
        email: lead.email, // Include email for external experts
        department: lead.department,
        seniority: lead.seniority,
        verificationLevel: 0, // External experts aren't verified yet
        responseRate: 0, // No history yet
        averageResponseTime: 0,
        totalScore: score.totalScore,
        scoreBreakdown: score.breakdown,
        estimatedCost: this.calculateExternalOfferAmount(question),
        isExternal: true, // Flag to identify external experts
        emailConfidence: lead.emailConfidence,
        source: 'hunter_io'
      };
    });
  }

  calculateExpertLeadScore(lead, entities) {
    const breakdown = {
      companyMatch: 0,
      titleMatch: 0,
      seniorityBonus: 0,
      emailConfidence: 0
    };

    // Company match (50 points max)
    if (entities.companies?.length > 0 && lead.company) {
      entities.companies.forEach(company => {
        if (lead.company.toLowerCase().includes(company.toLowerCase())) {
          breakdown.companyMatch = 50;
        }
      });
    }

    // Title/topic match (30 points max)
    if (entities.topics?.length > 0 && lead.title) {
      const titleLower = lead.title.toLowerCase();
      entities.topics.forEach(topic => {
        if (titleLower.includes(topic.toLowerCase())) {
          breakdown.titleMatch += 15;
        }
      });
      breakdown.titleMatch = Math.min(breakdown.titleMatch, 30);
    }

    // Seniority bonus (10 points max)
    const seniorityScores = {
      'executive': 10,
      'senior': 7,
      'manager': 5,
      'junior': 2
    };
    breakdown.seniorityBonus = seniorityScores[lead.seniority] || 0;

    // Email confidence bonus (10 points max)
    breakdown.emailConfidence = Math.round((lead.emailConfidence || 0) / 10);

    const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);
    return { totalScore, breakdown };
  }

  // Keep all existing methods unchanged
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
        isExternal: false // Flag for internal experts
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
        if (expert.ExpertAnswer && Array.isArray(expert.ExpertAnswer)) {
          expert.ExpertAnswer.forEach(ea => {
            if (ea.answer.question.idea.title?.toLowerCase().includes(company.toLowerCase())) {
              breakdown.companyMatch += 10;
            }
          });
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
    
    // Internal expert notifications
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

    // NEW: External expert notifications (email-based)
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
