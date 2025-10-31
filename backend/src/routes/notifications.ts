import { Router } from 'express';
import { getNotifications, updateNotificationSettings, markAsRead } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getNotifications);
router.put('/settings', authenticate, updateNotificationSettings);
router.post('/:notificationId/read', authenticate, markAsRead);

export default router;

