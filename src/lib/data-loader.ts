import { promises as fs } from 'fs';
import path from 'path';
import { Holiday, Country } from '@/types';
import { SUPPORTED_COUNTRIES } from '@/lib/constants';
import { logError, logWarning, logInfo } from './error-logger';
import { getCachedDescription } from './hybrid-cache';

interface HolidayDataFile {
  countryCode: string;
  year: number;
  totalHolidays: number;
  lastUpdated: string;
  holidays: Holiday[];
}

/**
 * 특정 국가와 연도의 공휴일 데이터를 로드합니다.
 * 요구사항 6.3: 데이터가 없으면 적절한 메시지와 함께 빈 배열 반환
 */
export async function loadHolidayData(
  countryCode: string, 
  year: number,
  locale: string = 'ko'
): Promise<Holiday[]> {
  try {
    logInfo(`공휴일 데이터 로드 시작: ${countryCode}-${year}`);
    
    const dataPath = path.join(
      process.cwd(), 
      'data', 
      'holidays', 
      `${countryCode.toLowerCase()}-${year}.json`
    );
    
    // 파일 존재 여부 확인
    try {
      await fs.access(dataPath);
    } catch {
      // 요구사항 6.3: 데이터가 없는 경우 로그 기록
      logWarning(`공휴일 데이터 파일 없음: ${countryCode}-${year}`, {
        countryCode,
        year,
        dataPath
      });
      return [];
    }
    
    const fileContent = await fs.readFile(dataPath, 'utf-8');
    const data: HolidayDataFile = JSON.parse(fileContent);
    
    // 데이터 유효성 검증
    if (!data.holidays || !Array.isArray(data.holidays)) {
      logWarning(`공휴일 데이터 형식 오류: ${countryCode}-${year}`, {
        countryCode,
        year,
        dataStructure: Object.keys(data)
      });
      return [];
    }
    
    // 각 공휴일에 설명 추가 (로케일에 맞는 설명 조회)
    const countryName = (data.country && data.country.trim()) || await getCountryNameFromCode(countryCode);
    const enrichedHolidays = await enrichHolidaysWithDescriptions(data.holidays, countryName, locale);
    
    logInfo(`공휴일 데이터 로드 완료: ${countryCode}-${year} - ${enrichedHolidays.length}개`);
    return enrichedHolidays;
    
  } catch (error) {
    logError(error as Error, {
      operation: 'loadHolidayData',
      countryCode,
      year
    });
    return [];
  }
}

/**
 * 국가 코드에서 국가명을 가져오는 함수
 */
async function getCountryNameFromCode(countryCode: string): Promise<string> {
  try {
    // SUPPORTED_COUNTRIES에서 국가 정보 찾기
    const country = SUPPORTED_COUNTRIES.find(c => 
      c.code.toLowerCase() === countryCode.toLowerCase()
    );
    
    if (country) {
      return country.name;
    }
    
    // SUPPORTED_COUNTRIES에 없으면 기본 매핑 사용
    const countryMapping: Record<string, string> = {
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
      'au': 'Australia',
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
      'br': 'Brazil',
      'bs': 'Bahamas',
      'bt': 'Bhutan',
      'bv': 'Bouvet Island',
      'bw': 'Botswana',
      'by': 'Belarus',
      'bz': 'Belize',
      'ca': 'Canada',
      'cc': 'Cocos Islands',
      'cd': 'Democratic Republic of the Congo',
      'cf': 'Central African Republic',
      'cg': 'Republic of the Congo',
      'ch': 'Switzerland',
      'ci': 'Côte d\'Ivoire',
      'ck': 'Cook Islands',
      'cl': 'Chile',
      'cm': 'Cameroon',
      'cn': 'China',
      'co': 'Colombia',
      'cr': 'Costa Rica',
      'cu': 'Cuba',
      'cv': 'Cape Verde',
      'cw': 'Curaçao',
      'cx': 'Christmas Island',
      'cy': 'Cyprus',
      'cz': 'Czech Republic',
      'de': 'Germany',
      'dj': 'Djibouti',
      'dk': 'Denmark',
      'dm': 'Dominica',
      'do': 'Dominican Republic',
      'dz': 'Algeria',
      'ec': 'Ecuador',
      'ee': 'Estonia',
      'eg': 'Egypt',
      'eh': 'Western Sahara',
      'er': 'Eritrea',
      'es': 'Spain',
      'et': 'Ethiopia',
      'fi': 'Finland',
      'fj': 'Fiji',
      'fk': 'Falkland Islands',
      'fm': 'Micronesia',
      'fo': 'Faroe Islands',
      'fr': 'France',
      'ga': 'Gabon',
      'gb': 'United Kingdom',
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
      'gs': 'South Georgia and the South Sandwich Islands',
      'gt': 'Guatemala',
      'gu': 'Guam',
      'gw': 'Guinea-Bissau',
      'gy': 'Guyana',
      'hk': 'Hong Kong',
      'hm': 'Heard Island and McDonald Islands',
      'hn': 'Honduras',
      'hr': 'Croatia',
      'ht': 'Haiti',
      'hu': 'Hungary',
      'id': 'Indonesia',
      'ie': 'Ireland',
      'il': 'Israel',
      'im': 'Isle of Man',
      'in': 'India',
      'io': 'British Indian Ocean Territory',
      'iq': 'Iraq',
      'ir': 'Iran',
      'is': 'Iceland',
      'it': 'Italy',
      'je': 'Jersey',
      'jm': 'Jamaica',
      'jo': 'Jordan',
      'jp': 'Japan',
      'ke': 'Kenya',
      'kg': 'Kyrgyzstan',
      'kh': 'Cambodia',
      'ki': 'Kiribati',
      'km': 'Comoros',
      'kn': 'Saint Kitts and Nevis',
      'kp': 'North Korea',
      'kr': 'South Korea',
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
      'mx': 'Mexico',
      'my': 'Malaysia',
      'mz': 'Mozambique',
      'na': 'Namibia',
      'nc': 'New Caledonia',
      'ne': 'Niger',
      'nf': 'Norfolk Island',
      'ng': 'Nigeria',
      'ni': 'Nicaragua',
      'nl': 'Netherlands',
      'no': 'Norway',
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
      'ru': 'Russia',
      'rw': 'Rwanda',
      'sa': 'Saudi Arabia',
      'sb': 'Solomon Islands',
      'sc': 'Seychelles',
      'sd': 'Sudan',
      'se': 'Sweden',
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
      'us': 'United States',
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
    
    return countryMapping[countryCode.toLowerCase()] || countryCode.toUpperCase();
  } catch (error) {
    logWarning(`국가 코드 변환 실패: ${countryCode}`, {
      countryCode,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    });
    return countryCode.toUpperCase();
  }
}

/**
 * 공휴일 배열에 설명을 추가합니다.
 */
async function enrichHolidaysWithDescriptions(holidays: Holiday[], countryName: string, locale: string = 'ko'): Promise<Holiday[]> {
  const enrichedHolidays: Holiday[] = [];
  
  for (const holiday of holidays) {
    try {
      // 하이브리드 캐시에서 설명 조회 (Supabase 우선, 로컬 캐시 폴백)
      let cachedDescription = await getCachedDescription(holiday.name, countryName, locale);
      
      // 첫 번째 시도에서 찾지 못한 경우 다양한 국가명 형식으로 재시도
      if (!cachedDescription) {
        const countryVariations = [
          countryName,
          // 국가 코드 매핑 시도
          getCountryCodeFromName(countryName),
          // 일반적인 국가명 변형들
          countryName.replace(/^The\s+/i, ''), // "The United States" -> "United States"
          countryName.replace(/\s+of\s+.*$/i, ''), // "Republic of Korea" -> "Republic"
        ].filter(Boolean);
        
        for (const variation of countryVariations) {
          if (variation && variation !== countryName) {
            cachedDescription = await getCachedDescription(holiday.name, variation, locale);
            if (cachedDescription) {
              logInfo(`공휴일 설명 조회 성공 (변형된 국가명): ${holiday.name} (${variation})`);
              break;
            }
          }
        }
      }
      
      const enrichedHoliday: Holiday = {
        ...holiday,
        description: cachedDescription?.description || holiday.description
      };
      
      enrichedHolidays.push(enrichedHoliday);
    } catch (error) {
      // 설명 조회 실패 시 원본 공휴일 데이터 사용
      logWarning(`공휴일 설명 조회 실패: ${holiday.name} (${countryName})`, {
        holidayName: holiday.name,
        countryName,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      });
      enrichedHolidays.push(holiday);
    }
  }
  
  return enrichedHolidays;
}

/**
 * 국가명에서 국가 코드를 가져오는 함수 (data-loader 내부용)
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
    'Great Britain': 'GB',
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
    'Finland': 'FI'
  };
  
  return countryCodeMap[countryName] || null;
}

/**
 * 특정 국가 데이터를 로드합니다.
 */
export async function loadCountryData(countryCode: string): Promise<Country | null> {
  try {
    logInfo(`국가 데이터 로드 시작: ${countryCode}`);
    
    // SUPPORTED_COUNTRIES에서 국가 정보 찾기
    const country = SUPPORTED_COUNTRIES.find(c => 
      c.code.toLowerCase() === countryCode.toLowerCase()
    );
    
    if (!country) {
      logWarning(`지원하지 않는 국가 코드: ${countryCode}`, {
        countryCode,
        supportedCountries: SUPPORTED_COUNTRIES.map(c => c.code)
      });
      return null;
    }
    
    logInfo(`국가 데이터 로드 완료: ${country.name} (${country.code})`);
    return country;
  } catch (error) {
    logError(error as Error, {
      operation: 'loadCountryData',
      countryCode
    });
    return null;
  }
}

/**
 * 특정 국가의 사용 가능한 연도 목록을 가져옵니다.
 */
export async function getAvailableYears(countryCode: string): Promise<number[]> {
  try {
    logInfo(`사용 가능한 연도 조회 시작: ${countryCode}`);
    
    const holidaysDir = path.join(process.cwd(), 'data', 'holidays');
    
    // 디렉토리 존재 여부 확인
    try {
      await fs.access(holidaysDir);
    } catch {
      logWarning(`공휴일 데이터 디렉토리 없음: ${holidaysDir}`, {
        countryCode,
        holidaysDir
      });
      return [];
    }
    
    const files = await fs.readdir(holidaysDir);
    
    const years = files
      .filter(file => file.startsWith(`${countryCode.toLowerCase()}-`) && file.endsWith('.json'))
      .map(file => {
        const match = file.match(/-(\d{4})\.json$/);
        return match ? parseInt(match[1]) : null;
      })
      .filter((year): year is number => year !== null)
      .sort((a, b) => b - a); // 최신 연도부터 정렬
    
    logInfo(`사용 가능한 연도 조회 완료: ${countryCode} - ${years.length}개 연도`);
    return years;
  } catch (error) {
    logError(error as Error, {
      operation: 'getAvailableYears',
      countryCode
    });
    return [];
  }
}

/**
 * 모든 국가의 사용 가능한 데이터를 확인합니다.
 */
export async function getAllAvailableData(): Promise<Record<string, number[]>> {
  try {
    logInfo('전체 사용 가능한 데이터 조회 시작');
    
    const holidaysDir = path.join(process.cwd(), 'data', 'holidays');
    
    // 디렉토리 존재 여부 확인
    try {
      await fs.access(holidaysDir);
    } catch {
      logWarning(`공휴일 데이터 디렉토리 없음: ${holidaysDir}`, {
        holidaysDir
      });
      return {};
    }
    
    const files = await fs.readdir(holidaysDir);
    const dataMap: Record<string, number[]> = {};
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      const match = file.match(/^([a-z]{2})-(\d{4})\.json$/);
      if (match) {
        const [, countryCode, yearStr] = match;
        const year = parseInt(yearStr);
        
        if (!dataMap[countryCode.toUpperCase()]) {
          dataMap[countryCode.toUpperCase()] = [];
        }
        dataMap[countryCode.toUpperCase()].push(year);
      }
    }
    
    // 각 국가의 연도를 정렬
    Object.keys(dataMap).forEach(country => {
      dataMap[country].sort((a, b) => b - a);
    });
    
    const totalCountries = Object.keys(dataMap).length;
    const totalFiles = Object.values(dataMap).reduce((sum, years) => sum + years.length, 0);
    
    logInfo(`전체 사용 가능한 데이터 조회 완료: ${totalCountries}개 국가, ${totalFiles}개 파일`);
    return dataMap;
  } catch (error) {
    logError(error as Error, {
      operation: 'getAllAvailableData'
    });
    return {};
  }
}

/**
 * 특정 월의 모든 공휴일을 가져옵니다.
 */
export async function getHolidaysByMonth(year: number, month: number): Promise<Holiday[]> {
  try {
    logInfo(`월별 공휴일 조회 시작: ${year}-${month + 1}`);
    
    const holidaysDir = path.join(process.cwd(), 'data', 'holidays');
    
    // 디렉토리 존재 여부 확인
    try {
      await fs.access(holidaysDir);
    } catch {
      logWarning(`공휴일 데이터 디렉토리 없음: ${holidaysDir}`, {
        year,
        month,
        holidaysDir
      });
      return [];
    }
    
    const files = await fs.readdir(holidaysDir);
    const holidays: Holiday[] = [];
    let processedFiles = 0;
    let errorFiles = 0;
    
    // 해당 연도의 파일들만 필터링
    const yearFiles = files.filter(file => 
      file.endsWith('.json') && file.includes(`-${year}.json`)
    );
    
    for (const file of yearFiles) {
      try {
        const filePath = path.join(holidaysDir, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data: HolidayDataFile = JSON.parse(fileContent);
        
        // 데이터 유효성 검증
        if (!data.holidays || !Array.isArray(data.holidays)) {
          logWarning(`파일 데이터 형식 오류: ${file}`, {
            year,
            month,
            file,
            dataStructure: Object.keys(data)
          });
          errorFiles++;
          continue;
        }
        
        // 해당 월의 공휴일만 필터링
        const monthHolidays = data.holidays.filter(holiday => {
          const holidayDate = new Date(holiday.date);
          return holidayDate.getFullYear() === year && holidayDate.getMonth() === month;
        });
        
        holidays.push(...monthHolidays);
        processedFiles++;
        
      } catch (error) {
        logError(error as Error, {
          operation: 'getHolidaysByMonth - file processing',
          year,
          month,
          file
        });
        errorFiles++;
      }
    }
    
    // 날짜순으로 정렬
    holidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    logInfo(`월별 공휴일 조회 완료: ${year}-${month + 1} - ${holidays.length}개 공휴일 (${processedFiles}개 파일 처리, ${errorFiles}개 파일 오류)`);
    return holidays;
    
  } catch (error) {
    logError(error as Error, {
      operation: 'getHolidaysByMonth',
      year,
      month
    });
    return [];
  }
}

/**
 * 특정 날짜의 공휴일을 모든 국가에서 찾습니다.
 * 요구사항 5.2: 오늘 공휴일이 없으면 빈 배열 반환
 */
export async function getHolidaysByDate(date: string): Promise<Holiday[]> {
  try {
    logInfo(`특정 날짜 공휴일 조회 시작: ${date}`);
    
    const holidaysDir = path.join(process.cwd(), 'data', 'holidays');
    
    // 디렉토리 존재 여부 확인
    try {
      await fs.access(holidaysDir);
    } catch {
      logWarning(`공휴일 데이터 디렉토리 없음: ${holidaysDir}`, {
        date,
        holidaysDir
      });
      return [];
    }
    
    const files = await fs.readdir(holidaysDir);
    const holidays: Holiday[] = [];
    let processedFiles = 0;
    let errorFiles = 0;
    
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      
      try {
        const filePath = path.join(holidaysDir, file);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data: HolidayDataFile = JSON.parse(fileContent);
        
        // 데이터 유효성 검증
        if (!data.holidays || !Array.isArray(data.holidays)) {
          logWarning(`파일 데이터 형식 오류: ${file}`, {
            date,
            file,
            dataStructure: Object.keys(data)
          });
          errorFiles++;
          continue;
        }
        
        const matchingHolidays = data.holidays.filter(holiday => holiday.date === date);
        holidays.push(...matchingHolidays);
        processedFiles++;
        
      } catch (error) {
        logError(error as Error, {
          operation: 'getHolidaysByDate - file processing',
          date,
          file
        });
        errorFiles++;
      }
    }
    
    logInfo(`특정 날짜 공휴일 조회 완료: ${date} - ${holidays.length}개 공휴일 (${processedFiles}개 파일 처리, ${errorFiles}개 파일 오류)`);
    return holidays;
    
  } catch (error) {
    logError(error as Error, {
      operation: 'getHolidaysByDate',
      date
    });
    return [];
  }
}