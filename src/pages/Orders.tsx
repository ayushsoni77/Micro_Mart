import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { Package, Clock, CheckCircle, Truck, Plus, MapPin, Home, Building, User, ArrowRight, PlusCircle, ShoppingCart } from 'lucide-react';
import axios from 'axios';

interface Order {
  id: number;
  userId: number;
  items: Array<{
    id: number;
    productName: string;
    unitPrice: number;
    totalPrice: number;
    quantity: number;
    productImage?: string;
  }>;
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

interface Address {
  id: number;
  label: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

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

const Orders = () => {
  const { user, token } = useAuth();
  const { items, getTotalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [showAddressSelection, setShowAddressSelection] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [shippingAddress, setShippingAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [user]);

  // Check if user came back from adding an address
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromAddress = urlParams.get('fromAddress');
    if (fromAddress === 'true' && items.length > 0) {
      setShowAddressSelection(true);
      fetchAddresses();
    }
  }, [items]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`http://localhost:3003/api/orders?userId=${user?.id}`);
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    setAddressesLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/api/users/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAddresses(response.data.addresses || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  };

  const handleCreateOrderClick = async () => {
    // First check if user has addresses
    await fetchAddresses();
    
    if (addresses.length === 0) {
      // No addresses - show message to add address first
      setShowAddressSelection(true);
    } else {
      // Has addresses - show address selection
      setShowAddressSelection(true);
    }
  };

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
    setShippingAddress({
      street: address.street,
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
    });
    setShowAddressSelection(false);
    setShowCreateOrder(true);
  };

  const handleAddNewAddress = () => {
    // Navigate to addresses page with return parameter
    navigate('/addresses?returnTo=checkout');
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingOrder(true);
    try {
      const orderData = {
        items: items.map(item => ({
          id: item.productId, // Use productId instead of id
          quantity: item.quantity,
        })),
        shippingAddress,
      };
      const response = await axios.post('http://localhost:3003/api/orders', orderData);
      const createdOrder = response.data.order;
      const paymentMethod = 'UPI'; // Always use Razorpay for payment
      // Retry loop for payment initiation
      let paymentInitiated = false;
      let payRes: any = undefined;
      let attempts = 0;
      while (!paymentInitiated && attempts < 3) {
        try {
          payRes = await axios.post('/payment/initiate', {
            orderId: Number(createdOrder.id),
            paymentMethod
          });
          paymentInitiated = true;
        } catch (err) {
          attempts++;
          await new Promise(res => setTimeout(res, 300)); // wait 300ms before retry
        }
      }
      if (!paymentInitiated || !payRes) {
        alert('Payment initiation failed after several attempts.');
        setIsCreatingOrder(false);
        return;
      }
      if (payRes.data.razorpayOrderId) {
        // Online payment: open Razorpay
        const loaded = await loadRazorpayScript('https://checkout.razorpay.com/v1/checkout.js');
        if (!loaded) throw new Error('Failed to load Razorpay SDK');
        const options = {
          key: 'rzp_test_2JnJUPRtxgUYQx',
          amount: payRes.data.amount,
          currency: 'INR',
          name: 'E-Commerce',
          description: 'Order Payment',
          order_id: payRes.data.razorpayOrderId,
          handler: async function (response: any) {
            // Call backend to confirm payment
            await axios.post('/payment/callback', {
              razorpay_order_id: payRes.data.razorpayOrderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId: String(createdOrder.id),
              userId: String(user?.id)
            });
            alert('Payment successful!');
            navigate('/orders');
          },
          prefill: {
            email: user?.email || '',
          },
          theme: {
            color: '#2563EB',
          },
        };
        // @ts-ignore
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback error
        alert('Payment initiation failed.');
      }
      await clearCart();
      setShowCreateOrder(false);
      setShowAddressSelection(false);
      setSelectedAddress(null);
      setShippingAddress({ street: '', city: '', state: '', zipCode: '' });
      fetchOrders();
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Order or payment failed. Please try again.');
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'processing':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getAddressIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'home':
        return <Home className="w-5 h-5" />;
      case 'work':
        return <Building className="w-5 h-5" />;
      default:
        return <User className="w-5 h-5" />;
    }
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
      <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-dark-grey mb-2">Your Orders</h1>
            <p className="text-grey">Track and manage your orders</p>
          </div>
          {items.length > 0 && (
            <button
              onClick={handleCreateOrderClick}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 transition-all duration-300 flex items-center space-x-2 shadow-lg animate-bounceIn"
              style={{ backgroundColor: '#2563EB' }}
            >
              <Plus className="w-5 h-5" />
              <span>Checkout</span>
            </button>
          )}
        </div>
      </div>

      {/* Address Selection Modal */}
      {showAddressSelection && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fadeInModal">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideUpModal">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Select Shipping Address</h2>
              
              {addressesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : addresses.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 text-blue-200 mx-auto mb-4 animate-float" />
                  <h3 className="text-xl font-bold text-dark-grey mb-2">No Addresses Found</h3>
                  <p className="text-grey mb-6">You need to add a shipping address before placing an order.</p>
                  <div className="flex space-x-3 justify-center">
                    <button
                      onClick={() => setShowAddressSelection(false)}
                      className="px-6 py-3 border border-neutral-300 text-dark-grey rounded-xl hover:bg-neutral-50 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddNewAddress}
                      className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 transition-all duration-300 flex items-center space-x-2 shadow-lg animate-bounceIn"
                      style={{ backgroundColor: '#2563EB' }}
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span>Add Address</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-grey mb-4">Choose a shipping address for your order:</p>
                  
                  {/* Saved Addresses */}
                  <div className="grid gap-4">
                    {addresses.map(address => (
                      <button
                        key={address.id}
                        onClick={() => handleAddressSelect(address)}
                        className="w-full p-4 border-2 border-blue-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all duration-300 text-left animate-slideUp"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              {getAddressIcon(address.label)}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className="font-medium text-dark-grey">{address.label}</h3>
                              <ArrowRight className="w-5 h-5 text-blue-400" />
                            </div>
                            <p className="text-grey text-sm mt-1">{address.street}</p>
                            <p className="text-grey text-sm">
                              {address.city}, {address.state} {address.zipCode}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Add New Address Option */}
                  <div className="border-t pt-4">
                    <button
                      onClick={handleAddNewAddress}
                      className="w-full p-4 border-2 border-dashed border-blue-300 rounded-xl hover:border-blue-500 bg-blue-500 text-white hover:bg-blue-600 transition-all duration-300 flex items-center justify-center space-x-2 animate-bounceIn"
                      style={{ backgroundColor: '#2563EB' }}
                    >
                      <PlusCircle className="w-5 h-5" />
                      <span>Add New Address</span>
                    </button>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      onClick={() => setShowAddressSelection(false)}
                      className="px-6 py-3 border border-neutral-300 text-dark-grey rounded-xl hover:bg-neutral-50 font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 animate-fadeInModal">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slideUpModal">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Order</h2>
              
              {/* Selected Address Display */}
              {selectedAddress && (
                <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      {getAddressIcon(selectedAddress.label)}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{selectedAddress.label}</h3>
                      <p className="text-sm text-gray-600">{selectedAddress.street}</p>
                      <p className="text-sm text-gray-600">
                        {selectedAddress.city}, {selectedAddress.state} {selectedAddress.zipCode}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowCreateOrder(false);
                      setShowAddressSelection(true);
                    }}
                    className="text-primary-600 text-sm font-medium mt-2 hover:text-primary-700"
                  >
                    Change Address
                  </button>
                </div>
              )}
              
              {/* Cart Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
                {items.map(item => (
                  <div key={item.id} className="flex justify-between items-center py-2">
                    <div>
                      <span className="text-gray-900">{item.name}</span>
                      <span className="text-gray-500 ml-2">×{item.quantity}</span>
                    </div>
                    <span className="font-medium">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between items-center font-bold">
                    <span>Total:</span>
                    <span>${getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Manual Address Form (if no address selected) */}
              {!selectedAddress && (
              <form onSubmit={handleCreateOrder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Shipping Address
                  </label>
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={shippingAddress.street}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, street: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-3"
                    required
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={shippingAddress.state}
                      onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                      className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="ZIP Code"
                    value={shippingAddress.zipCode}
                    onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-3"
                    required
                  />
                </div>
                </form>
              )}

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                  onClick={() => {
                    setShowCreateOrder(false);
                    setSelectedAddress(null);
                    setShippingAddress({ street: '', city: '', state: '', zipCode: '' });
                  }}
                  className="flex-1 px-6 py-3 border border-neutral-300 text-dark-grey rounded-xl hover:bg-neutral-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                  onClick={handleCreateOrder}
                  disabled={isCreatingOrder || (!selectedAddress && (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode))}
                  className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 disabled:opacity-50 transition-all duration-300 shadow-lg animate-bounceIn"
                  style={{ backgroundColor: '#2563EB' }}
                  >
                    {isCreatingOrder ? 'Creating...' : 'Place Order'}
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders List */}
      {orders.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {orders.map(order => (
            <div
              key={order.id}
              className="rounded-2xl shadow-xl border border-neutral-200 p-6 bg-white hover:shadow-2xl transition-all duration-300 animate-slideUp"
              style={{ animationDelay: '100ms' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(order.status)}
                  <div>
                    <h3 className="text-lg font-bold text-dark-grey">Order #{order.id}</h3>
                    <p className="text-sm text-grey">
                      Placed on {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right flex flex-col items-end space-y-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <p className="text-lg font-bold text-dark-grey mt-1">
                    ${order.totalAmount.toFixed(2)}
                  </p>
                  <Link
                    to={`/orders/${order.id}`}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-all duration-300 text-sm shadow-md animate-bounceIn"
                    style={{ backgroundColor: '#2563EB' }}
                    onClick={e => e.stopPropagation()}
                  >
                    Details
                  </Link>
                </div>
              </div>

              {/* Order Items */}
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-dark-grey mb-3">Items ({order.items.length})</h4>
                <div className="space-y-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div>
                        <span className="text-dark-grey">{item.productName}</span>
                        <span className="text-grey ml-2">×{item.quantity}</span>
                      </div>
                      <span className="font-medium">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="flex items-start space-x-2 text-sm text-grey">
                <MapPin className="w-4 h-4 mt-0.5 text-blue-400" />
                <div>
                  <p className="font-medium">Shipping Address:</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 p-12 text-center animate-fadeInModal">
          <Package className="w-16 h-16 text-blue-200 mx-auto mb-4 animate-float" />
          <h3 className="text-xl font-bold text-dark-grey mb-2">No orders yet</h3>
          <p className="text-grey mb-6">Start shopping to see your orders here!</p>
          {items.length > 0 && (
            <button
              onClick={handleCreateOrderClick}
              className="bg-blue-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-600 transition-all duration-300 shadow-lg animate-bounceIn"
              style={{ backgroundColor: '#2563EB' }}
            >
              Create Your First Order
            </button>
          )}
        </div>
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInModal {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUpModal {
          from { opacity: 0; transform: translateY(60px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounceIn {
          0% { transform: scale(0.9); opacity: 0.7; }
          60% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.6s ease-out; }
        .animate-slideUp { animation: slideUp 0.6s ease-out forwards; opacity: 0; }
        .animate-fadeInModal { animation: fadeInModal 0.4s ease; }
        .animate-slideUpModal { animation: slideUpModal 0.5s cubic-bezier(0.23, 1, 0.32, 1); }
        .animate-bounceIn { animation: bounceIn 0.5s cubic-bezier(0.23, 1, 0.32, 1); }
        .animate-float { animation: float 3s ease-in-out infinite; }
        @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
      `}</style>
    </div>
  );
};

export default Orders;