'use client';

import { useState } from 'react';
import { AlertCircle, CheckCircle, TrendingUp, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import type { ATSAnalysisResult } from '@/store/resumeStore';

interface ATSAnalysisDisplayV2Props {
  analysis: ATSAnalysisResult | null;
  isLoading?: boolean;
  onOptimizeClick?: () => void;
}

/**
 * ATS Analysis Display Component V2
 * 
 * Shows:
 * - ATS Score (0-100) with visual gauge
 * - Strengths and weaknesses
 * - Weak sections with priority badges
 * - Missing keywords
 * - Optimization suggestions
 */
export const ATSAnalysisDisplayV2 = ({
  analysis,
  isLoading = false,
  onOptimizeClick
}: ATSAnalysisDisplayV2Props) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  if (!analysis && !isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <p className="text-gray-600">No analysis available. Analyze your resume against a job description to get started.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Analyzing your resume...</p>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  const score = analysis.ats_score;
  const scoreColor = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-yellow-600' : 'text-red-600';
  const scoreBgColor = score >= 80 ? 'bg-green-50' : score >= 60 ? 'bg-yellow-50' : 'bg-red-50';
  const scoreBorderColor = score >= 80 ? 'border-green-200' : score >= 60 ? 'border-yellow-200' : 'border-red-200';

  const toggleSection = (sectionKey: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionKey)) {
      newExpanded.delete(sectionKey);
    } else {
      newExpanded.add(sectionKey);
    }
    setExpandedSections(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* ATS Score Card */}
      <div className={`border rounded-lg p-6 ${scoreBorderColor} ${scoreBgColor}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">ATS Score</h3>
          <TrendingUp className={`w-6 h-6 ${scoreColor}`} />
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex-1">
            {/* Score Gauge */}
            <div className="mb-4">
              <div className="text-4xl font-bold mb-2">
                <span className={scoreColor}>{score}</span>
                <span className="text-2xl text-gray-600">/100</span>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    score >= 80 ? 'bg-green-600' : score >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${score}%` }}
                ></div>
              </div>
            </div>

            {/* Score Interpretation */}
            <p className="text-sm text-gray-700">
              {score >= 80 && "✅ Excellent match! Ready to apply."}
              {score >= 60 && score < 80 && "⚠️ Good match, but needs optimization."}
              {score < 60 && "❌ Significant gaps. Optimization recommended."}
            </p>
          </div>
        </div>
      </div>

      {/* Overall Analysis */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Analysis Summary</h3>
        <p className="text-gray-700 mb-4">{analysis.analysis.overall_match}</p>

        {/* Strengths */}
        {analysis.analysis.strengths.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium text-green-700 flex items-center space-x-2 mb-2">
              <CheckCircle className="w-4 h-4" />
              <span>Strengths</span>
            </h4>
            <ul className="space-y-1 ml-6">
              {analysis.analysis.strengths.map((strength, idx) => (
                <li key={idx} className="text-sm text-gray-700">• {strength}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses */}
        {analysis.analysis.weaknesses.length > 0 && (
          <div>
            <h4 className="font-medium text-red-700 flex items-center space-x-2 mb-2">
              <AlertCircle className="w-4 h-4" />
              <span>Weaknesses</span>
            </h4>
            <ul className="space-y-1 ml-6">
              {analysis.analysis.weaknesses.map((weakness, idx) => (
                <li key={idx} className="text-sm text-gray-700">• {weakness}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Weak Sections */}
      {analysis.weak_sections.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Sections to Optimize</h3>
          <div className="space-y-3">
            {analysis.weak_sections.map((section) => (
              <div
                key={section.section_key}
                className="border border-gray-200 rounded-lg overflow-hidden"
              >
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.section_key)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 text-left">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800">{section.section_name}</h4>
                      <p className="text-sm text-gray-600">{section.match_percentage}% match</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                        section.priority
                      )}`}
                    >
                      {section.priority.toUpperCase()}
                    </span>
                  </div>
                  {expandedSections.has(section.section_key) ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {/* Section Details */}
                {expandedSections.has(section.section_key) && (
                  <div className="px-4 py-4 bg-white border-t border-gray-200 space-y-4">
                    {/* Reason */}
                    <div>
                      <h5 className="font-medium text-gray-800 text-sm mb-1">Why it&apos;s weak:</h5>
                      <p className="text-sm text-gray-700">{section.reason}</p>
                    </div>

                    {/* Missing Keywords */}
                    {section.missing_keywords.length > 0 && (
                      <div>
                        <h5 className="font-medium text-gray-800 text-sm mb-2">Missing Keywords:</h5>
                        <div className="flex flex-wrap gap-2">
                          {section.missing_keywords.map((keyword, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium"
                            >
                              {keyword}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Suggestion */}
                    <div>
                      <h5 className="font-medium text-gray-800 text-sm mb-1">Suggestion:</h5>
                      <p className="text-sm text-gray-700">{section.suggestion}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Missing Keywords Summary */}
      {analysis.missing_keywords.length > 0 && (
        <div className="border border-gray-200 rounded-lg p-6 bg-blue-50">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <span>Key Terms to Add</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {analysis.missing_keywords.map((keyword, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-blue-200 text-blue-900 rounded-full text-sm font-medium"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Optimize Button */}
      {score < 90 && onOptimizeClick && (
        <button
          onClick={onOptimizeClick}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2"
        >
          <Zap className="w-5 h-5" />
          <span>Optimize to 80-90+</span>
        </button>
      )}

      {/* Already Optimized Message */}
      {score >= 90 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-800 font-medium">✅ Your resume is well-optimized for this job!</p>
        </div>
      )}
    </div>
  );
};

export default ATSAnalysisDisplayV2;
