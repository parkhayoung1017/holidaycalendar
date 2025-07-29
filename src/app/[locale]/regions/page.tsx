import { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from '@/lib/translation-loader';
import { CURRENT_YEAR } from '@/lib/constants';

// 지역 이름 매핑 함수
function getRegionName(regionId: string, isKorean: boolean): string {
  const regionNames: Record<string, { ko: string; en: string }> = {
    'asia': { ko: '아시아', en: 'Asia' },
    'europe': { ko: '유럽', en: 'Europe' },
    'north-america': { ko: '북미', en: 'North America' },
    'south-america': { ko: '남미', en: 'South America' },
    'africa': { ko: '아프리카', en: 'Africa' },
    'oceania': { ko: '오세아니아', en: 'Oceania' },
    'middle-east': { ko: '중동', en: 'Middle East' }
  };
  
  return regionNames[regionId]?.[isKorean ? 'ko' : 'en'] || regionId;
}

interface PageProps {
  params: {
    locale: string;
  };
}

// 지역 정보 정의 (수집된 데이터 기반으로 확장)
const REGIONS = [
  {
    id: 'asia',
    nameKey: 'regions.asia',
    countries: ['KR', 'JP', 'CN', 'IN', 'TH', 'SG', 'MY', 'ID', 'PH', 'VN', 'BD', 'PK', 'LK', 'MM', 'KH', 'LA', 'MN', 'KZ', 'UZ', 'KG', 'TJ', 'TM', 'AM', 'AZ', 'GE', 'BT', 'NP', 'BN', 'TL', 'HK', 'MO', 'TW'],
    flag: '🌏'
  },
  {
    id: 'europe',
    nameKey: 'regions.europe', 
    countries: ['GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI', 'IS', 'IE', 'PT', 'BE', 'LU', 'PL', 'CZ', 'SK', 'HU', 'SI', 'HR', 'RS', 'BG', 'RO', 'GR', 'CY', 'MT', 'EE', 'LV', 'LT', 'RU', 'UA', 'BY', 'MD', 'AL', 'BA', 'ME', 'MK', 'AD', 'MC', 'SM', 'VA', 'LI', 'FO', 'GI', 'IM', 'JE', 'GG', 'GL', 'SJ', 'CH', 'AT'],
    flag: '🌍'
  },
  {
    id: 'north-america',
    nameKey: 'regions.northAmerica',
    countries: ['US', 'CA', 'MX', 'GT', 'BZ', 'SV', 'HN', 'NI', 'CR', 'PA', 'CU', 'JM', 'HT', 'DO', 'BB', 'BS', 'DM', 'GD', 'KN', 'LC', 'VC', 'PR', 'VI', 'VG', 'KY', 'TC', 'MS', 'GU', 'SX', 'TT'],
    flag: '🌎'
  },
  {
    id: 'south-america',
    nameKey: 'regions.southAmerica',
    countries: ['BR', 'AR', 'CL', 'PE', 'CO', 'VE', 'EC', 'BO', 'PY', 'UY', 'GY', 'SR'],
    flag: '🌎'
  },
  {
    id: 'africa',
    nameKey: 'regions.africa',
    countries: ['ZA', 'EG', 'NG', 'KE', 'ET', 'GH', 'TZ', 'UG', 'MZ', 'MG', 'ZW', 'BW', 'NA', 'ZM', 'MW', 'MA', 'DZ', 'TN', 'LY', 'SD', 'AO', 'CM', 'CD', 'CG', 'CI', 'GA', 'GN', 'GW', 'LR', 'ML', 'MR', 'MU', 'NE', 'RW', 'SN', 'SC', 'SL', 'SO', 'SS', 'SZ', 'TD', 'TG', 'BF', 'BI', 'BJ', 'CF', 'CV', 'DJ', 'ER', 'GM', 'GQ', 'KM', 'LS', 'MV', 'ST', 'SH'],
    flag: '🌍'
  },
  {
    id: 'oceania',
    nameKey: 'regions.oceania',
    countries: ['AU', 'NZ', 'FJ', 'PG', 'SB', 'VU', 'NC', 'PF', 'KI', 'MH', 'NR', 'NU', 'PW', 'TO', 'TV', 'WS', 'WF'],
    flag: '🌏'
  },
  {
    id: 'middle-east',
    nameKey: 'regions.middleEast',
    countries: ['AE', 'SA', 'IL', 'TR', 'IR', 'IQ', 'SY', 'LB', 'JO', 'KW', 'QA', 'BH', 'OM', 'YE', 'AF', 'PS'],
    flag: '🕌'
  }
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const t = await getTranslations(resolvedParams.locale);
  
  return {
    title: `${t('common.regions.title')} - ${t('common.site.title')}`,
    description: t('common.regions.description'),
    alternates: {
      languages: {
        'ko': '/ko/regions',
        'en': '/en/regions',
      }
    }
  };
}

export default async function RegionsPage({ params }: PageProps) {
  const resolvedParams = await params;
  const isKorean = resolvedParams.locale === 'ko';
  
  return (
    <div className="container mx-auto px-4 py-8">
      {/* 페이지 헤더 */}
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          {isKorean ? '지역별 공휴일' : 'Regional Holidays'}
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          {isKorean ? '전세계 주요 지역의 공휴일 정보를 확인하세요' : 'Check holiday information from major regions around the world'}
        </p>
      </div>

      {/* 지역 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {REGIONS.map((region) => (
          <Link
            key={region.id}
            href={`/${resolvedParams.locale}/regions/${region.id}/${CURRENT_YEAR}`}
            className="group bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-blue-300 transition-all duration-200"
          >
            <div className="text-center">
              {/* 지역 아이콘 */}
              <div className="text-4xl mb-4">
                {region.flag}
              </div>
              
              {/* 지역 이름 */}
              <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600">
                {getRegionName(region.id, isKorean)}
              </h2>
              
              {/* 국가 수 */}
              <p className="text-sm text-gray-500 mb-4">
                {region.countries.length}{isKorean ? '개 국가' : ' countries'}
              </p>
              
              {/* 현재 연도 표시 */}
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {CURRENT_YEAR}{isKorean ? '년' : ''}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 하단 안내 */}
      <div className="text-center mt-12 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {isKorean ? '원하는 지역을 찾지 못하셨나요?' : "Can't find the region you're looking for?"}
        </h3>
        <p className="text-gray-600 mb-4">
          {isKorean ? '홈페이지에서 직접 국가를 검색하거나 오늘의 공휴일을 확인해보세요' : 'Search for countries directly on the homepage or check today\'s holidays'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href={`/${resolvedParams.locale}`}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
}