import React, { useState, useEffect } from 'react';
import { HomePage } from './components/HomePage';
import { FileAnalyzer } from './components/FileAnalyzer';
import { sessionManager } from './utils/sessionManager';

type AppView = 'home' | 'analyzer';

function App() {
  useEffect(() => {
    // Generate unique session ID when app starts
    const sessionId = sessionManager.generateSessionId();
    console.log('App started with session ID:', sessionId);
  }, []);

  const [currentView, setCurrentView] = useState<AppView>('home');

  const handleGetStarted = () => {
    setCurrentView('analyzer');
  };

  const handleBackToHome = () => {
    setCurrentView('home');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {currentView === 'home' && (
        <HomePage onGetStarted={handleGetStarted} />
      )}
      
      {currentView === 'analyzer' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="mb-6">
            <button
              onClick={handleBackToHome}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to Home
            </button>
          </div>
          <FileAnalyzer />
        </div>
      )}
    </div>
  );
}

export default App;