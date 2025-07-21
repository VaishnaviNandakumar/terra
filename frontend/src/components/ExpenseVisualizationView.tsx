import React, { useState } from 'react';
import { useEffect } from 'react';
import { Button } from './ui/Button';
import { ArrowLeft, ArrowRight, Upload, Sparkles, FileText, Download, Plus, X } from 'lucide-react';
import { ProductTagMapping, VisualizationConfig } from '../types';
import { apiService } from '../services/api';

interface ExpenseVisualizationViewProps {
  onBack: () => void;
  onProceed: (config: VisualizationConfig) => void;
  files: any[];
}

export const ExpenseVisualizationView: React.FC<ExpenseVisualizationViewProps> = ({
  onBack,
  onProceed,
  files
}) => {
  const [mappingType, setMappingType] = useState<'upload' | 'sample'>('sample');
  const [useAI, setUseAI] = useState(true);
  const [customMappings, setCustomMappings] = useState<ProductTagMapping[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sampleMappings, setSampleMappings] = useState<ProductTagMapping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load sample mappings from backend
  useEffect(() => {
    const loadSampleMappings = async () => {
      try {
        const response = await apiService.getSampleMappings();
        if (response.success && response.data) {
          const mappings = response.data.mappings.map((mapping: any, index: number) => ({
            id: index.toString(),
            product: mapping.Product,
            tag: mapping.Tag
          }));
          setSampleMappings(mappings);
        }
      } catch (err) {
        console.error('Failed to load sample mappings:', err);
        setError('Failed to load sample mappings');
      }
    };

    loadSampleMappings();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      // In a real implementation, you'd parse the CSV file here
      // For now, we'll just store the file reference
    }
  };

  const addCustomMapping = () => {
    const newMapping: ProductTagMapping = {
      id: Date.now().toString(),
      product: '',
      tag: ''
    };
    setCustomMappings(prev => [...prev, newMapping]);
  };

  const updateCustomMapping = (id: string, field: 'product' | 'tag', value: string) => {
    setCustomMappings(prev => 
      prev.map(mapping => 
        mapping.id === id 
          ? { ...mapping, [field]: value }
          : mapping
      )
    );
  };

  const removeCustomMapping = (id: string) => {
    setCustomMappings(prev => prev.filter(mapping => mapping.id !== id));
  };

  const downloadSampleCSV = () => {
    const csvContent = [
      'Product,Tag',
      ...sampleMappings.map(m => `${m.product},${m.tag}`)
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_product_mapping.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleProceed = async () => {
    try {
      setLoading(true);
      setError(null);

      // Step 1: Save product mappings
      let mappingsToSave = [];
      if (mappingType === 'sample') {
        mappingsToSave = sampleMappings.map(m => ({ product: m.product, tag: m.tag }));
      } else {
        mappingsToSave = customMappings.map(m => ({ product: m.product, tag: m.tag }));
      }

      const saveMappingsResponse = await apiService.saveProductMappings(mappingsToSave, mappingType);
      if (!saveMappingsResponse.success) {
        throw new Error(saveMappingsResponse.error || 'Failed to save mappings');
      }

      // Step 2: Consolidate files
      const filesData = files.filter(f => f.preview_data && f.preview_data.length > 0).map(f => ({
        filename: f.file.name,
        transactions: f.preview_data,
        source: f.classification  // Add the credit/debit classification from the file
      }));

      const consolidateResponse = await apiService.consolidateFiles(filesData);
      if (!consolidateResponse.success) {
        throw new Error(consolidateResponse.error || 'Failed to consolidate files');
      }

      // Step 3: Categorize expenses
      const categorizeResponse = await apiService.categorizeExpenses(
        consolidateResponse.data.consolidated_table_id,
        saveMappingsResponse.data.mapping_id,
        useAI
      );
      if (!categorizeResponse.success) {
        throw new Error(categorizeResponse.error || 'Failed to categorize expenses');
      }

      // Create config and proceed
      const config: VisualizationConfig = {
        useAI,
        mappingType,
        customMappings: mappingType === 'upload' ? customMappings : undefined,
        consolidatedTableId: consolidateResponse.data.consolidated_table_id,
        categorizationResults: categorizeResponse.data
      };
      
      onProceed(config);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process visualization');
    } finally {
      setLoading(false);
    }
  };

  const canProceed = mappingType === 'sample' || 
    (mappingType === 'upload' && (uploadedFile || customMappings.length > 0)) && !loading;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Expense Visualization Setup</h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure product categorization for expense analysis
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Step 4 of 5
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="px-6 py-4 bg-red-50 border-b border-red-200">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {/* Product-Tag Mapping Section */}
        <div className="px-6 py-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Product-Tag Mapping
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            To categorize your expenses, we need to map product names to categories. 
            Choose how you'd like to provide this mapping.
          </p>

          {/* Mapping Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                mappingType === 'sample' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setMappingType('sample')}
            >
              <div className="flex items-center mb-3">
                <input
                  type="radio"
                  checked={mappingType === 'sample'}
                  onChange={() => setMappingType('sample')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label className="ml-3 text-sm font-medium text-gray-900">
                  Use Sample Mapping
                </label>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Use our pre-built mapping with common merchants and categories.
              </p>
              <div className="text-xs text-gray-500">
                Includes: Food, Transportation, Shopping, Entertainment, etc.
              </div>
            </div>

            <div 
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                mappingType === 'upload' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setMappingType('upload')}
            >
              <div className="flex items-center mb-3">
                <input
                  type="radio"
                  checked={mappingType === 'upload'}
                  onChange={() => setMappingType('upload')}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label className="ml-3 text-sm font-medium text-gray-900">
                  Upload Custom Mapping
                </label>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Upload your own CSV file or create mappings manually.
              </p>
              <div className="text-xs text-gray-500">
                Format: Product, Tag (CSV file)
              </div>
            </div>
          </div>

          {/* Sample Mapping Preview */}
          {mappingType === 'sample' && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-gray-900">Sample Mapping Preview</h4>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={downloadSampleCSV}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download Full List
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                {sampleMappings.slice(0, 6).map(mapping => (
                  <div key={mapping.id} className="flex justify-between py-1">
                    <span className="font-medium text-gray-700">{mapping.product}</span>
                    <span className="text-gray-600">{mapping.tag}</span>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                ...and {sampleMappings.length - 6} more categories
              </div>
            </div>
          )}

          {/* Custom Mapping Upload */}
          {mappingType === 'upload' && (
            <div className="space-y-4 mb-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                <div className="text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Upload Mapping File
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Upload a CSV file with Product and Tag columns
                  </p>
                  <label className="cursor-pointer">
                    <span className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm">
                      Choose File
                    </span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                  {uploadedFile && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ {uploadedFile.name} uploaded
                    </p>
                  )}
                </div>
              </div>

              {/* Manual Mapping Creation */}
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-medium text-gray-900">
                    Or Create Mappings Manually
                  </h4>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={addCustomMapping}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Mapping
                  </Button>
                </div>

                {customMappings.length > 0 && (
                  <div className="space-y-2">
                    {customMappings.map(mapping => (
                      <div key={mapping.id} className="flex items-center space-x-2">
                        <input
                          type="text"
                          placeholder="Product name (e.g., ZOMATO)"
                          value={mapping.product}
                          onChange={(e) => updateCustomMapping(mapping.id, 'product', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="Tag (e.g., Food & Dining)"
                          value={mapping.tag}
                          onChange={(e) => updateCustomMapping(mapping.id, 'tag', e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => removeCustomMapping(mapping.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* AI Categorization Option */}
          <div className="border border-gray-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  checked={useAI}
                  onChange={(e) => setUseAI(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3">
                <div className="flex items-center">
                  <label className="text-sm font-medium text-gray-900">
                    Use AI for Smart Categorization
                  </label>
                  <Sparkles className="w-4 h-4 text-yellow-500 ml-2" />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Let AI automatically categorize transactions that don't match your mapping rules. 
                  This helps capture expenses from new or unknown merchants.
                </p>
                <div className="mt-2 text-xs text-gray-500">
                  ✓ Handles unknown merchants • ✓ Learns from transaction descriptions • ✓ Improves accuracy over time
                </div>
              </div>
            </div>
          </div>

          {/* Example Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">
              How it works:
            </h4>
            <div className="text-sm text-blue-700 space-y-1">
              <div>1. <strong>Transaction:</strong> "UPI-ZOMATO ONLINE-12345" → <strong>Tag:</strong> Food & Dining</div>
              <div>2. <strong>Transaction:</strong> "UBER TRIP-67890" → <strong>Tag:</strong> Transportation</div>
              <div>3. <strong>Unknown Transaction:</strong> "NEW RESTAURANT XYZ" → <strong>AI suggests:</strong> Food & Dining</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Preview
          </Button>
          
          <Button 
            onClick={handleProceed}
            disabled={!canProceed}
          >
            {loading ? 'Processing...' : 'Proceed to Visualization'}
            {!loading && <ArrowRight className="w-4 h-4 ml-2" />}
          </Button>
        </div>
      </div>
    </div>
  );
};