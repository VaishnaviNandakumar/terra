import React, { useState } from 'react';
import { FileUploader } from './FileUploader';
import { DetectionView } from './DetectionView';
import { PreviewCarousel } from './PreviewCarousel';
import { ExpenseVisualizationView } from './ExpenseVisualizationView';
import { CompletionView } from './CompletionView';
import { FileWithStatus, AnalysisResult, WorkflowStep, VisualizationConfig } from '../types';
import { apiService } from '../services/api';
import { sessionManager } from '../utils/sessionManager';
import { EditDashboardView } from './EditDashboardView';
import { AnalyticsDashboardView } from './AnalyticsDashboardView';


export const FileAnalyzer: React.FC = () => {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [visualizationConfig, setVisualizationConfig] = useState<VisualizationConfig | null>(null);

  const handleFilesAdded = async (newFiles: File[]) => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Upload files to backend
      const uploadResponse = await apiService.uploadFiles(newFiles);
      
      if (!uploadResponse.success) {
        setError(uploadResponse.error || 'Upload failed');
        return;
      }

      // Create FileWithStatus objects with backend data
      const filesWithStatus = uploadResponse.data!.files.map((backendFile, index) => ({
        file: newFiles[index],
        id: crypto.randomUUID(),
        classification: 'unknown' as const,
        type: getFileType(newFiles[index]),
        file_path: backendFile.file_path,
        backend_filename: backendFile.filename,
        is_password_protected: backendFile.is_password_protected || false,
        password_required: backendFile.password_required || false
      }));
      
      setFiles(filesWithStatus);
      setCurrentStep('detection');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getFileType = (file: File): 'pdf' | 'csv' | 'excel' | 'unsupported' => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'pdf') return 'pdf';
    if (extension === 'csv') return 'csv';
    if (extension === 'xlsx' || extension === 'xls') return 'excel';
    return 'unsupported';
  };

  const handleClassificationChange = (id: string, classification: 'credit' | 'debit' | 'unknown') => {
    setFiles(prev => 
      prev.map(file => 
        file.id === id 
          ? { ...file, classification } 
          : file
      )
    );
  };

  const handlePasswordChange = (id: string, password: string) => {
    setFiles(prev => 
      prev.map(file => 
        file.id === id 
          ? { ...file, password } 
          : file
      )
    );
  };

  const handleRemoveFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
    if (files.length === 1) {
      setCurrentStep('upload');
    }
  };

  const handleProceedToPreview = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Only process supported files
      const supportedFiles = files.filter(f => f.type !== 'unsupported');
      
      if (supportedFiles.length === 0) {
        setError('No supported files to process');
        return;
      }

      // Check if any password-protected files are missing passwords
      const passwordProtectedFiles = supportedFiles.filter(f => f.is_password_protected && !f.password);
      if (passwordProtectedFiles.length > 0) {
        setError('Please provide passwords for all password-protected files');
        return;
      }

      // Prepare files data for backend
      const filesData = supportedFiles.map(file => ({
        filename: file.backend_filename || file.file.name,
        file_path: file.file_path || '',
        classification: file.classification,
        password: file.password || null
      }));

      // Call backend analysis
      const analysisResponse = await apiService.analyzeFiles(filesData);
      
      if (!analysisResponse.success) {
        throw new Error(analysisResponse.error || 'Analysis failed');
      }

      // Update files with preview data
      const updatedFiles = files.map(file => {
        const result = analysisResponse.data!.results.find(r => r.filename === file.backend_filename);
        if (result && result.status === 'success') {
          return {
            ...file,
            preview_data: result.transactions || [],
            total_rows: result.total_transactions || 0
          };
        } else if (result && result.status === 'error') {
          return {
            ...file,
            error_message: result.message
          };
        }
        return file;
      });

      setFiles(updatedFiles);
      setAnalysisResults(analysisResponse.data!.results);
      setCurrentStep('preview');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMergeAll = () => {
    setCurrentStep('completed');
  };

  const handleVisualizeExpenses = () => {
    setCurrentStep('visualization');
  };

  const handleGoToEditDashboard = () => {
    setCurrentStep('edit-dashboard');
  };

  const handleVisualizationProceed = (config: VisualizationConfig) => {
    setVisualizationConfig(config);
    setCurrentStep('edit-dashboard');
  };


  const handleEditDashboardProceed = () => {
    setCurrentStep('grafana');
  };

  const handleReset = () => {
    setFiles([]);
    setCurrentStep('upload');
    setAnalysisResults([]);
    setError(null);
    // Generate new session ID for new workflow
    const newSessionId = sessionManager.resetSession();
    console.log('Workflow reset with new session ID:', newSessionId);
  };

  const handleBackToUpload = () => {
    setCurrentStep('upload');
  };

  const handleBackToDetection = () => {
    setCurrentStep('detection');
  };

  const handleBackToPreview = () => {
    setCurrentStep('preview');
  };

  const handleGoToGrafana = () => {
    setCurrentStep('grafana');
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}
      
      {currentStep === 'upload' && (
        <FileUploader onFilesAdded={handleFilesAdded} isLoading={isLoading} />
      )}
      
      {currentStep === 'detection' && (
        <DetectionView 
          files={files}
          onClassificationChange={handleClassificationChange}
          onPasswordChange={handlePasswordChange}
          onRemoveFile={handleRemoveFile}
          onProceed={handleProceedToPreview}
          onBack={handleBackToUpload}
          isLoading={isLoading}
        />
      )}
      
      {currentStep === 'preview' && (
        <PreviewCarousel 
          files={files}
          onMergeAll={handleMergeAll}
          onVisualizeExpenses={handleVisualizeExpenses}
          onBack={handleBackToDetection}
        />
      )}
      
      {currentStep === 'visualization' && (
      <div>
        <ExpenseVisualizationView 
          onBack={handleBackToPreview}
          onProceed={handleVisualizationProceed}
          files={files}
        />
      </div>
    )}

    {currentStep === 'edit-dashboard' && (
      <div>
        <EditDashboardView 
          onBack={handleVisualizeExpenses}
          onProceed={handleEditDashboardProceed} />
      </div>
    )}

    {currentStep === 'grafana' && (
      <AnalyticsDashboardView
        onBack={handleGoToEditDashboard} 
      />
    )}
      
      {currentStep === 'completed' && (
        <CompletionView 
          onReset={handleReset} 
          results={analysisResults}
        />
      )}
    </div>
  );
};