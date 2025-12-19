import Notification from '../models/Notification.js';

export const createNotification = async (req, res) => {
  try {
    const { type, userId, orderId, title, message, priority = 'medium', category, actionUrl, actionText, metadata = {} } = req.body;

    // Validate required fields
    if (!type || !userId || !title || !message || !category) {
      return res.status(400).json({ 
        message: 'Type, userId, title, message, and category are required' 
      });
    }

    // Create notification in database
    const notification = await Notification.create({
      type,
      userId: parseInt(userId),
      orderId: orderId ? parseInt(orderId) : undefined,
      title,
      message,
      priority,
      category,
      actionUrl,
      actionText,
      metadata
    });

    // In a real application, you would send email/push notification here
    console.log(`📧 Notification created: ${title}`);
    console.log(`📧 Notification details:`, {
      id: notification._id,
      type: notification.type,
      userId: notification.userId,
      category: notification.category
    });

    res.status(201).json({ 
      message: 'Notification created successfully', 
      notification 
    });
  } catch (error) {
    console.error('❌ Create notification error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const { userId, read, limit = 50, page = 1 } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    // Build query
    const query = { userId: parseInt(userId) };
    if (read !== undefined) {
      query.read = read === 'true';
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get notifications
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    // Get total count for pagination
    const totalCount = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      userId: parseInt(userId), 
      read: false 
    });

    res.json({ 
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit))
      },
      unreadCount
    });
  } catch (error) {
    console.error('❌ Get notifications error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ notification });
  } catch (error) {
    console.error('❌ Get notification by ID error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findById(id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.markAsRead();

    res.json({ 
      message: 'Notification marked as read', 
      notification 
    });
  } catch (error) {
    console.error('❌ Mark as read error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const result = await Notification.markAllAsRead(parseInt(userId));

    res.json({ 
      message: 'All notifications marked as read', 
      updatedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error('❌ Mark all as read error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const count = await Notification.getUnreadCount(parseInt(userId));

    res.json({ unreadCount: count });
  } catch (error) {
    console.error('❌ Get unread count error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ 
      message: 'Notification deleted successfully', 
      notification 
    });
  } catch (error) {
    console.error('❌ Delete notification error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteAllNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const result = await Notification.deleteMany({ userId: parseInt(userId) });

    res.json({ 
      message: 'All notifications deleted successfully', 
      deletedCount: result.deletedCount 
    });
  } catch (error) {
    console.error('❌ Delete all notifications error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};