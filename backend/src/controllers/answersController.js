const prisma = require('../utils/prisma');
const { validationResult } = require('express-validator');

// Submit an answer as an expert
const submitExpertAnswer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { questionId, content, sources } = req.body;
    const userId = req.userId;

    // Check if user has an expert profile
    const expertProfile = await prisma.expertProfile.findUnique({
      where: { userId }
    });

    if (!expertProfile) {
      return res.status(403).json({ error: 'Only verified experts can submit answers' });
    }

    // Get the question
    const question = await prisma.validationQuestion.findUnique({
      where: { id: questionId },
      include: {
        idea: true,
        answers: {
          where: { userId }
        }
      }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Check if expert already answered this question
    if (question.answers.length > 0) {
      return res.status(400).json({ error: 'You have already answered this question' });
    }

    // Create the answer
    const answer = await prisma.userAnswer.create({
      data: {
        content,
        sources: sources || [],
        questionId,
        userId,
        // For experts, we can set a higher initial score
        aiValidationScore: 85
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            organizationName: true
          }
        },
        question: {
          include: {
            idea: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    // Create ExpertAnswer record to link expert profile
    // Get question escrow value
    const questionData = await prisma.validationQuestion.findUnique({
      where: { id: questionId },
      include: {
        idea: {
          include: {
            contributions: {
              where: { wasRefunded: false }
            }
          }
        }
      }
    });
    
    const questionValue = questionData?.idea?.contributions?.reduce((sum, c) => sum + c.amount, 0) || 0;
    
    await prisma.expertAnswer.create({
      data: {
        answerId: answer.id,
        expertProfileId: expertProfile.id,
        confidence: "HIGH",
        timeSpent: 0,
        questionValue: questionValue
      }
    });
    res.status(201).json({
      message: 'Answer submitted successfully',
      answer
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get answers for a question
const getQuestionAnswers = async (req, res) => {
  try {
    const { questionId } = req.params;

    // First get the question details
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

    // Then get answers
    const answers = await prisma.userAnswer.findMany({
      where: { 
        questionId,
        isHidden: false
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        },
        ExpertAnswer: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    res.json({ question, answers });
  } catch (error) {
    console.error("Get answers error:", error);
    res.status(500).json({ error: error.message });
  }
};
// Rate an answer
const rateAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    const { rating, feedback } = req.body;
    const userId = req.userId;

    // Check if user is institutional
    if (req.userType !== 'INSTITUTIONAL') {
      return res.status(403).json({ error: 'Only institutional users can rate answers' });
    }

    // Get the answer
    const answer = await prisma.userAnswer.findUnique({
      where: { id: answerId },
      include: {
        question: {
          include: {
            idea: true
          }
        }
      }
    });

    if (!answer) {
      return res.status(404).json({ error: 'Answer not found' });
    }

    // Update answer score
    const updatedAnswer = await prisma.userAnswer.update({
      where: { id: answerId },
      data: {
        manualReviewScore: rating,
        finalScore: rating // For now, manual score is final
      }
    });

    // If rating is above threshold, release payment
    if (rating >= answer.question.minAnswerScore) {
      // TODO: Implement payment release
      console.log('Answer approved, payment should be released');
    }

    res.json({
      message: 'Answer rated successfully',
      answer: updatedAnswer
    });
  } catch (error) {
    console.error('Rate answer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  submitExpertAnswer,
  getQuestionAnswers,
  rateAnswer
};
