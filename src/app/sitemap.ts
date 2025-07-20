import { MetadataRoute } from 'next';
import { SUPPORTED_COUNTRIES, REGIONS, SUPPORTED_YEARS } from '@/lib/constants';
import fs from 'fs';
import path from 'path';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://globalholidays.site';

/**
 * Next.js 자동 사이트맵 생성
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const urls: MetadataRoute.Sitemap = [];
  const currentDate = new Date();

  // 홈페이지
  urls.push({
    url: SITE_URL,
    lastModified: currentDate,
    changeFrequency: 'daily',
    priority: 1.0,
  });

  // 오늘의 공휴일 페이지
  urls.push({
    url: `${SITE_URL}/today`,
    lastModified: currentDate,
    changeFrequency: 'daily',
    priority: 0.9,
  });

  // 지역별 메인 페이지
  urls.push({
    url: `${SITE_URL}/regions`,
    lastModified: currentDate,
    changeFrequency: 'weekly',
    priority: 0.8,
  });

  // 국가별 연도 페이지
  for (const country of SUPPORTED_COUNTRIES) {
    for (const year of SUPPORTED_YEARS) {
      // 실제 데이터가 있는지 확인
      const dataPath = path.join(process.cwd(), 'data', 'holidays', `${country.code.toLowerCase()}-${year}.json`);
      
      if (fs.existsSync(dataPath)) {
        const countrySlug = country.name.toLowerCase().replace(/\s+/g, '-');
        urls.push({
          url: `${SITE_URL}/${countrySlug}-${year}`,
          lastModified: currentDate,
          changeFrequency: 'monthly',
          priority: country.popular ? 0.8 : 0.6,
        });
      }
    }
  }

  // 지역별 연도 페이지
  for (const region of REGIONS) {
    for (const year of SUPPORTED_YEARS) {
      const regionSlug = region.name.toLowerCase().replace(/\s+/g, '-');
      urls.push({
        url: `${SITE_URL}/regions/${regionSlug}/${year}`,
        lastModified: currentDate,
        changeFrequency: 'monthly',
        priority: 0.7,
      });
    }
  }

  // 개별 공휴일 상세 페이지
  for (const country of SUPPORTED_COUNTRIES) {
    for (const year of SUPPORTED_YEARS) {
      const dataPath = path.join(process.cwd(), 'data', 'holidays', `${country.code.toLowerCase()}-${year}.json`);
      
      if (fs.existsSync(dataPath)) {
        try {
          const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
          const holidayData = data.holidays || data; // holidays 배열이 있으면 사용, 없으면 전체 데이터 사용
          
          if (Array.isArray(holidayData)) {
            for (const holiday of holidayData) {
              const slug = generateSlug(holiday.name);
              urls.push({
                url: `${SITE_URL}/holiday/${country.code.toLowerCase()}/${slug}`,
                lastModified: currentDate,
                changeFrequency: 'yearly',
                priority: 0.5,
              });
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