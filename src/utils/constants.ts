export const RESUME_CONSTRAINTS = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ACCEPTED_FORMATS: ['.tex', '.txt'],
  MAX_JD_LENGTH: 50000,
  MAX_LATEX_LENGTH: 100000,
};

export const API_ENDPOINTS = {
  OPTIMIZE_RESUME: '/resume/optimize',
  GENERATE_PDF: '/resume/generate-pdf',
  DOWNLOAD_RESUME: '/resume/download',
};

export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds 5MB limit',
  INVALID_FORMAT: 'Invalid file format. Please upload .tex or .txt files',
  EMPTY_MASTER_DOCUMENT: 'Please upload a master resume template',
  EMPTY_JOB_DESCRIPTION: 'Please enter a job description',
  OPTIMIZATION_FAILED: 'Failed to optimize resume. Please try again.',
  PDF_GENERATION_FAILED: 'Failed to generate PDF. Please try again.',
  DOWNLOAD_FAILED: 'Failed to download resume. Please try again.',
};

export const SUCCESS_MESSAGES = {
  DOCUMENT_UPLOADED: 'Master resume template uploaded successfully',
  RESUME_OPTIMIZED: 'Resume optimized successfully',
  PDF_GENERATED: 'PDF generated successfully',
  RESUME_DOWNLOADED: 'Resume downloaded successfully',
  COPIED_TO_CLIPBOARD: 'LaTeX code copied to clipboard',
};
