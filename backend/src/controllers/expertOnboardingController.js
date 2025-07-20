const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getOnboardingProfile = async (req, res) => {
  try {
    const profile = await prisma.expertProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        employmentHistory: true,
        observablePatterns: true,
        expertiseAreas: true,
        companyRelationships: true,
        connections: true
      }
    });

    res.json({ profile });
  } catch (error) {
    console.error('Error fetching onboarding profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

const submitOnboardingProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      employment, 
      observablePatterns, 
      expertise, 
      companyRelationships, 
      connections 
    } = req.body;

    let profile = await prisma.expertProfile.findUnique({
      where: { userId }
    });

    if (!profile) {
      profile = await prisma.expertProfile.create({
        data: {
          userId,
          fullName: req.user.email.split('@')[0],
          yearsInIndustry: 0
        }
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.expertEmployment.deleteMany({ where: { expertProfileId: profile.id } });
      await tx.observablePattern.deleteMany({ where: { expertProfileId: profile.id } });
      await tx.expertiseArea.deleteMany({ where: { expertProfileId: profile.id } });
      await tx.companyRelationship.deleteMany({ where: { expertProfileId: profile.id } });
      await tx.expertConnection.deleteMany({ where: { expertProfileId: profile.id } });

      if (employment?.length > 0) {
        await tx.expertEmployment.createMany({
          data: employment.map(job => ({
            expertProfileId: profile.id,
            company: job.company,
            title: job.title,
            department: job.department,
            startDate: new Date(job.startDate),
            endDate: job.endDate ? new Date(job.endDate) : null,
            isCurrent: job.isCurrent,
            responsibilities: job.responsibilities || [],
            achievements: job.achievements || []
          }))
        });
      }

      if (observablePatterns?.length > 0) {
        await tx.observablePattern.createMany({
          data: observablePatterns.map(pattern => ({
            expertProfileId: profile.id,
            company: pattern.company,
            patternType: pattern.category,
            category: pattern.patternType,
            description: pattern.description,
            frequency: pattern.frequency,
            lastObserved: new Date(pattern.lastObserved),
            confidence: pattern.confidence,
            evidenceUrls: pattern.evidenceUrls || []
          }))
        });
      }

      if (expertise?.length > 0) {
        await tx.expertiseArea.createMany({
          data: expertise.map(exp => ({
            expertProfileId: profile.id,
            type: exp.type,
            value: exp.value,
            yearsExperience: exp.yearsExperience || 0,
            proficiencyLevel: exp.proficiencyLevel || 50,
            lastUsed: exp.lastUsed ? new Date(exp.lastUsed) : null
          }))
        });
      }

      if (companyRelationships?.length > 0) {
        await tx.companyRelationship.createMany({
          data: companyRelationships.map(rel => ({
            expertProfileId: profile.id,
            company: rel.company,
            relationshipType: rel.relationshipType,
            description: rel.description,
            startDate: new Date(rel.startDate),
            isActive: rel.isActive
          }))
        });
      }

      if (connections?.length > 0) {
        await tx.expertConnection.createMany({
          data: connections.map(conn => ({
            expertProfileId: profile.id,
            name: conn.name,
            email: conn.email,
            company: conn.company,
            title: conn.title,
            relationship: conn.relationship,
            trustLevel: conn.trustLevel
          }))
        });
      }

      await tx.expertProfile.update({
        where: { id: profile.id },
        data: {
          submittedForReview: true,
          submittedAt: new Date()
        }
      });
    });

    res.json({ 
      success: true, 
      message: 'Profile submitted successfully' 
    });
  } catch (error) {
    console.error('Error submitting profile:', error);
    res.status(500).json({ error: 'Failed to submit profile' });
  }
};

const addObservablePattern = async (req, res) => {
  try {
    const pattern = req.body;
    
    const profile = await prisma.expertProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }

    const newPattern = await prisma.observablePattern.create({
      data: {
        expertProfileId: profile.id,
        company: pattern.company,
        patternType: pattern.category,
        category: pattern.patternType,
        description: pattern.description,
        frequency: pattern.frequency,
        lastObserved: new Date(pattern.lastObserved),
        confidence: pattern.confidence,
        evidenceUrls: pattern.evidenceUrls || []
      }
    });

    res.json(newPattern);
  } catch (error) {
    console.error('Error adding pattern:', error);
    res.status(500).json({ error: 'Failed to add pattern' });
  }
};

const updateEmploymentHistory = async (req, res) => {
  try {
    const { employment } = req.body;
    
    const profile = await prisma.expertProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }

    await prisma.expertEmployment.deleteMany({
      where: { expertProfileId: profile.id }
    });

    if (employment?.length > 0) {
      await prisma.expertEmployment.createMany({
        data: employment.map(job => ({
          expertProfileId: profile.id,
          company: job.company,
          title: job.title,
          department: job.department,
          startDate: new Date(job.startDate),
          endDate: job.endDate ? new Date(job.endDate) : null,
          isCurrent: job.isCurrent,
          responsibilities: job.responsibilities || [],
          achievements: job.achievements || []
        }))
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating employment:', error);
    res.status(500).json({ error: 'Failed to update employment history' });
  }
};

const updateExpertiseAreas = async (req, res) => {
  try {
    const { expertise } = req.body;
    
    const profile = await prisma.expertProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }

    await prisma.expertiseArea.deleteMany({
      where: { expertProfileId: profile.id }
    });

    if (expertise?.length > 0) {
      await prisma.expertiseArea.createMany({
        data: expertise.map(exp => ({
          expertProfileId: profile.id,
          type: exp.type,
          value: exp.value,
          yearsExperience: exp.yearsExperience || 0,
          proficiencyLevel: exp.proficiencyLevel || 50,
          lastUsed: exp.lastUsed ? new Date(exp.lastUsed) : null
        }))
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating expertise:', error);
    res.status(500).json({ error: 'Failed to update expertise areas' });
  }
};

const addCompanyRelationship = async (req, res) => {
  try {
    const relationship = req.body;
    
    const profile = await prisma.expertProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }

    const newRelationship = await prisma.companyRelationship.create({
      data: {
        expertProfileId: profile.id,
        company: relationship.company,
        relationshipType: relationship.relationshipType,
        description: relationship.description,
        startDate: new Date(relationship.startDate),
        endDate: relationship.endDate ? new Date(relationship.endDate) : null,
        isActive: relationship.isActive !== false
      }
    });

    res.json(newRelationship);
  } catch (error) {
    console.error('Error adding relationship:', error);
    res.status(500).json({ error: 'Failed to add company relationship' });
  }
};

const addConnection = async (req, res) => {
  try {
    const connection = req.body;
    
    const profile = await prisma.expertProfile.findUnique({
      where: { userId: req.user.id }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }

    const newConnection = await prisma.expertConnection.create({
      data: {
        expertProfileId: profile.id,
        name: connection.name,
        email: connection.email || '',
        company: connection.company,
        title: connection.title || '',
        relationship: connection.relationship,
        trustLevel: connection.trustLevel || 50
      }
    });

    res.json(newConnection);
  } catch (error) {
    console.error('Error adding connection:', error);
    res.status(500).json({ error: 'Failed to add connection' });
  }
};

const getFullExpertProfile = async (req, res) => {
  try {
    const profile = await prisma.expertProfile.findUnique({
      where: { userId: req.user.id },
      include: {
        employmentHistory: true,
        observablePatterns: true,
        expertiseAreas: true,
        companyRelationships: true,
        connections: true,
        user: {
          select: {
            email: true,
            organizationName: true
          }
        }
      }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Failed to fetch expert profile' });
  }
};

module.exports = {
  getOnboardingProfile,
  submitOnboardingProfile,
  addObservablePattern,
  updateEmploymentHistory,
  updateExpertiseAreas,
  addCompanyRelationship,
  addConnection,
  getFullExpertProfile
};

// Add employment
const addEmployment = async (req, res) => {
  try {
    const userId = req.userId || req.user.id;
    const profile = await prisma.expertProfile.findUnique({
      where: { userId }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }
    
    const employment = await prisma.expertEmployment.create({
      data: {
        ...req.body,
        expertProfileId: profile.id
      }
    });
    
    res.json(employment);
  } catch (error) {
    console.error('Add employment error:', error);
    res.status(500).json({ error: 'Failed to add employment' });
  }
};

// Update employment
// Update employment
const updateEmployment = async (req, res) => {
  try {
    const userId = req.userId || req.user.id;
    
    // Get expert profile
    const profile = await prisma.expertProfile.findUnique({
      where: { userId }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }
    
    // Delete existing employment history
    await prisma.expertEmployment.deleteMany({
      where: { expertProfileId: profile.id }
    });
    
    // Create new employment entries
    const { employment } = req.body;
    if (employment && employment.length > 0) {
      const employmentData = employment.map(emp => ({
        expertProfileId: profile.id,
        company: emp.company,
        title: emp.title,
        department: emp.department || null,
        startDate: new Date(emp.startDate),
        endDate: emp.endDate ? new Date(emp.endDate) : null,
        isCurrent: emp.isCurrent || false,
        responsibilities: emp.responsibilities || [],
        achievements: emp.achievements || []
      }));
      
      await prisma.expertEmployment.createMany({
        data: employmentData
      });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update employment error:', error);
    res.status(500).json({ error: 'Failed to update employment' });
  }
};

// Delete employment
const deleteEmployment = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.expertEmployment.delete({
      where: { id }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete employment error:', error);
    res.status(500).json({ error: 'Failed to delete employment' });
  }
};

module.exports.addEmployment = addEmployment;
module.exports.updateEmployment = updateEmployment;
module.exports.deleteEmployment = deleteEmployment;

// Add expertise
const addExpertise = async (req, res) => {
  try {
    const userId = req.userId || req.user.id;
    const profile = await prisma.expertProfile.findUnique({
      where: { userId }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }
    
    const expertise = await prisma.expertiseArea.create({
      data: {
        ...req.body,
        expertProfileId: profile.id
      }
    });
    
    res.json(expertise);
  } catch (error) {
    console.error('Add expertise error:', error);
    res.status(500).json({ error: 'Failed to add expertise' });
  }
};

// Update expertise
const updateExpertise = async (req, res) => {
  try {
    const userId = req.userId || req.user.id;
    const profile = await prisma.expertProfile.findUnique({
      where: { userId }
    });
    
    if (!profile) {
      return res.status(404).json({ error: 'Expert profile not found' });
    }
    
    // Delete existing expertise
    await prisma.expertiseArea.deleteMany({
      where: { expertProfileId: profile.id }
    });
    
    // Create new expertise entries
    const { expertise } = req.body;
    if (expertise && expertise.length > 0) {
      const expertiseData = expertise.map(exp => ({
        expertProfileId: profile.id,
        type: exp.type || "GENERAL",
        value: exp.value || exp.name || "",
        yearsExperience: exp.yearsExperience || 0,
        proficiencyLevel: exp.proficiencyLevel || 50
      }));    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Update expertise error:', error);
    res.status(500).json({ error: 'Failed to update expertise' });
  }
};

// Delete expertise
const deleteExpertise = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.expertiseArea.delete({
      where: { id }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete expertise error:', error);
    res.status(500).json({ error: 'Failed to delete expertise' });
  }
};

module.exports.addExpertise = addExpertise;
module.exports.updateExpertise = updateExpertise;
module.exports.deleteExpertise = deleteExpertise;
