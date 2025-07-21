import React from 'react';
import { FileText } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="mb-8 md:mb-12">
      <div className="flex items-center gap-3 mb-2">
        <FileText className="h-8 w-8 text-blue-600" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">PDF Analysis Tool</h1>
      </div>
      <h2 className="text-lg md:text-xl font-medium text-gray-700 mb-2">
        Upload, classify, and process your documents
      </h2>
      <p className="text-gray-600 max-w-3xl">
        Upload your PDF, CSV, or Excel files for analysis. Classify each document as Credit, Debit, or Unknown, 
        then proceed with processing to extract the data you need.
      </p>
    </header>
  );
};