import { useState } from 'react';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export function useToast() {
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: '',
    type: 'info'
  });

  const showToast = (message: string, type: ToastState['type'] = 'info') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast(prev => ({ ...prev, show: false }));
  };

  return {
    toast,
    showToast,
    hideToast
  };
}