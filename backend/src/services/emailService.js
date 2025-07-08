const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendEmail({ to, subject, html, text }) {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text,
        html,
      });
      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendExpertNotification(expertEmail, notification) {
    const { questionText, ideaTitle, estimatedCost, matchScore } = notification.data;
    
    const subject = 'New Research Question Match - Money Talks';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #10b981;">New Research Question Match</h2>
        
        <p>You've been matched to a new research question based on your expertise!</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Question:</h3>
          <p style="font-size: 16px; line-height: 1.5;">${questionText}</p>
          
          <div style="margin-top: 15px;">
            <p><strong>Related Idea:</strong> ${ideaTitle}</p>
            <p><strong>Your Match Score:</strong> ${matchScore}/200</p>
            <p><strong>Estimated Earnings:</strong> $${estimatedCost}</p>
          </div>
        </div>
        
        <p>Log in to Money Talks to view more details and accept this question.</p>
        
        <a href="http://localhost:5173/login" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 10px;">
          View Question
        </a>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          You're receiving this because you're registered as an expert on Money Talks.
        </p>
      </div>
    `;
    
    const text = `
      New Research Question Match
      
      You've been matched to a new research question!
      
      Question: ${questionText}
      Related Idea: ${ideaTitle}
      Your Match Score: ${matchScore}/200
      Estimated Earnings: $${estimatedCost}
      
      Log in to Money Talks to view more details and accept this question.
      http://localhost:5173/login
    `;
    
    return this.sendEmail({ to: expertEmail, subject, html, text });
  }
}

module.exports = new EmailService();
