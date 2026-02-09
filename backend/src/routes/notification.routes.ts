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
    
    await notificationService.markAsRead(userId, notificationId);

    res.json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
});

// Mark all notifications as read
router.patch('/read-all', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    
    await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
});

// Delete a notification
router.delete('/:id', authenticateToken, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const notificationId = req.params.id;
    
    await notificationService.deleteNotification(userId, notificationId);

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
