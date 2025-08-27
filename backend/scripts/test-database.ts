import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/auth.utils';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

/**
 * Test database management utilities
 */

/**
 * Reset the test database to a clean state
 */
export const resetTestDatabase = async (): Promise<void> => {
  try {
    logger.info('🧹 Resetting test database...');
    
    // Clear all data in proper order to maintain foreign key constraints
    await prisma.vote.deleteMany();
    await prisma.solution.deleteMany();
    await prisma.errorCode.deleteMany();
    await prisma.application.deleteMany();
    await prisma.category.deleteMany();
    await prisma.userSession.deleteMany();
    await prisma.user.deleteMany();

    logger.info('✅ Test database reset completed');
  } catch (error) {
    logger.error('❌ Failed to reset test database:', error);
    throw error;
  }
};

/**
 * Seed test database with minimal test data
 */
export const seedTestDatabase = async (): Promise<void> => {
  try {
    logger.info('🌱 Seeding test database...');
    
    // Create test users
    const adminPassword = await hashPassword('testadmin123');
    const userPassword = await hashPassword('testuser123');

    const [adminUser, testUser] = await Promise.all([
      prisma.user.create({
        data: {
          email: 'testadmin@errdb.com',
          username: 'testadmin',
          passwordHash: adminPassword,
          displayName: 'Test Admin',
          isVerified: true,
          isAdmin: true,
        },
      }),
      prisma.user.create({
        data: {
          email: 'testuser@errdb.com',
          username: 'testuser',
          passwordHash: userPassword,
          displayName: 'Test User',
          isVerified: true,
        },
      }),
    ]);

    // Create test category
    const testCategory = await prisma.category.create({
      data: {
        name: 'Test Category',
        slug: 'test-category',
        description: 'Category for testing purposes',
        icon: 'test',
      },
    });

    // Create test application
    const testApp = await prisma.application.create({
      data: {
        name: 'Test Application',
        slug: 'test-app',
        description: 'Application for testing purposes',
        categoryId: testCategory.id,
      },
    });

    // Create test error code
    const testError = await prisma.errorCode.create({
      data: {
        code: 'TEST001',
        applicationId: testApp.id,
        title: 'Test Error',
        description: 'This is a test error for testing purposes',
        severity: 'medium',
      },
    });

    // Create test solution
    await prisma.solution.create({
      data: {
        errorId: testError.id,
        authorId: testUser.id,
        solutionText: 'This is a test solution for the test error',
        isVerified: true,
        verifiedById: adminUser.id,
        verifiedAt: new Date(),
      },
    });

    logger.info('✅ Test database seeded successfully');
    logger.info('📋 Test data created:');
    logger.info(`- Users: 2 (testadmin@errdb.com / testadmin123, testuser@errdb.com / testuser123)`);
    logger.info(`- Categories: 1`);
    logger.info(`- Applications: 1`);
    logger.info(`- Error codes: 1`);
    logger.info(`- Solutions: 1`);
  } catch (error) {
    logger.error('❌ Failed to seed test database:', error);
    throw error;
  }
};

/**
 * Check if test database is ready
 */
export const isTestDatabaseReady = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Run test database setup (reset + seed)
 */
export const setupTestDatabase = async (): Promise<void> => {
  if (!(await isTestDatabaseReady())) {
    throw new Error('Test database is not ready');
  }

  await resetTestDatabase();
  await seedTestDatabase();
};

// CLI execution
if (require.main === module) {
  const command = process.argv[2];
  
  const run = async () => {
    try {
      switch (command) {
        case 'reset':
          await resetTestDatabase();
          break;
        case 'seed':
          await seedTestDatabase();
          break;
        case 'setup':
          await setupTestDatabase();
          break;
        case 'check':
          const ready = await isTestDatabaseReady();
          console.log(ready ? '✅ Database ready' : '❌ Database not ready');
          break;
        default:
          console.log('Usage: ts-node test-database.ts [reset|seed|setup|check]');
          process.exit(1);
      }
      await prisma.$disconnect();
    } catch (error) {
      console.error('Error:', error);
      await prisma.$disconnect();
      process.exit(1);
    }
  };

  run();
}

export default {
  resetTestDatabase,
  seedTestDatabase,
  isTestDatabaseReady,
  setupTestDatabase,
};