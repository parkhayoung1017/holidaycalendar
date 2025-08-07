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
  
  // 국가 매핑 (전체 지원 국가들)
  const countryMapping: Record<string, string> = {
    // A
    'andorra': 'AD',
    'united arab emirates': 'AE',
    'uae': 'AE',
    'afghanistan': 'AF',
    'albania': 'AL',
    'armenia': 'AM',
    'angola': 'AO',
    'argentina': 'AR',
    'austria': 'AT',
    'australia': 'AU',
    'azerbaijan': 'AZ',
    
    // B
    'bosnia and herzegovina': 'BA',
    'bosnia': 'BA',
    'herzegovina': 'BA',
    'barbados': 'BB',
    'bangladesh': 'BD',
    'belgium': 'BE',
    'burkina faso': 'BF',
    'bulgaria': 'BG',
    'bahrain': 'BH',
    'burundi': 'BI',
    'benin': 'BJ',
    'brunei': 'BN',
    'bolivia': 'BO',
    'brazil': 'BR',
    'bahamas': 'BS',
    'bhutan': 'BT',
    'botswana': 'BW',
    'belarus': 'BY',
    'belize': 'BZ',
    
    // C
    'canada': 'CA',
    'democratic republic of the congo': 'CD',
    'drc': 'CD',
    'congo drc': 'CD',
    'central african republic': 'CF',
    'car': 'CF',
    'republic of the congo': 'CG',
    'congo': 'CG',
    'switzerland': 'CH',
    'ivory coast': 'CI',
    'cote d ivoire': 'CI',
    'chile': 'CL',
    'cameroon': 'CM',
    'china': 'CN',
    'colombia': 'CO',
    'costa rica': 'CR',
    'cuba': 'CU',
    'cape verde': 'CV',
    'cyprus': 'CY',
    'czech republic': 'CZ',
    'czechia': 'CZ',
    
    // D
    'germany': 'DE',
    'djibouti': 'DJ',
    'denmark': 'DK',
    'dominica': 'DM',
    'dominican republic': 'DO',
    'algeria': 'DZ',
    
    // E
    'ecuador': 'EC',
    'estonia': 'EE',
    'egypt': 'EG',
    'eritrea': 'ER',
    'spain': 'ES',
    'ethiopia': 'ET',
    
    // F
    'finland': 'FI',
    'fiji': 'FJ',
    'france': 'FR',
    
    // G
    'gabon': 'GA',
    'united kingdom': 'GB',
    'uk': 'GB',
    'britain': 'GB',
    'great britain': 'GB',
    'grenada': 'GD',
    'georgia': 'GE',
    'ghana': 'GH',
    'gambia': 'GM',
    'guinea': 'GN',
    'equatorial guinea': 'GQ',
    'greece': 'GR',
    'guatemala': 'GT',
    'guinea bissau': 'GW',
    'guyana': 'GY',
    
    // H
    'honduras': 'HN',
    'croatia': 'HR',
    'haiti': 'HT',
    'hungary': 'HU',
    
    // I
    'indonesia': 'ID',
    'ireland': 'IE',
    'israel': 'IL',
    'india': 'IN',
    'iraq': 'IQ',
    'iran': 'IR',
    'iceland': 'IS',
    'italy': 'IT',
    
    // J
    'jamaica': 'JM',
    'jordan': 'JO',
    'japan': 'JP',
    
    // K
    'kenya': 'KE',
    'kyrgyzstan': 'KG',
    'cambodia': 'KH',
    'kiribati': 'KI',
    'comoros': 'KM',
    'saint kitts and nevis': 'KN',
    'north korea': 'KP',
    'south korea': 'KR',
    'korea': 'KR',
    'kuwait': 'KW',
    'kazakhstan': 'KZ',
    
    // L
    'laos': 'LA',
    'lebanon': 'LB',
    'saint lucia': 'LC',
    'liechtenstein': 'LI',
    'sri lanka': 'LK',
    'liberia': 'LR',
    'lesotho': 'LS',
    'lithuania': 'LT',
    'luxembourg': 'LU',
    'latvia': 'LV',
    'libya': 'LY',
    
    // M
    'morocco': 'MA',
    'monaco': 'MC',
    'moldova': 'MD',
    'montenegro': 'ME',
    'madagascar': 'MG',
    'marshall islands': 'MH',
    'north macedonia': 'MK',
    'macedonia': 'MK',
    'mali': 'ML',
    'myanmar': 'MM',
    'burma': 'MM',
    'mongolia': 'MN',
    'mauritania': 'MR',
    'malta': 'MT',
    'mauritius': 'MU',
    'maldives': 'MV',
    'malawi': 'MW',
    'mexico': 'MX',
    'malaysia': 'MY',
    'mozambique': 'MZ',
    
    // N
    'namibia': 'NA',
    'niger': 'NE',
    'nigeria': 'NG',
    'nicaragua': 'NI',
    'netherlands': 'NL',
    'norway': 'NO',
    'nepal': 'NP',
    'nauru': 'NR',
    'new zealand': 'NZ',
    
    // O
    'oman': 'OM',
    
    // P
    'panama': 'PA',
    'peru': 'PE',
    'papua new guinea': 'PG',
    'philippines': 'PH',
    'pakistan': 'PK',
    'poland': 'PL',
    'portugal': 'PT',
    'palau': 'PW',
    'paraguay': 'PY',
    
    // Q
    'qatar': 'QA',
    
    // R
    'romania': 'RO',
    'serbia': 'RS',
    'russia': 'RU',
    'russian federation': 'RU',
    'rwanda': 'RW',
    
    // S
    'saudi arabia': 'SA',
    'solomon islands': 'SB',
    'seychelles': 'SC',
    'sudan': 'SD',
    'sweden': 'SE',
    'singapore': 'SG',
    'slovenia': 'SI',
    'slovakia': 'SK',
    'sierra leone': 'SL',
    'san marino': 'SM',
    'senegal': 'SN',
    'somalia': 'SO',
    'suriname': 'SR',
    'south sudan': 'SS',
    'sao tome and principe': 'ST',
    'el salvador': 'SV',
    'syria': 'SY',
    'eswatini': 'SZ',
    'swaziland': 'SZ',
    
    // T
    'chad': 'TD',
    'togo': 'TG',
    'thailand': 'TH',
    'tajikistan': 'TJ',
    'timor leste': 'TL',
    'east timor': 'TL',
    'turkmenistan': 'TM',
    'tunisia': 'TN',
    'tonga': 'TO',
    'turkey': 'TR',
    'trinidad and tobago': 'TT',
    'tuvalu': 'TV',
    'taiwan': 'TW',
    'tanzania': 'TZ',
    
    // U
    'ukraine': 'UA',
    'uganda': 'UG',
    'united states': 'US',
    'usa': 'US',
    'america': 'US',
    'uruguay': 'UY',
    'uzbekistan': 'UZ',
    
    // V
    'vatican city': 'VA',
    'vatican': 'VA',
    'saint vincent and the grenadines': 'VC',
    'venezuela': 'VE',
    'vietnam': 'VN',
    'vanuatu': 'VU',
    
    // W
    'samoa': 'WS',
    
    // Y
    'yemen': 'YE',
    
    // Z
    'south africa': 'ZA',
    'zambia': 'ZM',
    'zimbabwe': 'ZW',
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
      loadHolidayData(countryCode, year, params.locale),
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