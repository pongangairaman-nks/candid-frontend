'use client';

import { ArrowLeft, Sparkles, Eye, Download, TrendingUp } from 'lucide-react';
import { toast } from 'react-toastify';
import { useResumeStore } from '@/store/resumeStore';
import { useState, useEffect } from 'react';
import { resumeApi, type ATSScoreResponse } from '@/services/api';
import { PreviewModal } from '@/components/PreviewModal';
import { ATSScoreModal } from '@/components/ATSScoreModal';
import { DEFAULT_RESUME_PROMPT } from '@/constants/prompts';
import { useRouter } from 'next/navigation';

type TabType = 'resume' | 'coverLetter';

const DEFAULT_COVER_LETTER_PROMPT = `You are an expert cover letter writer. Based on the job description and the candidate's master content, write a compelling cover letter that:
1. Addresses the specific requirements mentioned in the job description
2. Highlights relevant skills and experiences from the master content
3. Shows genuine interest in the position and company
4. Uses a professional yet personable tone
5. Is concise and impactful (typically 3-4 paragraphs)

Format the output as a LaTeX cover letter template.`;

export default function ResumeGenerationPage() {
  const router = useRouter();
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

  const [activeTab, setActiveTab] = useState<TabType>('resume');
  const [prompt, setPrompt] = useState(DEFAULT_RESUME_PROMPT);
  const [resumeLatexCode, setResumeLatexCode] = useState('');
  const [coverLetterLatexCode, setCoverLetterLatexCode] = useState('');
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
          setCoverLetterLatexCode(coverLetterTemplate.latexCode);
        }
      } catch {
        console.log('Failed to fetch master templates');
      }
    };

    fetchMasterTemplates();
  }, [setMasterDocument]);

  // Handle tab switching - update prompt and LaTeX code based on active tab
  useEffect(() => {
    if (activeTab === 'resume') {
      setPrompt(DEFAULT_RESUME_PROMPT);
      setLatexCode(resumeLatexCode);
    } else {
      setPrompt(DEFAULT_COVER_LETTER_PROMPT);
      setLatexCode(coverLetterLatexCode);
    }
  }, [activeTab, resumeLatexCode, coverLetterLatexCode, setLatexCode]);

  const handleOptimize = async () => {
    if (!masterDocument || !jobDescription) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await resumeApi.optimizeResume({
        masterDocument,
        jobDescription,
      });

      if (activeTab === 'resume') {
        setResumeLatexCode(response.optimizedLatex);
        setLatexCode(response.optimizedLatex);
      } else {
        setCoverLetterLatexCode(response.optimizedLatex);
        setLatexCode(response.optimizedLatex);
      }

      toast.success(`${activeTab === 'resume' ? 'Resume' : 'Cover Letter'} optimized successfully!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to optimize';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!latexCode) {
      toast.error('No LaTeX code to preview');
      return;
    }

    setPdfLoading(true);
    try {
      const response = await resumeApi.generatePdf(latexCode);
      setPdfUrl(response.pdfUrl);
      setShowPreview(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate preview';
      toast.error(errorMessage);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!latexCode) {
      toast.error('No LaTeX code to download');
      return;
    }

    setPdfLoading(true);
    try {
      const response = await resumeApi.generatePdf(latexCode);
      const link = document.createElement('a');
      link.href = response.pdfUrl;
      link.download = `${activeTab === 'resume' ? 'resume' : 'cover-letter'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Downloaded successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download';
      toast.error(errorMessage);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleCheckATSScore = async () => {
    if (!latexCode || !jobDescription) {
      toast.error('Please fill in all required fields');
      return;
    }

    setAtsLoading(true);
    try {
      const response = await resumeApi.checkATSScore(latexCode, jobDescription);
      setAtsData(response);
      setShowATSModal(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check ATS score';
      toast.error(errorMessage);
    } finally {
      setAtsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-auto bg-white dark:bg-slate-900">
      {/* Back Button */}
      <div className="px-6 md:px-8 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <button
          onClick={() => router.push('/dashboard/jobs')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 font-medium transition-colors"
        >
          <ArrowLeft size={18} />
          Back to Applications
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="px-6 md:px-8 flex gap-8">
          <button
            onClick={() => setActiveTab('resume')}
            className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'resume'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            📄 Resume
          </button>
          <button
            onClick={() => setActiveTab('coverLetter')}
            className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'coverLetter'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            ✉️ Cover Letter
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-6 md:p-8 overflow-auto">
        <div className="grid grid-cols-2 gap-8 h-full">
          {/* Left Section - Job Description and Prompt */}
          <div className="flex flex-col space-y-6">
            {/* Job Description */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Job Description
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Shared for both resume and cover letter</p>
              </div>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description here..."
                className="flex-1 px-6 py-4 font-mono text-sm resize-none border-0 focus:outline-none focus:ring-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            {/* LLM Prompt */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
                <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {activeTab === 'resume' ? 'Resume Optimization Prompt' : 'Cover Letter Prompt'}
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Customize the prompt if needed</p>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter the optimization prompt..."
                className="flex-1 px-6 py-4 font-mono text-sm resize-none border-0 focus:outline-none focus:ring-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            {/* Optimize Button */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <button
                onClick={handleOptimize}
                disabled={!masterDocument || !jobDescription || isLoading}
                className="w-full flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium transition-colors duration-200 dark:disabled:bg-slate-700"
              >
                <Sparkles size={18} className={isLoading ? 'animate-spin' : ''} />
                {isLoading ? `Optimizing ${activeTab === 'resume' ? 'Resume' : 'Cover Letter'}...` : `Optimize ${activeTab === 'resume' ? 'Resume' : 'Cover Letter'} with AI`}
              </button>
            </div>
          </div>

          {/* Right Section - LaTeX Code and Actions */}
          <div className="flex flex-col space-y-6">
            {/* LaTeX Code */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {activeTab === 'resume' ? 'Resume LaTeX Code' : 'Cover Letter LaTeX Code'}
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Editable • Auto-formatted</p>
                </div>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                  {latexCode.length > 0 ? `${Math.round(latexCode.length / 1024)} KB` : 'Empty'}
                </span>
              </div>
              <textarea
                value={latexCode}
                onChange={(e) => setLatexCode(e.target.value)}
                placeholder="Your LaTeX code will appear here..."
                className="flex-1 px-6 py-4 font-mono text-sm resize-none border-0 focus:outline-none focus:ring-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
              <div className="flex gap-3">
                <button
                  onClick={handlePreview}
                  disabled={!latexCode || pdfLoading || isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium transition-colors duration-200 dark:disabled:bg-slate-700"
                >
                  <Eye size={18} />
                  Preview
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!latexCode || pdfLoading || isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium transition-colors duration-200 dark:disabled:bg-slate-700"
                >
                  <Download size={18} />
                  Download
                </button>
                {activeTab === 'resume' && (
                  <button
                    onClick={handleCheckATSScore}
                    disabled={!latexCode || !jobDescription || atsLoading || isLoading}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium transition-colors duration-200 dark:disabled:bg-slate-700"
                  >
                    <TrendingUp size={18} />
                    {atsLoading ? 'Checking ATS Score...' : 'Check ATS Score'}
                  </button>
                )}
              </div>
            </div>
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
