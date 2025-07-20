const emailService = require('../services/emailService');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

// Generate a demo outreach email
const sendDemoOutreachEmail = async (req, res) => {
  try {
    const { email, questionId } = req.body;
    
    // Get question details
    const question = await prisma.validationQuestion.findFirst({
      where: questionId ? { id: questionId } : {},
      include: {
        idea: true
      }
    });

    if (!question) {
      return res.status(404).json({ error: 'No questions found. Create one first.' });
    }

    // Create a preview token
    const previewToken = jwt.sign(
      { 
        email,
        questionId: question.id,
        isDemo: true 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const previewUrl = `${process.env.FRONTEND_URL}/expert-preview/${previewToken}`;

    // Email HTML template
    const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1>$${question.escrowAmount || 15000} Research Opportunity</h1>
      <p><strong>Question:</strong> ${question.text}</p>
      <p>Your expertise makes you perfect for this question.</p>
      <a href="${previewUrl}" class="button">View Full Details</a>
    </body>
    </html>
    `;

    // Send the email
    await emailService.sendEmail({
      to: email,
      subject: `$${question.escrowAmount || 15000} Research Opportunity`,
      html: emailHtml,
      text: `View opportunity: ${previewUrl}`
    });

    res.json({ 
      success: true, 
      message: `Demo email sent to ${email}`,
      previewUrl
    });

  } catch (error) {
    console.error('Demo email error:', error);
    res.status(500).json({ error: error.message || 'Failed to send demo email' });
  }
};

// Get question preview for email recipients
const getQuestionPreview = async (req, res) => {
  try {
    const { token } = req.params;
    console.log('Preview endpoint called with token:', token);
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified successfully');
    } catch (verifyError) {
      console.error('JWT Verification error:', verifyError.message);
      return res.status(400).json({ error: 'Invalid or expired preview link' });
    }
    
    // Get question details - fixed the relation name
    const question = await prisma.validationQuestion.findUnique({
      where: { id: decoded.questionId },
      include: {
        idea: {
          include: {
            createdBy: {
              select: {
                organizationName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!question) {
      console.log('Question not found for ID:', decoded.questionId);
      return res.status(404).json({ error: 'Question not found' });
    }

    console.log('Question found, sending response');
    res.json({
      question,
      recipientEmail: decoded.email,
      isDemo: decoded.isDemo
    });

  } catch (error) {
    console.error('Preview endpoint error:', error);
    res.status(400).json({ error: 'Invalid or expired preview link' });
  }
};

module.exports = {
  sendDemoOutreachEmail,
  getQuestionPreview
};
