'use client';

import { X, Download, Loader } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

interface PreviewModalProps {
  pdfUrl: string;
  onClose: () => void;
}

export const PreviewModal = ({ pdfUrl, onClose }: PreviewModalProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pdfDoc, setPdfDoc] = useState<unknown>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const renderTaskRef = useRef<unknown>(null);

  useEffect(() => {
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

        const pdf = await pdfjsLib.getDocument(pdfUrl).promise;
        setPdfDoc(pdf);
        setNumPages(pdf.numPages);
        setCurrentPage(1);

        setIsLoading(false);
      } catch (err) {
        console.error('PDF loading error:', err);
        setError('Failed to load PDF');
        setIsLoading(false);
      }
    };

    if (pdfUrl) {
      loadPdf();
    }
  }, [pdfUrl]);

  useEffect(() => {
    let isMounted = true;

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current || !isMounted) return;

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const page = await (pdfDoc as any).getPage(currentPage);
        if (!isMounted) return;

        const viewport = page.getViewport({ scale: 2 });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context || !isMounted) return;

        // Clear the canvas before rendering
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        context.clearRect(0, 0, canvas.width, canvas.height);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        
        if (isMounted) {
          renderTaskRef.current = null;
        }
      } catch (err) {
        if (isMounted && (err as Error).message !== 'Rendering cancelled') {
          console.error('Page rendering error:', err);
          setError('Failed to render page');
        }
      }
    };

    if (pdfDoc && numPages > 0) {
      renderPage();
    }

    return () => {
      isMounted = false;
      // Cancel any pending render operation when component unmounts
      if (renderTaskRef.current) {
        (renderTaskRef.current as { cancel: () => void }).cancel?.();
        renderTaskRef.current = null;
      }
    };
  }, [pdfDoc, currentPage, numPages]);

  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = 'resume.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Failed to download PDF');
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Header - Compact */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex-1">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Resume Preview</h3>
            {numPages > 0 && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Page {currentPage} of {numPages}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors ml-4"
          >
            <X size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content - Full height scrollable */}
        <div className="flex-1 overflow-auto bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
          {isLoading ? (
            <div className="text-center">
              <Loader size={48} className="animate-spin text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
              <p className="text-slate-700 dark:text-slate-300 font-medium">Compiling LaTeX to PDF...</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">This may take a moment</p>
            </div>
          ) : error ? (
            <div className="text-center max-w-sm">
              <div className="text-4xl mb-3">⚠️</div>
              <p className="text-red-600 dark:text-red-400 font-semibold mb-2">Preview Error</p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{error}</p>
            </div>
          ) : numPages > 0 ? (
            <div className="w-full flex flex-col items-center">
              <div className="bg-white dark:bg-slate-700 rounded-lg shadow-xl overflow-hidden border border-slate-200 dark:border-slate-600">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto block"
                  style={{ maxHeight: 'calc(95vh - 180px)' }}
                />
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-5xl mb-3">📄</div>
              <p className="text-slate-700 dark:text-slate-300 font-semibold">PDF Ready</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Your resume PDF is ready for download</p>
            </div>
          )}
        </div>

        {/* Footer - Action buttons */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex gap-3 justify-between items-center flex-wrap">
          <div className="flex gap-2">
            {numPages > 1 && currentPage > 1 && (
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                ← Previous
              </button>
            )}
            {numPages > 1 && currentPage < numPages && (
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
              >
                Next →
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>
            {!isLoading && !error && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors shadow-md hover:shadow-lg"
              >
                <Download size={16} />
                Download PDF
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
