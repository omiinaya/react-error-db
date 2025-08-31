import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { config } from '../config';

/**
 * Database Security Service
 * Provides security-focused database operations and monitoring
 */
export class DatabaseSecurityService {
  private prisma: PrismaClient;
  private readonly MAX_CONNECTIONS = config.database.poolMax;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Initialize database security monitoring
   */
  async initializeSecurityMonitoring(): Promise<void> {
    await this.setupConnectionLimits();
    await this.enableRowLevelSecurity();
    await this.configureAuditLogging();
    await this.setupAutomaticMaintenance();
    
    logger.info('Database security monitoring initialized');
  }

  /**
   * Setup connection pool limits and timeouts
   */
  private async setupConnectionLimits(): Promise<void> {
    try {
      // Set maximum connections (PostgreSQL specific)
      await this.prisma.$executeRaw`
        ALTER DATABASE ${this.getDatabaseName()} 
        SET max_connections = ${this.MAX_CONNECTIONS + 10};
      `;

      // Set statement timeout
      await this.prisma.$executeRaw`
        ALTER DATABASE ${this.getDatabaseName()} 
        SET statement_timeout = '30s';
      `;

      logger.debug('Database connection limits configured');
    } catch (error) {
      logger.warn('Failed to set database connection limits:', error);
    }
  }

  /**
   * Enable Row Level Security (RLS) on tables
   */
  private async enableRowLevelSecurity(): Promise<void> {
    const tablesWithRLS = [
      'users',
      'applications',
      'error_codes', 
      'solutions',
      'votes',
      'user_sessions'
    ];

    try {
      for (const table of tablesWithRLS) {
        await this.prisma.$executeRaw`
          ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;
        `;
      }
      
      logger.debug('Row Level Security enabled on sensitive tables');
    } catch (error) {
      logger.warn('Failed to enable Row Level Security:', error);
    }
  }

  /**
   * Configure comprehensive audit logging
   */
  private async configureAuditLogging(): Promise<void> {
    try {
      // Create audit log table if it doesn't exist
      await this.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          table_name TEXT NOT NULL,
          record_id INTEGER,
          operation TEXT NOT NULL,
          old_data JSONB,
          new_data JSONB,
          user_id INTEGER,
          ip_address TEXT,
          user_agent TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Create indexes for performance
      await this.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
      `;
      await this.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
      `;
      await this.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
      `;

      logger.debug('Audit logging configuration completed');
    } catch (error) {
      logger.warn('Failed to configure audit logging:', error);
    }
  }

  /**
   * Setup automatic maintenance tasks
   */
  private async setupAutomaticMaintenance(): Promise<void> {
    try {
      // Create function for automatic vacuum and analyze
      await this.prisma.$executeRaw`
        CREATE OR REPLACE FUNCTION auto_maintenance() RETURNS void AS $$
        BEGIN
          -- Vacuum and analyze tables during low traffic hours
          IF EXTRACT(HOUR FROM CURRENT_TIME) BETWEEN 2 AND 4 THEN
            VACUUM ANALYZE;
          END IF;
        END;
        $$ LANGUAGE plpgsql;
      `;

      logger.debug('Automatic maintenance setup completed');
    } catch (error) {
      logger.warn('Failed to setup automatic maintenance:', error);
    }
  }

  /**
   * Get current database statistics
   */
  async getDatabaseStats(): Promise<any> {
    try {
      const stats = await this.prisma.$queryRaw`
        SELECT 
          -- Connection statistics
          (SELECT count(*) FROM pg_stat_activity) as active_connections,
          (SELECT setting FROM pg_settings WHERE name = 'max_connections') as max_connections,
          
          -- Database size
          pg_size_pretty(pg_database_size(current_database())) as database_size,
          
          -- Table statistics
          (SELECT count(*) FROM information_schema.tables 
           WHERE table_schema = 'public') as table_count,
          
          -- Index statistics
          (SELECT count(*) FROM pg_indexes 
           WHERE schemaname = 'public') as index_count,
          
          -- Cache statistics
          (SELECT round(sum(blks_hit) * 100.0 / nullif(sum(blks_hit + blks_read), 0), 2) 
           FROM pg_stat_database) as cache_hit_ratio
      `;

      return stats;
    } catch (error) {
      logger.error('Failed to get database statistics:', error);
      return null;
    }
  }

  /**
   * Monitor for suspicious database activity
   */
  async monitorSuspiciousActivity(): Promise<any> {
    try {
      const suspiciousActivity = await this.prisma.$queryRaw`
        SELECT 
          usename as username,
          client_addr as ip_address,
          query,
          query_start,
          state
        FROM pg_stat_activity 
        WHERE 
          -- Long-running queries
          (state = 'active' AND now() - query_start > interval '5 minutes')
          OR
          -- Many connections from same IP
          client_addr IN (
            SELECT client_addr 
            FROM pg_stat_activity 
            GROUP BY client_addr 
            HAVING count(*) > 10
          )
          OR
          -- Suspicious query patterns
          query ILIKE '%DROP%TABLE%'
          OR query ILIKE '%DELETE%FROM%'
          OR query ILIKE '%UPDATE%SET%'
        ORDER BY query_start DESC
        LIMIT 10;
      `;

      if (Array.isArray(suspiciousActivity) && suspiciousActivity.length > 0) {
        logger.warn('Suspicious database activity detected:', suspiciousActivity);
        
        // TODO: Send alert to security team
        // await this.sendSecurityAlert(suspiciousActivity);
      }

      return suspiciousActivity;
    } catch (error) {
      logger.error('Failed to monitor suspicious activity:', error);
      return null;
    }
  }

  /**
   * Perform security health check
   */
  async securityHealthCheck(): Promise<any> {
    const checks = {
      rls_enabled: false,
      audit_logging: false,
      connection_limits: false,
      ssl_enabled: false,
      vulnerabilities: [] as string[],
    };

    try {
      // Check RLS status
      const rlsStatus = await this.prisma.$queryRaw`
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('users', 'applications', 'error_codes', 'solutions')
      `;

      checks.rls_enabled = Array.isArray(rlsStatus) && 
        rlsStatus.every((table: any) => table.rowsecurity);

      // Check audit table exists
      const auditTableExists = await this.prisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'audit_logs'
        );
      `;
      checks.audit_logging = Array.isArray(auditTableExists) && 
        auditTableExists[0]?.exists === true;

      // Check connection limits
      const connectionStats = await this.getDatabaseStats();
      checks.connection_limits = connectionStats && 
        parseInt(connectionStats.active_connections) < parseInt(connectionStats.max_connections) * 0.8;

      // Check SSL connection
      const sslStatus = await this.prisma.$queryRaw`
        SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid();
      `;
      checks.ssl_enabled = Array.isArray(sslStatus) && sslStatus.length > 0 && sslStatus[0]?.ssl;

      // Check for common vulnerabilities
      await this.checkCommonVulnerabilities(checks.vulnerabilities);

      return checks;
    } catch (error) {
      logger.error('Failed to perform security health check:', error);
      return checks;
    }
  }

  /**
   * Check for common database vulnerabilities
   */
  private async checkCommonVulnerabilities(vulnerabilities: string[]): Promise<void> {
    try {
      // Check for default passwords
      const defaultUsers = await this.prisma.$queryRaw`
        SELECT usename FROM pg_user WHERE passwd IS NULL OR passwd = '';
      `;
      if (Array.isArray(defaultUsers) && defaultUsers.length > 0) {
        vulnerabilities.push('Users with empty passwords detected');
      }

      // Check for excessive privileges
      const superusers = await this.prisma.$queryRaw`
        SELECT usename FROM pg_user WHERE usesuper = true;
      `;
      if (Array.isArray(superusers) && superusers.length > 1) {
        vulnerabilities.push('Multiple superuser accounts detected');
      }

      // Check for weak password encryption
      const weakPasswords = await this.prisma.$queryRaw`
        SELECT usename FROM pg_user 
        WHERE passwd LIKE 'md5%' AND length(passwd) < 35;
      `;
      if (Array.isArray(weakPasswords) && weakPasswords.length > 0) {
        vulnerabilities.push('Weak password encryption detected');
      }

    } catch (error) {
      logger.warn('Failed to check for vulnerabilities:', error);
    }
  }

  /**
   * Get database name from connection string
   */
  private getDatabaseName(): string {
    const url = new URL(config.database.url);
    return url.pathname.replace('/', '');
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Cleanup old audit logs (keep 90 days)
    try {
      await this.prisma.$executeRaw`
        DELETE FROM audit_logs 
        WHERE created_at < CURRENT_DATE - INTERVAL '90 days';
      `;
      logger.debug('Old audit logs cleaned up');
    } catch (error) {
      logger.warn('Failed to clean up audit logs:', error);
    }
  }
}

// Singleton instance
let databaseSecurityService: DatabaseSecurityService;

export const getDatabaseSecurityService = (prisma: PrismaClient): DatabaseSecurityService => {
  if (!databaseSecurityService) {
    databaseSecurityService = new DatabaseSecurityService(prisma);
  }
  return databaseSecurityService;
};

export default getDatabaseSecurityService;