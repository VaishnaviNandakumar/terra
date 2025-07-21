import React from 'react';
import { Button } from './ui/Button';
import { CheckCircle, AlertCircle, Download } from 'lucide-react';
import { AnalysisResult } from '../types';

interface CompletionViewProps {
  onReset: () => void;
  results: AnalysisResult[];
}

export const CompletionView: React.FC<CompletionViewProps> = ({ onReset, results }) => {
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const totalTransactions = results.reduce((sum, r) => sum + (r.total_transactions || 0), 0);

  const handleDownload = () => {
    // Create CSV content from results
    const csvContent = results
      .filter(r => r.status === 'success' && r.transactions)
      .flatMap(r => r.transactions!)
      .map(t => `${t.Date},${t.Description},${t.Debit || ''},${t.Credit || ''},${t.Source || ''}`)
      .join('\n');
    
    const header = 'Date,Description,Debit,Credit,Source\n';
    const blob = new Blob([header + csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'analysis_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <CheckCircle className="w-16 h-16 text-green-500" />
        </div>
        
        <h3 className="text-xl font-medium text-gray-900 mb-3">
          ✅ Analysis Complete
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-green-800 font-medium">{successCount} Files Processed</div>
            <div className="text-green-600">{totalTransactions} Transactions Found</div>
          </div>
          
          {errorCount > 0 && (
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-red-800 font-medium">{errorCount} Files Failed</div>
              <div className="text-red-600">Check individual results</div>
            </div>
          )}
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-8">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Processing Results</h4>
        <div className="space-y-3">
          {results.map((result, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {result.status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <div className="font-medium text-gray-900">{result.filename}</div>
                  {result.status === 'success' ? (
                    <div className="text-sm text-gray-600">
                      {result.transaction_count} transactions • {result.classification}
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">{result.message}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center space-x-4">
        <Button 
          variant="primary"
          onClick={handleDownload}
          disabled={successCount === 0}
        >
          <Download className="w-4 h-4 mr-2" />
          Download Results
        </Button>
        
        <Button 
          variant="secondary"
          onClick={onReset}
        >
          Process New Files
        </Button>
      </div>
    </div>
  );
};