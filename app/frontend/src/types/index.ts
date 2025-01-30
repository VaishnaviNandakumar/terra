export interface UploadResponse {
  success: boolean;
  message: string;
  sessionId?: string;
  error?: string;
}

export interface UploadState {
  currentStep: number;
  sessionId: string | null;
  enableAI: boolean;
  isUploading: boolean;
  error: string | null;
  success: string | null;
  username: string;
  showUploadSection: boolean;
  processingComplete: boolean;
}

export interface UsernameResponse {
  username: string;
}