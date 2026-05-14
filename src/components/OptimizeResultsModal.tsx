"use client";

import { X, TrendingUp, CheckCircle, AlertCircle, Zap, RefreshCw } from "lucide-react";

interface OptimizeResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOptimizeAgain?: () => void;
  previousScore: number;
  newScore: number;
  iterations: number;
  totalIterations: number;
  sectionsOptimized: string[];
  plateauDetected: boolean;
  isOptimizing?: boolean;
}

export const OptimizeResultsModal = ({
  isOpen,
  onClose,
  onOptimizeAgain,
  previousScore,
  newScore,
  iterations,
  totalIterations,
  sectionsOptimized,
  plateauDetected,
  isOptimizing = false,
}: OptimizeResultsModalProps) => {
  if (!isOpen) return null;

  const scoreImprovement = newScore - previousScore;
  const improvementPercentage = ((scoreImprovement / previousScore) * 100).toFixed(1);
  const isExcellent = newScore >= 85;
  const isGood = newScore >= 70 && newScore < 85;

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700";
    if (score >= 70) return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700";
    return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700";
  };

  const getScoreTextColor = (score: number) => {
    if (score >= 85) return "text-green-700 dark:text-green-300";
    if (score >= 70) return "text-blue-700 dark:text-blue-300";
    return "text-yellow-700 dark:text-yellow-300";
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-green-600 to-emerald-600 dark:from-green-900 dark:to-emerald-900 px-6 py-4 flex justify-between items-center border-b border-green-700 dark:border-green-600">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CheckCircle size={24} />
            Optimization Complete
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-green-700 dark:hover:bg-green-600 p-1 rounded transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {isOptimizing ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="animate-spin mb-4">
                <RefreshCw size={48} className="text-green-600 dark:text-green-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-300 font-medium">Optimizing resume...</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">This may take 30-60 seconds</p>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Score Improvement Card */}
            <div className={`rounded-lg border-2 p-6 ${getScoreBgColor(newScore)}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    New ATS Score
                  </p>
                  <div className="flex items-baseline gap-3">
                    <span className={`text-4xl font-bold ${getScoreTextColor(newScore)}`}>
                      {newScore}
                    </span>
                    <span className="text-sm text-slate-600 dark:text-slate-400">/100</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Previous:</span>
                    <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                      {previousScore}
                    </span>
                  </div>
                  <div className={`text-2xl font-bold ${scoreImprovement > 0 ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-400'}`}>
                    {scoreImprovement > 0 ? '+' : ''}{scoreImprovement}
                    <span className="text-sm ml-1">({improvementPercentage}%)</span>
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="flex gap-2 mt-4">
                {isExcellent && (
                  <div className="inline-flex items-center gap-1 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-medium">
                    <CheckCircle size={16} />
                    Excellent Match
                  </div>
                )}
                {isGood && (
                  <div className="inline-flex items-center gap-1 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium">
                    <TrendingUp size={16} />
                    Good Match
                  </div>
                )}
              </div>
            </div>

            {/* Optimization Details */}
            <div className="grid grid-cols-2 gap-4">
              {/* Iterations */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Iterations Used
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {iterations}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Total: {totalIterations}
                </p>
              </div>

              {/* Plateau Status */}
              <div className={`p-4 rounded-lg border ${plateauDetected ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Status
                </p>
                <p className={`text-sm font-bold ${plateauDetected ? 'text-amber-700 dark:text-amber-300' : 'text-green-700 dark:text-green-300'}`}>
                  {plateauDetected ? 'Plateau Reached' : 'Optimizing Well'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {plateauDetected
                    ? 'Further optimization unlikely'
                    : 'Can optimize more'}
                </p>
              </div>
            </div>

            {/* Sections Optimized */}
            {sectionsOptimized.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                  <Zap size={16} className="text-amber-500" />
                  Sections Optimized
                </h3>
                <div className="space-y-2">
                  {sectionsOptimized.map((section, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                    >
                      <CheckCircle size={16} className="text-green-600 dark:text-green-400 flex-shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300 capitalize">
                        {section.replace(/_/g, ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {plateauDetected && (
              <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700">
                <div className="flex gap-3">
                  <AlertCircle size={20} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">
                      Plateau Detected
                    </p>
                    <p className="text-sm text-amber-800 dark:text-amber-300">
                      The resume has reached an optimization plateau. Further improvements would require gaining additional relevant experience or skills mentioned in the job description.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 font-medium transition-colors"
              >
                Close
              </button>
              {!plateauDetected && onOptimizeAgain && (
                <button
                  onClick={onOptimizeAgain}
                  disabled={isOptimizing}
                  className="flex-1 px-4 py-2 rounded-lg bg-green-600 dark:bg-green-700 text-white hover:bg-green-700 dark:hover:bg-green-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} />
                  Optimize Again
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
