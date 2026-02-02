'use client';

import { Sparkles, Eye, Download } from 'lucide-react';
import { useResumeStore } from '@/store/resumeStore';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';
import { mockResumeApi, resumeApi, realResumeApi } from '@/services/api';
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
    setMasterDocument,
    setJobDescription,
    setLatexCode,
    setIsLoading,
    setError,
  } = useResumeStore();

  const { user } = useAuthStore();

  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [showPreview, setShowPreview] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');

  // Fetch master template on page load if not already available
  useEffect(() => {
    const fetchMasterTemplate = async () => {
      // Only fetch if masterDocument is not already in store
      if (!masterDocument) {
        try {
          const { latexCode: fetchedLatexCode } = await resumeApi.getMasterTemplate();
          if (fetchedLatexCode) {
            // Set the master document in store
            setMasterDocument(fetchedLatexCode);
          }
        } catch (err) {
          // Template doesn't exist yet, which is fine
          console.log('No master template found');
        }
      }
    };

    fetchMasterTemplate();
  }, [masterDocument, setMasterDocument]);

  // Initialize latexCode with masterDocument on mount
  useEffect(() => {
    if (masterDocument && !latexCode) {
      setLatexCode(masterDocument);
    }
  }, [masterDocument, latexCode, setLatexCode]);

  const handleOptimize = async () => {
    console.log('🚀 Resume Page handleOptimize called');
    console.log('masterDocument:', masterDocument ? `${masterDocument.length} chars` : 'empty');
    console.log('jobDescription:', jobDescription ? `${jobDescription.length} chars` : 'empty');
    
    if (!masterDocument || !jobDescription) {
      console.log('❌ Validation failed');
      setError('Please configure your master resume first');
      return;
    }

    if (!user || !user.id) {
      console.log('❌ User not authenticated');
      setError('User not authenticated. Please log in.');
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

      // Use the authenticated user's ID
      const resumeId = user.id;
      console.log(`📝 Using resumeId: ${resumeId} for user: ${user.email}`);
      
      // First analyze the job description
      console.log('📝 Step 3: Analyzing job description with Gemini...');
      const analysisResult = await realResumeApi.analyzeJobDescription(resumeId, jobDescription);
      console.log('✅ Job description analyzed:', analysisResult);
      
      // Then generate the tailored resume
      console.log('📝 Step 4: Generating tailored resume with Claude...');
      const response = await realResumeApi.generateTailoredResume(resumeId);
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
