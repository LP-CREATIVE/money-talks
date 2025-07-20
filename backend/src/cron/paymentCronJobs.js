const cron = require('node-cron');
const queueService = require('../services/queueService');
const paymentService = require('../services/paymentService');
const prisma = require('../utils/prisma');

const checkExpiredAssignments = cron.schedule('*/5 * * * *', async () => {
  console.log('Checking for expired assignments...');
  try {
    await queueService.checkExpiredAssignments();
  } catch (error) {
    console.error('Error in expired assignments cron:', error);
  }
}, {
  scheduled: false
});

const updateExpertRankings = cron.schedule('0 2 * * *', async () => {
  console.log('Updating expert rankings...');
  try {
    await queueService.updateExpertRankings();
  } catch (error) {
    console.error('Error in expert rankings cron:', error);
  }
}, {
  scheduled: false
});

const processStuckPayments = cron.schedule('0 * * * *', async () => {
  console.log('Checking for stuck payments...');
  try {
    const stuckPayments = await prisma.paymentTransaction.findMany({
      where: {
        status: 'PROCESSING',
        createdAt: {
          lt: new Date(Date.now() - 30 * 60 * 1000)
        }
      }
    });

    for (const payment of stuckPayments) {
      console.log(`Retrying stuck payment: ${payment.id}`);
      try {
        await paymentService.processPayment(payment.id);
      } catch (error) {
        console.error(`Failed to process stuck payment ${payment.id}:`, error);
        await prisma.paymentTransaction.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            errorMessage: 'Payment processing timeout'
          }
        });
      }
    }
  } catch (error) {
    console.error('Error in stuck payments cron:', error);
  }
}, {
  scheduled: false
});

const startCronJobs = () => {
  checkExpiredAssignments.start();
  updateExpertRankings.start();
  processStuckPayments.start();
  console.log('Payment system cron jobs started');
};

const stopCronJobs = () => {
  checkExpiredAssignments.stop();
  updateExpertRankings.stop();
  processStuckPayments.stop();
  console.log('Payment system cron jobs stopped');
};

module.exports = {
  startCronJobs,
  stopCronJobs
};
