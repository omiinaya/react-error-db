import { Router } from 'express';
import databaseService from '../services/database.service';
import { logger } from '../utils/logger';
import { config } from '../config';
import { uptimeMonitor } from '../utils/uptime-monitor';

const router = Router();

/**
 * @route GET /api/health
 * @description Basic health check endpoint
 * @access Public
 */
router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      version: process.env.npm_package_version || '1.0.0',
    },
  });
});

/**
 * @route GET /api/health/readiness
 * @description Readiness probe - check if application is ready to serve traffic
 * @access Public
 */
router.get('/readiness', async (_req, res) => {
  try {
    // Check database connection
    await databaseService.$queryRaw`SELECT 1`;
    
    res.status(200).json({
      success: true,
      data: {
        status: 'READY',
        timestamp: new Date().toISOString(),
        database: 'CONNECTED',
        services: ['database'],
      },
    });
  } catch (error) {
    logger.error('Readiness probe failed:', error);
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database connection failed',
        timestamp: new Date().toISOString(),
      },
    });
  }
});

/**
 * @route GET /api/health/liveness
 * @description Liveness probe - check if application is running
 * @access Public
 */
router.get('/liveness', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'LIVE',
      timestamp: new Date().toISOString(),
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    },
  });
});

/**
 * @route GET /api/health/startup
 * @description Startup probe - check if application started successfully
 * @access Public
 */
router.get('/startup', (_req, res) => {
  // Check if critical services are initialized
  const startupStatus = {
    database: databaseService !== null,
    // Add other critical services here
  };

  const allServicesReady = Object.values(startupStatus).every(status => status);

  if (allServicesReady) {
    res.status(200).json({
      success: true,
      data: {
        status: 'STARTED',
        timestamp: new Date().toISOString(),
        services: startupStatus,
      },
    });
  } else {
    res.status(503).json({
      success: false,
      error: {
        code: 'STARTUP_FAILED',
        message: 'Application failed to start',
        timestamp: new Date().toISOString(),
        services: startupStatus,
      },
    });
  }
});

/**
 * @route GET /api/health/metrics
 * @description Health metrics endpoint
 * @access Public
 */
router.get('/metrics', (_req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    process: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      version: process.version,
    },
    system: {
      arch: process.arch,
      platform: process.platform,
      cpus: require('os').cpus().length,
      totalMemory: require('os').totalmem(),
      freeMemory: require('os').freemem(),
    },
    environment: config.nodeEnv,
  };

  res.status(200).json({
    success: true,
    data: metrics,
  });
});

/**
 * @route GET /api/health/uptime
 * @description Uptime monitoring endpoint
 * @access Public
 */
router.get('/uptime', (_req, res) => {
  const metrics = uptimeMonitor.getMetrics();
  const status = uptimeMonitor.getStatus();
  const recentAlerts = uptimeMonitor.getAlerts(10);

  res.status(200).json({
    success: true,
    data: {
      status: status.status,
      message: status.message,
      metrics,
      recentAlerts,
      timestamp: new Date().toISOString(),
    },
  });
});

/**
 * @route GET /api/health/info
 * @description Application information endpoint
 * @access Public
 */
router.get('/info', (_req, res) => {
  const metrics = uptimeMonitor.getMetrics();
  
  res.status(200).json({
    success: true,
    data: {
      name: 'Error Database API',
      version: process.env.npm_package_version || '1.0.0',
      description: 'A comprehensive error code database with community-driven solutions',
      environment: config.nodeEnv,
      uptime: process.uptime(),
      totalUptime: metrics.totalUptime,
      startTime: metrics.startTime,
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        readiness: '/api/health/readiness',
        liveness: '/api/health/liveness',
        startup: '/api/health/startup',
        metrics: '/api/health/metrics',
        uptime: '/api/health/uptime',
      },
    },
  });
});

export default router;