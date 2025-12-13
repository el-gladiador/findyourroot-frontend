'use client';

import { useState, useCallback } from 'react';

export interface ToastConfig {
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export const useToast = () => {
  const [toast, setToast] = useState<ToastConfig | null>(null);

  const showToast = useCallback((config: ToastConfig) => {
    setToast(config);
    setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  return { toast, showToast, hideToast };
};
