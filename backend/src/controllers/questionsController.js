const prisma = require('../utils/prisma');
const { validationResult } = require('express-validator');

// Add question to an idea
const addQuestion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ideaId, text, bidAmount } = req.body;
    const userId = req.userId;

    // Check if user has contributed at least $5000 to this idea
    const userContribution = await prisma.escrowContribution.findFirst({
      where: {
        userId,
        ideaId,
        wasRefunded: false
      },
      orderBy: {
        amount: 'desc'
      }
    });

    if (!userContribution || userContribution.amount < 5000) {
      return res.status(403).json({ 
        error: 'You must contribute at least $5,000 to submit questions' 
      });
    }

    // Check if idea exists
    const idea = await prisma.institutionalIdea.findUnique({
      where: { id: ideaId }
    });

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    // Create the question
    const question = await prisma.validationQuestion.create({
      data: {
        ideaId,
        text,
        bidAmount,
        submittedById: userId,
        escrowSourceId: userContribution.id,
        isTop3: false,
        questionSlot: null
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            organizationName: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Question submitted successfully',
      question
    });
  } catch (error) {
    console.error('Add question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get questions for an idea
const getIdeaQuestions = async (req, res) => {
  try {
    const { ideaId } = req.params;

    const questions = await prisma.validationQuestion.findMany({
      where: { ideaId },
      include: {
        submittedBy: {
          select: {
            id: true,
            organizationName: true
          }
        },
        _count: {
          select: {
            answers: true
          }
        }
      },
      orderBy: [
        { isTop3: 'desc' },
        { bidAmount: 'desc' }
      ]
    });

    // Separate top 3 and other questions
    const top3Questions = questions.filter(q => q.isTop3).sort((a, b) => a.questionSlot - b.questionSlot);
    const otherQuestions = questions.filter(q => !q.isTop3);

    res.json({
      top3Questions,
      otherQuestions,
      totalQuestions: questions.length
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bid on a question slot
const bidOnQuestionSlot = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { questionId, slot, bidAmount } = req.body;
    const userId = req.userId;

    // Validate slot number
    if (slot < 1 || slot > 3) {
      return res.status(400).json({ error: 'Slot must be between 1 and 3' });
    }

    // Get the question
    const question = await prisma.validationQuestion.findUnique({
      where: { id: questionId },
      include: { idea: true }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Check if user has contributed at least $5000
    const userContribution = await prisma.escrowContribution.findFirst({
      where: {
        userId,
        ideaId: question.ideaId,
        wasRefunded: false
      },
      orderBy: {
        amount: 'desc'
      }
    });

    if (!userContribution || userContribution.amount < 5000) {
      return res.status(403).json({ 
        error: 'You must contribute at least $5,000 to bid on questions' 
      });
    }

    // Check current occupant of the slot
    const currentSlotHolder = await prisma.validationQuestion.findFirst({
      where: {
        ideaId: question.ideaId,
        isTop3: true,
        questionSlot: slot
      }
    });

    // Bid must be higher than current
    if (currentSlotHolder && bidAmount <= currentSlotHolder.bidAmount) {
      return res.status(400).json({ 
        error: `Bid must be higher than current bid of $${currentSlotHolder.bidAmount}` 
      });
    }

    // Update the question with new bid
    const updatedQuestion = await prisma.validationQuestion.update({
      where: { id: questionId },
      data: {
        bidAmount,
        isTop3: true,
        questionSlot: slot
      }
    });

    // If there was a previous holder, remove them from top 3
    if (currentSlotHolder && currentSlotHolder.id !== questionId) {
      await prisma.validationQuestion.update({
        where: { id: currentSlotHolder.id },
        data: {
          isTop3: false,
          questionSlot: null
        }
      });
    }

    res.json({
      message: 'Bid placed successfully',
      question: updatedQuestion
    });
  } catch (error) {
    console.error('Bid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get minimum escrow amount for additional questions
const getMinimumEscrow = async (req, res) => {
  try {
    // Get the 100th ranked idea's escrow amount
    const ideas = await prisma.institutionalIdea.findMany({
      where: { status: 'TOP_100' },
      orderBy: { totalEscrow: 'desc' },
      take: 100,
      select: { totalEscrow: true }
    });

    const minimumEscrow = ideas.length >= 100 ? ideas[99].totalEscrow : 5000;

    res.json({ minimumEscrow });
  } catch (error) {
    console.error('Get minimum escrow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  addQuestion,
  getIdeaQuestions,
  bidOnQuestionSlot,
  getMinimumEscrow
};
