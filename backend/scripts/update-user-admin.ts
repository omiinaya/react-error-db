import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

/**
 * Update user admin status
 * @param email - User email to update
 * @param isAdmin - New admin status (true/false)
 */
export const updateUserAdminStatus = async (
  email: string,
  isAdmin: boolean
): Promise<void> => {
  try {
    logger.info(`🔄 Updating admin status for user: ${email}`);
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    // Update user admin status
    const updatedUser = await prisma.user.update({
      where: { email },
      data: { isAdmin },
    });

    logger.info('✅ User admin status updated successfully');
    logger.info(`📋 User details:`);
    logger.info(`- Email: ${updatedUser.email}`);
    logger.info(`- Username: ${updatedUser.username}`);
    logger.info(`- Display Name: ${updatedUser.displayName || 'Not set'}`);
    logger.info(`- Admin Status: ${updatedUser.isAdmin ? '✅ ADMIN' : '❌ NOT ADMIN'}`);
    logger.info(`- Verified: ${updatedUser.isVerified ? '✅ YES' : '❌ NO'}`);
    logger.info(`- Created: ${updatedUser.createdAt.toISOString()}`);

  } catch (error) {
    logger.error('❌ Failed to update user admin status:', error);
    throw error;
  }
};

/**
 * Get user details
 * @param email - User email to look up
 */
export const getUserDetails = async (email: string): Promise<void> => {
  try {
    logger.info(`🔍 Looking up user: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    logger.info('📋 User details found:');
    logger.info(`- ID: ${user.id}`);
    logger.info(`- Email: ${user.email}`);
    logger.info(`- Username: ${user.username}`);
    logger.info(`- Display Name: ${user.displayName || 'Not set'}`);
    logger.info(`- Admin Status: ${user.isAdmin ? '✅ ADMIN' : '❌ NOT ADMIN'}`);
    logger.info(`- Verified: ${user.isVerified ? '✅ YES' : '❌ NO'}`);
    logger.info(`- Created: ${user.createdAt.toISOString()}`);
    logger.info(`- Updated: ${user.updatedAt.toISOString()}`);

  } catch (error) {
    logger.error('❌ Failed to get user details:', error);
    throw error;
  }
};

// CLI execution
if (require.main === module) {
  const command = process.argv[2];
  const email = process.argv[3];
  const isAdmin = process.argv[4]?.toLowerCase() === 'true';

  const run = async () => {
    try {
      switch (command) {
        case 'update':
          if (!email || process.argv[4] === undefined) {
            console.log('Usage: ts-node update-user-admin.ts update <email> <true|false>');
            process.exit(1);
          }
          await updateUserAdminStatus(email, isAdmin);
          break;
        case 'get':
          if (!email) {
            console.log('Usage: ts-node update-user-admin.ts get <email>');
            process.exit(1);
          }
          await getUserDetails(email);
          break;
        default:
          console.log('Usage: ts-node update-user-admin.ts [update|get] <email> [true|false]');
          console.log('Examples:');
          console.log('  ts-node update-user-admin.ts update user@example.com true');
          console.log('  ts-node update-user-admin.ts get user@example.com');
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
  updateUserAdminStatus,
  getUserDetails,
};