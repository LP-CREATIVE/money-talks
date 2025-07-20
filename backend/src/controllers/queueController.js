const queueService = require('../services/queueService');

const getNextAssignment = async (req, res) => {
  try {
    const expertId = req.user.id;
    
    const assignment = await queueService.getNextAssignment(expertId);

    res.json({
      success: true,
      ...assignment
    });
  } catch (error) {
    console.error('Error getting next assignment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const acceptAssignment = async (req, res) => {
  try {
    const { questionId } = req.params;
    const expertId = req.user.id;

    const result = await queueService.acceptAssignment(questionId, expertId);

    res.json({
      success: true,
      message: 'Assignment accepted',
      ...result
    });
  } catch (error) {
    console.error('Error accepting assignment:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const declineAssignment = async (req, res) => {
  try {
    const { questionId } = req.params;
    const expertId = req.user.id;

    const result = await queueService.declineAssignment(questionId, expertId);

    res.json({
      success: true,
      message: 'Assignment declined',
      ...result
    });
  } catch (error) {
    console.error('Error declining assignment:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

const getQueueStatus = async (req, res) => {
  try {
    const { questionId } = req.params;

    const status = await queueService.getQueueStatus(questionId);

    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('Error getting queue status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const buildQueue = async (req, res) => {
  try {
    const { questionId } = req.params;

    const queue = await queueService.buildExpertQueue(questionId);

    res.json({
      success: true,
      message: 'Expert queue built',
      queueLength: queue.length
    });
  } catch (error) {
    console.error('Error building queue:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = {
  getNextAssignment,
  acceptAssignment,
  declineAssignment,
  getQueueStatus,
  buildQueue
};
