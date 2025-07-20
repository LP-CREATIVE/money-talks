const prisma = require('../utils/prisma');

class ExpertScoringService {
  async calculateExpertScore(expertId, questionId) {
    const expert = await prisma.expertProfile.findUnique({
      where: { userId: expertId },
      include: {
        user: true,
        employmentHistory: true,
        observablePatterns: true,
        expertiseAreas: true,
        companyRelationships: true,
        connections: true,
        ExpertAnswer: true
      }
    });

    const question = await prisma.validationQuestion.findUnique({
      where: { id: questionId },
      include: {
        idea: true
      }
    });

    if (!expert || !question) return { score: 0, breakdown: {} };

    const breakdown = {
      employment: 0,
      relationships: 0,
      observable: 0,
      geographic: 0,
      expertise: 0,
      network: 0,
      verification: 0,
      performance: 0
    };

    const targetCompany = this.extractCompanyFromQuestion(question);
    
    breakdown.employment = this.calculateEmploymentScore(expert, targetCompany);
    breakdown.relationships = this.calculateRelationshipScore(expert, targetCompany);
    breakdown.observable = this.calculateObservableScore(expert, targetCompany);
    breakdown.geographic = this.calculateGeographicScore(expert, question);
    breakdown.expertise = this.calculateExpertiseScore(expert, question);
    breakdown.network = this.calculateNetworkScore(expert, targetCompany);
    breakdown.verification = this.calculateVerificationScore(expert);
    breakdown.performance = this.calculatePerformanceScore(expert);

    const totalScore = Object.values(breakdown).reduce((a, b) => a + b, 0);

    return {
      totalScore,
      breakdown,
      expert: {
        id: expert.id,
        name: expert.fullName,
        currentRole: expert.currentRole,
        currentEmployer: expert.currentEmployer
      }
    };
  }

  extractCompanyFromQuestion(question) {
    const text = question.text.toLowerCase();
    const commonCompanies = ['microsoft', 'google', 'amazon', 'apple', 'meta', 'tesla'];
    
    for (const company of commonCompanies) {
      if (text.includes(company)) return company;
    }
    
    return question.idea?.sector || 'unknown';
  }

  calculateEmploymentScore(expert, targetCompany) {
    let score = 0;
    
    const currentEmployment = expert.employmentHistory.find(e => e.isCurrent);
    if (currentEmployment?.company.toLowerCase().includes(targetCompany.toLowerCase())) {
      score = 100;
    }
    
    const pastEmployment = expert.employmentHistory.find(e => 
      !e.isCurrent && e.company.toLowerCase().includes(targetCompany.toLowerCase())
    );
    if (pastEmployment) {
      const yearsAgo = (Date.now() - new Date(pastEmployment.endDate).getTime()) / (365 * 24 * 60 * 60 * 1000);
      score = Math.max(score, 80 - (yearsAgo * 10));
    }
    
    return score;
  }

  calculateRelationshipScore(expert, targetCompany) {
    const relationships = expert.companyRelationships.filter(r => 
      r.isActive && r.company.toLowerCase().includes(targetCompany.toLowerCase())
    );
    
    if (relationships.length === 0) return 0;
    
    const typeScores = {
      'direct_vendor': 70,
      'logistics_provider': 65,
      'service_provider': 60,
      'competitor': 50,
      'industry_peer': 40,
      'customer': 55,
      'partner': 60
    };
    
    return Math.max(...relationships.map(r => typeScores[r.relationshipType] || 30));
  }

  calculateObservableScore(expert, targetCompany) {
    const patterns = expert.observablePatterns.filter(p => 
      p.isActive && p.company.toLowerCase().includes(targetCompany.toLowerCase())
    );
    
    if (patterns.length === 0) return 0;
    
    let score = 0;
    patterns.forEach(pattern => {
      const recencyDays = (Date.now() - new Date(pattern.lastObserved).getTime()) / (24 * 60 * 60 * 1000);
      const recencyMultiplier = recencyDays < 30 ? 1.2 : recencyDays < 90 ? 1.0 : 0.8;
      const confidenceMultiplier = pattern.confidence / 100;
      
      score += 20 * recencyMultiplier * confidenceMultiplier;
    });
    
    return Math.min(score, 80);
  }

  calculateGeographicScore(expert, question) {
    return 20;
  }

  calculateExpertiseScore(expert, question) {
    const relevantExpertise = expert.expertiseAreas.filter(area => {
      const questionText = question.text.toLowerCase();
      return questionText.includes(area.value.toLowerCase());
    });
    
    if (relevantExpertise.length === 0) return 10;
    
    const maxProficiency = Math.max(...relevantExpertise.map(e => e.proficiencyLevel));
    return (maxProficiency / 100) * 60;
  }

  calculateNetworkScore(expert, targetCompany) {
    const relevantConnections = expert.connections.filter(c => 
      c.company.toLowerCase().includes(targetCompany.toLowerCase())
    );
    
    return Math.min(relevantConnections.length * 5, 40);
  }

  calculateVerificationScore(expert) {
    let multiplier = 1.0;
    
    if (expert.linkedinUrl) multiplier *= 1.1;
    if (expert.employerVerified) multiplier *= 1.1;
    if (expert.verificationLevel > 2) multiplier *= 1.2;
    
    return (multiplier - 1) * 100;
  }

  calculatePerformanceScore(expert) {
    if (expert.ExpertAnswer.length === 0) return 0;
    
    const avgRating = expert.ExpertAnswer.reduce((sum, a) => sum + (a.rating || 0), 0) / expert.ExpertAnswer.length;
    return avgRating * 10;
  }
}

module.exports = new ExpertScoringService();
