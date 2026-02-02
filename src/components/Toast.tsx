'use client';

import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

export const Toast = ({ message, type, duration = 3000, onClose }: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  const styles = {
    success: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      icon: <CheckCircle size={18} className="text-green-600 dark:text-green-400" />,
      text: 'text-green-800 dark:text-green-300',
    },
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-200 dark:border-red-800',
      icon: <AlertCircle size={18} className="text-red-600 dark:text-red-400" />,
      text: 'text-red-800 dark:text-red-300',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      icon: <Info size={18} className="text-blue-600 dark:text-blue-400" />,
      text: 'text-blue-800 dark:text-blue-300',
    },
  };

  const style = styles[type];

  return (
    <div className={`fixed bottom-6 right-6 max-w-sm ${style.bg} border ${style.border} rounded-lg p-4 flex items-start gap-3 shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4 duration-300`}>
      {style.icon}
      <p className={`text-sm font-medium ${style.text} flex-1`}>{message}</p>
      <button
        onClick={() => {
          setIsVisible(false);
          onClose();
        }}
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
      >
        <X size={16} />
      </button>
    </div>
  );
};
