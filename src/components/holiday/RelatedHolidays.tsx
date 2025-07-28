'use client';

import { Holiday, Country } from '@/types';
import { Locale } from '@/types/i18n';
import { format, parseISO } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import Link from 'next/link';
import { getCountrySlugFromCode } from '@/lib/country-utils';

interface RelatedHolidaysProps {
  holidays: Holiday[];
  country: Country;
  locale?: Locale;
}

// 공휴일 슬러그를 생성하는 함수
function createHolidaySlug(holidayName: string): string {
  return holidayName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // 특수문자 제거
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속 하이픈 정리
    .trim();
}

export default function RelatedHolidays({ holidays, country, locale = 'ko' }: RelatedHolidaysProps) {
  if (holidays.length === 0) {
    return null;
  }

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      const dateLocale = locale === 'ko' ? ko : enUS;
      
      if (locale === 'ko') {
        return {
          monthDay: format(date, 'M월 d일', { locale: dateLocale }),
          weekday: format(date, 'EEE', { locale: dateLocale })
        };
      } else {
        return {
          monthDay: format(date, 'MMM d', { locale: dateLocale }),
          weekday: format(date, 'EEE', { locale: dateLocale })
        };
      }
    } catch (error) {
      console.error('날짜 파싱 오류:', error);
      return {
        monthDay: dateString,
        weekday: ''
      };
    }
  };

  // 공휴일 타입별 색상
  const getTypeColor = (type: Holiday['type']) => {
    const colorMap = {
      'public': 'bg-blue-100 text-blue-800',
      'bank': 'bg-green-100 text-green-800',
      'school': 'bg-purple-100 text-purple-800',
      'optional': 'bg-gray-100 text-gray-800'
    };
    return colorMap[type] || 'bg-gray-100 text-gray-800';
  };

  // 공휴일 타입 번역
  const getHolidayTypeText = (type: Holiday['type']) => {
    const typeLabels = {
      'public': locale === 'ko' ? '공휴일' : 'Public Holiday',
      'bank': locale === 'ko' ? '은행휴일' : 'Bank Holiday',
      'school': locale === 'ko' ? '학교휴일' : 'School Holiday',
      'optional': locale === 'ko' ? '선택휴일' : 'Optional Holiday'
    };
    return typeLabels[type] || typeLabels['public'];
  };

  return (
    <section className="bg-white rounded-lg shadow-lg p-8">
      <div className="flex items-center mb-6">
        <span className="text-2xl mr-3">{country.flag}</span>
        <h2 className="text-2xl font-bold text-gray-900">
          {locale === 'ko' ? `${country.name}의 다른 공휴일` : `Other ${country.name} Holidays`}
        </h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {holidays.map((holiday) => {
          const dateInfo = formatDate(holiday.date);
          const slug = createHolidaySlug(holiday.name);
          const countrySlug = getCountrySlugFromCode(country.code);
          
          return (
            <Link
              key={holiday.id}
              href={`/${locale}/holiday/${countrySlug}/${slug}`}
              className="block bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-2">
                    {holiday.name}
                  </h3>
                  
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm text-gray-600">
                      {dateInfo.monthDay} ({dateInfo.weekday})
                    </span>
                    {holiday.global && (
                      <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                        {locale === 'ko' ? '전국' : 'National'}
                      </span>
                    )}
                  </div>
                  
                  {holiday.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {holiday.description.length > 80 
                        ? `${holiday.description.substring(0, 80)}...`
                        : holiday.description
                      }
                    </p>
                  )}
                </div>
                
                <div className="ml-4 flex flex-col items-end space-y-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(holiday.type)}`}>
                    {getHolidayTypeText(holiday.type)}
                  </span>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {dateInfo.monthDay.split(' ')[1]}
                    </div>
                    <div className="text-xs text-gray-500">
                      {dateInfo.monthDay.split(' ')[0]}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      
      {/* 전체 공휴일 보기 링크 */}
      <div className="mt-6 pt-4 border-t">
        <Link
          href={`/${locale}/${country.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().getFullYear()}`}
          className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          {locale === 'ko' ? `${country.name} 전체 공휴일 보기` : `View All ${country.name} Holidays`}
          <svg 
            className="ml-2 w-4 h-4" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5l7 7-7 7" 
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}