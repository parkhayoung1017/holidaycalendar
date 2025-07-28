'use client';

import { usePathname } from 'next/navigation';
import { Locale } from '@/types/i18n';

interface HreflangTagsProps {
  currentLocale: Locale;
  alternateLocales?: Locale[];
}

/**
 * hreflang 태그를 자동으로 생성하는 컴포넌트
 * SEO 최적화를 위해 언어별 대체 URL을 제공합니다
 */
export default function HreflangTags({ 
  currentLocale, 
  alternateLocales = ['ko', 'en'] 
}: HreflangTagsProps) {
  const pathname = usePathname();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://globalholidays.site';
  
  // 현재 경로에서 언어 코드를 제거하여 기본 경로를 얻습니다
  const getBasePath = (path: string): string => {
    // /ko/path 또는 /en/path 형태에서 언어 코드를 제거
    const pathWithoutLocale = path.replace(/^\/[a-z]{2}(\/|$)/, '/');
    return pathWithoutLocale === '/' ? '' : pathWithoutLocale;
  };
  
  const basePath = getBasePath(pathname);
  
  // 각 언어별 URL 생성
  const generateHreflangUrls = (): Array<{ locale: string; url: string }> => {
    const urls: Array<{ locale: string; url: string }> = [];
    
    // 지원하는 각 언어에 대해 URL 생성
    alternateLocales.forEach(locale => {
      const url = `${baseUrl}/${locale}${basePath}`;
      urls.push({ locale, url });
    });
    
    // x-default는 기본 언어(한국어)로 설정
    const defaultUrl = `${baseUrl}/ko${basePath}`;
    urls.push({ locale: 'x-default', url: defaultUrl });
    
    return urls;
  };
  
  const hreflangUrls = generateHreflangUrls();
  
  return (
    <>
      {hreflangUrls.map(({ locale, url }) => (
        <link
          key={locale}
          rel="alternate"
          hrefLang={locale}
          href={url}
        />
      ))}
    </>
  );
}

/**
 * 서버 컴포넌트에서 사용할 수 있는 hreflang 태그 생성 함수
 */
export function generateHreflangTags(
  currentPath: string,
  currentLocale: Locale,
  alternateLocales: Locale[] = ['ko', 'en']
): Array<{ locale: string; url: string }> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://globalholidays.site';
  
  // 현재 경로에서 언어 코드를 제거하여 기본 경로를 얻습니다
  const getBasePath = (path: string): string => {
    const pathWithoutLocale = path.replace(/^\/[a-z]{2}(\/|$)/, '/');
    return pathWithoutLocale === '/' ? '' : pathWithoutLocale;
  };
  
  const basePath = getBasePath(currentPath);
  const urls: Array<{ locale: string; url: string }> = [];
  
  // 지원하는 각 언어에 대해 URL 생성
  alternateLocales.forEach(locale => {
    const url = `${baseUrl}/${locale}${basePath}`;
    urls.push({ locale, url });
  });
  
  // x-default는 기본 언어(한국어)로 설정
  const defaultUrl = `${baseUrl}/ko${basePath}`;
  urls.push({ locale: 'x-default', url: defaultUrl });
  
  return urls;
}

/**
 * 메타데이터에서 사용할 수 있는 언어별 대체 URL 객체 생성
 */
export function generateAlternateLanguages(
  currentPath: string,
  alternateLocales: Locale[] = ['ko', 'en']
): Record<string, string> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://globalholidays.site';
  
  const getBasePath = (path: string): string => {
    const pathWithoutLocale = path.replace(/^\/[a-z]{2}(\/|$)/, '/');
    return pathWithoutLocale === '/' ? '' : pathWithoutLocale;
  };
  
  const basePath = getBasePath(currentPath);
  const languages: Record<string, string> = {};
  
  // 지원하는 각 언어에 대해 URL 생성
  alternateLocales.forEach(locale => {
    languages[locale] = `${baseUrl}/${locale}${basePath}`;
  });
  
  // x-default는 기본 언어(한국어)로 설정
  languages['x-default'] = `${baseUrl}/ko${basePath}`;
  
  return languages;
}