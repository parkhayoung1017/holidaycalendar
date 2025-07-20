import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Holiday, CalendarificResponse, NagerDateResponse } from '../types';
import { logApiError, logWarning, logInfo } from './error-logger';
import fs from 'fs';
import path from 'path';

/**
 * Holiday API 클라이언트 클래스
 * 외부 Holiday API와의 연동을 담당합니다.
 */
export class HolidayApiClient {
  private axiosInstance: AxiosInstance;
  private apiKey?: string;
  private baseUrl: string;
  private maxRetries: number = 3;
  private retryDelay: number = 1000; // 1초

  constructor(apiKey?: string, provider: 'calendarific' | 'nager' = 'calendarific') {
    this.apiKey = apiKey;
    
    // API 제공자에 따른 기본 URL 설정
    this.baseUrl = provider === 'calendarific' 
      ? 'https://calendarific.com/api/v2'
      : 'https://date.nager.at/api/v3';

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 10000, // 10초 타임아웃
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 요청 인터셉터 설정
    this.axiosInstance.interceptors.request.use(
      (config) => {
        console.log(`API 요청: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API 요청 에러:', error);
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터 설정
    this.axiosInstance.interceptors.response.use(
      (response) => {
        console.log(`API 응답 성공: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API 응답 에러:', error.response?.status, error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 특정 국가와 연도의 공휴일 데이터를 가져옵니다.
   * API 실패 시 캐시된 데이터를 사용합니다.
   * @param countryCode ISO 3166-1 alpha-2 국가 코드 (예: 'US', 'KR')
   * @param year 연도 (예: 2024)
   * @returns Promise<Holiday[]> 공휴일 배열
   */
  async fetchHolidaysByCountryYear(countryCode: string, year: number): Promise<Holiday[]> {
    try {
      logInfo(`공휴일 데이터 요청 시작: ${countryCode} ${year}`);
      
      const response = await this.executeWithRetry(() => 
        this.makeApiRequest(countryCode, year)
      );

      const normalizedData = this.normalizeApiResponse(response.data, countryCode);
      
      // 성공한 데이터를 캐시에 저장
      await this.saveToCacheFile(countryCode, year, normalizedData);
      
      logInfo(`공휴일 데이터 수신 완료: ${countryCode} ${year} - ${normalizedData.length}개`);
      return normalizedData;
      
    } catch (error) {
      const apiError = error as Error;
      logApiError(`fetchHolidaysByCountryYear`, apiError, { countryCode, year });
      
      // API 실패 시 캐시된 데이터 사용 시도
      logWarning(`API 실패로 캐시 데이터 사용 시도: ${countryCode} ${year}`);
      const cachedData = await this.loadFromCacheFile(countryCode, year);
      
      if (cachedData && cachedData.length > 0) {
        logInfo(`캐시 데이터 사용: ${countryCode} ${year} - ${cachedData.length}개`);
        return cachedData;
      }
      
      // 캐시 데이터도 없으면 에러 발생
      logApiError(`fetchHolidaysByCountryYear - 캐시 데이터 없음`, apiError, { countryCode, year });
      throw new Error(`Failed to fetch holidays for ${countryCode} ${year} and no cached data available: ${apiError.message}`);
    }
  }

  /**
   * API 요청을 실행합니다.
   * @param countryCode 국가 코드
   * @param year 연도
   * @returns Promise<AxiosResponse> API 응답
   */
  private async makeApiRequest(countryCode: string, year: number): Promise<AxiosResponse> {
    if (this.baseUrl.includes('calendarific.com')) {
      // Calendarific API 사용
      if (!this.apiKey) {
        throw new Error('Calendarific API key is required');
      }
      
      return await this.axiosInstance.get('/holidays', {
        params: {
          api_key: this.apiKey,
          country: countryCode,
          year: year,
          type: 'national'
        }
      });
    } else {
      // Nager.Date API 사용 (무료, API 키 불필요)
      return await this.axiosInstance.get(`/PublicHolidays/${year}/${countryCode}`);
    }
  }

  /**
   * 재시도 로직을 포함한 API 요청 실행
   * @param apiCall API 호출 함수
   * @returns Promise<AxiosResponse> API 응답
   */
  private async executeWithRetry(apiCall: () => Promise<AxiosResponse>): Promise<AxiosResponse> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        lastError = error as Error;
        console.warn(`API 요청 실패 (시도 ${attempt}/${this.maxRetries}):`, error);

        if (attempt < this.maxRetries) {
          const delay = this.retryDelay * attempt; // 지수 백오프
          console.log(`${delay}ms 후 재시도...`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * 지정된 시간만큼 대기합니다.
   * @param ms 대기 시간 (밀리초)
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * API 응답 데이터를 내부 Holiday 형식으로 정규화합니다.
   * @param data API 응답 데이터
   * @param countryCode 국가 코드
   * @returns Holiday[] 정규화된 공휴일 배열
   */
  private normalizeApiResponse(data: any, countryCode: string): Holiday[] {
    try {
      if (this.baseUrl.includes('calendarific.com')) {
        return this.normalizeCalendarificResponse(data as CalendarificResponse, countryCode);
      } else {
        return this.normalizeNagerResponse(data as NagerDateResponse, countryCode);
      }
    } catch (error) {
      console.error('API 응답 정규화 실패:', error);
      throw new Error(`Failed to normalize API response: ${error}`);
    }
  }

  /**
   * Calendarific API 응답을 정규화��니다.
   * @param response Calendarific API 응답
   * @param countryCode 국가 코드
   * @returns Holiday[] 정규화된 공휴일 배열
   */
  private normalizeCalendarificResponse(response: CalendarificResponse, countryCode: string): Holiday[] {
    if (!response.response || !response.response.holidays) {
      console.warn('Calendarific API 응답에 공휴일 데이터가 없습니다.');
      return [];
    }

    return response.response.holidays.map((holiday, index) => ({
      id: `${countryCode}-${holiday.date.iso}-${index}`,
      name: holiday.name,
      date: holiday.date.iso,
      country: holiday.country.name,
      countryCode: countryCode.toUpperCase(),
      description: holiday.description || undefined,
      type: this.mapHolidayType(holiday.type),
      global: holiday.primary_type === 'Public Holiday',
      counties: holiday.states ? holiday.states.split(', ') : undefined
    }));
  }

  /**
   * Nager.Date API 응답을 정규화합니다.
   * @param holidays Nager.Date API 응답 배열
   * @param countryCode 국가 코드
   * @returns Holiday[] 정규화된 공휴일 배열
   */
  private normalizeNagerResponse(holidays: NagerDateResponse, countryCode: string): Holiday[] {
    if (!Array.isArray(holidays)) {
      console.warn('Nager.Date API 응답이 배열이 아닙니다.');
      return [];
    }

    return holidays.map((holiday, index) => ({
      id: `${countryCode}-${holiday.date}-${index}`,
      name: holiday.name || holiday.localName,
      date: holiday.date,
      country: '', // Nager API는 국가명을 제공하지 않음
      countryCode: countryCode.toUpperCase(),
      description: undefined,
      type: holiday.global ? 'public' : 'optional',
      global: holiday.global || false,
      counties: holiday.counties || undefined
    }));
  }

  /**
   * API의 공휴일 타입을 내부 타입으로 매핑합니다.
   * @param apiType API에서 제공하는 타입
   * @returns 내부 공휴일 타입
   */
  private mapHolidayType(apiType: string[]): 'public' | 'bank' | 'school' | 'optional' {
    if (!apiType || apiType.length === 0) return 'optional';
    
    const typeStr = apiType.join(' ').toLowerCase();
    
    if (typeStr.includes('public') || typeStr.includes('national')) return 'public';
    if (typeStr.includes('bank')) return 'bank';
    if (typeStr.includes('school')) return 'school';
    
    return 'optional';
  }

  /**
   * 캐시 파일에 데이터를 저장합니다.
   * @param countryCode 국가 코드
   * @param year 연도
   * @param data 저장할 공휴일 데이터
   */
  private async saveToCacheFile(countryCode: string, year: number, data: Holiday[]): Promise<void> {
    if (typeof window !== 'undefined') return; // 브라우저에서는 실행하지 않음

    try {
      const cacheDir = path.join(process.cwd(), 'data', 'cache');
      const fileName = `holiday_${countryCode.toUpperCase()}_${year}.json`;
      const filePath = path.join(cacheDir, fileName);

      // 캐시 디렉토리 생성
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      // 메타데이터와 함께 저장
      const cacheData = {
        countryCode: countryCode.toUpperCase(),
        year,
        cachedAt: new Date().toISOString(),
        data
      };

      fs.writeFileSync(filePath, JSON.stringify(cacheData, null, 2));
      logInfo(`캐시 파일 저장 완료: ${fileName}`);
    } catch (error) {
      logApiError('saveToCacheFile', error as Error, { countryCode, year });
    }
  }

  /**
   * 캐시 파일에서 데이터를 로드합니다.
   * @param countryCode 국가 코드
   * @param year 연도
   * @returns Promise<Holiday[] | null> 캐시된 공휴일 데이터 또는 null
   */
  private async loadFromCacheFile(countryCode: string, year: number): Promise<Holiday[] | null> {
    if (typeof window !== 'undefined') return null; // 브라우저에서는 실행하지 않음

    try {
      const cacheDir = path.join(process.cwd(), 'data', 'cache');
      const fileName = `holiday_${countryCode.toUpperCase()}_${year}.json`;
      const filePath = path.join(cacheDir, fileName);

      if (!fs.existsSync(filePath)) {
        logWarning(`캐시 파일 없음: ${fileName}`);
        return null;
      }

      const fileContent = fs.readFileSync(filePath, 'utf-8');
      const cacheData = JSON.parse(fileContent);

      // 캐시 데이터 유효성 검사
      if (!cacheData.data || !Array.isArray(cacheData.data)) {
        logWarning(`캐시 데이터 형식 오류: ${fileName}`);
        return null;
      }

      // 캐시 만료 검사 (30일)
      const cachedAt = new Date(cacheData.cachedAt);
      const now = new Date();
      const daysDiff = (now.getTime() - cachedAt.getTime()) / (1000 * 60 * 60 * 24);

      if (daysDiff > 30) {
        logWarning(`캐시 데이터 만료: ${fileName} (${Math.round(daysDiff)}일 경과)`);
        return null;
      }

      logInfo(`캐시 파일 로드 완료: ${fileName} - ${cacheData.data.length}개`);
      return cacheData.data;
    } catch (error) {
      logApiError('loadFromCacheFile', error as Error, { countryCode, year });
      return null;
    }
  }

  /**
   * API 연결 상태를 확인합니다.
   * @returns Promise<boolean> 연결 성공 여부
   */
  async testConnection(): Promise<boolean> {
    try {
      // 간단한 테스트 요청 (미국 2024년 데이터)
      await this.fetchHolidaysByCountryYear('US', 2024);
      return true;
    } catch (error) {
      console.error('API 연결 테스트 실패:', error);
      return false;
    }
  }
}

/**
 * 기본 Holiday API 클라이언트 인스턴스를 생성합니다.
 * 환경변수에서 API 키를 읽어옵니다.
 */
export function createHolidayApiClient(): HolidayApiClient {
  const apiKey = process.env.CALENDARIFIC_API_KEY;
  const provider = process.env.HOLIDAY_API_PROVIDER as 'calendarific' | 'nager' || 'nager';
  
  return new HolidayApiClient(apiKey, provider);
}

/**
 * 기본 인스턴스를 가져옵니다 (지연 초기화)
 */
let _holidayApiClient: HolidayApiClient | null = null;
export function getHolidayApiClient(): HolidayApiClient {
  if (!_holidayApiClient) {
    _holidayApiClient = createHolidayApiClient();
  }
  return _holidayApiClient;
}