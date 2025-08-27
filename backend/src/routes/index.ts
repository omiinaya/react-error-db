import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import applicationRoutes from './application.routes';
import errorRoutes from './error.routes';
import solutionRoutes from './solution.routes';
import userRoutes from './user.routes';

const router = Router();

// Health check routes
router.use('/health', healthRoutes);

// API routes
router.use('/auth', authRoutes);
router.use('/applications', applicationRoutes);
router.use('/errors', errorRoutes);
router.use('/solutions', solutionRoutes);
router.use('/users', userRoutes);

// TODO: Add search routes when implemented
// router.use('/search', searchRoutes);

export default router;