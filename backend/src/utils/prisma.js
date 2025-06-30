const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Add this to handle the connection pooler issue
prisma.$on('query', () => {
  // This helps with Supabase pooler
});

module.exports = prisma;
