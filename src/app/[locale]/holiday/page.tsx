import { Metadata } from 'next';
import Link from 'next/link';
import { getAllAvailableData, loadCountryData } from '@/lib/data-loader';
import { CURRENT_YEAR } from '@/lib/constants';

interface PageProps {
  params: {
    locale: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const isKorean = resolvedParams.locale === 'ko';
  
  const title = isKorean ? '국가별 공휴일' : 'Holidays by Country';
  const description = isKorean 
    ? '전세계 주요 국가들의 공휴일 정보를 국가별로 확인하세요.'
    : 'Check holiday information for major countries around the world.';
  
  return {
    title,
    description,
    alternates: {
      languages: {
        'ko': '/ko/holiday',
        'en': '/en/holiday',
      }
    }
  };
}

export default async function HolidayPage({ params }: PageProps) {
  const resolvedParams = await params;
  const isKorean = resolvedParams.locale === 'ko';
  
  try {
    const availableData = await getAllAvailableData();
    
    // 데이터가 있는 국가들만 필터링하고 국가 정보 로드
    const countriesWithData = await Promise.all(
      Object.entries(availableData)
        .filter(([_, years]) => years.length > 0)
        .map(async ([countryCode, years]) => {
          try {
            const countryData = await loadCountryData(countryCode);
            return {
              ...countryData,
              availableYears: years.sort((a, b) => b - a),
              slug: countryData.name.toLowerCase().replace(/\s+/g, '-')
            };
          } catch (error) {
            console.error(`Error loading country data for ${countryCode}:`, error);
            return null;
          }
        })
    );
    
    // null 값 필터링하고 이름순 정렬
    const validCountries = countriesWithData
      .filter(country => country !== null)
      .sort((a, b) => a.name.localeCompare(b.name));
    
    return (
      <div className="container mx-auto px-4 py-8">
        {/* 페이지 헤더 */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {isKorean ? '국가별 공휴일' : 'Holidays by Country'}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {isKorean 
              ? `전세계 ${validCountries.length}개 국가의 공휴일 정보를 확인하세요.`
              : `Check holiday information for ${validCountries.length} countries worldwide.`
            }
          </p>
        </div>
        
        {/* 국가 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {validCountries.map((country) => (
            <Link
              key={country.code}
              href={`/${resolvedParams.locale}/holiday/${country.slug}`}
              className="group bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200"
            >
              <div className="flex items-center mb-4">
                <span className="text-3xl mr-4">{country.flag}</span>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                    {country.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {country.availableYears.length}{isKorean ? '개 연도' : ' years'}
                  </p>
                </div>
              </div>
              
              {/* 사용 가능한 연도 표시 (최대 5개) */}
              <div className="flex flex-wrap gap-2">
                {country.availableYears.slice(0, 5).map((year) => (
                  <span
                    key={year}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      year === CURRENT_YEAR
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {year}
                  </span>
                ))}
                {country.availableYears.length > 5 && (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                    +{country.availableYears.length - 5}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
        
        {/* 하단 안내 */}
        <div className="text-center mt-12 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {isKorean ? '다른 방법으로 공휴일 찾기' : 'Find Holidays Other Ways'}
          </h3>
          <p className="text-gray-600 mb-4">
            {isKorean 
              ? '지역별로 공휴일을 비교하거나 오늘의 공휴일을 확인해보세요.'
              : 'Compare holidays by region or check today\'s holidays.'
            }
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${resolvedParams.locale}/regions`}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isKorean ? '지역별 공휴일' : 'Regional Holidays'}
            </Link>
            <Link
              href={`/${resolvedParams.locale}/today`}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {isKorean ? '오늘의 공휴일' : "Today's Holidays"}
            </Link>
            <Link
              href={`/${resolvedParams.locale}`}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {isKorean ? '홈페이지' : 'Home'}
            </Link>
          </div>
        </div>
      </div>
    );
    
  } catch (error) {
    console.error('Error loading holiday page:', error);
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {isKorean ? '오류가 발생했습니다' : 'An Error Occurred'}
          </h1>
          <p className="text-gray-600 mb-8">
            {isKorean 
              ? '페이지를 로드하는 중 문제가 발생했습니다.'
              : 'There was a problem loading the page.'
            }
          </p>
          <Link
            href={`/${resolvedParams.locale}`}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isKorean ? '홈페이지로 이동' : 'Go to Homepage'}
          </Link>
        </div>
      </div>
    );
  }
}