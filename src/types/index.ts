// ===== 핵심 데이터 모델 =====

// Holiday 모델
export interface Holiday {
  id: string;
  name: string;
  date: string; // ISO 8601 format (YYYY-MM-DD)
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2
  description?: string;
  type: 'public' | 'bank' | 'school' | 'optional';
  global: boolean;
  counties?: string[]; // 지역별 공휴일인 경우
  createdAt?: string;
  updatedAt?: string;
}

// Country 모델
export interface Country {
  code: string; // ISO 3166-1 alpha-2
  name: string;
  region: string;
  flag: string;
  popular: boolean;
  overview?: string;
  totalHolidays?: number;
  supportedYears?: number[];
  lastUpdated?: string;
}

// Region 모델
export interface Region {
  name: string;
  countries: string[];
  description?: string;
  displayOrder: number;
}

// ===== API 응답 타입 =====

// Holiday API 응답 (Calendarific 기반)
export interface CalendarificResponse {
  meta: {
    code: number;
  };
  response: {
    holidays: CalendarificHoliday[];
  };
}

export interface CalendarificHoliday {
  name: string;
  description: string;
  country: {
    id: string;
    name: string;
  };
  date: {
    iso: string;
    datetime: {
      year: number;
      month: number;
      day: number;
    };
  };
  type: string[];
  primary_type: string;
  canonical_url: string;
  urlid: string;
  locations: string;
  states: string;
}

// Nager.Date API 응답 (대안 API)
export type NagerDateResponse = NagerDateHoliday[];

export interface NagerDateHoliday {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties?: string[];
  launchYear?: number;
  types: string[];
}

// OpenAI API 응답
export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ===== 유틸리티 타입 =====

// 페이지 파라미터 타입
export interface PageParams {
  country?: string;
  year?: string;
  region?: string;
  slug?: string;
}

// 검색 관련 타입
export interface SearchParams {
  country?: string;
  year?: number;
  region?: string;
  query?: string;
}

export interface SearchResult {
  holidays: Holiday[];
  countries: Country[];
  totalCount: number;
  hasMore: boolean;
}

// 필터링 옵션
export interface FilterOptions {
  countries?: string[];
  regions?: string[];
  years?: number[];
  types?: Holiday['type'][];
  months?: number[];
}

// 정렬 옵션
export type SortOrder = 'asc' | 'desc';
export type SortBy = 'date' | 'name' | 'country';

export interface SortOptions {
  sortBy: SortBy;
  order: SortOrder;
}

// 페이지네이션
export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 에러 타입
export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
}

// 데이터 수집 관련 타입
export interface DataCollectionJob {
  id: string;
  type: 'holiday_collection' | 'ai_content_generation' | 'page_generation';
  status: 'pending' | 'running' | 'completed' | 'failed';
  countryCode?: string;
  year?: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  progress?: number;
}

export interface DataCollectionResult {
  success: boolean;
  holidaysCollected: number;
  contentGenerated: number;
  pagesGenerated: number;
  errors: string[];
  duration: number;
}

// AI 콘텐츠 생성 관련
export interface AIContentRequest {
  holidayId: string;
  holidayName: string;
  countryName: string;
  date: string;
  existingDescription?: string;
}

export interface AIContentResponse {
  holidayId: string;
  description: string;
  confidence: number;
  generatedAt: string;
}

// 메타데이터 타입
export interface PageMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
  structuredData?: any;
}

// 통계 관련 타입
export interface HolidayStats {
  totalHolidays: number;
  countriesCount: number;
  regionsCount: number;
  yearsCovered: number[];
  lastUpdated: string;
  popularCountries: Array<{
    code: string;
    name: string;
    viewCount: number;
  }>;
}

// 캐시 관련 타입
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  key: string;
}

export type CacheKey = 
  | `holiday:${string}:${number}` 
  | `country:${string}` 
  | `region:${string}:${number}`
  | `today:${string}`;

// 환경 설정 타입
export interface AppConfig {
  api: {
    holidayApiKey: string;
    holidayApiUrl: string;
    openaiApiKey: string;
    rateLimit: number;
  };
  cache: {
    ttl: number;
    maxSize: number;
  };
  build: {
    staticGeneration: boolean;
    incrementalRegeneration: boolean;
  };
}