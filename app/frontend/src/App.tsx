import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { NavigationHeader } from './components/NavigationHeader';
import { EditDashboard } from './pages/EditDashboard';
import { UploadPage } from './pages/UploadPage';
import { WelcomePage } from './pages/WelcomePage';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard';
import { uploadFile, loadSampleData, generateRandomUsername, uploadTagMapping } from './api';
import type { UploadState } from './types';

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
        processingComplete: true
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
      const response = await loadSampleData();
      setState(prev => ({
        ...prev,
        currentStep: 2,
        success: 'Sample data loaded successfully!',
        isUploading: false,
        processingComplete: true
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

  const handleSampleTagMapping = async () => {
    setState(prev => ({ ...prev, isUploading: true, error: null }));
    try {
      await loadSampleData();
      setState(prev => ({
        ...prev,
        success: 'Sample tag mapping loaded!',
        isUploading: false,
        currentStep: prev.currentStep + 1
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to load sample tag mapping',
        isUploading: false,
      }));
    }
  };

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
      window.location.href = `${API_BASE_URL}/expenses?sessionId=${state.sessionId}`;
    }
  };
  
  // Protected Route wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!state.sessionId) {
      return <Navigate to="/" replace />;
    }
    return <>{children}</>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationHeader 
        sessionId={state.sessionId} 
        username={state.username}
      />
      
      <main className="pt-4">
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
                  onEnableAI={(enabled) => setState(prev => ({ ...prev, enableAI: enabled }))}
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
  );
}

export default App;