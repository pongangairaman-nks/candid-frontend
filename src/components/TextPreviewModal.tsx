'use client';

import { X, Download, Copy } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'react-toastify';

interface TextPreviewModalProps {
  content: string;
  title: string;
  onClose: () => void;
  fileName: string;
}

export const TextPreviewModal = ({ content, title, onClose, fileName }: TextPreviewModalProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  const handleDownload = () => {
    try {
      const element = document.createElement('a');
      const file = new Blob([content], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${fileName}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      URL.revokeObjectURL(element.href);
      toast.success('Downloaded successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title} Preview</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {content.length} characters
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors ml-4"
          >
            <X size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content - Full height scrollable */}
        <div className="flex-1 overflow-auto bg-slate-50 dark:bg-slate-900 p-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            <pre className="font-mono text-sm text-slate-900 dark:text-white whitespace-pre-wrap overflow-wrap leading-relaxed">
              {content}
            </pre>
          </div>
        </div>

        {/* Footer - Action buttons */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex gap-3 justify-end items-center flex-wrap">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Copy size={16} />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors shadow-md hover:shadow-lg"
          >
            <Download size={16} />
            Download
          </button>
        </div>
      </div>
    </div>
  );
};
