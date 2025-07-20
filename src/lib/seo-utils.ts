import { Metadata } from 'next';
import { Holiday, Country } from '@/types';
import { DEFAULT_METADATA, SUPPORTED_COUNTRIES } from './constants';

/**
 * 국가별 연도 페이지의 동적 메타데이터 생성
 */
export function generateCountryYearMetadata(
  countryCode: string,
  year: number,
  holidays: Holiday[]
): Metadata {
  const country = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
  const countryName = country?.name || countryCode;
  
  const title = `${countryName} 공휴일 ${year} - ${DEFAULT_METADATA.SITE_NAME}`;
  const description = `${year}년 ${countryName}의 모든 공휴일 정보를 확인하세요. 총 ${holidays.length}개의 공휴일과 상세 설명을 제공합니다.`;
  
  return {
    title,
    description,
    keywords: [
      `${countryName} 공휴일`,
      `${year}년 공휴일`,
      `${countryName} 휴일`,
      '여행 계획',
      '해외 공휴일',
      ...DEFAULT_METADATA.KEYWORDS
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: DEFAULT_METADATA.SITE_NAME,
      images: [
        {
          url: DEFAULT_METADATA.OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${countryName} ${year} 공휴일 정보`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_METADATA.OG_IMAGE]
    },
    alternates: {
      canonical: `/${countryCode.toLowerCase()}-${year}`
    }
  };
}

/**
 * 지역별 페이지의 동적 메타데이터 생성
 */
export function generateRegionalMetadata(
  regionName: string,
  year: number,
  countries: string[]
): Metadata {
  const title = `${regionName} 지역 공휴일 ${year} - ${DEFAULT_METADATA.SITE_NAME}`;
  const description = `${year}년 ${regionName} 지역 ${countries.length}개 국가의 공휴일을 한눈에 비교해보세요. 여행과 업무 계획에 도움이 되는 정보를 제공합니다.`;
  
  return {
    title,
    description,
    keywords: [
      `${regionName} 공휴일`,
      `${year}년 공휴일`,
      '지역별 공휴일',
      '공휴일 비교',
      '여행 계획',
      ...DEFAULT_METADATA.KEYWORDS
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: DEFAULT_METADATA.SITE_NAME,
      images: [
        {
          url: DEFAULT_METADATA.OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${regionName} ${year} 공휴일 정보`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_METADATA.OG_IMAGE]
    },
    alternates: {
      canonical: `/regions/${regionName.toLowerCase()}/${year}`
    }
  };
}

/**
 * 개별 공휴일 상세 페이지의 동적 메타데이터 생성
 */
export function generateHolidayDetailMetadata(
  holiday: Holiday,
  country: Country
): Metadata {
  const title = `${holiday.name} - ${country.name} 공휴일 정보`;
  const description = holiday.description 
    ? `${holiday.name}에 대한 상세 정보입니다. ${holiday.description.substring(0, 100)}...`
    : `${country.name}의 ${holiday.name} 공휴일 정보를 확인하세요.`;
  
  return {
    title,
    description,
    keywords: [
      holiday.name,
      `${country.name} 공휴일`,
      '공휴일 정보',
      '휴일 유래',
      ...DEFAULT_METADATA.KEYWORDS
    ],
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: DEFAULT_METADATA.SITE_NAME,
      images: [
        {
          url: DEFAULT_METADATA.OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `${holiday.name} - ${country.name}`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_METADATA.OG_IMAGE]
    },
    alternates: {
      canonical: `/holiday/${country.code.toLowerCase()}/${generateSlug(holiday.name)}`
    }
  };
}

/**
 * 오늘의 공휴일 페이지 메타데이터 생성
 */
export function generateTodayHolidaysMetadata(
  todayHolidays: Holiday[] = []
): Metadata {
  const today = new Date().toLocaleDateString('ko-KR');
  const hasHolidays = Array.isArray(todayHolidays) && todayHolidays.length > 0;
  
  const title = hasHolidays 
    ? `오늘의 공휴일 (${today}) - ${DEFAULT_METADATA.SITE_NAME}`
    : `오늘의 공휴일 (${today}) - ${DEFAULT_METADATA.SITE_NAME}`;
    
  const description = hasHolidays
    ? `오늘 ${today}은 ${todayHolidays.length}개 국가에서 공휴일입니다. 실시간 전세계 공휴일 현황을 확인하세요.`
    : `오늘 ${today}은 공휴일인 국가가 없습니다. 매일 업데이트되는 전세계 공휴일 정보를 확인하세요.`;
  
  return {
    title,
    description,
    keywords: [
      '오늘의 공휴일',
      '실시간 공휴일',
      '전세계 공휴일',
      '공휴일 현황',
      ...DEFAULT_METADATA.KEYWORDS
    ],
    openGraph: {
      title,
      description,
      type: 'website',
      siteName: DEFAULT_METADATA.SITE_NAME,
      images: [
        {
          url: DEFAULT_METADATA.OG_IMAGE,
          width: 1200,
          height: 630,
          alt: `오늘의 공휴일 - ${today}`
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [DEFAULT_METADATA.OG_IMAGE]
    },
    alternates: {
      canonical: '/today'
    }
  };
}

/**
 * 문자열을 URL 친화적인 슬러그로 변환
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '') // 특수문자 제거
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속 하이픈 제거
    .trim();
}

/**
 * 구조화된 데이터 (JSON-LD) 생성
 */
export function generateStructuredData(type: 'holiday' | 'country' | 'region', data: any) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://world-holiday-calendar.com';
  
  switch (type) {
    case 'holiday':
      // 오늘의 공휴일 타입인지 확인
      if (data.type === 'today' && Array.isArray(data.holidays)) {
        return {
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: `오늘의 공휴일 - ${data.date}`,
          description: `${data.date} 오늘 공휴일인 국가들의 정보`,
          url: `${baseUrl}/today`,
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: data.holidays.length,
            itemListElement: data.holidays.map((holiday: any, index: number) => ({
              '@type': 'ListItem',
              position: index + 1,
              item: {
                '@type': 'Event',
                name: holiday.name,
                startDate: holiday.date,
                location: {
                  '@type': 'Country',
                  name: holiday.countryName || holiday.country,
                  addressCountry: holiday.countryCode
                }
              }
            }))
          }
        };
      }
      
      // 개별 공휴일 타입
      return {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: data.holiday?.name || '공휴일',
        startDate: data.holiday?.date || new Date().toISOString().split('T')[0],
        endDate: data.holiday?.date || new Date().toISOString().split('T')[0],
        location: {
          '@type': 'Country',
          name: data.country?.name || '국가',
          addressCountry: data.country?.code || 'XX'
        },
        description: data.holiday?.description || `${data.country?.name || '국가'}의 ${data.holiday?.name || '공휴일'}`,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
        organizer: {
          '@type': 'Organization',
          name: DEFAULT_METADATA.SITE_NAME,
          url: baseUrl
        }
      };
      
    case 'country':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `${data.country.name} 공휴일 ${data.year}`,
        description: `${data.year}년 ${data.country.name}의 모든 공휴일 정보`,
        url: `${baseUrl}/${data.country.code.toLowerCase()}-${data.year}`,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: data.holidays.length,
          itemListElement: data.holidays.map((holiday: Holiday, index: number) => ({
            '@type': 'ListItem',
            position: index + 1,
            item: {
              '@type': 'Event',
              name: holiday.name,
              startDate: holiday.date,
              location: {
                '@type': 'Country',
                name: data.country.name
              }
            }
          }))
        }
      };
      
    case 'region':
      return {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `${data.region} 지역 공휴일 ${data.year}`,
        description: `${data.year}년 ${data.region} 지역 공휴일 비교`,
        url: `${baseUrl}/regions/${data.region.toLowerCase()}/${data.year}`,
        about: {
          '@type': 'Place',
          name: data.region,
          containedInPlace: {
            '@type': 'Place',
            name: 'World'
          }
        }
      };
      
    default:
      return null;
  }
}