const aiService = require('../services/aiService');
const { validationResult } = require("express-validator");
const prisma = require('../utils/prisma');
const paymentService = require('../services/paymentService');

// Submit an expert answer
const submitExpertAnswer = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { questionId, content, sources, attachments } = req.body;
    console.log('Received data:', { questionId, content, sources: sources || 'undefined' });
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

    // Create the answer first
    const answer = await prisma.userAnswer.create({
      data: {
        content,
        sources: sources || [],
        questionId,
        attachments: attachments || [],
        userId,
        status: 'SUBMITTED',
        paymentStatus: 'PENDING'
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

    // Calculate veracity score using AI
    try {
      console.log('Calculating veracity score for answer:', answer.id);
      console.log('Answer content length:', content.length);
      console.log('Question:', question.text);
      console.log('Sources:', Array.isArray(sources) ? sources : (sources ? [sources] : []));
      
      const validation = await aiService.validateAnswerWithAI(
        answer.id,
        content,
        question.text,
        Array.isArray(sources) ? sources : (sources ? [sources] : [])
      );

      console.log('AI validation result:', validation);
      console.log('Score received:', validation.score);

      // Update answer with veracity score
      const updatedAnswer = await prisma.userAnswer.update({
        where: { id: answer.id },
        data: {
          veracityScore: validation.score,
          aiValidationScore: validation.score,
          status: validation.score >= 80 ? 'PENDING_REVIEW' : 'NEEDS_IMPROVEMENT'
        }
      });

      
      answer.veracityScore = validation.score;
      
      // Create VeracityScore record for detailed breakdown
      try {
        const veracityScore = await prisma.veracityScore.create({
          data: {
            answerId: answer.id,
            identityScore: 90, // Default high score for verified experts
            identityDetails: { verified: true, profile: expertProfile.id },
            profileMatchScore: (validation.breakdown?.relevance || 20) * 4,
            profileMatchDetails: { relevance: validation.breakdown?.relevance },
            answerQualityScore: (validation.breakdown?.analysisDepth || 20) * 4,
            answerQualityDetails: { feedback: validation.feedback },
            documentScore: (validation.breakdown?.sourceQuality || 20) * 4,
            documentDetails: { sources: sources?.length || 0, credible: validation.sourcesCredible },
            contradictionScore: 90,
            contradictionDetails: { found: false },
            corroborationScore: (validation.breakdown?.accuracy || 20) * 4,
            corroborationDetails: { accuracy: validation.breakdown?.accuracy },
            overallScore: validation.score,
            scoreBreakdown: validation.breakdown
          }
        });
        console.log('Created VeracityScore:', veracityScore.id);
      } catch (vsError) {
        console.error('VeracityScore creation failed:', vsError);
      }

      answer.aiValidationScore = validation.score;

    } catch (aiError) {
      console.error('AI validation error:', aiError);
      // Set a default score if AI fails
      await prisma.userAnswer.update({
        where: { id: answer.id },
        data: {
          veracityScore: 75,
          aiValidationScore: 75,
          status: 'PENDING_REVIEW'
        }
      });
      answer.veracityScore = 75;
      answer.aiValidationScore = 75;
    }

    // Create ExpertAnswer record
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
        questionValue: questionValue
      }
    });

    res.status(201).json({
      message: 'Answer submitted successfully',
      answer,
      veracityScore: answer.veracityScore,
      meetsThreshold: answer.veracityScore >= 80
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// Submit answer with payment system integration
const submitAnswer = async (req, res) => {
  try {
    const { questionId, content, sources, attachments } = req.body;
    const userId = req.user.id;

    const question = await prisma.validationQuestion.findUnique({
      where: { id: questionId },
      include: {
        idea: true
      }
    });

    if (question.assignedExpertId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not assigned to this question'
      });
    }

    // Create the answer first
    const answer = await prisma.userAnswer.create({
      data: {
        questionId,
        userId,
        content,
        attachments: attachments || [],
        sources,
        supportingDocs: req.files ? req.files.map(f => f.path) : [],
        status: 'SUBMITTED',
        paymentStatus: 'PENDING'
      }
    });

    // Calculate veracity score using AI
    try {
      const validation = await aiService.validateAnswerWithAI(
        answer.id,
        content,
        question.text,
        sources ? sources.split(',').map(s => s.trim()) : []
      );

      // Update answer with veracity score
      await prisma.userAnswer.update({
        where: { id: answer.id },
        data: {
          veracityScore: validation.score,
          aiValidationScore: validation.score,
          status: validation.score >= 80 ? 'PENDING_REVIEW' : 'NEEDS_IMPROVEMENT'
        }
      });

      answer.veracityScore = validation.score;
      answer.aiValidationScore = validation.score;

    } catch (aiError) {
      console.error('AI validation error:', aiError);
      // Set a default score if AI fails
      await prisma.userAnswer.update({
        where: { id: answer.id },
        data: {
          veracityScore: 75,
          aiValidationScore: 75,
          status: 'PENDING_REVIEW'
        }
      });
      answer.veracityScore = 75;
    }

    // Update question status
    await prisma.validationQuestion.update({
      where: { id: questionId },
      data: {
        status: 'ANSWERED',
        hasValidAnswer: answer.veracityScore >= 80
      }
    });

    // Update expert queue if exists
    try {
      await prisma.expertQueue.update({
        where: {
          questionId_expertId: {
            questionId,
            expertId: userId
          }
        },
        data: {
          status: 'ANSWERED'
        }
      });
    } catch (e) {
      // Expert queue entry might not exist
    }

    // Update expert metrics
    const responseTime = question.assignedAt 
      ? (Date.now() - new Date(question.assignedAt).getTime()) / (1000 * 60)
      : 0;

    await paymentService.updateExpertMetrics(userId, {
      responseTime
    });

    res.json({
      success: true,
      message: 'Answer submitted successfully',
      answer,
      veracityScore: answer.veracityScore,
      meetsThreshold: answer.veracityScore >= 80
    });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all answers for a specific question
const getAnswersByQuestion = async (req, res) => {
  try {
    const { questionId } = req.params;

    const answers = await prisma.userAnswer.findMany({
      where: { questionId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            organizationName: true,
            userType: true,
            isVerified: true
          }
        },
        ExpertAnswer: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(answers);
  } catch (error) {
    console.error('Error fetching answers:', error);
    res.status(500).json({ error: 'Failed to fetch answers' });
  }
};

// Get all answers for a specific idea
const getAnswersByIdea = async (req, res) => {
  try {
    const { ideaId } = req.params;

    const answers = await prisma.userAnswer.findMany({
      where: { 
        question: {
          ideaId: ideaId
        }
      },
      include: {
        question: {
          select: {
            id: true,
            text: true
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            organizationName: true,
            userType: true,
            isVerified: true
          }
        },
        ExpertAnswer: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(answers);
  } catch (error) {
    console.error('Error fetching answers:', error);
    res.status(500).json({ error: 'Failed to fetch answers' });
  }
};

// Get expert's own answers
const getExpertAnswers = async (req, res) => {
  try {
    const expertId = req.user.id;

    console.log("Fetching answers for expert:", expertId);    
    const answers = await prisma.userAnswer.findMany({
      where: { userId: expertId },
      include: {
        question: {
          select: {
            id: true,
            text: true,
            idea: {
              select: {
                id: true,
                title: true,
              }
            }
          }
        },
        ExpertAnswer: {
          select: {
            questionValue: true,
            // status: true // TODO: Add status field to schema
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    console.log("Found answers:", answers.length);
    
    // Calculate total earnings
    const totalEarnings = answers.reduce((sum, answer) => {
      if (answer.ExpertAnswer && answer.ExpertAnswer.status === 'APPROVED') {
        return sum + (answer.ExpertAnswer.questionValue || 0);
      }
      return sum;
    }, 0);

    res.json({
      answers,
      totalEarnings
    });
  } catch (error) {
    console.error('Error fetching expert answers:', error);
    res.status(500).json({ error: 'Failed to fetch answers' });
  }
};

// Update answer status (admin only)
const updateAnswerStatus = async (req, res) => {
  try {
    const { answerId } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['PENDING', 'APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Update the ExpertAnswer status
    const expertAnswer = await prisma.ExpertAnswer.updateMany({
      where: { answerId },
      data: { status }
    });

    if (expertAnswer.count === 0) {
      return res.status(404).json({ error: 'Expert answer not found' });
    }

    res.json({ 
      success: true, 
      message: `Answer ${status.toLowerCase()}` 
    });
  } catch (error) {
    console.error('Error updating answer status:', error);
    res.status(500).json({ error: 'Failed to update answer status' });
  }
};

// Delete an answer (expert can only delete their own)
const deleteAnswer = async (req, res) => {
  try {
    const { answerId } = req.params;
    console.log("Attempting to delete answer:", answerId);
    const userId = req.user?.id || req.userId;
    console.log("User ID:", userId);

    // First check if the answer belongs to this user
    const answer = await prisma.userAnswer.findUnique({
      where: { id: answerId },
      include: { ExpertAnswer: true }
    });

    if (!answer) {
      return res.status(404).json({ error: "Answer not found" });
    }

    if (answer.userId !== userId) {
      return res.status(403).json({ error: "You can only delete your own answers" });
    }

    // Delete related records first due to foreign key constraints
    
    // Delete AnswerValidation records if they exist
    try {
      await prisma.answerValidation.deleteMany({
        where: { answerId: answerId }
      });
      console.log("Deleted answer validations");
    } catch (e) {
      console.log("No answer validations to delete or error:", e.message);
    }

    // Delete ExpertAnswer if exists
    if (answer.ExpertAnswer) {
      await prisma.expertAnswer.delete({
        where: { answerId: answerId }
      });
      console.log("Deleted expert answer record");
    }

    // Now delete the answer
    await prisma.userAnswer.delete({
      where: { id: answerId }
    });

    res.json({ success: true, message: "Answer deleted successfully" });
  } catch (error) {
    console.error("Error deleting answer:", error);
    res.status(500).json({ error: "Failed to delete answer" });
  }
};
module.exports = {
  deleteAnswer,
  submitExpertAnswer,
  submitAnswer,
  getAnswersByQuestion,
  getAnswersByIdea,
  getExpertAnswers,
  updateAnswerStatus
};

// Add file upload endpoint for expert answers
const uploadAnswerFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Return file info
    res.json({
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
};

module.exports.uploadAnswerFile = uploadAnswerFile;
