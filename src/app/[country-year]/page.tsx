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
import { ErrorMessages } from '@/components/error/ErrorMessage';
import { logError } from '@/lib/error-logger';
import ResponsiveBanner from '@/components/ads/ResponsiveBanner';
import SidebarBanner from '@/components/ads/SidebarBanner';

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

// 정적 경로 생성 (SSG)
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
          // 국가 코드 기반 경로 (예: br-2025)
          paths.push({
            'country-year': `${countryCode.toLowerCase()}-${year}`
          });
          // 국가명 기반 경로도 추가 (예: brazil-2025)
          paths.push({
            'country-year': `${countryInfo.name.toLowerCase().replace(/\s+/g, '-')}-${year}`
          });
        }
      }
    }
    
    console.log(`✅ Generated ${paths.length} static paths for country-year pages`);
  } catch (error) {
    console.error('Failed to generate static params:', error);
    // 폴백으로 기본 경로들 생성
    const popularCountries = SUPPORTED_COUNTRIES.filter(c => c.popular);
    const currentYear = new Date().getFullYear();
    
    for (const country of popularCountries) {
      for (let year = currentYear - 1; year <= currentYear + 1; year++) {
        // 국가 코드 기반 경로
        paths.push({
          'country-year': `${country.code.toLowerCase()}-${year}`
        });
        // 국가명 기반 경로
        paths.push({
          'country-year': `${country.name.toLowerCase().replace(/\s+/g, '-')}-${year}`
        });
      }
    }
    
    console.log(`⚠️ Generated ${paths.length} fallback static paths`);
  }
  
  return paths;
}

// ISR 설정 - 1시간마다 재생성
export const revalidate = 3600;

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
  const countryIdentifier = countryParts.join(' ');
  
  // 국가 코드 또는 국가명으로 국가 찾기
  const countryInfo = SUPPORTED_COUNTRIES.find(c => {
    // 국가 코드로 직접 매칭 (예: br -> BR)
    if (c.code.toLowerCase() === countryIdentifier.toLowerCase()) {
      return true;
    }
    // 국가명으로 매칭 (예: brazil -> Brazil, south-korea -> South Korea)
    if (c.name.toLowerCase().replace(/\s+/g, '-') === countryIdentifier ||
        c.name.toLowerCase() === countryIdentifier.replace(/-/g, ' ')) {
      return true;
    }
    return false;
  });
  
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
  
  try {
    // 공휴일 데이터 로드
    const holidays = await loadHolidayData(country, year);
    
    // 해당 국가의 사용 가능한 연도 목록 가져오기
    const { getAvailableYears } = await import('@/lib/data-loader');
    const availableYears = await getAvailableYears(country);
    
    // 요구사항 6.3: 데이터가 없으면 "해당 연도 데이터를 준비 중입니다" 메시지 표시
    if (!holidays || holidays.length === 0) {
      return (
        <div className="container mx-auto px-4 py-8">
          <CountryHeader country={countryInfo} year={year} />
          <YearNavigation 
            country={countryInfo} 
            currentYear={year} 
            availableYears={availableYears}
          />
          
          <div className="mt-8">
            <ErrorMessages.DataNotAvailable 
              year={year} 
              country={countryInfo.name} 
            />
          </div>
          
          {availableYears.length > 0 && (
            <div className="mt-6 text-center">
              <p className="text-blue-600">
                현재 {availableYears.join(', ')}년 데이터를 제공하고 있습니다.
              </p>
            </div>
          )}
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
        
        {/* 상단 광고 */}
        <div className="my-8 flex justify-center">
          <ResponsiveBanner />
        </div>
        
        {/* 메인 콘텐츠와 사이드바 */}
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <HolidayList holidays={holidays} />
          </div>
          
          {/* 사이드바 광고 */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="sticky top-4">
              <SidebarBanner />
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    // 에러 로깅
    logError(error as Error, {
      operation: 'CountryYearPage',
      country,
      year,
      countryName: countryInfo.name,
      timestamp: new Date().toISOString()
    });

    // 에러 발생 시 폴백 UI 표시
    return (
      <div className="container mx-auto px-4 py-8">
        <CountryHeader country={countryInfo} year={year} />
        
        <div className="mt-8">
          <ErrorMessages.ApiFailure 
            onRetry={() => window.location.reload()} 
          />
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-gray-600">
            다른 연도의 데이터를 확인해보세요.
          </p>
        </div>
      </div>
    );
  }
}