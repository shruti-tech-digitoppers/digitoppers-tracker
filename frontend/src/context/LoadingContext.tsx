'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import DigiLoadingOverlay from '@/components/ui/DigiLoadingOverlay';

interface LoadingOptions {
  message?: string;
  subtext?: string;
  minDuration?: number; // ms
}

interface LoadingContextType {
  isLoading: boolean;
  message: string;
  subtext: string;
  showLoading: (options?: string | LoadingOptions) => void;
  hideLoading: () => void;
  withLoading: <T>(fn: () => Promise<T>, options?: string | LoadingOptions) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('Loading DigiToppers...');
  const [subtext, setSubtext] = useState('Please wait while we prepare your workspace');

  const showLoading = useCallback((options?: string | LoadingOptions) => {
    if (typeof options === 'string') {
      setMessage(options);
      setSubtext('Please wait a moment');
    } else if (options) {
      setMessage(options.message || 'Loading DigiToppers...');
      setSubtext(options.subtext || 'Please wait a moment');
    } else {
      setMessage('Loading DigiToppers...');
      setSubtext('Please wait while we prepare your workspace');
    }
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const withLoading = useCallback(
    async <T,>(fn: () => Promise<T>, options?: string | LoadingOptions): Promise<T> => {
      showLoading(options);
      const minDuration = typeof options === 'object' && options?.minDuration ? options.minDuration : 500;
      const startTime = Date.now();
      try {
        const result = await fn();
        const elapsed = Date.now() - startTime;
        if (elapsed < minDuration) {
          await new Promise((res) => setTimeout(res, minDuration - elapsed));
        }
        return result;
      } finally {
        hideLoading();
      }
    },
    [showLoading, hideLoading]
  );

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        message,
        subtext,
        showLoading,
        hideLoading,
        withLoading,
      }}
    >
      {children}
      {isLoading && (
        <DigiLoadingOverlay
          message={message}
          subtext={subtext}
          onDismiss={hideLoading}
        />
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
