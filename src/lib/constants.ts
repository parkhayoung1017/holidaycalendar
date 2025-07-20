// ===== 국가 및 지역 상수 =====

// 지원하는 국가 목록 (확장된 버전)
export const SUPPORTED_COUNTRIES = [
  // 아시아
  { code: 'KR', name: 'South Korea', region: 'Asia', flag: '🇰🇷', popular: true },
  { code: 'JP', name: 'Japan', region: 'Asia', flag: '🇯🇵', popular: true },
  { code: 'CN', name: 'China', region: 'Asia', flag: '🇨🇳', popular: true },
  { code: 'IN', name: 'India', region: 'Asia', flag: '🇮🇳', popular: true },
  { code: 'TH', name: 'Thailand', region: 'Asia', flag: '🇹🇭', popular: false },
  { code: 'VN', name: 'Vietnam', region: 'Asia', flag: '🇻🇳', popular: false },
  { code: 'SG', name: 'Singapore', region: 'Asia', flag: '🇸🇬', popular: false },
  { code: 'MY', name: 'Malaysia', region: 'Asia', flag: '🇲🇾', popular: false },
  { code: 'PH', name: 'Philippines', region: 'Asia', flag: '🇵🇭', popular: false },
  { code: 'ID', name: 'Indonesia', region: 'Asia', flag: '🇮🇩', popular: false },

  // 유럽
  { code: 'GB', name: 'United Kingdom', region: 'Europe', flag: '🇬🇧', popular: true },
  { code: 'DE', name: 'Germany', region: 'Europe', flag: '🇩🇪', popular: true },
  { code: 'FR', name: 'France', region: 'Europe', flag: '🇫🇷', popular: true },
  { code: 'IT', name: 'Italy', region: 'Europe', flag: '🇮🇹', popular: true },
  { code: 'ES', name: 'Spain', region: 'Europe', flag: '🇪🇸', popular: true },
  { code: 'NL', name: 'Netherlands', region: 'Europe', flag: '🇳🇱', popular: false },
  { code: 'CH', name: 'Switzerland', region: 'Europe', flag: '🇨🇭', popular: false },
  { code: 'AT', name: 'Austria', region: 'Europe', flag: '🇦🇹', popular: false },
  { code: 'SE', name: 'Sweden', region: 'Europe', flag: '🇸🇪', popular: false },
  { code: 'NO', name: 'Norway', region: 'Europe', flag: '🇳🇴', popular: false },

  // 북미
  { code: 'US', name: 'United States', region: 'North America', flag: '🇺🇸', popular: true },
  { code: 'CA', name: 'Canada', region: 'North America', flag: '🇨🇦', popular: true },
  { code: 'MX', name: 'Mexico', region: 'North America', flag: '🇲🇽', popular: false },

  // 오세아니아
  { code: 'AU', name: 'Australia', region: 'Oceania', flag: '🇦🇺', popular: true },
  { code: 'NZ', name: 'New Zealand', region: 'Oceania', flag: '🇳🇿', popular: false },

  // 남미
  { code: 'BR', name: 'Brazil', region: 'South America', flag: '🇧🇷', popular: false },
  { code: 'AR', name: 'Argentina', region: 'South America', flag: '🇦🇷', popular: false },
  { code: 'CL', name: 'Chile', region: 'South America', flag: '🇨🇱', popular: false },

  // 아프리카
  { code: 'ZA', name: 'South Africa', region: 'Africa', flag: '🇿🇦', popular: false },
  { code: 'EG', name: 'Egypt', region: 'Africa', flag: '🇪🇬', popular: false },

  // 중동
  { code: 'AE', name: 'United Arab Emirates', region: 'Middle East', flag: '🇦🇪', popular: false },
  { code: 'SA', name: 'Saudi Arabia', region: 'Middle East', flag: '🇸🇦', popular: false },
] as const;

// 지역 목록 (실제 데이터가 있는 국가들만 포함)
export const REGIONS = [
  { 
    name: 'Asia', 
    displayName: '아시아', 
    countries: ['KR', 'JP'], // 실제 데이터가 있는 국가만
    displayOrder: 1
  },
  { 
    name: 'Europe', 
    displayName: '유럽', 
    countries: ['GB', 'DE', 'FR', 'IT', 'ES'], // 실제 데이터가 있는 국가만
    displayOrder: 2
  },
  { 
    name: 'North America', 
    displayName: '북미', 
    countries: ['US', 'CA'], // 실제 데이터가 있는 국가만
    displayOrder: 3
  },
  { 
    name: 'Oceania', 
    displayName: '오세아니아', 
    countries: ['AU'], // 실제 데이터가 있는 국가만
    displayOrder: 4
  },
] as const;

// 인기 국가 (홈페이지 바로가기용)
export const POPULAR_COUNTRIES = SUPPORTED_COUNTRIES.filter(country => country.popular);

// ===== 날짜 및 시간 상수 =====

// 현재 연도와 지원 연도 범위
export const CURRENT_YEAR = new Date().getFullYear();
export const SUPPORTED_YEARS = Array.from(
  { length: 10 }, 
  (_, i) => CURRENT_YEAR - 2 + i
);

// 월 이름 (다국어 지원)
export const MONTH_NAMES = {
  ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 
       'July', 'August', 'September', 'October', 'November', 'December']
} as const;

// 요일 이름
export const DAY_NAMES = {
  ko: ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
} as const;

// ===== API 관련 상수 =====

// API 엔드포인트
export const API_ENDPOINTS = {
  HOLIDAY_API: process.env.HOLIDAY_API_BASE_URL || 'https://calendarific.com/api/v2',
  NAGER_DATE_API: 'https://date.nager.at/api/v3',
  OPENAI_API: 'https://api.openai.com/v1'
} as const;

// API 설정
export const API_CONFIG = {
  RATE_LIMIT: {
    HOLIDAY_API: 1000, // requests per month
    OPENAI_API: 60,    // requests per minute
  },
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
} as const;

// ===== 공휴일 타입 상수 =====

// 공휴일 타입 정의
export const HOLIDAY_TYPES = {
  PUBLIC: 'public',
  BANK: 'bank', 
  SCHOOL: 'school',
  OPTIONAL: 'optional'
} as const;

// 공휴일 타입 표시명
export const HOLIDAY_TYPE_LABELS = {
  [HOLIDAY_TYPES.PUBLIC]: '공휴일',
  [HOLIDAY_TYPES.BANK]: '은행휴무일',
  [HOLIDAY_TYPES.SCHOOL]: '학교휴무일',
  [HOLIDAY_TYPES.OPTIONAL]: '선택휴무일'
} as const;

// ===== 캐시 관련 상수 =====

// 캐시 TTL (Time To Live) 설정
export const CACHE_TTL = {
  HOLIDAY_DATA: 24 * 60 * 60 * 1000, // 24 hours
  COUNTRY_DATA: 7 * 24 * 60 * 60 * 1000, // 7 days
  AI_CONTENT: 30 * 24 * 60 * 60 * 1000, // 30 days
  TODAY_HOLIDAYS: 60 * 60 * 1000, // 1 hour
} as const;

// ===== SEO 관련 상수 =====

// 기본 메타데이터
export const DEFAULT_METADATA = {
  TITLE: 'Global Holidays - 전세계 공휴일 정보',
  DESCRIPTION: '전세계 주요 국가의 공휴일 정보를 한눈에 확인하세요. 여행 계획과 업무 일정에 도움이 되는 정확한 공휴일 데이터를 제공합니다.',
  KEYWORDS: ['공휴일', '휴일', '여행', '해외여행', '국가별공휴일', 'holiday', 'vacation', 'travel', 'global holidays'],
  OG_IMAGE: '/og-image.png',
  SITE_NAME: 'Global Holidays'
} as const;

// URL 패턴
export const URL_PATTERNS = {
  HOME: '/',
  COUNTRY_YEAR: '/[country]-[year]',
  REGION: '/regions/[region]/[year]',
  TODAY: '/today',
  HOLIDAY_DETAIL: '/holiday/[country]/[slug]'
} as const;

// ===== 에러 메시지 상수 =====

export const ERROR_MESSAGES = {
  API_ERROR: 'API 요청 중 오류가 발생했습니다.',
  DATA_NOT_FOUND: '요청하신 데이터를 찾을 수 없습니다.',
  INVALID_COUNTRY: '지원하지 않는 국가입니다.',
  INVALID_YEAR: '지원하지 않는 연도입니다.',
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  RATE_LIMIT_EXCEEDED: 'API 요청 한도를 초과했습니다.',
  AI_GENERATION_FAILED: 'AI 콘텐츠 생성에 실패했습니다.'
} as const;

// ===== 기본 설정 상수 =====

// 페이지네이션 설정
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
  DEFAULT_PAGE: 1
} as const;

// 검색 설정
export const SEARCH_CONFIG = {
  MIN_QUERY_LENGTH: 2,
  MAX_RESULTS: 50,
  DEBOUNCE_DELAY: 300 // milliseconds
} as const;

// 빌드 설정
export const BUILD_CONFIG = {
  STATIC_GENERATION: true,
  INCREMENTAL_REGENERATION: true,
  REVALIDATE_INTERVAL: 3600 // 1 hour in seconds
} as const;

// ===== 유틸리티 상수 =====

// 정규표현식 패턴
export const REGEX_PATTERNS = {
  COUNTRY_CODE: /^[A-Z]{2}$/,
  YEAR: /^\d{4}$/,
  DATE_ISO: /^\d{4}-\d{2}-\d{2}$/,
  SLUG: /^[a-z0-9-]+$/
} as const;

// 날짜 포맷
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'YYYY년 MM월 DD일',
  SHORT: 'MM/DD',
  LONG: 'YYYY년 MM월 DD일 (dddd)'
} as const;