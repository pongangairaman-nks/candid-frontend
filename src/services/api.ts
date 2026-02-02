import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface OptimizeResumeRequest {
  masterDocument: string;
  jobDescription: string;
}

export interface OptimizeResumeResponse {
  optimizedLatex: string;
  pdfUrl?: string;
}

export const resumeApi = {
  optimizeResume: async (data: OptimizeResumeRequest): Promise<OptimizeResumeResponse> => {
    try {
      const response = await apiClient.post<OptimizeResumeResponse>(
        '/resume/optimize',
        data
      );
      return response.data;
    } catch (error) {
      console.error('Error optimizing resume:', error);
      throw error;
    }
  },

  generatePdf: async (latexCode: string): Promise<{ pdfUrl: string }> => {
    try {
      const response = await apiClient.post<{ pdfUrl: string }>(
        '/resume/generate-pdf',
        { latexCode }
      );
      return response.data;
    } catch (error) {
      console.error('Error generating PDF:', error);
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
      console.error('Error downloading resume:', error);
      throw error;
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
      optimizedLatex: mockOptimizedLatex,
    };
  },

  generatePdf: async (latexCode: string): Promise<{ pdfUrl: string }> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/compile-latex`, {
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
      console.error('PDF generation error:', error);
      throw error;
    }
  },

  downloadResume: async (pdfUrl: string): Promise<Blob> => {
    try {
      const response = await fetch(pdfUrl);
      return response.blob();
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  },
};
