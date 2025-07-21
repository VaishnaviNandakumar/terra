import React from 'react';
import { FileItem } from './FileItem';
import { FileWithStatus } from '../types';

interface FileListProps {
  files: FileWithStatus[];
  onClassificationChange: (id: string, classification: 'credit' | 'debit' | 'unknown') => void;
  onRemoveFile: (id: string) => void;
}

export const FileList: React.FC<FileListProps> = ({ 
  files, 
  onClassificationChange, 
  onRemoveFile 
}) => {
  if (files.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Uploaded Files ({files.length})
        </h3>
      </div>
      
      <ul className="divide-y divide-gray-200">
        {files.map(file => (
          <FileItem
            key={file.id}
            file={file}
            onClassificationChange={onClassificationChange}
            onRemove={onRemoveFile}
          />
        ))}
      </ul>
    </div>
  );
};