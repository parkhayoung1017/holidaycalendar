'use client';

import Link from 'next/link';
import { Country } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

interface YearNavigationProps {
  country: Country;
  currentYear: number;
  availableYears: number[];
  locale: string;
}

export default function YearNavigation({ country, currentYear, availableYears, locale }: YearNavigationProps) {
  const { t } = useTranslation();
  const currentIndex = availableYears.indexOf(currentYear);
  const prevYear = currentIndex < availableYears.length - 1 ? availableYears[currentIndex + 1] : null;
  const nextYear = currentIndex > 0 ? availableYears[currentIndex - 1] : null;
  
  // URL 생성 함수
  const createCountryYearUrl = (year: number) => {
    const countrySlug = country.name.toLowerCase().replace(/\s+/g, '-');
    return `/${locale}/${countrySlug}-${year}`;
  };

  return (
    <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border p-4 mb-6">
      <div className="flex items-center gap-2">
        {prevYear ? (
          <Link
            href={createCountryYearUrl(prevYear)}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {prevYear}{t('time.year')}
          </Link>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 text-gray-400 cursor-not-allowed">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('navigation.prevYear', '이전 연도')}
          </div>
        )}
      </div>

      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900">{currentYear}{t('time.year')}</h2>
        <p className="text-sm text-gray-500">
          {availableYears.length > 0 && (
            <>
              {availableYears[availableYears.length - 1]}{t('time.year')} ~ {availableYears[0]}{t('time.year')} {t('navigation.dataAvailable', '데이터 제공')}
            </>
          )}
        </p>
      </div>

      <div className="flex items-center gap-2">
        {nextYear ? (
          <Link
            href={createCountryYearUrl(nextYear)}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
          >
            {nextYear}{t('time.year')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 text-gray-400 cursor-not-allowed">
            {t('navigation.nextYear', '다음 연도')}
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}