import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { getDatabaseSecurityService } from '../services/database-security.service';
import databaseService from '../services/database.service';
import { z } from 'zod';

const router = Router();

// Apply authentication and admin middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Initialize database security service
const dbSecurityService = getDatabaseSecurityService(databaseService);

/**
 * @route GET /api/database-security/stats
 * @description Get database security statistics
 * @access Admin only
 */
router.get('/stats', async (_req, res) => {
  try {
    const stats = await dbSecurityService.getDatabaseStats();
    
    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get database statistics',
    });
  }
});

/**
 * @route GET /api/database-security/health
 * @description Perform database security health check
 * @access Admin only
 */
router.get('/health', async (_req, res) => {
  try {
    const healthCheck = await dbSecurityService.securityHealthCheck();
    
    res.status(200).json({
      success: true,
      data: healthCheck,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to perform security health check',
    });
  }
});

/**
 * @route GET /api/database-security/monitor
 * @description Monitor for suspicious database activity
 * @access Admin only
 */
router.get('/monitor', async (_req, res) => {
  try {
    const suspiciousActivity = await dbSecurityService.monitorSuspiciousActivity();
    
    res.status(200).json({
      success: true,
      data: suspiciousActivity,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to monitor suspicious activity',
    });
  }
});

/**
 * @route POST /api/database-security/cleanup
 * @description Cleanup old audit logs and maintenance
 * @access Admin only
 */
router.post('/cleanup', async (_req, res) => {
  try {
    await dbSecurityService.cleanup();
    
    res.status(200).json({
      success: true,
      message: 'Database cleanup completed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to perform database cleanup',
    });
  }
});

/**
 * @route GET /api/database-security/audit-logs
 * @description Get audit logs with pagination
 * @access Admin only
 */
router.get('/audit-logs', 
  validateRequest(z.object({
    query: z.object({
      page: z.string().transform(Number).default('1'),
      limit: z.string().transform(Number).default('50'),
      table_name: z.string().optional(),
      operation: z.string().optional(),
      start_date: z.string().datetime().optional(),
      end_date: z.string().datetime().optional(),
    }),
  })),
  async (req, res) => {
    try {
      const { page, limit, table_name, operation, start_date, end_date } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = `
        SELECT * FROM audit_logs 
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramCount = 0;

      if (table_name) {
        paramCount++;
        query += ` AND table_name = $${paramCount}`;
        params.push(table_name);
      }

      if (operation) {
        paramCount++;
        query += ` AND operation = $${paramCount}`;
        params.push(operation);
      }

      if (start_date) {
        paramCount++;
        query += ` AND created_at >= $${paramCount}`;
        params.push(new Date(start_date as string));
      }

      if (end_date) {
        paramCount++;
        query += ` AND created_at <= $${paramCount}`;
        params.push(new Date(end_date as string));
      }

      query += `
        ORDER BY created_at DESC
        LIMIT $${paramCount + 1}
        OFFSET $${paramCount + 2}
      `;
      params.push(Number(limit), offset);

      const auditLogs = await databaseService.$queryRawUnsafe(query, ...params);

      // Get total count
      let countQuery = `SELECT COUNT(*) FROM audit_logs WHERE 1=1`;
      const countParams: any[] = [];
      paramCount = 0;

      if (table_name) {
        paramCount++;
        countQuery += ` AND table_name = $${paramCount}`;
        countParams.push(table_name);
      }

      if (operation) {
        paramCount++;
        countQuery += ` AND operation = $${paramCount}`;
        countParams.push(operation);
      }

      if (start_date) {
        paramCount++;
        countQuery += ` AND created_at >= $${paramCount}`;
        countParams.push(new Date(start_date as string));
      }

      if (end_date) {
        paramCount++;
        countQuery += ` AND created_at <= $${paramCount}`;
        countParams.push(new Date(end_date as string));
      }

      const totalResult = await databaseService.$queryRawUnsafe(countQuery, ...countParams);
      const total = Array.isArray(totalResult) && totalResult[0] ? Number(totalResult[0].count) : 0;

      res.status(200).json({
        success: true,
        data: {
          auditLogs,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit)),
          },
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: 'Failed to fetch audit logs',
      });
    }
  }
);

/**
 * @route POST /api/database-security/initialize
 * @description Initialize database security features
 * @access Admin only
 */
router.post('/initialize', async (_req, res) => {
  try {
    await dbSecurityService.initializeSecurityMonitoring();
    
    res.status(200).json({
      success: true,
      message: 'Database security features initialized successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to initialize database security features',
    });
  }
});

/**
 * @route GET /api/database-security/vulnerabilities
 * @description Check for database vulnerabilities
 * @access Admin only
 */
router.get('/vulnerabilities', async (_req, res) => {
  try {
    const vulnerabilities: string[] = [];
    await dbSecurityService['checkCommonVulnerabilities'](vulnerabilities);
    
    res.status(200).json({
      success: true,
      data: {
        vulnerabilities,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to check for vulnerabilities',
    });
  }
});

export default router;