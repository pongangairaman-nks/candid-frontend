'use client';

import { Upload, FileText, AlertCircle } from 'lucide-react';
import { useResumeStore } from '@/store/resumeStore';
import { useRef } from 'react';

export const Sidebar = () => {
  const { masterDocument, setMasterDocument, error } = useResumeStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setMasterDocument(content);
    };
    reader.readAsText(file);
  };

  const handlePasteLatex = () => {
    navigator.clipboard.read().then((items) => {
      for (const item of items) {
        if (item.types.includes('text/plain')) {
          item.getType('text/plain').then((blob) => {
            blob.text().then((text) => {
              setMasterDocument(text);
            });
          });
        }
      }
    });
  };

  return (
    <div className="w-80 border-r border-slate-200 bg-linear-to-b from-slate-50 to-slate-100 flex flex-col h-screen overflow-hidden dark:border-slate-700 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Resume AI</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Optimize your resume with AI</p>
      </div>

      {/* Master Document Section */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <FileText size={16} />
            Master Resume Template
          </h2>

          <div className="space-y-3">
            {/* Upload Button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50 transition-colors dark:border-slate-600 dark:hover:bg-slate-700 dark:hover:border-indigo-400"
            >
              <Upload size={18} className="text-slate-600 dark:text-slate-400" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Upload .tex file</span>
            </button>

            {/* Paste Button */}
            <button
              onClick={handlePasteLatex}
              className="w-full px-4 py-2 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-900 text-sm font-medium transition-colors dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white"
            >
              Paste LaTeX Content
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".tex,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>

        {/* Master Document Preview */}
        {masterDocument && (
          <div className="bg-white rounded-lg p-4 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">LOADED TEMPLATE</p>
            <div className="text-xs text-slate-600 dark:text-slate-400 max-h-32 overflow-y-auto font-mono bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
              {masterDocument.substring(0, 300)}
              {masterDocument.length > 300 && '...'}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
              {Math.round(masterDocument.length / 1024)} KB
            </p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 flex gap-2">
            <AlertCircle size={16} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          💡 Upload your LaTeX resume template to get started
        </p>
      </div>
    </div>
  );
};
