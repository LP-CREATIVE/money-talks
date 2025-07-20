const paymentService = require('../services/paymentService');
const veracityService = require('../services/veracityService');
const queueService = require('../services/queueService');
const prisma = require('../utils/prisma');

const reviewPayment = async (req, res) => {
  try {
    const { answerId } = req.params;
    const { approved, adminNotes, rejectionReason } = req.body;
    const adminId = req.user.id;

    if (approved) {
      const transaction = await paymentService.approvePayment(answerId, adminId, adminNotes);
      res.json({
        success: true,
        message: 'Payment approved and processed',
        transaction
      });
    } else {
      const result = await paymentService.rejectAnswer(answerId, rejectionReason, adminId);
      res.json({
        success: true,
        message: 'Answer rejected',
        result
      });
    }
  } catch (error) {
    console.error('Error reviewing payment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getPendingPayments = async (req, res) => {
  try {
    const pendingAnswers = await prisma.userAnswer.findMany({
      where: {
        paymentStatus: 'PENDING',
        veracityScore: { gte: 80 }
      },
      include: {
        user: {
          include: {
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
        veracityScoreDetail: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      pendingPayments: pendingAnswers
    });
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getPaymentAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateRange = {
      startDate: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: endDate ? new Date(endDate) : new Date()
    };

    const analytics = await paymentService.getPaymentAnalytics(dateRange);

    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getVeracityScore = async (req, res) => {
  try {
    const { answerId } = req.params;
    
    const report = await veracityService.generateValidationReport(answerId);

    res.json({
      success: true,
      report
    });
  } catch (error) {
    console.error('Error fetching veracity score:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const processPayment = async (req, res) => {
  try {
    const { answerId } = req.params;
    
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { answerId }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: 'No payment transaction found for this answer'
      });
    }

    const result = await paymentService.processPayment(transaction.id);

    res.json({
      success: true,
      message: 'Payment processed successfully',
      result
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  reviewPayment,
  getPendingPayments,
  getPaymentAnalytics,
  getVeracityScore,
  processPayment
};
