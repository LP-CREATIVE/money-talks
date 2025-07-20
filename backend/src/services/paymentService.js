const prisma = require('../utils/prisma');
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); // TODO: Add Stripe when ready
const veracityService = require('./veracityService');
const queueService = require('./queueService');

class PaymentService {
  async processAnswerSubmission(answerId) {
    try {
      const answer = await prisma.userAnswer.findUnique({
        where: { id: answerId },
        include: {
          question: true,
          user: {
            include: {
              expertProfile: true
            }
          }
        }
      });

      if (!answer) {
        throw new Error('Answer not found');
      }

      const veracityScore = await veracityService.calculateVeracityScore(answerId);

      await prisma.userAnswer.update({
        where: { id: answerId },
        data: {
          veracityScore: veracityScore.overallScore,
          status: 'UNDER_REVIEW'
        }
      });

      if (veracityScore.overallScore < 80) {
        await this.rejectAnswer(answerId, 'Veracity score below 80% threshold');
        await queueService.moveToNextExpert(answer.questionId);
      }

      return veracityScore;
    } catch (error) {
      console.error('Error processing answer submission:', error);
      throw error;
    }
  }

  async approvePayment(answerId, adminId, adminNotes) {
    try {
      const answer = await prisma.userAnswer.findUnique({
        where: { id: answerId },
        include: {
          question: true,
          veracityScoreDetail: true
        }
      });

      if (!answer) {
        throw new Error('Answer not found');
      }

      if (answer.paymentStatus !== 'PENDING') {
        throw new Error('Payment already processed');
      }

      await prisma.veracityScore.update({
        where: { answerId },
        data: {
          adminReviewed: true,
          adminApproved: true,
          adminNotes,
          reviewedAt: new Date(),
          reviewedBy: adminId
        }
      });

      const totalAmount = answer.question.escrowAmount;
      const expertAmount = totalAmount * 0.5;
      const platformAmount = totalAmount * 0.5;

      const transaction = await prisma.paymentTransaction.create({
        data: {
          answerId,
          totalAmount,
          expertAmount,
          platformAmount,
          status: 'PENDING'
        }
      });

      await this.processPayment(transaction.id);

      return transaction;
    } catch (error) {
      console.error('Error approving payment:', error);
      throw error;
    }
  }

  async processPayment(transactionId) {
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
      include: {
        answer: {
          include: {
            user: true,
            question: true
          }
        }
      }
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    try {
      await prisma.paymentTransaction.update({
        where: { id: transactionId },
        data: { status: 'PROCESSING' }
      });

      await prisma.user.update({
        where: { id: transaction.answer.userId },
        data: {
          walletBalance: {
            increment: transaction.expertAmount
          }
        }
      });

      await this.updateExpertMetrics(transaction.answer.userId, {
        earnings: transaction.expertAmount,
        veracityScore: transaction.answer.veracityScore
      });

      await prisma.paymentTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'COMPLETED',
          processedAt: new Date()
        }
      });

      await prisma.userAnswer.update({
        where: { id: transaction.answerId },
        data: {
          paymentStatus: 'PAID',
          expertPayout: transaction.expertAmount,
          platformFee: transaction.platformAmount,
          paidAt: new Date(),
          status: 'APPROVED'
        }
      });

      await prisma.validationQuestion.update({
        where: { id: transaction.answer.questionId },
        data: {
          hasValidAnswer: true,
          paymentStatus: 'PAID',
          status: 'ANSWERED'
        }
      });

      return transaction;
    } catch (error) {
      await prisma.paymentTransaction.update({
        where: { id: transactionId },
        data: {
          status: 'FAILED',
          errorMessage: error.message
        }
      });
      throw error;
    }
  }

  async rejectAnswer(answerId, rejectionReason, adminId = null) {
    try {
      const answer = await prisma.userAnswer.findUnique({
        where: { id: answerId },
        include: { question: true }
      });

      if (!answer) {
        throw new Error('Answer not found');
      }

      await prisma.userAnswer.update({
        where: { id: answerId },
        data: {
          paymentStatus: 'REJECTED',
          status: 'REJECTED',
          rejectionReason
        }
      });

      if (adminId && answer.veracityScore) {
        await prisma.veracityScore.update({
          where: { answerId },
          data: {
            adminReviewed: true,
            adminApproved: false,
            adminNotes: rejectionReason,
            reviewedAt: new Date(),
            reviewedBy: adminId
          }
        });
      }

      await this.updateExpertMetrics(answer.userId, {
        rejected: true
      });

      return answer;
    } catch (error) {
      console.error('Error rejecting answer:', error);
      throw error;
    }
  }

  async updateExpertMetrics(expertId, metrics) {
    try {
      let ranking = await prisma.expertRanking.findUnique({
        where: { expertId }
      });

      if (!ranking) {
        ranking = await prisma.expertRanking.create({
          data: { expertId }
        });
      }

      const updates = {};

      if (metrics.earnings !== undefined) {
        updates.totalEarnings = { increment: metrics.earnings };
        updates.acceptedAnswers = { increment: 1 };
      }

      if (metrics.rejected) {
        updates.rejectedAnswers = { increment: 1 };
      }

      if (metrics.veracityScore !== undefined) {
        const newTotal = ranking.acceptedAnswers + 1;
        const newAvg = ((ranking.avgVeracityScore * ranking.acceptedAnswers) + metrics.veracityScore) / newTotal;
        updates.avgVeracityScore = newAvg;
      }

      if (metrics.responseTime !== undefined) {
        const newTotal = ranking.totalAnswers + 1;
        const newAvg = ((ranking.avgResponseTime * ranking.totalAnswers) + metrics.responseTime) / newTotal;
        updates.avgResponseTime = newAvg;
      }

      updates.totalAnswers = { increment: 1 };

      await prisma.expertRanking.update({
        where: { expertId },
        data: updates
      });
    } catch (error) {
      console.error('Error updating expert metrics:', error);
    }
  }

  async getPaymentAnalytics(dateRange) {
    const { startDate, endDate } = dateRange;

    const [totalPayments, pendingPayments, avgVeracityScore, paymentsByDay] = await Promise.all([
      prisma.paymentTransaction.aggregate({
        where: {
          status: 'COMPLETED',
          processedAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _sum: {
          totalAmount: true,
          expertAmount: true,
          platformAmount: true
        },
        _count: true
      }),

      prisma.userAnswer.count({
        where: {
          paymentStatus: 'PENDING',
          veracityScore: { gte: 80 }
        }
      }),

      prisma.veracityScore.aggregate({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        },
        _avg: {
          overallScore: true
        }
      }),

      Promise.resolve([])
    ]);

    return {
      totalPayments: totalPayments._count,
      totalAmount: totalPayments._sum.totalAmount || 0,
      totalExpertPayouts: totalPayments._sum.expertAmount || 0,
      totalPlatformRevenue: totalPayments._sum.platformAmount || 0,
      pendingPayments,
      avgVeracityScore: avgVeracityScore._avg.overallScore || 0,
      paymentsByDay
    };
  }

  async getExpertPaymentHistory(expertId, pagination = { page: 1, limit: 20 }) {
    const skip = (pagination.page - 1) * pagination.limit;

    const [payments, total] = await Promise.all([
      prisma.paymentTransaction.findMany({
        where: {
          answer: {
            userId: expertId
          },
          status: 'COMPLETED'
        },
        include: {
          answer: {
            include: {
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
            }
          }
        },
        orderBy: {
          processedAt: 'desc'
        },
        skip,
        take: pagination.limit
      }),

      prisma.paymentTransaction.count({
        where: {
          answer: {
            userId: expertId
          },
          status: 'COMPLETED'
        }
      })
    ]);

    const stats = await prisma.paymentTransaction.aggregate({
      where: {
        answer: {
          userId: expertId
        },
        status: 'COMPLETED'
      },
      _sum: {
        expertAmount: true
      },
      _count: true
    });

    return {
      payments,
      total,
      totalEarnings: stats._sum.expertAmount || 0,
      totalPayments: stats._count,
      currentPage: pagination.page,
      totalPages: Math.ceil(total / pagination.limit)
    };
  }

  async refundPayment(answerId, reason) {
    const transaction = await prisma.paymentTransaction.findUnique({
      where: { answerId },
      include: {
        answer: {
          include: {
            user: true,
            question: true
          }
        }
      }
    });

    if (!transaction || transaction.status !== 'COMPLETED') {
      throw new Error('No completed payment found for this answer');
    }

    await prisma.user.update({
      where: { id: transaction.answer.userId },
      data: {
        walletBalance: {
          decrement: transaction.expertAmount
        }
      }
    });

    const refund = await prisma.paymentTransaction.create({
      data: {
        answerId,
        totalAmount: -transaction.totalAmount,
        expertAmount: -transaction.expertAmount,
        platformAmount: -transaction.platformAmount,
        status: 'COMPLETED',
        processedAt: new Date()
      }
    });

    await prisma.validationQuestion.update({
      where: { id: transaction.answer.questionId },
      data: {
        paymentStatus: 'REFUNDED'
      }
    });

    return refund;
  }
}

module.exports = new PaymentService();
