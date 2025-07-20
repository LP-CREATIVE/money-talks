const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getExpertProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const profile = await prisma.expertProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        employmentHistory: {
          orderBy: { startDate: 'desc' }
        },
        observablePatterns: {
          where: { isActive: true }
        },
        expertiseAreas: true,
        companyRelationships: {
          where: { isActive: true }
        },
        connections: true,
        ExpertAnswer: true
      }
    });

    if (!profile) {
      // Create a basic profile if it doesn't exist
      const newProfile = await prisma.expertProfile.create({
        data: {
          userId,
          fullName: req.user.email.split('@')[0], // Default name from email
          yearsInIndustry: 0
        }
      });
      return res.json(newProfile);
    }

    // Calculate ranking (simple implementation - you can enhance this)
    const allExperts = await prisma.expertProfile.findMany({
      select: { id: true, totalEarnings: true }
    });
    
    const sortedByEarnings = allExperts.sort((a, b) => b.totalEarnings - a.totalEarnings);
    const ranking = sortedByEarnings.findIndex(e => e.id === profile.id) + 1;

    res.json({
      ...profile,
      ranking
    });
  } catch (error) {
    console.error('Error fetching expert profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const updateExpertProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    const profile = await prisma.expertProfile.update({
      where: { userId },
      data: updates
    });

    res.json(profile);
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

module.exports = {
  getExpertProfile,
  updateExpertProfile
};
