#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

/**
 * 수집된 데이터를 기반으로 constants.ts의 국가 목록을 업데이트하는 스크립트
 */

// 국가 코드와 이름, 플래그 이모지 매핑
const COUNTRY_DATA: Record<string, { name: string; flag: string; region: string; popular?: boolean }> = {
  // 아시아
  'KR': { name: 'South Korea', flag: '🇰🇷', region: 'Asia', popular: true },
  'JP': { name: 'Japan', flag: '🇯🇵', region: 'Asia', popular: true },
  'CN': { name: 'China', flag: '🇨🇳', region: 'Asia', popular: true },
  'IN': { name: 'India', flag: '🇮🇳', region: 'Asia', popular: true },
  'TH': { name: 'Thailand', flag: '🇹🇭', region: 'Asia' },
  'VN': { name: 'Vietnam', flag: '🇻🇳', region: 'Asia' },
  'SG': { name: 'Singapore', flag: '🇸🇬', region: 'Asia', popular: true },
  'MY': { name: 'Malaysia', flag: '🇲🇾', region: 'Asia' },
  'PH': { name: 'Philippines', flag: '🇵🇭', region: 'Asia' },
  'ID': { name: 'Indonesia', flag: '🇮🇩', region: 'Asia' },
  'TW': { name: 'Taiwan', flag: '🇹🇼', region: 'Asia' },
  'HK': { name: 'Hong Kong', flag: '🇭🇰', region: 'Asia' },
  'MO': { name: 'Macau', flag: '🇲🇴', region: 'Asia' },
  'BD': { name: 'Bangladesh', flag: '🇧🇩', region: 'Asia' },
  'PK': { name: 'Pakistan', flag: '🇵🇰', region: 'Asia' },
  'LK': { name: 'Sri Lanka', flag: '🇱🇰', region: 'Asia' },
  'MM': { name: 'Myanmar', flag: '🇲🇲', region: 'Asia' },
  'KH': { name: 'Cambodia', flag: '🇰🇭', region: 'Asia' },
  'LA': { name: 'Laos', flag: '🇱🇦', region: 'Asia' },
  'MN': { name: 'Mongolia', flag: '🇲🇳', region: 'Asia' },
  'KZ': { name: 'Kazakhstan', flag: '🇰🇿', region: 'Asia' },
  'UZ': { name: 'Uzbekistan', flag: '🇺🇿', region: 'Asia' },
  'KG': { name: 'Kyrgyzstan', flag: '🇰🇬', region: 'Asia' },
  'TJ': { name: 'Tajikistan', flag: '🇹🇯', region: 'Asia' },
  'TM': { name: 'Turkmenistan', flag: '🇹🇲', region: 'Asia' },
  'AM': { name: 'Armenia', flag: '🇦🇲', region: 'Asia' },
  'AZ': { name: 'Azerbaijan', flag: '🇦🇿', region: 'Asia' },
  'GE': { name: 'Georgia', flag: '🇬🇪', region: 'Asia' },
  'BT': { name: 'Bhutan', flag: '🇧🇹', region: 'Asia' },
  'NP': { name: 'Nepal', flag: '🇳🇵', region: 'Asia' },
  'BN': { name: 'Brunei', flag: '🇧🇳', region: 'Asia' },
  'TL': { name: 'East Timor', flag: '🇹🇱', region: 'Asia' },

  // 유럽
  'GB': { name: 'United Kingdom', flag: '🇬🇧', region: 'Europe', popular: true },
  'DE': { name: 'Germany', flag: '🇩🇪', region: 'Europe', popular: true },
  'FR': { name: 'France', flag: '🇫🇷', region: 'Europe', popular: true },
  'IT': { name: 'Italy', flag: '🇮🇹', region: 'Europe', popular: true },
  'ES': { name: 'Spain', flag: '🇪🇸', region: 'Europe', popular: true },
  'NL': { name: 'Netherlands', flag: '🇳🇱', region: 'Europe', popular: true },
  'CH': { name: 'Switzerland', flag: '🇨🇭', region: 'Europe' },
  'AT': { name: 'Austria', flag: '🇦🇹', region: 'Europe' },
  'SE': { name: 'Sweden', flag: '🇸🇪', region: 'Europe' },
  'NO': { name: 'Norway', flag: '🇳🇴', region: 'Europe' },
  'DK': { name: 'Denmark', flag: '🇩🇰', region: 'Europe' },
  'FI': { name: 'Finland', flag: '🇫🇮', region: 'Europe' },
  'IS': { name: 'Iceland', flag: '🇮🇸', region: 'Europe' },
  'IE': { name: 'Ireland', flag: '🇮🇪', region: 'Europe' },
  'PT': { name: 'Portugal', flag: '🇵🇹', region: 'Europe' },
  'BE': { name: 'Belgium', flag: '🇧🇪', region: 'Europe' },
  'LU': { name: 'Luxembourg', flag: '🇱🇺', region: 'Europe' },
  'PL': { name: 'Poland', flag: '🇵🇱', region: 'Europe' },
  'CZ': { name: 'Czech Republic', flag: '🇨🇿', region: 'Europe' },
  'SK': { name: 'Slovakia', flag: '🇸🇰', region: 'Europe' },
  'HU': { name: 'Hungary', flag: '🇭🇺', region: 'Europe' },
  'SI': { name: 'Slovenia', flag: '🇸🇮', region: 'Europe' },
  'HR': { name: 'Croatia', flag: '🇭🇷', region: 'Europe' },
  'RS': { name: 'Serbia', flag: '🇷🇸', region: 'Europe' },
  'BG': { name: 'Bulgaria', flag: '🇧🇬', region: 'Europe' },
  'RO': { name: 'Romania', flag: '🇷🇴', region: 'Europe' },
  'GR': { name: 'Greece', flag: '🇬🇷', region: 'Europe' },
  'CY': { name: 'Cyprus', flag: '🇨🇾', region: 'Europe' },
  'MT': { name: 'Malta', flag: '🇲🇹', region: 'Europe' },
  'EE': { name: 'Estonia', flag: '🇪🇪', region: 'Europe' },
  'LV': { name: 'Latvia', flag: '🇱🇻', region: 'Europe' },
  'LT': { name: 'Lithuania', flag: '🇱🇹', region: 'Europe' },
  'RU': { name: 'Russia', flag: '🇷🇺', region: 'Europe' },
  'UA': { name: 'Ukraine', flag: '🇺🇦', region: 'Europe' },
  'BY': { name: 'Belarus', flag: '🇧🇾', region: 'Europe' },
  'MD': { name: 'Moldova', flag: '🇲🇩', region: 'Europe' },
  'AL': { name: 'Albania', flag: '🇦🇱', region: 'Europe' },
  'BA': { name: 'Bosnia and Herzegovina', flag: '🇧🇦', region: 'Europe' },
  'ME': { name: 'Montenegro', flag: '🇲🇪', region: 'Europe' },
  'MK': { name: 'North Macedonia', flag: '🇲🇰', region: 'Europe' },
  'AD': { name: 'Andorra', flag: '🇦🇩', region: 'Europe' },
  'MC': { name: 'Monaco', flag: '🇲🇨', region: 'Europe' },
  'SM': { name: 'San Marino', flag: '🇸🇲', region: 'Europe' },
  'VA': { name: 'Vatican City', flag: '🇻🇦', region: 'Europe' },
  'LI': { name: 'Liechtenstein', flag: '🇱🇮', region: 'Europe' },
  'FO': { name: 'Faroe Islands', flag: '🇫🇴', region: 'Europe' },
  'GI': { name: 'Gibraltar', flag: '🇬🇮', region: 'Europe' },
  'IM': { name: 'Isle of Man', flag: '🇮🇲', region: 'Europe' },
  'JE': { name: 'Jersey', flag: '🇯🇪', region: 'Europe' },
  'GG': { name: 'Guernsey', flag: '🇬🇬', region: 'Europe' },
  'GL': { name: 'Greenland', flag: '🇬🇱', region: 'Europe' },
  'SJ': { name: 'Svalbard and Jan Mayen', flag: '🇸🇯', region: 'Europe' },

  // 북미
  'US': { name: 'United States', flag: '🇺🇸', region: 'North America', popular: true },
  'CA': { name: 'Canada', flag: '🇨🇦', region: 'North America', popular: true },
  'MX': { name: 'Mexico', flag: '🇲🇽', region: 'North America', popular: true },
  'GT': { name: 'Guatemala', flag: '🇬🇹', region: 'North America' },
  'BZ': { name: 'Belize', flag: '🇧🇿', region: 'North America' },
  'SV': { name: 'El Salvador', flag: '🇸🇻', region: 'North America' },
  'HN': { name: 'Honduras', flag: '🇭🇳', region: 'North America' },
  'NI': { name: 'Nicaragua', flag: '🇳🇮', region: 'North America' },
  'CR': { name: 'Costa Rica', flag: '🇨🇷', region: 'North America' },
  'PA': { name: 'Panama', flag: '🇵🇦', region: 'North America' },
  'CU': { name: 'Cuba', flag: '🇨🇺', region: 'North America' },
  'JM': { name: 'Jamaica', flag: '🇯🇲', region: 'North America' },
  'HT': { name: 'Haiti', flag: '🇭🇹', region: 'North America' },
  'DO': { name: 'Dominican Republic', flag: '🇩🇴', region: 'North America' },
  'BB': { name: 'Barbados', flag: '🇧🇧', region: 'North America' },
  'BS': { name: 'Bahamas', flag: '🇧🇸', region: 'North America' },
  'DM': { name: 'Dominica', flag: '🇩🇲', region: 'North America' },
  'GD': { name: 'Grenada', flag: '🇬🇩', region: 'North America' },
  'KN': { name: 'Saint Kitts and Nevis', flag: '🇰🇳', region: 'North America' },
  'LC': { name: 'Saint Lucia', flag: '🇱🇨', region: 'North America' },
  'VC': { name: 'Saint Vincent and the Grenadines', flag: '🇻🇨', region: 'North America' },
  'PR': { name: 'Puerto Rico', flag: '🇵🇷', region: 'North America' },
  'VI': { name: 'U.S. Virgin Islands', flag: '🇻🇮', region: 'North America' },
  'VG': { name: 'British Virgin Islands', flag: '🇻🇬', region: 'North America' },
  'KY': { name: 'Cayman Islands', flag: '🇰🇾', region: 'North America' },
  'TC': { name: 'Turks and Caicos Islands', flag: '🇹🇨', region: 'North America' },
  'MS': { name: 'Montserrat', flag: '🇲🇸', region: 'North America' },
  'GU': { name: 'Guam', flag: '🇬🇺', region: 'North America' },
  'SX': { name: 'Sint Maarten', flag: '🇸🇽', region: 'North America' },

  // 남미
  'BR': { name: 'Brazil', flag: '🇧🇷', region: 'South America', popular: true },
  'AR': { name: 'Argentina', flag: '🇦🇷', region: 'South America', popular: true },
  'CL': { name: 'Chile', flag: '🇨🇱', region: 'South America' },
  'PE': { name: 'Peru', flag: '🇵🇪', region: 'South America' },
  'CO': { name: 'Colombia', flag: '🇨🇴', region: 'South America' },
  'VE': { name: 'Venezuela', flag: '🇻🇪', region: 'South America' },
  'EC': { name: 'Ecuador', flag: '🇪🇨', region: 'South America' },
  'BO': { name: 'Bolivia', flag: '🇧🇴', region: 'South America' },
  'PY': { name: 'Paraguay', flag: '🇵🇾', region: 'South America' },
  'UY': { name: 'Uruguay', flag: '🇺🇾', region: 'South America' },
  'GY': { name: 'Guyana', flag: '🇬🇾', region: 'South America' },
  'SR': { name: 'Suriname', flag: '🇸🇷', region: 'South America' },

  // 오세아니아
  'AU': { name: 'Australia', flag: '🇦🇺', region: 'Oceania', popular: true },
  'NZ': { name: 'New Zealand', flag: '🇳🇿', region: 'Oceania', popular: true },
  'FJ': { name: 'Fiji', flag: '🇫🇯', region: 'Oceania' },
  'PG': { name: 'Papua New Guinea', flag: '🇵🇬', region: 'Oceania' },
  'SB': { name: 'Solomon Islands', flag: '🇸🇧', region: 'Oceania' },
  'VU': { name: 'Vanuatu', flag: '🇻🇺', region: 'Oceania' },
  'NC': { name: 'New Caledonia', flag: '🇳🇨', region: 'Oceania' },
  'PF': { name: 'French Polynesia', flag: '🇵🇫', region: 'Oceania' },
  'KI': { name: 'Kiribati', flag: '🇰🇮', region: 'Oceania' },
  'MH': { name: 'Marshall Islands', flag: '🇲🇭', region: 'Oceania' },
  'NR': { name: 'Nauru', flag: '🇳🇷', region: 'Oceania' },
  'NU': { name: 'Niue', flag: '🇳🇺', region: 'Oceania' },
  'PW': { name: 'Palau', flag: '🇵🇼', region: 'Oceania' },
  'TO': { name: 'Tonga', flag: '🇹🇴', region: 'Oceania' },
  'TT': { name: 'Trinidad and Tobago', flag: '🇹🇹', region: 'North America' },
  'TV': { name: 'Tuvalu', flag: '🇹🇻', region: 'Oceania' },
  'WS': { name: 'Samoa', flag: '🇼🇸', region: 'Oceania' },
  'WF': { name: 'Wallis and Futuna', flag: '🇼🇫', region: 'Oceania' },

  // 아프리카
  'ZA': { name: 'South Africa', flag: '🇿🇦', region: 'Africa', popular: true },
  'EG': { name: 'Egypt', flag: '🇪🇬', region: 'Africa', popular: true },
  'NG': { name: 'Nigeria', flag: '🇳🇬', region: 'Africa' },
  'KE': { name: 'Kenya', flag: '🇰🇪', region: 'Africa' },
  'ET': { name: 'Ethiopia', flag: '🇪🇹', region: 'Africa' },
  'GH': { name: 'Ghana', flag: '🇬🇭', region: 'Africa' },
  'TZ': { name: 'Tanzania', flag: '🇹🇿', region: 'Africa' },
  'UG': { name: 'Uganda', flag: '🇺🇬', region: 'Africa' },
  'MZ': { name: 'Mozambique', flag: '🇲🇿', region: 'Africa' },
  'MG': { name: 'Madagascar', flag: '🇲🇬', region: 'Africa' },
  'ZW': { name: 'Zimbabwe', flag: '🇿🇼', region: 'Africa' },
  'BW': { name: 'Botswana', flag: '🇧🇼', region: 'Africa' },
  'NA': { name: 'Namibia', flag: '🇳🇦', region: 'Africa' },
  'ZM': { name: 'Zambia', flag: '🇿🇲', region: 'Africa' },
  'MW': { name: 'Malawi', flag: '🇲🇼', region: 'Africa' },
  'MA': { name: 'Morocco', flag: '🇲🇦', region: 'Africa' },
  'DZ': { name: 'Algeria', flag: '🇩🇿', region: 'Africa' },
  'TN': { name: 'Tunisia', flag: '🇹🇳', region: 'Africa' },
  'LY': { name: 'Libya', flag: '🇱🇾', region: 'Africa' },
  'SD': { name: 'Sudan', flag: '🇸🇩', region: 'Africa' },
  'AO': { name: 'Angola', flag: '🇦🇴', region: 'Africa' },
  'CM': { name: 'Cameroon', flag: '🇨🇲', region: 'Africa' },
  'CD': { name: 'Democratic Republic of the Congo', flag: '🇨🇩', region: 'Africa' },
  'CG': { name: 'Republic of the Congo', flag: '🇨🇬', region: 'Africa' },
  'CI': { name: 'Ivory Coast', flag: '🇨🇮', region: 'Africa' },
  'GA': { name: 'Gabon', flag: '🇬🇦', region: 'Africa' },
  'GN': { name: 'Guinea', flag: '🇬🇳', region: 'Africa' },
  'GW': { name: 'Guinea-Bissau', flag: '🇬🇼', region: 'Africa' },
  'LR': { name: 'Liberia', flag: '🇱🇷', region: 'Africa' },
  'ML': { name: 'Mali', flag: '🇲🇱', region: 'Africa' },
  'MR': { name: 'Mauritania', flag: '🇲🇷', region: 'Africa' },
  'MU': { name: 'Mauritius', flag: '🇲🇺', region: 'Africa' },
  'NE': { name: 'Niger', flag: '🇳🇪', region: 'Africa' },
  'RW': { name: 'Rwanda', flag: '🇷🇼', region: 'Africa' },
  'SN': { name: 'Senegal', flag: '🇸🇳', region: 'Africa' },
  'SC': { name: 'Seychelles', flag: '🇸🇨', region: 'Africa' },
  'SL': { name: 'Sierra Leone', flag: '🇸🇱', region: 'Africa' },
  'SO': { name: 'Somalia', flag: '🇸🇴', region: 'Africa' },
  'SS': { name: 'South Sudan', flag: '🇸🇸', region: 'Africa' },
  'SZ': { name: 'Eswatini', flag: '🇸🇿', region: 'Africa' },
  'TD': { name: 'Chad', flag: '🇹🇩', region: 'Africa' },
  'TG': { name: 'Togo', flag: '🇹🇬', region: 'Africa' },
  'BF': { name: 'Burkina Faso', flag: '🇧🇫', region: 'Africa' },
  'BI': { name: 'Burundi', flag: '🇧🇮', region: 'Africa' },
  'BJ': { name: 'Benin', flag: '🇧🇯', region: 'Africa' },
  'CF': { name: 'Central African Republic', flag: '🇨🇫', region: 'Africa' },
  'CV': { name: 'Cape Verde', flag: '🇨🇻', region: 'Africa' },
  'DJ': { name: 'Djibouti', flag: '🇩🇯', region: 'Africa' },
  'ER': { name: 'Eritrea', flag: '🇪🇷', region: 'Africa' },
  'GM': { name: 'Gambia', flag: '🇬🇲', region: 'Africa' },
  'GQ': { name: 'Equatorial Guinea', flag: '🇬🇶', region: 'Africa' },
  'KM': { name: 'Comoros', flag: '🇰🇲', region: 'Africa' },
  'LS': { name: 'Lesotho', flag: '🇱🇸', region: 'Africa' },
  'MV': { name: 'Maldives', flag: '🇲🇻', region: 'Africa' },
  'ST': { name: 'São Tomé and Príncipe', flag: '🇸🇹', region: 'Africa' },
  'SH': { name: 'Saint Helena', flag: '🇸🇭', region: 'Africa' },

  // 중동
  'AE': { name: 'United Arab Emirates', flag: '🇦🇪', region: 'Middle East' },
  'SA': { name: 'Saudi Arabia', flag: '🇸🇦', region: 'Middle East' },
  'IL': { name: 'Israel', flag: '🇮🇱', region: 'Middle East' },
  'TR': { name: 'Turkey', flag: '🇹🇷', region: 'Middle East' },
  'IR': { name: 'Iran', flag: '🇮🇷', region: 'Middle East' },
  'IQ': { name: 'Iraq', flag: '🇮🇶', region: 'Middle East' },
  'SY': { name: 'Syria', flag: '🇸🇾', region: 'Middle East' },
  'LB': { name: 'Lebanon', flag: '🇱🇧', region: 'Middle East' },
  'JO': { name: 'Jordan', flag: '🇯🇴', region: 'Middle East' },
  'KW': { name: 'Kuwait', flag: '🇰🇼', region: 'Middle East' },
  'QA': { name: 'Qatar', flag: '🇶🇦', region: 'Middle East' },
  'BH': { name: 'Bahrain', flag: '🇧🇭', region: 'Middle East' },
  'OM': { name: 'Oman', flag: '🇴🇲', region: 'Middle East' },
  'YE': { name: 'Yemen', flag: '🇾🇪', region: 'Middle East' },
  'AF': { name: 'Afghanistan', flag: '🇦🇫', region: 'Middle East' },
  'PS': { name: 'Palestine', flag: '🇵🇸', region: 'Middle East' },
};

async function getCollectedCountries(): Promise<string[]> {
  const holidaysDir = path.join(process.cwd(), 'data', 'holidays');
  const files = await fs.promises.readdir(holidaysDir);
  
  const countries = new Set<string>();
  for (const file of files) {
    if (file.endsWith('.json')) {
      const countryCode = file.split('-')[0].toUpperCase();
      countries.add(countryCode);
    }
  }
  
  return Array.from(countries).sort();
}

function generateCountryConstants(collectedCountries: string[]): string {
  const regions = {
    'Asia': [] as string[],
    'Europe': [] as string[],
    'North America': [] as string[],
    'South America': [] as string[],
    'Oceania': [] as string[],
    'Africa': [] as string[],
    'Middle East': [] as string[]
  };

  const supportedCountries: string[] = [];
  const popularCountries: string[] = [];

  for (const countryCode of collectedCountries) {
    const countryInfo = COUNTRY_DATA[countryCode];
    if (!countryInfo) {
      console.warn(`국가 정보 없음: ${countryCode}`);
      continue;
    }

    const countryEntry = `  { code: '${countryCode}', name: '${countryInfo.name}', region: '${countryInfo.region}', flag: '${countryInfo.flag}'${countryInfo.popular ? ', popular: true' : ''} }`;
    supportedCountries.push(countryEntry);

    if (countryInfo.popular) {
      popularCountries.push(countryCode);
    }

    regions[countryInfo.region as keyof typeof regions].push(countryCode);
  }

  const regionsArray = Object.entries(regions).map(([regionName, countries], index) => {
    const displayNames: Record<string, string> = {
      'Asia': '아시아',
      'Europe': '유럽',
      'North America': '북미',
      'South America': '남미',
      'Oceania': '오세아니아',
      'Africa': '아프리카',
      'Middle East': '중동'
    };

    return `  { 
    name: '${regionName}', 
    displayName: '${displayNames[regionName]}', 
    countries: [${countries.map(c => `'${c}'`).join(', ')}],
    displayOrder: ${index + 1}
  }`;
  });

  return `// ===== 국가 및 지역 상수 =====

// 지원하는 국가 목록 (수집된 데이터 기반으로 자동 생성됨)
export const SUPPORTED_COUNTRIES = [
${supportedCountries.join(',\n')}
] as const;

// 지역 목록 (수집된 데이터 기반으로 자동 생성됨)
export const REGIONS = [
${regionsArray.join(',\n')}
] as const;

// 인기 국가 (홈페이지 바로가기용)
export const POPULAR_COUNTRIES = SUPPORTED_COUNTRIES.filter(country => country.popular);`;
}

async function updateConstants() {
  console.log('🔄 수집된 데이터를 기반으로 constants.ts 업데이트 중...');
  
  try {
    // 수집된 국가 목록 가져오기
    const collectedCountries = await getCollectedCountries();
    console.log(`📊 수집된 국가: ${collectedCountries.length}개`);
    console.log(`🌍 국가 목록: ${collectedCountries.join(', ')}`);

    // 새로운 국가 상수 생성
    const newCountryConstants = generateCountryConstants(collectedCountries);

    // 기존 constants.ts 파일 읽기
    const constantsPath = path.join(process.cwd(), 'src', 'lib', 'constants.ts');
    const existingContent = await fs.promises.readFile(constantsPath, 'utf-8');

    // 국가 관련 부분만 교체
    const updatedContent = existingContent.replace(
      /\/\/ ===== 국가 및 지역 상수 =====[\s\S]*?\/\/ 인기 국가 \(홈페이지 바로가기용\)\nexport const POPULAR_COUNTRIES = SUPPORTED_COUNTRIES\.filter\(country => country\.popular\);/,
      newCountryConstants
    );

    // 파일 저장
    await fs.promises.writeFile(constantsPath, updatedContent, 'utf-8');
    
    console.log('✅ constants.ts 업데이트 완료!');
    console.log(`📁 파일 위치: ${constantsPath}`);
    
  } catch (error) {
    console.error('❌ constants.ts 업데이트 실패:', error);
    throw error;
  }
}

async function main() {
  console.log('🌍 국가 상수 업데이트 스크립트');
  console.log('================================');
  
  await updateConstants();
  
  console.log('\n🎉 업데이트 완료!');
  console.log('이제 웹사이트에서 모든 수집된 국가의 데이터를 볼 수 있습니다.');
}

if (require.main === module) {
  main().catch(console.error);
}

export { updateConstants, getCollectedCountries };