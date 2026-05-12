'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, FileText } from 'lucide-react';
import { toast } from 'react-toastify';
import { useResumeStore, useResumeStoreV2 } from '@/store/resumeStore';
import { resumeApi, jobApplicationApi, llmConfigApi, resumeV2Api, type ATSScoreResponse } from '@/services/api';
import { compileLatexTemplate } from '@/utils/latexCompiler';
import { PreviewModal } from '@/components/PreviewModal';
import { ATSScoreModal } from '@/components/ATSScoreModal';
import { OptimizedResumeEditor } from '@/components/OptimizedResumeEditor';
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

  const {
    setExtractedContentJson,
    setCreatedLatexTemplate,
    compileAndSetLatex,
  } = useResumeStoreV2();

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
          jobDescription: jobDescription,
        });
        if (updatedApp.lastModifiedAt) {
          setLastSavedTime(new Date(updatedApp.lastModifiedAt));
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
        if (updatedApp.lastModifiedAt) {
          setLastSavedTime(new Date(updatedApp.lastModifiedAt));
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

        if (jobApp.jobDescription && jobApp.jobDescription.trim()) {
          setJobDescription(jobApp.jobDescription);
        }

        if (jobApp.lastModifiedAt) {
          setLastSavedTime(new Date(jobApp.lastModifiedAt));
        }

        const [resumeTemplate, coverLetterTemplate] = await Promise.all([
          resumeApi.getMasterTemplate(),
          resumeApi.getMasterCoverLetterTemplate(),
        ]);

        // Set V2 store with template and extracted JSON
        if (resumeTemplate.handlebarsTemplate && resumeTemplate.extractedJson) {
          setCreatedLatexTemplate(resumeTemplate.handlebarsTemplate);
          setExtractedContentJson(resumeTemplate.extractedJson);
          // Compile the template to get final LaTeX
          compileAndSetLatex();
          
          // Use only compiled LaTeX (not original) to ensure proper template + JSON combination
          // This allows for seamless optimization where we can update JSON and recompile
          const compiledLatex = compileLatexTemplate(
            resumeTemplate.handlebarsTemplate,
            resumeTemplate.extractedJson
          );
          setMasterDocument(compiledLatex);
          setResumeLatexCode(compiledLatex);
          setLatexCode(compiledLatex);
        }

        if (coverLetterTemplate.latexCode) {
          setCoverLetterLatexCode(coverLetterTemplate.latexCode);
        }

        if (jobApp.generatedResumeLatex) {
          setResumeLatexCode(jobApp.generatedResumeLatex);
          setLatexCode(jobApp.generatedResumeLatex);
        }

        if (jobApp.generatedCoverLetterLatex) {
          setCoverLetterLatexCode(jobApp.generatedCoverLetterLatex);
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
  }, [jobId, setMasterDocument, setJobDescription, setLatexCode, setCreatedLatexTemplate, setExtractedContentJson, compileAndSetLatex]);

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

  const handleCheckATSScore = async () => {
    if (!latexCode || !jobDescription) {
      toast.error('Please generate resume and provide job description');
      return;
    }
  
    if (atsLoading) return;
  
    setAtsLoading(true);
  
    try {
      // Get extracted JSON from V2 store
      const { extractedContentJson } = useResumeStoreV2.getState();
      
      if (!extractedContentJson) {
        toast.error('Resume data not loaded. Please refresh the page.');
        setAtsLoading(false);
        return;
      }

      console.log('📊 Analyzing resume against job description...');
      const analysis = await resumeV2Api.analyze(jobDescription, extractedContentJson);

      // Map V2 response to ATSScoreResponse format
      const mapped: ATSScoreResponse = {
        score: analysis.ats_score,
        status: analysis.ats_score >= 70 ? 'pass' : analysis.ats_score >= 50 ? 'review' : 'fail',
        message:
          analysis.ats_score >= 85
            ? 'Excellent! Your resume is highly optimized.'
            : analysis.ats_score >= 70
            ? 'Good! Some improvements can boost your score.'
            : 'Needs improvement to pass ATS filters.',
        overview: analysis.analysis.overall_match,
        score_breakdown: {
          keyword_match: 0,
          experience_match: 0,
          formatting: 0,
          impact: 0,
          overall: analysis.ats_score,
        },
        primary_keywords: analysis.missing_keywords,
        secondary_keywords: [],
        matching_skills: [],
        missing_skills: analysis.missing_keywords,
        role_focus: '',
        seniority_level: '',
        section_analysis: analysis.weak_sections.map(section => ({
          section: section.section_name,
          feedback: section.suggestion,
        })),
        improvement_suggestions: [],
        ats_tips: analysis.optimization_priority,
        experience_gaps: [],
      };
  
      setAtsData(mapped);
      // Save ATS score to store for optimization check
      useResumeStoreV2.setState({ currentAtsScore: analysis.ats_score });
      setShowATSModal(true);
    } catch (err: unknown) {
      let errorMessage = 'Failed to check ATS score';
      let errorDetails = '';

      // Handle axios error response
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axiosError = err as { response?: { data?: Record<string, unknown> } };
        const data = axiosError.response?.data;
        
        if (data && typeof data === 'object') {
          errorMessage = (data.message as string) || errorMessage;
          errorDetails = (data.error as string) || '';
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      // Show detailed error message with actionable steps
      const fullErrorMessage = errorDetails 
        ? `${errorMessage}\n${errorDetails}` 
        : errorMessage;
      
      toast.error(fullErrorMessage, {
        autoClose: 6000,
        style: { whiteSpace: 'pre-wrap' },
      });
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
      {/* Header */}
      <header className="border-b border-gray-200/50 bg-white/80 backdrop-blur-sm">
        <div className="w-full px-8 py-5 flex items-center justify-between">
          {/* Left: Title & Status */}
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Resume Optimization</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                {lastSavedTime ? `Saved ${formatTimeDifference(lastSavedTime)}` : 'Not saved yet'}
                {isSaving && ' • Saving...'}
              </p>
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

        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <OptimizedResumeEditor
          latexCode={latexCode}
          jobDescription={jobDescription}
          onJobDescriptionChange={setJobDescription}
          onLatexChange={setLatexCode}
          onGeneratePDF={handleGeneratePDF}
          onCheckATS={handleCheckATSScore}
          isGeneratingPDF={pdfLoading}
          isCheckingATS={atsLoading}
          activeTab={activeTab}
          atsData={atsData as unknown as ATSScoreResponse}
        />
      </div>

      {/* Modals */}
      {showPreview && pdfUrl && (
        <PreviewModal pdfUrl={pdfUrl} onClose={() => setShowPreview(false)} />
      )}

      {showATSModal && atsData && (
        <ATSScoreModal isOpen={showATSModal} atsData={atsData as unknown as ATSScoreResponse} onClose={() => setShowATSModal(false)} />
      )}
    </div>
  );
}
