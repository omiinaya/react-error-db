import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

/**
 * Database utility functions for common operations
 */

/**
 * Execute a database query with retry logic
 */
export const executeWithRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> => {
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      logger.warn(`Database operation attempt ${attempt} failed: ${error}`);
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  
  throw new Error(`Database operation failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`);
};

/**
 * Check if a record exists by ID
 */
export const recordExists = async (model: keyof PrismaClient, id: string): Promise<boolean> => {
  try {
    const result = await (prisma[model] as any).findUnique({
      where: { id },
      select: { id: true }
    });
    return !!result;
  } catch (error) {
    logger.error(`Error checking if record exists in ${String(model)}:`, error);
    return false;
  }
};

/**
 * Get paginated results with total count
 */
export const getPaginatedResults = async <T>(
  model: keyof PrismaClient,
  options: {
    where?: any;
    orderBy?: any;
    include?: any;
    skip?: number;
    take?: number;
  } = {}
): Promise<{ data: T[]; total: number; hasMore: boolean }> => {
  const { skip = 0, take = 10, ...queryOptions } = options;
  
  const [data, total] = await Promise.all([
    (prisma[model] as any).findMany({
      ...queryOptions,
      skip,
      take,
    }),
    (prisma[model] as any).count({
      where: queryOptions.where,
    }),
  ]);

  return {
    data,
    total,
    hasMore: skip + take < total,
  };
};

/**
 * Soft delete utility (sets deletedAt timestamp)
 */
export const softDelete = async (model: keyof PrismaClient, id: string): Promise<boolean> => {
  try {
    // Check if model has deletedAt field
    const modelDefinition = (prisma[model] as any);
    const sample = await modelDefinition.findFirst();
    
    if (sample && 'deletedAt' in sample) {
      await modelDefinition.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      return true;
    }
    
    // If no deletedAt field, perform hard delete
    await modelDefinition.delete({ where: { id } });
    return true;
  } catch (error) {
    logger.error(`Error performing soft delete on ${String(model)}:`, error);
    return false;
  }
};

/**
 * Batch operations with chunking
 */
export const batchOperation = async <T>(
  items: T[],
  operation: (chunk: T[]) => Promise<any>,
  chunkSize = 100
): Promise<void> => {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await operation(chunk);
  }
};

/**
 * Database connection health check with detailed information
 */
export const checkDatabaseHealth = async (): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  details: {
    connection: boolean;
    queryPerformance: boolean;
    poolStatus?: any;
  };
}> => {
  const startTime = Date.now();
  
  try {
    // Test basic connection
    await prisma.$queryRaw`SELECT 1`;
    const connectionTime = Date.now() - startTime;
    
    // Test query performance with a simple query
    const queryStart = Date.now();
    await prisma.$queryRaw`SELECT COUNT(*) FROM information_schema.tables`;
    const queryTime = Date.now() - queryStart;
    
    return {
      status: 'healthy',
      responseTime: connectionTime,
      details: {
        connection: true,
        queryPerformance: queryTime < 1000, // Query should take less than 1 second
      },
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      responseTime: Date.now() - startTime,
      details: {
        connection: false,
        queryPerformance: false,
      },
    };
  }
};

/**
 * Generate database backup (simple export)
 */
export const generateBackup = async (): Promise<string> => {
  try {
    // Get all data from all tables
    const tables = ['User', 'Category', 'Application', 'ErrorCode', 'Solution', 'Vote', 'UserSession'];
    const backupData: Record<string, any[]> = {};
    
    for (const table of tables) {
      const data = await (prisma[table.toLowerCase() as keyof PrismaClient] as any).findMany();
      backupData[table] = data;
    }
    
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      data: backupData,
    }, null, 2);
  } catch (error) {
    logger.error('Error generating database backup:', error);
    throw new Error('Failed to generate database backup');
  }
};

/**
 * Restore database from backup
 */
export const restoreFromBackup = async (backupData: string): Promise<void> => {
  try {
    const backup = JSON.parse(backupData);
    
    // Clear existing data
    await prisma.vote.deleteMany();
    await prisma.solution.deleteMany();
    await prisma.errorCode.deleteMany();
    await prisma.application.deleteMany();
    await prisma.category.deleteMany();
    await prisma.userSession.deleteMany();
    await prisma.user.deleteMany();
    
    // Restore data in proper order to maintain foreign key constraints
    const restoreOrder = ['User', 'Category', 'Application', 'ErrorCode', 'Solution', 'Vote', 'UserSession'];
    
    for (const table of restoreOrder) {
      if (backup.data[table]) {
        const model = table.toLowerCase() as keyof PrismaClient;
        await batchOperation(
          backup.data[table],
          async (chunk) => {
            await (prisma[model] as any).createMany({
              data: chunk,
              skipDuplicates: true,
            });
          },
          50
        );
      }
    }
    
    logger.info('Database restored successfully from backup');
  } catch (error) {
    logger.error('Error restoring database from backup:', error);
    throw new Error('Failed to restore database from backup');
  }
};

export default {
  executeWithRetry,
  recordExists,
  getPaginatedResults,
  softDelete,
  batchOperation,
  checkDatabaseHealth,
  generateBackup,
  restoreFromBackup,
};