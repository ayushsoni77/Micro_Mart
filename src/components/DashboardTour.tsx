import React, { useState } from 'react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  HelpCircle,
  Package,
  BarChart3,
  ShoppingCart,
  Settings,
  Plus,
  Eye
} from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  content: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  target: string;
}

interface DashboardTourProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const DashboardTour: React.FC<DashboardTourProps> = ({ isVisible, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tourSteps: TourStep[] = [
    {
      id: 'header',
      title: 'Dashboard Header',
      content: 'Welcome to your seller dashboard! This is your command center where you can manage all aspects of your business.',
      position: 'bottom',
      target: '.dashboard-header'
    },
    {
      id: 'stats',
      title: 'Business Overview',
      content: 'Here you can see your key business metrics at a glance - total revenue, orders, and sales performance.',
      position: 'bottom',
      target: '.stats-grid'
    },
    {
      id: 'analytics',
      title: 'Analytics Charts',
      content: 'These charts show your sales trends, top-performing products, and order status distribution in real-time.',
      position: 'top',
      target: '.analytics-section'
    },
    {
      id: 'products',
      title: 'Product Management',
      content: 'Manage your product catalog here. You can add new products, edit existing ones, and track their performance.',
      position: 'top',
      target: '.products-section'
    },
    {
      id: 'add-product',
      title: 'Add New Product',
      content: 'Click this button to add a new product to your catalog. You can upload images, set prices, and manage inventory.',
      position: 'left',
      target: '.add-product-btn'
    },
    {
      id: 'orders',
      title: 'Order Management',
      content: 'Navigate to the Orders section to view and manage incoming orders from customers.',
      position: 'left',
      target: '.orders-link'
    },
    {
      id: 'navigation',
      title: 'Navigation Menu',
      content: 'Use this menu to navigate between different sections of your seller account.',
      position: 'bottom',
      target: '.nav-menu'
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
      <div className="relative max-w-md w-full bg-white rounded-lg shadow-2xl z-60 tour-modal">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-gray-800">Dashboard Tour</span>
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
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {currentTourStep.title}
          </h3>
          <p className="text-gray-600 leading-relaxed mb-4">
            {currentTourStep.content}
          </p>

          {/* Progress */}
          <div className="mb-4">
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

export default DashboardTour; 