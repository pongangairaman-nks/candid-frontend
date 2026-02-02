'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card = ({ children, className = '', hover = false }: CardProps) => {
  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 ${
        hover ? 'hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
