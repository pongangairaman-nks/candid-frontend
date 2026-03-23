'use client';

import { FileText, AlertCircle, Save, Loader, CheckCircle, Info, Lightbulb } from 'lucide-react';
import { useResumeStore } from '@/store/resumeStore';
import { resumeApi, llmConfigApi, atsLLMApi, type LlmUsageTotals, type LlmUsageEntry } from '@/services/api';
import { LLMConfigSection } from '@/components/LLMConfigSection';
import { useState, useEffect, useRef, memo, useCallback } from 'react';

type TabType = 'llm' | 'template' | 'content' | 'prompts';

// Memoized LLM Config Section to prevent unnecessary re-renders
const MemoizedLLMConfigSection = memo(LLMConfigSection);

export default function ConfigurationPage() {
  const { masterDocument, setMasterDocument, error, setError } = useResumeStore();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('llm');
  const [masterContent, setMasterContent] = useState('');
  const [contentSaved, setContentSaved] = useState(false);
  const [contentLoading, setContentLoading] = useState(false);
  const [masterCoverLetter, setMasterCoverLetter] = useState('');
  const [coverLetterSaved, setCoverLetterSaved] = useState(false);
  const [coverLetterLoading, setCoverLetterLoading] = useState(false);
  const [masterResumePrompt, setMasterResumePrompt] = useState('');
  const [masterCoverLetterPrompt, setMasterCoverLetterPrompt] = useState('');
  const [promptsSaved, setPromptsSaved] = useState(false);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [dataFetched, setDataFetched] = useState(false);
  const fetchAbortRef = useRef<AbortController | null>(null);
  const [usageTotals, setUsageTotals] = useState<LlmUsageTotals | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [usageEntries, setUsageEntries] = useState<LlmUsageEntry[]>([]);
  const fetchInitiatedRef = useRef(false);

  const fetchUsage = async () => {
    console.log('📡 [ConfigurationPage] fetchUsage called');
    try {
      setUsageLoading(true);
      const usage = await atsLLMApi.usage();
      console.log('✅ [ConfigurationPage] Usage fetched');
      setUsageTotals(usage.totals);
      setUsageEntries(Array.isArray(usage.usage) ? usage.usage : []);
    } catch (err) {
      console.error('❌ [ConfigurationPage] Error fetching usage:', err);
    } finally {
      setUsageLoading(false);
    }
  };

  // Consolidated fetch on page load only (skip llmConfig since LLMConfigSection handles it)
  useEffect(() => {
    console.log('🔍 [ConfigurationPage] fetchAllData effect triggered, initiated:', fetchInitiatedRef.current);
    if (fetchInitiatedRef.current) {
      console.log('⏭️ [ConfigurationPage] Skipping fetchAllData - already initiated');
      return;
    }

    const fetchAllData = async () => {
      console.log('📡 [ConfigurationPage] Starting fetchAllData...');
      try {
        // Abort previous requests if any
        if (fetchAbortRef.current) {
          console.log('🛑 [ConfigurationPage] Aborting previous requests');
          fetchAbortRef.current.abort();
        }
        fetchAbortRef.current = new AbortController();

        // Fetch master templates and config in parallel
        // Note: LLMConfigSection handles llmConfig fetch, so we only fetch templates here
        console.log('📦 [ConfigurationPage] Fetching master templates and config...');
        const [masterTemplateRes, masterCoverLetterRes, llmConfigRes] = await Promise.all([
          resumeApi.getMasterTemplate(),
          resumeApi.getMasterCoverLetterTemplate(),
          llmConfigApi.getConfig(),
        ]);

        console.log('✅ [ConfigurationPage] All data fetched successfully');
        setMasterDocument(masterTemplateRes.latexCode);
        setMasterCoverLetter(masterCoverLetterRes.latexCode);
        
        // Prefill master content if it exists
        if (llmConfigRes.master_content) {
          setMasterContent(llmConfigRes.master_content);
        }
        
        // Prefill master prompts if they exist
        if (llmConfigRes.master_resume_prompt) {
          setMasterResumePrompt(llmConfigRes.master_resume_prompt);
        }
        if (llmConfigRes.master_cover_letter_prompt) {
          setMasterCoverLetterPrompt(llmConfigRes.master_cover_letter_prompt);
        }
        
        setError(null);

        // Fetch LLM ATS usage (latest resume by default)
        console.log('📊 [ConfigurationPage] Fetching LLM ATS usage...');
        await fetchUsage();
        setDataFetched(true);
      } catch (err) {
        console.error('❌ [ConfigurationPage] Failed to fetch initial data:', err);
        setDataFetched(true);
      }
    };

    fetchInitiatedRef.current = true;
    console.log('🚀 [ConfigurationPage] Setting fetchInitiatedRef to true');
    fetchAllData();

    // Cleanup on unmount
    return () => {
      if (fetchAbortRef.current) {
        console.log('🧹 [ConfigurationPage] Cleanup: Aborting requests on unmount');
        fetchAbortRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    if (!masterDocument.trim()) {
      setError('Please paste LaTeX code before saving');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await resumeApi.saveMasterTemplate(masterDocument);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save master template';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveMasterContent = async () => {
    if (!masterContent.trim()) {
      setError('Please paste content before saving');
      return;
    }

    setContentLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

      const response = await fetch(`${API_BASE_URL}/llm/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          master_content: masterContent,
        }),
      });

      if (response.ok) {
        setContentSaved(true);
        setTimeout(() => setContentSaved(false), 3000);
      } else {
        const error = await response.json();
        setError(error.error || 'Failed to save master content');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save master content';
      setError(errorMessage);
    } finally {
      setContentLoading(false);
    }
  };

  const handleSaveMasterCoverLetter = async () => {
    if (!masterCoverLetter.trim()) {
      setError('Please paste LaTeX code before saving');
      return;
    }

    setCoverLetterLoading(true);
    setError(null);

    try {
      await resumeApi.saveMasterCoverLetterTemplate(masterCoverLetter);
      setCoverLetterSaved(true);
      setTimeout(() => setCoverLetterSaved(false), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save master cover letter template';
      setError(errorMessage);
    } finally {
      setCoverLetterLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-auto">
      {/* Header */}
      <div className="px-6 md:px-8 py-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Configuration</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Configure your LLM provider and master resume template
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="px-6 md:px-8 flex gap-8">
          <button
            onClick={() => setActiveTab('llm')}
            className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'llm'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            LLM Configuration
          </button>
          <button
            onClick={() => setActiveTab('prompts')}
            className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'prompts'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Master Prompts
          </button>
          <button
            onClick={() => setActiveTab('template')}
            className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'template'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Master Template
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'content'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Master Content
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-6 md:p-8 overflow-auto">
        {/* LLM Configuration Tab */}
        {activeTab === 'llm' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <MemoizedLLMConfigSection />

            <div className="mt-6 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">LLM ATS Usage</h3>
              <button
                onClick={fetchUsage}
                disabled={usageLoading}
                className="px-3 py-1.5 text-sm rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
              >
                {usageLoading ? 'Refreshing…' : 'Refresh'}
              </button>
            </div>
            <div className="mt-3 grid grid-cols-5 gap-4">
              <div className="col-span-5 md:col-span-1 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                <div className="text-xs text-slate-500 dark:text-slate-400">Total Calls</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{usageLoading ? '—' : (usageTotals?.total_calls ?? 0)}</div>
              </div>
              <div className="col-span-5 md:col-span-1 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                <div className="text-xs text-slate-500 dark:text-slate-400">Analysis Calls</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{usageLoading ? '—' : (usageTotals?.analysis_calls ?? 0)}</div>
              </div>
              <div className="col-span-5 md:col-span-1 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                <div className="text-xs text-slate-500 dark:text-slate-400">Rescore Calls</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{usageLoading ? '—' : (usageTotals?.rescore_calls ?? 0)}</div>
              </div>
              <div className="col-span-5 md:col-span-1 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                <div className="text-xs text-slate-500 dark:text-slate-400">Total Latency</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{usageLoading ? '—' : `${Math.round((usageTotals?.total_latency_ms ?? 0) / 1000)}s`}</div>
              </div>
              <div className="col-span-5 md:col-span-1 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                <div className="text-xs text-slate-500 dark:text-slate-400">Stub Calls</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{usageLoading ? '—' : (usageTotals?.stub_calls ?? 0)}</div>
              </div>
            </div>

            {/* Recent Calls Table */}
            <div className="mt-6">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2">Recent Calls</h4>
              <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <th className="text-left px-4 py-2">Time</th>
                      <th className="text-left px-4 py-2">Phase</th>
                      <th className="text-left px-4 py-2">Provider / Model</th>
                      <th className="text-left px-4 py-2">Latency</th>
                      <th className="text-left px-4 py-2">Stub</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(usageEntries || []).slice().reverse().slice(0, 10).map((u, idx) => (
                      <tr key={`${u.ts}-${u.phase}-${idx}`} className="border-t border-slate-200 dark:border-slate-700">
                        <td className="px-4 py-2 text-slate-900 dark:text-slate-100">{new Date(u.ts).toLocaleString()}</td>
                        <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{u.phase}</td>
                        <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{u.provider}{u.model ? ` / ${u.model}` : ''}</td>
                        <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{typeof u.latency_ms === 'number' ? `${u.latency_ms} ms` : '—'}</td>
                        <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{u.stub ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                    {(!usageEntries || usageEntries.length === 0) && !usageLoading && (
                      <tr className="border-t border-slate-200 dark:border-slate-700">
                        <td className="px-4 py-3 text-slate-500 dark:text-slate-400" colSpan={5}>No usage recorded yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Master Template Tab */}
        {activeTab === 'template' && (
          <div className="space-y-6">
            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-6">
              {/* Master Resume Template Section */}
              <div>
                {/* <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Master Resume Template</h2> */}
                <div className="flex flex-col bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {/* Label */}
                  <div className="px-6 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Master Resume Template
                    </label>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {masterDocument.length > 0 && `${Math.round(masterDocument.length / 1024)} KB`}
                    </span>
                  </div>

                  {/* Textarea */}
                  <textarea
                    value={masterDocument}
                    onChange={(e) => {
                      setMasterDocument(e.target.value);
                      setError(null);
                    }}
                    placeholder="Paste your LaTeX resume template here. Example:&#10;&#10;\documentclass{article}&#10;\usepackage[utf8]{inputenc}&#10;...&#10;&#10;\begin{document}&#10;...&#10;\end{document}"
                    className="h-120 px-6 py-4 font-mono text-sm resize-none border-0 focus:outline-none focus:ring-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                  <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Paste your complete LaTeX resume template here. This will be prefilled in the Resume Creation section and can be edited after optimization.
                  </p>
                </div>
              </div>

              {/* Master Cover Letter Template Section */}
              <div>
                {/* <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Master Cover Letter Template</h2> */}
                <div className="flex flex-col bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {/* Label */}
                  <div className="px-6 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Master Cover Letter Template
                    </label>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {masterCoverLetter.length > 0 && `${Math.round(masterCoverLetter.length / 1024)} KB`}
                    </span>
                  </div>

                  {/* Textarea */}
                  <textarea
                    value={masterCoverLetter}
                    onChange={(e) => {
                      setMasterCoverLetter(e.target.value);
                      setError(null);
                    }}
                    placeholder="Paste your LaTeX cover letter template here. Example:&#10;&#10;\documentclass{article}&#10;\usepackage[utf8]{inputenc}&#10;...&#10;&#10;\begin{document}&#10;Dear Hiring Manager,&#10;...&#10;\end{document}"
                    className="h-120 px-6 py-4 font-mono text-sm resize-none border-0 focus:outline-none focus:ring-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                  <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Paste your complete LaTeX cover letter template here. This will be prefilled in the Cover Letter Creation section and can be edited after optimization.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
                <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Success Messages */}
            {isSaved && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex gap-3">
                <FileText size={18} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <p className="text-sm text-green-700 dark:text-green-300">Master resume template saved successfully!</p>
              </div>
            )}

            {coverLetterSaved && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex gap-3">
                <FileText size={18} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <p className="text-sm text-green-700 dark:text-green-300">Master cover letter template saved successfully!</p>
              </div>
            )}

            {/* Common Save Button */}
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (masterDocument.trim()) {
                    await handleSave();
                  }
                  if (masterCoverLetter.trim()) {
                    await handleSaveMasterCoverLetter();
                  }
                }}
                disabled={(!masterDocument.trim() && !masterCoverLetter.trim()) || isLoading || coverLetterLoading}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold transition-colors dark:disabled:bg-slate-700"
              >
                {isLoading || coverLetterLoading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save All Templates
                  </>
                )}
              </button>
              {(masterDocument || masterCoverLetter) && (
                <button
                  onClick={() => {
                    setMasterDocument('');
                    setMasterCoverLetter('');
                    setError(null);
                  }}
                  className="px-6 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 font-medium transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        )}

        {/* Master Content Tab */}
        {activeTab === 'content' && (
          <div className="space-y-6">
            <div>
              {/* <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Master Content</h2> */}
              <div className="flex flex-col bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Label */}
                <div className="px-6 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Master Content
                  </label>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {masterContent.length > 0 && `${masterContent.length} / 50000 characters`}
                  </span>
                </div>

                {/* Textarea */}
                <textarea
                  value={masterContent}
                  onChange={(e) => {
                    if (e.target.value.length <= 50000) {
                      setMasterContent(e.target.value);
                      setError(null);
                    }
                  }}
                  placeholder="Paste your comprehensive skills, experiences, projects, certifications, and achievements here. Include details not in your current resume. (Max 50KB)"
                  className="h-120 px-6 py-4 font-mono text-sm resize-none border-0 focus:outline-none focus:ring-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
              </div>

              {/* Info Box */}
              <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                <Lightbulb size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Tip:</strong> Include skills you haven&apos;t used recently, side projects, certifications, and detailed achievements with metrics. This helps the LLM find better matches for job descriptions.
                </p>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
                <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {contentSaved && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex gap-3">
                <CheckCircle size={18} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <p className="text-sm text-green-700 dark:text-green-300">Master content saved successfully!</p>
              </div>
            )}

            {/* Save and Clear Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleSaveMasterContent}
                disabled={!masterContent.trim() || contentLoading}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold transition-colors dark:disabled:bg-slate-700"
              >
                {contentLoading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Master Content
                  </>
                )}
              </button>
              {masterContent && (
                <button
                  onClick={() => {
                    setMasterContent('');
                    setError(null);
                  }}
                  className="px-6 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 font-medium transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Master Prompts Tab */}
        {activeTab === 'prompts' && (
          <div className="space-y-6">
            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-6">
              {/* Master Resume Prompt Section */}
              <div>
                <div className="flex flex-col bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {/* Label */}
                  <div className="px-6 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Master Resume Optmization Prompt
                    </label>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {masterResumePrompt.length > 0 && `${Math.round(masterResumePrompt.length / 1024)} KB`}
                    </span>
                  </div>

                  {/* Textarea */}
                  <textarea
                    value={masterResumePrompt}
                    onChange={(e) => {
                      setMasterResumePrompt(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter the default prompt for resume optimization. This will be used for all new jobs unless customized."
                    className="h-120 px-6 py-4 font-mono text-sm resize-none border-0 focus:outline-none focus:ring-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                  <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    This prompt will be prefilled for all new job applications and can be customized per job.
                  </p>
                </div>
              </div>

              {/* Master Cover Letter Prompt Section */}
              <div>
                <div className="flex flex-col bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {/* Label */}
                  <div className="px-6 py-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Master Cover Letter Optmization Prompt
                    </label>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {masterCoverLetterPrompt.length > 0 && `${Math.round(masterCoverLetterPrompt.length / 1024)} KB`}
                    </span>
                  </div>

                  {/* Textarea */}
                  <textarea
                    value={masterCoverLetterPrompt}
                    onChange={(e) => {
                      setMasterCoverLetterPrompt(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter the default prompt for cover letter generation. This will be used for all new jobs unless customized."
                    className="h-120 px-6 py-4 font-mono text-sm resize-none border-0 focus:outline-none focus:ring-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex gap-3">
                  <Info size={18} className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    This prompt will be prefilled for all new job applications and can be customized per job.
                  </p>
                </div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
                <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {promptsSaved && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex gap-3">
                <CheckCircle size={18} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                <p className="text-sm text-green-700 dark:text-green-300">Master prompts saved successfully!</p>
              </div>
            )}

            {/* Save and Clear Buttons */}
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!masterResumePrompt.trim() && !masterCoverLetterPrompt.trim()) {
                    setError('Please enter at least one prompt');
                    return;
                  }

                  setPromptsLoading(true);
                  setError(null);

                  try {
                    await llmConfigApi.updateConfig({
                      master_resume_prompt: masterResumePrompt || undefined,
                      master_cover_letter_prompt: masterCoverLetterPrompt || undefined,
                    });
                    setPromptsSaved(true);
                    setTimeout(() => setPromptsSaved(false), 3000);
                  } catch (err) {
                    const errorMessage = err instanceof Error ? err.message : 'Failed to save master prompts';
                    setError(errorMessage);
                  } finally {
                    setPromptsLoading(false);
                  }
                }}
                disabled={(!masterResumePrompt.trim() && !masterCoverLetterPrompt.trim()) || promptsLoading}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold transition-colors dark:disabled:bg-slate-700"
              >
                {promptsLoading ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Master Prompts
                  </>
                )}
              </button>
              {(masterResumePrompt || masterCoverLetterPrompt) && (
                <button
                  onClick={() => {
                    setMasterResumePrompt('');
                    setMasterCoverLetterPrompt('');
                    setError(null);
                  }}
                  className="px-6 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 font-medium transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
