const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUserTypes() {
  // First, let's see all users
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      userType: true,
      organizationName: true
    }
  });

  console.log('Current users:');
  users.forEach(user => {
    console.log(`${user.email} - ${user.userType} - Org: ${user.organizationName || 'none'}`);
  });

  // Fix the swap - users with organizationName should be INSTITUTIONAL
  for (const user of users) {
    if (user.organizationName && user.userType === 'RETAIL') {
      console.log(`Fixing ${user.email} to INSTITUTIONAL`);
      await prisma.user.update({
        where: { id: user.id },
        data: { userType: 'INSTITUTIONAL' }
      });
    } else if (!user.organizationName && user.userType === 'INSTITUTIONAL') {
      console.log(`Fixing ${user.email} to RETAIL`);
      await prisma.user.update({
        where: { id: user.id },
        data: { userType: 'RETAIL' }
      });
    }
  }

  console.log('Fixed user types!');
  process.exit(0);
}

fixUserTypes().catch(console.error);
