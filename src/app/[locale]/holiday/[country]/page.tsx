import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { loadCountryData, getAllAvailableData } from '@/lib/data-loader';
import { CURRENT_YEAR } from '@/lib/constants';

interface PageProps {
  params: {
    locale: string;
    country: string;
  };
}

// 국가 슬러그를 국가 코드로 변환
function getCountryCodeFromSlug(slug: string): string | null {
  const normalizedSlug = slug.toLowerCase().replace(/-/g, ' ');
  
  const countryMapping: Record<string, string> = {
    'south korea': 'KR',
    'korea': 'KR',
    'united states': 'US',
    'usa': 'US',
    'united kingdom': 'GB',
    'uk': 'GB',
    'japan': 'JP',
    'china': 'CN',
    'germany': 'DE',
    'france': 'FR',
    'canada': 'CA',
    'australia': 'AU',
    'brazil': 'BR',
    'india': 'IN',
    'russia': 'RU',
    'italy': 'IT',
    'spain': 'ES',
    'mexico': 'MX',
    'netherlands': 'NL',
    'sweden': 'SE',
    'norway': 'NO',
    'denmark': 'DK',
    'finland': 'FI',
    'poland': 'PL',
    'turkey': 'TR',
    'thailand': 'TH',
    'singapore': 'SG',
    'malaysia': 'MY',
    'indonesia': 'ID',
    'philippines': 'PH',
    'vietnam': 'VN',
    'egypt': 'EG',
    'south africa': 'ZA',
    'nigeria': 'NG',
    'argentina': 'AR',
    'chile': 'CL',
    'colombia': 'CO',
    'peru': 'PE',
    'venezuela': 'VE',
    'new zealand': 'NZ',
  };
  
  return countryMapping[normalizedSlug] || null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const countryCode = getCountryCodeFromSlug(resolvedParams.country);
  const isKorean = resolvedParams.locale === 'ko';
  
  if (!countryCode) {
    return { title: 'Not Found' };
  }
  
  try {
    const countryData = await loadCountryData(countryCode);
    const title = isKorean 
      ? `${countryData.name} 공휴일 정보`
      : `${countryData.name} Holiday Information`;
      
    const description = isKorean
      ? `${countryData.name}의 연도별 공휴일 정보를 확인하세요.`
      : `Check yearly holiday information for ${countryData.name}.`;
    
    return {
      title,
      description,
      alternates: {
        languages: {
          'ko': `/ko/holiday/${resolvedParams.country}`,
          'en': `/en/holiday/${resolvedParams.country}`,
        }
      }
    };
  } catch {
    return { title: 'Not Found' };
  }
}

export default async function CountryHolidayPage({ params }: PageProps) {
  const resolvedParams = await params;
  const countryCode = getCountryCodeFromSlug(resolvedParams.country);
  const isKorean = resolvedParams.locale === 'ko';
  
  if (!countryCode) {
    notFound();
  }
  
  try {
    const [countryData, availableData] = await Promise.all([
      loadCountryData(countryCode),
      getAllAvailableData()
    ]);
    
    const availableYears = availableData[countryCode] || [];
    
    if (availableYears.length === 0) {
      return (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="mb-8">
              <span className="text-6xl mb-4 block">{countryData.flag}</span>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {countryData.name}
              </h1>
              <p className="text-lg text-gray-600">
                {isKorean 
                  ? '아직 공휴일 데이터가 준비되지 않았습니다.'
                  : 'Holiday data is not yet available.'
                }
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${resolvedParams.locale}`}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isKorean ? '홈페이지로 이동' : 'Go to Homepage'}
              </Link>
              <Link
                href={`/${resolvedParams.locale}/regions`}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {isKorean ? '지역별 공휴일' : 'Regional Holidays'}
              </Link>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="container mx-auto px-4 py-8">
        {/* 국가 헤더 */}
        <div className="text-center mb-12">
          <span className="text-6xl mb-4 block">{countryData.flag}</span>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {countryData.name}
          </h1>
          <p className="text-lg text-gray-600">
            {isKorean 
              ? `${availableYears.length}개 연도의 공휴일 정보를 확인할 수 있습니다.`
              : `Holiday information available for ${availableYears.length} years.`
            }
          </p>
        </div>
        
        {/* 연도별 링크 그리드 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
          {availableYears.sort((a, b) => b - a).map((year) => (
            <Link
              key={year}
              href={`/${resolvedParams.locale}/${resolvedParams.country}-${year}`}
              className="group bg-white border border-gray-200 rounded-lg p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-200"
            >
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 group-hover:text-blue-600 mb-2">
                  {year}
                </div>
                <div className="text-sm text-gray-500">
                  {year === CURRENT_YEAR && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {isKorean ? '현재' : 'Current'}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
        
        {/* 빠른 링크 */}
        <div className="text-center bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {isKorean ? '빠른 링크' : 'Quick Links'}
          </h3>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={`/${resolvedParams.locale}/${resolvedParams.country}-${CURRENT_YEAR}`}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {CURRENT_YEAR}{isKorean ? '년 공휴일' : ' Holidays'}
            </Link>
            <Link
              href={`/${resolvedParams.locale}/today`}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {isKorean ? '오늘의 공휴일' : "Today's Holidays"}
            </Link>
            <Link
              href={`/${resolvedParams.locale}/regions`}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {isKorean ? '지역별 공휴일' : 'Regional Holidays'}
            </Link>
          </div>
        </div>
      </div>
    );
    
  } catch (error) {
    console.error('Error loading country holiday page:', error);
    notFound();
  }
}

// 정적 경로 생성
export async function generateStaticParams() {
  const paths: { locale: string; country: string }[] = [];
  const locales = ['ko', 'en'];
  
  // 주요 국가들의 슬러그 생성
  const popularCountries = [
    { code: 'KR', slug: 'south-korea' },
    { code: 'US', slug: 'united-states' },
    { code: 'JP', slug: 'japan' },
    { code: 'CN', slug: 'china' },
    { code: 'GB', slug: 'united-kingdom' },
    { code: 'DE', slug: 'germany' },
    { code: 'FR', slug: 'france' },
    { code: 'CA', slug: 'canada' },
    { code: 'AU', slug: 'australia' },
    { code: 'BR', slug: 'brazil' }
  ];
  
  for (const locale of locales) {
    for (const country of popularCountries) {
      paths.push({
        locale,
        country: country.slug
      });
    }
  }
  
  return paths;
}