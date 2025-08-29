import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import applicationRoutes from './application.routes';
import categoryRoutes from './category.routes';
import errorRoutes from './error.routes';
import metricsRoutes from './metrics.routes';
import solutionRoutes from './solution.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import databaseSecurityRoutes from './database-security.routes';
import secretsRoutes from './secrets.routes';
import {
  cspReportHandler,
  xssReportHandler,
  ctReportHandler,
  securityHeadersTest
} from '../middleware/security.middleware';

const router = Router();

// Health check routes
router.use('/health', healthRoutes);

// Security reporting endpoints
router.post('/security/csp-report', cspReportHandler);
router.post('/security/xss-report', xssReportHandler);
router.post('/security/ct-report', ctReportHandler);
router.get('/security/headers-test', securityHeadersTest);

// Metrics endpoint
router.use('/metrics', metricsRoutes);

// API routes
router.use('/auth', authRoutes);
router.use('/applications', applicationRoutes);
router.use('/categories', categoryRoutes);
router.use('/errors', errorRoutes);
router.use('/solutions', solutionRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/database-security', databaseSecurityRoutes);
router.use('/secrets', secretsRoutes);

// TODO: Add search routes when implemented
// router.use('/search', searchRoutes);

export default router;