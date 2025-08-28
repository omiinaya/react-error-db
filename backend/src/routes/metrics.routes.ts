import { Router } from 'express';
import { metricsHandler } from '../utils/metrics';

const router = Router();

/**
 * @route GET /api/metrics
 * @description Prometheus metrics endpoint
 * @access Public (consider authentication in production)
 */
router.get('/', metricsHandler);

/**
 * @route GET /api/metrics/health
 * @description Metrics health check
 * @access Public
 */
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'OK',
      metrics_endpoint: '/api/metrics',
      timestamp: new Date().toISOString(),
    },
  });
});

export default router;