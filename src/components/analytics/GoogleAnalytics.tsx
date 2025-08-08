'use client';

import { useEffect } from 'react';
import Script from 'next/script';

interface GoogleAnalyticsProps {
  gaId: string;
}

/**
 * Google Analytics 컴포넌트
 * 클라이언트 사이드에서만 로드되어 hydration mismatch를 방지합니다.
 */
export default function GoogleAnalytics({ gaId }: GoogleAnalyticsProps) {
  useEffect(() => {
    // gtag 함수가 이미 정의되어 있는지 확인
    if (typeof window !== 'undefined' && !window.gtag) {
      // dataLayer 초기화
      window.dataLayer = window.dataLayer || [];
      
      // gtag 함수 정의
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
      
      // 초기 설정
      window.gtag('js', new Date());
      window.gtag('config', gaId);
    }
  }, [gaId]);

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
    </>
  );
}

// TypeScript 타입 확장
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}