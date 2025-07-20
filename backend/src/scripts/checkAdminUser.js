require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAdminUser() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@moneytalks.com' }
    });
    
    if (admin) {
      console.log('Admin user found:', {
        email: admin.email,
        userType: admin.userType,
        isVerified: admin.isVerified
      });
      
      if (admin.userType !== 'ADMIN') {
        console.log('Updating user type to ADMIN...');
        await prisma.user.update({
          where: { email: 'admin@moneytalks.com' },
          data: { userType: 'ADMIN' }
        });
        console.log('User type updated to ADMIN');
      }
    } else {
      console.log('Admin user not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAdminUser();
