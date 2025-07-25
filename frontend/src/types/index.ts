export interface FileWithStatus {
  file: File;
  id: string;
  classification: 'credit' | 'debit' | 'unknown';
  type: 'pdf' | 'csv' | 'excel' | 'unsupported';
  // Backend response data
  file_path?: string;
  backend_filename?: string;
  // Password protection
  is_password_protected?: boolean;
  password?: string;
  password_required?: boolean;
  // Analysis results
  preview_data?: Transaction[];
  total_rows?: number;
  error_message?: string;
}

export interface Transaction {
  Date: string;
  Description: string;
  Debit: number | null;
  Credit: number | null;
  Source?: string;
  [key: string]: any; // For additional columns
}

export interface AnalysisResult {
  filename: string;
  status: 'success' | 'error';
  classification?: string;
  transaction_count?: number;
  transactions?: Transaction[];
  total_transactions?: number;
  message?: string;
  password_required?: boolean;
}

export type WorkflowStep = 'upload' | 'detection' | 'preview' | 'visualization' | 'completed' | 'edit-dashboard';

export interface ProductTagMapping {
  id: string;
  product: string;
  tag: string;
}

export interface VisualizationConfig {
  useAI: boolean;
  mappingType: 'upload' | 'sample';
  customMappings?: ProductTagMapping[];
  consolidatedTableId?: string;
  categorizationResults?: any;
  sessionId?: string;
}
