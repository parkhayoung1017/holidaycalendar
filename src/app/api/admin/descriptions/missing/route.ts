import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '../../../../../lib/auth-middleware';
import { SupabaseHolidayDescriptionService } from '../../../../../lib/supabase-client';
import { 
  createSuccessResponse, 
  createServerErrorResponse, 
  logApiError 
} from '../../../../../lib/api-response';
import fs from 'fs';
import path from 'path';

/**
 * 설명 없는 공휴일 목록 조회 API
 * GET /api/admin/descriptions/missing
 */
async function handler(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country') || undefined;
    const year = searchParams.get('year') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // 기존 공휴일 데이터에서 설명이 없는 항목들을 찾기
    const result = await findMissingDescriptions(country, year, page, limit);

    return createSuccessResponse(
      result.data,
      '설명 없는 공휴일 목록을 성공적으로 조회했습니다.',
      {
        total: result.total,
        page: page,
        limit: limit,
        totalPages: Math.ceil(result.total / limit)
      }
    );

  } catch (error) {
    logApiError('/api/admin/descriptions/missing', 'GET', error);
    return createServerErrorResponse('설명 없는 공휴일 목록을 불러오는 중 오류가 발생했습니다.');
  }
}

/**
 * 설명이 없는 공휴일을 찾는 함수
 */
async function findMissingDescriptions(
  country?: string, 
  year?: string, 
  page: number = 1,
  limit: number = 50
): Promise<{
  data: Array<{
    holiday_id: string;
    holiday_name: string;
    country_name: string;
    country_code: string;
    date: string;
    year: number;
  }>;
  total: number;
}> {
  try {
    const service = new SupabaseHolidayDescriptionService();
    
    // AI 캐시에서 기존 설명 확인
    const fs = require('fs');
    const path = require('path');
    
    const existingKeys = new Set<string>();
    
    // 1. Supabase에서 기존 설명 확인 (수동 작성된 설명만)
    try {
      // 한국어와 영어의 수동 작성된 설명만 가져오기
      const [koDescriptions, enDescriptions] = await Promise.all([
        service.getDescriptions({
          page: 1,
          limit: 10000,
          locale: 'ko',
          isManual: true  // 수동 작성된 설명만
        }),
        service.getDescriptions({
          page: 1,
          limit: 10000,
          locale: 'en',
          isManual: true  // 수동 작성된 설명만
        })
      ]);
      
      // 한국어 설명 처리
      koDescriptions.data.forEach(desc => {
        const normalizedKey = `${desc.holiday_name}|${desc.country_name}|ko`;
        existingKeys.add(normalizedKey);
        
        // 국가 코드 변형도 추가
        const countryCode = getCountryCodeFromName(desc.country_name);
        if (countryCode) {
          existingKeys.add(`${desc.holiday_name}|${countryCode}|ko`);
        }
      });
      
      // 영어 설명 처리
      enDescriptions.data.forEach(desc => {
        const normalizedKey = `${desc.holiday_name}|${desc.country_name}|en`;
        existingKeys.add(normalizedKey);
        
        // 국가 코드 변형도 추가
        const countryCode = getCountryCodeFromName(desc.country_name);
        if (countryCode) {
          existingKeys.add(`${desc.holiday_name}|${countryCode}|en`);
        }
      });
      
      console.log('Supabase에서 가져온 설명 개수:', {
        ko: koDescriptions.data.length,
        en: enDescriptions.data.length,
        total: koDescriptions.data.length + enDescriptions.data.length
      });
    } catch (error) {
      console.warn('Supabase 설명 조회 실패:', error);
    }
    
    // 2. AI 캐시 파일에서 수동 작성된 설명만 확인
    try {
      const aiCachePath = path.join(process.cwd(), 'public', 'ai-cache.json');
      if (fs.existsSync(aiCachePath)) {
        const aiCache = JSON.parse(fs.readFileSync(aiCachePath, 'utf-8'));
        Object.entries(aiCache).forEach(([key, value]: [string, any]) => {
          if (value && typeof value === 'object') {
            // 매우 엄격한 수동 작성 검증: confidence가 정확히 1.0이고 isManual이 true인 경우만
            const isReallyManual = value.isManual === true && value.confidence === 1.0;
            
            if (isReallyManual && value.holidayName && value.countryName && value.locale) {
              // 다양한 키 형식으로 저장하여 매칭률 향상
              existingKeys.add(`${value.holidayName}|${value.countryName}|${value.locale}`);
              existingKeys.add(`${value.holidayName}_${value.countryName}_${value.locale}`);
              existingKeys.add(`${value.holidayName}-${value.countryName}-${value.locale}`);
              
              console.log(`🎯 AI 캐시에서 수동 설명 발견: ${value.holidayName} (${value.countryName}, ${value.locale})`);
            } else if (value.holidayName && value.countryName && value.locale) {
              // AI 생성 설명은 로그만 출력하고 제외
              console.log(`🤖 AI 생성 설명 제외: ${value.holidayName} (${value.countryName}, ${value.locale}) - confidence: ${value.confidence}, isManual: ${value.isManual}`);
            }
          } else {
            // 기존 형식은 AI 생성으로 간주하여 제외
            // (수동 작성된 설명은 객체 형태로 저장됨)
          }
        });
      }
    } catch (error) {
      console.warn('AI 캐시 파일 읽기 실패:', error);
    }
    
    // 3. 수동 생성된 설명 파일들 확인
    try {
      const descriptionsDir = path.join(process.cwd(), 'data', 'descriptions');
      if (fs.existsSync(descriptionsDir)) {
        const files = fs.readdirSync(descriptionsDir);
        files.forEach(file => {
          if (file.endsWith('.json')) {
            try {
              const filePath = path.join(descriptionsDir, file);
              const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
              if (data.holiday_name && data.country_name && data.locale) {
                // 실제 파일의 언어에 맞게 키 생성 (수정된 로직)
                const locale = data.locale;
                existingKeys.add(`${data.holiday_name}|${data.country_name}|${locale}`);
                existingKeys.add(`${data.holiday_name}_${data.country_name}_${locale}`);
                existingKeys.add(`${data.holiday_name}-${data.country_name}-${locale}`);
                
                // 국가 코드 변형도 추가
                const countryCode = getCountryCodeFromName(data.country_name);
                if (countryCode) {
                  existingKeys.add(`${data.holiday_name}|${countryCode}|${locale}`);
                  existingKeys.add(`${data.holiday_name}_${countryCode}_${locale}`);
                  existingKeys.add(`${data.holiday_name}-${countryCode}-${locale}`);
                }
                
                console.log(`📁 파일에서 설명 발견: ${data.holiday_name} (${data.country_name}, ${locale})`);
              }
            } catch (error) {
              console.warn(`설명 파일 읽기 실패: ${file}`, error);
            }
          }
        });
      }
    } catch (error) {
      console.warn('설명 디렉토리 읽기 실패:', error);
    }
    
    // 4. 추가 확인 완료 (Supabase, AI 캐시, 파일 시스템 모두 확인됨)
    
    console.log('총 기존 설명 개수:', existingKeys.size);

    // 로컬 공휴일 데이터 파일들 스캔 - 먼저 모든 설명 없는 공휴일을 찾기
    const dataDir = path.join(process.cwd(), 'data', 'holidays');
    const allMissingHolidays: Array<{
      holiday_id: string;
      holiday_name: string;
      country_name: string;
      country_code: string;
      date: string;
      year: number;
    }> = [];

    if (!fs.existsSync(dataDir)) {
      console.warn('공휴일 데이터 디렉토리가 존재하지 않습니다:', dataDir);
      return { data: [], total: 0 };
    }

    const files = fs.readdirSync(dataDir);

    // 모든 파일을 처리해서 설명 없는 공휴일을 찾기
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      // 파일명에서 국가 코드와 연도 추출 (예: us-2024.json)
      const match = file.match(/^([a-z]{2})-(\d{4})\.json$/);
      if (!match) continue;
      
      const [, countryCode, fileYear] = match;
      
      // 필터링 조건 확인
      if (year && fileYear !== year) continue;
      if (country && country.toLowerCase() !== countryCode.toLowerCase()) continue;

      try {
        const filePath = path.join(dataDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const holidayData = JSON.parse(fileContent);

        if (holidayData.holidays && Array.isArray(holidayData.holidays)) {
          for (const holiday of holidayData.holidays) {
            const countryName = holidayData.country || getCountryName(countryCode);
            
            // 다양한 국가명 형식과 로케일 조합으로 확인
            const countryVariations = [
              countryName,
              countryCode.toUpperCase(),
              countryCode.toLowerCase(),
              getCountryName(countryCode),
              // 특별한 경우들
              ...(countryName === 'United States' ? ['US', 'USA', 'America'] : []),
              ...(countryName === 'United Kingdom' ? ['GB', 'UK', 'Britain'] : []),
              ...(countryName === 'South Korea' ? ['KR', 'Korea'] : [])
            ].filter((v, i, arr) => arr.indexOf(v) === i); // 중복 제거
            
            const locales = ['ko', 'en'];
            const possibleKeys: string[] = [];
            
            // 모든 국가명 변형과 로케일 조합 생성
            for (const country of countryVariations) {
              for (const locale of locales) {
                // 정규화된 키 형식
                possibleKeys.push(`${holiday.name}|${country}|${locale}`);
                // 기존 형식 (하위 호환성)
                possibleKeys.push(`${holiday.name}_${country}_${locale}`);
                // AI 캐시 형식 (Holiday Name-Country Name-locale)
                possibleKeys.push(`${holiday.name}-${country}-${locale}`);
              }
            }
            
            // 모든 지원 언어에 설명이 있는지 확인 (한국어와 영어 모두)
            const hasKoreanDescription = countryVariations.some(country => 
              existingKeys.has(`${holiday.name}|${country}|ko`) ||
              existingKeys.has(`${holiday.name}_${country}_ko`) ||
              existingKeys.has(`${holiday.name}-${country}-ko`)
            );
            
            const hasEnglishDescription = countryVariations.some(country => 
              existingKeys.has(`${holiday.name}|${country}|en`) ||
              existingKeys.has(`${holiday.name}_${country}_en`) ||
              existingKeys.has(`${holiday.name}-${country}-en`)
            );
            
            // 두 언어 모두 설명이 있어야만 완료된 것으로 간주
            const hasCompleteDescription = hasKoreanDescription && hasEnglishDescription;
            
            // 디버깅을 위한 로그 (Andorra Carnival 특별 확인)
            const isAndorraCarnival = holiday.name === 'Carnival' && countryCode.toLowerCase() === 'ad';
            
            if (allMissingHolidays.length < 5 || isAndorraCarnival) {
              console.log(`공휴일 확인: ${holiday.name} (${countryName})`, {
                hasKoreanDescription,
                hasEnglishDescription,
                hasCompleteDescription,
                checkedKeys: possibleKeys.slice(0, 6), // 처음 6개만 표시
                totalKeys: possibleKeys.length,
                isAndorraCarnival,
                existingKeysCount: existingKeys.size
              });
              
              // Andorra Carnival의 경우 더 자세한 디버깅
              if (isAndorraCarnival) {
                console.log('🔍 Andorra Carnival 상세 디버깅:');
                console.log('- 생성된 가능한 키들:', possibleKeys);
                console.log('- 기존 키 중 일치하는 것들:');
                possibleKeys.forEach(key => {
                  if (existingKeys.has(key)) {
                    console.log(`  ✅ 발견: ${key}`);
                  }
                });
                console.log('- 기존 키 샘플 (처음 10개):');
                Array.from(existingKeys).slice(0, 10).forEach(key => {
                  console.log(`  - ${key}`);
                });
              }
            }
            
            // 두 언어 모두 설명이 있는 경우에만 "설명 없는 공휴일" 목록에서 제외
            // 하나라도 설명이 없으면 목록에 포함 (수정된 로직)
            if (!hasCompleteDescription) {
              allMissingHolidays.push({
                holiday_id: `${countryCode}_${fileYear}_${holiday.date}_${holiday.name.replace(/\s+/g, '_')}`,
                holiday_name: holiday.name,
                country_name: countryName,
                country_code: countryCode.toUpperCase(),
                date: holiday.date,
                year: parseInt(fileYear),
                // 언어별 작성 상태 추가
                language_status: {
                  ko: hasKoreanDescription,
                  en: hasEnglishDescription
                }
              });
            }
          }
        }
      } catch (fileError) {
        console.warn(`파일 처리 실패: ${file}`, fileError);
        continue;
      }
    }

    // 페이지네이션 적용
    const total = allMissingHolidays.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = allMissingHolidays.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      total: total
    };

  } catch (error) {
    console.error('설명 없는 공휴일 검색 실패:', error);
    return { data: [], total: 0 };
  }
}

/**
 * 국가 코드에서 국가명을 가져오는 함수
 */
function getCountryName(countryCode: string): string {
  const countryNames: Record<string, string> = {
    // 주요 국가들
    'us': 'United States',
    'kr': 'South Korea',
    'jp': 'Japan',
    'cn': 'China',
    'gb': 'United Kingdom',
    'de': 'Germany',
    'fr': 'France',
    'ca': 'Canada',
    'au': 'Australia',
    'in': 'India',
    'br': 'Brazil',
    'mx': 'Mexico',
    'it': 'Italy',
    'es': 'Spain',
    'ru': 'Russia',
    'nl': 'Netherlands',
    'se': 'Sweden',
    'no': 'Norway',
    'dk': 'Denmark',
    'fi': 'Finland',
    
    // 추가 국가들 (알파벳 순)
    'ad': 'Andorra',
    'ae': 'United Arab Emirates',
    'af': 'Afghanistan',
    'ag': 'Antigua and Barbuda',
    'ai': 'Anguilla',
    'al': 'Albania',
    'am': 'Armenia',
    'ao': 'Angola',
    'aq': 'Antarctica',
    'ar': 'Argentina',
    'as': 'American Samoa',
    'at': 'Austria',
    'aw': 'Aruba',
    'ax': 'Åland Islands',
    'az': 'Azerbaijan',
    'ba': 'Bosnia and Herzegovina',
    'bb': 'Barbados',
    'bd': 'Bangladesh',
    'be': 'Belgium',
    'bf': 'Burkina Faso',
    'bg': 'Bulgaria',
    'bh': 'Bahrain',
    'bi': 'Burundi',
    'bj': 'Benin',
    'bl': 'Saint Barthélemy',
    'bm': 'Bermuda',
    'bn': 'Brunei',
    'bo': 'Bolivia',
    'bq': 'Caribbean Netherlands',
    'bs': 'Bahamas',
    'bt': 'Bhutan',
    'bv': 'Bouvet Island',
    'bw': 'Botswana',
    'by': 'Belarus',
    'bz': 'Belize',
    'cc': 'Cocos Islands',
    'cd': 'Democratic Republic of the Congo',
    'cf': 'Central African Republic',
    'cg': 'Republic of the Congo',
    'ch': 'Switzerland',
    'ci': 'Côte d\'Ivoire',
    'ck': 'Cook Islands',
    'cl': 'Chile',
    'cm': 'Cameroon',
    'co': 'Colombia',
    'cr': 'Costa Rica',
    'cu': 'Cuba',
    'cv': 'Cape Verde',
    'cw': 'Curaçao',
    'cx': 'Christmas Island',
    'cy': 'Cyprus',
    'cz': 'Czech Republic',
    'dj': 'Djibouti',
    'dm': 'Dominica',
    'do': 'Dominican Republic',
    'dz': 'Algeria',
    'ec': 'Ecuador',
    'ee': 'Estonia',
    'eg': 'Egypt',
    'eh': 'Western Sahara',
    'er': 'Eritrea',
    'et': 'Ethiopia',
    'fj': 'Fiji',
    'fk': 'Falkland Islands',
    'fm': 'Micronesia',
    'fo': 'Faroe Islands',
    'ga': 'Gabon',
    'gd': 'Grenada',
    'ge': 'Georgia',
    'gf': 'French Guiana',
    'gg': 'Guernsey',
    'gh': 'Ghana',
    'gi': 'Gibraltar',
    'gl': 'Greenland',
    'gm': 'Gambia',
    'gn': 'Guinea',
    'gp': 'Guadeloupe',
    'gq': 'Equatorial Guinea',
    'gr': 'Greece',
    'gs': 'South Georgia',
    'gt': 'Guatemala',
    'gu': 'Guam',
    'gw': 'Guinea-Bissau',
    'gy': 'Guyana',
    'hk': 'Hong Kong',
    'hm': 'Heard Island',
    'hn': 'Honduras',
    'hr': 'Croatia',
    'ht': 'Haiti',
    'hu': 'Hungary',
    'id': 'Indonesia',
    'ie': 'Ireland',
    'il': 'Israel',
    'im': 'Isle of Man',
    'io': 'British Indian Ocean Territory',
    'iq': 'Iraq',
    'ir': 'Iran',
    'is': 'Iceland',
    'je': 'Jersey',
    'jm': 'Jamaica',
    'jo': 'Jordan',
    'ke': 'Kenya',
    'kg': 'Kyrgyzstan',
    'kh': 'Cambodia',
    'ki': 'Kiribati',
    'km': 'Comoros',
    'kn': 'Saint Kitts and Nevis',
    'kp': 'North Korea',
    'kw': 'Kuwait',
    'ky': 'Cayman Islands',
    'kz': 'Kazakhstan',
    'la': 'Laos',
    'lb': 'Lebanon',
    'lc': 'Saint Lucia',
    'li': 'Liechtenstein',
    'lk': 'Sri Lanka',
    'lr': 'Liberia',
    'ls': 'Lesotho',
    'lt': 'Lithuania',
    'lu': 'Luxembourg',
    'lv': 'Latvia',
    'ly': 'Libya',
    'ma': 'Morocco',
    'mc': 'Monaco',
    'md': 'Moldova',
    'me': 'Montenegro',
    'mf': 'Saint Martin',
    'mg': 'Madagascar',
    'mh': 'Marshall Islands',
    'mk': 'North Macedonia',
    'ml': 'Mali',
    'mm': 'Myanmar',
    'mn': 'Mongolia',
    'mo': 'Macao',
    'mp': 'Northern Mariana Islands',
    'mq': 'Martinique',
    'mr': 'Mauritania',
    'ms': 'Montserrat',
    'mt': 'Malta',
    'mu': 'Mauritius',
    'mv': 'Maldives',
    'mw': 'Malawi',
    'my': 'Malaysia',
    'mz': 'Mozambique',
    'na': 'Namibia',
    'nc': 'New Caledonia',
    'ne': 'Niger',
    'nf': 'Norfolk Island',
    'ng': 'Nigeria',
    'ni': 'Nicaragua',
    'np': 'Nepal',
    'nr': 'Nauru',
    'nu': 'Niue',
    'nz': 'New Zealand',
    'om': 'Oman',
    'pa': 'Panama',
    'pe': 'Peru',
    'pf': 'French Polynesia',
    'pg': 'Papua New Guinea',
    'ph': 'Philippines',
    'pk': 'Pakistan',
    'pl': 'Poland',
    'pm': 'Saint Pierre and Miquelon',
    'pn': 'Pitcairn',
    'pr': 'Puerto Rico',
    'ps': 'Palestine',
    'pt': 'Portugal',
    'pw': 'Palau',
    'py': 'Paraguay',
    'qa': 'Qatar',
    're': 'Réunion',
    'ro': 'Romania',
    'rs': 'Serbia',
    'rw': 'Rwanda',
    'sa': 'Saudi Arabia',
    'sb': 'Solomon Islands',
    'sc': 'Seychelles',
    'sd': 'Sudan',
    'sg': 'Singapore',
    'sh': 'Saint Helena',
    'si': 'Slovenia',
    'sj': 'Svalbard and Jan Mayen',
    'sk': 'Slovakia',
    'sl': 'Sierra Leone',
    'sm': 'San Marino',
    'sn': 'Senegal',
    'so': 'Somalia',
    'sr': 'Suriname',
    'ss': 'South Sudan',
    'st': 'São Tomé and Príncipe',
    'sv': 'El Salvador',
    'sx': 'Sint Maarten',
    'sy': 'Syria',
    'sz': 'Eswatini',
    'tc': 'Turks and Caicos Islands',
    'td': 'Chad',
    'tf': 'French Southern Territories',
    'tg': 'Togo',
    'th': 'Thailand',
    'tj': 'Tajikistan',
    'tk': 'Tokelau',
    'tl': 'Timor-Leste',
    'tm': 'Turkmenistan',
    'tn': 'Tunisia',
    'to': 'Tonga',
    'tr': 'Turkey',
    'tt': 'Trinidad and Tobago',
    'tv': 'Tuvalu',
    'tw': 'Taiwan',
    'tz': 'Tanzania',
    'ua': 'Ukraine',
    'ug': 'Uganda',
    'um': 'United States Minor Outlying Islands',
    'uy': 'Uruguay',
    'uz': 'Uzbekistan',
    'va': 'Vatican City',
    'vc': 'Saint Vincent and the Grenadines',
    've': 'Venezuela',
    'vg': 'British Virgin Islands',
    'vi': 'U.S. Virgin Islands',
    'vn': 'Vietnam',
    'vu': 'Vanuatu',
    'wf': 'Wallis and Futuna',
    'ws': 'Samoa',
    'ye': 'Yemen',
    'yt': 'Mayotte',
    'za': 'South Africa',
    'zm': 'Zambia',
    'zw': 'Zimbabwe'
  };
  
  return countryNames[countryCode.toLowerCase()] || countryCode.toUpperCase();
}

/**
 * 국가명에서 국가 코드를 가져오는 함수
 */
function getCountryCodeFromName(countryName: string): string | null {
  const countryCodeMap: Record<string, string> = {
    'United States': 'US',
    'South Korea': 'KR',
    'Korea': 'KR',
    'Japan': 'JP',
    'China': 'CN',
    'United Kingdom': 'GB',
    'Britain': 'GB',
    'Germany': 'DE',
    'France': 'FR',
    'Canada': 'CA',
    'Australia': 'AU',
    'India': 'IN',
    'Brazil': 'BR',
    'Mexico': 'MX',
    'Italy': 'IT',
    'Spain': 'ES',
    'Russia': 'RU',
    'Netherlands': 'NL',
    'Sweden': 'SE',
    'Norway': 'NO',
    'Denmark': 'DK',
    'Finland': 'FI',
    'Andorra': 'AD'
  };
  
  return countryCodeMap[countryName] || null;
}

// 인증 미들웨어로 래핑
export const GET = withAuth(handler);