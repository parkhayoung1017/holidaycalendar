import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { Holiday, Country } from '@/types';
import { SUPPORTED_COUNTRIES, SUPPORTED_YEARS } from '@/lib/constants';
import HolidayList from '@/components/holiday/HolidayList';
import YearNavigation from '@/components/navigation/YearNavigation';
import CountryHeader from '@/components/country/CountryHeader';
import { loadHolidayData } from '@/lib/data-loader';
import { generateCountryYearMetadata } from '@/lib/seo-utils';
import StructuredData from '@/components/seo/StructuredData';

interface PageProps {
  params: Promise<{ 'country-year': string }>;
}

// 동적 메타데이터 생성
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { country, year } = parseCountryYear(resolvedParams['country-year']);
  
  if (!country || !year) {
    return {
      title: '페이지를 찾을 수 없습니다 - World Holiday Calendar'
    };
  }

  const countryInfo = SUPPORTED_COUNTRIES.find(c => c.code === country.toUpperCase());
  if (!countryInfo) {
    return {
      title: '페이지를 찾을 수 없습니다 - World Holiday Calendar'
    };
  }

  // 공휴일 데이터 로드하여 정확한 메타데이터 생성
  try {
    const holidays = await loadHolidayData(country, year);
    return generateCountryYearMetadata(country, year, holidays || []);
  } catch (error) {
    console.error('메타데이터 생성 중 오류:', error);
    return {
      title: `${countryInfo.name} ${year}년 공휴일 - World Holiday Calendar`,
      description: `${countryInfo.name}의 ${year}년 공휴일 정보를 확인하세요.`
    };
  }
}

// 정적 경로 생성
export async function generateStaticParams() {
  const paths: Array<{ 'country-year': string }> = [];
  
  try {
    // 실제 존재하는 데이터 파일을 기반으로 경로 생성
    const { getAllAvailableData } = await import('@/lib/data-loader');
    const availableData = await getAllAvailableData();
    
    for (const [countryCode, years] of Object.entries(availableData)) {
      const countryInfo = SUPPORTED_COUNTRIES.find(c => c.code === countryCode);
      if (countryInfo) {
        for (const year of years) {
          paths.push({
            'country-year': `${countryInfo.name.toLowerCase().replace(/\s+/g, '-')}-${year}`
          });
        }
      }
    }
  } catch (error) {
    console.error('Failed to generate static params:', error);
    // 폴백으로 기본 경로들 생성
    const popularCountries = SUPPORTED_COUNTRIES.filter(c => c.popular);
    const currentYear = new Date().getFullYear();
    
    for (const country of popularCountries) {
      paths.push({
        'country-year': `${country.name.toLowerCase().replace(/\s+/g, '-')}-${currentYear - 1}`
      });
    }
  }
  
  return paths;
}

// URL에서 국가와 연도 파싱
function parseCountryYear(countryYear: string): { country: string | null; year: number | null } {
  const parts = countryYear.split('-');
  const yearStr = parts[parts.length - 1];
  const year = parseInt(yearStr);
  
  // 연도가 유효한 4자리 숫자인지 확인 (1900-2100 범위)
  if (isNaN(year) || year < 1900 || year > 2100) {
    return { country: null, year: null };
  }
  
  const countryParts = parts.slice(0, -1);
  const countryName = countryParts.join(' ');
  
  // 국가명으로 국가 코드 찾기
  const countryInfo = SUPPORTED_COUNTRIES.find(c => 
    c.name.toLowerCase().replace(/\s+/g, '-') === countryName ||
    c.name.toLowerCase() === countryName.replace(/-/g, ' ')
  );
  
  return { 
    country: countryInfo?.code || null, 
    year: year 
  };
}

export default async function CountryYearPage({ params }: PageProps) {
  const resolvedParams = await params;
  const { country, year } = parseCountryYear(resolvedParams['country-year']);
  
  if (!country || !year) {
    notFound();
  }
  
  const countryInfo = SUPPORTED_COUNTRIES.find(c => c.code === country);
  if (!countryInfo) {
    notFound();
  }
  
  // 공휴일 데이터 로드
  const holidays = await loadHolidayData(country, year);
  
  // 해당 국가의 사용 가능한 연도 목록 가져오기
  const { getAvailableYears } = await import('@/lib/data-loader');
  const availableYears = await getAvailableYears(country);
  
  if (!holidays || holidays.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <CountryHeader country={countryInfo} year={year} />
        <YearNavigation 
          country={countryInfo} 
          currentYear={year} 
          availableYears={availableYears}
        />
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-600 mb-4">
            데이터를 준비 중입니다
          </h2>
          <p className="text-gray-500">
            {countryInfo.name}의 {year}년 공휴일 데이터를 곧 제공할 예정입니다.
          </p>
          {availableYears.length > 0 && (
            <p className="text-blue-600 mt-4">
              현재 {availableYears.join(', ')}년 데이터를 제공하고 있습니다.
            </p>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <StructuredData 
        type="country" 
        data={{
          country: countryInfo,
          year,
          holidays
        }}
      />
      
      <CountryHeader 
        country={countryInfo} 
        year={year} 
        totalHolidays={holidays.length}
      />
      
      <YearNavigation 
        country={countryInfo} 
        currentYear={year} 
        availableYears={availableYears}
      />
      
      <HolidayList holidays={holidays} />
    </div>
  );
}