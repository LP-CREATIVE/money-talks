const { PrismaClient } = require('@prisma/client');
const nlpService = require('./nlpService');

const prisma = new PrismaClient();

class MatchingService {
  async findMatchingExperts(questionId, options = {}) {
    const { 
      limit = 20, 
      includeExternal = true,
      minVerificationLevel = 1 
    } = options;

    // Get question details
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

    // Extract entities from question
    const entities = await nlpService.extractQuestionEntities(question.text);
    
    // Find internal experts
    const internalMatches = await this.findInternalExperts(entities, question, limit);
    
    // Prepare external search parameters if needed
    const externalSearchParams = includeExternal ? 
      this.prepareExternalSearch(entities, question, internalMatches.length) : null;

    return {
      question,
      entities,
      internalMatches,
      externalSearchParams,
      escrowAvailable: question.escrowSource?.amount || 0
    };
  }

  async findInternalExperts(entities, question, limit) {
    // Get all verified experts
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

    // Score each expert
    const scoredExperts = experts.map(expert => {
      const score = this.calculateExpertScore(expert, entities, question);
      return { expert, ...score };
    });

    // Sort by total score and return top matches
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
        estimatedCost: this.calculateExpertCost(item.expert, question)
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

    // Company match (highest weight)
    if (entities.companies?.length > 0) {
      entities.companies.forEach(company => {
        if (expert.currentEmployer?.toLowerCase().includes(company.toLowerCase())) {
          breakdown.companyMatch += 50;
        }
        // Check past experience in expert answers
        if (expert.ExpertAnswer && Array.isArray(expert.ExpertAnswer)) {
          expert.ExpertAnswer.forEach(ea => {
            if (ea.answer.question.idea.title?.toLowerCase().includes(company.toLowerCase())) {
              breakdown.companyMatch += 10;
            }
          });
        }
      });
    }

    // Industry match
    if (entities.industries?.length > 0) {
      entities.industries.forEach(industry => {
        if (expert.primaryIndustry?.toLowerCase() === industry.toLowerCase()) {
          breakdown.industryMatch += 30;
        } else if (expert.secondaryIndustries?.includes(industry)) {
          breakdown.industryMatch += 20;
        }
      });
    }

    // Topic match
    if (entities.topics?.length > 0) {
      entities.topics.forEach(topic => {
        if (expert.specificExpertiseTags?.some(tag => 
          tag.toLowerCase().includes(topic.toLowerCase())
        )) {
          breakdown.topicMatch += 15;
        }
      });
    }

    // Geography match
    if (entities.geography && expert.geographicExpertise?.includes(entities.geography)) {
      breakdown.geographyMatch = 10;
    }

    // Seniority match
    breakdown.seniorityMatch = this.calculateSeniorityScore(
      entities.seniorityRequired, 
      expert.currentRole
    );

    // Performance metrics
    breakdown.performanceScore = 
      (expert.accuracyScore * 0.2) + 
      (expert.responseRate * 10) + 
      (expert.verificationLevel * 5);

    // Experience score (based on past answers)
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
    // Base cost calculation
    let baseCost = 100; // $100 base
    
    // Adjust for expert level
    baseCost *= (1 + (expert.verificationLevel * 0.25));
    
    // Adjust for performance
    baseCost *= (1 + (expert.accuracyScore / 100));
    
    // Adjust for response rate
    if (expert.responseRate > 0.9) baseCost *= 1.2;
    
    // Cap at question budget
    const maxBudget = question.escrowSource?.amount || 500;
    return Math.min(baseCost, maxBudget * 0.7); // Leave 30% margin
  }

  prepareExternalSearch(entities, question, internalMatchCount) {
    // Only search externally if we don't have enough internal matches
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
    return parts.join(' AND ');
  }

  calculateExternalOfferAmount(question) {
    const budget = question.escrowSource?.amount || 500;
    return budget * 0.8; // Offer 80% of budget for external
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
      // Create notification record (you'll need a notification model)
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

    // In production, you'd save these to database and trigger actual notifications
    return notifications;
  }
}

module.exports = new MatchingService();
