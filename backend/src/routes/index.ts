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
import categoryRequestRoutes from './category-request.routes';
import searchRoutes from './search.routes';
import bookmarkRoutes from './bookmark.routes';
import notificationRoutes from './notification.routes';
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
router.use('/category-requests', categoryRequestRoutes);
router.use('/search', searchRoutes);
router.use('/bookmarks', bookmarkRoutes);
router.use('/notifications', notificationRoutes);

// Log all registered routes for debugging
console.log('Registered API routes:');
console.log('- POST /api/errors/:errorId/solutions');
console.log('- GET /api/errors/:id (includes solutions)');
console.log('- GET /api/search (advanced search with filters)');
console.log('- GET /api/search/suggestions (autocomplete)');
console.log('- GET /api/search/history (search history)');
console.log('- GET /api/bookmarks (user bookmarks)');
console.log('- GET /api/notifications (user notifications)');

export default router;