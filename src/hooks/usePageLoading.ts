'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UsePageLoadingOptions {
  minLoadingTime?: number; // 최소 로딩 시간 (ms)
  showProgress?: boolean;   // 진행률 표시 여부
}

export function usePageLoading(options: UsePageLoadingOptions = {}) {
  const { minLoadingTime = 800, showProgress = false } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    let minTimeTimeout: NodeJS.Timeout;

    const handleRouteChangeStart = () => {
      setIsLoading(true);
      setProgress(0);

      // 진행률 시뮬레이션
      if (showProgress) {
        progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 90) return prev;
            return prev + Math.random() * 15;
          });
        }, 200);
      }

      // 최소 로딩 시간 보장
      minTimeTimeout = setTimeout(() => {
        setProgress(100);
      }, minLoadingTime);
    };

    const handleRouteChangeComplete = () => {
      if (progressInterval) clearInterval(progressInterval);
      if (minTimeTimeout) clearTimeout(minTimeTimeout);
      
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 200);
    };

    const handleRouteChangeError = () => {
      if (progressInterval) clearInterval(progressInterval);
      if (minTimeTimeout) clearTimeout(minTimeTimeout);
      
      setIsLoading(false);
      setProgress(0);
    };

    // Next.js 라우터 이벤트 리스너 등록
    // 주의: App Router에서는 이벤트가 다를 수 있음
    if (typeof window !== 'undefined') {
      // 페이지 이동 감지를 위한 대안적 방법
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;

      history.pushState = function(...args) {
        handleRouteChangeStart();
        const result = originalPushState.apply(this, args);
        setTimeout(handleRouteChangeComplete, minLoadingTime);
        return result;
      };

      history.replaceState = function(...args) {
        handleRouteChangeStart();
        const result = originalReplaceState.apply(this, args);
        setTimeout(handleRouteChangeComplete, minLoadingTime);
        return result;
      };

      // 뒤로가기/앞으로가기 감지
      window.addEventListener('popstate', handleRouteChangeStart);

      return () => {
        history.pushState = originalPushState;
        history.replaceState = originalReplaceState;
        window.removeEventListener('popstate', handleRouteChangeStart);
        if (progressInterval) clearInterval(progressInterval);
        if (minTimeTimeout) clearTimeout(minTimeTimeout);
      };
    }
  }, [minLoadingTime, showProgress]);

  return {
    isLoading,
    progress,
    startLoading: () => {
      setIsLoading(true);
      setProgress(0);
    },
    stopLoading: () => {
      setIsLoading(false);
      setProgress(0);
    }
  };
}

// 데이터 로딩용 훅
export function useDataLoading() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeWithLoading = async <T>(
    asyncFunction: () => Promise<T>,
    loadingMessage?: string
  ): Promise<T | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await asyncFunction();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '오류가 발생했습니다';
      setError(errorMessage);
      console.error('데이터 로딩 오류:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    executeWithLoading,
    clearError: () => setError(null)
  };
}