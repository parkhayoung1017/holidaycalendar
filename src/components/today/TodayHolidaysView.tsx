'use client';

import { Holiday } from '@/types';
import { HOLIDAY_TYPE_LABELS } from '@/lib/constants';
import Link from 'next/link';
import { getCountrySlugFromCode, createHolidaySlug } from '@/lib/country-utils';
import { useI18nContext } from '@/lib/i18n-context';
import { translateCountryName } from '@/lib/translation-utils';

interface HolidayWithCountryInfo extends Holiday {
  countryName: string;
  countryFlag: string;
}

interface TodayHolidaysViewProps {
  holidays: HolidayWithCountryInfo[];
  date: string;
  locale?: string;
}

export default function TodayHolidaysView({ holidays, date, locale }: TodayHolidaysViewProps) {
  const { translations } = useI18nContext();
  
  // 날짜를 한국어 형식으로 포맷
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    });
  };

  // 공휴일명 번역 함수
  const translateHolidayName = (originalName: string): string => {
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
      "Revolution Day": "혁명의 날",
      "Statehood Day": "주 설립일",
      "Armed Forces Day": "국군의 날",
      "Marine Day": "바다의 날",
      "Saint Olav's Day": "성 올라프의 날",
      "Liberation from Fascism": "파시즘 해방의 날",
      "Saint Olav's Eve": "성 올라프 전야"
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

  // 국가명 번역 함수
  const translateCountryNameLocal = (countryCode: string): string => {
    // 직접 번역 매핑 사용 (더 안정적)
    const countryTranslations: Record<string, { ko: string; en: string }> = {
      'FO': { ko: '페로제도', en: 'Faroe Islands' },
      'KR': { ko: '대한민국', en: 'South Korea' },
      'JP': { ko: '일본', en: 'Japan' },
      'CN': { ko: '중국', en: 'China' },
      'US': { ko: '미국', en: 'United States' },
      'GB': { ko: '영국', en: 'United Kingdom' },
      'DE': { ko: '독일', en: 'Germany' },
      'FR': { ko: '프랑스', en: 'France' },
      'IT': { ko: '이탈리아', en: 'Italy' },
      'ES': { ko: '스페인', en: 'Spain' },
      'NL': { ko: '네덜란드', en: 'Netherlands' },
      'CA': { ko: '캐나다', en: 'Canada' },
      'AU': { ko: '호주', en: 'Australia' },
      'BR': { ko: '브라질', en: 'Brazil' },
      'AR': { ko: '아르헨티나', en: 'Argentina' },
      'SG': { ko: '싱가포르', en: 'Singapore' },
      'IN': { ko: '인도', en: 'India' },
      'MX': { ko: '멕시코', en: 'Mexico' },
      'NZ': { ko: '뉴질랜드', en: 'New Zealand' },
      'ZA': { ko: '남아프리카공화국', en: 'South Africa' },
      'EG': { ko: '이집트', en: 'Egypt' },
      'ME': { ko: '몬테네그로', en: 'Montenegro' },
      'CL': { ko: '칠레', en: 'Chile' },
      'LS': { ko: '레소토', en: 'Lesotho' },
      'GM': { ko: '감비아', en: 'Gambia' },
      'PR': { ko: '푸에르토리코', en: 'Puerto Rico' },
      'SM': { ko: '산마리노', en: 'San Marino' }
    };
    
    const translation = countryTranslations[countryCode];
    if (translation) {
      return locale === 'ko' ? translation.ko : translation.en;
    }
    
    // 번역이 없으면 translations.countries에서 시도
    if (locale === 'ko' && translations?.countries?.[countryCode]) {
      return translations.countries[countryCode];
    }
    
    // 마지막으로 국가 코드 반환
    return countryCode;
  };

  // 공휴일을 국가별로 그룹화
  const holidaysByCountry = holidays.reduce((acc, holiday) => {
    const key = holiday.countryCode;
    if (!acc[key]) {
      acc[key] = {
        countryCode: holiday.countryCode,
        countryName: holiday.countryName,
        countryFlag: holiday.countryFlag,
        holidays: []
      };
    }
    acc[key].holidays.push(holiday);
    return acc;
  }, {} as Record<string, {
    countryCode: string;
    countryName: string;
    countryFlag: string;
    holidays: HolidayWithCountryInfo[];
  }>);

  const countryGroups = Object.values(holidaysByCountry);

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {locale === 'en' ? "Today's Holidays" : '오늘의 공휴일'}
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          {locale === 'en' ? 
            new Date(date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long'
            }) : 
            formatDate(date)
          }
        </p>
        <div className="w-24 h-1 bg-blue-500 mx-auto rounded"></div>
      </div>

      {/* 공휴일 목록 또는 빈 상태 메시지 */}
      {countryGroups.length > 0 ? (
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-lg text-gray-700">
              {locale === 'en' ? (
                <>
                  Today there are <span className="font-semibold text-blue-600">{holidays.length} holidays</span> in 
                  <span className="font-semibold text-blue-600"> {countryGroups.length} countries</span>.
                </>
              ) : (
                <>
                  오늘은 <span className="font-semibold text-blue-600">{countryGroups.length}개 국가</span>에서 
                  <span className="font-semibold text-blue-600"> {holidays.length}개의 공휴일</span>이 있습니다.
                </>
              )}
            </p>
          </div>

          {/* 국가별 공휴일 카드 */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {countryGroups.map((group) => (
              <div
                key={group.countryCode}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 p-6"
              >
                {/* 국가 헤더 */}
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">{group.countryFlag}</span>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {translateCountryNameLocal(group.countryCode)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {locale === 'en' ? 
                        `${group.holidays.length} holiday${group.holidays.length > 1 ? 's' : ''}` :
                        `${group.holidays.length}개의 공휴일`
                      }
                    </p>
                  </div>
                </div>

                {/* 공휴일 목록 */}
                <div className="space-y-3">
                  {group.holidays.map((holiday) => {
                    // 공휴일 상세 페이지 URL 생성
                    const holidaySlug = createHolidaySlug(holiday.name);
                    const countrySlug = getCountrySlugFromCode(holiday.countryCode);
                    const holidayDetailUrl = `/${locale || 'ko'}/holiday/${countrySlug}/${holidaySlug}`;

                    return (
                      <div
                        key={holiday.id}
                        className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 rounded-r-lg transition-colors"
                      >
                        <Link 
                          href={holidayDetailUrl}
                          onClick={() => {
                            console.log('TodayHolidaysView 링크 클릭:', {
                              locale,
                              holiday: holiday.name,
                              country: holiday.countryCode,
                              countrySlug: getCountrySlugFromCode(holiday.countryCode),
                              slug: holidaySlug,
                              targetUrl: holidayDetailUrl
                            });
                          }}
                        >
                          <h4 className="font-medium text-gray-900 mb-1 hover:text-blue-600 cursor-pointer transition-colors">
                            {translateHolidayName(holiday.name)}
                          </h4>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                            {HOLIDAY_TYPE_LABELS[holiday.type]}
                          </span>
                          {holiday.global && (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                              {locale === 'en' ? 'National' : '전국'}
                            </span>
                          )}
                        </div>
                        {holiday.description && (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {holiday.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 국가 페이지 링크 */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link
                    href={`/${locale}/${group.countryName.toLowerCase().replace(/\s+/g, '-')}-${new Date().getFullYear()}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center"
                  >
{locale === 'en' ? 
                      `View all ${translateCountryNameLocal(group.countryCode)} holidays` :
                      `${translateCountryNameLocal(group.countryCode)} 전체 공휴일 보기`
                    }
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 공휴일이 없는 경우 */
        <div className="text-center py-12">
          <div className="text-6xl mb-6">📅</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            {locale === 'en' ? 
              'No holidays today' : 
              '오늘은 공휴일인 국가가 없습니다'
            }
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            {locale === 'en' ? 
              `Today, ${new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}, there are no holidays in the countries we support.` :
              `오늘 ${formatDate(date)}은 저희가 지원하는 국가 중 공휴일로 지정된 곳이 없습니다.`
            }
          </p>
          
          {/* 다른 페이지로 이동하는 링크들 */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${locale}`}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {locale === 'en' ? 'Go to Homepage' : '홈페이지로 이동'}
            </Link>
            <Link
              href={`/${locale}/regions`}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {locale === 'en' ? 'View Regional Holidays' : '지역별 공휴일 보기'}
            </Link>
          </div>
        </div>
      )}

      {/* 추가 정보 */}
      <div className="bg-blue-50 rounded-lg p-6 mt-8">
        <div className="flex items-start">
          <div className="text-blue-500 mr-3 mt-1">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-blue-900 mb-2">
              {locale === 'en' ? 'Please Note' : '알아두세요'}
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              {locale === 'en' ? (
                <>
                  <li>• Holiday information is automatically updated daily</li>
                  <li>• Regional holidays may only apply to specific areas</li>
                  <li>• Please check official announcements for accurate holiday information</li>
                </>
              ) : (
                <>
                  <li>• 공휴일 정보는 매일 자동으로 업데이트됩니다</li>
                  <li>• 지역별 공휴일은 해당 지역에서만 적용될 수 있습니다</li>
                  <li>• 정확한 공휴일 정보는 해당 국가의 공식 발표를 확인해주세요</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}