'use client';

import { FileText, Zap } from 'lucide-react';
import { LLMConfig } from './LLMConfig';

export const Header = () => {
  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 z-40">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-600 to-indigo-700 flex items-center justify-center">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold text-slate-900 dark:text-white">Resume AI</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">ATS-Optimized Resume Generator</p>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
          <FileText size={14} />
          <span>LaTeX-based Resume Optimization</span>
        </div>
        <LLMConfig />
      </div>
    </div>
  );
};
