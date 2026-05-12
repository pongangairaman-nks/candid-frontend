import { useCallback } from 'react';
import { toast } from 'react-toastify';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  autoClose?: boolean;
}

/**
 * Hook for displaying toast notifications
 * 
 * Uses react-toastify for consistent notifications
 */
export const useToastV2 = () => {
  const showToast = useCallback(
    (message: string, type: ToastType = 'info', options: ToastOptions = {}) => {
      const {
        duration = 3000,
        position = 'top-right',
        autoClose = true
      } = options;

      const toastOptions = {
        position,
        autoClose: autoClose ? duration : (false as const),
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      };

      switch (type) {
        case 'success':
          toast.success(message, toastOptions);
          break;
        case 'error':
          toast.error(message, toastOptions);
          break;
        case 'warning':
          toast.warning(message, toastOptions);
          break;
        case 'info':
        default:
          toast.info(message, toastOptions);
          break;
      }
    },
    []
  );

  const success = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast(message, 'success', options);
    },
    [showToast]
  );

  const error = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast(message, 'error', { ...options, duration: 5000 });
    },
    [showToast]
  );

  const warning = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast(message, 'warning', options);
    },
    [showToast]
  );

  const info = useCallback(
    (message: string, options?: ToastOptions) => {
      showToast(message, 'info', options);
    },
    [showToast]
  );

  return {
    showToast,
    success,
    error,
    warning,
    info
  };
};

export default useToastV2;
