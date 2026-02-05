'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface StatusDropdownProps {
  value: string;
  onChange: (value: string) => void;
  statusColors: Record<string, string>;
  statusOptions: string[];
  isLoading?: boolean;
}

interface Position {
  top: number;
  left: number;
}

export const StatusDropdown = ({
  value,
  onChange,
  statusColors,
  statusOptions,
}: StatusDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Don't close if clicking on button or dropdown menu
      if (buttonRef.current?.contains(target)) return;
      
      const dropdownMenu = document.querySelector('[data-dropdown-menu]');
      if (dropdownMenu?.contains(target)) return;
      
      setIsOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
      });
    }
  }, [isOpen]);

  const formatLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center justify-between gap-2 px-3 py-1 rounded-full text-xs font-medium border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all ${
            statusColors[value] || statusColors['applied']
          }`}
        >
          <span>{formatLabel(value)}</span>
          <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div
          data-dropdown-menu
          className="fixed bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50 overflow-hidden w-48"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={(e) => {
                e.stopPropagation();
                console.log('Updating status to:', status);
                onChange(status);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                value === status
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {value === status && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              )}
              <span className={value === status ? 'font-semibold' : ''}>{formatLabel(status)}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
};
