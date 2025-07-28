'use client';

import React from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { enrichHolidayWithTranslations } from '@/lib/translation-utils';
import { useI18nContext } from '@/lib/i18n-context';
import { getCountrySlugFromCode } from '@/lib/country-utils';

interface Holiday {
  id: string;
  name: string;
  date: string;
  country?: string;
  countryCode: string;
  type: string;
  global?: boolean;
  translatedName?: string;
  translatedType?: string;
  translatedCountry?: string;
}

interface HolidayCardProps {
  holiday: Holiday;
  showCountry?: boolean;
  className?: string;
  onClick?: (holiday: Holiday) => void;
}

/**
 * 휴일 정보를 표시하는 카드 컴포넌트
 * 번역된 휴일 이름과 타입을 표시합니다.
 */
export function HolidayCard({ 
  holiday, 
  showCountry = false, 
  className = '',
  onClick 
}: HolidayCardProps) {
  const { t, locale } = useTranslation();
  const { translations } = useI18nContext();

  // 공휴일 이름 직접 번역 함수
  const translateHolidayNameDirect = (originalName: string): string => {
    if (locale === 'en') return originalName;
    
    const commonTranslations: Record<string, string> = {
      "New Year's Day": "신정",
      "Christmas Day": "크리스마스",
      "Christmas": "크리스마스",
      "Easter": "부활절",
      "Easter Sunday": "부활절",
      "Easter Monday": "부활절 월요일",
      "Good Friday": "성금요일",
      "Labour Day": "근로자의 날",
      "Labor Day": "근로자의 날",
      "Workers' Day": "근로자의 날",
      "Independence Day": "독립기념일",
      "National Day": "국경일",
      "Thanksgiving": "추수감사절",
      "Thanksgiving Day": "추수감사절",
      "Valentine's Day": "발렌타인데이",
      "Mother's Day": "어머니날",
      "Father's Day": "아버지날",
      "Children's Day": "어린이날",
      "Halloween": "할로윈",
      "New Year's Eve": "신정 전야",
      "Memorial Day": "현충일",
      "Veterans Day": "재향군인의 날",
      "Martin Luther King Jr. Day": "마틴 루터 킹 주니어 데이",
      "Presidents' Day": "대통령의 날",
      "Columbus Day": "콜럼버스 데이",
      "Boxing Day": "박싱 데이",
      "Australia Day": "호주의 날",
      "Canada Day": "캐나다 데이",
      "Bastille Day": "바스티유 데이",
      "St. Patrick's Day": "성 패트릭의 날",
      "St. George's Day": "성 조지의 날",
      "Victory Day": "승전기념일",
      "Constitution Day": "제헌절",
      "Liberation Day": "광복절",
      "Foundation Day": "건국기념일",
      "Flag Day": "국기의 날",
      "Human Rights Day": "인권의 날",
      "Freedom Day": "자유의 날",
      "Family Day": "가족의 날",
      "Youth Day": "청년의 날",
      "National Women's Day": "여성의 날",
      "Heritage Day": "문화유산의 날",
      "Day of Reconciliation": "화해의 날",
      "Day of Goodwill": "선의의 날"
    };
    
    // 정확한 매치 먼저 시도
    if (commonTranslations[originalName]) {
      return commonTranslations[originalName];
    }
    
    // 부분 매치 시도
    for (const [english, korean] of Object.entries(commonTranslations)) {
      if (originalName.toLowerCase().includes(english.toLowerCase())) {
        return korean;
      }
    }
    
    return originalName;
  };

  // 휴일 데이터에 번역 정보 추가
  const enrichedHoliday = React.useMemo(() => {
    return {
      ...holiday,
      translatedName: translateHolidayNameDirect(holiday.name),
      translatedType: holiday.type,
      translatedCountry: holiday.countryCode
    };
  }, [holiday, locale]);

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(locale === 'ko' ? 'ko-KR' : 'en-US', {
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      });
    } catch (error) {
      return dateString;
    }
  };

  // 휴일 타입에 따른 아이콘
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'public':
        return '🏛️';
      case 'religious':
        return '⛪';
      case 'observance':
        return '📅';
      case 'national':
        return '🇰🇷';
      default:
        return '📆';
    }
  };

  // 휴일 타입에 따른 색상
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'public':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'religious':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'observance':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'national':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };



  const handleClick = () => {
    if (onClick) {
      onClick(enrichedHoliday);
    } else {
      // 기본 동작: 공휴일 상세 페이지로 이동
      const slug = enrichedHoliday.name.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-');
      // 국가 코드를 국가 슬러그로 변환
      const countrySlug = getCountrySlugFromCode(enrichedHoliday.countryCode);
      window.location.href = `/${locale}/holiday/${countrySlug}/${slug}`;
    }
  };

  return (
    <div 
      className={`
        bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200
        ${onClick ? 'cursor-pointer hover:border-blue-300' : ''}
        ${className}
      `}
      onClick={handleClick}
    >
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight">
            {enrichedHoliday.translatedName || enrichedHoliday.name}
          </h3>
          {enrichedHoliday.translatedName && enrichedHoliday.translatedName !== enrichedHoliday.name && (
            <p className="text-sm text-gray-500 mt-1">
              {enrichedHoliday.name}
            </p>
          )}
        </div>
        <div className="ml-3 text-2xl">
          {getTypeIcon(enrichedHoliday.type)}
        </div>
      </div>

      {/* 날짜 */}
      <div className="flex items-center mb-3">
        <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-gray-600 text-sm">
          {formatDate(enrichedHoliday.date)}
        </span>
      </div>

      {/* 하단 정보 */}
      <div className="flex items-center justify-between">
        {/* 휴일 타입 */}
        <span className={`
          inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
          ${getTypeColor(enrichedHoliday.type)}
        `}>
          {enrichedHoliday.translatedType || enrichedHoliday.type}
        </span>

        {/* 국가 정보 (옵션) */}
        {showCountry && enrichedHoliday.countryCode && (
          <div className="flex items-center text-xs text-gray-500">
            <span className="mr-1">🌍</span>
            <span>{enrichedHoliday.translatedCountry || enrichedHoliday.countryCode}</span>
          </div>
        )}

        {/* 전역 휴일 표시 */}
        {enrichedHoliday.global && (
          <div className="flex items-center text-xs text-blue-600">
            <span className="mr-1">🌐</span>
            <span>{t('holidays.ui.globalHoliday', '전세계')}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default HolidayCard;