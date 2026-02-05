'use client';

import { Plus, Edit2, Eye, Download, Trash2, Zap, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { jobApplicationApi, JobApplication } from '@/services/api';
import { ResumeDetailsModal } from './ResumeDetailsModal';

type ResumeListingScreenProps = Record<string, never>;

const STATUS_COLORS: Record<string, string> = {
  applied: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  screening: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
  interview: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
  offer: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
  accepted: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  withdrawn: 'bg-slate-100 dark:bg-slate-900/30 text-slate-700 dark:text-slate-300',
};

export function ResumeListingScreen({}: ResumeListingScreenProps) {
  const router = useRouter();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('create');
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | undefined>();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setIsLoading(true);
      const data = await jobApplicationApi.getAll();
      setApplications(data);
    } catch (error) {
      toast.error('Failed to fetch job applications');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateNew = () => {
    setSelectedApplication(undefined);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleEdit = (app: JobApplication) => {
    setSelectedApplication(app);
    setModalMode('edit');
    setModalOpen(true);
  };

  const handleView = (app: JobApplication) => {
    setSelectedApplication(app);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleModalSubmit = async (data: JobApplication) => {
    try {
      if (modalMode === 'create') {
        const newApp = await jobApplicationApi.create(data);
        setApplications([newApp, ...applications]);
        toast.success('Job application created successfully');
      } else if (modalMode === 'edit' && selectedApplication?.id) {
        const updatedApp = await jobApplicationApi.update(selectedApplication.id, data);
        setApplications(applications.map((app) => (app.id === updatedApp.id ? updatedApp : app)));
        toast.success('Job application updated successfully');
      }
    } catch (error) {
      toast.error('Failed to save job application');
      throw error;
    }
  };

  const handleStatusChange = async (appId: number, newStatus: string) => {
    try {
      const updatedApp = await jobApplicationApi.updateStatus(appId, newStatus);
      setApplications(applications.map((app) => (app.id === updatedApp.id ? updatedApp : app)));
      toast.success('Status updated successfully');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (appId: number) => {
    if (!confirm('Are you sure you want to delete this job application?')) return;

    try {
      await jobApplicationApi.delete(appId);
      setApplications(applications.filter((app) => app.id !== appId));
      toast.success('Job application deleted successfully');
    } catch {
      toast.error('Failed to delete job application');
    }
  };

  const handleDownloadResume = (url: string | undefined) => {
    if (!url) {
      toast.error('Resume not available');
      return;
    }
    window.open(url, '_blank');
  };

  const STATUS_OPTIONS = [
    'applied',
    'screening',
    'interview',
    'offer',
    'rejected',
    'accepted',
    'withdrawn',
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Job Applications</h1>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
        >
          <Plus size={18} />
          Create Job
        </button>
      </div>

      {/* Table - Conditionally Rendered */}
      {isLoading ? (
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loader size={32} className="animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400">Loading job applications...</p>
          </div>
        </div>
      ) : applications.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">No job applications yet</p>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
          >
            <Plus size={16} />
            Create your first job
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    Position
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    Applied Date
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr
                    key={app.id}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">{app.id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-white">{app.position}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        {app.industry && `${app.industry} • `}
                        {app.job_portal}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-white">{app.company_name}</div>
                      {app.company_url && (
                        <a
                          href={app.company_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          Visit website
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={app.status}
                        onChange={(e) => app.id && handleStatusChange(app.id, e.target.value)}
                        className={`px-3 py-1 rounded-full text-xs font-medium border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                          STATUS_COLORS[app.status] || STATUS_COLORS['applied']
                        }`}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {app.applied_date ? new Date(app.applied_date).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleView(app)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => handleEdit(app)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => app.id && router.push(`/dashboard/jobs/resume/${app.id}`)}
                          className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg transition-colors text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                          title="Generate Resume with LLM"
                        >
                          <Zap size={16} />
                        </button>
                        <button
                          onClick={() => handleDownloadResume(app.resume_pdf_url)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          title="Download Resume"
                        >
                          <Download size={16} />
                        </button>
                        <button
                          onClick={() => app.id && handleDelete(app.id)}
                          className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      <ResumeDetailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        initialData={selectedApplication}
        mode={modalMode}
      />
    </div>
  );
}
