import React, { useState } from 'react';
import { Button } from './ui/Button';
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { FileWithStatus } from '../types';

// Define the expected header order to match backend processing
const EXPECTED_HEADER_ORDER = [
  "Date",
  "Narration", 
  "Chq/Ref No",
  "Value Date",
  "Debit Amount",
  "Credit Amount",
  "Closing Balance"
];

interface PreviewCarouselProps {
  files: FileWithStatus[];
  onMergeAll: () => void;
  onVisualizeExpenses?: () => void;
  onBack: () => void;
}

const ROWS_PER_PAGE = 10;

export const PreviewCarousel: React.FC<PreviewCarouselProps> = ({
  files,
  onMergeAll,
  onVisualizeExpenses,
  onBack
}) => {
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter files that have preview data
  const filesWithData = files.filter(file => file.preview_data && file.preview_data.length > 0);
  
  if (filesWithData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No files with data to preview</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Detection
        </Button>
      </div>
    );
  }

  const currentFile = filesWithData[currentFileIndex];
  const data = currentFile.preview_data || [];
  
  // Get headers in the expected order, then add any additional columns
  const getOrderedHeaders = () => {
    if (data.length === 0) return [];
    
    const availableHeaders = Object.keys(data[0]);
    
    // Start with expected headers that exist in the data
    const orderedHeaders = EXPECTED_HEADER_ORDER.filter(header => 
      availableHeaders.includes(header)
    );
    
    // Add any additional headers not in the expected order
    const additionalHeaders = availableHeaders.filter(header => 
      !EXPECTED_HEADER_ORDER.includes(header)
    );
    
    return [...orderedHeaders, ...additionalHeaders];
  };
  
  const headers = getOrderedHeaders();
  
  // Pagination logic
  const totalPages = Math.ceil(data.length / ROWS_PER_PAGE);
  const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
  const endIndex = startIndex + ROWS_PER_PAGE;
  const currentPageData = data.slice(startIndex, endIndex);

  const handlePreviousFile = () => {
    if (currentFileIndex > 0) {
      setCurrentFileIndex(currentFileIndex - 1);
      setCurrentPage(1); // Reset to first page when switching files
    }
  };

  const handleNextFile = () => {
    if (currentFileIndex < filesWithData.length - 1) {
      setCurrentFileIndex(currentFileIndex + 1);
      setCurrentPage(1); // Reset to first page when switching files
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleDownload = (format: 'csv' | 'excel' | 'pdf') => {
    // Create download content based on format
    if (format === 'csv') {
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentFile.file.name.split('.')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
    // Add Excel and PDF download logic here if needed
  };

  const getFileIcon = (file: FileWithStatus) => {
    switch (file.type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'csv':
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Data Preview</h2>
              <p className="text-sm text-gray-600 mt-1">
                Review extracted data from your files
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Step 3 of 4
            </div>
          </div>
        </div>

        {/* File Navigation */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="secondary"
                size="sm"
                onClick={handlePreviousFile}
                disabled={currentFileIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center space-x-3">
                {getFileIcon(currentFile)}
                <div>
                  <h3 className="font-medium text-gray-900">
                    {currentFile.file.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Page {currentPage} of {totalPages} • {data.length} total rows
                  </p>
                </div>
              </div>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={handleNextFile}
                disabled={currentFileIndex === filesWithData.length - 1}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">
                File {currentFileIndex + 1} of {filesWithData.length}
              </span>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="px-6 py-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {headers.map((header, index) => (
                    <th
                      key={index}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPageData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {headers.map((header, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                      >
                        {row[header] || '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} rows
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Download Options */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Download Current File
              </h4>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload('csv')}
                >
                  <Download className="w-4 h-4 mr-1" />
                  CSV
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload('excel')}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Excel
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload('pdf')}
                >
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Detection
          </Button>
          
          <div className="flex space-x-3">
            <Button variant="secondary" onClick={onMergeAll}>
              Skip to Completion
            </Button>
            <Button onClick={onVisualizeExpenses || onMergeAll}>
              Visualize Expenses
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};