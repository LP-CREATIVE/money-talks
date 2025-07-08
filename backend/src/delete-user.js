require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteUser() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('Usage: node delete-user.js <email>');
    process.exit(1);
  }

  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        expertProfile: true
      }
    });

    if (!user) {
      console.log('User not found with email:', email);
      return;
    }

    console.log('Found user:', user.email, 'Type:', user.userType);
    
    // Delete in correct order due to foreign key constraints
    
    // Delete expert profile if exists
    if (user.expertProfile) {
      await prisma.expertProfile.delete({
        where: { userId: user.id }
      });
      console.log('Deleted expert profile');
    }

    // Delete notifications
    await prisma.notification.deleteMany({
      where: { userId: user.id }
    });

    // Delete answers
    await prisma.userAnswer.deleteMany({
      where: { userId: user.id }
    });

    // Delete questions
    await prisma.validationQuestion.deleteMany({
      where: { submittedById: user.id }
    });

    // Delete escrow contributions
    await prisma.escrowContribution.deleteMany({
      where: { userId: user.id }
    });

    // Delete ideas
    await prisma.institutionalIdea.deleteMany({
      where: { createdById: user.id }
    });

    // Finally delete the user
    await prisma.user.delete({
      where: { id: user.id }
    });

    console.log('User deleted successfully!');
  } catch (error) {
    console.error('Error deleting user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser();
