import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance with default config
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export interface OptimizeResumeRequest {
  jobDescription: string;
  prompt?: string;
  resume: string;
  masterProfile?: string;
}

export interface OptimizeResumeResponse {
  status: string;
  message: string;
  data: {
    optimizedLatex: string;
  };
}

// LLM-based ATS endpoints (baseline + incremental re-score)
export interface LLMAtsBaseline {
  score?: number;
  status?: string;
  message?: string;
  overview?: string;
  overallScore?: number;

  summary?: string;

  score_breakdown?: {
    keyword_match: number;
    experience_match: number;
    formatting: number;
    impact: number;
    overall: number;
  };
  scoreBreakdown?: {
    keyword_match: number;
    experience_match: number;
    formatting: number;
    impact: number;
    overall: number;
  };

  primary_keywords?: string[];
  secondary_keywords?: string[];
  matching_skills?: string[];
  missing_skills?: string[];

  keywords?: string[];
  matchedSkills?: string[];
  keywordGaps?: string[];

  role_focus?: string;
  roleFocus?: string;
  seniority_level?: string;
  seniority?: string;

  section_analysis?: {
    section: string;
    feedback: string;
  }[];
  sectionFeedback?: {
    section: string;
    feedback: string;
  }[];

  ats_tips?: string[];
  improvement_suggestions?: {
    section: string;
    original: string;
    improved: string;
    reason: string;
  }[];

  experience_gaps?: {
    issue: string;
    impact: string;
  }[];
  criticalGaps?: string[];
}

type ApiResponse<T> = {
  status: 'success' | 'error';
  data: T;
  message?: string;
};

export const atsLLMApi = {
  baseline: async (params: {
    resumeId?: number;
    resumeText?: string;
    jobDescription?: string;
    force?: boolean;
  }): Promise<LLMAtsBaseline> => {
    const response = await apiClient.post<ApiResponse<LLMAtsBaseline>>(
      '/ats/llm/analysis',
      params
    );
  
    const res = response?.data;
  
    if (!res || res.status !== 'success' || !res.data) {
      throw new Error(res?.message || 'Failed to fetch LLM ATS baseline');
    }
  
    return res.data;
  },

  rescore: async (
    params: { resumeId: number; sectionKey?: string; beforeText?: string; afterText: string }
  ): Promise<{
    updatedMappings: Array<{ requirementId: string; matchStrength: string; was?: string }>;
    scoreDelta: number;
    newOverallScore: number;
  }> => {
    const response = await apiClient.post<{ status: string; data: { updatedMappings: Array<{ requirementId: string; matchStrength: string; was?: string }>; scoreDelta: number; newOverallScore: number; } }>(
      '/ats/llm/rescore',
      params
    );
    if (response.data?.status !== 'success') {
      throw new Error('Failed to re-score LLM ATS');
    }
    return response.data.data;
  },

  usage: async (
    resumeId?: number
  ): Promise<{ usage: LlmUsageEntry[]; totals: LlmUsageTotals } > => {
    const params = typeof resumeId === 'number' ? { resumeId } : {};
    const response = await apiClient.get<{ status: string; data: { usage: LlmUsageEntry[]; totals: LlmUsageTotals } }>(
      `/ats/llm/usage`,
      { params }
    );
    if (response.data?.status !== 'success') {
      throw new Error('Failed to fetch LLM ATS usage');
    }
    return response.data.data;
  }
};

// LLM usage typing for ATS operations
export interface LlmUsageEntry {
  ts: string;
  phase: 'analysis.extract' | 'analysis.map' | 'rescore' | string;
  provider: 'openai' | 'claude' | 'gemini' | string;
  model: string | null;
  latencyMs?: number;
  stub?: boolean;
}

export interface LlmUsageTotals {
  totalCalls: number;
  analysisCalls: number;
  rescoreCalls: number;
  totalLatencyMs: number;
  stubCalls: number;
}

export interface ATSBreakdown {
  primaryKeywords: {
    matched: number;
    total: number;
    percentage: number;
    weight: number;
  };
  secondaryKeywords: {
    matched: number;
    total: number;
    percentage: number;
    weight: number;
  };
  matchingSkills: {
    matched: number;
    missing: number;
    total: number;
    percentage: number;
    weight: number;
  };
  formatQuality: {
    score: number;
    weight: number;
  };
  seniorityAlignment: {
    score: number;
    weight: number;
  };
}

export interface ATSSuggestion {
  section: string;
  original: string;
  improved: string;
  reason: string;
}

export interface ATSScoreResponse {
  score: number;
  status: string;
  message: string;
  overview: string;
  score_breakdown: {
    keyword_match: number;
    experience_match: number;
    formatting: number;
    impact: number;
    overall: number;
  };
  primary_keywords: string[];
  secondary_keywords: string[];
  matching_skills: string[];
  missing_skills: string[];
  role_focus: string;
  seniority_level: string;
  experience_gaps: {
    issue: string;
    impact: string;
  }[];
  section_analysis: {
    section: string;
    feedback: string;
  }[];
  ats_tips: string[];
  improvement_suggestions: ATSSuggestion[];
  breakdown?: ATSBreakdown;
}

export const resumeApi = {
  saveMasterTemplate: async (latexCode: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>(
        '/resume/save-master-template',
        { latexCode }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getMasterTemplate: async (): Promise<{ latexCode: string }> => {
    try {
      const response = await apiClient.get<{ status: string; data: { latexCode: string } }>(
        '/resume/master-template'
      );
      return { latexCode: response.data.data?.latexCode || '' };
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 404) {
        console.log('No master template found, returning empty');
        return { latexCode: '' };
      }
      return { latexCode: '' };
    }
  },

  saveMasterCoverLetterTemplate: async (latexCode: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>(
        '/resume/save-master-cover-letter-template',
        { latexCode }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getMasterCoverLetterTemplate: async (): Promise<{ latexCode: string }> => {
    try {
      const response = await apiClient.get<{ status: string; data: { latexCode: string } }>(
        '/resume/master-cover-letter-template'
      );
      return { latexCode: response.data.data?.latexCode || '' };
    } catch (error: unknown) {
      const axiosError = error as { response?: { status: number } };
      if (axiosError.response?.status === 404) {
        console.log('No master cover letter template found, returning empty');
        return { latexCode: '' };
      }
      return { latexCode: '' };
    }
  },

  optimizeResume: async (data: OptimizeResumeRequest): Promise<OptimizeResumeResponse> => {
    try {
      const response = await apiClient.post<OptimizeResumeResponse>(
        '/resume/optimize',
        data
      );
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || 'Failed to optimize resume';
      const customError = new Error(errorMessage);
      throw customError;
    }
  },

  optimizeSection: async (selectedText: string, jobDescription: string, prompt: string): Promise<{ optimizedText: string }> => {
    try {
      const response = await apiClient.post<OptimizeResumeResponse>(
        '/resume/optimize',
        {
          resumeText: selectedText,
          jobDescription,
          prompt,
        }
      );
      return { optimizedText: response.data.data.optimizedLatex };
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || 'Failed to optimize section';
      const customError = new Error(errorMessage);
      throw customError;
    }
  },

  generatePdf: async (latexCode: string): Promise<{ pdfUrl: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/compile-latex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latexCode }),
      });

      if (!response.ok) {
        // Try to get detailed error message from backend
        try {
          const errorData = await response.json();
          if (errorData.message) {
            throw new Error(errorData.message);
          }
        } catch {
          // If JSON parsing fails, use status text
        }
        throw new Error(`Failed to compile LaTeX: ${response.statusText}`);
      }

      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);

      return { pdfUrl };
    } catch (error) {
      throw error;
    }
  },

  downloadResume: async (pdfUrl: string): Promise<Blob> => {
    try {
      const response = await apiClient.get(pdfUrl, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  checkATSScore: async (resumeText: string, jobDescription?: string): Promise<ATSScoreResponse> => {
    try {
      const response = await apiClient.post<{ status: string; data: ATSScoreResponse }>('/ats/analysis', {
        resumeText,
        jobDescription,
      });

      if (!response.data || response.data.status !== 'success') {
        throw new Error(response.data?.status || 'Failed to calculate ATS score');
      }

      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  refineSection: async (params: {
    sectionKey: string;
    sectionTitle: string;
    sectionContent: string;
    jobDescription: string;
    conversationHistory: Array<{ role: string; content: string }>;
    userMessage: string;
  }): Promise<{ refinedContent: string; refinementSuggestion: string; tokensUsed: number }> => {
    try {
      const response = await apiClient.post<{
        status: string;
        refinedContent: string;
        refinementSuggestion: string;
        tokensUsed: number;
      }>('/resume/refine-section', params);

      if (response.data?.status !== 'success') {
        throw new Error('Failed to refine section');
      }

      return {
        refinedContent: response.data.refinedContent,
        refinementSuggestion: response.data.refinementSuggestion,
        tokensUsed: response.data.tokensUsed,
      };
    } catch (error) {
      throw error;
    }
  },
};

export interface SignupRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    isVerified: boolean;
  };
  token: string;
}

export const authApi = {
  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<{ data: AuthResponse }>('/auth/signup', data);
      const { token, user } = response.data.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      return response.data.data;
    } catch (error) {
      throw error;
    }
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    try {
      const response = await apiClient.post<{ status: string; message: string; data: AuthResponse; errorType?: string }>('/auth/login', data);
      const { token, user } = response.data.data;
      localStorage.setItem('authToken', token);
      localStorage.setItem('user', JSON.stringify(user));
      return response.data.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string; errorType?: string } } };
      const errorMessage = axiosError.response?.data?.message || 'Login failed. Please try again.';
      const errorType = axiosError.response?.data?.errorType || 'AUTH_ERROR';
      
      const customError = new Error(errorMessage) as Error & { errorType: string };
      customError.errorType = errorType;
      throw customError;
    }
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  resetPassword: async (resetToken: string, newPassword: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/reset-password', {
        resetToken,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  verifyEmail: async (verificationToken: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>('/auth/verify-email', {
        verificationToken,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getCurrentUser: async () => {
    try {
      const response = await apiClient.get<{ data: { user: AuthResponse['user'] } }>('/auth/me');
      return response.data.data.user;
    } catch (error) {
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
};

export const realResumeApi = {
  analyzeJobDescription: async (resumeId: number, jobDescription: string): Promise<{ analysis: { keywords: string[]; missing_skills: string[]; role_focus: string } }> => {
    try {
      const response = await apiClient.post<{ data: { analysis: { keywords: string[]; missing_skills: string[]; role_focus: string } } }>(
        '/analyze',
        { resumeId, jobDescription }
      );
      return { analysis: response.data.data.analysis };
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const errorMessage = axiosError?.response?.data?.message || axiosError?.response?.data?.error || axiosError?.message || 'Failed to analyze job description';
      const err = new Error(errorMessage);
      throw err;
    }
  },

  generateTailoredResume: async (resumeId: number): Promise<{ latex: string }> => {
    try {
      const response = await apiClient.post<{ data: { latex: string } }>(
        '/generate-resume',
        { resumeId }
      );
      return { latex: response.data.data.latex };
    } catch (error) {
      const axiosError = error as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const errorMessage = axiosError?.response?.data?.message || axiosError?.response?.data?.error || axiosError?.message || 'Failed to generate tailored resume';
      const err = new Error(errorMessage);
      throw err;
    }
  },
};

export const mockResumeApi = {
  optimizeResume: async (): Promise<OptimizeResumeResponse> => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    const mockOptimizedLatex = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{geometry}
\\geometry{margin=0.5in}

\\begin{document}

\\section*{PONGANGAIRAMAN N K S}
\\textit{Senior Frontend Engineer | Bangalore, India | +91-7530860544 | pongangairaman@gmail.com}

\\section*{PROFESSIONAL SUMMARY}
Results-driven Frontend Engineer with 3+ years of experience building scalable SaaS platforms. Specialized in React, TypeScript, and modern web technologies. Proven track record of optimizing performance and improving user engagement by 45%.

\\section*{CORE SKILLS}
React, TypeScript, Next.js, JavaScript, Tailwind CSS, REST APIs, GraphQL, Redux, Zustand, Framer Motion, Accessibility (WCAG), Authentication, Role-based Access, Dashboard Analytics, PDF Bookmarking, File Upload/Download, Drag and Drop Canvas, DAM Validation, LSAC Pipeline, RAG, CI/CD, Microservices Architecture, Git, Vercel, Netlify, Render

\\section*{PROFESSIONAL EXPERIENCE}

\\textbf{Frontend Developer -- Graphly Labs (Unicorn)} \\hfill \\textit{Jun 2025 -- Present}
\\begin{itemize}
  \\item Architected React + TypeScript automation systems enabling WhatsApp, Email, and Telegram campaigns
  \\item Engineered Zustand state management reducing component re-renders by 40%
  \\item Built real-time analytics dashboards improving marketing optimization visibility by 30%
  \\item Designed pricing subscription system reducing data loss problems by 60%
\\end{itemize}

\\textbf{Frontend Developer -- Graphly Labs (Unicorn)} \\hfill \\textit{Jun 2022 -- Jun 2025}
\\begin{itemize}
  \\item Developed responsive UI components using React and Tailwind CSS
  \\item Implemented JWT authentication and role-based access control
  \\item Optimized bundle size reducing initial load time by 35%
\\end{itemize}

\\section*{EDUCATION}
Bachelor's Degree -- Chennai, India

\\end{document}`;

    return {
      status: 'success',
      message: 'Resume optimized successfully',
      data: {
        optimizedLatex: mockOptimizedLatex,
      },
    };
  },

  generatePdf: async (latexCode: string): Promise<{ pdfUrl: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/compile-latex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latexCode }),
      });

      if (!response.ok) {
        const error = await response.json() as Record<string, unknown>;
        throw new Error((error.message as string) || 'Failed to compile LaTeX');
      }

      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);

      return { pdfUrl };
    } catch (error) {
      throw error;
    }
  },

  downloadResume: async (pdfUrl: string): Promise<Blob> => {
    try {
      const response = await fetch(pdfUrl);
      return response.blob();
    } catch (error) {
      throw error;
    }
  },
};

export interface JobApplication {
  id?: number;
  position: string;
  companyName: string;
  industry?: string;
  companyUrl?: string;
  jobUrl?: string;
  jobPortal?: string;
  jobDescription?: string;
  status: string;
  appliedDate?: string;
  interviewDate?: string;
  notes?: string;
  resumeId?: number;
  resumePdfUrl?: string;
  coverLetterPdfUrl?: string;
  generatedResumeLatex?: string;
  generatedCoverLetterLatex?: string;
  resumePrompt?: string;
  coverLetterPrompt?: string;
  lastModifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MasterContentSection {
  id: string;
  title: string;
  content: string;
}
export interface LLMConfig {
  masterContent?: MasterContentSection[];
  masterResumePrompt?: string;
  masterCoverLetterPrompt?: string;
  masterResume?: string;
  masterCoverLetter?: string;
  useLatexTemplate?: boolean;
}

export const llmConfigApi = {
  getConfig: async (): Promise<LLMConfig> => {
    try {
      const response = await apiClient.get('/llm/config');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateConfig: async (data: Partial<LLMConfig>): Promise<LLMConfig> => {
    try {
      const response = await apiClient.put('/llm/config', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export const resumeSectionsApi = {
  getSections: async (): Promise<{ sections: Array<{ name: string; order: number; isActive: boolean }> }> => {
    try {
      const response = await apiClient.get('/resume/sections');
      return response.data.data;
    } catch (error) {
      console.error('Error fetching sections:', error);
      throw error;
    }
  },
};

export const jobApplicationApi = {
  getAll: async (): Promise<JobApplication[]> => {
    try {
      const response = await apiClient.get('/job-applications');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getById: async (id: number): Promise<JobApplication> => {
    try {
      const response = await apiClient.get(`/job-applications/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (data: JobApplication): Promise<JobApplication> => {
    try {
      const response = await apiClient.post('/job-applications', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id: number, data: Partial<JobApplication>): Promise<JobApplication> => {
    try {
      const response = await apiClient.put(`/job-applications/${id}`, data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/job-applications/${id}`);
    } catch (error) {
      throw error;
    }
  },

  updateStatus: async (id: number, status: string): Promise<JobApplication> => {
    try {
      const response = await apiClient.patch(`/job-applications/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
