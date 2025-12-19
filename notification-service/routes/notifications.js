import express from 'express';
import { 
  createNotification, 
  getNotifications, 
  getNotificationById,
  markAsRead, 
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  deleteAllNotifications
} from '../controllers/notificationController.js';

const router = express.Router();

// Create notification
router.post('/', createNotification);
router.post('/notify', createNotification);

// Get notifications
router.get('/', getNotifications);
router.get('/:id', getNotificationById);

// Mark notifications as read
router.patch('/:id/read', markAsRead);
router.patch('/user/:userId/read-all', markAllAsRead);

// Get unread count
router.get('/user/:userId/unread-count', getUnreadCount);

// Delete notifications
router.delete('/:id', deleteNotification);
router.delete('/user/:userId/all', deleteAllNotifications);

export default router;