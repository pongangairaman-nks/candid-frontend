'use client';

import { X, Check, Copy, Loader } from 'lucide-react';
import { useState } from 'react';

interface SelectiveOptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (optimizedText: string) => void;
  originalText: string;
  optimizedText: string;
  isLoading: boolean;
}

export function SelectiveOptimizationModal({
  isOpen,
  onClose,
  onApply,
  originalText,
  optimizedText,
  isLoading,
}: SelectiveOptimizationModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Optimization Preview
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loader size={32} className="animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">Optimizing with AI...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-6 p-6">
              {/* Original */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Original</h3>
                  <button
                    onClick={() => handleCopy(originalText)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Copy original"
                  >
                    <Copy size={16} className="text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700 max-h-96 overflow-auto">
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-mono">
                    {originalText}
                  </p>
                </div>
              </div>

              {/* Optimized */}
              <div>
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-slate-900 dark:text-white">Optimized</h3>
                  <button
                    onClick={() => handleCopy(optimizedText)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                    title="Copy optimized"
                  >
                    <Copy size={16} className="text-slate-600 dark:text-slate-400" />
                  </button>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800 max-h-96 overflow-auto">
                  <p className="text-sm text-green-900 dark:text-green-300 whitespace-pre-wrap font-mono">
                    {optimizedText}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-700/50">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onApply(optimizedText)}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium transition-colors dark:disabled:bg-slate-700"
          >
            <Check size={18} />
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
