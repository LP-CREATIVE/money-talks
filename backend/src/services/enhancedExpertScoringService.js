const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class EnhancedExpertScoringService {
  constructor() {
    this.weights = {
      directEmployment: { current: 100, past: 80, decay: 10 },
      vendorRelationship: {
        direct_vendor: 70,
        logistics_provider: 65,
        service_provider: 60,
        competitor: 50,
        industry_peer: 40
      },
      observablePatterns: {
        TRAFFIC: 15,
        FACILITY: 20,
        SUPPLY_CHAIN: 25,
        WORKFORCE: 20,
        FINANCIAL: 30,
        TECHNOLOGY: 15
      },
      geography: {
        same_facility: 50,
        same_city: 40,
        same_region: 30,
        same_state: 20,
        same_country: 10
      },
      verification: {
        linkedinVerified: 1.1,
        emailDomainVerified: 1.1,
        colleagueEndorsements: 1.2,
        documentVerified: 1.15
      },
      recency: {
        lastActive7Days: 1.15,
        lastActive30Days: 1.05,
        observationLast30Days: 1.2
      }
    };
  }

  async calculateExpertScore(expert, question, entities) {
    let score = 0;
    let multiplier = 1;
    const breakdown = {};

    // Load full expert data with relations
    const fullExpert = await this.loadExpertWithRelations(expert.id);

    // Base Employment Score
    const employmentScore = await this.calculateEmploymentScore(fullExpert, entities);
    score += employmentScore.score;
    breakdown.employment = employmentScore;

    // Vendor/Partner Relationships
    const vendorScore = await this.calculateVendorScore(fullExpert, entities);
    score += vendorScore.score;
    breakdown.vendor = vendorScore;

    // Observable Access Score
    const observableScore = await this.calculateObservableScore(fullExpert, entities, question);
    score += observableScore.score;
    breakdown.observable = observableScore;

    // Geographic Proximity
    const geoScore = await this.calculateGeographicScore(fullExpert, entities);
    score += geoScore.score;
    breakdown.geography = geoScore;

    // Expertise Relevance
    const expertiseScore = this.calculateExpertiseScore(fullExpert, entities);
    score += expertiseScore.score;
    breakdown.expertise = expertiseScore;

    // Network Strength
    const networkScore = await this.calculateNetworkScore(fullExpert, entities);
    score += networkScore.score;
    breakdown.network = networkScore;

    // Performance Metrics
    const performanceScore = this.calculatePerformanceScore(fullExpert);
    score += performanceScore.score;
    breakdown.performance = performanceScore;

    // Apply multipliers
    multiplier = this.calculateMultipliers(fullExpert, question);

    const totalScore = Math.round(score * multiplier);

    return {
      expertId: expert.id,
      totalScore,
      breakdown,
      multiplier,
      confidence: this.calculateConfidence(breakdown),
      recommendationLevel: this.getRecommendationLevel(totalScore)
    };
  }

  async loadExpertWithRelations(expertId) {
    return await prisma.expertProfile.findUnique({
      where: { id: expertId },
      include: {
        user: true,
        employmentHistory: {
          orderBy: { startDate: 'desc' }
        },
        observablePatterns: {
          where: { isActive: true }
        },
        connections: true,
        expertiseAreas: true,
        companyRelationships: {
          where: { isActive: true }
        },
        ExpertAnswer: {
          include: {
            answer: {
              include: {
                question: true
              }
            }
          }
        }
      }
    });
  }

  async calculateEmploymentScore(expert, entities) {
    const scores = [];
    let maxScore = 0;

    if (!entities.companies || entities.companies.length === 0) {
      return { score: 0, details: [] };
    }

    for (const company of entities.companies) {
      // Check current employment
      const currentMatch = expert.employmentHistory.find(
        emp => emp.isCurrent && this.matchCompany(emp.company, company)
      );

      if (currentMatch) {
        const score = this.weights.directEmployment.current;
        scores.push({
          company,
          type: 'current_employment',
          score,
          details: currentMatch
        });
        maxScore = Math.max(maxScore, score);
        continue;
      }

      // Check past employment
      const pastMatches = expert.employmentHistory.filter(
        emp => !emp.isCurrent && this.matchCompany(emp.company, company)
      );

      for (const match of pastMatches) {
        const yearsAgo = this.calculateYearsSince(match.endDate);
        const baseScore = this.weights.directEmployment.past;
        const decay = yearsAgo * this.weights.directEmployment.decay;
        const score = Math.max(baseScore - decay, 20);

        scores.push({
          company,
          type: 'past_employment',
          score,
          yearsAgo,
          details: match
        });
        maxScore = Math.max(maxScore, score);
      }
    }

    return {
      score: maxScore,
      details: scores
    };
  }

  async calculateVendorScore(expert, entities) {
    const scores = [];
    let totalScore = 0;

    if (!entities.companies) return { score: 0, details: [] };

    // Check company relationships
    for (const company of entities.companies) {
      const relationships = expert.companyRelationships.filter(
        rel => this.matchCompany(rel.company, company)
      );

      for (const relationship of relationships) {
        const relationshipScore = this.weights.vendorRelationship[relationship.relationshipType.toLowerCase()] || 30;
        
        scores.push({
          company,
          relationship: relationship.relationshipType,
          score: relationshipScore,
          details: relationship
        });
        totalScore += relationshipScore;
      }
    }

    // Check connections for vendor relationships
    for (const company of entities.companies) {
      const connections = expert.connections.filter(
        conn => this.matchCompany(conn.company, company)
      );

      for (const connection of connections) {
        const relationshipScore = this.weights.vendorRelationship[connection.relationship.toLowerCase()] || 30;
        const trustMultiplier = connection.trustLevel / 100;
        const score = relationshipScore * trustMultiplier;

        scores.push({
          company,
          relationship: connection.relationship,
          score,
          trustLevel: connection.trustLevel,
          details: connection
        });
        totalScore += score;
      }
    }

    return {
      score: Math.min(totalScore, 70), // Cap at max vendor score
      details: scores
    };
  }

  async calculateObservableScore(expert, entities, question) {
    const scores = [];
    let totalScore = 0;

    if (!entities.companies) return { score: 0, details: [] };

    for (const company of entities.companies) {
      const patterns = expert.observablePatterns.filter(
        pattern => this.matchCompany(pattern.company, company)
      );

      for (const pattern of patterns) {
        const typeWeight = this.weights.observablePatterns[pattern.patternType] || 10;
        const recencyBonus = this.calculateRecencyBonus(pattern.lastObserved);
        const confidenceMultiplier = pattern.confidence / 100;
        
        const score = typeWeight * recencyBonus * confidenceMultiplier;

        scores.push({
          company,
          patternType: pattern.patternType,
          category: pattern.category,
          score,
          lastObserved: pattern.lastObserved,
          confidence: pattern.confidence,
          details: pattern
        });
        totalScore += score;
      }
    }

    return {
      score: Math.min(totalScore, 80), // Cap at max observable score
      details: scores
    };
  }

  async calculateGeographicScore(expert, entities) {
    // Simple implementation - you can enhance with actual location data
    if (!entities.locations || entities.locations.length === 0) {
      return { score: 0, details: [] };
    }

    // For now, give points if expert has patterns in the same city/region
    let maxScore = 0;
    const scores = [];

    for (const location of entities.locations) {
      let proximityLevel = 'different_country';
      let score = 0;
      
      // Check if expert has observable patterns in this location
      const hasLocalPatterns = expert.observablePatterns.some(
        p => p.company && entities.companies?.includes(p.company)
      );
      
      if (hasLocalPatterns) {
        proximityLevel = 'same_city';
        score = this.weights.geography.same_city;
      }

      scores.push({
        location: location.name || location,
        proximityLevel,
        score
      });
      maxScore = Math.max(maxScore, score);
    }

    return {
      score: maxScore,
      details: scores
    };
  }

  calculateExpertiseScore(expert, entities) {
    let score = 0;
    const matches = [];

    // Check expertise areas
    if (entities.topics && expert.expertiseAreas) {
      for (const area of expert.expertiseAreas) {
        for (const topic of entities.topics) {
          if (area.value.toLowerCase().includes(topic.toLowerCase()) ||
              topic.toLowerCase().includes(area.value.toLowerCase())) {
            const areaScore = 15 * (area.proficiencyLevel / 100);
            score += areaScore;
            matches.push({
              type: area.type,
              value: area.value,
              topic,
              score: areaScore
            });
          }
        }
      }
    }

    // Industry matching from profile
    if (entities.industries && expert.primaryIndustry) {
      for (const industry of entities.industries) {
        if (expert.primaryIndustry.toLowerCase() === industry.toLowerCase()) {
          score += 30;
          matches.push({ type: 'primary_industry', value: industry, score: 30 });
        }
      }
    }

    return {
      score: Math.min(score, 60), // Cap at max expertise score
      matches
    };
  }

  async calculateNetworkScore(expert, entities) {
    let score = 0;
    const networkDetails = [];

    if (!entities.companies) return { score: 0, details: [] };

    for (const company of entities.companies) {
      // Count connections at target company
      const companyConnections = expert.connections.filter(
        conn => this.matchCompany(conn.company, company)
      );

      const connectionScore = Math.min(companyConnections.length * 5, 20);
      score += connectionScore;

      // Bonus for connections who joined platform
      const joinedConnections = companyConnections.filter(conn => conn.connectedUserId);
      const joinedBonus = joinedConnections.length * 3;
      score += joinedBonus;

      networkDetails.push({
        company,
        connections: companyConnections.length,
        joinedConnections: joinedConnections.length,
        score: connectionScore + joinedBonus
      });
    }

    return {
      score: Math.min(score, 40), // Cap at max network score
      details: networkDetails
    };
  }

  calculatePerformanceScore(expert) {
    let score = 0;
    const metrics = {};

    // Accuracy score (0-100 scale, weighted)
    metrics.accuracy = expert.accuracyScore * 0.2;
    score += metrics.accuracy;

    // Response rate (0-1 scale, multiply by 10)
    metrics.responseRate = expert.responseRate * 10;
    score += metrics.responseRate;

    // Verification level (0-4 scale, multiply by 5)
    metrics.verification = expert.verificationLevel * 5;
    score += metrics.verification;

    // Experience (answer count)
    const answerCount = expert.ExpertAnswer?.length || 0;
    metrics.experience = Math.min(answerCount * 2, 20);
    score += metrics.experience;

    // Average response time bonus
    if (expert.averageResponseTime < 24) {
      metrics.speedBonus = 5;
      score += metrics.speedBonus;
    }

    return {
      score,
      metrics
    };
  }

  calculateMultipliers(expert, question) {
    let multiplier = 1;

    // Verification multipliers
    if (expert.user?.isVerified) multiplier *= this.weights.verification.emailDomainVerified;
    if (expert.linkedinVerified) multiplier *= this.weights.verification.linkedinVerified;
    
    // Activity recency
    const daysSinceActive = this.calculateDaysSince(expert.lastActiveDate);
    if (daysSinceActive < 7) {
      multiplier *= this.weights.recency.lastActive7Days;
    } else if (daysSinceActive < 30) {
      multiplier *= this.weights.recency.lastActive30Days;
    }

    // Recent observations bonus
    const hasRecentObservations = expert.observablePatterns?.some(
      p => this.calculateDaysSince(p.lastObserved) < 30
    );
    if (hasRecentObservations) {
      multiplier *= this.weights.recency.observationLast30Days;
    }

    // Urgency multiplier for top questions
    if (question.isTop3) multiplier *= 1.2;

    return multiplier;
  }

  // Helper methods
  matchCompany(company1, company2) {
    const normalize = (str) => str.toLowerCase().trim()
      .replace(/\b(inc|llc|ltd|limited|corp|corporation|company|co)\b\.?$/i, '');
    
    return normalize(company1) === normalize(company2);
  }

  calculateYearsSince(date) {
    if (!date) return 0;
    const years = (new Date() - new Date(date)) / (365 * 24 * 60 * 60 * 1000);
    return Math.round(years * 10) / 10;
  }

  calculateDaysSince(date) {
    if (!date) return 999;
    return Math.floor((new Date() - new Date(date)) / (24 * 60 * 60 * 1000));
  }

  calculateRecencyBonus(date) {
    const days = this.calculateDaysSince(date);
    if (days < 30) return 1.2;
    if (days < 90) return 1.0;
    if (days < 180) return 0.8;
    return 0.6;
  }

  calculateConfidence(breakdown) {
    // Calculate confidence based on number and quality of signals
    let signals = 0;
    let totalWeight = 0;

    if (breakdown.employment?.score > 0) {
      signals++;
      totalWeight += breakdown.employment.score;
    }
    if (breakdown.vendor?.score > 0) {
      signals++;
      totalWeight += breakdown.vendor.score * 0.8;
    }
    if (breakdown.observable?.score > 0) {
      signals++;
      totalWeight += breakdown.observable.score * 0.9;
    }
    if (breakdown.network?.score > 0) {
      signals++;
      totalWeight += breakdown.network.score * 0.6;
    }

    if (signals === 0) return 0;
    
    const avgWeight = totalWeight / signals;
    const signalBonus = Math.min(signals * 0.1, 0.3);
    
    return Math.min((avgWeight / 100) + signalBonus, 1);
  }

  getRecommendationLevel(score) {
    if (score >= 150) return 'HIGHLY_RECOMMENDED';
    if (score >= 100) return 'RECOMMENDED';
    if (score >= 50) return 'SUITABLE';
    if (score >= 25) return 'POSSIBLE';
    return 'LOW_MATCH';
  }
}

module.exports = new EnhancedExpertScoringService();
