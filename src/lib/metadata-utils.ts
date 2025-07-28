/**
 * 다국어 메타데이터 생성 유틸리티
 */

import { Metadata } from 'next';
import { Locale } from '@/types/i18n';
import { loadTranslationsSync } from '@/lib/translation-loader';
import { generateAlternateLanguages } from '@/components/seo/HreflangTags';

interface MetadataOptions {
  locale: Locale;
  path?: string;
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: 'website' | 'article';
}

/**
 * 언어별 메타데이터를 생성합니다
 */
export function generateLocalizedMetadata(options: MetadataOptions): Metadata {
  const {
    locale,
    path = '',
    title: customTitle,
    description: customDescription,
    keywords: customKeywords,
    image,
    type = 'website'
  } = options;

  const translations = loadTranslationsSync(locale, 'common');
  const siteData = translations.site || {};
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://globalholidays.site';
  const fullPath = `/${locale}${path}`;
  const fullUrl = `${baseUrl}${fullPath}`;
  
  // 제목 생성 (커스텀 제목이 있으면 사이트 제목과 결합)
  const siteTitle = siteData.title || "World Holiday Calendar";
  const finalTitle = customTitle ? `${customTitle} - ${siteTitle}` : siteTitle;
  
  // 설명 생성
  const finalDescription = customDescription || siteData.description || "Check worldwide holiday information at a glance";
  
  // 키워드 생성
  const siteKeywords = siteData.keywords || "holidays, public holidays, national holidays, world holidays";
  const finalKeywords = customKeywords ? `${customKeywords}, ${siteKeywords}` : siteKeywords;
  
  // 언어별 대체 URL 생성
  const alternateLanguages = generateAlternateLanguages(path);
  
  return {
    title: finalTitle,
    description: finalDescription,
    keywords: finalKeywords,
    alternates: {
      canonical: fullUrl,
      languages: alternateLanguages,
    },
    openGraph: {
      title: finalTitle,
      description: finalDescription,
      type,
      url: fullUrl,
      locale: locale === 'ko' ? 'ko_KR' : 'en_US',
      alternateLocale: locale === 'ko' ? 'en_US' : 'ko_KR',
      siteName: siteTitle,
      ...(image && { images: [{ url: image, alt: finalTitle }] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: finalTitle,
      description: finalDescription,
      ...(image && { images: [image] }),
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * 국가별 공휴일 페이지를 위한 메타데이터 생성
 */
export function generateCountryHolidayMetadata(
  locale: Locale,
  countryName: string,
  year: string,
  path: string
): Metadata {
  const translations = loadTranslationsSync(locale, 'common');
  
  const title = locale === 'ko' 
    ? `${countryName} ${year}년 공휴일`
    : `${countryName} ${year} Public Holidays`;
    
  const description = locale === 'ko'
    ? `${countryName}의 ${year}년 공휴일 정보를 확인하세요. 정확한 날짜와 휴일 정보를 제공합니다.`
    : `Check ${countryName}'s public holidays for ${year}. Get accurate dates and holiday information.`;
    
  const keywords = locale === 'ko'
    ? `${countryName} 공휴일, ${year}년 휴일, ${countryName} 휴일 달력`
    : `${countryName} holidays, ${year} public holidays, ${countryName} holiday calendar`;

  return generateLocalizedMetadata({
    locale,
    path,
    title,
    description,
    keywords,
    type: 'article',
  });
}

/**
 * 지역별 공휴일 페이지를 위한 메타데이터 생성
 */
export function generateRegionalHolidayMetadata(
  locale: Locale,
  regionName: string,
  path: string
): Metadata {
  const title = locale === 'ko' 
    ? `${regionName} 지역 공휴일`
    : `${regionName} Regional Holidays`;
    
  const description = locale === 'ko'
    ? `${regionName} 지역 국가들의 공휴일 정보를 한눈에 비교해보세요.`
    : `Compare holiday information from countries in the ${regionName} region at a glance.`;
    
  const keywords = locale === 'ko'
    ? `${regionName} 공휴일, 지역별 휴일, ${regionName} 국가 휴일`
    : `${regionName} holidays, regional holidays, ${regionName} country holidays`;

  return generateLocalizedMetadata({
    locale,
    path,
    title,
    description,
    keywords,
  });
}

/**
 * 오늘의 공휴일 페이지를 위한 메타데이터 생성
 */
export function generateTodayHolidayMetadata(
  locale: Locale,
  path: string
): Metadata {
  const title = locale === 'ko' 
    ? '오늘의 공휴일'
    : "Today's Holidays";
    
  const description = locale === 'ko'
    ? '오늘 전세계에서 기념하는 공휴일들을 확인하세요. 실시간으로 업데이트되는 최신 정보를 제공합니다.'
    : "Check holidays celebrated around the world today. Get real-time updated information.";
    
  const keywords = locale === 'ko'
    ? '오늘의 공휴일, 실시간 휴일, 전세계 오늘 휴일'
    : "today's holidays, real-time holidays, world holidays today";

  return generateLocalizedMetadata({
    locale,
    path,
    title,
    description,
    keywords,
  });
}

/**
 * 검색 페이지를 위한 메타데이터 생성
 */
export function generateSearchMetadata(
  locale: Locale,
  query?: string,
  path: string = '/search'
): Metadata {
  const baseTitle = locale === 'ko' ? '공휴일 검색' : 'Holiday Search';
  const title = query 
    ? (locale === 'ko' ? `"${query}" 검색 결과` : `"${query}" Search Results`)
    : baseTitle;
    
  const description = locale === 'ko'
    ? '전세계 국가별 공휴일을 검색하세요. 국가명과 연도를 입력하면 정확한 공휴일 정보를 찾을 수 있습니다.'
    : 'Search for public holidays by country worldwide. Enter country name and year to find accurate holiday information.';
    
  const keywords = locale === 'ko'
    ? '공휴일 검색, 국가별 휴일 찾기, 휴일 달력 검색'
    : 'holiday search, find country holidays, holiday calendar search';

  return generateLocalizedMetadata({
    locale,
    path,
    title,
    description,
    keywords,
  });
}