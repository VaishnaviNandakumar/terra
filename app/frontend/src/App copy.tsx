In the following code snippet, the section under Process Data is stuck. What is causing this - import React, { useState, useCallback, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Sparkles, ArrowRight, ArrowLeft, BarChart3, Edit3, Upload } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { ProgressSteps } from './components/ProgressSteps';
import { uploadFile, loadSampleData, generateRandomUsername, uploadTagMapping, loadSampleTagMapping } from './api';
import type { UploadState } from './types';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { EditDashboard } from './pages/EditDashboard';

const API_BASE_URL = 'http://127.0.0.1:5000';

const STEPS = [
  'Upload Statement',
  'Upload Tag Mapping',
  'Configure Options',
  'Process Data',
  'Complete'
];

function App() {
  const navigate = useNavigate();
  const [state, setState] = useState<UploadState>({
    currentStep: 0,
    sessionId: null,
    enableAI: false,
    isUploading: false,
    error: null,
    success: null,
    username: '',
    showUploadSection: false,
    processingComplete: false
  });

  useEffect(() => {
    if (state.currentStep === 3 && state.processingComplete) {
      const timer = setTimeout(() => {
        setState(prev => ({
          ...prev,
          currentStep: 4,
          success: 'Processing complete!'
        }));
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [state.currentStep, state.processingComplete]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!state.sessionId) {
      setState(prev => ({
        ...prev,
        error: 'No active session. Please try again.',
      }));
      return;
    }

    setState(prev => ({ ...prev, isUploading: true, error: null }));
    
    try {
      const response = await uploadFile(file, state.enableAI, state.sessionId);
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        success: 'File uploaded successfully!',
        isUploading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Upload failed',
        isUploading: false,
      }));
    }
  }, [state.enableAI, state.sessionId]);

  const handleTagMappingUpload = useCallback(async (file: File) => {
    if (!state.sessionId) {
      setState(prev => ({
        ...prev,
        error: 'No active session. Please try again.',
      }));
      return;
    }

    setState(prev => ({ ...prev, isUploading: true, error: null }));
    
    try {
      const response = await uploadTagMapping(file, state.sessionId);
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        success: 'Tag mapping uploaded successfully!',
        isUploading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Tag mapping upload failed',
        isUploading: false,
      }));
    }
  }, [state.sessionId]);

  const handleSampleData = useCallback(async () => {
    if (!state.sessionId) {
      setState(prev => ({
        ...prev,
        error: 'No active session. Please try again.',
      }));
      return;
    }

    setState(prev => ({ ...prev, isUploading: true, error: null }));
    
    try {
      const response = await loadSampleData();
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        success: 'Sample data loaded successfully!',
        isUploading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load sample data',
        isUploading: false
      }));
    }
  }, [state.sessionId]);

  const handleSampleTagMapping = useCallback(async () => {
    if (!state.sessionId) {
      setState(prev => ({
        ...prev,
        error: 'No active session. Please try again.',
      }));
      return;
    }

    setState(prev => ({ ...prev, isUploading: true, error: null }));
    
    try {
      const response = await loadSampleTagMapping(state.sessionId);
      setState(prev => ({
        ...prev,
        currentStep: prev.currentStep + 1,
        success: 'Sample tag mapping loaded successfully!',
        isUploading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load sample tag mapping',
        isUploading: false
      }));
    }
  }, [state.sessionId]);

  const handleSkipTagMapping = () => {
    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1,
      success: null,
      error: null
    }));
  };

  const handleUsernameGenerate = () => {
    const username = generateRandomUsername();
    setState(prev => ({ ...prev, username }));
  };

  const handleGetStarted = async () => {
    if (!state.username.trim()) {
      setState(prev => ({ 
        ...prev, 
        error: 'Please enter a username first!' 
      }));
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: state.username }),
      });

      if (!response.ok) {
        throw new Error('Failed to create session');
      }

      const data = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        showUploadSection: true,
        sessionId: data.sessionId,
        error: null 
      }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to create session. Please try again.' 
      }));
    }
  };

  const handleBack = () => {
    if (state.currentStep > 0) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1, error: null, success: null }));
    } else if (state.showUploadSection) {
      setState(prev => ({ 
        ...prev, 
        showUploadSection: false, 
        sessionId: null,
        error: null, 
        success: null 
      }));
    }
  };

  const navigateToDashboard = (type: 'edit' | 'grafana') => {
    if (type === 'edit') {
      navigate(`/edit?sessionId=${state.sessionId}`);
    } else {
      window.location.href = `${API_BASE_URL}/expenses?sessionId=${state.sessionId}`;
    }
  };

  const renderWelcomePage = () => (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
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
          {state.error && (
            <div className="mb-6 p-4 bg-red-50 rounded-md flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              {state.error}
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
                  value={state.username}
                  onChange={(e) => setState(prev => ({ ...prev, username: e.target.value }))}
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="e.g., ExpenseNinja42"
                />
                <button
                  onClick={handleUsernameGenerate}
                  className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  title="Generate a random ninja name"
                >
                  <Sparkles className="w-5 h-5" />
                </button>
              </div>
            </div>

            <button
              onClick={handleGetStarted}
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

  const renderUploadSection = () => (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome, {state.username}!
          </h1>
          <p className="text-gray-600">
            Upload your financial statements and let us help you track your expenses
          </p>
        </div>

        <ProgressSteps currentStep={state.currentStep} steps={STEPS} />

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          {state.error && (
            <div className="mb-4 p-4 bg-red-50 rounded-md flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              {state.error}
            </div>
          )}

          {state.success && (
            <div className="mb-4 p-4 bg-green-50 rounded-md flex items-center text-green-700">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {state.success}
            </div>
          )}

          {state.currentStep === 0 && (
            <div className="space-y-6">
              <FileUpload
                onFileSelect={handleFileSelect}
                isUploading={state.isUploading}
              />
              
              <div className="text-center">
                <span className="text-gray-500">or</span>
                <button
                  onClick={handleSampleData}
                  disabled={state.isUploading}
                  className="ml-2 text-blue-500 hover:text-blue-700 font-medium"
                >
                  try with sample data
                </button>
              </div>
            </div>
          )}

          {state.currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Upload Product Tag Mapping</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Upload a CSV file containing your product to tag mappings or use our sample mapping
                </p>
              </div>

              <FileUpload
                onFileSelect={handleTagMappingUpload}
                isUploading={state.isUploading}
                accept=".csv"
              />
              
              <div className="text-center space-y-4">
                <div>
                  <span className="text-gray-500">or</span>
                  <button
                    onClick={handleSampleTagMapping}
                    disabled={state.isUploading}
                    className="ml-2 text-blue-500 hover:text-blue-700 font-medium"
                  >
                    use sample tag mapping
                  </button>
                </div>
                
                <div>
                  <button
                    onClick={handleSkipTagMapping}
                    className="text-gray-500 hover:text-gray-700 text-sm"
                  >
                    Skip this step
                  </button>
                </div>
              </div>

              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <h4 className="text-sm font-medium text-blue-900 mb-2">CSV Format:</h4>
                <p className="text-sm text-blue-700">
                  Your CSV should have two columns: 'product' and 'tag'
                  <br />
                  Example: "Amazon Prime", "Subscription"
                </p>
              </div>
            </div>
          )}

          {state.currentStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
                <div>
                  <h3 className="font-medium text-gray-900">AI Categorization</h3>
                  <p className="text-sm text-gray-500">
                    Enable AI to automatically categorize your expenses
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={state.enableAI}
                    onChange={(e) =>
                      setState(prev => ({ ...prev, enableAI: e.target.checked }))
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <button
                onClick={() =>
                  setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }))
                }
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Continue
              </button>
            </div>
          )}

          {state.currentStep === 3 && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Processing your data...</p>
            </div>
          )}

          {state.currentStep === 4 && (
            <div className="space-y-8">
              <div className="text-center">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4 fill-current" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">
                  Processing Complete!
                </h3>
                <p className="text-gray-600 mb-8">
                  Your financial data has been processed successfully. Choose how you'd like to view your data:
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigateToDashboard('edit')}
                  className="flex items-center justify-center gap-3 p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <Edit3 className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900 group-hover:text-blue-600">Edit Transactions</h4>
                    <p className="text-sm text-gray-500">Review and modify transaction tags</p>
                  </div>
                </button>

                <button
                  onClick={() => navigateToDashboard('grafana')}
                  className="flex items-center justify-center gap-3 p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all group"
                >
                  <BarChart3 className="w-6 h-6 text-gray-400 group-hover:text-blue-500" />
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900 group-hover:text-blue-600">Analytics Dashboard</h4>
                    <p className="text-sm text-gray-500">View detailed expense analytics</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {(state.currentStep > 0 || state.showUploadSection) && (
            <div className="mt-6 flex justify-start">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <Routes>
      <Route path="/edit" element={<EditDashboard />} />
      <Route
        path="/"
        element={!state.showUploadSection ? renderWelcomePage() : renderUploadSection()}
      />
    </Routes>
  );
}

export default App;