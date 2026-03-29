'use client';

import { FileText, AlertCircle, Save, Loader, CheckCircle, Info, Lightbulb, Copy, Check } from 'lucide-react';
import { useResumeStore } from '@/store/resumeStore';
import { resumeApi, llmConfigApi, atsLLMApi, resumeSectionsApi, type LlmUsageTotals, type LlmUsageEntry } from '@/services/api';
import { LLMConfigSection } from '@/components/LLMConfigSection';
import { MasterContentAccordion, type ContentSection } from '@/components/MasterContentAccordion';
import { useState, useEffect, useRef, memo, useCallback } from 'react';

type TabType = 'llm' | 'template' | 'content' | 'prompts' | 'usage';

// Memoized LLM Config Section to prevent unnecessary re-renders
const MemoizedLLMConfigSection = memo(LLMConfigSection);

export default function ConfigurationPage() {
  const { masterDocument, setMasterDocument, error, setError } = useResumeStore();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('llm');
  const [masterContentSections, setMasterContentSections] = useState<ContentSection[]>([]);
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
  const [copiedPrompt, setCopiedPrompt] = useState<'resume' | 'coverLetter' | null>(null);
  const [copiedContent, setCopiedContent] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState<'resume' | 'coverLetter' | null>(null);

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

        // Fetch master templates, config, and sections in parallel
        // Note: LLMConfigSection handles llmConfig fetch, so we only fetch templates here
        console.log('📦 [ConfigurationPage] Fetching master templates, config, and sections...');
        const [masterTemplateRes, masterCoverLetterRes, llmConfigRes, sectionsRes] = await Promise.all([
          resumeApi.getMasterTemplate(),
          resumeApi.getMasterCoverLetterTemplate(),
          llmConfigApi.getConfig(),
          resumeSectionsApi.getSections(),
        ]);

        console.log('✅ [ConfigurationPage] All data fetched successfully');
        setMasterDocument(masterTemplateRes.latexCode);
        setMasterCoverLetter(masterCoverLetterRes.latexCode);
        
        // Initialize master content sections from backend sections
        if (sectionsRes.sections && sectionsRes.sections.length > 0) {
          console.log('📋 [ConfigurationPage] Initializing sections from backend:', sectionsRes.sections.map((s) => s.name));
          
          // Create content sections from backend sections
          const masterContentMap = typeof llmConfigRes.masterContent === 'object' && llmConfigRes.masterContent !== null
            ? (llmConfigRes.masterContent as unknown as Record<string, string>)
            : {};
          
          const contentSections: ContentSection[] = sectionsRes.sections.map((section, idx) => ({
            id: `section-${idx}`,
            title: section.name,
            content: masterContentMap[section.name] || '',
          }));
          
          setMasterContentSections(contentSections);
        } else if (llmConfigRes.masterContent && Array.isArray(llmConfigRes.masterContent)) {
          // Fallback to existing master content if no sections found
          console.log('⚠️ [ConfigurationPage] No sections found, using existing master content');
          setMasterContentSections(llmConfigRes.masterContent);
        }
        
        // Prefill master prompts if they exist
        if (llmConfigRes.masterResumePrompt) {
          setMasterResumePrompt(llmConfigRes.masterResumePrompt);
        }
        if (llmConfigRes.masterCoverLetterPrompt) {
          setMasterCoverLetterPrompt(llmConfigRes.masterCoverLetterPrompt);
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
      
      // After saving, fetch the updated sections from backend
      console.log('📋 [ConfigurationPage] Fetching updated sections after resume save...');
      const sectionsRes = await resumeSectionsApi.getSections();
      
      if (sectionsRes.sections && sectionsRes.sections.length > 0) {
        console.log('✅ [ConfigurationPage] Updated sections from backend:', sectionsRes.sections.map((s) => s.name));
        
        // Get current master content to preserve any existing content
        const masterContentMap = typeof masterContentSections === 'object' && masterContentSections !== null
          ? masterContentSections.reduce((acc, section) => {
              acc[section.title] = section.content;
              return acc;
            }, {} as Record<string, string>)
          : {};
        
        // Create new content sections based on updated resume sections
        const contentSections: ContentSection[] = sectionsRes.sections.map((section, idx) => ({
          id: `section-${idx}`,
          title: section.name,
          content: masterContentMap[section.name] || '', // Keep existing content if available
        }));
        
        setMasterContentSections(contentSections);
        console.log('✅ [ConfigurationPage] Master content sections updated to match resume sections');
      }
      
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
    if (masterContentSections?.length === 0 || !masterContentSections?.some((s: ContentSection) => s.content.trim())) {
      setError('Please add content to at least one section before saving');
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
          masterContent: masterContentSections,
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

  console.log('masterContentSections', masterContentSections);
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 md:px-8 py-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shrink-0">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Configuration</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Configure your LLM provider and master resume template
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
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
            onClick={() => setActiveTab('usage')}
            className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'usage'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            LLM Usage
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
      <div className="flex-1 flex flex-col p-6 md:p-8 overflow-auto min-h-0">
        {/* LLM Configuration Tab */}
        {activeTab === 'llm' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <MemoizedLLMConfigSection />
          </div>
        )}

        {/* LLL ATS Usage Tab */}
        {activeTab === 'usage' && (
          <div className="space-y-6  h-full flex flex-col">
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
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{usageLoading ? '—' : (usageTotals?.totalCalls ?? 0)}</div>
              </div>
              <div className="col-span-5 md:col-span-1 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                <div className="text-xs text-slate-500 dark:text-slate-400">Analysis Calls</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{usageLoading ? '—' : (usageTotals?.analysisCalls ?? 0)}</div>
              </div>
              <div className="col-span-5 md:col-span-1 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                <div className="text-xs text-slate-500 dark:text-slate-400">Rescore Calls</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{usageLoading ? '—' : (usageTotals?.rescoreCalls ?? 0)}</div>
              </div>
              <div className="col-span-5 md:col-span-1 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                <div className="text-xs text-slate-500 dark:text-slate-400">Total Latency</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{usageLoading ? '—' : `${Math.round((usageTotals?.totalLatencyMs ?? 0) / 1000)}s`}</div>
              </div>
              <div className="col-span-5 md:col-span-1 p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                <div className="text-xs text-slate-500 dark:text-slate-400">Stub Calls</div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{usageLoading ? '—' : (usageTotals?.stubCalls ?? 0)}</div>
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
                        <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{typeof u.latencyMs === 'number' ? `${u.latencyMs} ms` : '—'}</td>
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

        {/* Master Prompts Tab */}
        {activeTab === 'prompts' && (
          <div className="space-y-6  h-full flex flex-col">
            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-6 h-full flex-1">
              {/* Master Resume Prompt Section */}
              <div className="flex flex-col min-h-0 h-full">
                <div className="flex flex-col bg-white rounded-xl border border-gray-200/50 shadow-sm overflow-hidden min-h-0 h-full">
                  {/* Header */}
                  <div className="border-b border-gray-200/50 bg-gray-50/50 px-4 py-3 flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Master Resume Prompt</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Default optimization instructions</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(masterResumePrompt);
                        setCopiedPrompt('resume');
                        setTimeout(() => setCopiedPrompt(null), 2000);
                      }}
                      className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors shrink-0"
                      title="Copy prompt"
                    >
                      {copiedPrompt === 'resume' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>

                  {/* Textarea */}
                  <textarea
                    value={masterResumePrompt}
                    onChange={(e) => {
                      setMasterResumePrompt(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter the default prompt for resume optimization..."
                    className="flex-1 px-4 py-4 border-none focus:outline-none resize-none font-mono text-sm text-gray-700 bg-white placeholder:text-gray-400 min-h-0"
                  />

                  {/* Footer */}
                  <div className="border-t border-gray-200/50 bg-gray-50/50 px-4 py-2 text-xs text-gray-500 shrink-0">
                    <p>Characters: {masterResumePrompt.length}</p>
                  </div>
                </div>
              </div>

              {/* Master Cover Letter Prompt Section */}
              <div className="flex flex-col min-h-0 h-full">
                <div className="flex flex-col bg-white rounded-xl border border-gray-200/50 shadow-sm overflow-hidden min-h-0 h-full">
                  {/* Header */}
                  <div className="border-b border-gray-200/50 bg-gray-50/50 px-4 py-3 flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Master Cover Letter Prompt</h3>
                      <p className="text-xs text-gray-500 mt-0.5">Default generation instructions</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(masterCoverLetterPrompt);
                        setCopiedPrompt('coverLetter');
                        setTimeout(() => setCopiedPrompt(null), 2000);
                      }}
                      className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors shrink-0"
                      title="Copy prompt"
                    >
                      {copiedPrompt === 'coverLetter' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>

                  {/* Textarea */}
                  <textarea
                    value={masterCoverLetterPrompt}
                    onChange={(e) => {
                      setMasterCoverLetterPrompt(e.target.value);
                      setError(null);
                    }}
                    placeholder="Enter the default prompt for cover letter generation..."
                    className="flex-1 px-4 py-4 border-none focus:outline-none resize-none font-mono text-sm text-gray-700 bg-white placeholder:text-gray-400 min-h-0"
                  />

                  {/* Footer */}
                  <div className="border-t border-gray-200/50 bg-gray-50/50 px-4 py-2 text-xs text-gray-500 shrink-0">
                    <p>Characters: {masterCoverLetterPrompt.length}</p>
                  </div>
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
                      masterResumePrompt: masterResumePrompt || undefined,
                      masterCoverLetterPrompt: masterCoverLetterPrompt || undefined,
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
        
        {/* Master Template Tab */}
        {activeTab === 'template' && (
          <div className="flex flex-col min-h-0 h-full">
            {/* Two Column Layout */}
            <div className="grid grid-cols-2 gap-6 min-h-0 h-full">
              {/* Master Resume Template Section */}
              <div className="flex flex-col min-h-0 h-full">
                <div className="flex flex-col bg-white rounded-xl border border-gray-200/50 shadow-sm overflow-hidden min-h-0 h-full">
                  {/* Header */}
                  <div className="border-b border-gray-200/50 bg-gray-50/50 px-4 py-3 flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Master Resume Template</h3>
                      <p className="text-xs text-gray-500 mt-0.5">LaTeX template for resumes</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(masterDocument);
                        setCopiedTemplate('resume');
                        setTimeout(() => setCopiedTemplate(null), 2000);
                      }}
                      className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors shrink-0"
                      title="Copy template"
                    >
                      {copiedTemplate === 'resume' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>

                  {/* Textarea */}
                  <textarea
                    value={masterDocument}
                    onChange={(e) => {
                      setMasterDocument(e.target.value);
                      setError(null);
                    }}
                    placeholder="Paste your LaTeX resume template here..."
                    className="flex-1 px-4 py-4 border-none focus:outline-none resize-none font-mono text-sm text-gray-700 bg-white placeholder:text-gray-400 min-h-0"
                  />

                  {/* Footer */}
                  <div className="border-t border-gray-200/50 bg-gray-50/50 px-4 py-2 text-xs text-gray-500 shrink-0">
                    <p>Size: {masterDocument.length > 0 ? `${Math.round(masterDocument.length / 1024)} KB` : '0 KB'}</p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 shrink-0">
                  <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">
                    Paste your complete LaTeX resume template here. This will be prefilled in the Resume Creation section and can be edited after optimization.
                  </p>
                </div>
              </div>

              {/* Master Cover Letter Template Section */}
              <div className="flex flex-col min-h-0 h-full">
                <div className="flex flex-col bg-white rounded-xl border border-gray-200/50 shadow-sm overflow-hidden min-h-0 h-full">
                  {/* Header */}
                  <div className="border-b border-gray-200/50 bg-gray-50/50 px-4 py-3 flex items-center justify-between shrink-0">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">Master Cover Letter Template</h3>
                      <p className="text-xs text-gray-500 mt-0.5">LaTeX template for cover letters</p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(masterCoverLetter);
                        setCopiedTemplate('coverLetter');
                        setTimeout(() => setCopiedTemplate(null), 2000);
                      }}
                      className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors shrink-0"
                      title="Copy template"
                    >
                      {copiedTemplate === 'coverLetter' ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>

                  {/* Textarea */}
                  <textarea
                    value={masterCoverLetter}
                    onChange={(e) => {
                      setMasterCoverLetter(e.target.value);
                      setError(null);
                    }}
                    placeholder="Paste your LaTeX cover letter template here..."
                    className="flex-1 px-4 py-4 border-none focus:outline-none resize-none font-mono text-sm text-gray-700 bg-white placeholder:text-gray-400 min-h-0"
                  />

                  {/* Footer */}
                  <div className="border-t border-gray-200/50 bg-gray-50/50 px-4 py-2 text-xs text-gray-500 shrink-0">
                    <p>Size: {masterCoverLetter.length > 0 ? `${Math.round(masterCoverLetter.length / 1024)} KB` : '0 KB'}</p>
                  </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 shrink-0">
                  <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700">
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
            <div className="flex gap-3 pt-6">
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
          <div className="flex flex-col min-h-0 h-full space-y-6">
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <MasterContentAccordion 
                sections={masterContentSections}
                onSectionsChange={setMasterContentSections}
                maxCharacters={50000}
                onNavigateToTemplate={() => setActiveTab('template')}
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-800">
                <strong>💡 Tip:</strong> Organize your master content by section. This makes it easier for AI models to understand and optimize your resume for specific job requirements.
              </p>
             </div>    

            {/* Error Display */}
            {error && (
              <div className="px-6 bg-red-50 border-t border-red-200 py-4">
                <div className="flex gap-3">
                  <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {contentSaved && (
              <div className="px-6 bg-green-50 border-t border-green-200 py-4">
                <div className="flex gap-3">
                  <CheckCircle size={18} className="text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-green-700">Master content saved successfully!</p>
                </div>
              </div>
            )}

            {/* Save and Clear Buttons */}
            <div className="flex gap-3 px-6 pb-6 shrink-0">
              <button
                onClick={handleSaveMasterContent}
                disabled={masterContentSections?.length === 0 || contentLoading}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold transition-colors"
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
              {masterContentSections?.length > 0 && masterContentSections?.some((s: ContentSection) => s.content) && (
                <button
                  onClick={() => {
                    setMasterContentSections([]);
                    setError(null);
                  }}
                  className="px-6 py-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
