import { Router } from 'express';

const router = Router();

/**
 * @route GET /api/health
 * @description Health check endpoint
 * @access Public
 */
router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

export default router;