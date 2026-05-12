'use client';

import { useState } from 'react';
import { Download, Copy, Check, Eye, EyeOff } from 'lucide-react';
import type { OptimizationResult } from '@/store/resumeStore';

interface OptimizationResultsV2Props {
  result: OptimizationResult | null;
  isLoading?: boolean;
  onDownloadPDF?: () => void;
  isDownloadingPDF?: boolean;
}

/**
 * Optimization Results Component V2
 * 
 * Shows:
 * - Final ATS score
 * - Optimization iterations summary
 * - Final LaTeX code
 * - Copy and download options
 */
export const OptimizationResultsV2 = ({
  result,
  isLoading = false,
  onDownloadPDF,
  isDownloadingPDF = false
}: OptimizationResultsV2Props) => {
  const [showLatex, setShowLatex] = useState(false);
  const [copiedLatex, setCopiedLatex] = useState(false);

  if (!result && !isLoading) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Generating optimized resume...</p>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const handleCopyLatex = async () => {
    try {
      await navigator.clipboard.writeText(result.final_latex);
      setCopiedLatex(true);
      setTimeout(() => setCopiedLatex(false), 2000);
    } catch (error) {
      console.error('Failed to copy LaTeX:', error);
    }
  };

  const scoreColor =
    result.final_ats_score >= 90
      ? 'text-green-600'
      : result.final_ats_score >= 80
      ? 'text-green-600'
      : result.final_ats_score >= 60
      ? 'text-yellow-600'
      : 'text-red-600';

  const scoreBgColor =
    result.final_ats_score >= 80
      ? 'bg-green-50'
      : result.final_ats_score >= 60
      ? 'bg-yellow-50'
      : 'bg-red-50';

  const scoreBorderColor =
    result.final_ats_score >= 80
      ? 'border-green-200'
      : result.final_ats_score >= 60
      ? 'border-yellow-200'
      : 'border-red-200';

  return (
    <div className="space-y-6">
      {/* Final Score Card */}
      <div className={`border rounded-lg p-6 ${scoreBorderColor} ${scoreBgColor}`}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Final ATS Score</h3>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-5xl font-bold mb-2">
              <span className={scoreColor}>{result.final_ats_score}</span>
              <span className="text-2xl text-gray-600">/100</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden mb-4">
              <div
                className={`h-full transition-all duration-500 ${
                  result.final_ats_score >= 80
                    ? 'bg-green-600'
                    : result.final_ats_score >= 60
                    ? 'bg-yellow-600'
                    : 'bg-red-600'
                }`}
                style={{ width: `${result.final_ats_score}%` }}
              ></div>
            </div>

            {/* Status */}
            <p className="text-sm text-gray-700">
              {result.target_reached && '✅ Target score reached!'}
              {!result.target_reached && result.final_ats_score >= 80 && '✅ Score >= 80. Ready to apply!'}
              {!result.target_reached && result.final_ats_score < 80 && '⚠️ Further optimization may help.'}
            </p>
          </div>

          {/* Optimization Summary */}
          <div className="text-right">
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-1">Iterations</p>
              <p className="text-3xl font-bold text-gray-800">{result.iterations}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Weak Sections</p>
              <p className="text-3xl font-bold text-gray-800">
                {result.optimization_history[result.optimization_history.length - 1]?.weak_sections || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Optimization History */}
      {result.optimization_history.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Optimization History</h3>

          <div className="space-y-3">
            {result.optimization_history.map((item, idx) => (
              <div key={item.iteration} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Iteration {item.iteration}</p>
                  <p className="text-sm text-gray-600">
                    {item.weak_sections} weak sections
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-gray-800">{item.score}</p>
                  {idx > 0 && (
                    <p className="text-sm text-green-600 font-medium">
                      +{item.score - result.optimization_history[idx - 1].score}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LaTeX Code Section */}
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Optimized LaTeX</h3>
          <button
            onClick={() => setShowLatex(!showLatex)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            {showLatex ? (
              <>
                <EyeOff className="w-4 h-4" />
                <span className="text-sm">Hide</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" />
                <span className="text-sm">Show</span>
              </>
            )}
          </button>
        </div>

        {showLatex && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto font-mono text-xs text-gray-700 whitespace-pre-wrap">
            {result.final_latex}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleCopyLatex}
            className="flex-1 flex items-center justify-center space-x-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {copiedLatex ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy LaTeX</span>
              </>
            )}
          </button>

          {onDownloadPDF && (
            <button
              onClick={onDownloadPDF}
              disabled={isDownloadingPDF}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              {isDownloadingPDF ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Next Steps */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Next Steps</h3>
        <ol className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start space-x-3">
            <span className="shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span>Download the optimized PDF resume</span>
          </li>
          <li className="flex items-start space-x-3">
            <span className="shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              2
            </span>
            <span>Review the changes and customize if needed</span>
          </li>
          <li className="flex items-start space-x-3">
            <span className="shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
              3
            </span>
            <span>Apply to the job with confidence!</span>
          </li>
        </ol>
      </div>
    </div>
  );
};

export default OptimizationResultsV2;
