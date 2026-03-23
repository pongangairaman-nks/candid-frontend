'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Eye, Download, TrendingUp, FileText, ChevronRight, AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import { useResumeStore } from '@/store/resumeStore';
import { resumeApi, jobApplicationApi, llmConfigApi, atsLLMApi, type ATSScoreResponse } from '@/services/api';
import { PreviewModal } from '@/components/PreviewModal';
import { ATSScoreModal } from '@/components/ATSScoreModal';
import { ResumeChatInterface } from '@/components/ResumeChatInterface';
import { useParams } from 'next/navigation';

type TabType = 'resume' | 'coverLetter';

const formatTimeDifference = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
};

export default function ResumeOptimizationPage() {
  const params = useParams();
  const jobId = params.jobId as string;

  const {
    jobDescription,
    latexCode,
    setMasterDocument,
    setJobDescription,
    setLatexCode,
  } = useResumeStore();

  const [activeTab, setActiveTab] = useState<TabType>('resume');
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const fetchInitiatedRef = useRef(false);
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
        if (updatedApp.last_modified_at) {
          setLastSavedTime(new Date(updatedApp.last_modified_at));
        }
      } catch (error) {
        console.error('Failed to autosave job description:', error);
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [jobDescription, jobId]);

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
        if (updatedApp.last_modified_at) {
          setLastSavedTime(new Date(updatedApp.last_modified_at));
        }
      } catch (error) {
        console.error('Failed to autosave LaTeX content:', error);
      } finally {
        setIsSaving(false);
      }
    }, 2000);

    return () => {
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [latexCode, jobId, activeTab]);

  // Fetch data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setPageLoading(true);
        setJobDescription('');

        const [jobApp] = await Promise.all([
          jobApplicationApi.getById(parseInt(jobId)),
          llmConfigApi.getConfig(),
        ]);

        if (jobApp.job_description && jobApp.job_description.trim()) {
          setJobDescription(jobApp.job_description);
        }

        if (jobApp.last_modified_at) {
          setLastSavedTime(new Date(jobApp.last_modified_at));
        }

        const [resumeTemplate, coverLetterTemplate] = await Promise.all([
          resumeApi.getMasterTemplate(),
          resumeApi.getMasterCoverLetterTemplate(),
        ]);

        if (resumeTemplate.latexCode) {
          setMasterDocument(resumeTemplate.latexCode);
          setResumeLatexCode(resumeTemplate.latexCode);
          setLatexCode(resumeTemplate.latexCode);
        }

        if (coverLetterTemplate.latexCode) {
          setCoverLetterLatexCode(coverLetterTemplate.latexCode);
        }

        if (jobApp.generated_resume_latex) {
          setResumeLatexCode(jobApp.generated_resume_latex);
          setLatexCode(jobApp.generated_resume_latex);
        }

        if (jobApp.generated_cover_letter_latex) {
          setCoverLetterLatexCode(jobApp.generated_cover_letter_latex);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        toast.error('Failed to load job application data');
      } finally {
        setPageLoading(false);
      }
    };

    if (jobId && !fetchInitiatedRef.current) {
      fetchInitiatedRef.current = true;
      fetchData();
    }
  }, [jobId, setMasterDocument, setJobDescription, setLatexCode]);

  // Handle tab switching
  useEffect(() => {
    if (activeTab === 'resume') {
      setLatexCode(resumeLatexCode);
    } else {
      setLatexCode(coverLetterLatexCode);
    }
  }, [activeTab, resumeLatexCode, coverLetterLatexCode, setLatexCode]);

  const handleGeneratePDF = async () => {
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
      const { pdfUrl: compiledPdfUrl } = await resumeApi.generatePdf(latexCode);
      setPdfUrl(compiledPdfUrl);

      const pdfjsLib = await import('pdfjs-dist');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfDoc = await (pdfjsLib as any).getDocument(compiledPdfUrl).promise;
      let extractedText = '';
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const page = await (pdfDoc as any).getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((it: { str: string }) => it.str).join(' ');
        extractedText += (extractedText ? '\n' : '') + pageText;
      }

      if (process.env.NEXT_PUBLIC_ATS_LLM_BETA === 'true') {
        const baseline = await atsLLMApi.baseline({ resumeText: extractedText, jobDescription, force: true });
        const score = baseline.overall_score || 0;
        const status = score >= 70 ? 'pass' : score >= 50 ? 'review' : 'fail';
        const mapped: ATSScoreResponse = {
          score,
          status,
          message: score >= 85 ? '🟢 Excellent!' : score >= 70 ? '🟡 Good!' : '🔴 Needs improvement',
          breakdown: {
            primary_keywords: { matched: 0, total: 0, percentage: 0, weight: 0.4 },
            secondary_keywords: { matched: 0, total: 0, percentage: 0, weight: 0.25 },
            matching_skills: { matched: 0, missing: 0, total: 0, percentage: 0, weight: 0.15 },
            format_quality: { score: 100, weight: 0.1 },
            seniority_alignment: { score: 80, weight: 0.1 },
          },
          suggestions: [],
          tips: baseline.keyword_gaps || [],
          gaps: baseline.critical_gaps || [],
        };
        setAtsData(mapped);
      } else {
        const response = await resumeApi.checkATSScore(extractedText, jobDescription);
        setAtsData(response);
      }
      setShowATSModal(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check ATS score';
      toast.error(errorMessage);
    } finally {
      setAtsLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 mb-4">
            <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
          </div>
          <p className="text-gray-700 font-medium">Loading your resume...</p>
          <p className="text-sm text-gray-500 mt-1">Just a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Elegant Header */}
      <header className="border-b border-gray-200/50 bg-white">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          {/* Left: Title & Status */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Resume Optimization</h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {lastSavedTime ? `Saved ${formatTimeDifference(lastSavedTime)}` : 'Not saved yet'}
                  {isSaving && ' • Saving...'}
                </p>
              </div>
            </div>
          </div>

          {/* Center: Tabs */}
          <div className="flex items-center space-x-1 bg-gray-100/60 p-1 rounded-lg">
            {(['resume', 'coverLetter'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'resume' ? 'Resume' : 'Cover Letter'}
              </button>
            ))}
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCheckATSScore}
              disabled={atsLoading}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <TrendingUp className="w-4 h-4" />
              <span>ATS Score</span>
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={pdfLoading}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={pdfLoading}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 text-gray-600"
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Elegant Sidebar */}
        <div
          className={`transition-all duration-300 overflow-hidden flex flex-col bg-gray-50/50 border-r border-gray-200/50 ${
            sidebarOpen ? 'w-96' : 'w-0'
          }`}
        >
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Sidebar Header */}
            <div className="px-8 py-6 border-b border-gray-200/50">
              <h2 className="text-sm font-semibold text-gray-900">Job Description</h2>
              <p className="text-xs text-gray-500 mt-1">Paste the job description to tailor your resume</p>
            </div>

            {/* Textarea */}
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description here..."
              className="flex-1 px-8 py-6 border-none focus:outline-none resize-none font-mono text-sm text-gray-700 bg-transparent placeholder:text-gray-400"
            />

            {/* Footer */}
            <div className="px-8 py-4 border-t border-gray-200/50 bg-white/50 flex items-center space-x-2 text-xs text-gray-500">
              <AlertCircle className="w-4 h-4" />
              <span>Changes auto-save</span>
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden m-6 rounded-2xl border border-gray-200/50 bg-white shadow-sm">
            <ResumeChatInterface
              latexCode={latexCode}
              jobDescription={jobDescription}
              onLatexChange={setLatexCode}
              onGeneratePDF={handleGeneratePDF}
              isGeneratingPDF={pdfLoading}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showPreview && pdfUrl && (
        <PreviewModal pdfUrl={pdfUrl} onClose={() => setShowPreview(false)} />
      )}

      {showATSModal && atsData && (
        <ATSScoreModal isOpen={showATSModal} atsData={atsData} onClose={() => setShowATSModal(false)} />
      )}
    </div>
  );
}
