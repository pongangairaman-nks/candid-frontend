'use client';

import { Sparkles, Eye, Download } from 'lucide-react';
import { useResumeStore } from '@/store/resumeStore';
import { useState, useEffect } from 'react';
import { mockResumeApi } from '@/services/api';
import { PreviewModal } from '@/components/PreviewModal';

const DEFAULT_PROMPT = `You are an expert resume optimizer. Analyze the provided resume and the job description. Modify ONLY the content of the resume to match the job description requirements while maintaining the LaTeX structure and formatting. Focus on:
1. Highlighting relevant skills and experiences
2. Using keywords from the job description
3. Quantifying achievements where possible
4. Making it ATS-friendly

Do NOT change the LaTeX template structure, only modify the text content between the LaTeX commands.`;

export default function ResumePage() {
  const {
    masterDocument,
    jobDescription,
    latexCode,
    isLoading,
    setJobDescription,
    setLatexCode,
    setIsLoading,
    setError,
  } = useResumeStore();

  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  // Initialize latexCode with masterDocument on mount
  useEffect(() => {
    if (masterDocument && !latexCode) {
      setLatexCode(masterDocument);
    }
  }, [masterDocument, latexCode, setLatexCode]);

  const handleOptimize = async () => {
    if (!masterDocument || !jobDescription) {
      setError('Please configure your master resume first');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await mockResumeApi.optimizeResume();
      setLatexCode(response.optimizedLatex);
    } catch (err) {
      setError('Failed to optimize resume. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!latexCode) {
      setError('No LaTeX code to preview');
      return;
    }

    setPdfLoading(true);
    try {
      const response = await mockResumeApi.generatePdf(latexCode);
      setPdfUrl(response.pdfUrl);
      setShowPreview(true);
    } catch (err) {
      setError('Failed to generate PDF preview');
      console.error(err);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!latexCode) {
      setError('No LaTeX code to download');
      return;
    }

    try {
      setPdfLoading(true);
      const response = await mockResumeApi.generatePdf(latexCode);

      const link = document.createElement('a');
      link.href = response.pdfUrl;
      link.download = 'resume_optimized.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Failed to download resume');
      console.error(err);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="h-full flex">
      {/* Left Section - Input */}
      <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Job Description */}
          <div className="flex-1 flex flex-col border-b border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                JOB DESCRIPTION
              </label>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="flex-1 px-6 py-4 font-mono text-sm resize-none border-0 focus:outline-none focus:ring-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* LLM Prompt */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                LLM PROMPT (Optional)
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Modify the prompt if needed</p>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-1 px-6 py-4 font-mono text-sm resize-none border-0 focus:outline-none focus:ring-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <button
            onClick={handleOptimize}
            disabled={!masterDocument || !jobDescription || isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold transition-colors dark:disabled:bg-slate-700"
          >
            <Sparkles size={18} />
            {isLoading ? 'Optimizing...' : 'Optimize Resume with AI'}
          </button>
        </div>
      </div>

      {/* Right Section - LaTeX Code */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              LATEX CODE (Editable)
            </label>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {latexCode.length > 0 && `${Math.round(latexCode.length / 1024)} KB`}
            </span>
          </div>
          <textarea
            value={latexCode}
            onChange={(e) => setLatexCode(e.target.value)}
            placeholder="LaTeX code will appear here after optimization or paste your saved template..."
            className="flex-1 px-6 py-4 font-mono text-sm resize-none border-0 focus:outline-none focus:ring-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 space-y-3">
          <div className="flex gap-3">
            <button
              onClick={handlePreview}
              disabled={!latexCode || pdfLoading || isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold transition-colors dark:disabled:bg-slate-700"
            >
              <Eye size={18} />
              Preview
            </button>
            <button
              onClick={handleDownload}
              disabled={!latexCode || pdfLoading || isLoading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold transition-colors dark:disabled:bg-slate-700"
            >
              <Download size={18} />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <PreviewModal
          pdfUrl={pdfUrl}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
}
