require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createExpertAccount() {
  const email = process.argv[2];
  const password = process.argv[3];
  
  if (!email || !password) {
    console.log('Usage: node create-expert-account.js <email> <password>');
    process.exit(1);
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        userType: 'RETAIL',
        organizationName: 'Independent Expert',
        isVerified: true,
      }
    });

    // Create expert profile
    const expertProfile = await prisma.expertProfile.create({
      data: {
        userId: user.id,
        fullName: 'Lucas Phillips',
        currentRole: 'Senior Technology Consultant',
        currentEmployer: 'LP Creative Studio',
        employerVerified: true,
        yearsInIndustry: 10,
        primaryIndustry: 'technology',
        secondaryIndustries: ['automotive', 'energy', 'software'],
        specificExpertiseTags: ['Tesla', 'batteries', 'EVs', 'supply chain', 'software development'],
        geographicExpertise: ['US', 'Global'],
        verificationLevel: 3,
        verificationScore: 85,
        responseRate: 0.95,
        averageResponseTime: 12,
        accuracyScore: 92,
      }
    });

    console.log('Expert account created successfully!');
    console.log('Email:', email);
    console.log('User ID:', user.id);
    console.log('Expert Profile ID:', expertProfile.id);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createExpertAccount();
