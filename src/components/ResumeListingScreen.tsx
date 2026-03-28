'use client';

import { Plus, Edit2, Eye, Download, Trash2, Zap, Loader, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { jobApplicationApi, JobApplication } from '@/services/api';

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
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const fetchInitiatedRef = useRef(false);

  const fetchApplications = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!fetchInitiatedRef.current) {
      fetchInitiatedRef.current = true;
      fetchApplications();
    }
  }, [fetchApplications]);

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
        // setApplications([newApp, ...applications]);
        toast.success('Job application created successfully');
        setModalOpen(false);
        // Navigate to resume automation page with the new job ID
        if (newApp.id) {
          router.push(`/dashboard/jobs/resume/${newApp.id}`);
        }
      } else if (modalMode === 'edit' && selectedApplication?.id) {
        const updatedApp = await jobApplicationApi.update(selectedApplication.id, data);
        setApplications(applications.map((app) => (app.id === updatedApp.id ? updatedApp : app)));
        toast.success('Job application updated successfully');
        setModalOpen(false);
      }
    } catch (error) {
      toast.error('Failed to save job application');
      throw error;
    }
  };

  const handleStatusChange = async (appId: number, newStatus: string) => {
    try {
      console.log('Updating status for app ID:', appId, 'to:', newStatus);
      
      // Optimistic update - update UI immediately
      setApplications(applications.map((app) => 
        app.id === appId ? { ...app, status: newStatus } : app
      ));
      setUpdatingStatusId(appId);
      
      // Update backend
      const updatedApp = await jobApplicationApi.updateStatus(appId, newStatus);
      
      // Confirm with backend response
      setApplications(applications.map((app) => (app.id === updatedApp.id ? updatedApp : app)));
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Status update error:', error);
      
      // Revert optimistic update on error
      const originalApp = applications.find((app) => app.id === appId);
      if (originalApp) {
        setApplications(applications.map((app) => 
          app.id === appId ? originalApp : app
        ));
      }
      
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatusId(null);
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

  // Pagination calculations
  const totalPages = Math.ceil(applications.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedApplications = applications.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleRowsPerPageChange = (newRowsPerPage: number) => {
    setRowsPerPage(newRowsPerPage);
    setCurrentPage(1); // Reset to first page when changing rows per page
  };

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
                {paginatedApplications.map((app) => (
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
                        {app.jobPortal}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-slate-900 dark:text-white">{app.companyName}</div>
                      {app.companyUrl && (
                        <a
                          href={app.companyUrl}
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
                        className="px-3 py-1 rounded-full text-xs font-medium border-0 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <option value="applied">Applied</option>
                        <option value="screening">Screening</option>
                        <option value="interview">Interview</option>
                        <option value="offer">Offer</option>
                        <option value="rejected">Rejected</option>
                        <option value="accepted">Accepted</option>
                        <option value="withdrawn">Withdrawn</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {app.appliedDate ? new Date(app.appliedDate).toLocaleDateString() : '-'}
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
                          onClick={() => handleDownloadResume(app.resumePdfUrl)}
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

          {/* Pagination Controls */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex items-center justify-between">
            {/* Rows Per Page Dropdown */}
            <div className="flex items-center gap-3">
              <label className="text-sm text-slate-600 dark:text-slate-400">Rows per page:</label>
              <select
                value={rowsPerPage}
                onChange={(e) => handleRowsPerPageChange(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
              </select>
            </div>

            {/* Navigation Controls and Page Info */}
            <div className="flex items-center gap-4">
              {/* Page Info */}
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Showing {startIndex + 1} to {Math.min(endIndex, applications.length)} of {applications.length}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center gap-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Previous page"
              >
                <ChevronLeft size={18} className="text-slate-600 dark:text-slate-400" />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-indigo-600 text-white'
                        : 'border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Next page"
              >
                <ChevronRight size={18} className="text-slate-600 dark:text-slate-400" />
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Application Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl max-w-md w-full">
            {/* Header */}
            <div className="border-b border-slate-200 dark:border-slate-700 px-6 py-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {modalMode === 'create' ? 'Create Job Application' : modalMode === 'edit' ? 'Edit Job Application' : 'View Job Application'}
              </h2>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  defaultValue={selectedApplication?.companyName || ''}
                  disabled={modalMode === 'view'}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter company name"
                  id="companyName"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Job Title / Position
                </label>
                <input
                  type="text"
                  defaultValue={selectedApplication?.position || ''}
                  disabled={modalMode === 'view'}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Enter job title or position"
                  id="position"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Job URL
                </label>
                <input
                  type="url"
                  defaultValue={selectedApplication?.jobUrl || ''}
                  disabled={modalMode === 'view'}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://example.com/job"
                  id="jobUrl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Company URL
                </label>
                <input
                  type="url"
                  defaultValue={selectedApplication?.companyUrl || ''}
                  disabled={modalMode === 'view'}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://example.com"
                  id="companyUrl"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Applied Date
                </label>
                <input
                  type="date"
                  defaultValue={selectedApplication?.appliedDate ? new Date(selectedApplication.appliedDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                  disabled={modalMode === 'view'}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  id="appliedDate"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Status
                </label>
                <select
                  defaultValue={selectedApplication?.status || 'applied'}
                  disabled={modalMode === 'view'}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  id="status"
                >
                  <option value="applied">Applied</option>
                  <option value="screening">Screening</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="rejected">Rejected</option>
                  <option value="accepted">Accepted</option>
                  <option value="withdrawn">Withdrawn</option>
                </select>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
              >
                {modalMode === 'view' ? 'Close' : 'Cancel'}
              </button>
              {modalMode !== 'view' && (
                <button
                  onClick={() => {
                    const appliedDateInput = (document.getElementById('appliedDate') as HTMLInputElement).value;
                    const statusInput = (document.getElementById('status') as HTMLSelectElement).value;
                    const formData: JobApplication = {
                      id: selectedApplication?.id,
                      position: (document.getElementById('position') as HTMLInputElement).value,
                      companyName: (document.getElementById('companyName') as HTMLInputElement).value,
                      jobUrl: (document.getElementById('jobUrl') as HTMLInputElement).value,
                      companyUrl: (document.getElementById('companyUrl') as HTMLInputElement).value,
                      status: statusInput,
                      appliedDate: new Date(appliedDateInput).toISOString(),
                      jobDescription: selectedApplication?.jobDescription || '',
                      resumePdfUrl: selectedApplication?.resumePdfUrl,
                      generatedResumeLatex: selectedApplication?.generatedResumeLatex,
                      generatedCoverLetterLatex: selectedApplication?.generatedCoverLetterLatex,
                      lastModifiedAt: new Date().toISOString(),
                    };
                    handleModalSubmit(formData);
                  }}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
                >
                  {modalMode === 'create' ? 'Create' : 'Update'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
