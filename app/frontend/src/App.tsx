import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { NavigationHeader } from './components/NavigationHeader';
import { EditDashboard } from './pages/EditDashboard';
import { UploadPage } from './pages/UploadPage';
import { WelcomePage } from './pages/WelcomePage';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { uploadFile, loadSampleData, loadSampleTagData, generateRandomUsername, uploadTagMapping } from './api';
import type { UploadState } from './types';
import { environment } from './config/environment';
import ErrorBoundary from './components/ErrorBoundary';


const API_BASE_URL = environment.API_BASE_URL + '/api';

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
    showUploadSection: false
  });

  // Add console log to debug API URL
  console.log('Using API URL:', API_BASE_URL);

  const checkUsernameExists = async (username: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/check_username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to check username');
      }
      
      const data = await response.json();
      return data.exists;
    } catch (error) {
      console.error(error);
      return false;
    }
  };

  const handleUsernameGenerate = () => {
    const username = generateRandomUsername();
    setState(prev => ({ ...prev, username }));
  };

  const handleGetStarted = async () => {
    if (!state.username.trim()) {
      setState(prev => ({ ...prev, error: 'Please enter a username first!' }));
      return;
    }

    const usernameExists = await checkUsernameExists(state.username);
    if (usernameExists) {
      setState(prev => ({ ...prev, error: 'Username already exists.' }));
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
      setState(prev => ({ ...prev, showUploadSection: true, sessionId: data.sessionId, error: null }));
      navigate('/upload');
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to create session. Please try again.' }));
    }
  };

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
        currentStep: 1,
        success: 'File uploaded successfully!',
        isUploading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Upload failed',
        isUploading: false,
      }));
    }
  }, [state.enableAI, state.sessionId]);

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
      const response = await loadSampleData(state.sessionId);
      setState(prev => ({
        ...prev,
        currentStep: 1,
        success: 'Sample data loaded successfully!',
        isUploading: false
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load sample data',
        isUploading: false,
      }));
    }
  }, [state.sessionId]);

  const handleBack = () => {
    navigate(-1);
  };

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
        isUploading: false,
        processingComplete: true
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Tag mapping upload failed',
        isUploading: false,
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
      const response = await loadSampleTagData(state.sessionId);
      setState(prev => ({
        ...prev,
        success: 'Sample tag mapping loaded!',
        isUploading: false,
        currentStep: prev.currentStep + 1,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load sample tag mapping',
        isUploading: false,
      }));
    }
  }, [state.sessionId]);

  const handleSkipTagMapping = () => {
    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1
    }));
  };

  const navigateToDashboard = (type: 'edit' | 'grafana') => {
    if (type === 'edit') {
      navigate(`/edit?sessionId=${state.sessionId}`);
    } else {
      navigate(`/dashboard`);
    }
  };
  
  const triggerPopulateExpenseData = async (sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/populate-expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (data.status === "completed") {
        setState(prev => ({
          ...prev,
          currentStep: prev.currentStep + 1, // Go to next step after completion
          success: "Processing complete!",
        }));
      }

      if (!response.ok) throw new Error('Failed to trigger expense data population');
    } catch (error) {
      console.error('Error triggering expense data:', error);
      setState(prev => ({ ...prev, error: 'Failed to process expense data' }));
    }
  };

  const handleStepChange = async () => {
    if (state.currentStep === 2 ) {
      // Assuming AI Categorization is successful or being skipped
      setState(prev => ({ ...prev, currentStep: 3 }));
    }

    if (state.currentStep === 3 && state.sessionId) {
      // Trigger expense population when reaching step 3
      await triggerPopulateExpenseData(state.sessionId);
    }
  };

  useEffect(() => {
    // Trigger step change logic automatically when the currentStep changes
    if (state.currentStep === 3) {
      handleStepChange();
    }
  }, [state.currentStep, state.sessionId]); // Ensure the effect runs on sessionId change


  const handleEnableAI = async (enabled: boolean) => {
    setState((prev) => ({ ...prev, enableAI: enabled })); // Update state
  
    try {
      const response = await fetch(`${API_BASE_URL}/ai-trigger`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: state.sessionId,  // Ensure sessionId is present in state
          enableAI: enabled,
        }),
      });
  
      if (!response.ok) {
        console.error('Failed to trigger AI');
      }
    } catch (error) {
      console.error('Error triggering AI:', error);
    }
  };
  
  // Protected Route wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!state.sessionId) {
      return <Navigate to="/" replace />;
    }
    return <div className="bg-[#000000]">{children}</div>;
  };

  useEffect(() => {
    const testAPI = async () => {
      try {
        console.log('Attempting to connect to:', API_BASE_URL);
        
        const response = await fetch(`${API_BASE_URL}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          credentials: 'include'
        });
        
        console.log('API Response Status:', response.status);
        const data = await response.text();
        console.log('API Response Data:', data);
      } catch (error) {
        console.error('API Test Error Details:', {
          message: error.message,
          error: error,
          apiUrl: API_BASE_URL
        });
      }
    };
    
    testAPI();
  }, []);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-[#000000]">
        <NavigationHeader 
          sessionId={state.sessionId} 
          username={state.username}
        />
        
        <main className="pt-4 bg-[#000000] text-white">
          <Routes>
            <Route 
              path="/" 
              element={
                <WelcomePage
                  username={state.username}
                  error={state.error}
                  onUsernameChange={(username) => setState(prev => ({ ...prev, username }))}
                  onUsernameGenerate={handleUsernameGenerate}
                  onGetStarted={handleGetStarted}
                />
              } 
            />
            
            <Route 
              path="/upload" 
              element={
                <ProtectedRoute>
                  <UploadPage
                    state={{ ...state, steps: STEPS }}
                    setState={setState}
                    onFileSelect={handleFileSelect}
                    onSampleData={handleSampleData}
                    onTagMappingUpload={handleTagMappingUpload}
                    onSampleTagMapping={handleSampleTagMapping}
                    onSkipTagMapping={handleSkipTagMapping}
                    onEnableAI={handleEnableAI}                  
                    onBack={handleBack}
                    navigateToDashboard={navigateToDashboard}
                  />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/edit" 
              element={
                <ProtectedRoute>
                  <EditDashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <AnalyticsDashboard sessionId={state.sessionId} />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </ErrorBoundary>
  );
}

export default App;
