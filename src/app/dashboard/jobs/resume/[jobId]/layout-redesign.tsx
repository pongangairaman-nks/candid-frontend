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
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
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
      <div className="flex items-center justify-center h-screen bg-linear-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Sparkles size={40} className="text-blue-600" />
          </div>
          <p className="text-gray-600 font-medium">Loading resume optimization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-linear-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Resume Optimization</h1>
              <p className="text-sm text-gray-500">
                {lastSavedTime ? `Last saved ${formatTimeDifference(lastSavedTime)}` : 'Not saved yet'}
                {isSaving && ' • Saving...'}
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('resume')}
              className={`px-4 py-2 rounded font-medium transition-all ${
                activeTab === 'resume'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Resume
            </button>
            <button
              onClick={() => setActiveTab('coverLetter')}
              className={`px-4 py-2 rounded font-medium transition-all ${
                activeTab === 'coverLetter'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Cover Letter
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCheckATSScore}
              disabled={atsLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              <TrendingUp size={18} />
              <span>ATS Score</span>
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={pdfLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              <Eye size={18} />
              <span>Preview</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={pdfLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              <Download size={18} />
              <span>Download</span>
            </button>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronRight size={20} className={`text-gray-600 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Job Description */}
        <div
          className={`transition-all duration-300 overflow-hidden ${
            sidebarOpen ? 'w-96' : 'w-0'
          } border-r border-gray-200 bg-white flex flex-col`}
        >
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Job Description</h2>
              <p className="text-sm text-gray-500">Paste the job description to optimize your resume</p>
            </div>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description here..."
              className="flex-1 p-6 border-none focus:outline-none resize-none font-mono text-sm text-gray-700"
            />

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center space-x-2 text-xs text-gray-500">
              <AlertCircle size={16} />
              <span>Changes are auto-saved</span>
            </div>
          </div>
        </div>

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ResumeChatInterface
            latexCode={latexCode}
            jobDescription={jobDescription}
            onLatexChange={setLatexCode}
            onGeneratePDF={handleGeneratePDF}
            isGeneratingPDF={pdfLoading}
          />
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
