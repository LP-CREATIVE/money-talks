const prisma = require('../utils/prisma');
const { addHours, isPast } = require('date-fns');

class QueueService {
  async buildExpertQueue(questionId) {
    try {
      const question = await prisma.validationQuestion.findUnique({
        where: { id: questionId },
        include: {
          idea: true
        }
      });

      if (!question) {
        throw new Error('Question not found');
      }

      const eligibleExperts = await this.findEligibleExperts(question);

      const queueEntries = eligibleExperts.map((expert, index) => ({
        questionId,
        expertId: expert.id,
        position: index + 1,
        status: 'WAITING'
      }));

      await prisma.expertQueue.createMany({
        data: queueEntries,
        skipDuplicates: true
      });

      if (eligibleExperts.length > 0) {
        await this.assignToExpert(questionId, eligibleExperts[0].id);
      }

      return queueEntries;
    } catch (error) {
      console.error('Error building expert queue:', error);
      throw error;
    }
  }

  async findEligibleExperts(question) {
    const experts = await prisma.user.findMany({
      where: {
        userType: 'EXPERT',
        expertProfile: {
          isNot: null,
          isApproved: true
        }
      },
      include: {
        expertProfile: true,
        expertRanking: true
      }
    });

    const scoredExperts = await Promise.all(
      experts.map(async (expert) => {
        const score = await this.calculateExpertRelevanceScore(expert, question);
        return { ...expert, relevanceScore: score };
      })
    );

    scoredExperts.sort((a, b) => {
      const scoreA = a.relevanceScore + (a.expertRanking?.overallScore || 0);
      const scoreB = b.relevanceScore + (b.expertRanking?.overallScore || 0);
      return scoreB - scoreA;
    });

    return scoredExperts.slice(0, 10);
  }

  async calculateExpertRelevanceScore(expert, question) {
    let score = 0;

    if (!expert.expertProfile) return 0;

    const profile = expert.expertProfile;

    if (profile.specializations) {
      const questionSector = question.idea.sector.toLowerCase();
      const expertSectors = profile.specializations.map(s => s.toLowerCase());
      
      if (expertSectors.includes(questionSector)) {
        score += 50;
      } else {
        const relatedSectors = this.getRelatedSectors(questionSector);
        const hasRelated = expertSectors.some(s => relatedSectors.includes(s));
        if (hasRelated) {
          score += 25;
        }
      }
    }

    if (profile.yearsExperience >= 10) {
      score += 20;
    } else if (profile.yearsExperience >= 5) {
      score += 10;
    }

    const previousAnswers = await prisma.userAnswer.count({
      where: {
        userId: expert.id,
        question: {
          category: question.category
        },
        paymentStatus: 'PAID'
      }
    });

    score += Math.min(20, previousAnswers * 5);

    const currentAssignments = await prisma.validationQuestion.count({
      where: {
        assignedExpertId: expert.id,
        status: 'ASSIGNED',
        assignmentDeadline: {
          gt: new Date()
        }
      }
    });

    if (currentAssignments === 0) {
      score += 10;
    }

    return score;
  }

  async assignToExpert(questionId, expertId) {
    try {
      const deadline = addHours(new Date(), 3);

      await prisma.validationQuestion.update({
        where: { id: questionId },
        data: {
          assignedExpertId: expertId,
          assignedAt: new Date(),
          assignmentDeadline: deadline,
          status: 'ASSIGNED'
        }
      });

      await prisma.expertQueue.update({
        where: {
          questionId_expertId: {
            questionId,
            expertId
          }
        },
        data: {
          status: 'ASSIGNED',
          assignedAt: new Date()
        }
      });

      await this.notifyExpertOfAssignment(expertId, questionId);

      return { expertId, deadline };
    } catch (error) {
      console.error('Error assigning to expert:', error);
      throw error;
    }
  }

  async acceptAssignment(questionId, expertId) {
    const question = await prisma.validationQuestion.findUnique({
      where: { id: questionId },
      include: {
        assignedExpert: true
      }
    });

    if (!question) {
      throw new Error('Question not found');
    }

    if (question.assignedExpertId !== expertId) {
      throw new Error('You are not assigned to this question');
    }

    if (question.status !== 'ASSIGNED') {
      throw new Error('Question is not available for acceptance');
    }

    if (isPast(question.assignmentDeadline)) {
      throw new Error('Assignment has expired');
    }

    await prisma.expertQueue.update({
      where: {
        questionId_expertId: {
          questionId,
          expertId
        }
      },
      data: {
        respondedAt: new Date()
      }
    });

    return { accepted: true, deadline: question.assignmentDeadline };
  }

  async declineAssignment(questionId, expertId) {
    const question = await prisma.validationQuestion.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      throw new Error('Question not found');
    }

    if (question.assignedExpertId !== expertId) {
      throw new Error('You are not assigned to this question');
    }

    await prisma.expertQueue.update({
      where: {
        questionId_expertId: {
          questionId,
          expertId
        }
      },
      data: {
        status: 'DECLINED',
        respondedAt: new Date()
      }
    });

    await this.moveToNextExpert(questionId);

    return { declined: true };
  }

  async moveToNextExpert(questionId) {
    try {
      const nextExpert = await prisma.expertQueue.findFirst({
        where: {
          questionId,
          status: 'WAITING'
        },
        orderBy: {
          position: 'asc'
        }
      });

      if (!nextExpert) {
        await prisma.validationQuestion.update({
          where: { id: questionId },
          data: {
            status: 'NO_EXPERTS_AVAILABLE',
            assignedExpertId: null,
            assignedAt: null,
            assignmentDeadline: null
          }
        });
        return null;
      }

      await prisma.validationQuestion.update({
        where: { id: questionId },
        data: {
          assignedExpertId: null,
          assignedAt: null,
          assignmentDeadline: null,
          status: 'OPEN'
        }
      });

      await this.assignToExpert(questionId, nextExpert.expertId);

      return nextExpert.expertId;
    } catch (error) {
      console.error('Error moving to next expert:', error);
      throw error;
    }
  }

  async checkExpiredAssignments() {
    const expiredQuestions = await prisma.validationQuestion.findMany({
      where: {
        status: 'ASSIGNED',
        assignmentDeadline: {
          lt: new Date()
        }
      }
    });

    for (const question of expiredQuestions) {
      try {
        await prisma.expertQueue.update({
          where: {
            questionId_expertId: {
              questionId: question.id,
              expertId: question.assignedExpertId
            }
          },
          data: {
            status: 'EXPIRED'
          }
        });

        await this.updateExpertMetricsForExpiry(question.assignedExpertId);
        await this.moveToNextExpert(question.id);
      } catch (error) {
        console.error(`Error handling expired assignment ${question.id}:`, error);
      }
    }
  }

  async getQueueStatus(questionId) {
    const queue = await prisma.expertQueue.findMany({
      where: { questionId },
      orderBy: { position: 'asc' },
      include: {
        expert: {
          include: {
            expertProfile: true,
            expertRanking: true
          }
        }
      }
    });

    const question = await prisma.validationQuestion.findUnique({
      where: { id: questionId },
      include: {
        assignedExpert: {
          include: {
            expertProfile: true
          }
        }
      }
    });

    return {
      question: {
        id: question.id,
        status: question.status,
        assignedExpert: question.assignedExpert,
        assignmentDeadline: question.assignmentDeadline
      },
      queue: queue.map(entry => ({
        position: entry.position,
        expert: {
          id: entry.expert.id,
          email: entry.expert.email,
          profile: entry.expert.expertProfile,
          ranking: entry.expert.expertRanking
        },
        status: entry.status,
        assignedAt: entry.assignedAt,
        respondedAt: entry.respondedAt
      }))
    };
  }

  async getNextAssignment(expertId) {
    const currentAssignment = await prisma.validationQuestion.findFirst({
      where: {
        assignedExpertId: expertId,
        status: 'ASSIGNED',
        assignmentDeadline: {
          gt: new Date()
        }
      },
      include: {
        idea: {
          select: {
            title: true,
            sector: true,
            summary: true
          }
        }
      }
    });

    if (currentAssignment) {
      return {
        hasAssignment: true,
        assignment: currentAssignment,
        timeRemaining: Math.floor((currentAssignment.assignmentDeadline - new Date()) / 1000 / 60)
      };
    }

    const nextInQueue = await prisma.expertQueue.findFirst({
      where: {
        expertId,
        status: 'WAITING',
        position: 1
      },
      include: {
        question: {
          include: {
            idea: {
              select: {
                title: true,
                sector: true,
                summary: true
              }
            }
          }
        }
      }
    });

    if (nextInQueue) {
      await this.assignToExpert(nextInQueue.questionId, expertId);
      
      return {
        hasAssignment: true,
        assignment: nextInQueue.question,
        timeRemaining: 180
      };
    }

    return {
      hasAssignment: false,
      assignment: null,
      timeRemaining: 0
    };
  }

  getRelatedSectors(sector) {
    const sectorRelations = {
      'technology': ['software', 'saas', 'ai', 'cybersecurity', 'fintech'],
      'healthcare': ['biotech', 'pharma', 'medical devices', 'healthtech'],
      'finance': ['banking', 'insurance', 'fintech', 'investment'],
      'retail': ['e-commerce', 'consumer goods', 'fashion'],
      'energy': ['renewable', 'oil & gas', 'utilities', 'cleantech']
    };

    const normalized = sector.toLowerCase();
    
    if (sectorRelations[normalized]) {
      return sectorRelations[normalized];
    }

    for (const [parent, children] of Object.entries(sectorRelations)) {
      if (children.includes(normalized)) {
        return [parent, ...children.filter(c => c !== normalized)];
      }
    }

    return [];
  }

  async updateExpertMetricsForExpiry(expertId) {
    const ranking = await prisma.expertRanking.findUnique({
      where: { expertId }
    });

    if (ranking) {
      const newPerformanceScore = Math.max(0, ranking.performanceScore - 5);
      
      await prisma.expertRanking.update({
        where: { expertId },
        data: {
          performanceScore: newPerformanceScore,
          lastCalculated: new Date()
        }
      });
    }
  }

  async notifyExpertOfAssignment(expertId, questionId) {
    const expert = await prisma.user.findUnique({
      where: { id: expertId }
    });

    const question = await prisma.validationQuestion.findUnique({
      where: { id: questionId },
      include: {
        idea: {
          select: {
            title: true,
            sector: true
          }
        }
      }
    });

    console.log(`Notification sent to ${expert.email} for question in ${question.idea.sector}`);
  }

  async updateExpertRankings() {
    const experts = await prisma.user.findMany({
      where: {
        userType: 'EXPERT',
        expertProfile: {
          isNot: null
        }
      },
      include: {
        expertRanking: true,
        answers: {
          where: {
            paymentStatus: 'PAID'
          }
        }
      }
    });

    for (const expert of experts) {
      const metrics = await this.calculateExpertMetrics(expert);
      
      if (expert.expertRanking) {
        await prisma.expertRanking.update({
          where: { id: expert.expertRanking.id },
          data: metrics
        });
      } else {
        await prisma.expertRanking.create({
          data: {
            expertId: expert.id,
            ...metrics
          }
        });
      }
    }

    const rankings = await prisma.expertRanking.findMany({
      orderBy: { overallScore: 'desc' }
    });

    for (let i = 0; i < rankings.length; i++) {
      await prisma.expertRanking.update({
        where: { id: rankings[i].id },
        data: { rank: i + 1 }
      });
    }
  }

  async calculateExpertMetrics(expert) {
    const answers = await prisma.userAnswer.findMany({
      where: {
        userId: expert.id
      },
      include: {
        veracityScoreDetail: true,
        question: true
      }
    });

    const paidAnswers = answers.filter(a => a.paymentStatus === 'PAID');
    const rejectedAnswers = answers.filter(a => a.paymentStatus === 'REJECTED');

    const responseTimes = answers
      .filter(a => a.question.assignedAt && a.createdAt)
      .map(a => (a.createdAt - a.question.assignedAt) / (1000 * 60));

    const avgResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

    const veracityScores = answers
      .filter(a => a.veracityScore)
      .map(a => a.veracityScore);

    const avgVeracityScore = veracityScores.length > 0
      ? veracityScores.reduce((a, b) => a + b, 0) / veracityScores.length
      : 0;

    const performanceScore = this.calculatePerformanceScore(paidAnswers.length, rejectedAnswers.length);
    const speedScore = this.calculateSpeedScore(avgResponseTime);
    const frequencyScore = this.calculateFrequencyScore(answers);

    const overallScore = (performanceScore * 0.5) + (speedScore * 0.3) + (frequencyScore * 0.2);

    return {
      totalAnswers: answers.length,
      acceptedAnswers: paidAnswers.length,
      rejectedAnswers: rejectedAnswers.length,
      avgResponseTime,
      avgVeracityScore,
      performanceScore,
      speedScore,
      frequencyScore,
      overallScore,
      lastCalculated: new Date()
    };
  }

  calculatePerformanceScore(accepted, rejected) {
    if (accepted + rejected === 0) return 0;
    const acceptanceRate = accepted / (accepted + rejected);
    return acceptanceRate * 100;
  }

  calculateSpeedScore(avgMinutes) {
    if (avgMinutes === 0) return 0;
    if (avgMinutes <= 30) return 100;
    if (avgMinutes <= 60) return 90;
    if (avgMinutes <= 120) return 70;
    if (avgMinutes <= 180) return 50;
    return 30;
  }

  calculateFrequencyScore(answers) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentAnswers = answers.filter(a => a.createdAt > thirtyDaysAgo).length;
    
    if (recentAnswers >= 10) return 100;
    if (recentAnswers >= 5) return 80;
    if (recentAnswers >= 3) return 60;
    if (recentAnswers >= 1) return 40;
    return 20;
  }
}

module.exports = new QueueService();
