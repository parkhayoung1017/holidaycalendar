'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Locale, TranslationHook, TranslationParams } from '@/types/i18n';
import { useI18nContext } from '@/lib/i18n-context';
import { translateKey, translatePlural, formatLocalizedDate, hasTranslationKey } from '@/lib/translation-utils';

/**
 * URL에서 현재 언어를 추출하는 함수 (안전한 방식)
 */
function extractLocaleFromPath(pathname: string): Locale {
  // 서버 사이드에서는 pathname이 없을 수 있으므로 안전하게 처리
  if (!pathname || typeof window === 'undefined') {
    return 'ko'; // 기본값
  }
  
  const segments = pathname.split('/').filter(Boolean);
  const firstSegment = segments[0];
  
  if (firstSegment === 'ko' || firstSegment === 'en') {
    return firstSegment as Locale;
  }
  
  return 'ko'; // 기본값
}

/**
 * 번역 기능을 제공하는 메인 훅
 * @param namespace 특정 네임스페이스만 사용할 경우 지정 (선택사항)
 * @returns 번역 함수와 언어 정보
 */
export function useTranslation(namespace?: string): TranslationHook & {
  // 추가 유틸리티 함수들
  tPlural: (count: number, keyPrefix: string, params?: TranslationParams) => string;
  tDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  hasKey: (key: string) => boolean;
  isLoading: boolean;
} {
  const { locale, translations, isLoading } = useI18nContext();
  
  // 사용할 번역 데이터 결정
  const getTranslationData = useCallback(() => {
    if (namespace && translations[namespace as keyof typeof translations]) {
      return translations[namespace as keyof typeof translations];
    }
    return translations;
  }, [translations, namespace]);

  // 메인 번역 함수
  const t = useCallback((key: string, params?: TranslationParams): string => {
    const translationData = getTranslationData();
    
    // 네임스페이스가 지정된 경우 키 앞에 네임스페이스를 붙이지 않음
    const fullKey = namespace && !key.includes('.') ? key : key;
    
    // params를 string으로 변환
    const stringParams = params ? Object.entries(params).reduce((acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    }, {} as Record<string, string>) : undefined;
    
    return translateKey(translationData, fullKey, {
      params: stringParams,
      fallback: key // fallback으로 키 자체 사용
    });
  }, [getTranslationData, namespace]);

  // 복수형 번역 함수
  const tPlural = useCallback((
    count: number, 
    keyPrefix: string, 
    params: TranslationParams = {}
  ): string => {
    const translationData = getTranslationData();
    // params를 string으로 변환
    const stringParams = Object.entries(params).reduce((acc, [key, value]) => {
      acc[key] = String(value);
      return acc;
    }, {} as Record<string, string>);
    
    return translatePlural(count, translationData, keyPrefix, stringParams);
  }, [getTranslationData]);

  // 날짜 현지화 함수
  const tDate = useCallback((
    date: Date | string, 
    options: Intl.DateTimeFormatOptions = {}
  ): string => {
    return formatLocalizedDate(date, locale, options);
  }, [locale]);

  // 번역 키 존재 확인 함수
  const hasKey = useCallback((key: string): boolean => {
    const translationData = getTranslationData();
    return hasTranslationKey(translationData, key);
  }, [getTranslationData]);

  return {
    t,
    tPlural,
    tDate,
    hasKey,
    locale,
    locales: ['ko', 'en'] as Locale[],
    isLoading,
  };
}

/**
 * 특정 네임스페이스의 번역만 사용하는 편의 훅들
 */
export function useCommonTranslation() {
  return useTranslation('common');
}

export function useNavigationTranslation() {
  return useTranslation('navigation');
}

export function useHolidayTranslation() {
  return useTranslation('holidays');
}

export function useCountryTranslation() {
  return useTranslation('countries');
}

/**
 * 서버 사이드에서 사용할 수 있는 번역 함수 (Context 없이)
 * @param locale 언어 코드
 * @param translations 번역 데이터
 * @returns 번역 함수
 */
export function createTranslationFunction(
  locale: Locale,
  translations: any
) {
  return {
    t: (key: string, params?: TranslationParams): string => {
      // params를 string으로 변환
      const stringParams = params ? Object.entries(params).reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>) : undefined;
      
      return translateKey(translations, key, { params: stringParams, fallback: key });
    },
    tPlural: (count: number, keyPrefix: string, params: TranslationParams = {}): string => {
      // params를 string으로 변환
      const stringParams = Object.entries(params).reduce((acc, [key, value]) => {
        acc[key] = String(value);
        return acc;
      }, {} as Record<string, string>);
      
      return translatePlural(count, translations, keyPrefix, stringParams);
    },
    tDate: (date: Date | string, options: Intl.DateTimeFormatOptions = {}): string => {
      return formatLocalizedDate(date, locale, options);
    },
    hasKey: (key: string): boolean => {
      return hasTranslationKey(translations, key);
    },
    locale,
    locales: ['ko', 'en'] as Locale[],
  };
}