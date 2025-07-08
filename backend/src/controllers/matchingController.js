const matchingService = require('../services/matchingService');
const notificationService = require('../services/notificationService');

exports.findExperts = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { includeExternal = true, limit = 20 } = req.query;

    const results = await matchingService.findMatchingExperts(questionId, {
      includeExternal: includeExternal === 'true',
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error finding experts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

exports.notifyExperts = async (req, res) => {
  try {
    const { questionId } = req.params;
    const { expertIds } = req.body;

    const matchingResults = await matchingService.findMatchingExperts(questionId);
    
    if (expertIds && expertIds.length > 0) {
      matchingResults.internalMatches = matchingResults.internalMatches.filter(
        match => expertIds.includes(match.expertId)
      );
    }

    const notifications = await notificationService.notifyMatchedExperts(
      matchingResults,
      req.userId // From auth middleware
    );

    res.json({
      success: true,
      notificationsSent: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error('Error notifying experts:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
