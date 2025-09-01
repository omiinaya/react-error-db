import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAllErrors() {
  console.log('🔍 Checking all error records...');

  try {
    const errors = await prisma.errorCode.findMany({
      include: {
        application: {
          include: {
            category: true
          }
        },
        _count: {
          select: {
            solutions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`Found ${errors.length} error records:`);
    console.log('='.repeat(80));
    
    errors.forEach(error => {
      console.log(`ID: ${error.id}`);
      console.log(`Code: ${error.code}`);
      console.log(`Title: "${error.title}"`);
      console.log(`Application: ${error.application.name}`);
      console.log(`Category: ${error.application.category?.name || 'None'}`);
      console.log(`Severity: ${error.severity}`);
      console.log(`Views: ${error.viewCount}`);
      console.log(`Solutions: ${error._count.solutions}`);
      console.log(`Created: ${error.createdAt.toISOString()}`);
      console.log('='.repeat(80));
    });

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllErrors();