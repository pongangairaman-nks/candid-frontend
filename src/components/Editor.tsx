'use client';

import { Sparkles, Copy, Check } from 'lucide-react';
import { useResumeStore } from '@/store/resumeStore';
import { useState } from 'react';
import { mockResumeApi } from '@/services/api';

export const Editor = () => {
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

  const [copied, setCopied] = useState(false);

  const handleOptimize = async () => {
    if (!masterDocument || !jobDescription) {
      setError('Please upload a master resume and enter a job description');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await mockResumeApi.optimizeResume({
        masterDocument,
        jobDescription,
      });
      setLatexCode(response.optimizedLatex);
    } catch (err) {
      setError('Failed to optimize resume. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLatex = () => {
    navigator.clipboard.writeText(latexCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <div className="px-6 py-3 border-b-2 border-indigo-600 text-sm font-medium text-slate-900 dark:text-white">
          Job Description & Optimization
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Job Description Input */}
        <div className="flex-1 flex flex-col border-b border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              JOB DESCRIPTION
            </label>
          </div>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here. The AI will analyze it and optimize your resume accordingly..."
            className="flex-1 px-6 py-4 font-mono text-sm resize-none border-0 focus:outline-none focus:ring-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        {/* LaTeX Code Output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              OPTIMIZED LATEX CODE
            </label>
            {latexCode && (
              <button
                onClick={handleCopyLatex}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy
                  </>
                )}
              </button>
            )}
          </div>
          <textarea
            value={latexCode}
            readOnly
            placeholder="Optimized LaTeX code will appear here after optimization..."
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
  );
};
