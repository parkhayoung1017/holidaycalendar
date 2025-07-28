'use client';

import React from 'react';
import Link from 'next/link';
import SearchBar from '@/components/search/SearchBar';
import MonthlyCalendar from '@/components/calendar/MonthlyCalendar';
import ResponsiveBanner from '@/components/ads/ResponsiveBanner';
import InlineBanner from '@/components/ads/InlineBanner';
import { useTranslation } from '@/hooks/useTranslation';
import { useI18nContext } from '@/lib/i18n-context';
import { translateCountryName } from '@/lib/translation-utils';
import { CURRENT_YEAR } from '@/lib/constants';

interface Country {
  code: string;
  name: string;
  flag: string;
  displayYear: number;
}

interface HomePageContentProps {
  availablePopularCountries: Country[];
  availableData: Record<string, number[]>;
  currentYear: number;
  currentMonth: number;
  monthlyHolidays: any[];
  locale: string;
}

/**
 * 홈페이지 콘텐츠 컴포넌트 - 다국어 지원
 */
export default function HomePageContent({
  availablePopularCountries,
  availableData,
  currentYear,
  currentMonth,
  monthlyHolidays,
  locale
}: HomePageContentProps) {
  const { t, isLoading } = useTranslation();
  const { translations, locale: contextLocale } = useI18nContext();

  // 디버깅을 위한 로그 (개발 환경에서만)
  if (process.env.NODE_ENV === 'development') {
    console.log('HomePageContent - 번역 상태:', {
      locale,
      contextLocale,
      isLoading,
      hasTranslations: !!translations,
      translationsKeys: Object.keys(translations),
      homePopularCountries: t('home.popularCountries'),
      timeYear: t('time.year')
    });
  }

  // 12월인 경우 다음 연도 국가들 필터링
  const nextYearCountries = new Date().getMonth() === 11 
    ? availablePopularCountries.filter(country => 
        availableData[country.code] && availableData[country.code].includes(CURRENT_YEAR + 1)
      )
    : [];

  // 국가명 번역 함수
  const getTranslatedCountryName = (country: Country) => {
    const translatedName = translateCountryName(country.code, translations);
    return translatedName !== country.code ? translatedName : country.name;
  };

  // 번역 데이터가 로딩 중일 때 로딩 표시
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 메인 컨테이너 */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        
        {/* 헤더 섹션 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('home.title')}
          </h1>
          <p className="text-lg md:text-xl text-gray-600 mb-8">
            {t('home.subtitle')}
          </p>
          
          {/* 검색창 */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar 
              placeholder={t('home.searchPlaceholder')}
              className="w-full"
            />
          </div>
          
          {/* 빠른 링크 */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link 
              href={`/${locale}/today`} 
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {t('home.quickLinks.todayHolidays')}
            </Link>
            <span className="text-gray-400">•</span>
            <Link 
              href={`/${locale}/regions/asia/2025`} 
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {t('home.quickLinks.asiaRegion')}
            </Link>
            <span className="text-gray-400">•</span>
            <Link 
              href={`/${locale}/regions/europe/2025`} 
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {t('home.quickLinks.europeRegion')}
            </Link>
          </div>
        </div>

        {/* 상단 광고 */}
        <div className="mb-8 flex justify-center">
          <ResponsiveBanner className="max-w-full" />
        </div>

        {/* 이번 달 캘린더 섹션 */}
        <div className="mb-8">
          <MonthlyCalendar 
            year={currentYear}
            month={currentMonth}
            holidays={monthlyHolidays}
            locale={locale}
          />
        </div>

        {/* 인기 국가 바로가기 섹션 */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            {t('home.popularCountries')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {availablePopularCountries.map((country) => (
              <Link
                key={country.code}
                href={`/${locale}/${country.name.toLowerCase().replace(/\s+/g, '-')}-${country.displayYear}`}
                className="group flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 hover:shadow-md"
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {country.flag}
                </span>
                <span className="text-sm font-medium text-gray-700 text-center">
                  {getTranslatedCountryName(country)}
                </span>
                <span className="text-xs text-gray-500 mt-1">
                  {country.displayYear} {t('time.year')}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* 12월인 경우 다음 연도 섹션 */}
        {nextYearCountries.length > 0 && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg p-8 mb-8 text-white">
            <h2 className="text-2xl font-semibold mb-4 text-center">
              {t('home.nextYearPreview', { year: (CURRENT_YEAR + 1).toString() })}
            </h2>
            <p className="text-center mb-6 opacity-90">
              {t('home.nextYearDescription')}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {nextYearCountries.slice(0, 8).map((country) => (
                <Link
                  key={`${country.code}-next-year`}
                  href={`/${locale}/${country.name.toLowerCase().replace(/\s+/g, '-')}-${CURRENT_YEAR + 1}`}
                  className="flex items-center space-x-2 p-3 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-all duration-200"
                >
                  <span className="text-lg">{country.flag}</span>
                  <span className="text-sm font-medium truncate">
                    {getTranslatedCountryName(country)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 중간 광고 */}
        <div className="mb-8 flex justify-center">
          <InlineBanner />
        </div>

        {/* 기능 소개 섹션 */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <div className="text-3xl mb-3">🔍</div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {t('home.features.search.title')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('home.features.search.description')}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <div className="text-3xl mb-3">🌍</div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {t('home.features.worldwide.title')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('home.features.worldwide.description')}
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-sm text-center">
            <div className="text-3xl mb-3">📅</div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {t('home.features.realtime.title')}
            </h3>
            <p className="text-sm text-gray-600">
              {t('home.features.realtime.description')}
            </p>
          </div>
        </div>

        {/* 하단 정보 */}
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">
            {t('home.bottomInfo.purpose')}
          </p>
          <p className="text-xs text-gray-400">
            {t('home.bottomInfo.tagline')}
          </p>
        </div>
      </div>
    </div>
  );
}