/**
 * 국가 관련 유틸리티 함수들
 */

/**
 * 공휴일 이름을 URL 슬러그로 변환하는 함수
 * 한국어와 영어 모두 지원
 */
export function createHolidaySlug(holidayName: string): string {
  // 한국어 공휴일 이름을 영어 슬러그로 매핑
  const koreanToEnglishMapping: Record<string, string> = {
    '신정': 'new-years-day',
    '설날': 'lunar-new-year',
    '삼일절': 'independence-movement-day',
    '어린이날': 'childrens-day',
    '부처님오신날': 'buddhas-birthday',
    '현충일': 'memorial-day',
    '광복절': 'liberation-day',
    '추석': 'chuseok',
    '개천절': 'national-foundation-day',
    '한글날': 'hangeul-day',
    '크리스마스': 'christmas-day',
    '근로자의 날': 'labour-day',
    '제헌절': 'constitution-day',
    '발렌타인데이': 'valentines-day',
    '캐나다데이': 'canada-day',
    '캐나다 데이': 'canada-day', // 공백 포함 버전 추가
    '독립기념일': 'independence-day',
    '바스티유 데이': 'bastille-day',
    '호주의 날': 'australia-day',
    '성 패트릭의 날': 'st-patricks-day',
    '승전기념일': 'victory-day',
    '국기의 날': 'flag-day',
    '재향군인의 날': 'veterans-day',
    '추수감사절': 'thanksgiving',
    '할로윈': 'halloween',
    '신정 전야': 'new-years-eve',
    '만우절': 'april-fools-day',
    '성 조지의 날': 'st-georges-day',
    '중양절': 'double-ninth-festival'
  };

  // 한국어 매핑이 있으면 사용
  if (koreanToEnglishMapping[holidayName]) {
    return koreanToEnglishMapping[holidayName];
  }

  // 영어 이름을 슬러그로 변환
  const slug = holidayName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // 영문자, 숫자, 공백만 유지
    .replace(/\s+/g, '-') // 공백을 하이픈으로
    .replace(/-+/g, '-') // 연속 하이픈 정리
    .replace(/^-+|-+$/g, '') // 시작/끝 하이픈 제거
    .trim();

  // 빈 문자열이 반환되는 경우 방지
  if (!slug) {
    console.warn(`공휴일 이름 '${holidayName}'에서 유효한 슬러그를 생성할 수 없습니다. 기본값을 사용합니다.`);
    return 'holiday'; // 기본값 반환
  }

  return slug;
}

/**
 * 국가 코드를 국가 슬러그로 변환하는 함수
 * 공휴일 상세 페이지 URL 생성에 사용됩니다.
 */
export function getCountrySlugFromCode(countryCode: string): string {
  const countryMapping: Record<string, string> = {
    'AD': 'andorra',
    'KR': 'south-korea',
    'US': 'united-states',
    'GB': 'united-kingdom',
    'JP': 'japan',
    'CN': 'china',
    'DE': 'germany',
    'FR': 'france',
    'CA': 'canada',
    'AU': 'australia',
    'BR': 'brazil',
    'IN': 'india',
    'RU': 'russia',
    'IT': 'italy',
    'ES': 'spain',
    'MX': 'mexico',
    'NL': 'netherlands',
    'SE': 'sweden',
    'NO': 'norway',
    'DK': 'denmark',
    'FI': 'finland',
    'PL': 'poland',
    'TR': 'turkey',
    'TH': 'thailand',
    'SG': 'singapore',
    'MY': 'malaysia',
    'ID': 'indonesia',
    'PH': 'philippines',
    'VN': 'vietnam',
    'EG': 'egypt',
    'ZA': 'south-africa',
    'NG': 'nigeria',
    'AR': 'argentina',
    'CL': 'chile',
    'CO': 'colombia',
    'PE': 'peru',
    'VE': 'venezuela',
    'NZ': 'new-zealand',
    'IE': 'ireland'
  };
  
  const slug = countryMapping[countryCode];
  if (!slug) {
    console.warn(`국가 코드 '${countryCode}'에 대한 슬러그 매핑이 없습니다. 소문자로 변환합니다.`);
    return countryCode.toLowerCase();
  }
  
  return slug;
}

/**
 * 국가 이름을 국가 슬러그로 변환하는 함수
 */
export function getCountrySlugFromName(countryName: string): string | null {
  const normalizedName = countryName.toLowerCase();
  
  const nameToSlugMapping: Record<string, string> = {
    'south korea': 'south-korea',
    'korea': 'south-korea',
    'united states': 'united-states',
    'usa': 'united-states',
    'united kingdom': 'united-kingdom',
    'uk': 'united-kingdom',
    'japan': 'japan',
    'china': 'china',
    'germany': 'germany',
    'france': 'france',
    'canada': 'canada',
    'australia': 'australia',
    'brazil': 'brazil',
    'india': 'india',
    'russia': 'russia',
    'italy': 'italy',
    'spain': 'spain',
    'mexico': 'mexico',
    'netherlands': 'netherlands',
    'sweden': 'sweden',
    'norway': 'norway',
    'denmark': 'denmark',
    'finland': 'finland',
    'poland': 'poland',
    'turkey': 'turkey',
    'thailand': 'thailand',
    'singapore': 'singapore',
    'malaysia': 'malaysia',
    'indonesia': 'indonesia',
    'philippines': 'philippines',
    'vietnam': 'vietnam',
    'egypt': 'egypt',
    'south africa': 'south-africa',
    'nigeria': 'nigeria',
    'argentina': 'argentina',
    'chile': 'chile',
    'colombia': 'colombia',
    'peru': 'peru',
    'venezuela': 'venezuela',
    'new zealand': 'new-zealand',
    'ireland': 'ireland'
  };
  
  return nameToSlugMapping[normalizedName] || null;
}

/**
 * 국가 슬러그를 국가 코드로 변환하는 함수
 * 국가 코드 자체도 처리 가능 (예: 'ba' -> 'BA')
 */
export function getCountryCodeFromSlug(slug: string): string | null {
  // 먼저 2글자 국가 코드인지 확인
  if (slug.length === 2) {
    const upperSlug = slug.toUpperCase();
    // SUPPORTED_COUNTRIES에서 유효한 국가 코드인지 확인
    const validCountryCodes = [
      'AD', 'AE', 'AF', 'AL', 'AM', 'AO', 'AR', 'AT', 'AU', 'AZ',
      'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BN', 'BO', 'BR', 'BS', 'BT', 'BW', 'BY', 'BZ',
      'CA', 'CD', 'CF', 'CG', 'CH', 'CI', 'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CY', 'CZ',
      'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ',
      'EC', 'EE', 'EG', 'ER', 'ES', 'ET',
      'FI', 'FJ', 'FR',
      'GA', 'GB', 'GD', 'GE', 'GH', 'GM', 'GN', 'GQ', 'GR', 'GT', 'GW', 'GY',
      'HN', 'HR', 'HT', 'HU',
      'ID', 'IE', 'IL', 'IN', 'IQ', 'IR', 'IS', 'IT',
      'JM', 'JO', 'JP',
      'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KZ',
      'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY',
      'MA', 'MC', 'MD', 'ME', 'MG', 'MH', 'MK', 'ML', 'MM', 'MN', 'MR', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ',
      'NA', 'NE', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NZ',
      'OM',
      'PA', 'PE', 'PG', 'PH', 'PK', 'PL', 'PT', 'PW', 'PY',
      'QA',
      'RO', 'RS', 'RU', 'RW',
      'SA', 'SB', 'SC', 'SD', 'SE', 'SG', 'SI', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SY', 'SZ',
      'TD', 'TG', 'TH', 'TJ', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ',
      'UA', 'UG', 'US', 'UY', 'UZ',
      'VA', 'VC', 'VE', 'VN', 'VU',
      'WS',
      'YE',
      'ZA', 'ZM', 'ZW'
    ];
    
    if (validCountryCodes.includes(upperSlug)) {
      return upperSlug;
    }
  }
  
  // 국가명이나 슬러그인 경우 매핑 테이블 사용
  const normalizedSlug = slug.toLowerCase().replace(/-/g, ' ');
  
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
    
    // D-Z (기존 매핑 유지)
    'germany': 'DE',
    'djibouti': 'DJ',
    'denmark': 'DK',
    'dominica': 'DM',
    'dominican republic': 'DO',
    'algeria': 'DZ',
    'ecuador': 'EC',
    'estonia': 'EE',
    'egypt': 'EG',
    'eritrea': 'ER',
    'spain': 'ES',
    'ethiopia': 'ET',
    'finland': 'FI',
    'fiji': 'FJ',
    'france': 'FR',
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
    'honduras': 'HN',
    'croatia': 'HR',
    'haiti': 'HT',
    'hungary': 'HU',
    'indonesia': 'ID',
    'ireland': 'IE',
    'israel': 'IL',
    'india': 'IN',
    'iraq': 'IQ',
    'iran': 'IR',
    'iceland': 'IS',
    'italy': 'IT',
    'jamaica': 'JM',
    'jordan': 'JO',
    'japan': 'JP',
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
    'namibia': 'NA',
    'niger': 'NE',
    'nigeria': 'NG',
    'nicaragua': 'NI',
    'netherlands': 'NL',
    'norway': 'NO',
    'nepal': 'NP',
    'nauru': 'NR',
    'new zealand': 'NZ',
    'oman': 'OM',
    'panama': 'PA',
    'peru': 'PE',
    'papua new guinea': 'PG',
    'philippines': 'PH',
    'pakistan': 'PK',
    'poland': 'PL',
    'portugal': 'PT',
    'palau': 'PW',
    'paraguay': 'PY',
    'qatar': 'QA',
    'romania': 'RO',
    'serbia': 'RS',
    'russia': 'RU',
    'russian federation': 'RU',
    'rwanda': 'RW',
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
    'ukraine': 'UA',
    'uganda': 'UG',
    'united states': 'US',
    'usa': 'US',
    'america': 'US',
    'uruguay': 'UY',
    'uzbekistan': 'UZ',
    'vatican city': 'VA',
    'vatican': 'VA',
    'saint vincent and the grenadines': 'VC',
    'venezuela': 'VE',
    'vietnam': 'VN',
    'vanuatu': 'VU',
    'samoa': 'WS',
    'yemen': 'YE',
    'south africa': 'ZA',
    'zambia': 'ZM',
    'zimbabwe': 'ZW'
  };
  
  return countryMapping[normalizedSlug] || null;
}