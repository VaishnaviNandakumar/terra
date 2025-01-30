import React from 'react';
import { AlertCircle, Sparkles, ArrowRight } from 'lucide-react';

interface WelcomePageProps {
  username: string;
  error: string | null;
  onUsernameChange: (username: string) => void;
  onUsernameGenerate: () => void;
  onGetStarted: () => void;
}

export function WelcomePage({
  username,
  error,
  onUsernameChange,
  onUsernameGenerate,
  onGetStarted
}: WelcomePageProps) {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto pt-20 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Track Your Expenses
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            Simplify your financial journey with our intelligent expense tracking system.
            Upload your statements and let us do the heavy lifting.
          </p>
        </div>

        <div className="max-w-md mx-auto bg-white rounded-xl shadow-sm p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 rounded-md flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          <div className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Choose your ExpenseNinja name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => onUsernameChange(e.target.value)}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., ExpenseNinja42"
                />
                <button
                  onClick={onUsernameGenerate}
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  title="Generate a random ninja name"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              </div>
            </div>

            <button
              onClick={onGetStarted}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}