'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { LoadingOverlay } from '@/components/ui/LoadingSpinner';

interface LoadingContextType {
  isLoading: boolean;
  message: string;
  progress: number;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  setProgress: (progress: number) => void;
  updateMessage: (message: string) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}

interface LoadingProviderProps {
  children: React.ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [progress, setProgressState] = useState(0);

  const showLoading = useCallback((newMessage?: string) => {
    setIsLoading(true);
    // 메시지는 설정하지 않음 (깔끔한 로딩)
    setProgressState(0);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
    setProgressState(0);
  }, []);

  const setProgress = useCallback((newProgress: number) => {
    setProgressState(Math.min(100, Math.max(0, newProgress)));
  }, []);

  const updateMessage = useCallback((newMessage: string) => {
    setMessage(newMessage);
  }, []);

  const value: LoadingContextType = {
    isLoading,
    message,
    progress,
    showLoading,
    hideLoading,
    setProgress,
    updateMessage
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <LoadingOverlay 
        isVisible={isLoading}
        showProgress={progress > 0}
        progress={progress}
      />
    </LoadingContext.Provider>
  );
}