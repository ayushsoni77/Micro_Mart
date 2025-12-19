import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['order_created', 'order_status_update', 'payment_success', 'payment_failed', 'shipment_update', 'delivery_update', 'system_alert', 'promotional'],
    comment: 'Type of notification'
  },
  userId: {
    type: Number,
    required: true,
    index: true,
    comment: 'User ID who should receive the notification'
  },
  orderId: {
    type: Number,
    required: false,
    index: true,
    comment: 'Related order ID (if applicable)'
  },
  title: {
    type: String,
    required: true,
    maxlength: 255,
    comment: 'Notification title'
  },
  message: {
    type: String,
    required: true,
    maxlength: 1000,
    comment: 'Notification message content'
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
    comment: 'Whether the notification has been read'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    comment: 'Notification priority level'
  },
  category: {
    type: String,
    enum: ['order', 'payment', 'shipment', 'system', 'promotional'],
    required: true,
    comment: 'Notification category'
  },
  actionUrl: {
    type: String,
    maxlength: 500,
    comment: 'URL to navigate to when notification is clicked'
  },
  actionText: {
    type: String,
    maxlength: 100,
    comment: 'Text for the action button'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    comment: 'Additional metadata for the notification'
  },
  sentAt: {
    type: Date,
    default: Date.now,
    comment: 'When the notification was sent'
  },
  readAt: {
    type: Date,
    comment: 'When the notification was read'
  },
  expiresAt: {
    type: Date,
    comment: 'When the notification expires (for promotional notifications)'
  },
  emailSent: {
    type: Boolean,
    default: false,
    comment: 'Whether email notification was sent'
  },
  emailSentAt: {
    type: Date,
    comment: 'When email notification was sent'
  },
  pushSent: {
    type: Boolean,
    default: false,
    comment: 'Whether push notification was sent'
  },
  pushSentAt: {
    type: Date,
    comment: 'When push notification was sent'
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ category: 1 });
notificationSchema.index({ priority: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function() {
  const now = new Date();
  const diffInSeconds = Math.floor((now - this.createdAt) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
});

// Virtual for notification status
notificationSchema.virtual('status').get(function() {
  if (this.read) return 'read';
  if (this.expiresAt && new Date() > this.expiresAt) return 'expired';
  return 'unread';
});

// Pre-save middleware to set readAt when marked as read
notificationSchema.pre('save', function(next) {
  if (this.isModified('read') && this.read && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

// Static methods
notificationSchema.statics.findUnreadByUser = function(userId) {
  return this.find({ userId, read: false }).sort({ createdAt: -1 });
};

notificationSchema.statics.findByUser = function(userId, limit = 50) {
  return this.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};

notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, read: false },
    { read: true, readAt: new Date() }
  );
};

notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, read: false });
};

notificationSchema.statics.findExpired = function() {
  return this.find({ expiresAt: { $lt: new Date() } });
};

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsUnread = function() {
  this.read = false;
  this.readAt = undefined;
  return this.save();
};

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification; 