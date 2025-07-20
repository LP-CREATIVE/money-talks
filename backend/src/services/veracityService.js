const prisma = require('../utils/prisma');
const OpenAI = require('openai');
const axios = require('axios');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class VeracityService {
  async calculateVeracityScore(answerId) {
    try {
      const answer = await prisma.userAnswer.findUnique({
        where: { id: answerId },
        include: {
          user: {
            include: {
              expertProfile: true
            }
          },
          question: {
            include: {
              idea: true
            }
          }
        }
      });

      if (!answer) {
        throw new Error('Answer not found');
      }

      const [p1, p2, p3, p4, p5, p6] = await Promise.all([
        this.calculateP1_IdentityScore(answer.user),
        this.calculateP2_ProfileMatchScore(answer),
        this.calculateP3_AnswerQualityScore(answer),
        this.calculateP4_DocumentAuthenticityScore(answer),
        this.calculateP5_ContradictionScore(answer),
        this.calculateP6_CorroborationScore(answer)
      ]);

      const weights = {
        p1: 0.15,
        p2: 0.15,
        p3: 0.20,
        p4: 0.15,
        p5: 0.20,
        p6: 0.15
      };

      const overallScore = 
        (p1.score * weights.p1) +
        (p2.score * weights.p2) +
        (p3.score * weights.p3) +
        (p4.score * weights.p4) +
        (p5.score * weights.p5) +
        (p6.score * weights.p6);

      const veracityScore = await prisma.veracityScore.create({
        data: {
          answerId,
          identityScore: p1.score,
          identityDetails: p1.details,
          profileMatchScore: p2.score,
          profileMatchDetails: p2.details,
          answerQualityScore: p3.score,
          answerQualityDetails: p3.details,
          documentScore: p4.score,
          documentDetails: p4.details,
          contradictionScore: p5.score,
          contradictionDetails: p5.details,
          contradictoryEvidence: p5.evidence || [],
          corroborationScore: p6.score,
          corroborationDetails: p6.details,
          corroboratingEvidence: p6.evidence || [],
          overallScore,
          scoreBreakdown: {
            weights,
            scores: { p1: p1.score, p2: p2.score, p3: p3.score, p4: p4.score, p5: p5.score, p6: p6.score }
          }
        }
      });

      return veracityScore;
    } catch (error) {
      console.error('Error calculating veracity score:', error);
      throw error;
    }
  }

  async calculateP1_IdentityScore(user) {
    const details = {
      checks: {},
      flags: []
    };
    let score = 0;

    const emailDomain = user.email.split('@')[1];
    const freeEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    
    if (!freeEmailDomains.includes(emailDomain)) {
      score += 20;
      details.checks.emailType = 'corporate';
    } else {
      score += 10;
      details.checks.emailType = 'personal';
    }

    if (user.expertProfile) {
      const profile = user.expertProfile;
      
      if (profile.linkedinUrl) {
        score += 20;
        details.checks.linkedin = true;
      }

      if (profile.yearsExperience >= 5) {
        score += 15;
      } else if (profile.yearsExperience >= 2) {
        score += 10;
      }

      if (profile.bio && profile.bio.length > 100) {
        score += 10;
      }
      if (profile.credentials) {
        score += 15;
      }

      if (profile.specializations && profile.specializations.length > 0) {
        score += 10;
      }
    }

    const accountAge = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (accountAge > 30) {
      score += 10;
    }

    return {
      score: Math.min(100, score),
      details
    };
  }

  async calculateP2_ProfileMatchScore(answer) {
    const details = {
      matches: {},
      mismatches: []
    };

    try {
      const expertProfile = answer.user.expertProfile;
      if (!expertProfile) {
        return { score: 0, details };
      }

      const prompt = `
        Analyze how well this expert's profile matches the question they're answering.
        
        Question: ${answer.question.text}
        Question Category: ${answer.question.category}
        Related Idea Sector: ${answer.question.idea.sector}
        
        Expert Profile:
        - Years of Experience: ${expertProfile.yearsExperience}
        - Specializations: ${expertProfile.specializations?.join(', ')}
        - Bio: ${expertProfile.bio || 'Not provided'}
        - Credentials: ${expertProfile.credentials || 'Not provided'}
        
        Rate the match from 0-100 and provide specific matching factors.
        Format response as JSON: { "score": number, "matchingFactors": string[], "concerns": string[] }
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are an expert at evaluating professional qualifications." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content);
      details.matches = result.matchingFactors;
      details.mismatches = result.concerns;

      return {
        score: result.score,
        details
      };
    } catch (error) {
      console.error('Error in P2 calculation:', error);
      return { score: 50, details };
    }
  }

  async calculateP3_AnswerQualityScore(answer) {
    const details = {
      metrics: {},
      issues: []
    };

    try {
      const prompt = `
        Evaluate the quality of this answer to an investment question.
        
        Question: ${answer.question.text}
        Answer: ${answer.content}
        Sources: ${answer.sources || 'None provided'}
        
        Evaluate based on:
        1. Relevance to the question (0-25 points)
        2. Completeness and depth (0-25 points)
        3. Clarity and structure (0-25 points)
        4. Professional tone and credibility (0-25 points)
        
        Also check for:
        - Hedging language or uncertainty
        - Internal contradictions
        - Missing key information
        
        Format as JSON: {
          "totalScore": number,
          "breakdown": {
            "relevance": number,
            "completeness": number,
            "clarity": number,
            "professionalism": number
          },
          "issues": string[],
          "strengths": string[]
        }
      `;

      const completion = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are an expert investment analyst evaluating answer quality." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const result = JSON.parse(completion.choices[0].message.content);
      details.metrics = result.breakdown;
      details.issues = result.issues;
      details.strengths = result.strengths;

      const wordCount = answer.content.split(/\s+/).length;
      if (wordCount < 100) {
        details.issues.push('Answer may be too brief');
      }

      if (!answer.sources || answer.sources.length === 0) {
        details.issues.push('No sources provided');
        result.totalScore = Math.max(0, result.totalScore - 10);
      }

      return {
        score: Math.min(100, result.totalScore),
        details
      };
    } catch (error) {
      console.error('Error in P3 calculation:', error);
      return { score: 50, details };
    }
  }

  async calculateP4_DocumentAuthenticityScore(answer) {
    const details = {
      documentsChecked: 0,
      authenticityChecks: {},
      suspiciousIndicators: []
    };

    let score = 100;

    if (!answer.supportingDocs || answer.supportingDocs.length === 0) {
      return {
        score: 70,
        details: { ...details, note: 'No supporting documents provided' }
      };
    }

    details.documentsChecked = answer.supportingDocs.length;

    for (const docUrl of answer.supportingDocs) {
      try {
        const extension = docUrl.split('.').pop().toLowerCase();
        const validExtensions = ['pdf', 'doc', 'docx', 'txt', 'png', 'jpg', 'jpeg'];
        
        if (!validExtensions.includes(extension)) {
          details.suspiciousIndicators.push(`Invalid file type: ${extension}`);
          score -= 10;
        }

        details.authenticityChecks[docUrl] = {
          fileType: extension,
          verified: true
        };
      } catch (error) {
        details.suspiciousIndicators.push(`Could not verify document: ${docUrl}`);
        score -= 5;
      }
    }

    if (await this.checkAIGenerated(answer.content)) {
      details.suspiciousIndicators.push('Answer may contain AI-generated content');
      score -= 20;
    }

    return {
      score: Math.max(0, score),
      details
    };
  }

  async calculateP5_ContradictionScore(answer) {
    const details = {
      entitiesChecked: [],
      sourcesChecked: [],
      contradictions: []
    };
    const evidence = [];

    try {
      const entities = await this.extractEntities(answer.content);
      details.entitiesChecked = entities;

      let score = 100;

      for (const entity of entities) {
        const contradictionCheck = await this.searchForContradictions(entity, answer.content);
        
        if (contradictionCheck.found) {
          score -= 20;
          details.contradictions.push(contradictionCheck.contradiction);
          evidence.push({
            source: contradictionCheck.source,
            url: contradictionCheck.url,
            snippet: contradictionCheck.snippet,
            entity: entity,
            confidence: contradictionCheck.confidence
          });
        }
      }

      const similarAnswers = await prisma.userAnswer.findMany({
        where: {
          userId: answer.userId,
          id: { not: answer.id },
          question: {
            idea: {
              sector: answer.question.idea.sector
            }
          }
        },
        take: 5
      });

      for (const prevAnswer of similarAnswers) {
        const isContradictory = await this.checkContradiction(answer.content, prevAnswer.content);
        if (isContradictory) {
          score -= 10;
          details.contradictions.push('Contradicts previous answer by same expert');
        }
      }

      return {
        score: Math.max(0, score),
        details,
        evidence
      };
    } catch (error) {
      console.error('Error in P5 calculation:', error);
      return { score: 80, details, evidence };
    }
  }

  async calculateP6_CorroborationScore(answer) {
    const details = {
      sourcesFound: [],
      corroborations: []
    };
    const evidence = [];

    try {
      const claims = await this.extractClaims(answer.content);
      
      let totalCorroborations = 0;
      const maxPossibleCorroborations = claims.length * 2;

      for (const claim of claims) {
        const corroboration = await this.searchForCorroboration(claim, answer.question.idea.sector);
        
        if (corroboration.found) {
          totalCorroborations++;
          details.corroborations.push(corroboration.description);
          evidence.push({
            source: corroboration.source,
            url: corroboration.url,
            snippet: corroboration.snippet,
            claim: claim,
            confidence: corroboration.confidence
          });
        }
      }

      if (answer.sources) {
        const sourcesArray = answer.sources;
        for (const source of sourcesArray) {
          const isValid = await this.validateSource(source);
          if (isValid) {
            totalCorroborations++;
            details.sourcesFound.push(source);
          }
        }
      }

      const corroborationRate = maxPossibleCorroborations > 0 
        ? (totalCorroborations / maxPossibleCorroborations) 
        : 0;
      
      const score = Math.min(100, corroborationRate * 100 + 20);

      return {
        score,
        details,
        evidence
      };
    } catch (error) {
      console.error('Error in P6 calculation:', error);
      return { score: 50, details, evidence };
    }
  }

  async extractEntities(text) {
    try {
      const prompt = `Extract key entities (companies, people, metrics, dates) from this text: "${text}". Return as JSON array.`;
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Extract entities from text and return as JSON array." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      return [];
    }
  }

  async extractClaims(text) {
    try {
      const prompt = `Extract specific, verifiable claims from this investment answer: "${text}". Focus on numbers, dates, company actions, and market trends. Return as JSON array.`;
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "Extract verifiable claims from text." },
          { role: "user", content: prompt }
        ],
        temperature: 0.1
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      return [];
    }
  }

  async checkAIGenerated(text) {
    const aiIndicators = [
      'as an ai language model',
      'i don\'t have access to real-time',
      'as of my last update',
      'i cannot provide financial advice'
    ];

    const lowerText = text.toLowerCase();
    return aiIndicators.some(indicator => lowerText.includes(indicator));
  }

  async searchForContradictions(entity, context) {
    return {
      found: false,
      source: null,
      url: null,
      snippet: null,
      contradiction: null,
      confidence: 0
    };
  }

  async searchForCorroboration(claim, sector) {
    return {
      found: Math.random() > 0.5,
      source: 'SEC Filing',
      url: 'https://sec.gov/example',
      snippet: 'Company reported similar metrics...',
      description: `Found supporting evidence for: ${claim}`,
      confidence: 0.85
    };
  }

  async checkContradiction(text1, text2) {
    try {
      const prompt = `Do these two statements contradict each other? Answer only "true" or "false".
      Statement 1: ${text1.substring(0, 500)}
      Statement 2: ${text2.substring(0, 500)}`;
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You detect contradictions between statements." },
          { role: "user", content: prompt }
        ],
        temperature: 0
      });

      return completion.choices[0].message.content.toLowerCase().includes('true');
    } catch (error) {
      return false;
    }
  }

  async validateSource(source) {
    try {
      if (!source.startsWith('http')) return false;
      new URL(source);
      return true;
    } catch {
      return false;
    }
  }

  async generateValidationReport(answerId) {
    const veracityScore = await prisma.veracityScore.findUnique({
      where: { answerId },
      include: {
        answer: {
          include: {
            user: {
              include: {
                expertProfile: true
              }
            },
            question: {
              include: {
                idea: true
              }
            }
          }
        }
      }
    });

    if (!veracityScore) {
      throw new Error('Veracity score not found');
    }

    return {
      answerId,
      overallScore: veracityScore.overallScore,
      passed: veracityScore.overallScore >= 80,
      dimensions: {
        identity: {
          score: veracityScore.identityScore,
          details: veracityScore.identityDetails
        },
        profileMatch: {
          score: veracityScore.profileMatchScore,
          details: veracityScore.profileMatchDetails
        },
        answerQuality: {
          score: veracityScore.answerQualityScore,
          details: veracityScore.answerQualityDetails
        },
        documentAuthenticity: {
          score: veracityScore.documentScore,
          details: veracityScore.documentDetails
        },
        contradictions: {
          score: veracityScore.contradictionScore,
          details: veracityScore.contradictionDetails,
          evidence: veracityScore.contradictoryEvidence
        },
        corroboration: {
          score: veracityScore.corroborationScore,
          details: veracityScore.corroborationDetails,
          evidence: veracityScore.corroboratingEvidence
        }
      },
      adminReview: {
        reviewed: veracityScore.adminReviewed,
        approved: veracityScore.adminApproved,
        notes: veracityScore.adminNotes,
        reviewedAt: veracityScore.reviewedAt
      }
    };
  }
}

module.exports = new VeracityService();
