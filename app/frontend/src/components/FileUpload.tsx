import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isUploading: boolean;
}

export function FileUpload({ onFileSelect, isUploading }: FileUploadProps) {
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  return (
    <div
      className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        type="file"
        id="fileInput"
        className="hidden"
        onChange={handleFileInput}
        accept=".csv"
        disabled={isUploading}
      />
      <label
        htmlFor="fileInput"
        className="cursor-pointer flex flex-col items-center justify-center space-y-4"
      >
        <Upload className="w-12 h-12 text-gray-400" />
        <div className="text-lg font-medium text-gray-700">
          {isUploading ? (
            'Uploading...'
          ) : (
            <>
              Drag and drop your CSV file here <br />
              <span className="text-sm text-gray-500">or click to browse</span>
            </>
          )}
        </div>
      </label>
    </div>
  );
}