import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { loadHolidayData, loadCountryData, getAllAvailableData } from '@/lib/data-loader';
import HolidayList from '@/components/holiday/HolidayList';
import { CURRENT_YEAR } from '@/lib/constants';

interface PageProps {
  params: {
    locale: string;
    region: string;
    year: string;
  };
}

// 지역별 국가 매핑
const REGION_COUNTRIES: Record<string, string[]> = {
  'asia': ['KR', 'JP', 'CN', 'IN', 'TH', 'SG', 'MY', 'ID', 'PH', 'VN'],
  'europe': ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI'],
  'north-america': ['US', 'CA', 'MX'],
  'south-america': ['BR', 'AR', 'CL', 'CO', 'PE'],
  'africa': ['ZA', 'NG', 'EG'],
  'oceania': ['AU', 'NZ']
};

// 지역 이름 매핑
function getRegionName(regionId: string, isKorean: boolean): string {
  const regionNames: Record<string, { ko: string; en: string }> = {
    'asia': { ko: '아시아', en: 'Asia' },
    'europe': { ko: '유럽', en: 'Europe' },
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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {regionName} {year}{isKorean ? '년 공휴일' : ' Holidays'}
            </h1>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-2xl mx-auto">
              <p className="text-yellow-800">
                {isKorean 
                  ? `${regionName} 지역의 ${year}년 공휴일 데이터가 아직 준비되지 않았습니다.`
                  : `${year} holiday data for ${regionName} region is not yet available.`
                }
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={`/${resolvedParams.locale}/regions`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {isKorean ? '다른 지역 보기' : 'View Other Regions'}
                </Link>
                <Link
                  href={`/${resolvedParams.locale}/regions/${resolvedParams.region}/${CURRENT_YEAR}`}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {CURRENT_YEAR}{isKorean ? '년 보기' : ' View'}
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
        {/* 페이지 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {regionName} {year}{isKorean ? '년 공휴일' : ' Holidays'}
          </h1>
          <p className="text-lg text-gray-600">
            {isKorean 
              ? `${regionName} 지역 ${validCountryHolidays.length}개 국가의 공휴일 정보`
              : `Holiday information for ${validCountryHolidays.length} countries in ${regionName}`
            }
          </p>
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
        
        {/* 국가별 공휴일 목록 */}
        <div className="space-y-12">
          {validCountryHolidays.map(({ country, holidays }) => (
            <div key={country.code} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* 국가 헤더 */}
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{country.flag}</span>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {country.name}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {holidays.length}{isKorean ? '개 공휴일' : ' holidays'}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/${resolvedParams.locale}/${country.name.toLowerCase().replace(/\s+/g, '-')}-${year}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    {isKorean ? '상세보기' : 'View Details'}
                  </Link>
                </div>
              </div>
              
              {/* 공휴일 목록 */}
              <div className="p-6">
                <HolidayList 
                  holidays={holidays}
                  country={country}
                  locale={resolvedParams.locale}
                />
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