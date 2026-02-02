'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
  id: string;
  name: string;
  provider?: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  description?: string;
}

export const CustomSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  label,
  description,
}: CustomSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.id === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div>
      {label && (
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          {label}
        </label>
      )}

      <div ref={dropdownRef} className="relative">
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent flex items-center justify-between transition-all hover:border-slate-400 dark:hover:border-slate-500"
        >
          <span className={selectedOption ? 'text-slate-900 dark:text-white' : 'text-slate-500'}>
            {selectedOption?.name || placeholder}
          </span>
          <ChevronDown
            size={18}
            className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg z-50 overflow-hidden">
            <div className="max-h-64 overflow-y-auto">
              {options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left text-sm transition-colors flex items-center gap-3 ${
                    value === option.id
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {value === option.id && (
                    <span className="text-indigo-600 dark:text-indigo-400">✓</span>
                  )}
                  <span className={value === option.id ? 'ml-0' : 'ml-6'}>{option.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{description}</p>
      )}
    </div>
  );
};
