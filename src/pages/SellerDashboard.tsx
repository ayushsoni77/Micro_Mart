import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  BarChart3,
  X,
  Upload,
  Calendar,
  Users,
  ShoppingCart,
  RefreshCw,
  Filter,
  HelpCircle
} from 'lucide-react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import SellerWelcomeScreen from '../components/SellerWelcomeScreen';
import EmptySellerState from '../components/EmptySellerState';
import DashboardTour from '../components/DashboardTour';
import OrdersTour from '../components/OrdersTour';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Product {
  _id: string;
  id?: number;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  reserved: number;
  views: number;
  salesCount: number;
  createdAt: string;
  sellerId: number;
  sellerName: string;
}

interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  totalItems: number;
  dailyRevenue: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    productId: string;
    productName: string;
    totalSold: number;
    totalRevenue: number;
    orderCount: number;
  }>;
  orderStatus: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
}

const SellerDashboard = () => {
  const { user, token } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  // Onboarding states
  const [showWelcome, setShowWelcome] = useState(false);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [showDashboardTour, setShowDashboardTour] = useState(false);
  const [showOrdersTour, setShowOrdersTour] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    // Check if this specific user has completed onboarding
    const userOnboardingKey = `sellerOnboardingCompleted_${user?.id || 'unknown'}`;
    return localStorage.getItem(userOnboardingKey) === 'true';
  });

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    images: [''],
    initialStock: '0'
  });

  useEffect(() => {
    if (user) {
      // Check if this is a new seller (no products)
      checkSellerStatus();
    }
  }, [user]);

  // Update onboarding state when user changes
  useEffect(() => {
    if (user) {
      const userOnboardingKey = `sellerOnboardingCompleted_${user.id}`;
      const hasCompleted = localStorage.getItem(userOnboardingKey) === 'true';
      setHasCompletedOnboarding(hasCompleted);
    }
  }, [user]);

  const checkSellerStatus = async () => {
    try {
      const response = await axios.get('http://localhost:3002/api/products/seller/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const productsData = response.data || [];
      
      if (productsData.length === 0) {
        // New seller with no products
        if (!hasCompletedOnboarding) {
          setShowWelcome(true);
        } else {
          setShowEmptyState(true);
        }
      } else {
        // Existing seller with products
        setProducts(productsData);
        fetchAnalytics();
      }
    } catch (error) {
      console.error('Error checking seller status:', error);
      // If error, assume new seller
      if (!hasCompletedOnboarding) {
        setShowWelcome(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWelcomeComplete = () => {
    setShowWelcome(false);
    setShowEmptyState(true);
    setHasCompletedOnboarding(true);
    // Store onboarding completion for this specific user
    const userOnboardingKey = `sellerOnboardingCompleted_${user?.id || 'unknown'}`;
    localStorage.setItem(userOnboardingKey, 'true');
  };

  const handleEmptyStateAddProduct = () => {
    setShowEmptyState(false);
    setShowCreateModal(true);
  };

  const handleEmptyStateSkip = () => {
    setShowEmptyState(false);
    setShowDashboardTour(true);
  };

  const handleDashboardTourComplete = () => {
    setShowDashboardTour(false);
    setHasCompletedOnboarding(true);
    // Show suggestion to visit orders section
    setTimeout(() => {
      setShowOrdersTour(true);
    }, 1000);
  };

  const handleDashboardTourSkip = () => {
    setShowDashboardTour(false);
    setHasCompletedOnboarding(true);
  };

  const handleOrdersTourComplete = () => {
    setShowOrdersTour(false);
  };

  const handleOrdersTourSkip = () => {
    setShowOrdersTour(false);
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://localhost:3002/api/products/seller/products', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const productsData = response.data || [];
      
      // Use real data from the API, no mock sales data
      const productsWithRealData = productsData.map((product: any) => ({
        ...product,
        salesCount: product.salesCount || 0, // Use real sales count if available
        reserved: 0
      }));
      
      setProducts(productsWithRealData);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!user) return;
    
    setAnalyticsLoading(true);
    try {
      const response = await axios.get(
        `http://localhost:3003/api/orders/analytics/seller/${user.id}?period=${selectedPeriod}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setAnalytics(response.data.analytics);
      console.log('📊 Real analytics data loaded:', response.data.analytics);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Set empty analytics data instead of mock data
      setAnalytics({
        totalRevenue: 0,
        totalOrders: 0,
        totalItems: 0,
        dailyRevenue: [],
        topProducts: [],
        orderStatus: {
          pending: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0
        }
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3002/api/products', {
        ...formData,
        price: parseFloat(formData.price),
        initialStock: parseInt(formData.initialStock),
        images: formData.images.filter(img => img.trim() !== ''),
        sellerId: user?.id,
        sellerName: user?.name
      });
      
      setShowCreateModal(false);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        images: [''],
        initialStock: '0'
      });
      
      // Refresh products and show dashboard
      await fetchProducts();
      setShowEmptyState(false);
      setShowDashboardTour(true);
    } catch (error: any) {
      console.error('Error creating product:', error);
      alert(error.response?.data?.message || 'Failed to create product');
    }
  };

  const handleEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      await axios.put(`http://localhost:3002/api/products/${editingProduct._id || editingProduct.id}`, {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        category: formData.category,
        images: formData.images.filter(img => img.trim() !== '')
      });
      
      setShowEditModal(false);
      setEditingProduct(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        images: [''],
        initialStock: '0'
      });
      fetchProducts();
    } catch (error: any) {
      console.error('Error updating product:', error);
      alert(error.response?.data?.message || 'Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId: string | number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await axios.delete(`http://localhost:3002/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchProducts();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      alert(error.response?.data?.message || 'Failed to delete product');
    }
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      category: product.category,
      images: product.images.length > 0 ? product.images : [''],
      initialStock: '0'
    });
    setShowEditModal(true);
  };

  const addImageField = () => {
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, '']
    }));
  };

  const removeImageField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const updateImageField = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.map((img, i) => i === index ? value : img)
    }));
  };

  // Get seller's product IDs for filtering analytics
  const sellerProductIds = products.map(p => p._id || p.id);

  // Filter topProducts to only include seller's products
  const filteredTopProducts = analytics?.topProducts?.filter(tp =>
    sellerProductIds.includes(tp.productId)
  ) || [];

  // Optionally, filter dailyRevenue if it is product-specific (if not, leave as is)
  // If dailyRevenue is per product, filter here. If it's per day for all seller's products, leave as is.

  // Use filteredTopProducts in the Top Products chart and analytics display
  const topProductsChartData = {
    labels: filteredTopProducts.map(item => item.productName),
    datasets: [
      {
        label: 'Revenue',
        data: filteredTopProducts.map(item => item.totalRevenue),
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)'
        ]
      }
    ]
  };

  // Show welcome screen for new sellers
  if (showWelcome) {
    return <SellerWelcomeScreen onComplete={handleWelcomeComplete} sellerName={user?.name || 'Seller'} />;
  }

  // Show empty state for sellers with no products
  if (showEmptyState) {
    return <EmptySellerState onAddFirstProduct={handleEmptyStateAddProduct} onSkip={handleEmptyStateSkip} />;
  }

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Chart data configurations
  const revenueChartData = {
    labels: analytics?.dailyRevenue.map(item => item.date) || [],
    datasets: [
      {
        label: 'Revenue',
        data: analytics?.dailyRevenue.map(item => item.revenue) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }
    ]
  };

  const revenueChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Daily Revenue Trend'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const orderStatusChartData = {
    labels: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    datasets: [
      {
        data: [
          analytics?.orderStatus.pending || 0,
          analytics?.orderStatus.processing || 0,
          analytics?.orderStatus.shipped || 0,
          analytics?.orderStatus.delivered || 0,
          analytics?.orderStatus.cancelled || 0
        ],
        backgroundColor: [
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Onboarding Tours */}
      <DashboardTour 
        isVisible={showDashboardTour} 
        onComplete={handleDashboardTourComplete} 
        onSkip={handleDashboardTourSkip} 
      />
      <OrdersTour 
        isVisible={showOrdersTour} 
        onComplete={handleOrdersTourComplete} 
        onSkip={handleOrdersTourSkip} 
      />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="dashboard-header">
              <h1 className="text-3xl font-bold text-gray-900">Seller Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="add-product-btn bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
              <button
                onClick={() => setShowDashboardTour(true)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Dashboard Tour"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="stats-grid grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ₹{analytics?.totalRevenue?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics?.totalOrders || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {products.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items Sold</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {analytics?.totalItems || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="analytics-section grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
            <Line data={revenueChartData} options={revenueChartOptions} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
            <Doughnut 
              data={orderStatusChartData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                  }
                }
              }} 
            />
          </div>
        </div>

        {/* Top Products */}
        {filteredTopProducts && filteredTopProducts.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Products</h3>
            <Bar 
              data={topProductsChartData} 
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: false
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }} 
            />
          </div>
        )}

        {/* Products Section */}
        <div className="products-section bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">Your Products</h3>
              <div className="flex items-center space-x-4">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
                <button
                  onClick={fetchAnalytics}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-600 mb-4">Start selling by adding your first product</p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Product
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product._id || product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="aspect-w-16 aspect-h-9 mb-4">
                      <img
                        src={product.images[0] || 'https://via.placeholder.com/300x200?text=No+Image'}
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-lg"
                      />
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{product.name}</h4>
                    <p className="text-gray-600 text-sm mb-2">{product.description}</p>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-lg font-semibold text-gray-900">₹{product.price}</span>
                      <span className="text-sm text-gray-500">Stock: {product.stock}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/product/${product._id || product.id}`}
                        className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-center text-sm hover:bg-gray-200 transition-colors"
                      >
                        <Eye className="w-4 h-4 inline mr-1" />
                        View
                      </Link>
                      <button
                        onClick={() => openEditModal(product)}
                        className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg text-sm hover:bg-blue-200 transition-colors"
                      >
                        <Edit className="w-4 h-4 inline mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product._id || product.id || 'unknown')}
                        className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 inline mr-1" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="nav-menu mt-8 bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Navigation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/orders"
              className="orders-link flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-blue-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Manage Orders</h4>
                <p className="text-sm text-gray-600">View and process customer orders</p>
              </div>
            </Link>
            <Link
              to="/notifications"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <AlertTriangle className="w-5 h-5 text-orange-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">Notifications</h4>
                <p className="text-sm text-gray-600">Check your latest updates</p>
              </div>
            </Link>
            <Link
              to="/"
              className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Package className="w-5 h-5 text-green-600 mr-3" />
              <div>
                <h4 className="font-medium text-gray-900">View Store</h4>
                <p className="text-sm text-gray-600">See your products as customers do</p>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Add New Product</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateProduct}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Books">Books</option>
                      <option value="Home & Garden">Home & Garden</option>
                      <option value="Sports">Sports</option>
                      <option value="Beauty">Beauty</option>
                      <option value="Toys">Toys</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Initial Stock
                    </label>
                    <input
                      type="number"
                      value={formData.initialStock}
                      onChange={(e) => setFormData({...formData, initialStock: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Images (URLs)
                    </label>
                    {formData.images.map((image, index) => (
                      <div key={index} className="flex space-x-2 mb-2">
                        <input
                          type="url"
                          value={image}
                          onChange={(e) => updateImageField(index, e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Image URL"
                        />
                        {formData.images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImageField(index)}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addImageField}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg px-3 py-2 text-gray-600 hover:border-gray-400 transition-colors"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add Another Image
                    </button>
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Edit Product</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditProduct}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Clothing">Clothing</option>
                      <option value="Books">Books</option>
                      <option value="Home & Garden">Home & Garden</option>
                      <option value="Sports">Sports</option>
                      <option value="Beauty">Beauty</option>
                      <option value="Toys">Toys</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Images (URLs)
                    </label>
                    {formData.images.map((image, index) => (
                      <div key={index} className="flex space-x-2 mb-2">
                        <input
                          type="url"
                          value={image}
                          onChange={(e) => updateImageField(index, e.target.value)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Image URL"
                        />
                        {formData.images.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeImageField(index)}
                            className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={addImageField}
                      className="w-full border-2 border-dashed border-gray-300 rounded-lg px-3 py-2 text-gray-600 hover:border-gray-400 transition-colors"
                    >
                      <Plus className="w-4 h-4 inline mr-2" />
                      Add Another Image
                    </button>
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;