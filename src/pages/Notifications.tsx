import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Check, Package, ShoppingCart, AlertCircle, Mail, CreditCard, Truck, Gift, Settings } from 'lucide-react';
import axios from 'axios';

interface Notification {
  _id: string;
  id: string;
  type: string;
  userId: number;
  orderId?: number;
  title: string;
  message: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'order' | 'payment' | 'shipment' | 'system' | 'promotional';
  actionUrl?: string;
  actionText?: string;
  timeAgo: string;
  status: 'read' | 'unread' | 'expired';
  createdAt: string;
  readAt?: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get(`http://localhost:3004/api/notifications?userId=${user?.id}`);
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(`http://localhost:3004/api/notifications/user/${user?.id}/unread-count`);
      setUnreadCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await axios.patch(`http://localhost:3004/api/notifications/${notificationId}/read`);
      setNotifications(notifications.map(notification =>
        notification._id === notificationId
          ? { ...notification, read: true, status: 'read' }
          : notification
      ));
      fetchUnreadCount(); // Refresh unread count
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.patch(`http://localhost:3004/api/notifications/user/${user?.id}/read-all`);
      setNotifications(notifications.map(notification => ({
        ...notification,
        read: true,
        status: 'read'
      })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string, category: string) => {
    switch (type) {
      case 'order_created':
      case 'order_status_update':
        return <ShoppingCart className="w-5 h-5 text-blue-500" />;
      case 'payment_success':
      case 'payment_failed':
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case 'shipment_update':
      case 'delivery_update':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'promotional':
        return <Gift className="w-5 h-5 text-orange-500" />;
      case 'system_alert':
        return <Settings className="w-5 h-5 text-gray-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationColor = (priority: string, read: boolean) => {
    const priorityColors = {
      low: 'border-l-gray-400',
      medium: 'border-l-blue-500',
      high: 'border-l-orange-500',
      urgent: 'border-l-red-500'
    };
    
    const color = priorityColors[priority as keyof typeof priorityColors] || priorityColors.medium;
    return `${color} ${read ? 'bg-gray-50' : 'bg-blue-50'}`;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { color: 'bg-gray-100 text-gray-700', text: 'Low' },
      medium: { color: 'bg-blue-100 text-blue-700', text: 'Medium' },
      high: { color: 'bg-orange-100 text-orange-700', text: 'High' },
      urgent: { color: 'bg-red-100 text-red-700', text: 'Urgent' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8 animate-slideUp">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Notifications</h1>
            <p className="text-gray-600">Stay updated with your account activity</p>
          </div>
          <div className="hidden md:block">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
              <Bell className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Notifications Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-6 animate-slideUp">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Notifications</p>
              <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
            </div>
            <Bell className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-6 animate-slideUp">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-red-600">{unreadCount}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-6 animate-slideUp">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Read</p>
              <p className="text-2xl font-bold text-green-600">
                {notifications.filter(n => n.read).length}
              </p>
            </div>
            <Check className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-6 animate-slideUp">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Actions</p>
              <button
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Mark all read
              </button>
            </div>
            <Check className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden animate-slideUp">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Recent Notifications</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {notifications.map((notification, idx) => (
              <div
                key={notification._id}
                className={`p-6 border-l-4 transition-all duration-200 hover:bg-gray-50 ${getNotificationColor(notification.priority, notification.read)} animate-slideUp`}
                style={{ animationDelay: `${idx * 60}ms` }}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type, notification.category)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        {getPriorityBadge(notification.priority)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">
                          {notification.timeAgo}
                        </span>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification._id)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
                          >
                            Mark as read
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{notification.message}</p>
                    {notification.actionUrl && notification.actionText && (
                      <a
                        href={notification.actionUrl}
                        className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        {notification.actionText} →
                      </a>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  
                  {!notification.read && (
                    <div className="flex-shrink-0">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-12 text-center animate-fadeIn">
          <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No notifications yet</h3>
          <p className="text-gray-600">You'll see notifications about your orders and account activity here.</p>
        </div>
      )}

      {/* Notification Types Info */}
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-6 animate-slideUp">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Notification Types</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
            <ShoppingCart className="w-5 h-5 text-blue-500" />
            <div>
              <p className="font-medium text-gray-900">Order Updates</p>
              <p className="text-sm text-gray-600">Order creation and status changes</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
            <CreditCard className="w-5 h-5 text-green-500" />
            <div>
              <p className="font-medium text-gray-900">Payment Updates</p>
              <p className="text-sm text-gray-600">Payment success and failures</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
            <Truck className="w-5 h-5 text-purple-500" />
            <div>
              <p className="font-medium text-gray-900">Shipment Updates</p>
              <p className="text-sm text-gray-600">Shipping and delivery updates</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
            <Gift className="w-5 h-5 text-orange-500" />
            <div>
              <p className="font-medium text-gray-900">Promotional</p>
              <p className="text-sm text-gray-600">Special offers and deals</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <Settings className="w-5 h-5 text-gray-500" />
            <div>
              <p className="font-medium text-gray-900">System Alerts</p>
              <p className="text-sm text-gray-600">General system notifications</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;