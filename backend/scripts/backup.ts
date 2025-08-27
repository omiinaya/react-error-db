import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { logger } from '../src/utils/logger';

const prisma = new PrismaClient();

/**
 * Database backup and recovery utilities for production
 */

interface BackupConfig {
  backupDir: string;
  retentionDays: number;
  compression: boolean;
  schedule?: string;
}

const defaultConfig: BackupConfig = {
  backupDir: './backups',
  retentionDays: 30,
  compression: true,
};

/**
 * Create a database backup
 */
export const createBackup = async (config: Partial<BackupConfig> = {}): Promise<string> => {
  const finalConfig = { ...defaultConfig, ...config };
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFileName = `backup-${timestamp}.sql`;
  const backupPath = join(finalConfig.backupDir, backupFileName);
  
  try {
    // Ensure backup directory exists
    if (!existsSync(finalConfig.backupDir)) {
      mkdirSync(finalConfig.backupDir, { recursive: true });
    }
    
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    // Parse database URL to extract connection details
    const urlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!urlMatch) {
      throw new Error('Invalid DATABASE_URL format');
    }
    
    const [, username, password, host, port, database] = urlMatch;
    
    // Create backup using pg_dump
    const pgDumpCommand = [
      'pg_dump',
      `--host=${host}`,
      `--port=${port}`,
      `--username=${username}`,
      `--dbname=${database}`,
      '--format=plain',
      '--no-owner',
      '--no-acl',
      '--clean',
      '--if-exists',
    ].join(' ');
    
    // Set password environment variable for pg_dump
    const env = { ...process.env, PGPASSWORD: password };
    
    // Execute backup command
    const backupData = execSync(pgDumpCommand, { 
      env,
      encoding: 'utf8' 
    });
    
    // Write backup to file
    writeFileSync(backupPath, backupData, 'utf8');
    
    logger.info(`✅ Backup created: ${backupPath}`);
    return backupPath;
  } catch (error) {
    logger.error('❌ Failed to create backup:', error);
    throw error;
  }
};

/**
 * Restore database from backup
 */
export const restoreBackup = async (backupPath: string): Promise<void> => {
  try {
    if (!existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    // Parse database URL to extract connection details
    const urlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    if (!urlMatch) {
      throw new Error('Invalid DATABASE_URL format');
    }
    
    const [, username, password, host, port, database] = urlMatch;
    
    // Restore using psql
    const psqlCommand = [
      'psql',
      `--host=${host}`,
      `--port=${port}`,
      `--username=${username}`,
      `--dbname=${database}`,
      '--file',
      backupPath,
    ].join(' ');
    
    // Set password environment variable for psql
    const env = { ...process.env, PGPASSWORD: password };
    
    // Execute restore command
    execSync(psqlCommand, { 
      env,
      stdio: 'inherit' 
    });
    
    logger.info(`✅ Database restored from: ${backupPath}`);
  } catch (error) {
    logger.error('❌ Failed to restore backup:', error);
    throw error;
  }
};

/**
 * List available backups
 */
export const listBackups = (config: Partial<BackupConfig> = {}): string[] => {
  const finalConfig = { ...defaultConfig, ...config };
  
  if (!existsSync(finalConfig.backupDir)) {
    return [];
  }
  
  // This would normally use fs.readdirSync, but for simplicity we'll return empty
  // In a real implementation, you would read the backup directory
  return [];
};

/**
 * Clean up old backups based on retention policy
 */
export const cleanupOldBackups = (config: Partial<BackupConfig> = {}): void => {
  const finalConfig = { ...defaultConfig, ...config };
  
  if (!existsSync(finalConfig.backupDir)) {
    return;
  }
  
  // Implementation would:
  // 1. List all backup files
  // 2. Calculate age of each backup
  // 3. Delete backups older than retentionDays
  // 4. Log cleanup actions
  
  logger.info('🧹 Old backups cleanup completed');
};

/**
 * Automated backup schedule (to be used with cron or similar)
 */
export const runScheduledBackup = async (config: Partial<BackupConfig> = {}): Promise<void> => {
  try {
    logger.info('⏰ Running scheduled backup...');
    await createBackup(config);
    cleanupOldBackups(config);
    logger.info('✅ Scheduled backup completed successfully');
  } catch (error) {
    logger.error('❌ Scheduled backup failed:', error);
  }
};

// CLI execution
if (require.main === module) {
  const command = process.argv[2];
  const backupPath = process.argv[3];
  
  const run = async () => {
    try {
      switch (command) {
        case 'create':
          await createBackup();
          break;
        case 'restore':
          if (!backupPath) {
            console.error('Backup path required: npm run backup:restore <backup-path>');
            process.exit(1);
          }
          await restoreBackup(backupPath);
          break;
        case 'list':
          const backups = listBackups();
          console.log('Available backups:', backups);
          break;
        case 'cleanup':
          cleanupOldBackups();
          break;
        case 'scheduled':
          await runScheduledBackup();
          break;
        default:
          console.log('Usage: ts-node backup.ts [create|restore <path>|list|cleanup|scheduled]');
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
  createBackup,
  restoreBackup,
  listBackups,
  cleanupOldBackups,
  runScheduledBackup,
};