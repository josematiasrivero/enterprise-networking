"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Navigation } from "@/components/navigation";
import { Button, Card } from "@/lib/ui";
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  Bell,
  Sparkles
} from "lucide-react";

export default function ToastDemo() {
  const [isLoading, setIsLoading] = useState(false);

  const showSuccess = () => {
    toast.success("Success! Your action was completed successfully.");
  };

  const showError = () => {
    toast.error("Error! Something went wrong. Please try again.");
  };

  const showWarning = () => {
    toast("Warning! Please review your input before continuing.", {
      icon: "⚠️",
      duration: 4000,
    });
  };

  const showInfo = () => {
    toast("Info: Here's some helpful information for you.", {
      icon: "ℹ️",
      duration: 3000,
    });
  };

  const showLoadingToast = () => {
    setIsLoading(true);
    const toastId = toast.loading("Processing your request...");
    
    setTimeout(() => {
      toast.success("Request completed successfully!", { id: toastId });
      setIsLoading(false);
    }, 3000);
  };

  const showCustomToast = () => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Custom Toast
              </p>
              <p className="mt-1 text-sm text-gray-500">
                This is a completely custom toast with your own styling!
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-blue-600 hover:text-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    ), { duration: 6000 });
  };

  const showPromiseToast = () => {
    const myPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.5) {
          resolve({ name: 'Data' });
        } else {
          reject(new Error('Failed to fetch'));
        }
      }, 2000);
    });

    toast.promise(
      myPromise,
      {
        loading: 'Fetching data...',
        success: (data: any) => `Successfully loaded ${data.name}!`,
        error: 'Failed to fetch data',
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation user={null} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto">
              <Bell className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-gray-900">Toast Notifications</h1>
              <p className="text-xl text-gray-600">
                Test different types of toast notifications and their interactions
              </p>
            </div>
          </div>

          {/* Basic Toasts */}
          <Card>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Basic Toast Types</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button onClick={showSuccess} className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Success</span>
              </Button>
              
              <Button 
                onClick={showError} 
                variant="danger"
                className="flex items-center space-x-2"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Error</span>
              </Button>
              
              <Button 
                onClick={showWarning} 
                variant="secondary"
                className="flex items-center space-x-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Warning</span>
              </Button>
              
              <Button 
                onClick={showInfo} 
                variant="ghost"
                className="flex items-center space-x-2"
              >
                <Info className="w-4 h-4" />
                <span>Info</span>
              </Button>
            </div>
          </Card>

          {/* Advanced Toasts */}
          <Card>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Advanced Toast Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Button 
                onClick={showLoadingToast} 
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <span>{isLoading ? "Loading..." : "Loading Toast"}</span>
              </Button>
              
              <Button 
                onClick={showCustomToast} 
                variant="secondary"
                className="flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Custom Toast</span>
              </Button>
              
              <Button 
                onClick={showPromiseToast} 
                variant="ghost"
                className="flex items-center space-x-2"
              >
                <span>Promise Toast</span>
              </Button>
            </div>
          </Card>

          {/* Features Overview */}
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Toast Features</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Automatic dismissal with customizable duration</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Multiple toast types (success, error, warning, info)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Loading states with promise integration</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Fully customizable styling and positioning</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Smooth animations and transitions</span>
                </li>
              </ul>
            </Card>

            <Card>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Implementation Notes</h3>
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900">Toast Provider</h4>
                  <p>Configured in the root layout with react-hot-toast</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Usage</h4>
                  <code className="block bg-gray-100 p-2 rounded mt-1 text-xs">
                    import toast from 'react-hot-toast';<br/>
                    toast.success('Success message');
                  </code>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Styling</h4>
                  <p>Integrated with Tailwind CSS design system</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <Card className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap justify-center gap-4">
              <Button onClick={() => toast.dismiss()}>
                Dismiss All Toasts
              </Button>
              <Button variant="ghost">
                <a href="/login" className="flex items-center space-x-2">
                  <span>Go to Login</span>
                </a>
              </Button>
              <Button variant="ghost">
                <a href="/" className="flex items-center space-x-2">
                  <span>Back to Home</span>
                </a>
              </Button>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
} 