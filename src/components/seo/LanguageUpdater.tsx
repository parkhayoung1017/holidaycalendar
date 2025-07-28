'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Locale } from '@/types/i18n';

/**
 * 현재 경로에 따라 html lang 속성을 동적으로 업데이트하는 컴포넌트
 */
export default function LanguageUpdater() {
  const pathname = usePathname();
  
  useEffect(() => {
    // URL에서 언어 코드 추출
    const detectLocaleFromPath = (path: string): Locale => {
      if (path.startsWith('/ko/') || path === '/ko') return 'ko';
      if (path.startsWith('/en/') || path === '/en') return 'en';
      return 'ko'; // 기본값
    };
    
    const currentLocale = detectLocaleFromPath(pathname);
    
    // html lang 속성 업데이트
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLocale;
    }
  }, [pathname]);
  
  return null; // 렌더링할 내용 없음
}