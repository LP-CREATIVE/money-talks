const prisma = require('../utils/prisma');
const { validationResult } = require('express-validator');

// Add question to an idea
const addQuestion = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { ideaId, text } = req.body;
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
        },
        contributions: {
          where: { wasRefunded: false }
        }
      }
    });

    if (!idea) {
      return res.status(404).json({ error: 'Idea not found' });
    }

    // Calculate escrow amount for this question
    const totalEscrow = idea.contributions.reduce((sum, c) => sum + c.amount, 0);
    const totalQuestions = await prisma.validationQuestion.count({ where: { ideaId } }) + 1;
    const escrowPerQuestion = totalEscrow / totalQuestions;

    // Determine if this should automatically go to top 3
    const currentTop3Count = idea.questions.length;
    let isTop3 = false;
    let questionSlot = null;

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
    }

    // Create the question
    const question = await prisma.validationQuestion.create({
      data: {
        ideaId,
        text,
        submittedById: userId,
        escrowSourceId: userContribution.id,
        escrowAmount: escrowPerQuestion,
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

    // Reallocate escrow across all questions
    await reallocateEscrow(ideaId);

    res.status(201).json({
      message: isTop3 
        ? `Question automatically assigned to slot ${questionSlot}` 
        : 'Question submitted successfully',
      question,
      automaticallyAssigned: isTop3
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
      availableSlots
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get question by ID
const getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;

    const question = await prisma.validationQuestion.findUnique({
      where: { id },
      include: {
        idea: {
          include: {
            createdBy: true,
            contributions: {
              where: { wasRefunded: false }
            }
          }
        },
        submittedBy: true,
        answers: {
          include: {
            user: true
          }
        }
      }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(question);
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to reallocate escrow when questions are added
const reallocateEscrow = async (ideaId) => {
  try {
    const idea = await prisma.institutionalIdea.findUnique({
      where: { id: ideaId },
      include: {
        contributions: {
          where: { wasRefunded: false }
        },
        questions: true
      }
    });

    if (!idea || idea.questions.length === 0) return;

    const totalEscrow = idea.contributions.reduce((sum, c) => sum + c.amount, 0);
    const questionCount = idea.questions.length;
    const escrowPerQuestion = totalEscrow / questionCount;

    // Update all questions with new escrow amounts
    await prisma.validationQuestion.updateMany({
      where: { ideaId },
      data: { escrowAmount: escrowPerQuestion }
    });
  } catch (error) {
    console.error('Error reallocating escrow:', error);
  }
};

module.exports = {
  addQuestion,
  getIdeaQuestions,
  getQuestionById
};
