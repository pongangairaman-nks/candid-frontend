'use client';

import { useState } from 'react';
import { Upload, FileText, Zap } from 'lucide-react';
import { useResumeStoreV2 } from '@/store/resumeStore';
import { useAnalyzeResume } from '@/hooks/useAnalyzeResume';
import { useOptimizeResume } from '@/hooks/useOptimizeResume';
import { useToastV2 } from '@/hooks/useToastV2';
import { ATSAnalysisDisplayV2 } from './ATSAnalysisDisplayV2';
import { OptimizationProgressV2 } from './OptimizationProgressV2';
import { OptimizationResultsV2 } from './OptimizationResultsV2';
import { ErrorStateV2, EmptyStateV2 } from './ErrorStateV2';

/**
 * Resume Optimization Screen V2
 * 
 * Complete UI for:
 * 1. Upload master resume
 * 2. Enter job description
 * 3. Analyze resume
 * 4. Optimize iteratively
 * 5. Download optimized PDF
 */
export const ResumeOptimizationScreenV2 = () => {
  const {
    wholeMasterTemplate,
    jobDescription,
    atsAnalysis,
    optimizationResult,
    isAnalyzing,
    isOptimizing,
    error,
    setWholeMasterTemplate,
    setJobDescription,
    setError
  } = useResumeStoreV2();

  const { analyzeResume } = useAnalyzeResume();
  const { optimizeResume } = useOptimizeResume();
  const toast = useToastV2();

  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Handle master resume upload
  const handleUploadResume = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setWholeMasterTemplate(text);
      toast.success('Resume uploaded successfully!');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to read file';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  // Handle analyze button
  const handleAnalyze = async () => {
    if (!jobDescription.trim()) {
      toast.warning('Please enter a job description');
      return;
    }

    const result = await analyzeResume(jobDescription);
    if (result) {
      toast.success(`Analysis complete! Score: ${result.ats_score}/100`);
    } else {
      toast.error('Analysis failed. Please try again.');
    }
  };

  // Handle optimize button
  const handleOptimize = async () => {
    const result = await optimizeResume(90);
    if (result) {
      toast.success(`Optimization complete! Final score: ${result.final_ats_score}/100`);
    } else {
      toast.error('Optimization failed. Please try again.');
    }
  };

  // Handle download PDF
  const handleDownloadPDF = async () => {
    if (!optimizationResult?.final_latex) {
      toast.error('No optimized LaTeX available');
      return;
    }

    try {
      setIsDownloadingPDF(true);
      
      // Call PDF generation API
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ latexCode: optimizationResult.final_latex })
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'optimized-resume.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('PDF downloaded successfully!');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to download PDF';
      toast.error(errorMsg);
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Resume Optimizer V2</h1>
          <p className="text-gray-600">Upload your resume and optimize it for any job description</p>
        </div>

        {/* Error State */}
        {error && (
          <ErrorStateV2
            error={error}
            onDismiss={() => setError(null)}
            onRetry={() => {
              if (atsAnalysis) handleAnalyze();
              else if (jobDescription) handleAnalyze();
            }}
          />
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Upload & Job Description */}
          <div className="lg:col-span-1 space-y-6">
            {/* Step 1: Upload Resume */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <span>Step 1: Upload Resume</span>
              </h2>

              {wholeMasterTemplate ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-green-800">Resume uploaded ✓</p>
                </div>
              ) : (
                <label className="block">
                  <input
                    type="file"
                    accept=".tex,.txt"
                    onChange={handleUploadResume}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">Click to upload LaTeX resume</p>
                    <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
                  </div>
                </label>
              )}
            </div>

            {/* Step 2: Job Description */}
            {wholeMasterTemplate && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Step 2: Job Description</h2>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !jobDescription.trim()}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  {isAnalyzing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Analyze Resume</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right Column - Analysis & Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Analysis Results */}
            {atsAnalysis && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <ATSAnalysisDisplayV2
                  analysis={atsAnalysis}
                  isLoading={isAnalyzing}
                  onOptimizeClick={handleOptimize}
                />
              </div>
            )}

            {/* Optimization Progress */}
            {(isOptimizing || optimizationResult) && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <OptimizationProgressV2
                  isOptimizing={isOptimizing}
                  history={optimizationResult?.optimization_history}
                  targetScore={90}
                />
              </div>
            )}

            {/* Optimization Results */}
            {optimizationResult && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <OptimizationResultsV2
                  result={optimizationResult}
                  isLoading={isOptimizing}
                  onDownloadPDF={handleDownloadPDF}
                  isDownloadingPDF={isDownloadingPDF}
                />
              </div>
            )}

            {/* Empty State */}
            {!atsAnalysis && !optimizationResult && wholeMasterTemplate && (
              <EmptyStateV2
                title="Ready to Analyze"
                message="Enter a job description and click 'Analyze Resume' to get started"
                icon={<Zap className="w-12 h-12 text-gray-400" />}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumeOptimizationScreenV2;
