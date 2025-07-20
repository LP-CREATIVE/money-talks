const prisma = require('../utils/prisma');

// Get all philosophies
const getPhilosophies = async (req, res) => {
  try {
    const { category } = req.query;
    const where = category ? { category } : {};
    
    const philosophies = await prisma.aIPhilosophy.findMany({
      where,
      orderBy: [{ weight: 'desc' }, { createdAt: 'desc' }]
    });
    
    res.json(philosophies);
  } catch (error) {
    console.error('Error fetching philosophies:', error);
    res.status(500).json({ error: 'Failed to fetch philosophies' });
  }
};

// Create philosophy
const createPhilosophy = async (req, res) => {
  try {
    const { name, content, category, weight } = req.body;
    
    const philosophy = await prisma.aIPhilosophy.create({
      data: {
        name,
        content,
        category,
        weight: weight || 1.0
      }
    });
    
    res.json(philosophy);
  } catch (error) {
    console.error('Error creating philosophy:', error);
    res.status(500).json({ error: 'Failed to create philosophy' });
  }
};

// Update philosophy
const updatePhilosophy = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, content, category, weight, active } = req.body;
    
    const philosophy = await prisma.aIPhilosophy.update({
      where: { id },
      data: {
        name,
        content,
        category,
        weight,
        active,
        version: { increment: 1 }
      }
    });
    
    res.json(philosophy);
  } catch (error) {
    console.error('Error updating philosophy:', error);
    res.status(500).json({ error: 'Failed to update philosophy' });
  }
};

// Delete philosophy
const deletePhilosophy = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.aIPhilosophy.delete({
      where: { id }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting philosophy:', error);
    res.status(500).json({ error: 'Failed to delete philosophy' });
  }
};

// Toggle philosophy active status
const togglePhilosophy = async (req, res) => {
  try {
    const { id } = req.params;
    
    const philosophy = await prisma.aIPhilosophy.findUnique({
      where: { id }
    });
    
    const updated = await prisma.aIPhilosophy.update({
      where: { id },
      data: { active: !philosophy.active }
    });
    
    res.json(updated);
  } catch (error) {
    console.error('Error toggling philosophy:', error);
    res.status(500).json({ error: 'Failed to toggle philosophy' });
  }
};

module.exports = {
  getPhilosophies,
  createPhilosophy,
  updatePhilosophy,
  deletePhilosophy,
  togglePhilosophy
};
