import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { ArrowLeft, ArrowRight, GripVertical, X, Plus, Download } from 'lucide-react';
import { FileWithStatus } from '../types';

interface ColumnMapping {
  id: string;
  outputName: string;
  sourceFile: string;
  sourceColumn: string;
  enabled: boolean;
}

interface ColumnMappingViewProps {
  files: FileWithStatus[];
  onBack: () => void;
  onComplete: (mappings: ColumnMapping[]) => void;
}

export const ColumnMappingView: React.FC<ColumnMappingViewProps> = ({
  files,
  onBack,
  onComplete
}) => {
  const [mappings, setMappings] = useState<ColumnMapping[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Initialize mappings from all files
  useEffect(() => {
    const initialMappings: ColumnMapping[] = [];
    
    files.forEach(file => {
      if (file.preview_data && file.preview_data.length > 0) {
        const columns = Object.keys(file.preview_data[0]);
        columns.forEach(column => {
          initialMappings.push({
            id: `${file.id}-${column}`,
            outputName: column,
            sourceFile: file.file.name,
            sourceColumn: column,
            enabled: true
          });
        });
      }
    });

    setMappings(initialMappings);
  }, [files]);

  const handleDragStart = (e: React.DragEvent, mappingId: string) => {
    setDraggedItem(mappingId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem === targetId) {
      setDraggedItem(null);
      return;
    }

    const draggedIndex = mappings.findIndex(m => m.id === draggedItem);
    const targetIndex = mappings.findIndex(m => m.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedItem(null);
      return;
    }

    const newMappings = [...mappings];
    const [draggedMapping] = newMappings.splice(draggedIndex, 1);
    newMappings.splice(targetIndex, 0, draggedMapping);

    setMappings(newMappings);
    setDraggedItem(null);
  };

  const toggleMapping = (id: string) => {
    setMappings(prev => 
      prev.map(mapping => 
        mapping.id === id 
          ? { ...mapping, enabled: !mapping.enabled }
          : mapping
      )
    );
  };

  const updateOutputName = (id: string, newName: string) => {
    setMappings(prev => 
      prev.map(mapping => 
        mapping.id === id 
          ? { ...mapping, outputName: newName }
          : mapping
      )
    );
  };

  const removeMapping = (id: string) => {
    setMappings(prev => prev.filter(mapping => mapping.id !== id));
  };

  const addCustomColumn = () => {
    const newMapping: ColumnMapping = {
      id: `custom-${Date.now()}`,
      outputName: 'Custom Column',
      sourceFile: 'Custom',
      sourceColumn: 'Custom',
      enabled: true
    };
    setMappings(prev => [...prev, newMapping]);
  };

  const handleComplete = () => {
    const enabledMappings = mappings.filter(m => m.enabled);
    onComplete(enabledMappings);
  };

  const enabledCount = mappings.filter(m => m.enabled).length;
  const totalFiles = files.filter(f => f.preview_data && f.preview_data.length > 0).length;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Column Mapping</h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure which columns to include in your merged output
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Step 4 of 4
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalFiles}</div>
              <div className="text-sm text-gray-600">Source Files</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{enabledCount}</div>
              <div className="text-sm text-gray-600">Columns Selected</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{mappings.length}</div>
              <div className="text-sm text-gray-600">Total Available</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <GripVertical className="w-5 h-5 text-blue-600 mt-0.5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">How to use Column Mapping</h3>
              <div className="mt-1 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Drag and drop columns to reorder them in the final output</li>
                  <li>Toggle columns on/off using the checkboxes</li>
                  <li>Edit output column names by clicking on them</li>
                  <li>Remove unwanted columns using the X button</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Column Mappings */}
        <div className="px-6 py-4">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {mappings.map((mapping, index) => (
              <div
                key={mapping.id}
                draggable
                onDragStart={(e) => handleDragStart(e, mapping.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, mapping.id)}
                className={`flex items-center p-4 border rounded-lg transition-all ${
                  mapping.enabled 
                    ? 'border-gray-200 bg-white hover:border-blue-300' 
                    : 'border-gray-100 bg-gray-50'
                } ${
                  draggedItem === mapping.id ? 'opacity-50' : ''
                }`}
              >
                {/* Drag Handle */}
                <div className="flex-shrink-0 mr-3 cursor-move">
                  <GripVertical className="w-5 h-5 text-gray-400" />
                </div>

                {/* Enable/Disable Checkbox */}
                <div className="flex-shrink-0 mr-4">
                  <input
                    type="checkbox"
                    checked={mapping.enabled}
                    onChange={() => toggleMapping(mapping.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>

                {/* Column Info */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Output Name
                    </label>
                    <input
                      type="text"
                      value={mapping.outputName}
                      onChange={(e) => updateOutputName(mapping.id, e.target.value)}
                      disabled={!mapping.enabled}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Source File
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700 truncate">
                      {mapping.sourceFile}
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Source Column
                    </label>
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-sm text-gray-700">
                      {mapping.sourceColumn}
                    </div>
                  </div>
                </div>

                {/* Remove Button */}
                <div className="flex-shrink-0 ml-4">
                  <button
                    onClick={() => removeMapping(mapping.id)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Custom Column */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              size="sm"
              onClick={addCustomColumn}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Column
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <Button variant="secondary" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Preview
          </Button>
          
          <Button 
            onClick={handleComplete}
            disabled={enabledCount === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Generate Merged File ({enabledCount} columns)
          </Button>
        </div>
      </div>
    </div>
  );
};