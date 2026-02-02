import { create } from 'zustand';

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
