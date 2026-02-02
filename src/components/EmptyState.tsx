'use client';

import { FileText, Upload } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const EmptyState = ({ title, description, icon, action }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="mb-4 text-slate-400 dark:text-slate-500">
        {icon || <FileText size={48} />}
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-sm">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
        >
          <Upload size={16} />
          {action.label}
        </button>
      )}
    </div>
  );
};
