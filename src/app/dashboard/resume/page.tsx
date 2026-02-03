'use client';

import { Sparkles, Eye, Download, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';
import { useResumeStore } from '@/store/resumeStore';
import { useAuthStore } from '@/store/authStore';
import { useState, useEffect } from 'react';
import { mockResumeApi, resumeApi, realResumeApi, type ATSScoreResponse } from '@/services/api';
import { PreviewModal } from '@/components/PreviewModal';
import { ATSScoreModal } from '@/components/ATSScoreModal';
import { DEFAULT_RESUME_PROMPT } from '@/constants/prompts';

type TabType = 'resume' | 'coverLetter';

const DEFAULT_COVER_LETTER_PROMPT = `You are an expert cover letter writer. Based on the job description and the candidate's master content, write a compelling cover letter that:
1. Addresses the specific requirements mentioned in the job description
2. Highlights relevant skills and experiences from the master content
3. Shows genuine interest in the position and company
4. Uses a professional yet personable tone
5. Is concise and impactful (typically 3-4 paragraphs)

Format the output as a LaTeX cover letter template.`;

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

  const [activeTab, setActiveTab] = useState<TabType>('resume');
  const [prompt, setPrompt] = useState(DEFAULT_RESUME_PROMPT);
  const [resumeLatexCode, setResumeLatexCode] = useState('');
  const [coverLetterLatexCode, setCoverLetterLatexCode] = useState('');
  const [masterCoverLetterTemplate, setMasterCoverLetterTemplate] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [showATSModal, setShowATSModal] = useState(false);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsData, setAtsData] = useState<ATSScoreResponse | null>(null);

  // Fetch master templates on page load
  useEffect(() => {
    const fetchMasterTemplates = async () => {
      try {
        // Fetch both master resume and cover letter templates in parallel
        const [resumeTemplate, coverLetterTemplate] = await Promise.all([
          resumeApi.getMasterTemplate(),
          resumeApi.getMasterCoverLetterTemplate(),
        ]);

        if (resumeTemplate.latexCode) {
          setMasterDocument(resumeTemplate.latexCode);
          setResumeLatexCode(resumeTemplate.latexCode);
        }

        if (coverLetterTemplate.latexCode) {
          setMasterCoverLetterTemplate(coverLetterTemplate.latexCode);
        }
      } catch (err) {
        console.log('Failed to fetch master templates');
      }
    };

    fetchMasterTemplates();
  }, [setMasterDocument]);

  // Handle tab switching - update prompt and LaTeX code based on active tab
  useEffect(() => {
    if (activeTab === 'resume') {
      setPrompt(DEFAULT_RESUME_PROMPT);
      setLatexCode(resumeLatexCode || masterDocument);
    } else {
      setPrompt(DEFAULT_COVER_LETTER_PROMPT);
      setLatexCode(coverLetterLatexCode || masterCoverLetterTemplate);
    }
  }, [activeTab, resumeLatexCode, coverLetterLatexCode, masterDocument, masterCoverLetterTemplate, setLatexCode]);

  const handleOptimize = async () => {
    const isResume = activeTab === 'resume';
    const documentType = isResume ? 'resume' : 'cover letter';
    
    console.log(`🚀 Optimizing ${documentType}...`);
    
    if (!masterDocument || !jobDescription) {
      setError(`Please configure your master ${documentType} first`);
      return;
    }

    if (!user || !user.id) {
      setError('User not authenticated. Please log in.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userId = user.id;
      
      // Analyze job description (shared for both)
      console.log(`📝 Analyzing job description for ${documentType}...`);
      await realResumeApi.analyzeJobDescription(userId, jobDescription);
      
      // Generate tailored document based on active tab
      console.log(`📝 Generating tailored ${documentType}...`);
      const response = await realResumeApi.generateTailoredResume(userId);
      
      if (isResume) {
        setResumeLatexCode(response.latex);
        setLatexCode(response.latex);
        toast.success('Resume optimized successfully!');
      } else {
        setCoverLetterLatexCode(response.latex);
        setLatexCode(response.latex);
        toast.success('Cover letter optimized successfully!');
      }
      
      console.log(`✅ ${documentType} generated: ${response.latex ? `${response.latex.length} chars` : 'empty'}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : `Failed to optimize ${documentType}. Please try again.`;
      setError(errorMessage);
      toast.error(errorMessage);
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

  const handleCheckATSScore = async () => {
    if (!latexCode || !jobDescription) {
      setError('Please generate a resume and provide a job description first');
      return;
    }

    setAtsLoading(true);
    try {
      const response = await resumeApi.checkATSScore(latexCode, jobDescription);
      setAtsData(response);
      setShowATSModal(true);
      toast.success('ATS analysis complete!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check ATS score';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error(err);
    } finally {
      setAtsLoading(false);
    }
  };

  return (
    <div className="h-full flex">
      {/* Left Section - Input */}
      <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('resume')}
            className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'resume'
                ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Resume
          </button>
          <button
            onClick={() => setActiveTab('coverLetter')}
            className={`flex-1 px-6 py-4 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'coverLetter'
                ? 'text-indigo-600 dark:text-indigo-400 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-600 dark:text-slate-400 border-transparent hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Cover Letter
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Job Description - Shared for both tabs */}
          <div className="flex-1 flex flex-col border-b border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                JOB DESCRIPTION
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Common for both resume and cover letter</p>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="flex-1 px-6 py-4 font-mono text-sm resize-none border-0 focus:outline-none focus:ring-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* LLM Prompt - Dynamic based on active tab */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {activeTab === 'resume' ? 'RESUME OPTIMIZATION PROMPT' : 'COVER LETTER PROMPT'} (Optional)
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
            {isLoading ? `Optimizing ${activeTab === 'resume' ? 'Resume' : 'Cover Letter'}...` : `Optimize ${activeTab === 'resume' ? 'Resume' : 'Cover Letter'} with AI`}
          </button>
        </div>
      </div>

      {/* Right Section - LaTeX Code */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {activeTab === 'resume' ? 'RESUME LATEX CODE' : 'COVER LETTER LATEX CODE'} (Editable)
            </label>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {latexCode.length > 0 && `${Math.round(latexCode.length / 1024)} KB`}
            </span>
          </div>
          <textarea
            value={latexCode}
            onChange={(e) => setLatexCode(e.target.value)}
            placeholder={`LaTeX code will appear here after optimization or paste your saved ${activeTab === 'resume' ? 'resume' : 'cover letter'} template...`}
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
            {activeTab === 'resume' && (
              <button
                onClick={handleCheckATSScore}
                disabled={!latexCode || !jobDescription || atsLoading || isLoading}
                className="flex-2 flex items-center justify-center gap-2 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold transition-colors dark:disabled:bg-slate-700"
              >
                <TrendingUp size={18} />
                {atsLoading ? 'Checking ATS Score...' : 'Check ATS Score'}
              </button>
            )}
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

      {/* ATS Score Modal */}
      <ATSScoreModal
        isOpen={showATSModal}
        onClose={() => setShowATSModal(false)}
        atsData={atsData}
        isLoading={atsLoading}
      />
    </div>
  );
}
