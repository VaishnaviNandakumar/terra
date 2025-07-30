import React, { useCallback, useState } from 'react';
import { Upload, FileWarning, Loader2, Download } from 'lucide-react';
import { apiService } from '../services/api';

interface FileUploaderProps {
  onFilesAdded: (files: File[]) => void;
  isLoading?: boolean;
}

export const FileUploader: React.FC<FileUploaderProps> = ({ onFilesAdded, isLoading = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSamples, setSelectedSamples] = useState<{ csv: boolean; excel: boolean }>({
    csv: false,
    excel: false
  });

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isLoading) setIsDragging(true);
  }, [isLoading]);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const validateFiles = (fileList: FileList | File[]): File[] => {
    const validFiles: File[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    setError(null);
    
    Array.from(fileList).forEach(file => {
      if (file.size > maxSize) {
        setError('One or more files exceed the 10MB limit.');
        return;
      }
      validFiles.push(file);
    });
    return validFiles;
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isLoading) return;

    if (e.dataTransfer.files.length > 0) {
      const validFiles = validateFiles(e.dataTransfer.files);
      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
    }
  }, [onFilesAdded, isLoading]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLoading) return;
    if (e.target.files && e.target.files.length > 0) {
      const validFiles = validateFiles(e.target.files);
      if (validFiles.length > 0) {
        onFilesAdded(validFiles);
      }
      e.target.value = '';
    }
  }, [onFilesAdded, isLoading]);

  const toggleSample = (type: 'csv' | 'excel') => {
    setSelectedSamples(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleSampleUpload = async () => {
    try {
      const filesToFetch: string[] = [];
      if (selectedSamples.csv) filesToFetch.push('csv');
      if (selectedSamples.excel) filesToFetch.push('excel');
      if (filesToFetch.length === 0) {
        setError('Please select at least one sample file.');
        return;
      }
  
      const sampleFiles: File[] = [];
      for (let type of filesToFetch as ('csv' | 'excel')[]) {
        const file = await apiService.fetchSampleFile(type);
        sampleFiles.push(file);
      }
  
      onFilesAdded(sampleFiles);
    } catch (err) {
      console.error(err);
      setError('Failed to load sample files.');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Upload Files</h2>
            <p className="text-sm text-gray-600 mt-1">
              Upload your documents for analysis
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Step 1 of 4
          </div>
        </div>
      </div>

      <div
        className={`p-6 border-2 border-dashed rounded-lg transition-colors ${
          isLoading
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center py-6">
          {isLoading ? (
            <Loader2 className="w-12 h-12 mb-4 text-blue-500 animate-spin" />
          ) : (
            <Upload className={`w-12 h-12 mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
          )}
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isLoading ? 'Uploading files...' : 'Drag and drop your files here'}
          </h3>
          
          <p className="text-sm text-gray-500 mb-4 text-center">
            {isLoading ? (
              'Please wait while we upload your files'
            ) : (
              <>
                or browse from your computer
                <br />
                <span className="text-xs">
                  Supports PDF, CSV, Excel files, and more (max 10MB each)
                </span>
              </>
            )}
          </p>
          
          {!isLoading && (
            <label className="cursor-pointer">
              <span className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
                Select Files
              </span>
              <input
                type="file"
                className="hidden"
                multiple
                onChange={handleFileInput}
              />
            </label>
          )}
          
          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded">
              <FileWarning className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Sample files section */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <h3 className="text-md font-semibold text-gray-800 mb-2">Try with sample files</h3>
        <div className="flex flex-col gap-2 mb-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedSamples.csv}
              onChange={() => toggleSample('csv')}
            />
            Sample CSV
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedSamples.excel}
              onChange={() => toggleSample('excel')}
            />
            Sample Excel <span className="text-xs text-gray-500">(Password: <strong>demo123</strong>)</span>
          </label>
        </div>
        <button
          onClick={handleSampleUpload}
          className="flex items-center gap-2 py-2 px-4 bg-gray-200 rounded hover:bg-gray-300 transition"
        >
          <Download className="w-4 h-4" /> Upload Selected Samples
        </button>
      </div>
    </div>
  );
};
