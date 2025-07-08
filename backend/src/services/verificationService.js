const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Calculate verification score based on evidence and performance
const calculateVerificationScore = async (expertProfile) => {
  const components = {
    profileCompleteness: {
      weight: 0.10,
      score: calculateProfileCompleteness(expertProfile)
    },
    evidenceQuality: {
      weight: 0.25,
      score: await calculateEvidenceScore(expertProfile.id)
    },
    knowledgeAssessment: {
      weight: 0.20,
      score: await calculateKnowledgeScore(expertProfile.id)
    },
    trackRecord: {
      weight: 0.25,
      score: calculateTrackRecordScore(expertProfile)
    },
    socialProof: {
      weight: 0.15,
      score: await calculateSocialProofScore(expertProfile.id)
    },
    recency: {
      weight: 0.05,
      score: calculateRecencyScore(expertProfile)
    }
  };

  const baseScore = Object.values(components).reduce(
    (sum, c) => sum + (c.score * c.weight), 0
  );

  // Apply penalties
  const penalties = calculatePenalties(expertProfile);
  
  return Math.max(0, Math.min(100, baseScore - penalties));
};

// Calculate profile completeness
const calculateProfileCompleteness = (profile) => {
  const fields = [
    profile.fullName,
    profile.currentRole,
    profile.currentEmployer,
    profile.primaryIndustry,
    profile.yearsInIndustry > 0,
    profile.functionalExpertise,
    profile.specificExpertiseTags.length > 0
  ];
  
  const completed = fields.filter(f => !!f).length;
  return (completed / fields.length) * 100;
};

// Calculate evidence score
const calculateEvidenceScore = async (expertProfileId) => {
  const evidence = await prisma.verificationEvidence.findMany({
    where: { expertProfileId }
  });
  
  const evidenceWeights = {
    PAYSTUB: 20,
    WORK_BADGE: 20,
    INTERNAL_SCREENSHOT: 25,
    LINKEDIN_PROFILE: 10,
    WORK_EMAIL_DOMAIN: 15,
    VIDEO_INTRODUCTION: 10
  };
  
  let score = 0;
  evidence.forEach(e => {
    if (e.verified) {
      score += evidenceWeights[e.evidenceType] || 0;
    }
  });
  
  return Math.min(100, score);
};

// Calculate knowledge assessment score
const calculateKnowledgeScore = async (expertProfileId) => {
  const tests = await prisma.domainTest.findMany({
    where: { expertProfileId },
    orderBy: { dateTaken: 'desc' },
    take: 5
  });
  
  if (tests.length === 0) return 0;
  
  const avgScore = tests.reduce((sum, t) => sum + t.score, 0) / tests.length;
  return avgScore;
};

// Calculate track record score
const calculateTrackRecordScore = (profile) => {
  if (!profile.accuracyScore || profile.totalEarnings === 0) return 0;
  
  // Combine accuracy with earnings as a proxy for experience
  const accuracyComponent = profile.accuracyScore * 0.7;
  const earningsComponent = Math.min(30, (profile.totalEarnings / 10000) * 30);
  
  return accuracyComponent + earningsComponent;
};

// Calculate social proof score
const calculateSocialProofScore = async (expertProfileId) => {
  const [references, endorsements] = await Promise.all([
    prisma.professionalReference.count({
      where: { expertProfileId, verified: true }
    }),
    prisma.peerEndorsement.findMany({
      where: { expertProfileId }
    })
  ]);
  
  const referenceScore = Math.min(50, references * 25);
  const endorsementScore = endorsements.reduce((sum, e) => {
    return sum + (e.endorserLevel * 10);
  }, 0);
  
  return Math.min(100, referenceScore + Math.min(50, endorsementScore));
};

// Calculate recency score
const calculateRecencyScore = (profile) => {
  const daysSinceActive = Math.floor(
    (Date.now() - new Date(profile.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  if (daysSinceActive <= 7) return 100;
  if (daysSinceActive <= 30) return 80;
  if (daysSinceActive <= 90) return 60;
  if (daysSinceActive <= 180) return 40;
  return 20;
};

// Calculate penalties
const calculatePenalties = (profile) => {
  let penalties = 0;
  
  // Stale knowledge penalty
  const daysSinceActive = Math.floor(
    (Date.now() - new Date(profile.lastActiveDate).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceActive > 90) penalties += 10;
  
  // Low response rate penalty
  if (profile.responseRate < 0.7) penalties += 10;
  
  // Flags penalty
  penalties += profile.flagsOrWarnings.length * 5;
  
  return penalties;
};

// Determine verification level based on score and requirements
const determineVerificationLevel = async (expertProfileId) => {
  const profile = await prisma.expertProfile.findUnique({
    where: { id: expertProfileId },
    include: {
      verificationEvidence: true,
      domainTests: true,
      references: true,
      endorsements: true,
      ExpertAnswer: true
    }
  });
  
  if (!profile) return 0;
  
  const verifiedEvidence = profile.verificationEvidence.filter(e => e.verified);
  const avgTestScore = profile.domainTests.length > 0
    ? profile.domainTests.reduce((sum, t) => sum + t.score, 0) / profile.domainTests.length
    : 0;
  const verifiedReferences = profile.references.filter(r => r.verified);
  const totalAnswers = profile.ExpertAnswer.length;
  const avgRating = profile.ExpertAnswer.length > 0
    ? profile.ExpertAnswer.reduce((sum, a) => sum + (a.rating || 0), 0) / profile.ExpertAnswer.length
    : 0;
  
  // Level 4: Master Expert
  if (
    verifiedEvidence.length >= 3 &&
    avgTestScore >= 85 &&
    totalAnswers >= 100 &&
    profile.accuracyScore >= 95 &&
    profile.endorsements.filter(e => e.endorserLevel >= 3).length >= 5
  ) {
    return 4;
  }
  
  // Level 3: Expert Verified
  if (
    verifiedEvidence.length >= 3 &&
    avgTestScore >= 85 &&
    totalAnswers >= 50 &&
    avgRating >= 4.5 &&
    profile.endorsements.filter(e => e.endorserLevel >= 2).length >= 3
  ) {
    return 3;
  }
  
  // Level 2: Professional Verified
  if (
    verifiedEvidence.length >= 2 &&
    avgTestScore >= 75 &&
    totalAnswers >= 10 &&
    avgRating >= 4 &&
    verifiedReferences.length >= 1
  ) {
    return 2;
  }
  
  // Level 1: Basic Verified
  if (
    verifiedEvidence.length >= 1 &&
    avgTestScore >= 60
  ) {
    return 1;
  }
  
  return 0;
};

// Update expert verification status
const updateExpertVerification = async (userId) => {
  const profile = await prisma.expertProfile.findUnique({
    where: { userId }
  });
  
  if (!profile) return null;
  
  const [verificationScore, verificationLevel] = await Promise.all([
    calculateVerificationScore(profile),
    determineVerificationLevel(profile.id)
  ]);
  
  return await prisma.expertProfile.update({
    where: { id: profile.id },
    data: {
      verificationScore,
      verificationLevel,
      lastVerificationDate: new Date()
    }
  });
};

module.exports = {
  calculateVerificationScore,
  determineVerificationLevel,
  updateExpertVerification
};
