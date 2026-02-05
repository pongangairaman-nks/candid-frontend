'use client';

import { Sparkles, Eye, Download, TrendingUp, FileText, Mail, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import { useResumeStore } from '@/store/resumeStore';
import { useState, useEffect, useRef } from 'react';
import { resumeApi, jobApplicationApi, type ATSScoreResponse } from '@/services/api';
import { PreviewModal } from '@/components/PreviewModal';
import { ATSScoreModal } from '@/components/ATSScoreModal';
import { useParams } from 'next/navigation';

type TabType = 'resume' | 'coverLetter';

const formatTimeDifference = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
};

export default function ResumeGenerationPage() {
  const params = useParams();
  const jobId = params.jobId as string;

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
  const [prompt, setPrompt] = useState('');
  const [resumeLatexCode, setResumeLatexCode] = useState('');
  const [coverLetterLatexCode, setCoverLetterLatexCode] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState('');
  const [showATSModal, setShowATSModal] = useState(false);
  const [atsLoading, setAtsLoading] = useState(false);
  const [atsData, setAtsData] = useState<ATSScoreResponse | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [lastSavedTime, setLastSavedTime] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [resumePrompt, setResumePrompt] = useState('');
  const [coverLetterPrompt, setCoverLetterPrompt] = useState('');
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const updateTimestampIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Autosave job description
  useEffect(() => {
    if (!jobDescription || !jobId) return;

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        const updatedApp = await jobApplicationApi.update(parseInt(jobId), {
          job_description: jobDescription,
        });
        // Use backend timestamp for accuracy
        if (updatedApp.last_modified_at) {
          setLastSavedTime(new Date(updatedApp.last_modified_at));
        }
        console.log('Job description autosaved');
      } catch (error) {
        console.error('Failed to autosave job description:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000); // Debounce for 1 second

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [jobDescription, jobId]);

  // Autosave prompt
  useEffect(() => {
    if (!prompt || !jobId) return;

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        const fieldName = activeTab === 'resume' ? 'resume_prompt' : 'cover_letter_prompt';
        const updatedApp = await jobApplicationApi.update(parseInt(jobId), {
          [fieldName]: prompt,
        });
        // Use backend timestamp for accuracy
        if (updatedApp.last_modified_at) {
          setLastSavedTime(new Date(updatedApp.last_modified_at));
        }
        console.log('Prompt autosaved');
      } catch (error) {
        console.error('Failed to autosave prompt:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000); // Debounce for 1 second

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [prompt, jobId, activeTab]);

  // Autosave LaTeX content
  useEffect(() => {
    if (!latexCode || !jobId) return;

    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSaving(true);
        const fieldName = activeTab === 'resume' ? 'generated_resume_latex' : 'generated_cover_letter_latex';
        const updatedApp = await jobApplicationApi.update(parseInt(jobId), {
          [fieldName]: latexCode,
        });
        // Use backend timestamp for accuracy
        if (updatedApp.last_modified_at) {
          setLastSavedTime(new Date(updatedApp.last_modified_at));
        }
        console.log('LaTeX content autosaved');
      } catch (error) {
        console.error('Failed to autosave LaTeX content:', error);
      } finally {
        setIsSaving(false);
      }
    }, 2000); // Debounce for 2 seconds (longer for LaTeX as it's larger)

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [latexCode, jobId, activeTab]);

  // Fetch job application data and master templates on page load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setPageLoading(true);
        // Fetch job application data
        const jobApp = await jobApplicationApi.getById(parseInt(jobId));
        if (jobApp.job_description) {
          setJobDescription(jobApp.job_description);
        }

        // Load last modified timestamp from database
        if (jobApp.last_modified_at) {
          setLastSavedTime(new Date(jobApp.last_modified_at));
        }

        // Fetch master templates
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

        // Load previously generated content if available
        if (jobApp.generated_resume_latex) {
          setResumeLatexCode(jobApp.generated_resume_latex);
          setLatexCode(jobApp.generated_resume_latex);
        }

        if (jobApp.generated_cover_letter_latex) {
          setCoverLetterLatexCode(jobApp.generated_cover_letter_latex);
        }

        // Load prompts from job application (includes defaults if not customized)
        if (jobApp.resume_prompt) {
          setResumePrompt(jobApp.resume_prompt);
          setPrompt(jobApp.resume_prompt);
        }
        if (jobApp.cover_letter_prompt) {
          setCoverLetterPrompt(jobApp.cover_letter_prompt);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load job application data');
      } finally {
        setPageLoading(false);
      }
    };

    if (jobId) {
      fetchData();
    }
  }, [jobId, setMasterDocument, setJobDescription, setLatexCode]);

  // Update timestamp display every minute to keep "X mins ago" current
  useEffect(() => {
    if (!lastSavedTime) return;

    updateTimestampIntervalRef.current = setInterval(() => {
      setLastSavedTime(new Date(lastSavedTime));
    }, 60000); // Update every minute

    return () => {
      if (updateTimestampIntervalRef.current) {
        clearInterval(updateTimestampIntervalRef.current);
      }
    };
  }, [lastSavedTime]);

  // Handle tab switching - update LaTeX code and prompt based on active tab
  useEffect(() => {
    if (activeTab === 'resume') {
      setLatexCode(resumeLatexCode);
      if (resumePrompt) {
        setPrompt(resumePrompt);
      }
    } else {
      setLatexCode(coverLetterLatexCode);
      if (coverLetterPrompt) {
        setPrompt(coverLetterPrompt);
      }
    }
  }, [activeTab, resumeLatexCode, coverLetterLatexCode, resumePrompt, coverLetterPrompt, setLatexCode]);

  const handleOptimize = async () => {
    if (!masterDocument || !jobDescription) {
      toast.error('Please provide both master document and job description');
      return;
    }

    setIsLoading(true);
    try {
      const response = await resumeApi.optimizeResume({
        masterDocument,
        jobDescription,
      });

      const optimizedCode = response.optimizedLatex;
      setLatexCode(optimizedCode);

      if (activeTab === 'resume') {
        setResumeLatexCode(optimizedCode);
        // Save to job application
        await jobApplicationApi.update(parseInt(jobId), {
          generated_resume_latex: optimizedCode,
        });
        toast.success('Resume optimized and saved successfully!');
      } else {
        setCoverLetterLatexCode(optimizedCode);
        // Save to job application
        await jobApplicationApi.update(parseInt(jobId), {
          generated_cover_letter_latex: optimizedCode,
        });
        toast.success('Cover letter generated and saved successfully!');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to optimize';
      toast.error(errorMessage);
      setError(errorMessage);
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
      toast.error('Please generate resume and provide job description');
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
      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="px-6 md:px-8 flex items-center justify-between">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('resume')}
              className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'resume'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <FileText size={16} />
              Resume
            </button>
            <button
              onClick={() => setActiveTab('coverLetter')}
              className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors flex items-center gap-2 ${
                activeTab === 'coverLetter'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
              }`}
            >
              <Mail size={16} />
              Cover Letter
            </button>
          </div>

          {/* Autosave Status Indicator */}
          <div className="flex items-center gap-2 py-4">
            {isSaving ? (
              <>
                <Loader size={14} className="animate-spin text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs text-slate-600 dark:text-slate-400">Saving...</span>
              </>
            ) : lastSavedTime ? (
              <>
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Last saved {formatTimeDifference(lastSavedTime)}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Content - Conditionally Rendered */}
      {pageLoading ? (
        <div className="flex-1 flex items-center justify-center p-6 md:p-8">
          <div className="text-center">
            <Sparkles size={32} className="animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Preparing resume and cover letter automation...</p>
          </div>
        </div>
      ) : (
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
                className="flex-1 px-6 py-4 font-mono text-sm resize-none border-0 focus:outline-none focus:ring-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            {/* Optimize Button */}
            <button
              onClick={handleOptimize}
              disabled={!masterDocument || !jobDescription || isLoading}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium transition-colors duration-200 dark:disabled:bg-slate-700"
            >
              <Sparkles size={18} className={isLoading ? 'animate-spin' : ''} />
              {isLoading ? `Optimizing ${activeTab === 'resume' ? 'Resume' : 'Cover Letter'}...` : `Optimize ${activeTab === 'resume' ? 'Resume' : 'Cover Letter'} with AI`}
            </button>
          </div>

          {/* Right Section - LaTeX Code and Actions */}
          <div className="flex flex-col space-y-6">
            {/* LaTeX Code Display */}
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
                placeholder={`LaTeX code will appear here after optimization or paste your saved ${activeTab === 'resume' ? 'resume' : 'cover letter'} template...`}
                className="flex-1 px-6 py-4 font-mono text-sm resize-none border-0 focus:outline-none focus:ring-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handlePreview}
                disabled={!latexCode || pdfLoading || isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium transition-colors duration-200 dark:disabled:bg-slate-700"
              >
                <Eye size={18} />
                Preview
              </button>
              <button
                onClick={handleDownload}
                disabled={!latexCode || pdfLoading || isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium transition-colors duration-200 dark:disabled:bg-slate-700"
              >
                <Download size={18} />
                Download
              </button>
              {activeTab === 'resume' && (
                <button
                  onClick={handleCheckATSScore}
                  disabled={!latexCode || !jobDescription || atsLoading || isLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium transition-colors duration-200 dark:disabled:bg-slate-700"
                >
                  <TrendingUp size={18} />
                  {atsLoading ? 'Checking ATS Score...' : 'Check ATS Score'}
                </button>
              )}
            </div>
          </div>
        </div>
        </div>
      )}

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
