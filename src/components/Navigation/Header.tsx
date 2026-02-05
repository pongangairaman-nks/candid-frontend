'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

export const Header = () => {
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
    <div className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center px-6">
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
  );
};
