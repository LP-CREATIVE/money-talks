require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createExpertAccount() {
 const email = "jasonscotatkins@me.com";
 const password = "test123";
 
 try {
   const hashedPassword = await bcrypt.hash(password, 10);
   
   const user = await prisma.user.create({
     data: {
       email,
       password: hashedPassword,
       userType: 'RETAIL',
       organizationName: 'Atkins Enterprises',
       isVerified: true,
     }
   });

   const expertProfile = await prisma.expertProfile.create({
     data: {
       userId: user.id,
       fullName: 'Jason Scott Atkins',
       currentRole: 'CEO',
       currentEmployer: 'Atkins Enterprises',
       employerVerified: true,
       yearsInIndustry: 15,
       primaryIndustry: 'finance',
       secondaryIndustries: ['technology', 'real estate', 'energy'],
       specificExpertiseTags: ['investment strategy', 'market analysis', 'portfolio management', 'startup funding', 'venture capital'],
       geographicExpertise: ['US', 'Europe'],
       verificationLevel: 4,
       verificationScore: 90,
       responseRate: 0.92,
       averageResponseTime: 18,
       accuracyScore: 95,
     }
   });

   console.log('Expert account created successfully!');
   console.log('Email:', email);
   console.log('Password: test123');
   console.log('User ID:', user.id);
   console.log('Expert Profile ID:', expertProfile.id);
 } catch (error) {
   console.error('Error:', error);
 } finally {
   await prisma.$disconnect();
 }
}

createExpertAccount();
