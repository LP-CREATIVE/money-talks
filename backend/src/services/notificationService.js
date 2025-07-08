const { PrismaClient } = require('@prisma/client');
const emailService = require('./emailService');
const prisma = new PrismaClient();

class NotificationService {
  async createNotification(userId, type, title, message, data = null) {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          data
        }
      });
      
      // Send email notification
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user && user.email && type === 'QUESTION_MATCH') {
        emailService.sendExpertNotification(user.email, notification).catch(console.error);
      }
      
      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async notifyMatchedExperts(matchingResults, requestedByUserId) {
    const notifications = [];
    const { question, internalMatches } = matchingResults;

    for (const match of internalMatches) {
      const notification = await this.createNotification(
        match.userId,
        'QUESTION_MATCH',
        'New Research Question Match',
        `You've been matched to a high-value research question worth $${match.estimatedCost}. Your expertise score: ${match.totalScore}/200.`,
        {
          questionId: question.id,
          questionText: question.text,
          ideaId: question.ideaId,
          ideaTitle: question.idea.title,
          matchScore: match.totalScore,
          scoreBreakdown: match.scoreBreakdown,
          estimatedCost: match.estimatedCost,
          requestedByUserId
        }
      );
      
      notifications.push(notification);
    }

    return notifications;
  }

  async getUserNotifications(userId, { limit = 20, offset = 0, unreadOnly = false } = {}) {
    const where = { userId };
    if (unreadOnly) {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, read: false }
    });

    return { notifications, unreadCount };
  }

  async markAsRead(notificationId, userId) {
    return await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId
      },
      data: { read: true }
    });
  }

  async markAllAsRead(userId) {
    return await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });
  }
}

module.exports = new NotificationService();
