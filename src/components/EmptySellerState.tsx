import React from 'react';
import { 
  Package, 
  Plus, 
  TrendingUp, 
  ShoppingCart, 
  Star,
  ArrowRight,
  Zap
} from 'lucide-react';

interface EmptySellerStateProps {
  onAddFirstProduct: () => void;
  onSkip: () => void;
}

const EmptySellerState: React.FC<EmptySellerStateProps> = ({ onAddFirstProduct, onSkip }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center">
          <div className="flex justify-center mb-4">
            <Package className="w-20 h-20" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Ready to Start Selling? 🚀</h1>
          <p className="text-xl opacity-90">Your product catalog is empty. Let's add your first product!</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              Welcome to your seller dashboard! You're just one step away from starting your online business. 
              Adding your first product will unlock all the powerful features of your dashboard.
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-blue-50 rounded-lg">
              <div className="flex justify-center mb-4">
                <TrendingUp className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Start Earning</h3>
              <p className="text-gray-600">Begin generating revenue as soon as your first product goes live</p>
            </div>
            
            <div className="text-center p-6 bg-green-50 rounded-lg">
              <div className="flex justify-center mb-4">
                <ShoppingCart className="w-12 h-12 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Reach Customers</h3>
              <p className="text-gray-600">Connect with thousands of potential customers on our platform</p>
            </div>
            
            <div className="text-center p-6 bg-purple-50 rounded-lg">
              <div className="flex justify-center mb-4">
                <Star className="w-12 h-12 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Build Your Brand</h3>
              <p className="text-gray-600">Establish your presence and grow your business reputation</p>
            </div>
          </div>

          {/* Quick Setup Guide */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <Zap className="w-5 h-5 text-yellow-500 mr-2" />
              Quick Setup Guide
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-1">
                  1
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Add Product Details</h4>
                  <p className="text-gray-600 text-sm">Fill in product name, description, and pricing</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-1">
                  2
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Upload Images</h4>
                  <p className="text-gray-600 text-sm">Add high-quality photos to attract customers</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-1">
                  3
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Set Inventory</h4>
                  <p className="text-gray-600 text-sm">Specify stock quantity and availability</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-1">
                  4
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800">Go Live</h4>
                  <p className="text-gray-600 text-sm">Publish and start receiving orders</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <button
              onClick={onAddFirstProduct}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2 text-lg font-semibold shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span>Add My First Product</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={onSkip}
              className="px-8 py-4 text-gray-600 hover:text-gray-800 transition-colors text-lg"
            >
              I'll do this later
            </button>
          </div>

          {/* Tips */}
          <div className="mt-8 text-center">
            <p className="text-gray-500 text-sm">
              💡 <strong>Tip:</strong> Products with clear images and detailed descriptions perform better!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 text-center">
          <div className="flex justify-center space-x-6 text-gray-500">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span className="text-sm">Easy Product Setup</span>
            </div>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Instant Analytics</span>
            </div>
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm">Order Management</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmptySellerState; 