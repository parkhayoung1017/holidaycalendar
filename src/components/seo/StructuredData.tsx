'use client';

import { generateStructuredData } from '@/lib/seo-utils';
import { useEffect, useState } from 'react';

interface StructuredDataProps {
  type: 'holiday' | 'country' | 'region';
  data: any;
}

/**
 * 구조화된 데이터 (JSON-LD)를 페이지에 삽입하는 컴포넌트
 */
export default function StructuredData({ type, data }: StructuredDataProps) {
  const structuredData = generateStructuredData(type, data);
  
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
 * 웹사이트 전체에 대한 기본 구조화된 데이터
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
  
  // 언어별 사이트 정보
  const siteInfo = {
    ko: {
      name: '세계 공휴일 달력',
      description: '전세계 주요 국가의 공휴일 정보를 제공하는 웹 서비스'
    },
    en: {
      name: 'World Holiday Calendar',
      description: 'A web service providing holiday information from major countries worldwide'
    }
  };
  
  const currentSiteInfo = siteInfo[locale as keyof typeof siteInfo] || siteInfo.ko;
  
  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: currentSiteInfo.name,
    description: currentSiteInfo.description,
    url: `${baseUrl}/${locale}`,
    inLanguage: locale === 'ko' ? 'ko-KR' : 'en-US',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/${locale}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      name: currentSiteInfo.name,
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
 * 조직 정보에 대한 구조화된 데이터
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
  
  // 언어별 조직 정보
  const orgInfo = {
    ko: {
      name: '세계 공휴일 달력',
      description: '전세계 공휴일 정보를 제공하는 웹 서비스'
    },
    en: {
      name: 'World Holiday Calendar',
      description: 'A web service providing worldwide holiday information'
    }
  };
  
  const currentOrgInfo = orgInfo[locale as keyof typeof orgInfo] || orgInfo.ko;
  
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: currentOrgInfo.name,
    url: `${baseUrl}/${locale}`,
    logo: `${baseUrl}/calendar-icon.svg`,
    description: currentOrgInfo.description,
    foundingDate: '2024',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
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