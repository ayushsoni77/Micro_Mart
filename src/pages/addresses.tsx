import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

interface Address {
  id: number;
  userId: number;
  type: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  phone?: string;
  label?: string;
  createdAt: string;
  updatedAt: string;
}

const Addresses = () => {
  const { user, loading: authLoading, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Address>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if user should return to checkout after adding address
  const shouldReturnToCheckout = new URLSearchParams(location.search).get('returnTo') === 'checkout';

  useEffect(() => {
    if (!authLoading && user) {
      fetchAddresses();
    }
  }, [authLoading, user]);

  const fetchAddresses = async () => {
    setAddressesLoading(true);
    setError(null);
    try {
      console.log('Fetching addresses for user:', user?.id);
      const response = await axios.get('http://localhost:3001/api/users/addresses', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Addresses response:', response.data);
      // Backend returns addresses directly as array, not wrapped in .addresses
      setAddresses(response.data || []);
    } catch (error: any) {
      console.error('Error fetching addresses:', error);
      setError(error.response?.data?.message || 'Failed to fetch addresses');
      setAddresses([]);
    } finally {
      setAddressesLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null); // Clear error when user starts typing
  };

  const handleAddOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('Submitting address data:', formData);
      console.log('User ID:', user?.id);
      console.log('Token:', token);

      if (isEditing && editId !== null) {
        // Edit address
        console.log('Editing address with ID:', editId);
        const response = await axios.put(
          `http://localhost:3001/api/users/addresses/${editId}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Edit response:', response.data);
        setSuccess('Address updated successfully!');
      } else {
        // Add address
        console.log('Adding new address');
        const response = await axios.post(
          'http://localhost:3001/api/users/addresses',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('Add response:', response.data);
        setSuccess('Address added successfully!');
        
        // If user came from checkout, redirect back after a short delay
        if (shouldReturnToCheckout) {
          setTimeout(() => {
            navigate('/orders?fromAddress=true');
          }, 1500);
        }
      }
      
      setShowForm(false);
      setFormData({});
      setIsEditing(false);
      setEditId(null);
      await fetchAddresses();
    } catch (error: any) {
      console.error('Error submitting address:', error);
      console.error('Error response:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to save address. Please try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEdit = (address: Address) => {
    setFormData(address);
    setIsEditing(true);
    setEditId(address.id);
    setShowForm(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await axios.delete(
        `http://localhost:3001/api/users/addresses/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Address deleted successfully!');
      fetchAddresses();
    } catch (error: any) {
      console.error('Error deleting address:', error);
      setError(error.response?.data?.message || 'Failed to delete address');
    }
  };

  const handleBackToCheckout = () => {
    navigate('/orders?fromAddress=true');
  };

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Addresses</h1>
          {shouldReturnToCheckout && (
            <p className="text-gray-600 mt-1">Add an address to continue with your order</p>
          )}
        </div>
        <div className="flex space-x-3">
          {shouldReturnToCheckout && (
            <button
              onClick={handleBackToCheckout}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Back to Checkout
            </button>
          )}
          <button
            onClick={() => { 
              setShowForm(true); 
              setFormData({}); 
              setIsEditing(false); 
              setError(null);
              setSuccess(null);
            }}
            className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-all duration-200 shadow-lg"
          >
            Add Address
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <p className="text-green-700">{success}</p>
          {shouldReturnToCheckout && !isEditing && (
            <p className="text-green-600 text-sm mt-1">Redirecting back to checkout...</p>
          )}
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {addressesLoading ? (
        <div className="flex items-center justify-center min-h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center text-gray-500">
          {shouldReturnToCheckout ? (
            <div className="py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Addresses Found</h3>
              <p className="text-gray-600 mb-6">You need to add a shipping address to complete your order.</p>
              <button
                onClick={() => { 
                  setShowForm(true); 
                  setFormData({}); 
                  setIsEditing(false); 
                  setError(null);
                  setSuccess(null);
                }}
                className="bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-all duration-200"
              >
                Add Your First Address
              </button>
            </div>
          ) : (
            <div className="py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No addresses found</h3>
              <p className="text-gray-600">Add your first address to get started!</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map(address => (
            <div key={address.id} className="bg-white rounded-xl shadow border border-neutral-200 p-6 flex justify-between items-center">
              <div>
                <div className="font-bold text-lg text-gray-900">
                  {address.label || `${address.type.charAt(0).toUpperCase() + address.type.slice(1)} Address`}
                  {address.isDefault && (
                    <span className="ml-2 bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                      Default
                    </span>
                  )}
                </div>
                <div className="text-gray-700">{address.street}</div>
                <div className="text-gray-700">{address.city}, {address.state} {address.zipCode}</div>
                <div className="text-gray-500 text-sm">{address.country}</div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(address)}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-all duration-200 text-sm"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  className="px-4 py-2 bg-danger-500 text-white rounded-lg font-medium hover:bg-danger-600 transition-all duration-200 text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Address Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
            >
              ×
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{isEditing ? 'Edit Address' : 'Add Address'}</h2>
            
            {error && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-lg mb-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}
            
            <form onSubmit={handleAddOrEdit} className="space-y-4">
              <select
                name="type"
                value={formData.type || 'home'}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
              <input
                type="text"
                name="label"
                placeholder="Label (e.g. Home, Work)"
                value={formData.label || ''}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="text"
                name="street"
                placeholder="Street Address"
                value={formData.street || ''}
                onChange={handleFormChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="city"
                  placeholder="City"
                  value={formData.city || ''}
                  onChange={handleFormChange}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  name="state"
                  placeholder="State"
                  value={formData.state || ''}
                  onChange={handleFormChange}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  name="zipCode"
                  placeholder="ZIP Code"
                  value={formData.zipCode || ''}
                  onChange={handleFormChange}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
                <input
                  type="text"
                  name="country"
                  placeholder="Country"
                  value={formData.country || 'India'}
                  onChange={handleFormChange}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 bg-primary-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitLoading ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Address')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Addresses; 