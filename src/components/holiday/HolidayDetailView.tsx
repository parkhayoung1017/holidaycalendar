'use client';

import { Holiday, Country } from '@/types';
import { Locale } from '@/types/i18n';
import { format, parseISO } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import Link from 'next/link';
import { translateHolidayName, translateHolidayDescription } from '@/lib/translation-enhancer';
import { useTranslation } from '@/hooks/useTranslation';

interface HolidayDetailViewProps {
  holiday: Holiday;
  country: Country;
  countryOverview: string;
  locale?: Locale;
}

export default function HolidayDetailView({ 
  holiday, 
  country, 
  countryOverview,
  locale = 'ko'
}: HolidayDetailViewProps) {
  const { t } = useTranslation();
  
  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      const dateLocale = locale === 'ko' ? ko : enUS;
      
      if (locale === 'ko') {
        return {
          full: format(date, 'yyyy년 M월 d일 EEEE', { locale: dateLocale }),
          short: format(date, 'M월 d일', { locale: dateLocale }),
          weekday: format(date, 'EEEE', { locale: dateLocale }),
          month: format(date, 'M월', { locale: dateLocale }),
          year: format(date, 'yyyy년', { locale: dateLocale }),
          day: format(date, 'd', { locale: dateLocale })
        };
      } else {
        return {
          full: format(date, 'EEEE, MMMM d, yyyy', { locale: dateLocale }),
          short: format(date, 'MMM d', { locale: dateLocale }),
          weekday: format(date, 'EEEE', { locale: dateLocale }),
          month: format(date, 'MMM', { locale: dateLocale }),
          year: format(date, 'yyyy', { locale: dateLocale }),
          day: format(date, 'd', { locale: dateLocale })
        };
      }
    } catch (error) {
      console.error('날짜 파싱 오류:', error);
      return {
        full: dateString,
        short: dateString,
        weekday: '',
        month: '',
        year: '',
        day: '1'
      };
    }
  };

  const dateInfo = formatDate(holiday.date);
  
  // 번역된 공휴일 정보 - 다중 번역 시스템 사용
  const getTranslatedHolidayName = (name: string): string => {
    // 1. 직접 매핑 시도 (가장 확실한 방법)
    const directMappings: Record<string, string> = {
      'Vesak Day': locale === 'ko' ? '웨삭데이' : 'Vesak Day',
      'Chinese New Year': locale === 'ko' ? '중국 신정' : 'Chinese New Year',
      'Hari Raya Puasa': locale === 'ko' ? '하리 라야 푸아사' : 'Hari Raya Puasa',
      'Hari Raya Haji': locale === 'ko' ? '하리 라야 하지' : 'Hari Raya Haji',
      'Deepavali': locale === 'ko' ? '디파발리' : 'Deepavali',
      'Diwali': locale === 'ko' ? '디파발리' : 'Diwali',
      'Thaipusam': locale === 'ko' ? '타이푸삼' : 'Thaipusam',
      'National Day': locale === 'ko' ? '국경일' : 'National Day',
      'Labour Day': locale === 'ko' ? '노동절' : 'Labour Day',
      'Labor Day': locale === 'ko' ? '노동절' : 'Labor Day',
      'Good Friday': locale === 'ko' ? '성금요일' : 'Good Friday',
      'Christmas Day': locale === 'ko' ? '크리스마스' : 'Christmas Day',
      'Christmas': locale === 'ko' ? '크리스마스' : 'Christmas',
      'Boxing Day': locale === 'ko' ? '박싱 데이' : 'Boxing Day',
      'New Year\'s Day': locale === 'ko' ? '신정' : 'New Year\'s Day',
      'Easter Sunday': locale === 'ko' ? '부활절' : 'Easter Sunday',
      'Easter Monday': locale === 'ko' ? '부활절 월요일' : 'Easter Monday',
      'Independence Day': locale === 'ko' ? '독립기념일' : 'Independence Day',
      'Memorial Day': locale === 'ko' ? '현충일' : 'Memorial Day',
      'Thanksgiving': locale === 'ko' ? '추수감사절' : 'Thanksgiving',
      'Buddha\'s Birthday': locale === 'ko' ? '부처님오신날' : 'Buddha\'s Birthday',
      'Children\'s Day': locale === 'ko' ? '어린이날' : 'Children\'s Day',
      'Constitution Day': locale === 'ko' ? '제헌절' : 'Constitution Day',
      'Liberation Day': locale === 'ko' ? '광복절' : 'Liberation Day',
      'National Foundation Day': locale === 'ko' ? '개천절' : 'National Foundation Day',
      'Hangeul Day': locale === 'ko' ? '한글날' : 'Hangeul Day',
      'Chuseok': locale === 'ko' ? '추석' : 'Chuseok',
      'Lunar New Year': locale === 'ko' ? '설날' : 'Lunar New Year'
    };
    
    if (directMappings[name]) {
      console.log(`✅ Direct mapping for "${name}": "${directMappings[name]}"`);
      return directMappings[name];
    }
    
    // 2. translation-enhancer를 통한 번역 시도
    const enhancedTranslation = translateHolidayName(name, locale);
    if (enhancedTranslation !== name) {
      console.log(`✅ Enhanced translation for "${name}": "${enhancedTranslation}"`);
      return enhancedTranslation;
    }
    
    // 3. 부분 매칭 시도 (예: "Christmas Eve" -> "크리스마스 이브")
    for (const [englishName, translatedName] of Object.entries(directMappings)) {
      if (name.includes(englishName.replace(/'/g, ''))) {
        const partialTranslation = name.replace(englishName.replace(/'/g, ''), translatedName);
        console.log(`✅ Partial matching for "${name}": "${partialTranslation}"`);
        return partialTranslation;
      }
    }
    
    console.log(`⚠️ No translation found for "${name}", using original`);
    return name;
  };
  
  const translatedName = getTranslatedHolidayName(holiday.name);
  // AI 생성 설명을 우선 사용하고, 없으면 번역된 설명 사용
  const translatedDescription = holiday.description || translateHolidayDescription(holiday.name, locale);
  
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

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {/* 헤더 섹션 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {/* 국가 정보 */}
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">{country.flag}</span>
              <div>
                <Link 
                  href={`/${locale}/${country.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().getFullYear()}`}
                  className="text-blue-200 hover:text-white transition-colors"
                >
                  {country.name}
                </Link>
                <div className="text-blue-200 text-sm">{country.region}</div>
              </div>
            </div>
            
            {/* 공휴일 이름 */}
            <h1 className="text-4xl font-bold mb-2">{translatedName}</h1>
            
            {/* 날짜 정보 */}
            <div className="text-xl text-blue-100 mb-4">
              {dateInfo.full}
            </div>
            
            {/* 공휴일 타입 */}
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(holiday.type)}`}>
                {getHolidayTypeText(holiday.type)}
              </span>
              {holiday.global && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  {locale === 'ko' ? '전국 공휴일' : 'National Holiday'}
                </span>
              )}
            </div>
          </div>
          
          {/* 날짜 카드 */}
          <div className="bg-white bg-opacity-90 rounded-lg p-4 text-center min-w-[120px] shadow-lg">
            <div className="text-3xl font-bold text-gray-900">
              {dateInfo.day || '1'}
            </div>
            <div className="text-sm text-gray-700">{dateInfo.month || '1월'}</div>
            <div className="text-sm text-gray-600">{dateInfo.weekday || '월요일'}</div>
          </div>
        </div>
      </div>
      
      {/* 본문 섹션 */}
      <div className="p-8">
        {/* 공휴일 설명 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {locale === 'ko' ? '공휴일 상세 정보' : 'Holiday Details'}
          </h2>
          <div className="prose prose-lg max-w-none">
            <div className="text-gray-700 leading-relaxed text-lg space-y-4">
              {translatedDescription.split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </section>
        
        {/* 지역 정보 (지역별 공휴일인 경우) */}
        {holiday.counties && holiday.counties.length > 0 && (
          <section className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {locale === 'ko' ? '적용 지역' : 'Applicable Regions'}
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex flex-wrap gap-2">
                {holiday.counties.map((county, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {county}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}
        
        {/* 국가별 공휴일 제도 설명 */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {locale === 'ko' ? `${country.name} 공휴일 제도` : `${country.name} Holiday System`}
          </h2>
          <div className="bg-blue-50 rounded-lg p-6">
            <p className="text-gray-700 leading-relaxed">
              {countryOverview}
            </p>
          </div>
        </section>
        
        {/* 추가 정보 */}
        <section className="border-t pt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {locale === 'ko' ? '추가 정보' : 'Additional Information'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                {locale === 'ko' ? '공휴일 유형' : 'Holiday Type'}
              </h4>
              <p className="text-gray-600 text-sm">
                {locale === 'ko' 
                  ? `${getHolidayTypeText(holiday.type)}로 분류되며, ${holiday.global ? '전국적으로 적용됩니다' : '지역적으로 적용됩니다'}.`
                  : `Classified as ${getHolidayTypeText(holiday.type)} and ${holiday.global ? 'applied nationally' : 'applied regionally'}.`
                }
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">
                {locale === 'ko' ? '날짜 정보' : 'Date Information'}
              </h4>
              <p className="text-gray-600 text-sm">
                {locale === 'ko'
                  ? `${dateInfo.year} ${dateInfo.weekday}에 해당합니다.`
                  : `Falls on ${dateInfo.weekday} in ${dateInfo.year}.`
                }
              </p>
            </div>
          </div>
        </section>
        
        {/* 네비게이션 */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href={`/${locale}/${country.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().getFullYear()}`}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-center font-medium"
            >
              {locale === 'ko' ? `${country.name} 전체 공휴일 보기` : `View All ${country.name} Holidays`}
            </Link>
            
            <Link
              href={`/${locale}`}
              className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors text-center font-medium"
            >
              {locale === 'ko' ? '홈페이지로 돌아가기' : 'Back to Home'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}