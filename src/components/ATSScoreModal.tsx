'use client';

import { X, TrendingUp, AlertCircle, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { useState } from 'react';

interface ATSBreakdown {
  primary_keywords: {
    matched: number;
    total: number;
    percentage: number;
    weight: number;
  };
  secondary_keywords: {
    matched: number;
    total: number;
    percentage: number;
    weight: number;
  };
  matching_skills: {
    matched: number;
    missing: number;
    total: number;
    percentage: number;
    weight: number;
  };
  format_quality: {
    score: number;
    weight: number;
  };
  seniority_alignment: {
    score: number;
    weight: number;
  };
}

interface ATSSuggestion {
  priority: 'high' | 'medium' | 'low';
  category: string;
  message: string;
  impact: string;
}

interface ATSScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  atsData: {
    score: number;
    status: string;
    message: string;
    breakdown: ATSBreakdown;
    suggestions: ATSSuggestion[];
    tips: string[];
    gaps: string[];
  } | null;
  isLoading?: boolean;
  lastDelta?: number;
}

export const ATSScoreModal = ({ isOpen, onClose, atsData, isLoading = false, lastDelta }: ATSScoreModalProps) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'breakdown' | 'suggestions'>('overview');

  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600 dark:text-green-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 50) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85) return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    if (score >= 70) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    if (score >= 50) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-linear-to-r from-indigo-600 to-indigo-700 dark:from-indigo-900 dark:to-indigo-800 px-6 py-4 flex justify-between items-center border-b border-indigo-700 dark:border-indigo-600">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp size={24} />
            ATS Score Analysis
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-indigo-700 dark:hover:bg-indigo-600 p-1 rounded transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin mb-4">
                <TrendingUp size={48} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-slate-600 dark:text-slate-400">Analyzing your resume...</p>
            </div>
          </div>
        ) : atsData ? (
          <>
            {/* Score Display */}
            <div className={`m-6 p-6 rounded-lg border-2 ${getScoreBgColor(atsData.score)}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">ATS Score</p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-bold ${getScoreColor(atsData.score)}`}>
                      {atsData.score}
                    </span>
                    <span className="text-xl text-slate-600 dark:text-slate-400">/100</span>
                    {typeof lastDelta === 'number' && (
                      <span className={`ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${lastDelta > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : lastDelta < 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'}`}>
                        {lastDelta > 0 ? `+${lastDelta}` : `${lastDelta}`}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {atsData.status === 'pass' && (
                    <CheckCircle size={48} className="text-green-600 dark:text-green-400" />
                  )}
                  {atsData.status === 'review' && (
                    <AlertTriangle size={48} className="text-yellow-600 dark:text-yellow-400" />
                  )}
                  {atsData.status === 'fail' && (
                    <AlertCircle size={48} className="text-red-600 dark:text-red-400" />
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">{atsData.message}</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 px-6 pt-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('breakdown')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'breakdown'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                Breakdown
              </button>
              <button
                onClick={() => setActiveTab('suggestions')}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'suggestions'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
                }`}
              >
                Suggestions
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6 space-y-4">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {atsData.tips && atsData.tips.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <Zap size={18} className="text-yellow-500" />
                        Optimization Tips
                      </h3>
                      <ul className="space-y-2">
                        {atsData.tips.map((tip, idx) => (
                          <li key={idx} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <span className="text-indigo-600 dark:text-indigo-400 font-bold">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {atsData.gaps && atsData.gaps.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <AlertCircle size={18} className="text-orange-500" />
                        Experience Gaps
                      </h3>
                      <ul className="space-y-2">
                        {atsData.gaps.map((gap, idx) => (
                          <li key={idx} className="flex gap-2 text-sm text-slate-700 dark:text-slate-300">
                            <span className="text-orange-600 dark:text-orange-400 font-bold">•</span>
                            {gap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Breakdown Tab */}
              {activeTab === 'breakdown' && (
                <div className="space-y-4">
                  {/* Primary Keywords */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                        Primary Keywords (40%)
                      </h4>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        {atsData.breakdown.primary_keywords.matched}/{atsData.breakdown.primary_keywords.total}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(atsData.breakdown.primary_keywords.percentage)}`}
                        style={{ width: `${atsData.breakdown.primary_keywords.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {Math.round(atsData.breakdown.primary_keywords.percentage)}% matched
                    </p>
                  </div>

                  {/* Secondary Keywords */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                        Secondary Keywords (25%)
                      </h4>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        {atsData.breakdown.secondary_keywords.matched}/{atsData.breakdown.secondary_keywords.total}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(atsData.breakdown.secondary_keywords.percentage)}`}
                        style={{ width: `${atsData.breakdown.secondary_keywords.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {Math.round(atsData.breakdown.secondary_keywords.percentage)}% matched
                    </p>
                  </div>

                  {/* Matching Skills */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                        Matching Skills (15%)
                      </h4>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        {atsData.breakdown.matching_skills.matched}/{atsData.breakdown.matching_skills.total}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(atsData.breakdown.matching_skills.percentage)}`}
                        style={{ width: `${atsData.breakdown.matching_skills.percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {Math.round(atsData.breakdown.matching_skills.percentage)}% matched
                    </p>
                  </div>

                  {/* Format Quality */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                        Format Quality (10%)
                      </h4>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        {Math.round(atsData.breakdown.format_quality.score)}/100
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(atsData.breakdown.format_quality.score)}`}
                        style={{ width: `${atsData.breakdown.format_quality.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Seniority Alignment */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                        Seniority Alignment (10%)
                      </h4>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        {Math.round(atsData.breakdown.seniority_alignment.score)}/100
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${getProgressColor(atsData.breakdown.seniority_alignment.score)}`}
                        style={{ width: `${atsData.breakdown.seniority_alignment.score}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestions Tab */}
              {activeTab === 'suggestions' && (
                <div className="space-y-3">
                  {atsData.suggestions && atsData.suggestions.length > 0 ? (
                    atsData.suggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-lg border-l-4 ${
                          suggestion.priority === 'high'
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
                            : suggestion.priority === 'medium'
                              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500'
                              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-500'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                                  suggestion.priority === 'high'
                                    ? 'bg-red-200 dark:bg-red-900 text-red-800 dark:text-red-200'
                                    : suggestion.priority === 'medium'
                                      ? 'bg-yellow-200 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200'
                                      : 'bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                                }`}
                              >
                                {suggestion.priority}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {suggestion.category}
                              </span>
                            </div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                              {suggestion.message}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                              Impact: {suggestion.impact}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-600 dark:text-slate-400 py-8">
                      No suggestions at this time. Your resume is well-optimized!
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <div className="p-6 text-center text-slate-600 dark:text-slate-400">
            No ATS data available
          </div>
        )}
      </div>
    </div>
  );
};
