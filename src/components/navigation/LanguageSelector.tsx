'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Locale } from '@/types/i18n';
import { useTranslation } from '@/hooks/useTranslation';
import { useI18nContext } from '@/lib/i18n-context';
import { saveLanguageToCookie } from '@/lib/cookie-utils';
import CountryFlag from '@/components/ui/CountryFlag';

interface LanguageSelectorProps {
  className?: string;
  variant?: 'dropdown' | 'toggle';
  showLabel?: boolean;
}

/**
 * 언어 선택기 컴포넌트
 * 드롭다운과 토글 스타일을 지원하며, 언어 전환 시 현재 페이지 컨텍스트를 유지합니다.
 */
export function LanguageSelector({ 
  className = '', 
  variant = 'dropdown',
  showLabel = true 
}: LanguageSelectorProps) {
  const { locale, locales } = useTranslation(); // URL에서 실제 언어를 가져옴
  const { setLocale } = useI18nContext();
  const router = useRouter();
  const pathname = usePathname();
  
  const [isOpen, setIsOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 감지
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // 언어 정보 매핑 - 서버와 클라이언트에서 동일하게 유지
  const languageInfo = {
    ko: {
      name: '한국어',
      countryCode: 'KR',
      code: 'ko'
    },
    en: {
      name: 'English',
      countryCode: 'US',
      code: 'en'
    }
  };

  // 현재 언어 정보
  const currentLanguage = languageInfo[locale];
  const otherLanguages = locales.filter(lang => lang !== locale);

  // 현재 페이지 컨텍스트를 유지하면서 언어 전환
  const handleLanguageChange = (newLocale: Locale) => {
    if (newLocale === locale || isChanging) {
      return;
    }

    setIsChanging(true);
    setIsOpen(false);

    try {
      // 쿠키에 언어 설정 저장
      saveLanguageToCookie(newLocale);
      
      // Context를 통해 언어 변경
      setLocale(newLocale);
      
      // URL 업데이트 (현재 페이지 컨텍스트 유지)
      let newPath = pathname;
      
      // 기존 언어 코드가 URL에 있다면 제거
      const currentLocalePrefix = `/${locale}`;
      if (newPath.startsWith(currentLocalePrefix)) {
        newPath = newPath.substring(currentLocalePrefix.length) || '/';
      }
      
      // 새로운 언어 코드 추가
      newPath = `/${newLocale}${newPath}`;
      
      // 페이지 이동
      router.push(newPath);
      
    } catch (error) {
      console.error('언어 전환 중 오류 발생:', error);
    } finally {
      setIsChanging(false);
    }
  };

  // 토글 스타일 렌더링
  if (variant === 'toggle') {
    return (
      <div className={`flex items-center ${className}`}>
        {showLabel && (
          <span className="text-sm text-gray-600 dark:text-gray-400 mr-2">
            언어:
          </span>
        )}
        <div className="flex items-center space-x-1">
          {locales.map((lang) => {
            const isActive = lang === locale;
            // 서버와 클라이언트에서 동일한 상태를 보장하기 위해 isLoading 제거
            const isDisabled = isChanging;
            
            return (
              <button
                key={lang}
                onClick={() => handleLanguageChange(lang)}
                disabled={isDisabled}
                className={`px-2 py-1 text-sm font-medium rounded transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title={`Switch to ${lang.toUpperCase()}`}
              >
                {lang.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // 드롭다운 스타일 렌더링
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {showLabel && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          언어 선택
        </label>
      )}
      
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className={`
          flex items-center justify-between w-full px-3 py-2 text-sm
          bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
          rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-colors duration-200
          ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="현재 언어"
      >
        <span className="flex items-center space-x-2">
          <CountryFlag countryCode={currentLanguage.countryCode} size="sm" />
          <span className="text-gray-900 dark:text-gray-100">
            {currentLanguage.name}
          </span>
        </span>
        
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
          <ul className="py-1" role="listbox">
            {otherLanguages.map((lang) => (
              <li key={lang} role="option">
                <button
                  onClick={() => handleLanguageChange(lang)}
                  disabled={isChanging}
                  className={`
                    w-full flex items-center space-x-2 px-3 py-2 text-sm text-left
                    hover:bg-gray-100 dark:hover:bg-gray-700
                    focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700
                    transition-colors duration-150
                    ${isChanging ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                  title={`Switch to ${languageInfo[lang].name}`}
                >
                  <CountryFlag countryCode={languageInfo[lang].countryCode} size="sm" />
                  <span className="text-gray-900 dark:text-gray-100">
                    {languageInfo[lang].name}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {isChanging && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 dark:bg-gray-800 dark:bg-opacity-75 rounded-md">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
}

export default LanguageSelector;