import { create } from 'zustand';

// V1 State (Original)
export interface ResumeState {
  masterDocument: string;
  jobDescription: string;
  latexCode: string;
  pdfUrl: string | null;
  isLoading: boolean;
  error: string | null;
  
  setMasterDocument: (doc: string) => void;
  setJobDescription: (jd: string) => void;
  setLatexCode: (code: string) => void;
  setPdfUrl: (url: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

// V2 State (New Architecture)
export interface ResumeContentV2 {
  metadata?: {
    name?: string;
    email?: string;
    phone?: string;
    location?: string;
    links?: Array<{ label: string; url: string }>;
  };
  sections?: Record<string, unknown>;
}

export interface ATSAnalysisResult {
  ats_score: number;
  analysis: {
    overall_match: string;
    strengths: string[];
    weaknesses: string[];
  };
  weak_sections: Array<{
    section_key: string;
    section_name: string;
    match_percentage: number;
    priority: 'critical' | 'high' | 'medium' | 'low';
    reason: string;
    missing_keywords: string[];
    suggestion: string;
  }>;
  missing_keywords: string[];
  optimization_priority: string[];
}

export interface OptimizationResult {
  optimized_content_json: ResumeContentV2;
  final_latex: string;
  final_ats_score: number;
  target_reached: boolean;
  iterations: number;
  optimization_history: Array<{
    iteration: number;
    score: number;
    weak_sections: number;
    timestamp: string;
  }>;
}

export interface ResumeStateV2 {
  // Master Resume
  wholeMasterTemplate: string;
  extractedContentJson: ResumeContentV2 | null;
  createdLatexTemplate: string;
  
  // Job Description
  jobDescription: string;
  
  // ATS Analysis
  atsAnalysis: ATSAnalysisResult | null;
  isAnalyzing: boolean;
  
  // Optimization
  optimizationResult: OptimizationResult | null;
  isOptimizing: boolean;
  
  // Final LaTeX
  finalLatex: string;
  pdfUrl: string | null;
  
  // State
  isLoading: boolean;
  error: string | null;
  
  // V2 Actions
  setWholeMasterTemplate: (template: string) => void;
  setExtractedContentJson: (content: ResumeContentV2) => void;
  setCreatedLatexTemplate: (template: string) => void;
  setJobDescription: (jd: string) => void;
  setATSAnalysis: (analysis: ATSAnalysisResult) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setOptimizationResult: (result: OptimizationResult) => void;
  setIsOptimizing: (optimizing: boolean) => void;
  setFinalLatex: (latex: string) => void;
  setPdfUrl: (url: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetV2: () => void;
}

// V1 Store (Original - unchanged)
export const useResumeStore = create<ResumeState>((set) => ({
  masterDocument: '',
  jobDescription: '',
  latexCode: '',
  pdfUrl: null,
  isLoading: false,
  error: null,
  
  setMasterDocument: (doc) => set({ masterDocument: doc }),
  setJobDescription: (jd) => set({ jobDescription: jd }),
  setLatexCode: (code) => set({ latexCode: code }),
  setPdfUrl: (url) => set({ pdfUrl: url }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set({
    masterDocument: '',
    jobDescription: '',
    latexCode: '',
    pdfUrl: null,
    isLoading: false,
    error: null,
  }),
}));

// V2 Store (New Architecture)
export const useResumeStoreV2 = create<ResumeStateV2>((set) => ({
  // Master Resume
  wholeMasterTemplate: '',
  extractedContentJson: null,
  createdLatexTemplate: '',
  
  // Job Description
  jobDescription: '',
  
  // ATS Analysis
  atsAnalysis: null,
  isAnalyzing: false,
  
  // Optimization
  optimizationResult: null,
  isOptimizing: false,
  
  // Final LaTeX
  finalLatex: '',
  pdfUrl: null,
  
  // State
  isLoading: false,
  error: null,
  
  // V2 Actions
  setWholeMasterTemplate: (template) => set({ wholeMasterTemplate: template }),
  setExtractedContentJson: (content) => set({ extractedContentJson: content }),
  setCreatedLatexTemplate: (template) => set({ createdLatexTemplate: template }),
  setJobDescription: (jd) => set({ jobDescription: jd }),
  setATSAnalysis: (analysis) => set({ atsAnalysis: analysis }),
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  setOptimizationResult: (result) => set({ optimizationResult: result }),
  setIsOptimizing: (optimizing) => set({ isOptimizing: optimizing }),
  setFinalLatex: (latex) => set({ finalLatex: latex }),
  setPdfUrl: (url) => set({ pdfUrl: url }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  resetV2: () => set({
    wholeMasterTemplate: '',
    extractedContentJson: null,
    createdLatexTemplate: '',
    jobDescription: '',
    atsAnalysis: null,
    isAnalyzing: false,
    optimizationResult: null,
    isOptimizing: false,
    finalLatex: '',
    pdfUrl: null,
    isLoading: false,
    error: null,
  }),
}));
