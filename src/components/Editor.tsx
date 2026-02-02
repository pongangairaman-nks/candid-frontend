'use client';

import { Sparkles, Copy, Check } from 'lucide-react';
import { useResumeStore } from '@/store/resumeStore';
import { useState } from 'react';
import { realResumeApi, resumeApi } from '@/services/api';

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
    console.log('🚀 handleOptimize called');
    console.log('masterDocument:', masterDocument ? `${masterDocument.length} chars` : 'empty');
    console.log('jobDescription:', jobDescription ? `${jobDescription.length} chars` : 'empty');
    
    if (!masterDocument || !jobDescription) {
      console.log('❌ Validation failed - missing master document or job description');
      setError('Please upload a master resume and enter a job description');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // First, ensure the master template is saved
      console.log('📝 Step 1: Saving master template...');
      const saveResult = await resumeApi.saveMasterTemplate(masterDocument);
      console.log('✅ Master template saved:', saveResult);
      
      // Get the saved master template to ensure it's in the database
      console.log('📝 Step 2: Fetching saved master template...');
      const { latexCode: savedTemplate } = await resumeApi.getMasterTemplate();
      console.log('✅ Master template fetched:', savedTemplate ? `${savedTemplate.length} chars` : 'empty');
      
      if (!savedTemplate) {
        throw new Error('Failed to save master template');
      }

      // For now, use a default resumeId of 1 (in production, this would come from user context)
      // First analyze the job description
      console.log('📝 Step 3: Analyzing job description with Gemini...');
      const analysisResult = await realResumeApi.analyzeJobDescription(1, jobDescription);
      console.log('✅ Job description analyzed:', analysisResult);
      
      // Then generate the tailored resume
      console.log('📝 Step 4: Generating tailored resume with Claude...');
      const response = await realResumeApi.generateTailoredResume(1);
      console.log('✅ Tailored resume generated:', response.latex ? `${response.latex.length} chars` : 'empty');
      
      setLatexCode(response.latex);
      console.log('✅ LaTeX code set in store');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to optimize resume. Please try again.';
      console.error('❌ Error in handleOptimize:', err);
      console.error('Error message:', errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      console.log('🏁 handleOptimize completed');
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
