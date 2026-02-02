'use client';

import { Download, Eye, Loader } from 'lucide-react';
import { useResumeStore } from '@/store/resumeStore';
import { useState } from 'react';
import { mockResumeApi } from '@/services/api';
import { PreviewModal } from './PreviewModal';

export const PreviewPanel = () => {
  const { latexCode, isLoading, setError } = useResumeStore();
  const [showPreview, setShowPreview] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfData, setPdfData] = useState<string | null>(null);

  const handlePreview = async () => {
    if (!latexCode) {
      setError('No LaTeX code to preview');
      return;
    }

    setPdfLoading(true);
    try {
      const response = await mockResumeApi.generatePdf(latexCode);
      setPdfData(response.pdfUrl);
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
    <>
      <div className="w-96 bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-l border-slate-200 dark:border-slate-700 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Preview & Export</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {latexCode ? 'Ready to export' : 'Optimize resume first'}
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col p-6 space-y-6 overflow-y-auto">
          {/* Status Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-3">
              <div className={`w-3 h-3 rounded-full mt-1 ${latexCode ? 'bg-green-500' : 'bg-slate-300'}`} />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {latexCode ? 'Resume Optimized' : 'Awaiting Optimization'}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {latexCode
                    ? `${latexCode.length} characters ready for export`
                    : 'Upload master resume and job description to begin'}
                </p>
              </div>
            </div>
          </div>

          {/* LaTeX Code Preview */}
          {latexCode && (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-3">LATEX CODE PREVIEW</p>
              <div className="bg-slate-900 dark:bg-black rounded p-3 font-mono text-xs text-slate-100 max-h-40 overflow-y-auto">
                <code>{latexCode.substring(0, 500)}</code>
                {latexCode.length > 500 && (
                  <div className="text-slate-500 mt-2">... ({latexCode.length - 500} more characters)</div>
                )}
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              ℹ️ The preview shows how your resume will look in PDF format. Download to get the final file.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 space-y-3">
          <button
            onClick={handlePreview}
            disabled={!latexCode || pdfLoading || isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold transition-colors dark:disabled:bg-slate-700"
          >
            {pdfLoading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Eye size={18} />
                Preview PDF
              </>
            )}
          </button>

          <button
            onClick={handleDownload}
            disabled={!latexCode || pdfLoading || isLoading}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold transition-colors dark:disabled:bg-slate-700"
          >
            {pdfLoading ? (
              <>
                <Loader size={18} className="animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download size={18} />
                Download Resume
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && pdfData && (
        <PreviewModal
          pdfUrl={pdfData}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  );
};
