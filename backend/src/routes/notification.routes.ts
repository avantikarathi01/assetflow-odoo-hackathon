import { Router } from 'express';
import { NotificationService } from '../modules/notifications/notification.service';

const router = Router();

// Get current user's unread & recent notifications
router.get('/', async (req, res, next) => {
  try {
    const list = await NotificationService.getUnreadAndRecent(
      req.user!.organizationId,
      req.user!.userId
    );
    res.json(list);
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await NotificationService.markAsRead(
      req.user!.organizationId,
      id,
      req.user!.userId
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
