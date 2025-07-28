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
 * 국가 슬러그를 국가 코드로 변환하는 함수
 */
export function getCountryCodeFromSlug(slug: string): string | null {
  const normalizedSlug = slug.toLowerCase().replace(/-/g, ' ');
  
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
    'ireland': 'IE'
  };
  
  return countryMapping[normalizedSlug] || null;
}