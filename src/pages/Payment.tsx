import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// Razorpay script loader
function loadRazorpayScript(src: string) {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const PAYMENT_METHODS = [
  { label: 'UPI', value: 'UPI' },
  { label: 'Debit Card', value: 'Debit Card' },
  { label: 'Credit Card', value: 'Credit Card' },
  { label: 'Cash on Delivery', value: 'Cash on Delivery' },
];

const Payment: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  // Get orderId and addressId from query params or state
  const query = new URLSearchParams(location.search);
  const orderId = query.get('orderId');
  const addressId = query.get('addressId');
  // Use user from context, fallback to localStorage
  const userId = user?.id || localStorage.getItem('userId');

  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [details, setDetails] = useState({ upiId: '', cardNumber: '', cardExpiry: '', cardCVC: '' });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [notification, setNotification] = useState('');

  useEffect(() => {
    if (showSuccess) {
      setTimeout(() => setShowSuccess(false), 3000);
    }
  }, [showSuccess]);

  const handleRazorpayPayment = async (orderData: any) => {
    const res = await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');
    if (!res) {
      setError('Failed to load Razorpay SDK.');
      return;
    }
    const options = {
      key: 'RAZORPAY_KEY_ID', // Replace with your Razorpay key id
      amount: orderData.amount,
      currency: 'INR',
      name: 'E-Commerce',
      description: 'Order Payment',
      order_id: orderData.razorpayOrderId,
      handler: async function (response: any) {
        setShowSuccess(true);
        setNotification('Payment of ₹' + (orderData.amount / 100) + ' successful!');
        // Call backend to update payment status
        await axios.post('/payment/callback', {
          transactionId: response.razorpay_payment_id,
          paymentStatus: 'success',
        });
        // Redirect or update UI as needed
        setTimeout(() => navigate('/orders'), 2000);
      },
      prefill: {
        email: localStorage.getItem('email') || '',
      },
      theme: {
        color: '#2563EB',
      },
    };
    // @ts-ignore
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    if (!orderId || !userId) {
      setError('Missing order or user information. Please login again.');
      setLoading(false);
      return;
    }
    try {
      const payload: any = {
        orderId: String(orderId),
        userId: String(userId),
        paymentMethod
      };
      // Add mock details for UPI/Card if needed
      if (paymentMethod === 'UPI') payload.upiId = details.upiId;
      if (paymentMethod === 'Debit Card' || paymentMethod === 'Credit Card') {
        payload.cardNumber = details.cardNumber;
        payload.cardExpiry = details.cardExpiry;
        payload.cardCVC = details.cardCVC;
      }
      console.log('Submitting payment payload:', payload);
      // If not COD, create Razorpay order and open checkout
      if (paymentMethod !== 'Cash on Delivery') {
        // Call backend to create Razorpay order
        const orderRes = await axios.post('/payment/initiate', payload);
        if (orderRes.data.razorpayOrderId) {
          await handleRazorpayPayment(orderRes.data);
          setLoading(false);
          return;
        } else {
          setError('Failed to initiate payment.');
        }
      } else {
        // COD flow
        const res = await axios.post('/payment/initiate', payload);
        setResult(res.data);
        setNotification('Order placed with Cash on Delivery.');
        setTimeout(() => navigate('/orders'), 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-8 mt-10 animate-fade-in">
      <h2 className="text-2xl font-bold mb-6 text-center text-blue-600">Payment</h2>
      {notification && (
        <div className="mb-4 p-3 rounded bg-green-100 text-green-700 text-center animate-fade-in">{notification}</div>
      )}
      {showSuccess && (
        <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
          <svg className="w-16 h-16 text-green-500 mb-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          <div className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</div>
          <div className="text-lg text-gray-700">Thank you for your purchase.</div>
        </div>
      )}
      {!showSuccess && (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Select Payment Method</label>
          <div className="flex flex-wrap gap-4">
            {PAYMENT_METHODS.map((method) => (
              <button
                type="button"
                key={method.value}
                className={`px-4 py-2 rounded-lg border transition-colors duration-200 focus:outline-none ${paymentMethod === method.value ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-blue-100'}`}
                onClick={() => setPaymentMethod(method.value)}
              >
                {method.label}
              </button>
            ))}
          </div>
        </div>
        {/* Show extra fields for UPI/Card */}
        {paymentMethod === 'UPI' && (
          <div>
            <label className="block text-gray-700 mb-1">UPI ID</label>
            <input
              type="text"
              className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
              value={details.upiId}
              onChange={e => setDetails({ ...details, upiId: e.target.value })}
              required
            />
          </div>
        )}
        {(paymentMethod === 'Debit Card' || paymentMethod === 'Credit Card') && (
          <div className="space-y-2">
            <div>
              <label className="block text-gray-700 mb-1">Card Number</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                value={details.cardNumber}
                onChange={e => setDetails({ ...details, cardNumber: e.target.value })}
                required
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-gray-700 mb-1">Expiry</label>
                <input
                  type="text"
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  placeholder="MM/YY"
                  value={details.cardExpiry}
                  onChange={e => setDetails({ ...details, cardExpiry: e.target.value })}
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-gray-700 mb-1">CVC</label>
                <input
                  type="password"
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-400"
                  value={details.cardCVC}
                  onChange={e => setDetails({ ...details, cardCVC: e.target.value })}
                  required
                />
              </div>
            </div>
          </div>
        )}
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-blue-600 text-white font-bold text-lg shadow-md hover:bg-blue-700 transition-colors duration-200 disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
        {error && <div className="text-red-500 text-center font-semibold mt-2">{error}</div>}
        {result && (
          <div className="mt-4 p-4 rounded-lg bg-gray-100 text-center animate-fade-in">
            <div className="text-lg font-bold mb-2">Payment {result.paymentStatus === 'success' ? 'Successful' : result.paymentStatus === 'pending' ? 'Pending (COD)' : 'Failed'}</div>
            {result.transactionId && <div className="text-gray-700">Transaction ID: <span className="font-mono">{result.transactionId}</span></div>}
            <button
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              onClick={() => navigate('/orders')}
            >Go to Orders</button>
          </div>
        )}
      </form>
      )}
    </div>
  );
};

export default Payment; 