'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Locale, I18nContext, TranslationNamespace } from '@/types/i18n';
import { 
  loadTranslations, 
  smartWarmupCache, 
  startAutoCacheCleanup, 
  stopAutoCacheCleanup,
  debugCachePerformance 
} from './translation-loader';
import { getLanguageFromCookie, saveLanguageToCookie } from './cookie-utils';

// 기본 컨텍스트 값
const defaultContext: I18nContext = {
  locale: 'ko',
  setLocale: () => {},
  translations: {},
  isLoading: true,
};

// React Context 생성
const I18nContextProvider = createContext<I18nContext>(defaultContext);

// 브라우저에서 언어 감지하는 함수
function detectBrowserLanguage(): Locale {
  if (typeof window === 'undefined') {
    return 'ko'; // 서버 사이드에서는 기본값
  }
  
  const browserLang = navigator.language.toLowerCase();
  
  // 한국어 감지
  if (browserLang.startsWith('ko')) {
    return 'ko';
  }
  
  // 영어 감지 (기본값)
  return 'en';
}

// 로컬 스토리지에서 언어 설정 가져오기
function getStoredLanguage(): Locale | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    const stored = localStorage.getItem('preferred-language');
    if (stored === 'ko' || stored === 'en') {
      return stored as Locale;
    }
  } catch (error) {
    console.warn('로컬 스토리지에서 언어 설정을 가져올 수 없습니다:', error);
  }
  
  return null;
}

// 로컬 스토리지에 언어 설정 저장
function storeLanguage(locale: Locale): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    localStorage.setItem('preferred-language', locale);
  } catch (error) {
    console.warn('로컬 스토리지에 언어 설정을 저장할 수 없습니다:', error);
  }
}

interface I18nProviderProps {
  children: ReactNode;
  initialLocale?: Locale;
}

export function I18nProvider({ children, initialLocale }: I18nProviderProps) {
  // initialLocale이 제공되면 그것을 사용, 없으면 기본값 사용
  const [locale, setLocaleState] = useState<Locale>(initialLocale || 'ko');
  const [translations, setTranslations] = useState<Partial<TranslationNamespace>>({});
  const [isLoading, setIsLoading] = useState(true);

  // 성능 최적화 초기화
  useEffect(() => {
    // 자동 캐시 정리 시작 (10분 간격)
    startAutoCacheCleanup(10 * 60 * 1000);
    
    // 스마트 캐시 워밍업 (사용자 언어 우선)
    smartWarmupCache(locale, 'ko').catch(error => 
      console.warn('캐시 워밍업 실패:', error)
    );

    // 개발 환경에서 캐시 성능 디버깅
    if (process.env.NODE_ENV === 'development') {
      setTimeout(() => {
        debugCachePerformance();
      }, 3000);
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      stopAutoCacheCleanup();
    };
  }, []);

  // 언어 변경 함수 (성능 최적화 적용)
  const setLocale = (newLocale: Locale) => {
    if (newLocale === locale) {
      return; // 같은 언어면 아무것도 하지 않음
    }
    
    setIsLoading(true);
    setLocaleState(newLocale);
    
    // 로컬 스토리지와 쿠키 모두에 저장
    storeLanguage(newLocale);
    saveLanguageToCookie(newLocale);
    
    // 새로운 언어의 번역 데이터를 비동기로 로드
    loadTranslations(newLocale)
      .then((newTranslations) => {
        setTranslations(newTranslations);
        setIsLoading(false);
        
        // 언어 변경 후 스마트 캐시 워밍업 (백그라운드)
        smartWarmupCache(newLocale, locale).catch(error => 
          console.warn('언어 변경 후 캐시 워밍업 실패:', error)
        );
      })
      .catch((error) => {
        console.error('번역 데이터 로드 실패:', error);
        setIsLoading(false);
      });
  };

  // 초기 번역 데이터 로드
  useEffect(() => {
    let isMounted = true;
    
    const loadInitialTranslations = async () => {
      try {
        const initialTranslations = await loadTranslations(locale);
        
        if (isMounted) {
          setTranslations(initialTranslations);
          setIsLoading(false);
        }
      } catch (error) {
        console.error('초기 번역 데이터 로드 실패:', error);
        
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    loadInitialTranslations();
    
    return () => {
      isMounted = false;
    };
  }, [locale]);

  const contextValue: I18nContext = {
    locale,
    setLocale,
    translations,
    isLoading,
  };

  return (
    <I18nContextProvider.Provider value={contextValue}>
      {children}
    </I18nContextProvider.Provider>
  );
}

// Context를 사용하는 커스텀 훅
export function useI18nContext(): I18nContext {
  const context = useContext(I18nContextProvider);
  
  if (!context) {
    throw new Error('useI18nContext는 I18nProvider 내부에서만 사용할 수 있습니다');
  }
  
  return context;
}