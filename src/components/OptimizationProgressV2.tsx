'use client';

import { useEffect, useState } from 'react';
import { Zap, TrendingUp, CheckCircle } from 'lucide-react';

interface OptimizationHistoryItem {
  iteration: number;
  score: number;
  weak_sections: number;
  timestamp: string;
}

interface OptimizationProgressV2Props {
  isOptimizing: boolean;
  currentIteration?: number;
  maxIterations?: number;
  history?: OptimizationHistoryItem[];
  targetScore?: number;
}

/**
 * Optimization Progress Component V2
 * 
 * Shows:
 * - Current iteration progress
 * - Score improvement over iterations
 * - Weak sections count
 * - Target score indicator
 */
export const OptimizationProgressV2 = ({
  isOptimizing,
  currentIteration = 0,
  maxIterations = 3,
  history = [],
  targetScore = 90
}: OptimizationProgressV2Props) => {
  const [displayedHistory, setDisplayedHistory] = useState<OptimizationHistoryItem[]>([]);

  useEffect(() => {
    setDisplayedHistory(history);
  }, [history]);

  if (!isOptimizing && displayedHistory.length === 0) {
    return null;
  }

  const latestScore = displayedHistory.length > 0 ? displayedHistory[displayedHistory.length - 1].score : 0;
  const initialScore = displayedHistory.length > 0 ? displayedHistory[0].score : 0;
  const improvement = latestScore - initialScore;
  const targetReached = latestScore >= targetScore;
  const scoreColor =
    latestScore >= targetScore
      ? 'text-green-600'
      : latestScore >= 60
      ? 'text-yellow-600'
      : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Current Status */}
      {isOptimizing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-600 animate-pulse" />
              <span>Optimizing Resume</span>
            </h3>
            <span className="text-sm font-medium text-blue-700">
              Iteration {currentIteration} of {maxIterations}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-blue-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-500"
              style={{ width: `${(currentIteration / maxIterations) * 100}%` }}
            ></div>
          </div>

          {/* Status Message */}
          <p className="text-sm text-blue-700 mt-3">
            {currentIteration === 1 && "Analyzing your resume..."}
            {currentIteration === 2 && "Optimizing weak sections..."}
            {currentIteration === 3 && "Final optimization pass..."}
            {currentIteration > 3 && "Finalizing..."}
          </p>
        </div>
      )}

      {/* Optimization History */}
      {displayedHistory.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span>Optimization Progress</span>
          </h3>

          {/* Score Timeline */}
          <div className="space-y-4">
            {displayedHistory.map((item, idx) => {
              const isLatest = idx === displayedHistory.length - 1;
              const scoreColor =
                item.score >= targetScore
                  ? 'text-green-600'
                  : item.score >= 60
                  ? 'text-yellow-600'
                  : 'text-red-600';

              return (
                <div key={item.iteration} className="flex items-start space-x-4">
                  {/* Timeline Dot */}
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isLatest
                          ? 'bg-green-600 ring-2 ring-green-300'
                          : 'bg-gray-400'
                      }`}
                    ></div>
                    {idx < displayedHistory.length - 1 && (
                      <div className="w-0.5 h-12 bg-gray-300 my-1"></div>
                    )}
                  </div>

                  {/* Iteration Details */}
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800">
                        Iteration {item.iteration}
                      </h4>
                      <span className={`text-2xl font-bold ${scoreColor}`}>
                        {item.score}
                        <span className="text-sm text-gray-600">/100</span>
                      </span>
                    </div>

                    {/* Score Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          item.score >= targetScore
                            ? 'bg-green-600'
                            : item.score >= 60
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }`}
                        style={{ width: `${item.score}%` }}
                      ></div>
                    </div>

                    {/* Details */}
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>{item.weak_sections} weak sections</span>
                      {idx > 0 && (
                        <span className="text-green-600 font-medium">
                          +{item.score - displayedHistory[idx - 1].score} points
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Target Reached Badge */}
                  {isLatest && item.score >= targetScore && (
                    <div className="flex items-center space-x-1 text-green-600">
                      <CheckCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Target</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Summary Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Initial Score</p>
              <p className="text-2xl font-bold text-gray-800">{initialScore}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Current Score</p>
              <p className={`text-2xl font-bold ${scoreColor}`}>{latestScore}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-1">Improvement</p>
              <p className="text-2xl font-bold text-green-600">
                +{improvement}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Target Reached Message */}
      {!isOptimizing && targetReached && displayedHistory.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Target Score Reached! 🎉
          </h3>
          <p className="text-green-700">
            Your resume is now optimized with a score of {latestScore}/100.
            You&apos;re ready to apply!
          </p>
        </div>
      )}

      {/* Plateau Detected Message */}
      {!isOptimizing && !targetReached && displayedHistory.length > 1 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ℹ️ Optimization stopped due to score plateau. Your resume is at {latestScore}/100.
          </p>
        </div>
      )}
    </div>
  );
};

export default OptimizationProgressV2;
