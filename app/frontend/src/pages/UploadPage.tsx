import React from 'react';
import { FileUpload } from '../components/FileUpload';
import { ProgressSteps } from '../components/ProgressSteps';
import { AlertCircle, CheckCircle2, ArrowLeft, Edit3, BarChart3 } from 'lucide-react';

interface UploadPageProps {
  state: any;
  setState: React.Dispatch<React.SetStateAction<any>>; 
  onFileSelect: (file: File) => Promise<void>;
  onSampleData: () => Promise<void>;
  onTagMappingUpload: (file: File) => Promise<void>;
  onSampleTagMapping: () => Promise<void>;
  onSkipTagMapping: () => void;
  onEnableAI: (enabled: boolean) => void;
  onBack: () => void;
  navigateToDashboard: (view: 'edit' | 'grafana') => void;
}

export function UploadPage({
  state,
  setState,
  onFileSelect,
  onSampleData,
  onTagMappingUpload,
  onSampleTagMapping,
  onSkipTagMapping,
  onEnableAI,
  onBack,
  navigateToDashboard
}: UploadPageProps) {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <ProgressSteps currentStep={state.currentStep} steps={state.steps} />

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
            <FileUpload onFileSelect={onFileSelect} isUploading={state.isUploading} />
            <div className="text-center">
              <span className="text-gray-500">or</span>
              <button
                onClick={onSampleData}
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
                Upload a CSV file containing your product-to-tag mappings or use our sample mapping.
              </p>
            </div>
            <FileUpload onFileSelect={onTagMappingUpload} isUploading={state.isUploading} accept=".csv" />
            <div className="text-center space-y-4">
              <button
                onClick={onSampleTagMapping}
                disabled={state.isUploading}
                className="text-blue-500 hover:text-blue-700 font-medium"
              >
               Use sample tag mapping
              </button> <br></br>
              <button
                onClick={onSkipTagMapping}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                Skip this step
              </button>
            </div>
          </div>
        )}

        {state.currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
              <div>
                <h3 className="font-medium text-gray-900">AI Categorization</h3>
                <p className="text-sm text-gray-500">Enable AI to automatically categorize your expenses</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={state.enableAI}
                  onChange={(e) => onEnableAI(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <button
              onClick={() => setState((prevState) => ({ 
                ...prevState, 
                currentStep: prevState.currentStep + 1
              }))} 
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
              <h3 className="text-xl font-medium text-gray-900 mb-2">Processing Complete!</h3>
              <p className="text-gray-600 mb-8">Your financial data has been processed successfully.</p>
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
            <button onClick={() => setState((prevState) => ({ 
                ...prevState, 
                currentStep: prevState.currentStep - 1 
              }))}  className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
