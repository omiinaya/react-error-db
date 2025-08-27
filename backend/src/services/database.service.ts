import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { config } from '../config';

// Extend the PrismaClient type to include the event types
interface PrismaQueryEvent {
  query: string;
  params: string;
  duration: number;
  target: string;
}

interface PrismaLogEvent {
  message: string;
  target: string;
  timestamp: Date;
}

const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
  datasources: {
    db: {
      url: config.database.url,
    },
  },
});

// Log database queries based on log level
if (config.logLevel === 'debug') {
  prisma.$on('query', (e: PrismaQueryEvent) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Params: ${e.params}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });
}

prisma.$on('error', (e: PrismaLogEvent) => {
  logger.error(`Database error: ${e.message}`);
});

prisma.$on('info', (e: PrismaLogEvent) => {
  logger.info(`Database info: ${e.message}`);
});

prisma.$on('warn', (e: PrismaLogEvent) => {
  logger.warn(`Database warning: ${e.message}`);
});

// Database connection health check
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('✅ Database connection is healthy');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    return false;
  }
};

// Database statistics
export const getDatabaseStats = async () => {
  try {
    const stats = await prisma.$queryRaw`
      SELECT
        (SELECT COUNT(*) FROM users) as user_count,
        (SELECT COUNT(*) FROM error_codes) as error_count,
        (SELECT COUNT(*) FROM solutions) as solution_count,
        (SELECT COUNT(*) FROM applications) as application_count,
        (SELECT COUNT(*) FROM categories) as category_count
    `;
    return stats;
  } catch (error) {
    logger.error('Failed to get database statistics:', error);
    return null;
  }
};

// Transaction utility - simplified version
export const withTransaction = async <T>(
  operation: (prisma: Prisma.TransactionClient) => Promise<T>
): Promise<T> => {
  return await prisma.$transaction(operation);
};

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  logger.info('Database connection closed gracefully');
});

// Handle process termination signals
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  logger.info('Database connection closed due to SIGINT');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  logger.info('Database connection closed due to SIGTERM');
  process.exit(0);
});

export default prisma;