import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { loadHolidayData, loadCountryData, getAllAvailableData } from '@/lib/data-loader';
import HolidayList from '@/components/holiday/HolidayList';
import { CURRENT_YEAR } from '@/lib/constants';
import StructuredData from '@/components/seo/StructuredData';

interface PageProps {
  params: {
    locale: string;
    region: string;
    year: string;
  };
}

// 지역별 국가 매핑 (확장된 버전)
const REGION_COUNTRIES: Record<string, string[]> = {
  'asia': ['KR', 'JP', 'CN', 'IN', 'TH', 'SG', 'MY', 'ID', 'PH', 'VN', 'TW', 'HK', 'MO', 'BD', 'LK', 'MM', 'KH', 'LA', 'BN', 'MN'],
  'europe': ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI', 'BE', 'AT', 'CH', 'PT', 'GR', 'IE', 'PL', 'CZ', 'HU', 'RO', 'BG', 'HR', 'SI', 'SK', 'EE', 'LV', 'LT', 'LU', 'MT', 'CY', 'IS', 'ME', 'RS', 'BA', 'MK', 'AL', 'MD', 'UA', 'BY', 'RU'],
  'middle-east': ['AE', 'SA', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'SY', 'IQ', 'IR', 'IL', 'PS', 'TR', 'YE'],
  'north-america': ['US', 'CA', 'MX', 'GT', 'BZ', 'SV', 'HN', 'NI', 'CR', 'PA', 'CU', 'JM', 'HT', 'DO', 'TT', 'BB', 'GD', 'LC', 'VC', 'AG', 'DM', 'KN', 'BS', 'PR'],
  'south-america': ['BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'UY', 'PY', 'BO', 'GY', 'SR', 'GF'],
  'africa': ['ZA', 'NG', 'EG', 'KE', 'GH', 'TZ', 'UG', 'ZW', 'ZM', 'MW', 'MZ', 'BW', 'NA', 'SZ', 'LS', 'MG', 'MU', 'SC', 'ET', 'SO', 'DJ', 'ER', 'SD', 'SS', 'TD', 'CF', 'CM', 'GQ', 'GA', 'CG', 'CD', 'AO', 'ST', 'CV', 'GW', 'GN', 'SL', 'LR', 'CI', 'BF', 'ML', 'NE', 'SN', 'GM', 'MR', 'MA', 'DZ', 'TN', 'LY'],
  'oceania': ['AU', 'NZ', 'FJ', 'PG', 'SB', 'VU', 'NC', 'PF', 'WS', 'TO', 'KI', 'NR', 'PW', 'FM', 'MH', 'TV', 'CK', 'NU', 'TK']
};

// 지역 이름 매핑
function getRegionName(regionId: string, isKorean: boolean): string {
  const regionNames: Record<string, { ko: string; en: string }> = {
    'asia': { ko: '아시아', en: 'Asia' },
    'europe': { ko: '유럽', en: 'Europe' },
    'middle-east': { ko: '중동', en: 'Middle East' },
    'north-america': { ko: '북미', en: 'North America' },
    'south-america': { ko: '남미', en: 'South America' },
    'africa': { ko: '아프리카', en: 'Africa' },
    'oceania': { ko: '오세아니아', en: 'Oceania' }
  };
  
  return regionNames[regionId]?.[isKorean ? 'ko' : 'en'] || regionId;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const year = parseInt(resolvedParams.year);
  const isKorean = resolvedParams.locale === 'ko';
  const regionName = getRegionName(resolvedParams.region, isKorean);
  
  if (isNaN(year) || year < 2020 || year > 2030) {
    return { title: 'Not Found' };
  }
  
  const title = isKorean 
    ? `${regionName} ${year}년 공휴일`
    : `${regionName} ${year} Holidays`;
    
  const description = isKorean
    ? `${regionName} 지역 주요 국가들의 ${year}년 공휴일 정보를 확인하세요.`
    : `Check ${year} holiday information for major countries in ${regionName}.`;
  
  return {
    title,
    description,
    alternates: {
      languages: {
        'ko': `/ko/regions/${resolvedParams.region}/${year}`,
        'en': `/en/regions/${resolvedParams.region}/${year}`,
      }
    }
  };
}

export default async function RegionYearPage({ params }: PageProps) {
  const resolvedParams = await params;
  const year = parseInt(resolvedParams.year);
  const isKorean = resolvedParams.locale === 'ko';
  
  // 연도 유효성 검사
  if (isNaN(year) || year < 2020 || year > 2030) {
    notFound();
  }
  
  // 지역 유효성 검사
  const regionCountries = REGION_COUNTRIES[resolvedParams.region];
  if (!regionCountries) {
    notFound();
  }
  
  const regionName = getRegionName(resolvedParams.region, isKorean);
  
  try {
    // 사용 가능한 데이터 확인
    const availableData = await getAllAvailableData();
    
    // 해당 지역의 국가들 중 데이터가 있는 국가들만 필터링
    const availableCountries = regionCountries.filter(countryCode => 
      availableData[countryCode]?.includes(year)
    );
    
    if (availableCountries.length === 0) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {regionName} {year}{isKorean ? '년 공휴일' : ' Holidays'}
            </h1>
            
            {/* 개선된 데이터 준비중 메시지 */}
            <div className="max-w-3xl mx-auto">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-8 mb-8">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {isKorean ? '데이터 준비중입니다' : 'Data Coming Soon'}
                </h2>
                
                <p className="text-gray-700 mb-6 leading-relaxed">
                  {isKorean 
                    ? `${regionName} 지역의 ${year}년 공휴일 데이터를 준비하고 있습니다. 곧 더 풍부한 정보로 찾아뵙겠습니다.`
                    : `We are preparing ${year} holiday data for the ${regionName} region. We'll be back with comprehensive information soon.`
                  }
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900 text-sm">
                          {isKorean ? '정확한 정보' : 'Accurate Data'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {isKorean ? '신뢰할 수 있는 공휴일 정보' : 'Reliable holiday information'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900 text-sm">
                          {isKorean ? '정기 업데이트' : 'Regular Updates'}
                        </div>
                        <div className="text-xs text-gray-600">
                          {isKorean ? '지속적인 데이터 갱신' : 'Continuous data refresh'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 대안 옵션들 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link
                  href={`/${resolvedParams.locale}/regions`}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="text-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200 transition-colors">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                      </svg>
                    </div>
                    <div className="font-medium text-gray-900 text-sm mb-1">
                      {isKorean ? '다른 지역' : 'Other Regions'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {isKorean ? '다른 지역의 공휴일 확인' : 'Check other regions'}
                    </div>
                  </div>
                </Link>
                
                <Link
                  href={`/${resolvedParams.locale}/regions/${resolvedParams.region}/${CURRENT_YEAR}`}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="text-center">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-green-200 transition-colors">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="font-medium text-gray-900 text-sm mb-1">
                      {CURRENT_YEAR}{isKorean ? '년' : ''}
                    </div>
                    <div className="text-xs text-gray-600">
                      {isKorean ? '현재 연도 데이터' : 'Current year data'}
                    </div>
                  </div>
                </Link>
                
                <Link
                  href={`/${resolvedParams.locale}/today`}
                  className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all group"
                >
                  <div className="text-center">
                    <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-orange-200 transition-colors">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div className="font-medium text-gray-900 text-sm mb-1">
                      {isKorean ? '오늘의 공휴일' : "Today's Holidays"}
                    </div>
                    <div className="text-xs text-gray-600">
                      {isKorean ? '실시간 공휴일 정보' : 'Real-time holidays'}
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // 각 국가의 공휴일 데이터 로드
    const countryHolidays = await Promise.all(
      availableCountries.map(async (countryCode) => {
        try {
          const [holidayData, countryData] = await Promise.all([
            loadHolidayData(countryCode, year),
            loadCountryData(countryCode)
          ]);
          
          return {
            country: countryData,
            holidays: holidayData
          };
        } catch (error) {
          console.error(`Error loading data for ${countryCode}:`, error);
          return null;
        }
      })
    );
    
    // null 값 필터링
    const validCountryHolidays = countryHolidays.filter(item => item !== null);
    
    return (
      <div className="container mx-auto px-4 py-8">
        {/* 구조화된 데이터 추가 */}
        <StructuredData 
          type="region" 
          data={{
            region: regionName,
            year: year,
            countries: validCountryHolidays.map(item => item.country.name)
          }}
          locale={resolvedParams.locale}
        />
        
        {/* 페이지 헤더 - 가독성 개선 */}
        <div className="text-center mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {regionName} {year}{isKorean ? '년 공휴일' : ' Holidays'}
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            {isKorean 
              ? `${regionName} 지역 ${validCountryHolidays.length}개 국가의 공휴일 정보`
              : `Holiday information for ${validCountryHolidays.length} countries in ${regionName}`
            }
          </p>
          
          {/* 지역 통계 정보 */}
          <div className="flex justify-center items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
              <span>{validCountryHolidays.length}{isKorean ? '개 국가' : ' countries'}</span>
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{validCountryHolidays.reduce((total, item) => total + item.holidays.length, 0)}{isKorean ? '개 공휴일' : ' holidays'}</span>
            </div>
            <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{year}</span>
            </div>
          </div>
        </div>
        
        {/* 연도 네비게이션 */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {year > 2020 && (
              <Link
                href={`/${resolvedParams.locale}/regions/${resolvedParams.region}/${year - 1}`}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← {year - 1}
              </Link>
            )}
            <span className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium">
              {year}
            </span>
            {year < 2030 && (
              <Link
                href={`/${resolvedParams.locale}/regions/${resolvedParams.region}/${year + 1}`}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {year + 1} →
              </Link>
            )}
          </div>
        </div>
        
        {/* 국가별 공휴일 목록 - 개선된 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {validCountryHolidays.map(({ country, holidays }) => (
            <div key={country.code} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* 국가 헤더 - 개선된 디자인 */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-5 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="text-3xl mr-4 p-2 bg-white rounded-lg shadow-sm">
                      {country.flag}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 mb-1">
                        {country.name}
                      </h2>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {holidays.length}{isKorean ? '개 공휴일' : ' holidays'}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span>{year}</span>
                      </div>
                    </div>
                  </div>
                  <Link
                    href={`/${resolvedParams.locale}/${country.name.toLowerCase().replace(/\s+/g, '-')}-${year}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
                  >
                    {isKorean ? '상세보기' : 'View Details'}
                  </Link>
                </div>
              </div>
              
              {/* 공휴일 목록 - 컴팩트한 디자인 */}
              <div className="p-6">
                {holidays.length > 0 ? (
                  <div className="space-y-3">
                    {holidays.slice(0, 6).map((holiday, index) => {
                      const holidayDate = new Date(holiday.date);
                      const monthName = holidayDate.toLocaleDateString(isKorean ? 'ko-KR' : 'en-US', { month: 'short' });
                      const day = holidayDate.getDate();
                      
                      return (
                        <div key={holiday.id || index} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="text-center min-w-[50px]">
                              <div className="text-lg font-bold text-blue-600">{day}</div>
                              <div className="text-xs text-gray-500 uppercase">{monthName}</div>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 text-sm leading-tight">
                                {holiday.name}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {holidayDate.toLocaleDateString(isKorean ? 'ko-KR' : 'en-US', { weekday: 'short' })}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </div>
                      );
                    })}
                    
                    {holidays.length > 6 && (
                      <div className="text-center pt-3 border-t border-gray-100">
                        <Link
                          href={`/${resolvedParams.locale}/${country.name.toLowerCase().replace(/\s+/g, '-')}-${year}`}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          {isKorean ? `+${holidays.length - 6}개 더 보기` : `View ${holidays.length - 6} more`}
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">
                      {isKorean ? '공휴일 정보가 없습니다' : 'No holiday information available'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* 하단 네비게이션 */}
        <div className="text-center mt-12 p-6 bg-gray-50 rounded-lg">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${resolvedParams.locale}/regions`}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isKorean ? '다른 지역 보기' : 'View Other Regions'}
            </Link>
            <Link
              href={`/${resolvedParams.locale}`}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {isKorean ? '홈페이지' : 'Home'}
            </Link>
            <Link
              href={`/${resolvedParams.locale}/today`}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {isKorean ? '오늘의 공휴일' : "Today's Holidays"}
            </Link>
          </div>
        </div>
      </div>
    );
    
  } catch (error) {
    console.error('Error loading region page:', error);
    notFound();
  }
}

// 정적 경로 생성
export async function generateStaticParams() {
  const paths: { locale: string; region: string; year: string }[] = [];
  const locales = ['ko', 'en'];
  const regions = Object.keys(REGION_COUNTRIES);
  const years = [2024, 2025, 2026];
  
  for (const locale of locales) {
    for (const region of regions) {
      for (const year of years) {
        paths.push({
          locale,
          region,
          year: year.toString()
        });
      }
    }
  }
  
  return paths;
}