'use client';

import { FileText, AlertCircle, Save, Loader } from 'lucide-react';
import { useResumeStore } from '@/store/resumeStore';
import { resumeApi } from '@/services/api';
import { LLMConfigSection } from '@/components/LLMConfigSection';
import { useState, useEffect } from 'react';

type TabType = 'llm' | 'template';

export default function ConfigurationPage() {
  const { masterDocument, setMasterDocument, error, setError } = useResumeStore();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('llm');

  // Fetch master template on page load
  useEffect(() => {
    const fetchMasterTemplate = async () => {
      try {
        const { latexCode } = await resumeApi.getMasterTemplate();
        setMasterDocument(latexCode);
        setError(null);
      } catch {
        // Template doesn't exist yet, which is fine
        console.log('No master template found');
      }
    };

    fetchMasterTemplate();
  }, [setMasterDocument, setError]);

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
            onClick={() => setActiveTab('template')}
            className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'template'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300'
            }`}
          >
            Master Template
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-6 md:p-8 overflow-auto">
        {/* LLM Configuration Tab */}
        {activeTab === 'llm' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <LLMConfigSection />
          </div>
        )}

        {/* Master Template Tab */}
        {activeTab === 'template' && (
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Master Resume Template</h2>
          <div className="flex flex-col bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            {/* Label */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                MASTER RESUME TEMPLATE (LaTeX)
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
              className="h-96 px-6 py-4 font-mono text-sm resize-none border-0 focus:outline-none focus:ring-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex gap-3">
              <AlertCircle size={18} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {isSaved && (
            <div className="mt-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex gap-3">
              <FileText size={18} className="text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              <p className="text-sm text-green-700 dark:text-green-300">Master resume template saved successfully!</p>
            </div>
          )}

          {/* Save Button */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSave}
              disabled={!masterDocument.trim() || isLoading}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold transition-colors dark:disabled:bg-slate-700"
            >
              {isLoading ? (
                <>
                  <Loader size={18} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Save Master Template
                </>
              )}
            </button>
            {masterDocument && (
              <button
                onClick={() => {
                  setMasterDocument('');
                  setError(null);
                }}
                className="px-6 py-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 font-medium transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              ℹ️ Paste your complete LaTeX resume template here and save it. This will be prefilled in the Resume Creation section and can be edited after optimization.
            </p>
          </div>
          </div>
        )}
      </div>
    </div>
  );
}
