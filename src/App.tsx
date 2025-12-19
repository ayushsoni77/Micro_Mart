import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Orders from './pages/Orders';
import Notifications from './pages/Notifications';
import Dashboard from './pages/Dashboard';
import SellerDashboard from './pages/SellerDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import Addresses from './pages/addresses';
import OrderDetail from './pages/OrderDetail';
import VerifyEmail from './pages/verify-email';
import OAuthSuccess from './pages/OAuthSuccess';
import Payment from './pages/Payment';
import { AnimatePresence, motion, LayoutGroup } from 'framer-motion';

function AppContent() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-lg text-grey">Loading...</p>
      </div>
    );
  }
  return (
      <CartProvider>
        <Router>
          <div className="min-h-screen bg-light-grey">
            <Navbar />
            <main className="container mx-auto px-4 py-8">
              <LayoutGroup>
                <AnimatePresence mode="wait">
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/" element={<motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }} transition={{ duration: 0.4 }}><Home /></motion.div>} />
                    <Route path="/products" element={<Products />} />
                    <Route path="/products/:id" element={<motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.4 }}><ProductDetail /></motion.div>} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/seller-dashboard" element={<ProtectedRoute requiredRole="seller"><SellerDashboard /></ProtectedRoute>} />
                    <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
                    <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
                    <Route path="/addresses" element={<ProtectedRoute><Addresses /></ProtectedRoute>} />
                    <Route path="/orders/:orderId" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
                    <Route path="/verify-email" element={<VerifyEmail />} />
                    <Route path="/oauth-success" element={<OAuthSuccess />} />
                    <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                  </Routes>
                </AnimatePresence>
              </LayoutGroup>
            </main>
          </div>
        </Router>
      </CartProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;