'use client';

import { generateStructuredData } from '@/lib/seo-utils';
import { useTranslation } from '@/hooks/useTranslation';
import { loadTranslationsSync } from '@/lib/translation-loader';
import { useEffect, useState } from 'react';

interface StructuredDataProps {
  type: 'holiday' | 'country' | 'region';
  data: any;
  locale?: string;
}

/**
 * 구조화된 데이터 (JSON-LD)를 페이지에 삽입하는 컴포넌트 - 다국어 지원
 */
export default function StructuredData({ type, data, locale }: StructuredDataProps) {
  const { locale: currentLocale } = useTranslation();
  const targetLocale = locale || currentLocale;
  
  const structuredData = generateStructuredData(type, data, targetLocale);
  
  if (!structuredData) {
    return null;
  }
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
    />
  );
}

/**
 * 웹사이트 전체에 대한 기본 구조화된 데이터 - 다국어 지원
 */
export function WebsiteStructuredData({ locale = 'ko' }: { locale?: string }) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return null;
  }
  
  const baseUrl = 'https://globalholidays.site';
  const translations = loadTranslationsSync(locale, 'common');
  
  // 번역된 사이트 정보 사용
  const siteName = translations.structuredData?.website?.name || translations.site?.title || 'World Holiday Calendar';
  const siteDescription = translations.structuredData?.website?.description || translations.site?.description || 'A web service providing holiday information from major countries worldwide';
  
  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    description: siteDescription,
    url: `${baseUrl}/${locale}`,
    inLanguage: locale === 'ko' ? 'ko-KR' : 'en-US',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/${locale}/search?q={search_term_string}`
      },
      'query-input': translations.structuredData?.search?.queryInput || 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: `${baseUrl}/${locale}`,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/calendar-icon.svg`
      }
    }
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(websiteData)
      }}
    />
  );
}

/**
 * 조직 정보에 대한 구조화된 데이터 - 다국어 지원
 */
export function OrganizationStructuredData({ locale = 'ko' }: { locale?: string }) {
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  if (!isClient) {
    return null;
  }
  
  const baseUrl = 'https://globalholidays.site';
  const translations = loadTranslationsSync(locale, 'common');
  
  // 번역된 조직 정보 사용
  const orgName = translations.structuredData?.organization?.name || translations.site?.title || 'World Holiday Calendar';
  const orgDescription = translations.structuredData?.organization?.description || translations.site?.description || 'A web service providing worldwide holiday information';
  const contactType = translations.structuredData?.organization?.contactType || 'customer service';
  
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: orgName,
    url: `${baseUrl}/${locale}`,
    logo: `${baseUrl}/calendar-icon.svg`,
    description: orgDescription,
    foundingDate: '2024',
    inLanguage: locale === 'ko' ? 'ko-KR' : 'en-US',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: contactType,
      availableLanguage: ['Korean', 'English']
    },
    sameAs: [
      // 소셜 미디어 링크가 있다면 여기에 추가
    ]
  };
  
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(organizationData)
      }}
    />
  );
}