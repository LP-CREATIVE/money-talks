const prisma = require('../utils/prisma');

const getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const [userCount, ideaCount, questionCount, answerCount] = await Promise.all([
      prisma.user.count(),
      prisma.institutionalIdea.count(),
      prisma.validationQuestion.count(),
      prisma.userAnswer.count()
    ]);

    // Get financial stats
    const activeContributions = await prisma.escrowContribution.findMany({
      where: { wasRefunded: false }
    });
    const totalEscrow = activeContributions.reduce((sum, c) => sum + c.amount, 0);

    // Get recent activity
    const recentAnswers = await prisma.userAnswer.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        question: {
          include: {
            idea: true
          }
        }
      }
    });

    res.json({
      counts: {
        users: userCount,
        ideas: ideaCount,
        questions: questionCount,
        answers: answerCount
      },
      financials: {
        totalEscrow,
        activeContributions: activeContributions.length
      },
      recentActivity: recentAnswers
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { type, verified } = req.query;
    
    const where = {};
    if (type) where.userType = type;
    if (verified !== undefined) where.isVerified = verified === 'true';
    
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        userType: true,
        organizationName: true,
        isVerified: true,
        createdAt: true,
        expertProfile: {
          select: {
            verificationLevel: true,
            totalEarnings: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

const getPendingAnswers = async (req, res) => {
  try {
    const answers = await prisma.userAnswer.findMany({
      where: {
        manualReviewScore: null,
        isHidden: false
      },
      include: {
        user: {
          select: {
            email: true,
            expertProfile: true
          }
        },
        question: {
          include: {
            idea: {
              select: {
                title: true,
                sector: true
              }
            }
          }
        },
        ExpertAnswer: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(answers);
  } catch (error) {
    console.error('Get pending answers error:', error);
    res.status(500).json({ error: 'Failed to fetch pending answers' });
  }
};

const approveAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    const { score, notes } = req.body;
    
    const answer = await prisma.userAnswer.update({
      where: { id: answerId },
      data: {
        manualReviewScore: score,
        finalScore: score,
        updatedAt: new Date()
      },
      include: {
        ExpertAnswer: true
      }
    });
    
    // Update expert answer approval
    if (answer.ExpertAnswer) {
      await prisma.expertAnswer.update({
        where: { id: answer.ExpertAnswer.id },
        data: {
          approved: true,
          approvedAt: new Date(),
          approvedBy: req.userId,
          rating: Math.round(score / 20) // Convert to 1-5 rating
        }
      });
    }
    
    res.json({ success: true, answer });
  } catch (error) {
    console.error('Approve answer error:', error);
    res.status(500).json({ error: 'Failed to approve answer' });
  }
};

const rejectAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    const { reason } = req.body;
    
    const answer = await prisma.userAnswer.update({
      where: { id: answerId },
      data: {
        isHidden: true,
        manualReviewScore: 0,
        finalScore: 0,
        updatedAt: new Date()
      }
    });
    
    res.json({ success: true, answer });
  } catch (error) {
    console.error('Reject answer error:', error);
    res.status(500).json({ error: 'Failed to reject answer' });
  }
};

const getPlatformMetrics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Get various metrics
    const metrics = {
      userGrowth: await getUserGrowthMetrics(startDate, endDate),
      answerQuality: await getAnswerQualityMetrics(),
      financialMetrics: await getFinancialMetrics(),
      expertPerformance: await getExpertPerformanceMetrics()
    };
    
    res.json(metrics);
  } catch (error) {
    console.error('Platform metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch platform metrics' });
  }
};

// Helper functions
const getUserGrowthMetrics = async (startDate, endDate) => {
  const where = {};
  if (startDate) where.createdAt = { gte: new Date(startDate) };
  if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
  
  const usersByType = await prisma.user.groupBy({
    by: ['userType'],
    where,
    _count: true
  });
  
  return usersByType;
};

const getAnswerQualityMetrics = async () => {
  const answers = await prisma.userAnswer.findMany({
    where: { finalScore: { not: null } }
  });
  
  const avgScore = answers.reduce((sum, a) => sum + (a.finalScore || 0), 0) / answers.length;
  const approved = answers.filter(a => a.finalScore >= 70).length;
  const rejected = answers.filter(a => a.finalScore < 70).length;
  
  return { avgScore, approved, rejected, total: answers.length };
};

const getFinancialMetrics = async () => {
  const contributions = await prisma.escrowContribution.findMany();
  const totalCollected = contributions.reduce((sum, c) => sum + c.amount, 0);
  const refunded = contributions.filter(c => c.wasRefunded).reduce((sum, c) => sum + c.amount, 0);
  
  return {
    totalCollected,
    refunded,
    active: totalCollected - refunded
  };
};

const getExpertPerformanceMetrics = async () => {
  const experts = await prisma.expertProfile.findMany({
    include: {
      ExpertAnswer: true
    }
  });
  
  return experts.map(expert => ({
    id: expert.id,
    name: expert.fullName,
    totalAnswers: expert.ExpertAnswer.length,
    approvedAnswers: expert.ExpertAnswer.filter(a => a.approved).length,
    totalEarnings: expert.totalEarnings,
    avgRating: expert.ExpertAnswer
      .filter(a => a.rating)
      .reduce((sum, a) => sum + a.rating, 0) / expert.ExpertAnswer.filter(a => a.rating).length || 0
  }));
};

const getAllIdeas = async (req, res) => {
  try {
    const ideas = await prisma.institutionalIdea.findMany({
      include: {
        createdBy: {
          select: {
            email: true,
            organizationName: true
          }
        },
        contributions: true,
        questions: {
          include: {
            _count: {
              select: {
                answers: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(ideas);
  } catch (error) {
    console.error('Get ideas error:', error);
    res.status(500).json({ error: 'Failed to fetch ideas' });
  }
};

const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        expertProfile: true,
        institutionalIdeas: true,
        escrowContributions: true,
        answers: {
          include: {
            question: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
};

const verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { isVerified: true }
    });
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Verify user error:', error);
    res.status(500).json({ error: 'Failed to verify user' });
  }
};

module.exports = {
  getDashboardStats,
  getAllUsers,
  getPendingAnswers,
  approveAnswer,
  rejectAnswer,
  getPlatformMetrics,
  getAllIdeas,
  getUserDetails,
  verifyUser
};
