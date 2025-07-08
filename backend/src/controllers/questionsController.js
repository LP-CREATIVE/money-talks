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

    // Check if idea exists and get current top 3 questions
    const idea = await prisma.institutionalIdea.findUnique({
      where: { id: ideaId },
      include: {
        questions: {
          where: { isTop3: true },
          orderBy: { questionSlot: 'asc' }
        }
      }
    });

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    // Determine if this should automatically go to top 3
    const currentTop3Count = idea.questions.length;
    let isTop3 = false;
    let questionSlot = null;
    let actualBidAmount = bidAmount || 0;

    // If less than 3 questions in top slots, automatically assign
    if (currentTop3Count < 3) {
      isTop3 = true;
      // Find the first available slot (1, 2, or 3)
      const occupiedSlots = idea.questions.map(q => q.questionSlot);
      for (let slot = 1; slot <= 3; slot++) {
        if (!occupiedSlots.includes(slot)) {
          questionSlot = slot;
          break;
        }
      }
      // No bidding required for automatic top 3
      actualBidAmount = 0;
    }

    // Create the question
    const question = await prisma.validationQuestion.create({
      data: {
        ideaId,
        text,
        bidAmount: actualBidAmount,
        submittedById: userId,
        escrowSourceId: userContribution.id,
        isTop3,
        questionSlot
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
      message: isTop3 
        ? `Question automatically assigned to slot ${questionSlot}` 
        : 'Question submitted successfully',
      question,
      automaticallyAssigned: isTop3,
      requiresBidding: currentTop3Count >= 3
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
        { questionSlot: 'asc' },
        { bidAmount: 'desc' },
        { createdAt: 'asc' }
      ]
    });

    // Separate top 3 and other questions
    const top3Questions = questions.filter(q => q.isTop3).sort((a, b) => a.questionSlot - b.questionSlot);
    const otherQuestions = questions.filter(q => !q.isTop3);
    const availableSlots = 3 - top3Questions.length;

    res.json({
      top3Questions,
      otherQuestions,
      totalQuestions: questions.length,
      availableSlots,
      biddingRequired: availableSlots === 0
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bid on a question slot (only allowed when all 3 slots are filled)
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

    // Get the question and check if all slots are filled
    const question = await prisma.validationQuestion.findUnique({
      where: { id: questionId },
      include: { 
        idea: {
          include: {
            questions: {
              where: { isTop3: true ,
            contributions: {
              select: {
                amount: true,
                wasRefunded: true
              }
            }
          }
            }
          }
        }
      }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Check if all 3 slots are filled
    if (question.idea.questions.length < 3) {
      return res.status(400).json({ 
        error: `Cannot bid yet. ${3 - question.idea.questions.length} top slots are still available for automatic assignment.` 
      });
    }

    // Check if user owns this question
    if (question.submittedById !== userId) {
      return res.status(403).json({ error: 'You can only bid on your own questions' });
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

    // For questions that were automatically assigned (bidAmount = 0), 
    // any bid amount is acceptable
    if (currentSlotHolder && currentSlotHolder.bidAmount === 0 && bidAmount <= 0) {
      return res.status(400).json({ 
        error: 'Bid amount must be greater than 0' 
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
      question: updatedQuestion,
      displacedQuestion: currentSlotHolder ? currentSlotHolder.id : null
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


// Get single question by ID
const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await prisma.validationQuestion.findUnique({
      where: { id },
      include: {
        idea: {
          include: {
            createdBy: {
              select: {
                id: true,
                organizationName: true,
                email: true
              }
            },
            contributions: {
              select: {
                amount: true,
                wasRefunded: true
              }
            }
          }
        },
        submittedBy: {
          select: {
            id: true,
            organizationName: true
          }
        },
        escrowSource: true
      }
    });

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json(question);
  } catch (error) {
    console.error("Get question error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


module.exports = {
  addQuestion,
  getIdeaQuestions,
  bidOnQuestionSlot,
  getMinimumEscrow,
  getQuestionById
};
