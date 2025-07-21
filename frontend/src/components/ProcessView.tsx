import React from 'react';
import { ProgressBar } from './ui/ProgressBar';
import { Loader2 } from 'lucide-react';

interface ProcessViewProps {
  progress: number;
  currentTask: string;
}

export const ProcessView: React.FC<ProcessViewProps> = ({ progress, currentTask }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
      <div className="flex justify-center mb-6">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
      
      <h3 className="text-xl font-medium text-gray-900 mb-6">
        Processing Your Files
      </h3>
      
      <div className="max-w-md mx-auto mb-4">
        <ProgressBar progress={progress} />
      </div>
      
      <div className="min-h-10">
        <p className="text-sm text-gray-600 animate-pulse">
          {currentTask || 'Initializing...'}
        </p>
      </div>
      
      <p className="mt-6 text-gray-500">
        This may take a few moments. Please don't close this window.
      </p>
    </div>
  );
};