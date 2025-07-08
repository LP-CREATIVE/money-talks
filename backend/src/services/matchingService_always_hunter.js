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
      useHunterApi = true  // Always use Hunter API by default
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
    
    // ALWAYS search Hunter.io API for external experts
    let externalExperts = [];
    if (includeExternal && useHunterApi) {
      console.log(`🔍 Searching Hunter.io API for experts...`);
      const hunterResults = await this.searchHunterRealtime(entities, question);
      
      // Optionally store in database for record keeping (but always search fresh)
      if (hunterResults.length > 0) {
        await this.storeNewExpertLeads(hunterResults);
        externalExperts = hunterResults;
      }
    }
    
    let externalSearchParams = null;
    let linkedInProfiles = [];
    
    // Only do LinkedIn search if we still don't have enough matches
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

  // Real-time Hunter.io search - ALWAYS CALLED
  async searchHunterRealtime(entities, question) {
    const apiKey = process.env.HUNTER_API_KEY;
    if (!apiKey) {
      console.log('❌ Hunter.io API key not configured');
      return [];
    }

    console.log('\n🚀 Starting Hunter.io API search...');
    console.log('📊 Entities:', JSON.stringify(entities, null, 2));
    
    const experts = [];
    const searchedDomains = new Set(); // Avoid duplicate searches
    
    // 1. Search by specific companies mentioned
    if (entities.companies?.length > 0) {
      for (const company of entities.companies) {
        try {
          const domain = this.guessDomain(company);
          if (searchedDomains.has(domain)) continue;
          searchedDomains.add(domain);
          
          console.log(`\n🏢 Searching ${company} (${domain})...`);
          
          const response = await axios.get('https://api.hunter.io/v2/domain-search', {
            params: {
              domain: domain,
              api_key: apiKey,
              department: this.mapEntitiesToDepartment(entities),
              seniority: 'senior,executive',
              limit: 15  // Get more results
            }
          });

          if (response.data.data.emails) {
            const emails = response.data.data.emails;
            console.log(`✅ Found ${emails.length} people at ${company}`);
            
            // Score and filter based on relevance
            const companyExperts = emails
              .map(person => {
                const relevanceScore = this.calculateRelevance(person, entities);
                return {
                  firstName: person.first_name || 'Unknown',
                  lastName: person.last_name || 'Unknown',
                  email: person.value,
                  emailConfidence: person.confidence || 85,
                  emailSource: 'hunter.io_api',
                  title: person.position,
                  company: company,
                  department: person.department,
                  seniority: person.seniority,
                  linkedinUrl: person.linkedin,
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
              .slice(0, 10); // Take top 10 most relevant
            
            experts.push(...companyExperts);
          }
        } catch (error) {
          if (error.response?.status === 429) {
            console.error(`⚠️ Hunter.io rate limit reached`);
            break;
          }
          console.error(`❌ Error searching ${company}:`, error.response?.data?.errors?.[0]?.details || error.message);
        }
      }
    }

    // 2. If no companies specified, search by industry
    if (experts.length === 0 && entities.industries?.length > 0) {
      console.log('\n🏭 No company-specific results, searching by industry...');
      
      const industryDomains = {
        'technology': ['apple.com', 'google.com', 'microsoft.com', 'amazon.com', 'meta.com'],
        'finance': ['goldmansachs.com', 'jpmorgan.com', 'morganstanley.com', 'bankofamerica.com'],
        'automotive': ['tesla.com', 'gm.com', 'ford.com', 'rivian.com'],
        'healthcare': ['jnj.com', 'pfizer.com', 'unitedhealth.com', 'cvs.com'],
        'retail': ['walmart.com', 'target.com', 'costco.com', 'amazon.com'],
        'consulting': ['mckinsey.com', 'bain.com', 'bcg.com', 'deloitte.com']
      };

      for (const industry of entities.industries) {
        const domains = industryDomains[industry.toLowerCase()] || [];
        
        for (const domain of domains.slice(0, 3)) { // Limit to 3 companies per industry
          if (searchedDomains.has(domain)) continue;
          searchedDomains.add(domain);
          
          try {
            console.log(`🔍 Searching ${domain} for ${industry} experts...`);
            
            const response = await axios.get('https://api.hunter.io/v2/domain-search', {
              params: {
                domain: domain,
                api_key: apiKey,
                department: this.mapEntitiesToDepartment(entities),
                seniority: 'senior,executive',
                limit: 5
              }
            });

            if (response.data.data.emails) {
              const industryExperts = response.data.data.emails
                .map(person => ({
                  firstName: person.first_name || 'Unknown',
                  lastName: person.last_name || 'Unknown',
                  email: person.value,
                  emailConfidence: person.confidence || 85,
                  emailSource: 'hunter.io_api',
                  title: person.position,
                  company: domain.replace('.com', '').toUpperCase(),
                  department: person.department,
                  seniority: person.seniority,
                  linkedinUrl: person.linkedin,
                  skills: [],
                  status: 'PENDING_OUTREACH',
                  relevanceScore: this.calculateRelevance(person, entities)
                }))
                .filter(person => person.relevanceScore > 0);
              
              experts.push(...industryExperts);
            }
          } catch (error) {
            console.error(`Error searching ${domain}:`, error.message);
          }
        }
      }
    }

    // 3. If still no results, try topic-based search
    if (experts.length === 0 && entities.topics?.length > 0) {
      console.log('\n🎯 Searching based on topics...');
      
      const topicCompanyMap = {
        'battery': ['tesla.com', 'panasonic.com', 'lg.com'],
        'supply chain': ['amazon.com', 'fedex.com', 'ups.com'],
        'ai': ['openai.com', 'google.com', 'microsoft.com'],
        'cloud': ['aws.amazon.com', 'microsoft.com', 'google.com']
      };

      for (const topic of entities.topics) {
        const domains = topicCompanyMap[topic.toLowerCase()] || [];
        for (const domain of domains.slice(0, 2)) {
          if (searchedDomains.has(domain)) continue;
          // Similar search logic...
        }
      }
    }

    console.log(`\n✅ Total experts found: ${experts.length}`);
    
    // Return formatted experts sorted by relevance
    return experts
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 20) // Return top 20
      .map(expert => this.formatHunterExpert(expert, entities, question));
  }

  // Calculate how relevant an expert is to the question
  calculateRelevance(person, entities) {
    let score = 0;
    
    if (!person.position) return 0;
    
    const positionLower = person.position.toLowerCase();
    
    // Topic matching (highest weight)
    if (entities.topics?.length > 0) {
      entities.topics.forEach(topic => {
        if (positionLower.includes(topic.toLowerCase())) {
          score += 30;
        }
      });
    }
    
    // Functional expertise matching
    if (entities.functionalExpertise) {
      const expertise = entities.functionalExpertise.toLowerCase();
      if (positionLower.includes(expertise)) {
        score += 25;
      }
    }
    
    // Department relevance
    if (person.department) {
      const deptScore = {
        'executive': 20,
        'finance': entities.topics?.some(t => t.toLowerCase().includes('cost') || t.toLowerCase().includes('finance')) ? 15 : 5,
        'it': entities.topics?.some(t => t.toLowerCase().includes('tech') || t.toLowerCase().includes('battery')) ? 15 : 5,
        'operations': entities.topics?.some(t => t.toLowerCase().includes('supply')) ? 15 : 5
      };
      score += deptScore[person.department] || 0;
    }
    
    // Seniority bonus
    const seniorityBonus = {
      'executive': 15,
      'senior': 10,
      'junior': 2
    };
    score += seniorityBonus[person.seniority] || 5;
    
    // Confidence in email
    score += Math.round((person.confidence || 0) / 10);
    
    return score;
  }

  // Format Hunter expert for response
  formatHunterExpert(expert, entities, question) {
    const score = this.calculateExpertLeadScore(expert, entities);
    
    return {
      expertLeadId: expert.email, // Use email as temporary ID
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

  // Store in database (optional, for record keeping)
  async storeNewExpertLeads(experts) {
    const stored = [];
    
    for (const expert of experts) {
      try {
        // Only store the basic expert data, not the formatted response
        const expertData = {
          firstName: expert.firstName,
          lastName: expert.lastName,
          email: expert.email,
          emailConfidence: expert.emailConfidence,
          emailSource: expert.emailSource,
          title: expert.currentRole || expert.title,
          company: expert.currentEmployer || expert.company,
          department: expert.department,
          seniority: expert.seniority,
          linkedinUrl: expert.linkedinUrl,
          skills: expert.skills || [],
          status: 'PENDING_OUTREACH'
        };
        
        // Check if already exists
        const existing = await prisma.expertLead.findUnique({
          where: { email: expertData.email }
        });
        
        if (!existing) {
          const created = await prisma.expertLead.create({
            data: expertData
          });
          stored.push(created);
        } else {
          // Update confidence if higher
          if (expertData.emailConfidence > (existing.emailConfidence || 0)) {
            await prisma.expertLead.update({
              where: { email: expertData.email },
              data: { 
                emailConfidence: expertData.emailConfidence,
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

  // Helper to guess company domain
  guessDomain(company) {
    const cleaned = company.toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    
    // Comprehensive domain mapping
    const knownDomains = {
      'tesla': 'tesla.com',
      'google': 'google.com',
      'alphabet': 'google.com',
      'microsoft': 'microsoft.com',
      'apple': 'apple.com',
      'goldmansachs': 'goldmansachs.com',
      'jpmorgan': 'jpmorgan.com',
      'jpmorganchase': 'jpmorgan.com',
      'morganstanley': 'morganstanley.com',
      'bankofamerica': 'bankofamerica.com',
      'wellsfargo': 'wellsfargo.com',
      'uber': 'uber.com',
      'amazon': 'amazon.com',
      'meta': 'meta.com',
      'facebook': 'meta.com',
      'netflix': 'netflix.com',
      'salesforce': 'salesforce.com',
      'oracle': 'oracle.com',
      'ibm': 'ibm.com',
      'intel': 'intel.com',
      'cisco': 'cisco.com',
      'adobe': 'adobe.com',
      'nvidia': 'nvidia.com',
      'paypal': 'paypal.com',
      'airbnb': 'airbnb.com',
      'spotify': 'spotify.com',
      'twitter': 'twitter.com',
      'x': 'x.com',
      'snap': 'snap.com',
      'pinterest': 'pinterest.com',
      'linkedin': 'linkedin.com',
      'mckinsey': 'mckinsey.com',
      'bain': 'bain.com',
      'bcg': 'bcg.com',
      'deloitte': 'deloitte.com',
      'pwc': 'pwc.com',
      'ey': 'ey.com',
      'kpmg': 'kpmg.com',
      'accenture': 'accenture.com'
    };
    
    return knownDomains[cleaned] || `${cleaned}.com`;
  }

  // Map entities to Hunter.io departments
  mapEntitiesToDepartment(entities) {
    if (entities.functionalExpertise) {
      const expertise = entities.functionalExpertise.toLowerCase();
      if (expertise.includes('finance') || expertise.includes('accounting')) return 'finance';
      if (expertise.includes('tech') || expertise.includes('engineering')) return 'it';
      if (expertise.includes('sales')) return 'sales';
      if (expertise.includes('marketing')) return 'marketing';
      if (expertise.includes('hr') || expertise.includes('human')) return 'hr';
      if (expertise.includes('legal')) return 'legal';
      if (expertise.includes('executive') || expertise.includes('strategy')) return 'executive';
      if (expertise.includes('operations') || expertise.includes('supply')) return 'operations';
    }
    
    // Check topics for department hints
    if (entities.topics?.length > 0) {
      const topicsStr = entities.topics.join(' ').toLowerCase();
      if (topicsStr.includes('battery') || topicsStr.includes('manufacturing') || topicsStr.includes('engineering')) return 'it';
      if (topicsStr.includes('supply chain') || topicsStr.includes('logistics')) return 'operations';
      if (topicsStr.includes('finance') || topicsStr.includes('cost') || topicsStr.includes('revenue')) return 'finance';
      if (topicsStr.includes('marketing') || topicsStr.includes('brand')) return 'marketing';
      if (topicsStr.includes('strategy') || topicsStr.includes('executive')) return 'executive';
    }
    
    return null; // Search all departments if no clear match
  }

  calculateExpertLeadScore(lead, entities) {
    const breakdown = {
      companyMatch: 0,
      titleMatch: 0,
      seniorityBonus: 0,
      emailConfidence: 0,
      departmentMatch: 0
    };

    // Company match (40 points max)
    if (entities.companies?.length > 0 && lead.company) {
      entities.companies.forEach(company => {
        if (lead.company.toLowerCase().includes(company.toLowerCase())) {
          breakdown.companyMatch = 40;
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

    // Department match (10 points)
    const targetDept = this.mapEntitiesToDepartment(entities);
    if (targetDept && lead.department === targetDept) {
      breakdown.departmentMatch = 10;
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

  // Keep all existing methods for internal experts unchanged...
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
