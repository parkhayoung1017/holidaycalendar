import fs from 'fs';
import path from 'path';
import { SUPPORTED_COUNTRIES, REGIONS, SUPPORTED_YEARS } from '../src/lib/constants';

const SITE_URL = 'https://globalholidays.site';
const SUPPORTED_LOCALES = ['ko', 'en'] as const;
const DEFAULT_LOCALE = 'ko';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  alternates?: {
    languages: Record<string, string>;
  };
}

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
function getLastModifiedDate(filePath?: string): string {
  const currentDate = new Date().toISOString().split('T')[0];
  
  if (filePath && fs.existsSync(filePath)) {
    try {
      const stats = fs.statSync(filePath);
      return stats.mtime.toISOString().split('T')[0];
    } catch (error) {
      console.warn(`파일 수정 날짜 확인 실패: ${filePath}`, error);
    }
  }
  
  return currentDate;
}

/**
 * 사이트맵 XML 생성 (다국어 지원)
 */
function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlsXML = urls.map(url => {
    let urlXML = `  <url>\n    <loc>${url.loc}</loc>`;

    if (url.lastmod) {
      urlXML += `\n    <lastmod>${url.lastmod}</lastmod>`;
    }

    if (url.changefreq) {
      urlXML += `\n    <changefreq>${url.changefreq}</changefreq>`;
    }

    if (url.priority !== undefined) {
      urlXML += `\n    <priority>${url.priority}</priority>`;
    }

    // hreflang 어노테이션 추가
    if (url.alternates?.languages) {
      for (const [lang, href] of Object.entries(url.alternates.languages)) {
        urlXML += `\n    <xhtml:link rel="alternate" hreflang="${lang}" href="${href}" />`;
      }
    }

    urlXML += '\n  </url>';
    return urlXML;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urlsXML}
</urlset>`;
}

/**
 * 모든 사이트맵 URL 생성 (다국어 지원)
 */
function generateAllUrls(): SitemapUrl[] {
  const urls: SitemapUrl[] = [];

  // 홈페이지 - 모든 언어 버전
  for (const locale of SUPPORTED_LOCALES) {
    const path = '';
    const url = locale === DEFAULT_LOCALE ? SITE_URL : `${SITE_URL}/${locale}`;
    
    urls.push({
      loc: url,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
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
      loc: url,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'daily',
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
      loc: url,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
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
            loc: url,
            lastmod: lastModified,
            changefreq: 'monthly',
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
          loc: url,
          lastmod: new Date().toISOString().split('T')[0],
          changefreq: 'monthly',
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
                  loc: url,
                  lastmod: lastModified,
                  changefreq: 'yearly',
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

/**
 * 사이트맵 인덱스 파일 생성 (큰 사이트의 경우)
 */
function generateSitemapIndex(sitemapFiles: string[]): string {
  const currentDate = new Date().toISOString().split('T')[0];

  const sitemapsXML = sitemapFiles.map(filename => `  <sitemap>
    <loc>${SITE_URL}/${filename}</loc>
    <lastmod>${currentDate}</lastmod>
  </sitemap>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapsXML}
</sitemapindex>`;
}

/**
 * 메인 사이트맵 생성 함수
 */
async function generateSitemap() {
  try {
    console.log('사이트맵 생성 시작...');

    const urls = generateAllUrls();
    console.log(`총 ${urls.length}개의 URL 생성됨`);

    // URL이 너무 많으면 여러 파일로 분할 (50,000개 제한)
    const maxUrlsPerSitemap = 50000;
    const sitemapFiles: string[] = [];

    if (urls.length <= maxUrlsPerSitemap) {
      // 단일 사이트맵 파일
      const sitemapXML = generateSitemapXML(urls);
      const sitemapPath = path.join(process.cwd(), 'public', 'sitemap.xml');

      fs.writeFileSync(sitemapPath, sitemapXML, 'utf-8');
      console.log(`사이트맵 생성 완료: ${sitemapPath}`);
    } else {
      // 여러 사이트맵 파일로 분할
      const chunks = [];
      for (let i = 0; i < urls.length; i += maxUrlsPerSitemap) {
        chunks.push(urls.slice(i, i + maxUrlsPerSitemap));
      }

      for (let i = 0; i < chunks.length; i++) {
        const filename = `sitemap-${i + 1}.xml`;
        const sitemapXML = generateSitemapXML(chunks[i]);
        const sitemapPath = path.join(process.cwd(), 'public', filename);

        fs.writeFileSync(sitemapPath, sitemapXML, 'utf-8');
        sitemapFiles.push(filename);
        console.log(`사이트맵 파일 생성: ${filename} (${chunks[i].length}개 URL)`);
      }

      // 사이트맵 인덱스 파일 생성
      const sitemapIndexXML = generateSitemapIndex(sitemapFiles);
      const indexPath = path.join(process.cwd(), 'public', 'sitemap.xml');

      fs.writeFileSync(indexPath, sitemapIndexXML, 'utf-8');
      console.log('사이트맵 인덱스 파일 생성 완료');
    }

    console.log('사이트맵 생성 완료!');
  } catch (error) {
    console.error('사이트맵 생성 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  generateSitemap();
}

export { generateSitemap };