import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  HelpCircle,
  ShoppingCart,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface OrdersTourStep {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
}

interface OrdersTourProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const OrdersTour: React.FC<OrdersTourProps> = ({ isVisible, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tourSteps: OrdersTourStep[] = [
    {
      id: 'overview',
      title: 'Orders Overview',
      content: 'Welcome to your Orders Management section! Here you can view and manage all incoming orders from customers. This is where you\'ll track order status, process payments, and handle fulfillment.',
      icon: <ShoppingCart className="w-8 h-8 text-blue-600" />
    },
    {
      id: 'order-status',
      title: 'Order Status Tracking',
      content: 'Each order has a status that helps you track its progress: Pending (awaiting payment), Processing (payment confirmed), Shipped (in transit), Delivered (completed), or Cancelled.',
      icon: <Package className="w-8 h-8 text-green-600" />
    },
    {
      id: 'order-details',
      title: 'Order Details',
      content: 'Click on any order to view detailed information including customer details, shipping address, payment status, and order items. You can also update order status and add tracking information.',
      icon: <Truck className="w-8 h-8 text-purple-600" />
    },
    {
      id: 'filters',
      title: 'Filtering & Search',
      content: 'Use the filters to quickly find specific orders by status, date range, or customer. The search function helps you locate orders by order number or customer name.',
      icon: <CheckCircle className="w-8 h-8 text-orange-600" />
    },
    {
      id: 'actions',
      title: 'Order Actions',
      content: 'For each order, you can: Update status, Add tracking info, Contact customer, Process refunds, and Download invoices. These actions help you provide excellent customer service.',
      icon: <Clock className="w-8 h-8 text-red-600" />
    },
    {
      id: 'notifications',
      title: 'Order Notifications',
      content: 'You\'ll receive real-time notifications for new orders, payment confirmations, and customer messages. Stay on top of your business with instant updates.',
      icon: <AlertTriangle className="w-8 h-8 text-yellow-600" />
    }
  ];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isVisible) return null;

  const currentTourStep = tourSteps[currentStep];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 tour-overlay">
      <div className="max-w-lg w-full bg-white rounded-lg shadow-2xl z-60 tour-modal">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-800">Orders Management Tour</span>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-4">
            {currentTourStep.icon}
            <h3 className="text-lg font-semibold text-gray-800">
              {currentTourStep.title}
            </h3>
          </div>
          
          <p className="text-gray-600 leading-relaxed mb-6">
            {currentTourStep.content}
          </p>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>Step {currentStep + 1} of {tourSteps.length}</span>
              <span>{Math.round(((currentStep + 1) / tourSteps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              Skip Tour
            </button>
            
            <div className="flex space-x-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrevious}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center space-x-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="onboarding-next-btn px-4 py-2 rounded-lg transition-colors flex items-center space-x-1"
              >
                <span>{currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersTour; 