import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadHolidayData, loadCountryData } from '@/lib/data-loader';
import { getAllAvailableData } from '@/lib/data-loader';
import CountryHeader from '@/components/country/CountryHeader';
import HolidayList from '@/components/holiday/HolidayList';
import YearNavigation from '@/components/navigation/YearNavigation';
import { ErrorMessages } from '@/components/error/ErrorMessage';
import { getTranslations } from '@/lib/translation-loader';
import StructuredData from '@/components/seo/StructuredData';

interface PageProps {
  params: {
    locale: string;
    'country-year': string;
  };
}

// URL에서 국가와 연도 파싱
function parseCountryYear(countryYear: string): { countrySlug: string; year: number } | null {
  const match = countryYear.match(/^(.+)-(\d{4})$/);
  if (!match) return null;
  
  const [, countrySlug, yearStr] = match;
  const year = parseInt(yearStr, 10);
  
  if (isNaN(year) || year < 2020 || year > 2030) return null;
  
  return { countrySlug, year };
}

// 국가 슬러그를 국가 코드로 변환
function getCountryCodeFromSlug(slug: string): string | null {
  // 슬러그를 정규화 (소문자, 하이픈을 공백으로)
  const normalizedSlug = slug.toLowerCase().replace(/-/g, ' ');
  
  // 국가 매핑 (주요 국가들)
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
  const parsed = parseCountryYear(params['country-year']);
  if (!parsed) return { title: 'Not Found' };
  
  const { countrySlug, year } = parsed;
  const countryCode = getCountryCodeFromSlug(countrySlug);
  if (!countryCode) return { title: 'Not Found' };
  
  try {
    const [countryData, t] = await Promise.all([
      loadCountryData(countryCode),
      getTranslations(params.locale)
    ]);
    
    const title = `${countryData.name} ${year}${t('time.year')} ${t('navigation.holidays', '공휴일')}`;
    const description = `${countryData.name}의 ${year}년 공휴일 정보를 확인하세요. 날짜, 유형, 설명을 포함한 상세 정보를 제공합니다.`;
    
    return {
      title,
      description,
      alternates: {
        languages: {
          'ko': `/ko/${params['country-year']}`,
          'en': `/en/${params['country-year']}`,
        }
      }
    };
  } catch {
    return { title: 'Not Found' };
  }
}

export default async function CountryYearPage({ params }: PageProps) {
  const parsed = parseCountryYear(params['country-year']);
  if (!parsed) {
    notFound();
  }
  
  const { countrySlug, year } = parsed;
  const countryCode = getCountryCodeFromSlug(countrySlug);
  if (!countryCode) {
    notFound();
  }
  
  // 데이터 가용성 확인
  const availableData = await getAllAvailableData();
  const availableYears = availableData[countryCode];
  if (!availableYears || !availableYears.includes(year)) {
    const countryData = await loadCountryData(countryCode).catch(() => null);
    if (!countryData) {
      notFound();
    }
    
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorMessages.DataNotAvailable 
          year={year} 
          country={countryData.name} 
        />
      </div>
    );
  }
  
  try {
    const [holidayData, countryData] = await Promise.all([
      loadHolidayData(countryCode, year),
      loadCountryData(countryCode)
    ]);
    
    return (
      <div className="container mx-auto px-4 py-8">
        {/* 구조화된 데이터 추가 */}
        <StructuredData 
          type="country" 
          data={{
            country: countryData,
            year: year,
            holidays: holidayData
          }}
          locale={params.locale}
        />
        
        <CountryHeader 
          country={countryData}
          year={year}
          totalHolidays={holidayData.length}
        />
        
        <YearNavigation 
          country={countryData}
          currentYear={year}
          availableYears={availableYears}
          locale={params.locale}
        />
        
        <HolidayList 
          holidays={holidayData}
          country={countryData}
          locale={params.locale}
        />
      </div>
    );
  } catch (error) {
    console.error('Error loading country-year page:', error);
    notFound();
  }
}

// 정적 경로 생성
export async function generateStaticParams() {
  const paths: { locale: string; 'country-year': string }[] = [];
  const locales = ['ko', 'en'];
  
  try {
    // 사용 가능한 데이터 가져오기
    const availableData = await getAllAvailableData();
    
    // 주요 국가들의 경로 생성
    const popularCountries = ['KR', 'US', 'JP', 'CN', 'GB', 'DE', 'FR', 'CA', 'AU'];
    
    for (const locale of locales) {
      for (const countryCode of popularCountries) {
        const availableYears = availableData[countryCode];
        if (availableYears) {
          for (const year of availableYears) {
            try {
              const countryData = await loadCountryData(countryCode);
              const countrySlug = countryData.name.toLowerCase().replace(/\s+/g, '-');
              
              paths.push({
                locale,
                'country-year': `${countrySlug}-${year}`
              });
            } catch (error) {
              console.error(`Error generating path for ${countryCode}:`, error);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in generateStaticParams:', error);
  }
  
  return paths;
}