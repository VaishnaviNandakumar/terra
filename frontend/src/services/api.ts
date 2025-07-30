const API_BASE_URL = 'http://localhost:8000/api';
import { sessionManager } from '../utils/sessionManager';

export interface UploadResponse {
  success: boolean;
  data?: {
    message: string;
    files: Array<{
      filename: string;
      file_path: string;
      size: number;
      type: string;
      is_password_protected?: boolean;
      password_required?: boolean;
    }>;
  };
  error?: string;
}

export interface AnalysisResponse {
  success: boolean;
  data?: {
    message: string;
    results: Array<{
      filename: string;
      status: 'success' | 'error';
      classification?: string;
      transaction_count?: number;
      transactions?: any[];
      total_transactions?: number;
      message?: string;
      password_required?: boolean;
    }>;
  };
  error?: string;
}

export interface SampleMappingsResponse {
  success: boolean;
  data?: {
    mappings: any[];
    total_count: number;
  };
  error?: string;
}

class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', 
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async healthCheck(): Promise<{ status: string; message: string }> {
    const response = await this.makeRequest<{ success: boolean; data: any }>('/health');
    return response.data;
  }

  async uploadFiles(files: File[]): Promise<UploadResponse> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
    });

    return response.json();
  }

  async analyzeFiles(filesData: Array<{
    filename: string;
    file_path: string;
    classification: string;
    password?: string | null;
  }>): Promise<AnalysisResponse> {
    const sessionId = sessionManager.getSessionId();
    return this.makeRequest<AnalysisResponse>('/analyze', {
      method: 'POST',
      body: JSON.stringify({ 
        files: filesData,
        session_id: sessionId 
      }),
    });
  }

  async downloadResults(filename: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/download/${filename}`);
    return response.blob();
  }

  async getSampleMappings(): Promise<SampleMappingsResponse> {
    const response = await fetch(`${API_BASE_URL}/sample-mappings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Only if you're using cookies/session-based auth
    });
  
    return response.json();
  }

  async saveProductMappings(mappings: any[], mappingType: string): Promise<{ success: boolean; data?: any; error?: string }> {
    const sessionId = sessionManager.getSessionId();
    return this.makeRequest('/save-product-mappings', {
      method: 'POST',
      body: JSON.stringify({ 
        mappings, 
        mapping_type: mappingType,
        session_id: sessionId 
      }),
    });
  }

  async consolidateFiles(filesData: any[]): Promise<{ success: boolean; data?: any; error?: string }> {
    const sessionId = sessionManager.getSessionId();
    return this.makeRequest('/consolidate-files', {
      method: 'POST',
      body: JSON.stringify({ 
        files_data: filesData,
        session_id: sessionId 
      }),
    });
  }

  async categorizeExpenses(consolidatedTableId: string, mappingId: string, useAI: boolean): Promise<{ success: boolean; data?: any; error?: string }> {
    const sessionId = sessionManager.getSessionId();
    return this.makeRequest('/categorize-expenses', {
      method: 'POST',
      body: JSON.stringify({ 
        consolidated_table_id: consolidatedTableId, 
        mapping_id: mappingId, 
        use_ai: useAI,
        session_id: sessionId
      }),
    });
  }


  async getTransactions(): Promise<{ success: boolean; data?: any; error?: string }> {
    const sessionId = sessionManager.getSessionId();
    if (!sessionId) throw new Error("Session ID missing");
    return this.makeRequest('/edit', {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    });
  }
  
  async updateTag(
    transactionId: string,
    newTag: string,
    applyToAll: boolean,
    product: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const sessionId = sessionManager.getSessionId();
    if (!sessionId) throw new Error("Session ID missing");
    return this.makeRequest('/update-tag', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        transactionId,
        newTag,
        applyToAll,
        product
      }),
    });
  }
  
  async updateProduct(
    transactionId: string,
    oldProduct: string,
    newProduct: string,
    replaceAll: boolean,
    tag: string
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const sessionId = sessionManager.getSessionId();
    if (!sessionId) throw new Error("Session ID missing");
    return this.makeRequest('/update-product', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        transactionId,
        oldProduct,
        newProduct,
        replaceAll,
        tag
      }),
    });
  }


async fetchSampleFile(type: 'csv' | 'excel'): Promise<File> {
  const url = `http://localhost:8000/static/sample_data/${
    type === 'csv' ? 'sample.csv' : 'sample.xlsx'
  }`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch ${type} sample file`);
  const blob = await response.blob();
  return new File([blob], `sample.${type === 'csv' ? 'csv' : 'xlsx'}`, { type: blob.type });
}

}


export const apiService = new ApiService();