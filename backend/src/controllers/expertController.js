const { PrismaClient } = require('@prisma/client');
const { updateExpertVerification } = require('../services/verificationService');
const prisma = new PrismaClient();

// Create or update expert profile
const createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.userId;
    const profileData = req.body;
    
    const profile = await prisma.expertProfile.upsert({
      where: { userId },
      update: profileData,
      create: {
        userId,
        ...profileData
      }
    });
    
    // Recalculate verification status
    const updatedProfile = await updateExpertVerification(userId);
    
    res.json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Upload verification evidence
const uploadEvidence = async (req, res) => {
  try {
    const userId = req.userId;
    const { evidenceType, url, metadata } = req.body;
    
    const profile = await prisma.expertProfile.findUnique({
      where: { userId }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }
    
    const evidence = await prisma.verificationEvidence.upsert({
      where: {
        expertProfileId_evidenceType: {
          expertProfileId: profile.id,
          evidenceType
        }
      },
      update: {
        uploaded: true,
        url,
        metadata
      },
      create: {
        expertProfileId: profile.id,
        evidenceType,
        uploaded: true,
        url,
        metadata
      }
    });
    
    res.json({
      message: 'Evidence uploaded successfully',
      evidence
    });
  } catch (error) {
    console.error('Evidence upload error:', error);
    res.status(500).json({ error: 'Failed to upload evidence' });
  }
};

// Add education
const addEducation = async (req, res) => {
  try {
    const userId = req.userId;
    const educationData = req.body;
    
    const profile = await prisma.expertProfile.findUnique({
      where: { userId }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }
    
    const education = await prisma.education.create({
      data: {
        expertProfileId: profile.id,
        ...educationData
      }
    });
    
    await updateExpertVerification(userId);
    
    res.json({
      message: 'Education added successfully',
      education
    });
  } catch (error) {
    console.error('Add education error:', error);
    res.status(500).json({ error: 'Failed to add education' });
  }
};

// Add certification
const addCertification = async (req, res) => {
  try {
    const userId = req.userId;
    const certificationData = req.body;
    
    const profile = await prisma.expertProfile.findUnique({
      where: { userId }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }
    
    const certification = await prisma.certification.create({
      data: {
        expertProfileId: profile.id,
        ...certificationData
      }
    });
    
    await updateExpertVerification(userId);
    
    res.json({
      message: 'Certification added successfully',
      certification
    });
  } catch (error) {
    console.error('Add certification error:', error);
    res.status(500).json({ error: 'Failed to add certification' });
  }
};

// Add reference
const addReference = async (req, res) => {
  try {
    const userId = req.userId;
    const referenceData = req.body;
    
    const profile = await prisma.expertProfile.findUnique({
      where: { userId }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }
    
    const reference = await prisma.professionalReference.create({
      data: {
        expertProfileId: profile.id,
        ...referenceData
      }
    });
    
    // TODO: Send verification email to reference
    
    res.json({
      message: 'Reference added successfully',
      reference
    });
  } catch (error) {
    console.error('Add reference error:', error);
    res.status(500).json({ error: 'Failed to add reference' });
  }
};

// Take domain test
const takeDomainTest = async (req, res) => {
  try {
    const userId = req.userId;
    const { domain, questions, answers } = req.body;
    
    const profile = await prisma.expertProfile.findUnique({
      where: { userId }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }
    
    // TODO: Implement actual test scoring logic
    const score = 85; // Placeholder
    
    const test = await prisma.domainTest.create({
      data: {
        expertProfileId: profile.id,
        domain,
        score,
        questions,
        answers
      }
    });
    
    await updateExpertVerification(userId);
    
    res.json({
      message: 'Test completed successfully',
      test
    });
  } catch (error) {
    console.error('Domain test error:', error);
    res.status(500).json({ error: 'Failed to complete test' });
  }
};

// Get expert profile
const getProfile = async (req, res) => {
  try {
    const userId = req.params.userId || req.userId;
    
    const profile = await prisma.expertProfile.findUnique({
      where: { userId },
      include: {
        verificationEvidence: true,
        education: true,
        certifications: true,
        licenses: true,
        domainTests: {
          orderBy: { dateTaken: 'desc' },
          take: 5
        },
        references: true,
        endorsements: {
          include: {
            endorser: {
              select: {
                id: true,
                email: true
              }
            }
          }
        },
        ExpertAnswer: {
          include: {
            answer: true
          },
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }
    
    res.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};
// Get verification requirements for next level
const getVerificationRequirements = async (req, res) => {
  try {
    const userId = req.userId;
    
    const profile = await prisma.expertProfile.findUnique({
      where: { userId },
      include: {
        verificationEvidence: true,
        domainTests: true,
        references: true,
        endorsements: true,
        ExpertAnswer: true
      }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }
    
    const requirements = getRequirementsForLevel(profile.verificationLevel + 1);
    const progress = calculateProgressToNextLevel(profile);
    
    res.json({
      currentLevel: profile.verificationLevel,
      nextLevel: profile.verificationLevel + 1,
      requirements,
      progress
    });
  } catch (error) {
    console.error('Get requirements error:', error);
    res.status(500).json({ error: 'Failed to fetch requirements' });
  }
};

// Helper function to get requirements for a level
const getRequirementsForLevel = (level) => {
  const requirements = {
    1: {
      evidence: 1,
      testScore: 60,
      references: 0,
      answers: 0,
      endorsements: 0
    },
    2: {
      evidence: 2,
      testScore: 75,
      references: 1,
      answers: 10,
      endorsements: 0
    },
    3: {
      evidence: 3,
      testScore: 85,
      references: 2,
      answers: 50,
      endorsements: 3
    },
    4: {
      evidence: 3,
      testScore: 85,
      references: 2,
      answers: 100,
      endorsements: 5,
      accuracyScore: 95
    }
  };
  
  return requirements[level] || requirements[4];
};

// Calculate progress to next level
const calculateProgressToNextLevel = (profile) => {
  const nextLevel = profile.verificationLevel + 1;
  const requirements = getRequirementsForLevel(nextLevel);
  
  const verifiedEvidence = profile.verificationEvidence.filter(e => e.verified).length;
  const avgTestScore = profile.domainTests.length > 0
    ? profile.domainTests.reduce((sum, t) => sum + t.score, 0) / profile.domainTests.length
    : 0;
  const verifiedReferences = profile.references.filter(r => r.verified).length;
  const totalAnswers = profile.ExpertAnswer.length;
  const qualifiedEndorsements = profile.endorsements.filter(e => e.endorserLevel >= 2).length;
  
  return {
    evidence: {
      current: verifiedEvidence,
      required: requirements.evidence,
      percentage: (verifiedEvidence / requirements.evidence) * 100
    },
    testScore: {
      current: avgTestScore,
      required: requirements.testScore,
      percentage: (avgTestScore / requirements.testScore) * 100
    },
    references: {
      current: verifiedReferences,
      required: requirements.references,
      percentage: (verifiedReferences / Math.max(1, requirements.references)) * 100
    },
    answers: {
      current: totalAnswers,
      required: requirements.answers,
      percentage: (totalAnswers / Math.max(1, requirements.answers)) * 100
    },
    endorsements: {
      current: qualifiedEndorsements,
      required: requirements.endorsements,
      percentage: (qualifiedEndorsements / Math.max(1, requirements.endorsements)) * 100
    }
  };
};


const getQuestions = async (req, res) => {
  try {
    // Get ALL questions from all active ideas
    const questions = await prisma.validationQuestion.findMany({
      include: {
        idea: {
          include: {
            user: true,
            escrowContributions: true
          }
        },
        userAnswers: {
          where: {
            userId: req.userId // Still check if THIS expert has answered
          },
          include: {
            expertAnswer: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    
    // Format questions with additional info
    const formattedQuestions = questions.map(q => ({
      ...q,
      hasAnswered: q.userAnswers.length > 0,
      escrowAmount: q.idea.escrowContributions.reduce((sum, c) => sum + c.amount, 0),
      ideaTitle: q.idea.title,
      ideaSector: q.idea.sector,
      ideaStatus: q.idea.status
    }));
    
    res.json({ questions: formattedQuestions });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};

module.exports = {
  createOrUpdateProfile,
  uploadEvidence,
  addEducation,
  addCertification,
  addReference,
  takeDomainTest,
  getProfile,
  getVerificationRequirements,
  getQuestions
};module.exports = {
  createOrUpdateProfile,
  uploadEvidence,
  addEducation,
  addCertification,
  addReference,
  takeDomainTest,
  getProfile,
  getVerificationRequirements,
  getQuestions
};