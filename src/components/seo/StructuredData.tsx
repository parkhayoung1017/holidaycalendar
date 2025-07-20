import { generateStructuredData } from '@/lib/seo-utils';

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
export function WebsiteStructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://world-holiday-calendar.com';
  
  const websiteData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'World Holiday Calendar',
    description: '전세계 주요 국가의 공휴일 정보를 제공하는 웹 서비스',
    url: baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      name: 'World Holiday Calendar',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`
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
export function OrganizationStructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://world-holiday-calendar.com';
  
  const organizationData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'World Holiday Calendar',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: '전세계 공휴일 정보를 제공하는 웹 서비스',
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