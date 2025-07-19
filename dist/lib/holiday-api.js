import axios from 'axios';
/**
 * Holiday API 클라이언트 클래스
 * 외부 Holiday API와의 연동을 담당합니다.
 */
export class HolidayApiClient {
    constructor(apiKey, provider = 'calendarific') {
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1초
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
        this.axiosInstance.interceptors.request.use((config) => {
            console.log(`API 요청: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        }, (error) => {
            console.error('API 요청 에러:', error);
            return Promise.reject(error);
        });
        // 응답 인터셉터 설정
        this.axiosInstance.interceptors.response.use((response) => {
            console.log(`API 응답 성공: ${response.status} ${response.config.url}`);
            return response;
        }, (error) => {
            console.error('API 응답 에러:', error.response?.status, error.message);
            return Promise.reject(error);
        });
    }
    /**
     * 특정 국가와 연도의 공휴일 데이터를 가져옵니다.
     * @param countryCode ISO 3166-1 alpha-2 국가 코드 (예: 'US', 'KR')
     * @param year 연도 (예: 2024)
     * @returns Promise<Holiday[]> 공휴일 배열
     */
    async fetchHolidaysByCountryYear(countryCode, year) {
        try {
            console.log(`공휴일 데이터 요청: ${countryCode} ${year}`);
            const response = await this.executeWithRetry(() => this.makeApiRequest(countryCode, year));
            const normalizedData = this.normalizeApiResponse(response.data, countryCode);
            console.log(`공휴일 데이터 수신 완료: ${normalizedData.length}개`);
            return normalizedData;
        }
        catch (error) {
            console.error(`공휴일 데이터 요청 실패: ${countryCode} ${year}`, error);
            throw new Error(`Failed to fetch holidays for ${countryCode} ${year}: ${error}`);
        }
    }
    /**
     * API 요청을 실행합니다.
     * @param countryCode 국가 코드
     * @param year 연도
     * @returns Promise<AxiosResponse> API 응답
     */
    async makeApiRequest(countryCode, year) {
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
        }
        else {
            // Nager.Date API 사용 (무료, API 키 불필요)
            return await this.axiosInstance.get(`/PublicHolidays/${year}/${countryCode}`);
        }
    }
    /**
     * 재시도 로직을 포함한 API 요청 실행
     * @param apiCall API 호출 함수
     * @returns Promise<AxiosResponse> API 응답
     */
    async executeWithRetry(apiCall) {
        let lastError;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await apiCall();
            }
            catch (error) {
                lastError = error;
                console.warn(`API 요청 실패 (시도 ${attempt}/${this.maxRetries}):`, error);
                if (attempt < this.maxRetries) {
                    const delay = this.retryDelay * attempt; // 지수 백오프
                    console.log(`${delay}ms 후 재시도...`);
                    await this.sleep(delay);
                }
            }
        }
        throw lastError;
    }
    /**
     * 지정된 시간만큼 대기합니다.
     * @param ms 대기 시간 (밀리초)
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * API 응답 데이터를 내부 Holiday 형식으로 정규화합니다.
     * @param data API 응답 데이터
     * @param countryCode 국가 코드
     * @returns Holiday[] 정규화된 공휴일 배열
     */
    normalizeApiResponse(data, countryCode) {
        try {
            if (this.baseUrl.includes('calendarific.com')) {
                return this.normalizeCalendarificResponse(data, countryCode);
            }
            else {
                return this.normalizeNagerResponse(data, countryCode);
            }
        }
        catch (error) {
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
    normalizeCalendarificResponse(response, countryCode) {
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
    normalizeNagerResponse(holidays, countryCode) {
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
    mapHolidayType(apiType) {
        if (!apiType || apiType.length === 0)
            return 'optional';
        const typeStr = apiType.join(' ').toLowerCase();
        if (typeStr.includes('public') || typeStr.includes('national'))
            return 'public';
        if (typeStr.includes('bank'))
            return 'bank';
        if (typeStr.includes('school'))
            return 'school';
        return 'optional';
    }
    /**
     * API 연결 상태를 확인합니다.
     * @returns Promise<boolean> 연결 성공 여부
     */
    async testConnection() {
        try {
            // 간단한 테스트 요청 (미국 2024년 데이터)
            await this.fetchHolidaysByCountryYear('US', 2024);
            return true;
        }
        catch (error) {
            console.error('API 연결 테스트 실패:', error);
            return false;
        }
    }
}
/**
 * 기본 Holiday API 클라이언트 인스턴스를 생성합니다.
 * 환경변수에서 API 키를 읽어옵니다.
 */
export function createHolidayApiClient() {
    const apiKey = process.env.CALENDARIFIC_API_KEY;
    const provider = process.env.HOLIDAY_API_PROVIDER || 'nager';
    return new HolidayApiClient(apiKey, provider);
}
/**
 * 기본 인스턴스를 가져옵니다 (지연 초기화)
 */
let _holidayApiClient = null;
export function getHolidayApiClient() {
    if (!_holidayApiClient) {
        _holidayApiClient = createHolidayApiClient();
    }
    return _holidayApiClient;
}
