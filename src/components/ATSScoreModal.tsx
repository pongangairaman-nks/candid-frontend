"use client";

import {
  X,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { useState } from "react";

interface ATSBreakdown {
  primaryKeywords: {
    matched: number;
    total: number;
    percentage: number;
    weight: number;
  };
  secondaryKeywords: {
    matched: number;
    total: number;
    percentage: number;
    weight: number;
  };
  matchingSkills: {
    matched: number;
    missing: number;
    total: number;
    percentage: number;
    weight: number;
  };
  formatQuality: {
    score: number;
    weight: number;
  };
  seniorityAlignment: {
    score: number;
    weight: number;
  };
}

interface ATSSuggestion {
  priority: "high" | "medium" | "low";
  category: string;
  message: string;
  impact: string;
}

interface DiagnosticData {
  current_ats_score: number;
  achievable_score_without_new_experience: number;
  score_gap: number;
  critical_gaps: Array<{
    gap: string;
    required_in_jd: boolean;
    present_in_resume: boolean;
    fixable: boolean;
    reason: string;
  }>;
  optimization_opportunities: Array<{
    section: string;
    current_content: string;
    issue: string;
    suggestion: string;
    impact_on_score: number;
  }>;
  content_gaps: Array<{
    gap: string;
    likely_present: string;
    not_mentioned: boolean;
    suggestion: string;
  }>;
  honest_assessment: {
    is_resume_fixable: boolean;
    reason: string;
    effort_required: "low" | "medium" | "high";
    realistic_outcome: string;
  };
  recommendations: Array<{
    priority: "critical" | "high" | "medium" | "low";
    action: string;
    expected_score_impact: number;
    effort: "low" | "medium" | "high";
  }>;
}

interface ATSScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOptimize?: () => void;
  atsData: {
    score: number;
    status: string;
    message: string;

    overview: string;

    score_breakdown: {
      keyword_match: number;
      experience_match: number;
      formatting: number;
      impact: number;
      overall: number;
    };

    primary_keywords: string[];
    secondary_keywords: string[];

    matching_skills: string[];
    missing_skills: string[];

    role_focus: string;
    seniority_level: string;

    experience_gaps: {
      issue: string;
      impact: string;
    }[];

    section_analysis: {
      section: string;
      feedback: string;
    }[];

    ats_tips: string[];
    improvement_suggestions?: {
      section: string;
      original: string;
      improved: string;
      reason: string;
    }[];

    breakdown?: ATSBreakdown; // keep old fallback
  } | null;
  diagnostic?: DiagnosticData | null;
  isLoading?: boolean;
  isOptimizing?: boolean;
  lastDelta?: number;
  lastSectionKey?: string;
}

export const ATSScoreModal = ({
  isOpen,
  onClose,
  onOptimize,
  atsData,
  diagnostic,
  isLoading = false,
  isOptimizing = false,
  lastDelta,
  lastSectionKey,
}: ATSScoreModalProps) => {
  // const tabArray = ["overview", "breakdown", "suggestions", "analysis"];
  const tabArray = diagnostic ? ["overview", "diagnostic", "analysis"] : ["overview", "analysis"];
  const [activeTab, setActiveTab] = useState<
    "overview" | "breakdown" | "suggestions" | "analysis" | "diagnostic"
  >("overview");
  console.log("atsData", atsData);
  console.log("diagnostic", diagnostic);
  if (!isOpen) return null;

  const getScoreColor = (score: number) => {
    if (score >= 85) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 50) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 85)
      return "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
    if (score >= 70)
      return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
    if (score >= 50)
      return "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800";
    return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    if (percentage >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const breakdown = atsData?.score_breakdown || null;

  const getMergedBreakdown = () => {
    if (!atsData) return null;

    // Use LLM if available, else fallback
    const ai = atsData.score_breakdown;

    if (ai) {
      return {
        primaryKeywords: {
          matched: Math.round((ai.keyword_match / 100) * 10),
          total: 10,
          percentage: ai.keyword_match,
          weight: 0.4,
        },
        secondaryKeywords: {
          matched: Math.round((ai.experience_match / 100) * 10),
          total: 10,
          percentage: ai.experience_match,
          weight: 0.25,
        },
        matchingSkills: {
          matched: Math.round((ai.impact / 100) * 10),
          missing: 0,
          total: 10,
          percentage: ai.impact,
          weight: 0.15,
        },
        formatQuality: {
          score: ai.formatting,
          weight: 0.1,
        },
        seniorityAlignment: {
          score: ai.experience_match,
          weight: 0.1,
        },
      };
    }

    return atsData.breakdown;
  };

  const breakdownData = getMergedBreakdown();

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
                <TrendingUp
                  size={48}
                  className="text-indigo-600 dark:text-indigo-400"
                />
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Analyzing your resume...
              </p>
            </div>
          </div>
        ) : atsData ? (
          <>
            {/* Score */}
            <div
              className={`m-6 p-6 rounded-lg border-2 ${getScoreBgColor(atsData.score)}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    ATS Score
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-5xl font-bold ${getScoreColor(atsData.score)}`}
                    >
                      {atsData.score}
                    </span>
                    <span className="text-xl text-slate-600 dark:text-slate-400">
                      /100
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {atsData.message}
              </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 px-6">
              {tabArray.map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === tab
                        ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                        : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ),
              )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Overview */}
              {activeTab === 'overview' && (
              <div className="space-y-5">
  
                {/* AI Overview */}
                {atsData.overview && (
                  <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {atsData.overview}
                    </p>
                  </div>
                )}
  
                {/* Missing Skills */}
                {atsData.missing_skills?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Missing Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {atsData.missing_skills.slice(0, 10).map((s, i) => (
                        <span key={i} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
  
                {/* Matching Skills */}
                {atsData.matching_skills?.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Matching Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {atsData.matching_skills.slice(0, 10).map((s, i) => (
                        <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

              {/* Breakdown */}
              {activeTab === "breakdown" && breakdownData && (
                <div className="space-y-5">

                  {[
                    ["Primary Keywords", breakdownData.primaryKeywords, "from-indigo-500 to-indigo-400"],
                    ["Secondary Keywords", breakdownData.secondaryKeywords, "from-violet-500 to-violet-400"],
                    ["Matching Skills", breakdownData.matchingSkills, "from-blue-500 to-blue-400"],
                  ].map(([label, data, gradient]: any, idx) => {
                    const percentage = Math.round(data?.percentage || 0);

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-slate-800 dark:text-slate-200">
                              {label}
                            </span>
                            <span className="text-xs text-slate-500">
                              {percentage}%
                            </span>
                          </div>

                          <span className="text-xs text-slate-500">
                            {data?.matched}/{data?.total}
                          </span>
                        </div>

                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Format Quality */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-slate-800 dark:text-slate-200">
                          Format Quality
                        </span>
                        <span className="text-xs text-slate-500">
                          {Math.round(breakdownData.formatQuality?.score || 0)}%
                        </span>
                      </div>

                      <span className="text-xs text-slate-500">
                        {Math.round(breakdownData.formatQuality?.score || 0)}/100
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-500"
                        style={{
                          width: `${breakdownData.formatQuality?.score || 0}%`,
                        }}
                      />
                    </div>
                  </div>

                </div>
              )}

              {/* Suggestions */}
              {activeTab === "suggestions" && (
                <div className="space-y-5">
                  {/* Primary Keywords */}
                  {atsData.primary_keywords?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-slate-800 dark:text-slate-200">
                        Must-have Keywords
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {atsData.primary_keywords.slice(0, 12).map((k, i) => (
                          <span
                            key={i}
                            className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing Skills (Actionable) */}
                  {atsData.missing_skills?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-red-600">
                        Add these to improve score
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {atsData.missing_skills.slice(0, 10).map((k, i) => (
                          <span
                            key={i}
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tips (if available) */}
                  {atsData.ats_tips?.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold mb-2 text-yellow-600">
                        Quick Improvements
                      </h4>
                      <ul className="space-y-2">
                        {atsData.ats_tips.slice(0, 3).map((tip, i) => (
                          <li
                            key={i}
                            className="text-sm text-slate-700 dark:text-slate-300 flex gap-2"
                          >
                            <span className="text-yellow-500">•</span>
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Diagnostic */}
              {activeTab === "diagnostic" && diagnostic && (
                <div className="space-y-6">
                  {/* Score Summary */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Current Score</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{diagnostic.current_ats_score}/100</p>
                    </div>
                    <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Achievable Max</p>
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{diagnostic.achievable_score_without_new_experience}/100</p>
                    </div>
                    <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Gap</p>
                      <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{diagnostic.score_gap}</p>
                    </div>
                  </div>

                  {/* Honest Assessment */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start gap-3">
                      {diagnostic.honest_assessment.is_resume_fixable ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" />
                      )}
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                          {diagnostic.honest_assessment.is_resume_fixable ? "Resume Can Be Improved" : "Limited Improvement Possible"}
                        </h4>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-2">{diagnostic.honest_assessment.reason}</p>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                          Realistic Outcome: <span className="text-slate-900 dark:text-white">{diagnostic.honest_assessment.realistic_outcome}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Critical Gaps */}
                  {diagnostic.critical_gaps.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        Critical Gaps
                      </h4>
                      <div className="space-y-2">
                        {diagnostic.critical_gaps.map((gap, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                            <p className="font-medium text-red-900 dark:text-red-200 text-sm">{gap.gap}</p>
                            <p className="text-xs text-red-700 dark:text-red-300 mt-1">{gap.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {diagnostic.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-slate-900 dark:text-white mb-3">Top Recommendations</h4>
                      <div className="space-y-2">
                        {diagnostic.recommendations.slice(0, 5).map((rec, idx) => (
                          <div key={idx} className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="font-medium text-slate-900 dark:text-white text-sm">{rec.action}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                  Impact: +{rec.expected_score_impact} points | Effort: {rec.effort}
                                </p>
                              </div>
                              <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${
                                rec.priority === 'critical' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                                rec.priority === 'high' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                                rec.priority === 'medium' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                                'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              }`}>
                                {rec.priority}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Analysis */}
              {activeTab === "analysis" && (
                <div className="space-y-4">
                  {atsData.section_analysis.slice(0, 5).map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800"
                    >
                      <h4 className="font-semibold text-indigo-600 mb-1">
                        {item.section}
                      </h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-5">
                        {item.feedback}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 font-medium"
              >
                Close
              </button>
              {onOptimize && (
                <button
                  onClick={() => {
                    onOptimize();
                    onClose();
                  }}
                  disabled={isOptimizing || (atsData?.score !== undefined && atsData.score < 50)}
                  title={
                    atsData?.score && atsData.score < 50 
                      ? 'Score below 50 - Please update your resume with relevant information to optimize'
                      : diagnostic
                      ? `Optimize (Max achievable: ${diagnostic.achievable_score_without_new_experience}/100)`
                      : 'Optimize Resume'
                  }
                  className="inline-flex items-center space-x-2 px-6 py-2 rounded-lg bg-linear-to-r from-emerald-600 to-teal-600 text-white font-medium hover:shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <Zap className="w-4 h-4" />
                  <span>
                    {isOptimizing ? 'Optimizing...' : diagnostic ? `Optimize (Max: ${diagnostic.achievable_score_without_new_experience})` : 'Optimize Resume'}
                  </span>
                </button>
              )}
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
