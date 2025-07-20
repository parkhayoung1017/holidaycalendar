import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { REGIONS, SUPPORTED_COUNTRIES, CURRENT_YEAR } from '@/lib/constants';
import { loadHolidayData, loadCountryData } from '@/lib/data-loader';
import { Holiday, Country } from '@/types';
import RegionalHolidayComparison from '@/components/regional/RegionalHolidayComparison';

interface PageProps {
  params: {
    region: string;
    year: string;
  };
}

// 지역별 공휴일 데이터를 로드하는 함수
async function loadRegionalHolidayData(regionName: string, year: number) {
  const region = REGIONS.find(r => 
    r.name.toLowerCase().replace(/\s+/g, '-') === regionName.toLowerCase()
  );
  
  if (!region) {
    return null;
  }

  const countriesData: Array<{
    country: Country;
    holidays: Holiday[];
  }> = [];

  for (const countryCode of region.countries) {
    const country = await loadCountryData(countryCode);
    if (country) {
      const holidays = await loadHolidayData(countryCode, year);
      countriesData.push({
        country,
        holidays
      });
    }
  }

  return {
    region,
    countriesData: countriesData.filter(data => data.holidays.length > 0)
  };
}

// 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const regionName = decodeURIComponent(params.region);
  const year = parseInt(params.year);
  
  const region = REGIONS.find(r => 
    r.name.toLowerCase().replace(/\s+/g, '-') === regionName.toLowerCase()
  );

  if (!region) {
    return {
      title: '지역을 찾을 수 없습니다',
    };
  }

  const title = `${region.displayName} ${year}년 공휴일 비교 - World Holiday Calendar`;
  const description = `${region.displayName} 대륙 국가들의 ${year}년 공휴일을 한눈에 비교해보세요. ${region.countries.length}개 국가의 공휴일 정보를 제공합니다.`;

  return {
    title,
    description,
    keywords: [
      `${region.displayName} 공휴일`,
      `${year}년 공휴일`,
      '대륙별 공휴일 비교',
      '해외 공휴일',
      ...region.countries.map(code => {
        const country = SUPPORTED_COUNTRIES.find(c => c.code === code);
        return country ? `${country.name} 공휴일` : '';
      }).filter(Boolean)
    ],
    openGraph: {
      title,
      description,
      type: 'website',
    },
  };
}

// 정적 경로 생성 (SSG)
export async function generateStaticParams() {
  const params = [];
  
  for (const region of REGIONS) {
    const regionSlug = region.name.toLowerCase().replace(/\s+/g, '-');
    
    // 현재 연도와 전후 2년씩 생성
    for (let year = CURRENT_YEAR - 2; year <= CURRENT_YEAR + 2; year++) {
      params.push({
        region: regionSlug,
        year: year.toString(),
      });
    }
  }
  
  console.log(`✅ Generated ${params.length} static paths for regional pages`);
  return params;
}

// ISR 설정 - 6시간마다 재생성
export const revalidate = 21600;

export default async function RegionalHolidayPage({ params }: PageProps) {
  const regionName = decodeURIComponent(params.region);
  const year = parseInt(params.year);

  // 연도 유효성 검사
  if (isNaN(year) || year < 2020 || year > 2030) {
    notFound();
  }

  // 지역별 공휴일 데이터 로드
  const data = await loadRegionalHolidayData(regionName, year);
  
  if (!data) {
    notFound();
  }

  const { region, countriesData } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
            <Link href="/" className="hover:text-blue-600">홈</Link>
            <span>›</span>
            <Link href="/regions" className="hover:text-blue-600">대륙별 공휴일</Link>
            <span>›</span>
            <span className="text-gray-900">{region.displayName}</span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {region.displayName} {year}년 공휴일
              </h1>
              <p className="text-gray-600 mt-2">
                {region.countries.length}개 국가의 공휴일을 비교해보세요
              </p>
            </div>
            
            {/* 연도 네비게이션 */}
            <div className="flex items-center gap-2">
              <Link
                href={`/regions/${regionName}/${year - 1}`}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                ← {year - 1}년
              </Link>
              <span className="px-4 py-2 text-sm font-medium bg-blue-100 text-blue-800 rounded-md">
                {year}년
              </span>
              <Link
                href={`/regions/${regionName}/${year + 1}`}
                className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                {year + 1}년 →
              </Link>
            </div>
          </div>
        </div>

        {/* 대륙별 공휴일 비교 컴포넌트 */}
        <RegionalHolidayComparison
          region={region}
          year={year}
          countriesData={countriesData}
        />
      </div>
    </div>
  );
}