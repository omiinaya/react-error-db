import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient();

// Type-safe model names that exist in our schema
type ModelName = 
  | 'user'
  | 'category' 
  | 'application'
  | 'errorCode'
  | 'solution'
  | 'vote'
  | 'userSession'
  | 'auditLog'
  | 'categoryRequest';

// Map of model names to their respective table names for backup operations
const MODEL_NAME_MAP = {
  'user': 'User',
  'category': 'Category',
  'application': 'Application',
  'errorCode': 'ErrorCode',
  'solution': 'Solution',
  'vote': 'Vote',
  'userSession': 'UserSession',
  'auditLog': 'AuditLog',
  'categoryRequest': 'CategoryRequest'
} as const;

type BackupModelName = keyof typeof MODEL_NAME_MAP;

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
      logger.warn(`Database operation attempt ${attempt} failed:`, error);
      
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
export const recordExists = async (model: ModelName, id: string): Promise<boolean> => {
  try {
    const modelMap = {
      'user': () => prisma.user.findUnique({ where: { id }, select: { id: true } }),
      'category': () => prisma.category.findUnique({ where: { id }, select: { id: true } }),
      'application': () => prisma.application.findUnique({ where: { id }, select: { id: true } }),
      'errorCode': () => prisma.errorCode.findUnique({ where: { id }, select: { id: true } }),
      'solution': () => prisma.solution.findUnique({ where: { id }, select: { id: true } }),
      'vote': () => prisma.vote.findUnique({ where: { id }, select: { id: true } }),
      'userSession': () => prisma.userSession.findUnique({ where: { id }, select: { id: true } }),
      'auditLog': () => prisma.auditLog.findUnique({ where: { id }, select: { id: true } }),
      'categoryRequest': () => prisma.categoryRequest.findUnique({ where: { id }, select: { id: true } }),
    };

    const result = await modelMap[model]();
    return !!result;
  } catch (error) {
    logger.error(`Error checking if record exists in ${model}:`, error);
    return false;
  }
};

/**
 * Get paginated results with total count
 */
export const getPaginatedResults = async <T>(
  model: ModelName,
  options: {
    where?: any;
    orderBy?: any;
    include?: any;
    skip?: number;
    take?: number;
  } = {}
): Promise<{ data: T[]; total: number; hasMore: boolean }> => {
  const { skip = 0, take = 10, ...queryOptions } = options;
  
  const modelMap = {
    'user': () => ({
      findMany: () => prisma.user.findMany({ ...queryOptions, skip, take }),
      count: () => prisma.user.count({ where: queryOptions.where })
    }),
    'category': () => ({
      findMany: () => prisma.category.findMany({ ...queryOptions, skip, take }),
      count: () => prisma.category.count({ where: queryOptions.where })
    }),
    'application': () => ({
      findMany: () => prisma.application.findMany({ ...queryOptions, skip, take }),
      count: () => prisma.application.count({ where: queryOptions.where })
    }),
    'errorCode': () => ({
      findMany: () => prisma.errorCode.findMany({ ...queryOptions, skip, take }),
      count: () => prisma.errorCode.count({ where: queryOptions.where })
    }),
    'solution': () => ({
      findMany: () => prisma.solution.findMany({ ...queryOptions, skip, take }),
      count: () => prisma.solution.count({ where: queryOptions.where })
    }),
    'vote': () => ({
      findMany: () => prisma.vote.findMany({ ...queryOptions, skip, take }),
      count: () => prisma.vote.count({ where: queryOptions.where })
    }),
    'userSession': () => ({
      findMany: () => prisma.userSession.findMany({ ...queryOptions, skip, take }),
      count: () => prisma.userSession.count({ where: queryOptions.where })
    }),
    'auditLog': () => ({
      findMany: () => prisma.auditLog.findMany({ ...queryOptions, skip, take }),
      count: () => prisma.auditLog.count({ where: queryOptions.where })
    }),
    'categoryRequest': () => ({
      findMany: () => prisma.categoryRequest.findMany({ ...queryOptions, skip, take }),
      count: () => prisma.categoryRequest.count({ where: queryOptions.where })
    }),
  };

  const [data, total] = await Promise.all([
    modelMap[model]().findMany(),
    modelMap[model]().count(),
  ]);

  return {
    data: data as T[],
    total,
    hasMore: skip + take < total,
  };
};

/**
 * Soft delete utility (sets deletedAt timestamp)
 * Note: Our schema doesn't have deletedAt fields, so this performs hard delete
 */
export const softDelete = async (model: ModelName, id: string): Promise<boolean> => {
  try {
    const modelMap = {
      'user': () => prisma.user.delete({ where: { id } }),
      'category': () => prisma.category.delete({ where: { id } }),
      'application': () => prisma.application.delete({ where: { id } }),
      'errorCode': () => prisma.errorCode.delete({ where: { id } }),
      'solution': () => prisma.solution.delete({ where: { id } }),
      'vote': () => prisma.vote.delete({ where: { id } }),
      'userSession': () => prisma.userSession.delete({ where: { id } }),
      'auditLog': () => prisma.auditLog.delete({ where: { id } }),
      'categoryRequest': () => prisma.categoryRequest.delete({ where: { id } }),
    };

    await modelMap[model]();
    return true;
  } catch (error) {
    logger.error(`Error performing delete on ${model}:`, error);
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
    // Get all data from all tables in proper order to handle foreign key constraints
    const backupData: Record<string, any[]> = {};
    
    // Order matters for foreign key constraints
    const tablesInOrder: BackupModelName[] = [
      'user',
      'category',
      'application',
      'errorCode',
      'solution',
      'vote',
      'userSession',
      'auditLog',
      'categoryRequest'
    ];
    
    for (const table of tablesInOrder) {
      const modelMap = {
        'user': () => prisma.user.findMany(),
        'category': () => prisma.category.findMany(),
        'application': () => prisma.application.findMany(),
        'errorCode': () => prisma.errorCode.findMany(),
        'solution': () => prisma.solution.findMany(),
        'vote': () => prisma.vote.findMany(),
        'userSession': () => prisma.userSession.findMany(),
        'auditLog': () => prisma.auditLog.findMany(),
        'categoryRequest': () => prisma.categoryRequest.findMany(),
      };
      
      const data = await modelMap[table]();
      backupData[MODEL_NAME_MAP[table]] = data;
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
    
    if (!backup.data || typeof backup.data !== 'object') {
      throw new Error('Invalid backup format: missing data object');
    }
    
    // Clear existing data in reverse order to handle foreign key constraints
    const deleteOrder = [
      'categoryRequest', 'auditLog', 'vote', 'solution', 
      'errorCode', 'application', 'category', 'userSession', 'user'
    ] as BackupModelName[];
    
    for (const table of deleteOrder) {
      const modelMap = {
        'user': () => prisma.user.deleteMany(),
        'category': () => prisma.category.deleteMany(),
        'application': () => prisma.application.deleteMany(),
        'errorCode': () => prisma.errorCode.deleteMany(),
        'solution': () => prisma.solution.deleteMany(),
        'vote': () => prisma.vote.deleteMany(),
        'userSession': () => prisma.userSession.deleteMany(),
        'auditLog': () => prisma.auditLog.deleteMany(),
        'categoryRequest': () => prisma.categoryRequest.deleteMany(),
      };
      
      await modelMap[table]();
    }
    
    // Restore data in proper order to maintain foreign key constraints
    const restoreOrder: BackupModelName[] = [
      'user', 'category', 'application', 'errorCode', 
      'solution', 'vote', 'userSession', 'auditLog', 'categoryRequest'
    ];
    
    for (const table of restoreOrder) {
      const tableName = MODEL_NAME_MAP[table];
      if (backup.data[tableName] && Array.isArray(backup.data[tableName]) && backup.data[tableName].length > 0) {
        const createManyMap = {
          'user': (data: any[]) => prisma.user.createMany({ data, skipDuplicates: true }),
          'category': (data: any[]) => prisma.category.createMany({ data, skipDuplicates: true }),
          'application': (data: any[]) => prisma.application.createMany({ data, skipDuplicates: true }),
          'errorCode': (data: any[]) => prisma.errorCode.createMany({ data, skipDuplicates: true }),
          'solution': (data: any[]) => prisma.solution.createMany({ data, skipDuplicates: true }),
          'vote': (data: any[]) => prisma.vote.createMany({ data, skipDuplicates: true }),
          'userSession': (data: any[]) => prisma.userSession.createMany({ data, skipDuplicates: true }),
          'auditLog': (data: any[]) => prisma.auditLog.createMany({ data, skipDuplicates: true }),
          'categoryRequest': (data: any[]) => prisma.categoryRequest.createMany({ data, skipDuplicates: true }),
        };
        
        await batchOperation(
          backup.data[tableName],
          async (chunk) => {
            await createManyMap[table](chunk);
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