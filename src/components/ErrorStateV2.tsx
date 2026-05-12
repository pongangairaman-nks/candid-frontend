'use client';

import { AlertCircle, RefreshCw, X } from 'lucide-react';

interface ErrorStateV2Props {
  error: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  title?: string;
  showIcon?: boolean;
}

/**
 * Error State Component V2
 * 
 * Displays error messages with retry and dismiss options
 */
export const ErrorStateV2 = ({
  error,
  onRetry,
  onDismiss,
  title = 'Error',
  showIcon = true
}: ErrorStateV2Props) => {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          {showIcon && (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 mb-1">{title}</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-600 hover:text-red-800 transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 flex items-center space-x-2 text-sm font-medium text-red-700 hover:text-red-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
};

interface LoadingStateV2Props {
  message?: string;
  showSpinner?: boolean;
}

/**
 * Loading State Component V2
 * 
 * Displays loading indicator with optional message
 */
export const LoadingStateV2 = ({
  message = 'Loading...',
  showSpinner = true
}: LoadingStateV2Props) => {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-center justify-center space-x-3">
        {showSpinner && (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        )}
        <p className="text-blue-700 font-medium">{message}</p>
      </div>
    </div>
  );
};

interface EmptyStateV2Props {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

/**
 * Empty State Component V2
 * 
 * Displays when no data is available
 */
export const EmptyStateV2 = ({
  title,
  message,
  actionLabel,
  onAction,
  icon
}: EmptyStateV2Props) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
      {icon && <div className="flex justify-center mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
        >
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};

interface WarningStateV2Props {
  message: string;
  title?: string;
  onDismiss?: () => void;
}

/**
 * Warning State Component V2
 * 
 * Displays warning messages
 */
export const WarningStateV2 = ({
  message,
  title = 'Warning',
  onDismiss
}: WarningStateV2Props) => {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-800 mb-1">{title}</h3>
            <p className="text-sm text-yellow-700">{message}</p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-yellow-600 hover:text-yellow-800 transition-colors ml-2"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

const StateComponents = {
  ErrorStateV2,
  LoadingStateV2,
  EmptyStateV2,
  WarningStateV2
};

export default StateComponents;
