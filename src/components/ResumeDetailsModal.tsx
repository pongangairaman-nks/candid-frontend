'use client';

import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { JobApplication } from '@/services/api';

interface ResumeDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JobApplication) => Promise<void>;
  initialData?: JobApplication;
  mode: 'create' | 'edit' | 'view';
}

const STATUS_OPTIONS = [
  'applied',
  'screening',
  'interview',
  'offer',
  'rejected',
  'accepted',
  'withdrawn',
];

const JOB_PORTALS = [
  'LinkedIn',
  'Indeed',
  'Glassdoor',
  'AngelList',
  'Company Website',
  'Referral',
  'Other',
];

export function ResumeDetailsModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  mode,
}: ResumeDetailsModalProps) {
  const [formData, setFormData] = useState<JobApplication>({
    position: '',
    company_name: '',
    industry: '',
    company_url: '',
    job_url: '',
    job_portal: '',
    status: 'applied',
    applied_date: '',
    interview_date: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData && (mode === 'edit' || mode === 'view')) {
      setFormData(initialData);
    } else {
      setFormData({
        position: '',
        company_name: '',
        industry: '',
        company_url: '',
        job_url: '',
        job_portal: '',
        status: 'applied',
        applied_date: '',
        interview_date: '',
        notes: '',
      });
    }
    setError('');
  }, [isOpen, initialData, mode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.position.trim() || !formData.company_name.trim()) {
      setError('Position and company name are required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save job application');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isViewMode = mode === 'view';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {mode === 'create' ? 'Create Job Application' : mode === 'edit' ? 'Edit Job Application' : 'View Job Application'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Two Column Layout */}
          <div className="grid grid-cols-2 gap-6">
            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                Position *
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleChange}
                disabled={isViewMode}
                placeholder="e.g., Senior Software Engineer"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                Company Name *
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                disabled={isViewMode}
                placeholder="e.g., Acme Corp"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Industry */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                Industry
              </label>
              <input
                type="text"
                name="industry"
                value={formData.industry || ''}
                onChange={handleChange}
                disabled={isViewMode}
                placeholder="e.g., Technology"
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Job Portal */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                Job Portal
              </label>
              <select
                name="job_portal"
                value={formData.job_portal || ''}
                onChange={handleChange}
                disabled={isViewMode}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select a portal</option>
                {JOB_PORTALS.map((portal) => (
                  <option key={portal} value={portal}>
                    {portal}
                  </option>
                ))}
              </select>
            </div>

            {/* Applied Date */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                Applied Date
              </label>
              <input
                type="date"
                name="applied_date"
                value={formData.applied_date || ''}
                onChange={handleChange}
                disabled={isViewMode}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Interview Date */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                Interview Date
              </label>
              <input
                type="date"
                name="interview_date"
                value={formData.interview_date || ''}
                onChange={handleChange}
                disabled={isViewMode}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                disabled={isViewMode}
                className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Company URL */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
              Company URL
            </label>
            <input
              type="url"
              name="company_url"
              value={formData.company_url || ''}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder="https://example.com"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Job URL */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
              Job URL
            </label>
            <input
              type="url"
              name="job_url"
              value={formData.job_url || ''}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder="https://example.com/jobs/123"
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes || ''}
              onChange={handleChange}
              disabled={isViewMode}
              placeholder="Add any additional notes about this job application..."
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex gap-3 justify-end pt-6 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 font-medium transition-colors"
            >
              {isViewMode ? 'Close' : 'Cancel'}
            </button>
            {!isViewMode && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium transition-colors"
              >
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
