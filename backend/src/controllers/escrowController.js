const prisma = require('../utils/prisma');
const { validationResult } = require('express-validator');

// Contribute to an idea
const contributeToIdea = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ideaId, amount } = req.body;
    const userId = req.userId;

    // Validate amount
    if (amount < 5000) {
      return res.status(400).json({ error: 'Minimum contribution is $5,000' });
    }

    // Check if idea exists
    const idea = await prisma.institutionalIdea.findUnique({
      where: { id: ideaId }
    });

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    // Create contribution
    const contribution = await prisma.escrowContribution.create({
      data: {
        userId,
        ideaId,
        amount,
        isRefundable: true,
        refundDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      }
    });

    // Update idea total escrow
    await prisma.institutionalIdea.update({
      where: { id: ideaId },
      data: {
        totalEscrow: {
          increment: amount
        }
      }
    });

    // Update user wallet balance (deduct amount)
    await prisma.user.update({
      where: { id: userId },
      data: {
        walletBalance: {
          decrement: amount
        }
      }
    });

    res.status(201).json({
      message: 'Contribution successful',
      contribution
    });
  } catch (error) {
    console.error('Contribution error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's contributions
const getMyContributions = async (req, res) => {
  try {
    const userId = req.userId;

    const contributions = await prisma.escrowContribution.findMany({
      where: { userId },
      include: {
        idea: {
          select: {
            id: true,
            title: true,
            status: true,
            totalEscrow: true,
            escrowRank: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalContributed = contributions.reduce((sum, c) => sum + c.amount, 0);

    res.json({
      contributions,
      summary: {
        totalContributed,
        activeContributions: contributions.filter(c => !c.wasRefunded).length,
        refundedAmount: contributions.filter(c => c.wasRefunded).reduce((sum, c) => sum + c.amount, 0)
      }
    });
  } catch (error) {
    console.error('Get contributions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get contributions for an idea
const getIdeaContributions = async (req, res) => {
  try {
    const { ideaId } = req.params;

    const contributions = await prisma.escrowContribution.findMany({
      where: { ideaId },
      include: {
        user: {
          select: {
            id: true,
            organizationName: true
          }
        }
      },
      orderBy: { amount: 'desc' }
    });

    const totalEscrow = contributions.reduce((sum, c) => sum + c.amount, 0);

    res.json({
      contributions,
      summary: {
        totalEscrow,
        contributorCount: contributions.length,
        averageContribution: contributions.length > 0 ? totalEscrow / contributions.length : 0
      }
    });
  } catch (error) {
    console.error('Get idea contributions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Process refund (will be automated later)
const processRefund = async (req, res) => {
  try {
    const { contributionId, reason } = req.body;
    const userId = req.userId;

    // Get contribution
    const contribution = await prisma.escrowContribution.findUnique({
      where: { id: contributionId },
      include: { idea: true }
    });

    if (!contribution) {
      return res.status(404).json({ error: 'Contribution not found' });
    }

    // Verify ownership or admin
    if (contribution.userId !== userId && req.userType !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Check if already refunded
    if (contribution.wasRefunded) {
      return res.status(400).json({ error: 'Already refunded' });
    }

    // Create refund transaction
    const refund = await prisma.refundTransaction.create({
      data: {
        userId: contribution.userId,
        escrowId: contributionId,
        amount: contribution.amount,
        reason
      }
    });

    // Update contribution
    await prisma.escrowContribution.update({
      where: { id: contributionId },
      data: { wasRefunded: true }
    });

    // Update idea total escrow
    await prisma.institutionalIdea.update({
      where: { id: contribution.ideaId },
      data: {
        totalEscrow: {
          decrement: contribution.amount
        }
      }
    });

    // Update user wallet balance (add refund)
    await prisma.user.update({
      where: { id: contribution.userId },
      data: {
        walletBalance: {
          increment: contribution.amount
        }
      }
    });

    res.json({
      message: 'Refund processed successfully',
      refund
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  contributeToIdea,
  getMyContributions,
  getIdeaContributions,
  processRefund
};
