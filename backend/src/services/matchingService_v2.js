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
    
    // Get internal matches from existing expert profiles
    const internalMatches = await this.findInternalExperts(entities, question, limit);
    
    // NEW: Get external matches from ExpertLead table
    const expertLeadMatches = await this.findExpertLeads(entities, question, limit);
    
    let externalSearchParams = null;
    let linkedInProfiles = [];
    
    // Only do LinkedIn search if we don't have enough matches
    if (includeExternal && (internalMatches.length + expertLeadMatches.length) < 5) {
      externalSearchParams = this.prepareExternalSearch(entities, question, internalMatches.length);
      
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
      expertLeadMatches, // NEW: Include ExpertLead matches
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

    // Industry matches (map to likely companies)
    if (entities.industries?.length > 0) {
      const industryCompanyMap = {
        'technology': ['Google', 'Microsoft', 'Apple', 'Amazon', 'Meta'],
        'finance': ['Goldman Sachs', 'JP Morgan', 'Morgan Stanley'],
        'banking': ['Goldman Sachs', 'JP Morgan', 'Bank of America'],
        'consulting': ['McKinsey', 'Bain', 'BCG', 'Deloitte'],
        'healthcare': ['Johnson & Johnson', 'Pfizer', 'UnitedHealth']
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

    if (orConditions.length > 0) {
      where.AND.push({ OR: orConditions });
    }

    const expertLeads = await prisma.expertLead.findMany({
      where,
      take: limit,
      orderBy: [
        { emailConfidence: 'desc' },
        { seniority: 'desc' }
      ]
    });

    return expertLeads.map(lead => {
      const score = this.calculateExpertLeadScore(lead, entities);
      return {
        expertLeadId: lead.id,
        name: `${lead.firstName} ${lead.lastName}`,
        email: lead.email,
        currentRole: lead.title,
        currentEmployer: lead.company,
        department: lead.department,
        seniority: lead.seniority,
        emailConfidence: lead.emailConfidence,
        source: 'hunter_io',
        totalScore: score.totalScore,
        scoreBreakdown: score.breakdown,
        estimatedCost: this.calculateExternalOfferAmount(question)
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
    if (entities.companies?.length > 0) {
      entities.companies.forEach(company => {
        if (lead.company?.toLowerCase().includes(company.toLowerCase())) {
          breakdown.companyMatch = 50;
        }
      });
    }

    // Title/topic match (30 points max)
    if (entities.topics?.length > 0 && lead.title) {
      entities.topics.forEach(topic => {
        if (lead.title.toLowerCase().includes(topic.toLowerCase())) {
          breakdown.titleMatch += 15;
        }
      });
      breakdown.titleMatch = Math.min(breakdown.titleMatch, 30);
    }

    // Seniority bonus (10 points max)
    if (lead.seniority === 'executive') {
      breakdown.seniorityBonus = 10;
    } else if (lead.seniority === 'senior') {
      breakdown.seniorityBonus = 5;
    }

    // Email confidence bonus (10 points max)
    breakdown.emailConfidence = Math.round((lead.emailConfidence / 100) * 10);

    const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);
    return { totalScore, breakdown };
  }

  // Keep all your existing methods below...
  async findInternalExperts(entities, question, limit) {
    // ... existing code ...
  }

  calculateExpertScore(expert, entities, question) {
    // ... existing code ...
  }

  calculateSeniorityScore(required, currentRole) {
    // ... existing code ...
  }

  calculateExpertCost(expert, question) {
    // ... existing code ...
  }

  prepareExternalSearch(entities, question, matchCount) {
    // Updated to include expertLeadMatches
    if (matchCount >= 5) return null;

    return {
      searchQuery: this.buildSearchQuery(entities),
      budget: question.escrowSource?.amount || 0,
      offerAmount: this.calculateExternalOfferAmount(question),
      outreachMessage: this.generateOutreachMessage(question, entities)
    };
  }

  buildSearchQuery(entities) {
    // ... existing code ...
  }

  calculateExternalOfferAmount(question) {
    // ... existing code ...
  }

  generateOutreachMessage(question, entities) {
    // ... existing code ...
  }

  async notifyMatchedExperts(matchingResults) {
    const notifications = [];
    
    // Existing internal expert notifications
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

    // NEW: ExpertLead notifications (email-based)
    for (const match of matchingResults.expertLeadMatches || []) {
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
          estimatedCost: match.estimatedCost
        }
      });
    }

    return notifications;
  }
}

module.exports = new MatchingService();
