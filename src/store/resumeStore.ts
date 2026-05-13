import { create } from 'zustand';
import { compileLatexTemplate } from '@/utils/latexCompiler';

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
  currentAtsScore: number | null;
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
  setCurrentAtsScore: (score: number | null) => void;
  setIsAnalyzing: (analyzing: boolean) => void;
  setOptimizationResult: (result: OptimizationResult) => void;
  setIsOptimizing: (optimizing: boolean) => void;
  setFinalLatex: (latex: string) => void;
  setPdfUrl: (url: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  compileAndSetLatex: () => void;
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
  currentAtsScore: null,
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
  
  // Setters
  setWholeMasterTemplate: (template) => set({ wholeMasterTemplate: template }),
  setExtractedContentJson: (content) => set({ extractedContentJson: content }),
  setCreatedLatexTemplate: (template) => set({ createdLatexTemplate: template }),
  setJobDescription: (jd) => set({ jobDescription: jd }),
  setATSAnalysis: (analysis) => set({ atsAnalysis: analysis }),
  setCurrentAtsScore: (score) => set({ currentAtsScore: score }),
  setIsAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),
  setOptimizationResult: (result) => set({ optimizationResult: result }),
  setIsOptimizing: (optimizing) => set({ isOptimizing: optimizing }),
  setFinalLatex: (latex) => set({ finalLatex: latex }),
  setPdfUrl: (url) => set({ pdfUrl: url }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  compileAndSetLatex: () => set((state) => {
    if (!state.createdLatexTemplate || !state.extractedContentJson) {
      return { error: 'Template or extracted content missing' };
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const compiledLatex = compileLatexTemplate(
        state.createdLatexTemplate,
        state.extractedContentJson as any
      );
      return { finalLatex: compiledLatex, error: null };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to compile LaTeX';
      return { error: errorMessage };
    }
  }),
  resetV2: () => set({
    wholeMasterTemplate: '',
    extractedContentJson: null,
    createdLatexTemplate: '',
    jobDescription: '',
    atsAnalysis: null,
    currentAtsScore: null,
    isAnalyzing: false,
    optimizationResult: null,
    isOptimizing: false,
    finalLatex: '',
    pdfUrl: null,
    isLoading: false,
    error: null,
  }),
}));
