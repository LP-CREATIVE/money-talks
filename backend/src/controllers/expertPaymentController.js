const paymentService = require('../services/paymentService');
const prisma = require('../utils/prisma');

const getPaymentHistory = async (req, res) => {
  try {
    const expertId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const history = await paymentService.getExpertPaymentHistory(expertId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      ...history
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getEarningsSummary = async (req, res) => {
  try {
    const expertId = req.user.id;

    const [user, ranking, recentPayments] = await Promise.all([
      prisma.user.findUnique({
        where: { id: expertId },
        select: { walletBalance: true }
      }),
      prisma.expertRanking.findUnique({
        where: { expertId }
      }),
      prisma.paymentTransaction.findMany({
        where: {
          answer: {
            userId: expertId
          },
          status: 'COMPLETED',
          processedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        },
        select: {
          expertAmount: true
        }
      })
    ]);

    const last30DaysEarnings = recentPayments.reduce((sum, p) => sum + p.expertAmount, 0);

    res.json({
      success: true,
      summary: {
        currentBalance: user.walletBalance,
        totalEarnings: ranking?.totalEarnings || 0,
        last30DaysEarnings,
        acceptedAnswers: ranking?.acceptedAnswers || 0,
        avgVeracityScore: ranking?.avgVeracityScore || 0,
        currentRank: ranking?.rank || 0
      }
    });
  } catch (error) {
    console.error('Error fetching earnings summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getPaymentHistory,
  getEarningsSummary
};
