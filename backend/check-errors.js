const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const errorCodes = await prisma.errorCode.findMany({ take: 5 });
    console.log('Error Codes:', JSON.stringify(errorCodes, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();