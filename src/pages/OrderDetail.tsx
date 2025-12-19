import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Package, MapPin, ArrowLeft } from 'lucide-react';

interface OrderItem {
  id: number;
  productName: string;
  unitPrice: number;
  totalPrice: number;
  quantity: number;
  productImage?: string;
}

interface Order {
  id: number;
  userId: number;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: string;
  updatedAt: string;
}

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { user, token } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line
  }, [orderId]);

  const fetchOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`http://localhost:3003/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrder(response.data.order);
    } catch (err: any) {
      setError('Order not found or you do not have access.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Order not found</h2>
        <Link to="/orders" className="text-blue-600 hover:text-blue-700">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8">
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back</span>
      </button>
      <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-white/20 p-8">
        <div className="flex items-center space-x-3 mb-4">
          <Package className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900">Order #{order.id}</h1>
        </div>
        <p className="text-gray-600 mb-2">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
        <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-4">
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
        <div className="border-t pt-4 mt-4">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Products</h2>
          <div className="space-y-3">
            {order.items.map(item => (
              <div key={item.id} className="flex justify-between items-center bg-gray-50 rounded-lg p-4">
                <div>
                  <div className="font-medium text-gray-900">{item.productName}</div>
                  <div className="text-gray-600 text-sm">Quantity: {item.quantity}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">${item.totalPrice.toFixed(2)}</div>
                  <div className="text-gray-500 text-sm">${item.unitPrice.toFixed(2)} each</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center font-bold text-lg mt-6">
            <span>Total:</span>
            <span>${order.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        <div className="border-t pt-4 mt-4">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Shipping Address</h2>
          <div className="flex items-start space-x-2 text-gray-700">
            <MapPin className="w-5 h-5 mt-0.5" />
            <div>
              <div>{order.shippingAddress.street}</div>
              <div>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</div>
            </div>
          </div>
        </div>
        <div className="text-gray-500 text-sm mt-4">Last updated: {new Date(order.updatedAt).toLocaleString()}</div>
      </div>
    </div>
  );
};

export default OrderDetail; 