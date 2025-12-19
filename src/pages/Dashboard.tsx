import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart, Package, Bell, TrendingUp, Users, DollarSign, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const { user, token } = useAuth();
  const { getTotalItems, getTotalPrice } = useCart();
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    notifications: 0,
    products: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [ordersResponse, notificationsResponse, productsResponse] = await Promise.all([
        axios.get(`http://localhost:3003/api/orders?userId=${user?.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`http://localhost:3004/api/notifications?userId=${user?.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:3002/api/products', {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);

      const orders = ordersResponse.data.orders || [];
      const notifications = notificationsResponse.data.notifications || [];
      const products = productsResponse.data.products || [];

      setStats({
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum: number, order: any) => sum + order.totalAmount, 0),
        notifications: notifications.filter((n: any) => !n.read).length,
        products: products.length,
      });

      setRecentOrders(orders.slice(0, 3));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      change: '+12%',
      changeColor: 'text-green-600',
    },
    {
      title: 'Total Spent',
      value: `$${stats.totalSpent.toFixed(2)}`,
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      change: '+8%',
      changeColor: 'text-green-600',
    },
    {
      title: 'Notifications',
      value: stats.notifications,
      icon: Bell,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      iconColor: 'text-yellow-600',
      change: '+3',
      changeColor: 'text-yellow-600',
    },
    {
      title: 'Available Products',
      value: stats.products,
      icon: ShoppingCart,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      change: '+2',
      changeColor: 'text-purple-600',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Section */}
      <div
        className="rounded-3xl shadow-2xl border border-neutral-200 p-8 bg-white"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
              <h1 className="text-3xl font-bold text-dark-grey">
              Welcome back, {user?.name}! 👋
            </h1>
            </div>
            <p className="text-grey text-lg">
              Here's what's happening with your MicroMart account today.
            </p>
          </div>
          <div className="hidden md:block">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center animate-float bg-blue-100"
            >
              <Users className="w-12 h-12 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`rounded-2xl shadow-lg border border-neutral-200 p-6 hover:transform hover:scale-105 hover:shadow-xl transition-all duration-300 animate-slideUp bg-white`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
                style={{
                  background:
                    stat.iconColor === 'text-blue-600'
                      ? '#2563EB'
                      : stat.iconColor === 'text-green-600'
                      ? '#10B981'
                      : stat.iconColor === 'text-yellow-600'
                      ? '#FACC15'
                      : stat.iconColor === 'text-purple-600'
                      ? '#6B7280'
                      : '#F3F4F6',
                }}
              >
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span className={`text-sm font-medium ${stat.changeColor} bg-white px-2 py-1 rounded-lg`}> {stat.change} </span>
            </div>
            <h3 className="text-sm font-medium text-grey mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-dark-grey">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Cart Summary & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cart Summary */}
        <div
          className="rounded-2xl shadow-xl border border-neutral-200 p-6 hover:shadow-2xl transition-all duration-300 animate-slideUp bg-white"
          style={{ animationDelay: '400ms' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-dark-grey">Current Cart</h2>
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          {getTotalItems() > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-grey font-medium">Items in cart:</span>
                <span className="font-bold text-dark-grey text-lg">{getTotalItems()}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl border border-green-100">
                <span className="text-grey font-medium">Total value:</span>
                <span className="font-bold text-green-600 text-lg">${getTotalPrice().toFixed(2)}</span>
              </div>
              <Link
                to="/orders"
                className="w-full bg-blue-500 text-white py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:bg-blue-600 hover:shadow-xl transform hover:scale-105"
                style={{ backgroundColor: '#2563EB' }}
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-grey rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="w-8 h-8 text-white" />
              </div>
              <p className="text-grey text-lg font-medium">Your cart is empty</p>
              <p className="text-sm text-grey mt-2">Add some products to get started!</p>
              <Link
                to="/products"
                className="inline-block mt-4 bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:bg-blue-600"
                style={{ backgroundColor: '#2563EB' }}
              >
                Browse Products
              </Link>
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div
          className="rounded-2xl shadow-xl border border-neutral-200 p-6 hover:shadow-2xl transition-all duration-300 animate-slideUp bg-white"
          style={{ animationDelay: '500ms' }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-dark-grey">Recent Orders</h2>
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-green-600" />
            </div>
          </div>
          {recentOrders.length > 0 ? (
            <div className="space-y-4">
              {recentOrders.map((order: any, index: number) => (
                <Link
                  key={order.id}
                  to={`/orders/${order.id}`}
                  className="flex items-center justify-between p-4 rounded-xl border border-grey transition-all duration-300 transform hover:scale-105 shadow-sm hover:shadow-md bg-grey/10"
                  style={{ animationDelay: `${600 + index * 100}ms` }}
                >
                  <div>
                    <p className="font-bold text-dark-grey">Order #{order.id}</p>
                    <p className="text-sm text-grey">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-dark-grey text-lg">${order.totalAmount.toFixed(2)}</p>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                      order.status === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : order.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-grey rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-white" />
              </div>
              <p className="text-grey text-lg font-medium">No orders yet</p>
              <p className="text-sm text-grey mt-2">Start shopping to see your orders here!</p>
              <Link
                to="/products"
                className="inline-block mt-4 bg-green-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 transform hover:scale-105 shadow-lg hover:bg-green-700"
                style={{ backgroundColor: '#10B981' }}
              >
                Start Shopping
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Manage Addresses */}
      <div
        className="rounded-2xl shadow-2xl border border-neutral-200 p-6 flex items-center justify-between hover:shadow-3xl transition-all duration-300 animate-slideUp bg-white"
        style={{ animationDelay: '600ms' }}
      >
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <MapPin className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-dark-grey mb-1">Addresses</h2>
            <p className="text-grey">Manage your saved shipping addresses</p>
          </div>
        </div>
        <Link
          to="/addresses"
          className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 shadow-lg hover:bg-blue-600 hover:shadow-xl transform hover:scale-105 border border-blue-600"
          style={{ backgroundColor: '#2563EB' }}
        >
          Manage Addresses
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;