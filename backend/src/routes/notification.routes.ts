import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { notificationService } from '../services/notification.service';

const router = Router();

// Get user's notifications
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const unreadOnly = req.query.unread === 'true';
    const page = req.query.page ? parseInt(req.query.page as string) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
    
    const notifications = await notificationService.getUserNotifications(
      userId,
      unreadOnly,
      page,
      limit
    );

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
});

// Get unread count
router.get('/unread-count', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.patch('/:id/read', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const notificationId = req.params.id;
    
    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID is required',
      });
    }
    
    await notificationService.markAsRead(userId, notificationId);

    return res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    return next(error);
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    
    await notificationService.markAllAsRead(userId);

    return res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    return next(error);
  }
});

// Delete a notification
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const notificationId = req.params.id;
    
    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: 'Notification ID is required',
      });
    }
    
    await notificationService.deleteNotification(userId, notificationId);

    return res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
