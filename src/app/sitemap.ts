import { MetadataRoute } from 'next';
import { SUPPORTED_COUNTRIES, REGIONS, SUPPORTED_YEARS } from '@/lib/constants';
import fs from 'fs';
import path from 'path';

// 정적 export를 위한 설정
export const dynamic = 'force-static';
export const revalidate = false;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://globalholidays.site';
const SUPPORTED_LOCALES = ['ko', 'en'] as const;
const DEFAULT_LOCALE = 'ko';

/**
 * 언어별 hreflang 어노테이션을 생성하는 헬퍼 함수
 */
function generateAlternateLanguages(path: string): Record<string, string> {
  const alternates: Record<string, string> = {};
  
  for (const locale of SUPPORTED_LOCALES) {
    if (locale === DEFAULT_LOCALE) {
      // 기본 언어는 루트 경로와 언어 경로 둘 다 포함
      alternates[locale] = `${SITE_URL}${path}`;
      alternates['x-default'] = `${SITE_URL}${path}`;
    } else {
      alternates[locale] = `${SITE_URL}/${locale}${path}`;
    }
  }
  
  return alternates;
}

/**
 * 언어별 lastModified 날짜를 가져오는 함수
 */
function getLastModifiedDate(filePath?: string): Date {
  const currentDate = new Date();
  
  if (filePath && fs.existsSync(filePath)) {
    try {
      const stats = fs.statSync(filePath);
      return stats.mtime;
    } catch (error) {
      console.warn(`파일 수정 날짜 확인 실패: ${filePath}`, error);
    }
  }
  
  return currentDate;
}

/**
 * Next.js 자동 사이트맵 생성 (다국어 지원)
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const urls: MetadataRoute.Sitemap = [];

  // 홈페이지 - 모든 언어 버전
  for (const locale of SUPPORTED_LOCALES) {
    const path = '';
    const url = locale === DEFAULT_LOCALE ? SITE_URL : `${SITE_URL}/${locale}`;
    
    urls.push({
      url,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: generateAlternateLanguages(path)
      }
    });
  }

  // 오늘의 공휴일 페이지 - 모든 언어 버전
  for (const locale of SUPPORTED_LOCALES) {
    const path = '/today';
    const url = locale === DEFAULT_LOCALE ? `${SITE_URL}${path}` : `${SITE_URL}/${locale}${path}`;
    
    urls.push({
      url,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: generateAlternateLanguages(path)
      }
    });
  }

  // 지역별 메인 페이지 - 모든 언어 버전
  for (const locale of SUPPORTED_LOCALES) {
    const path = '/regions';
    const url = locale === DEFAULT_LOCALE ? `${SITE_URL}${path}` : `${SITE_URL}/${locale}${path}`;
    
    urls.push({
      url,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: generateAlternateLanguages(path)
      }
    });
  }

  // 국가별 연도 페이지 - 모든 언어 버전
  for (const country of SUPPORTED_COUNTRIES) {
    for (const year of SUPPORTED_YEARS) {
      // 실제 데이터가 있는지 확인
      const dataPath = path.join(process.cwd(), 'data', 'holidays', `${country.code.toLowerCase()}-${year}.json`);
      
      if (fs.existsSync(dataPath)) {
        const countrySlug = country.name.toLowerCase().replace(/\s+/g, '-');
        const pagePath = `/${countrySlug}-${year}`;
        const lastModified = getLastModifiedDate(dataPath);
        
        for (const locale of SUPPORTED_LOCALES) {
          const url = locale === DEFAULT_LOCALE ? `${SITE_URL}${pagePath}` : `${SITE_URL}/${locale}${pagePath}`;
          
          urls.push({
            url,
            lastModified,
            changeFrequency: 'monthly',
            priority: country.popular ? 0.8 : 0.6,
            alternates: {
              languages: generateAlternateLanguages(pagePath)
            }
          });
        }
      }
    }
  }

  // 지역별 연도 페이지 - 모든 언어 버전
  for (const region of REGIONS) {
    for (const year of SUPPORTED_YEARS) {
      const regionSlug = region.name.toLowerCase().replace(/\s+/g, '-');
      const pagePath = `/regions/${regionSlug}/${year}`;
      
      for (const locale of SUPPORTED_LOCALES) {
        const url = locale === DEFAULT_LOCALE ? `${SITE_URL}${pagePath}` : `${SITE_URL}/${locale}${pagePath}`;
        
        urls.push({
          url,
          lastModified: new Date(),
          changeFrequency: 'monthly',
          priority: 0.7,
          alternates: {
            languages: generateAlternateLanguages(pagePath)
          }
        });
      }
    }
  }

  // 개별 공휴일 상세 페이지 - 모든 언어 버전
  for (const country of SUPPORTED_COUNTRIES) {
    for (const year of SUPPORTED_YEARS) {
      const dataPath = path.join(process.cwd(), 'data', 'holidays', `${country.code.toLowerCase()}-${year}.json`);
      
      if (fs.existsSync(dataPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
          const holidayData = data.holidays || data;
          const lastModified = getLastModifiedDate(dataPath);
          
          if (Array.isArray(holidayData)) {
            for (const holiday of holidayData) {
              const slug = generateSlug(holiday.name);
              const pagePath = `/holiday/${country.code.toLowerCase()}/${slug}`;
              
              for (const locale of SUPPORTED_LOCALES) {
                const url = locale === DEFAULT_LOCALE ? `${SITE_URL}${pagePath}` : `${SITE_URL}/${locale}${pagePath}`;
                
                urls.push({
                  url,
                  lastModified,
                  changeFrequency: 'yearly',
                  priority: 0.5,
                  alternates: {
                    languages: generateAlternateLanguages(pagePath)
                  }
                });
              }
            }
          }
        } catch (error) {
          console.warn(`데이터 파일 읽기 실패: ${dataPath}`, error);
        }
      }
    }
  }

  return urls;
}

/**
 * 문자열을 URL 친화적인 슬러그로 변환
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}