'use client';

import { FileText, Settings, LogOut, Menu, X, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavigationSidebarProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

export const NavigationSidebar = ({ isOpen, onToggle }: NavigationSidebarProps) => {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Job Applications',
      href: '/dashboard/jobs',
      icon: FileText,
    },
    {
      label: 'Configuration',
      href: '/dashboard/configuration',
      icon: Settings,
    },
  ];

  const isActive = (href: string) => {
    // Exact match or nested route match
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => onToggle(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col transition-all duration-300 ${
          isOpen ? 'w-64' : 'w-20'
        } z-40`}
      >
        {/* Logo */}
        <button
          onClick={() => onToggle(true)}
          className={`w-full border-b border-slate-200 dark:border-slate-700 flex items-center justify-start transition-all duration-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 ${isOpen ? 'p-6' : 'p-4'}`}
          title={!isOpen ? 'Open sidebar' : undefined}
        >
          <div className={`flex items-start gap-3 ${isOpen ? '' : 'flex-col items-center'}`}>
            <div className="w-9 h-9 rounded-lg bg-linear-to-br from-indigo-600 to-indigo-700 flex items-center justify-center shrink-0 mt-1">
              <Zap size={18} className="text-white" />
            </div>
            {isOpen && (
              <div className="flex-1">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Candid</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">ATS Optimizer</p>
              </div>
            )}
          </div>
        </button>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg transition-all duration-300 ${
                  isOpen ? 'px-4 py-3' : 'px-2 py-3 justify-center'
                } ${
                  active
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
                title={!isOpen ? item.label : undefined}
              >
                <Icon size={20} />
                {isOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className={`border-t border-slate-200 dark:border-slate-700 space-y-3 transition-all duration-300 ${isOpen ? 'p-4' : 'p-2'}`}>
          {isOpen && (
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
              <p className="text-xs text-slate-600 dark:text-slate-400">Logged in as</p>
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.firstName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={() => {
              logout();
              window.location.href = '/';
            }}
            className={`flex items-center justify-center gap-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 font-medium transition-all duration-300 ${
              isOpen ? 'w-full px-4 py-2' : 'w-10 h-10'
            }`}
            title={!isOpen ? 'Logout' : undefined}
          >
            <LogOut size={18} />
            {isOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => onToggle(false)}
        />
      )}
    </>
  );
};
