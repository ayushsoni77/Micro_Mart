import React, { useState } from 'react';
import { 
  Store, 
  Package, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  ArrowRight,
  Star,
  Shield,
  Zap,
  Globe
} from 'lucide-react';

interface SellerWelcomeScreenProps {
  onComplete: () => void;
  sellerName: string;
}

const SellerWelcomeScreen: React.FC<SellerWelcomeScreenProps> = ({ onComplete, sellerName }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: `Welcome to MicroMart, ${sellerName}! 🎉`,
      subtitle: "Your journey to successful online selling starts here",
      description: "We're excited to have you join our marketplace. Let's get you set up with everything you need to start selling your products.",
      icon: <Store className="w-16 h-16 text-blue-600" />,
      features: [
        "Easy product management",
        "Real-time analytics dashboard",
        "Secure payment processing",
        "24/7 customer support"
      ]
    },
    {
      title: "Why Choose MicroMart?",
      subtitle: "Discover what makes us the perfect platform for your business",
      description: "Join thousands of successful sellers who trust MicroMart to grow their online business.",
      icon: <Star className="w-16 h-16 text-yellow-500" />,
      features: [
        "Zero setup fees",
        "Competitive commission rates",
        "Advanced marketing tools",
        "Mobile-friendly interface"
      ]
    },
    {
      title: "Your Dashboard Overview",
      subtitle: "Everything you need to manage your business in one place",
      description: "Your seller dashboard is your command center for managing products, orders, and analytics.",
      icon: <TrendingUp className="w-16 h-16 text-green-600" />,
      features: [
        "Product catalog management",
        "Order tracking & fulfillment",
        "Sales analytics & insights",
        "Customer communication tools"
      ]
    },
    {
      title: "Ready to Get Started?",
      subtitle: "Let's set up your first product and start selling",
      description: "We'll guide you through creating your first product listing and show you around your dashboard.",
      icon: <CheckCircle className="w-16 h-16 text-purple-600" />,
      features: [
        "Step-by-step product creation",
        "Interactive dashboard tour",
        "Best practices guide",
        "Support resources"
      ]
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 text-center">
          <div className="flex justify-center mb-4">
            {steps[currentStep].icon}
          </div>
          <h1 className="text-3xl font-bold mb-2">{steps[currentStep].title}</h1>
          <p className="text-xl opacity-90">{steps[currentStep].subtitle}</p>
        </div>

        {/* Content */}
        <div className="p-8">
          <p className="text-gray-600 text-lg mb-8 text-center leading-relaxed">
            {steps[currentStep].description}
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {steps[currentStep].features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleSkip}
              className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Skip Tour
            </button>
            
            <div className="flex space-x-4">
              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Previous
                </button>
              )}
              
              <button
                onClick={handleNext}
                className="onboarding-next-btn px-8 py-3 rounded-lg transition-all duration-200 flex items-center space-x-2"
              >
                <span>{currentStep === steps.length - 1 ? 'Get Started' : 'Next'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 text-center">
          <div className="flex justify-center space-x-6 text-gray-500">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span className="text-sm">Secure Platform</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span className="text-sm">Fast Setup</span>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span className="text-sm">Global Reach</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerWelcomeScreen; 