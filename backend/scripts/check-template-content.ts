import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkForTemplateContent() {
  console.log('🔍 Checking for template content in database...');

  try {
    // Check error codes
    const errorCodes = await prisma.errorCode.findMany({
      where: {
        OR: [
          { title: { contains: '{{s}}', mode: 'insensitive' } },
          { description: { contains: '{{s}}', mode: 'insensitive' } },
        ]
      }
    });

    console.log(`Found ${errorCodes.length} error codes with template content:`);
    errorCodes.forEach(error => {
      console.log(`- ID: ${error.id}, Code: ${error.code}, Title: "${error.title}"`);
    });

    // Check solutions
    const solutions = await prisma.solution.findMany({
      where: {
        solutionText: { contains: '{{s}}', mode: 'insensitive' }
      }
    });

    console.log(`\nFound ${solutions.length} solutions with template content:`);
    solutions.forEach(solution => {
      console.log(`- ID: ${solution.id}, Error ID: ${solution.errorId}`);
    });

    if (errorCodes.length === 0 && solutions.length === 0) {
      console.log('\n✅ No template content found in database. The issue might be elsewhere.');
    }

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkForTemplateContent();