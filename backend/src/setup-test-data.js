require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function setupTestData() {
  try {
    console.log('Creating test data...\n');

    // Create an institutional user
    const hashedPassword = await bcrypt.hash('testpassword123', 10);
    
    const institutionalUser = await prisma.user.upsert({
      where: { email: 'test.institutional@moneytalks.com' },
      update: {},
      create: {
        email: 'test.institutional@moneytalks.com',
        password: hashedPassword,
        userType: 'INSTITUTIONAL',
        organizationName: 'Test Hedge Fund',
        isVerified: true,
      }
    });

    console.log('Created institutional user:', institutionalUser.email);

    // Create some expert users
    const expertUsers = await Promise.all([
      prisma.user.upsert({
        where: { email: 'expert1@tesla.com' },
        update: {},
        create: {
          email: 'expert1@tesla.com',
          password: hashedPassword,
          userType: 'RETAIL',
          organizationName: 'Tesla',
          isVerified: true,
        }
      }),
      prisma.user.upsert({
        where: { email: 'expert2@amazon.com' },
        update: {},
        create: {
          email: 'expert2@amazon.com',
          password: hashedPassword,
          userType: 'RETAIL',
          organizationName: 'Amazon',
          isVerified: true,
        }
      })
    ]);

    // Create expert profiles
    for (const user of expertUsers) {
      await prisma.expertProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          fullName: `Expert at ${user.organizationName}`,
          currentRole: 'Senior Manager',
          currentEmployer: user.organizationName,
          employerVerified: true,
          yearsInIndustry: 10,
          primaryIndustry: user.organizationName === 'Tesla' ? 'automotive' : 'technology',
          secondaryIndustries: ['energy', 'manufacturing'],
          specificExpertiseTags: ['supply chain', 'battery technology', 'cost optimization'],
          geographicExpertise: ['US', 'China', 'Europe'],
          verificationLevel: 3,
          verificationScore: 85,
          responseRate: 0.9,
          averageResponseTime: 24,
          accuracyScore: 90,
        }
      });
    }

    console.log('Created expert profiles');

    // Create a test idea
    const idea = await prisma.institutionalIdea.create({
      data: {
        title: 'Tesla Battery Cost Analysis',
        summary: 'Deep dive into Tesla battery cost trajectory',
        detailedPlan: 'Analyzing Tesla battery cost per kWh trends...',
        sector: 'Automotive',
        marketCap: 'Large Cap',
        status: 'QUEUED',
        totalEscrow: 1000,
        createdById: institutionalUser.id,
      }
    });

    console.log('Created test idea:', idea.title);

    // Create an escrow contribution
    const escrow = await prisma.escrowContribution.create({
      data: {
        amount: 1000,
        userId: institutionalUser.id,
        ideaId: idea.id,
      }
    });

    // Create a test question
    const question = await prisma.validationQuestion.create({
      data: {
        text: "What is Tesla's battery cost per kWh outlook for 2025 given current supplier dynamics in China?",
        isTop3: true,
        questionSlot: 1,
        bidAmount: 500,
        ideaId: idea.id,
        submittedById: institutionalUser.id,
        escrowSourceId: escrow.id,
      }
    });

    console.log('Created test question with ID:', question.id);
    console.log('\nTest data created successfully!');
    console.log('\nYou can now test the matching API with:');
    console.log(`Question ID: ${question.id}`);
    console.log(`Institutional User Email: ${institutionalUser.email}`);
    console.log('Password: testpassword123');

  } catch (error) {
    console.error('Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestData();
