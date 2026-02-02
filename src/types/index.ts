export interface ResumeData {
  masterDocument: string;
  jobDescription: string;
  optimizedLatex: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface OptimizeResumeRequest {
  masterDocument: string;
  jobDescription: string;
}

export interface OptimizeResumeResponse {
  optimizedLatex: string;
  pdfUrl?: string;
}
