#!/usr/bin/env tsx

/**
 * 설명 파일에서 국가 코드를 국가명으로 변환하는 스크립트
 * 
 * 문제: 어드민에서 저장할 때 country_name이 국가 코드(예: "BA")로 저장됨
 * 해결: 국가 코드를 실제 국가명(예: "Bosnia and Herzegovina")으로 변환
 */

import { config } from 'dotenv';
import fs from 'fs';
import path from 'path';

// 환경 변수 로드
config({ path: path.join(process.cwd(), '.env.local') });

// 국가 코드를 국가명으로 매핑
const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  'AD': 'Andorra',
  'AE': 'United Arab Emirates',
  'AF': 'Afghanistan',
  'AL': 'Albania',
  'AM': 'Armenia',
  'AO': 'Angola',
  'AR': 'Argentina',
  'AT': 'Austria',
  'AU': 'Australia',
  'AZ': 'Azerbaijan',
  'BA': 'Bosnia and Herzegovina',
  'BB': 'Barbados',
  'BD': 'Bangladesh',
  'BE': 'Belgium',
  'BF': 'Burkina Faso',
  'BG': 'Bulgaria',
  'BH': 'Bahrain',
  'BI': 'Burundi',
  'BJ': 'Benin',
  'BN': 'Brunei',
  'BO': 'Bolivia',
  'BR': 'Brazil',
  'BS': 'Bahamas',
  'BT': 'Bhutan',
  'BW': 'Botswana',
  'BY': 'Belarus',
  'BZ': 'Belize',
  'CA': 'Canada',
  'CD': 'Democratic Republic of the Congo',
  'CF': 'Central African Republic',
  'CG': 'Republic of the Congo',
  'CH': 'Switzerland',
  'CI': 'Ivory Coast',
  'CL': 'Chile',
  'CM': 'Cameroon',
  'CN': 'China',
  'CO': 'Colombia',
  'CR': 'Costa Rica',
  'CU': 'Cuba',
  'CV': 'Cape Verde',
  'CY': 'Cyprus',
  'CZ': 'Czech Republic',
  'DE': 'Germany',
  'DJ': 'Djibouti',
  'DK': 'Denmark',
  'DM': 'Dominica',
  'DO': 'Dominican Republic',
  'DZ': 'Algeria',
  'EC': 'Ecuador',
  'EE': 'Estonia',
  'EG': 'Egypt',
  'ER': 'Eritrea',
  'ES': 'Spain',
  'ET': 'Ethiopia',
  'FI': 'Finland',
  'FJ': 'Fiji',
  'FR': 'France',
  'GA': 'Gabon',
  'GB': 'United Kingdom',
  'GD': 'Grenada',
  'GE': 'Georgia',
  'GH': 'Ghana',
  'GM': 'Gambia',
  'GN': 'Guinea',
  'GQ': 'Equatorial Guinea',
  'GR': 'Greece',
  'GT': 'Guatemala',
  'GW': 'Guinea-Bissau',
  'GY': 'Guyana',
  'HN': 'Honduras',
  'HR': 'Croatia',
  'HT': 'Haiti',
  'HU': 'Hungary',
  'ID': 'Indonesia',
  'IE': 'Ireland',
  'IL': 'Israel',
  'IN': 'India',
  'IQ': 'Iraq',
  'IR': 'Iran',
  'IS': 'Iceland',
  'IT': 'Italy',
  'JM': 'Jamaica',
  'JO': 'Jordan',
  'JP': 'Japan',
  'KE': 'Kenya',
  'KG': 'Kyrgyzstan',
  'KH': 'Cambodia',
  'KI': 'Kiribati',
  'KM': 'Comoros',
  'KN': 'Saint Kitts and Nevis',
  'KP': 'North Korea',
  'KR': 'South Korea',
  'KW': 'Kuwait',
  'KZ': 'Kazakhstan',
  'LA': 'Laos',
  'LB': 'Lebanon',
  'LC': 'Saint Lucia',
  'LI': 'Liechtenstein',
  'LK': 'Sri Lanka',
  'LR': 'Liberia',
  'LS': 'Lesotho',
  'LT': 'Lithuania',
  'LU': 'Luxembourg',
  'LV': 'Latvia',
  'LY': 'Libya',
  'MA': 'Morocco',
  'MC': 'Monaco',
  'MD': 'Moldova',
  'ME': 'Montenegro',
  'MG': 'Madagascar',
  'MH': 'Marshall Islands',
  'MK': 'North Macedonia',
  'ML': 'Mali',
  'MM': 'Myanmar',
  'MN': 'Mongolia',
  'MR': 'Mauritania',
  'MT': 'Malta',
  'MU': 'Mauritius',
  'MV': 'Maldives',
  'MW': 'Malawi',
  'MX': 'Mexico',
  'MY': 'Malaysia',
  'MZ': 'Mozambique',
  'NA': 'Namibia',
  'NE': 'Niger',
  'NG': 'Nigeria',
  'NI': 'Nicaragua',
  'NL': 'Netherlands',
  'NO': 'Norway',
  'NP': 'Nepal',
  'NR': 'Nauru',
  'NZ': 'New Zealand',
  'OM': 'Oman',
  'PA': 'Panama',
  'PE': 'Peru',
  'PG': 'Papua New Guinea',
  'PH': 'Philippines',
  'PK': 'Pakistan',
  'PL': 'Poland',
  'PT': 'Portugal',
  'PW': 'Palau',
  'PY': 'Paraguay',
  'QA': 'Qatar',
  'RO': 'Romania',
  'RS': 'Serbia',
  'RU': 'Russia',
  'RW': 'Rwanda',
  'SA': 'Saudi Arabia',
  'SB': 'Solomon Islands',
  'SC': 'Seychelles',
  'SD': 'Sudan',
  'SE': 'Sweden',
  'SG': 'Singapore',
  'SI': 'Slovenia',
  'SK': 'Slovakia',
  'SL': 'Sierra Leone',
  'SM': 'San Marino',
  'SN': 'Senegal',
  'SO': 'Somalia',
  'SR': 'Suriname',
  'SS': 'South Sudan',
  'ST': 'São Tomé and Príncipe',
  'SV': 'El Salvador',
  'SY': 'Syria',
  'SZ': 'Eswatini',
  'TD': 'Chad',
  'TG': 'Togo',
  'TH': 'Thailand',
  'TJ': 'Tajikistan',
  'TL': 'Timor-Leste',
  'TM': 'Turkmenistan',
  'TN': 'Tunisia',
  'TO': 'Tonga',
  'TR': 'Turkey',
  'TT': 'Trinidad and Tobago',
  'TV': 'Tuvalu',
  'TW': 'Taiwan',
  'TZ': 'Tanzania',
  'UA': 'Ukraine',
  'UG': 'Uganda',
  'US': 'United States',
  'UY': 'Uruguay',
  'UZ': 'Uzbekistan',
  'VA': 'Vatican City',
  'VC': 'Saint Vincent and the Grenadines',
  'VE': 'Venezuela',
  'VN': 'Vietnam',
  'VU': 'Vanuatu',
  'WS': 'Samoa',
  'YE': 'Yemen',
  'ZA': 'South Africa',
  'ZM': 'Zambia',
  'ZW': 'Zimbabwe'
};

async function fixCountryNamesInDescriptions() {
  console.log('🔧 설명 파일의 국가 코드를 국가명으로 변환 시작\n');

  const descriptionsDir = path.join(process.cwd(), 'data', 'descriptions');
  
  if (!fs.existsSync(descriptionsDir)) {
    console.log('❌ 설명 디렉토리가 존재하지 않습니다:', descriptionsDir);
    return;
  }

  const files = fs.readdirSync(descriptionsDir);
  const jsonFiles = files.filter(file => file.endsWith('.json'));
  
  console.log(`📁 총 ${jsonFiles.length}개의 설명 파일 발견`);

  let fixedCount = 0;
  let errorCount = 0;

  for (const file of jsonFiles) {
    try {
      const filePath = path.join(descriptionsDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      // country_name이 국가 코드인지 확인 (2글자이고 대문자)
      if (data.country_name && 
          data.country_name.length === 2 && 
          data.country_name === data.country_name.toUpperCase() &&
          COUNTRY_CODE_TO_NAME[data.country_name]) {
        
        const oldCountryName = data.country_name;
        const newCountryName = COUNTRY_CODE_TO_NAME[data.country_name];
        
        console.log(`🔄 ${file}: "${oldCountryName}" -> "${newCountryName}"`);
        
        // 국가명 업데이트
        data.country_name = newCountryName;
        data.modified_at = new Date().toISOString();
        
        // 파일 저장
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        fixedCount++;
        
        // AI 캐시도 업데이트
        await updateAiCache(data.holiday_name, oldCountryName, newCountryName, data.locale, data.description);
        
      } else {
        console.log(`✅ ${file}: 이미 올바른 국가명 "${data.country_name}"`);
      }
      
    } catch (error) {
      console.error(`❌ ${file} 처리 실패:`, error);
      errorCount++;
    }
  }

  console.log(`\n📊 처리 완료:`);
  console.log(`  - 수정된 파일: ${fixedCount}개`);
  console.log(`  - 오류 발생: ${errorCount}개`);
  console.log(`  - 총 처리: ${jsonFiles.length}개`);
}

async function updateAiCache(holidayName: string, oldCountryName: string, newCountryName: string, locale: string, description: string) {
  try {
    const aiCachePath = path.join(process.cwd(), 'public', 'ai-cache.json');
    let aiCache: Record<string, any> = {};
    
    if (fs.existsSync(aiCachePath)) {
      aiCache = JSON.parse(fs.readFileSync(aiCachePath, 'utf-8'));
    }
    
    // 기존 키 제거
    const oldKey = `${holidayName}-${oldCountryName}-${locale}`;
    if (aiCache[oldKey]) {
      delete aiCache[oldKey];
    }
    
    // 새 키로 추가
    const newKey = `${holidayName}-${newCountryName}-${locale}`;
    aiCache[newKey] = {
      holidayId: `${oldCountryName.toLowerCase()}_${new Date().getFullYear()}_${holidayName.replace(/\s+/g, '_')}`,
      holidayName: holidayName,
      countryName: newCountryName,
      locale: locale,
      description: description,
      confidence: 1.0,
      generatedAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      isManual: true
    };
    
    fs.writeFileSync(aiCachePath, JSON.stringify(aiCache, null, 2));
    console.log(`  📝 AI 캐시 업데이트: ${oldKey} -> ${newKey}`);
    
  } catch (error) {
    console.warn(`  ⚠️ AI 캐시 업데이트 실패:`, error);
  }
}

// 메인 실행
if (require.main === module) {
  fixCountryNamesInDescriptions().catch(console.error);
}

export { fixCountryNamesInDescriptions };