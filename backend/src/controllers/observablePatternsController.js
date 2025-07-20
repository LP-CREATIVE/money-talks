const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { observablePatternCategories, validatePatternInput } = require('../config/observablePatternCategories');

// Get all observable patterns for an expert
const getExpertPatterns = async (req, res) => {
  try {
    const expertProfile = await prisma.expertProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        observablePatterns: {
          orderBy: { lastObserved: 'desc' }
        }
      }
    });

    if (!expertProfile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }

    res.json({
      patterns: expertProfile.observablePatterns,
      categories: observablePatternCategories
    });
  } catch (error) {
    console.error('Error fetching patterns:', error);
    res.status(500).json({ error: 'Failed to fetch observable patterns' });
  }
};

// Create new observable pattern
const createPattern = async (req, res) => {
  try {
    const {
      company,
      patternType,
      category,
      description,
      frequency,
      lastObserved,
      confidence,
      evidenceUrls
    } = req.body;

    // Validate pattern type and category
    const validation = validatePatternInput(patternType, category);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const expertProfile = await prisma.expertProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!expertProfile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }

    const pattern = await prisma.observablePattern.create({
      data: {
        expertProfileId: expertProfile.id,
        company,
        patternType,
        category,
        description,
        frequency,
        lastObserved: new Date(lastObserved),
        confidence: parseInt(confidence),
        evidenceUrls: evidenceUrls || [],
        isActive: true
      }
    });

    res.json({
      success: true,
      pattern
    });
  } catch (error) {
    console.error('Error creating pattern:', error);
    res.status(500).json({ error: 'Failed to create observable pattern' });
  }
};

// Update observable pattern
const updatePattern = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Verify ownership
    const pattern = await prisma.observablePattern.findFirst({
      where: {
        id,
        expertProfile: {
          userId: req.user.id
        }
      }
    });

    if (!pattern) {
      return res.status(404).json({ error: 'Pattern not found or unauthorized' });
    }

    // If updating pattern type/category, validate
    if (updates.patternType || updates.category) {
      const validation = validatePatternInput(
        updates.patternType || pattern.patternType,
        updates.category || pattern.category
      );
      if (!validation.valid) {
        return res.status(400).json({ error: validation.error });
      }
    }

    // Update pattern
    const updatedPattern = await prisma.observablePattern.update({
      where: { id },
      data: {
        ...updates,
        lastObserved: updates.lastObserved ? new Date(updates.lastObserved) : undefined,
        confidence: updates.confidence ? parseInt(updates.confidence) : undefined
      }
    });

    res.json({
      success: true,
      pattern: updatedPattern
    });
  } catch (error) {
    console.error('Error updating pattern:', error);
    res.status(500).json({ error: 'Failed to update pattern' });
  }
};

// Delete observable pattern
const deletePattern = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const pattern = await prisma.observablePattern.findFirst({
      where: {
        id,
        expertProfile: {
          userId: req.user.id
        }
      }
    });

    if (!pattern) {
      return res.status(404).json({ error: 'Pattern not found or unauthorized' });
    }

    await prisma.observablePattern.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Pattern deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pattern:', error);
    res.status(500).json({ error: 'Failed to delete pattern' });
  }
};

// Get patterns for a specific company
const getCompanyPatterns = async (req, res) => {
  try {
    const { company } = req.params;

    const expertProfile = await prisma.expertProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!expertProfile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }

    const patterns = await prisma.observablePattern.findMany({
      where: {
        expertProfileId: expertProfile.id,
        company: {
          contains: company,
          mode: 'insensitive'
        }
      },
      orderBy: { lastObserved: 'desc' }
    });

    res.json({ patterns });
  } catch (error) {
    console.error('Error fetching company patterns:', error);
    res.status(500).json({ error: 'Failed to fetch company patterns' });
  }
};

// Record observation for a question
const recordObservation = async (req, res) => {
  try {
    const { questionId } = req.params;
    const {
      observationType,
      observationDate,
      details,
      confidence,
      location,
      latitude,
      longitude,
      evidenceType,
      evidenceUrl
    } = req.body;

    const expertProfile = await prisma.expertProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!expertProfile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }

    // Verify expert has access to this question
    const question = await prisma.validationQuestion.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    const observation = await prisma.companyObservation.create({
      data: {
        expertId: expertProfile.id,
        questionId,
        observationType,
        observationDate: new Date(observationDate),
        details,
        confidence: parseFloat(confidence),
        location,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        evidenceType,
        evidenceUrl
      }
    });

    res.json({
      success: true,
      observation
    });
  } catch (error) {
    console.error('Error recording observation:', error);
    res.status(500).json({ error: 'Failed to record observation' });
  }
};

// Get observations for a question
const getQuestionObservations = async (req, res) => {
  try {
    const { questionId } = req.params;

    const expertProfile = await prisma.expertProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!expertProfile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }

    const observations = await prisma.companyObservation.findMany({
      where: {
        expertId: expertProfile.id,
        questionId
      },
      orderBy: { observationDate: 'desc' }
    });

    res.json({ observations });
  } catch (error) {
    console.error('Error fetching observations:', error);
    res.status(500).json({ error: 'Failed to fetch observations' });
  }
};

// Get pattern statistics
const getPatternStats = async (req, res) => {
  try {
    const expertProfile = await prisma.expertProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!expertProfile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }

    const stats = await prisma.observablePattern.groupBy({
      by: ['patternType'],
      where: {
        expertProfileId: expertProfile.id,
        isActive: true
      },
      _count: {
        id: true
      }
    });

    const recentPatterns = await prisma.observablePattern.findMany({
      where: {
        expertProfileId: expertProfile.id,
        lastObserved: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      select: {
        id: true,
        company: true,
        patternType: true,
        category: true,
        lastObserved: true,
        confidence: true
      },
      orderBy: { lastObserved: 'desc' },
      take: 10
    });

    const companiesObserved = await prisma.observablePattern.findMany({
      where: {
        expertProfileId: expertProfile.id
      },
      select: {
        company: true
      },
      distinct: ['company']
    });

    res.json({
      stats: {
        totalPatterns: stats.reduce((sum, s) => sum + s._count.id, 0),
        byCategory: stats,
        recentPatterns,
        companiesObserved: companiesObserved.length,
        companies: companiesObserved.map(c => c.company)
      }
    });
  } catch (error) {
    console.error('Error fetching pattern stats:', error);
    res.status(500).json({ error: 'Failed to fetch pattern statistics' });
  }
};

module.exports = {
  getExpertPatterns,
  createPattern,
  updatePattern,
  deletePattern,
  getCompanyPatterns,
  recordObservation,
  getQuestionObservations,
  getPatternStats
};
