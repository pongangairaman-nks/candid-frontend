'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const Header = ({ sidebarOpen, onToggleSidebar }: HeaderProps) => {
  const pathname = usePathname();

  const getBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Dashboard', href: '/dashboard/jobs' }];

    if (segments.includes('jobs')) {
      breadcrumbs.push({ label: 'Job Applications', href: '/dashboard/jobs' });
    } else if (segments.includes('resume') && segments.includes('generate')) {
      breadcrumbs.push({ label: 'Job Applications', href: '/dashboard/jobs' });
      breadcrumbs.push({ label: 'Resume Generation', href: '#' });
    } else if (segments.includes('configuration')) {
      breadcrumbs.push({ label: 'Configuration', href: '/dashboard/configuration' });
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className={`h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-6 ${sidebarOpen ? 'justify-between' : 'justify-start'}`}>
      {/* Left: Sidebar Toggle + Breadcrumb Navigation */}
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className="p-2.5 bg-indigo-100/50 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg transition-all duration-200 flex-shrink-0 group"
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          aria-label="Toggle sidebar"
        >
          <div className={`w-5 h-5 flex items-center justify-center relative transition-transform duration-500 ${sidebarOpen ? 'rotate-180' : 'rotate-0'}`}>
            {/* Left panel block */}
            <div className="absolute left-0 w-1 h-4 bg-indigo-600 dark:bg-indigo-400 rounded-r transition-colors duration-300 group-hover:bg-indigo-700 dark:group-hover:bg-indigo-300"></div>
            
            {/* Right content lines with stagger effect */}
            <div className="absolute right-0 space-y-1 transition-colors duration-300">
              <div className="w-2 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full transition-colors duration-300 group-hover:bg-indigo-700 dark:group-hover:bg-indigo-300"></div>
              <div className="w-2.5 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full transition-colors duration-300 group-hover:bg-indigo-700 dark:group-hover:bg-indigo-300"></div>
              <div className="w-2 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full transition-colors duration-300 group-hover:bg-indigo-700 dark:group-hover:bg-indigo-300"></div>
            </div>
          </div>
        </button>

        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2">
          {breadcrumbs.map((crumb, index) => (
            <div key={`${crumb.href}-${index}`} className="flex items-center gap-2">
              {index > 0 && <ChevronRight size={18} className="text-slate-400 dark:text-slate-500" />}
              <Link
                href={crumb.href}
                className={`text-base font-medium transition-colors ${
                  index === breadcrumbs.length - 1
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {crumb.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
