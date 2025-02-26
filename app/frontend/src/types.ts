export interface UploadState {
  currentStep: number;
  sessionId: string | null;
  enableAI: boolean;
  isUploading: boolean;
  error: string | null;
  success: string | null;
  username: string;
  showUploadSection: boolean;
  steps: string[];
}

export interface UploadResponse {
  message: string;
  sessionId?: string;
  error?: string;
} 