import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { exportService } from '../services/export.service';

const router = Router();

// Get export stats
router.get('/stats', authenticateToken, async (_req, res, next) => {
  try {
    const stats = await exportService.getExportStats();
    return res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    return next(error);
  }
});

// Export errors (admin only)
router.get('/errors', authenticateToken, async (req, res, next) => {
  try {
    if (!req.user!.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const format = (req.query.format as 'json' | 'csv') || 'json';
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const options: any = { format };
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;

    const result = await exportService.exportErrors(options);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.data);
  } catch (error) {
    return next(error);
  }
});

// Export solutions (admin only)
router.get('/solutions', authenticateToken, async (req, res, next) => {
  try {
    if (!req.user!.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const format = (req.query.format as 'json' | 'csv') || 'json';
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const options: any = { format };
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;

    const result = await exportService.exportSolutions(options);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.data);
  } catch (error) {
    return next(error);
  }
});

// Export user data (users can export their own data)
router.get('/user-data', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const result = await exportService.exportUserData(userId);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.data);
  } catch (error) {
    return next(error);
  }
});

// Export analytics (admin only)
router.get('/analytics', authenticateToken, async (req, res, next) => {
  try {
    if (!req.user!.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
    }

    const format = (req.query.format as 'json' | 'csv') || 'json';
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const options: any = { format };
    if (startDate) options.startDate = startDate;
    if (endDate) options.endDate = endDate;

    const result = await exportService.exportAnalytics(options);

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    return res.send(result.data);
  } catch (error) {
    return next(error);
  }
});

export default router;
