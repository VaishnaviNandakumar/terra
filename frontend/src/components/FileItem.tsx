import React, { useState } from 'react';
import { FileText, FileSpreadsheet, File, X, AlertCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { FileWithStatus } from '../types';

interface FileItemProps {
  file: FileWithStatus;
  onClassificationChange: (id: string, classification: 'credit' | 'debit' | 'unknown') => void;
  onPasswordChange?: (id: string, password: string) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export const FileItem: React.FC<FileItemProps> = ({ 
  file, 
  onClassificationChange, 
  onPasswordChange,
  onRemove,
  disabled = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [passwordInput, setPasswordInput] = useState(file.password || '');

  const handlePasswordChange = (value: string) => {
    setPasswordInput(value);
    if (onPasswordChange) {
      onPasswordChange(file.id, value);
    }
  };

  const getFileIcon = () => {
    switch (file.type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'csv':
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
      case 'unsupported':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const getFileTypeLabel = () => {
    switch (file.type) {
      case 'pdf':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            PDF
          </span>
        );
      case 'csv':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            CSV
          </span>
        );
      case 'excel':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
            Excel
          </span>
        );
      case 'unsupported':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            Unsupported
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            Unknown
          </span>
        );
    }
  };

  return (
    <li className={`px-6 py-4 transition-colors ${disabled ? 'opacity-60' : 'hover:bg-gray-50'}`}>
      <div className="space-y-4">
        {/* File Info Row */}
        <div className="sm:flex sm:items-start sm:justify-between">
          <div className="flex items-start">
            <div className="flex-shrink-0 mt-1">
              {getFileIcon()}
            </div>
            
            <div className="ml-3">
              <div className="flex items-center">
                <h4 className="text-sm font-medium text-gray-900 truncate max-w-xs sm:max-w-sm md:max-w-md">
                  {file.file.name}
                </h4>
                <div className="ml-2 flex items-center space-x-2">
                  {getFileTypeLabel()}
                  {file.is_password_protected && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 flex items-center">
                      <Lock className="w-3 h-3 mr-1" />
                      Protected
                    </span>
                  )}
                </div>
              </div>
              
              <p className="mt-1 text-xs text-gray-500">
                {(file.file.size / 1024).toFixed(1)} KB
              </p>

              {file.error_message && (
                <p className="mt-1 text-xs text-red-600">
                  Error: {file.error_message}
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-4 sm:mt-0 sm:ml-4">
            <button
              type="button"
              onClick={() => onRemove(file.id)}
              className="inline-flex items-center p-1 border border-transparent rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <X className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Remove {file.file.name}</span>
            </button>
          </div>
        </div>

        {/* Password Input Row */}
        {file.is_password_protected && !disabled && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <Lock className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h5 className="text-sm font-medium text-yellow-800 mb-2">
                  Password Required
                </h5>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1 max-w-xs">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      placeholder="Enter file password"
                      className="block w-full px-3 py-2 pr-10 border border-yellow-300 rounded-md shadow-sm placeholder-yellow-500 focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 text-sm bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-yellow-100 rounded-r-md transition-colors z-10"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-yellow-600 hover:text-yellow-800" />
                      ) : (
                        <Eye className="h-4 w-4 text-yellow-600 hover:text-yellow-800" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="mt-2 text-xs text-yellow-700">
                  This file is password protected and requires authentication to process.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Classification Row */}
        {!disabled && file.type !== 'unsupported' && (
          <div className="flex items-center">
            <span className="text-sm font-medium text-gray-700 mr-4">Classification:</span>
            <fieldset className="flex space-x-4">
              <legend className="sr-only">Classification</legend>
              
              <div className="flex items-center">
                <input
                  id={`credit-${file.id}`}
                  name={`classification-${file.id}`}
                  type="radio"
                  checked={file.classification === 'Credit'}
                  onChange={() => onClassificationChange(file.id, 'Credit')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor={`credit-${file.id}`} className="ml-2 text-sm text-gray-700">
                  Credit
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id={`debit-${file.id}`}
                  name={`classification-${file.id}`}
                  type="radio"
                  checked={file.classification === 'Debit'}
                  onChange={() => onClassificationChange(file.id, 'Debit')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor={`debit-${file.id}`} className="ml-2 text-sm text-gray-700">
                  Debit
                </label>
              </div>
            
            </fieldset>
          </div>
        )}
      </div>
    </li>
  );
};