import React from 'react';
import { Button } from './ui/Button';
import { FileItem } from './FileItem';
import { ArrowLeft, ArrowRight, AlertTriangle } from 'lucide-react';
import { FileWithStatus } from '../types';

interface DetectionViewProps {
  files: FileWithStatus[];
  onClassificationChange: (id: string, classification: 'credit' | 'debit' | 'unknown') => void;
  onPasswordChange: (id: string, password: string) => void;
  onRemoveFile: (id: string) => void;
  onProceed: () => void;
  onBack: () => void;
  isLoading: boolean;
}

export const DetectionView: React.FC<DetectionViewProps> = ({
  files,
  onClassificationChange,
  onPasswordChange,
  onRemoveFile,
  onProceed,
  onBack,
  isLoading
}) => {
  const supportedFiles = files.filter(f => f.type !== 'unsupported');
  const unsupportedFiles = files.filter(f => f.type === 'unsupported');
  const passwordProtectedFiles = supportedFiles.filter(f => f.is_password_protected);
  const missingPasswords = passwordProtectedFiles.filter(f => !f.password);
  
  const canProceed = supportedFiles.length > 0 && missingPasswords.length === 0 && !isLoading;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">File Detection & Classification</h2>
            <p className="text-sm text-gray-600 mt-1">
              Review detected file types, provide passwords if needed, and classify your documents
            </p>
          </div>
          <div className="text-sm text-gray-500">
            Step 2 of 4
          </div>
        </div>

        {/* Password Protected Files Warning */}
        {passwordProtectedFiles.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-blue-800">Password Protected Files Detected</h3>
                <p className="text-sm text-blue-700 mt-1">
                  {passwordProtectedFiles.length} file(s) require passwords to be processed. Please provide the passwords below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Unsupported Files Warning */}
        {unsupportedFiles.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-amber-800">Unsupported Files Detected</h3>
                <p className="text-sm text-amber-700 mt-1">
                  The following files cannot be processed and will be skipped:
                </p>
                <ul className="mt-2 text-sm text-amber-700">
                  {unsupportedFiles.map(file => (
                    <li key={file.id} className="flex items-center">
                      <span className="w-2 h-2 bg-amber-400 rounded-full mr-2"></span>
                      {file.file.name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Supported Files */}
        {supportedFiles.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Supported Files ({supportedFiles.length})
            </h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {supportedFiles.map(file => (
                  <FileItem
                    key={file.id}
                    file={file}
                    onClassificationChange={onClassificationChange}
                    onPasswordChange={onPasswordChange}
                    onRemove={onRemoveFile}
                  />
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Unsupported Files List */}
        {unsupportedFiles.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Unsupported Files ({unsupportedFiles.length})
            </h3>
            <div className="bg-red-50 rounded-lg overflow-hidden">
              <ul className="divide-y divide-red-100">
                {unsupportedFiles.map(file => (
                  <FileItem
                    key={file.id}
                    file={file}
                    onClassificationChange={onClassificationChange}
                    onPasswordChange={onPasswordChange}
                    onRemove={onRemoveFile}
                    disabled
                  />
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-6 border-t border-gray-200">
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Upload
          </Button>
          
          <Button 
            onClick={onProceed}
            disabled={!canProceed}
          >
            {isLoading ? (
              <>Processing Files...</>
            ) : (
              <>
                Analyze Files
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};