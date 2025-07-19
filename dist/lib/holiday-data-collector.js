import { promises as fs } from 'fs';
import path from 'path';
/**
 * 공휴일 데이터 수집 및 관리 클래스
 * API에서 데이터를 수집하고 로컬 파일 시스템에 저장합니다.
 */
export class HolidayDataCollector {
    constructor(apiClient, dataDir = 'data') {
        this.cache = new Map();
        this.cacheTTL = 24 * 60 * 60 * 1000; // 24시간
        this.apiClient = apiClient;
        this.dataDir = path.resolve(process.cwd(), dataDir);
        this.cacheDir = path.join(this.dataDir, 'cache');
        this.initializeDirectories();
    }
    /**
     * 필요한 디렉토리를 초기화합니다.
     */
    async initializeDirectories() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            await fs.mkdir(path.join(this.dataDir, 'holidays'), { recursive: true });
            await fs.mkdir(path.join(this.dataDir, 'countries'), { recursive: true });
            await fs.mkdir(this.cacheDir, { recursive: true });
            console.log('데이터 디렉토리 초기화 완료');
        }
        catch (error) {
            console.error('디렉토리 초기화 실패:', error);
            throw error;
        }
    }
    /**
     * 특정 국가와 연도의 공휴일 데이터를 수집합니다.
     * @param countryCode 국가 코드
     * @param year 연도
     * @param useCache 캐시 사용 여부
     * @returns Promise<Holiday[]> 수집된 공휴일 데이터
     */
    async collectHolidayData(countryCode, year, useCache = true) {
        const cacheKey = `holiday:${countryCode}:${year}`;
        try {
            // 캐시 확인
            if (useCache) {
                const cachedData = await this.getCachedData(cacheKey);
                if (cachedData) {
                    console.log(`캐시에서 데이터 로드: ${countryCode} ${year}`);
                    return cachedData;
                }
            }
            console.log(`API에서 데이터 수집 시작: ${countryCode} ${year}`);
            // API에서 데이터 수집
            const holidays = await this.apiClient.fetchHolidaysByCountryYear(countryCode, year);
            // 데이터 검증 및 정규화
            const validatedHolidays = this.validateAndNormalizeHolidays(holidays, countryCode, year);
            // 파일로 저장
            await this.saveHolidaysToFile(countryCode, year, validatedHolidays);
            // 캐시에 저장
            await this.setCachedData(cacheKey, validatedHolidays);
            console.log(`데이터 수집 완료: ${countryCode} ${year} (${validatedHolidays.length}개)`);
            return validatedHolidays;
        }
        catch (error) {
            console.error(`데이터 수집 실패: ${countryCode} ${year}`, error);
            // 실패 시 기존 파일에서 데이터 로드 시도
            const fallbackData = await this.loadHolidaysFromFile(countryCode, year);
            if (fallbackData.length > 0) {
                console.log(`기존 파일에서 데이터 로드: ${countryCode} ${year} (${fallbackData.length}개)`);
                return fallbackData;
            }
            throw error;
        }
    }
    /**
     * 여러 국가의 특정 연도 데이터를 일괄 수집합니다.
     * @param countryCodes 국가 코드 배열
     * @param year 연도
     * @returns Promise<DataCollectionResult> 수집 결과
     */
    async collectMultipleCountries(countryCodes, year) {
        const startTime = Date.now();
        const result = {
            success: true,
            holidaysCollected: 0,
            contentGenerated: 0,
            pagesGenerated: 0,
            errors: [],
            duration: 0
        };
        console.log(`일괄 데이터 수집 시작: ${countryCodes.length}개 국가, ${year}년`);
        for (const countryCode of countryCodes) {
            try {
                const holidays = await this.collectHolidayData(countryCode, year);
                result.holidaysCollected += holidays.length;
                // 요청 간 지연 (API 레이트 리밋 방지)
                await this.sleep(500);
            }
            catch (error) {
                const errorMsg = `${countryCode}: ${error}`;
                result.errors.push(errorMsg);
                console.error(errorMsg);
            }
        }
        result.duration = Date.now() - startTime;
        result.success = result.errors.length === 0;
        console.log(`일괄 수집 완료: ${result.holidaysCollected}개 공휴일, ${result.errors.length}개 에러`);
        return result;
    }
    /**
     * 공휴일 데이터를 검증하고 정규화합니다.
     * @param holidays 원본 공휴일 데이터
     * @param countryCode 국가 코드
     * @param year 연도
     * @returns Holiday[] 검증된 공휴일 데이터
     */
    validateAndNormalizeHolidays(holidays, countryCode, year) {
        const validHolidays = [];
        const seenDates = new Set();
        for (const holiday of holidays) {
            try {
                // 필수 필드 검증
                if (!holiday.name || !holiday.date) {
                    console.warn(`필수 필드 누락: ${JSON.stringify(holiday)}`);
                    continue;
                }
                // 날짜 형식 검증
                const date = new Date(holiday.date);
                if (isNaN(date.getTime())) {
                    console.warn(`잘못된 날짜 형식: ${holiday.date}`);
                    continue;
                }
                // 연도 일치 검증
                if (date.getFullYear() !== year) {
                    console.warn(`연도 불일치: ${holiday.date} (예상: ${year})`);
                    continue;
                }
                // 중복 제거 (같은 날짜의 같은 이름 공휴일)
                const duplicateKey = `${holiday.date}-${holiday.name}`;
                if (seenDates.has(duplicateKey)) {
                    console.warn(`중복 공휴일 제거: ${duplicateKey}`);
                    continue;
                }
                seenDates.add(duplicateKey);
                // 정규화된 공휴일 객체 생성
                const normalizedHoliday = {
                    ...holiday,
                    id: holiday.id || `${countryCode}-${holiday.date}-${validHolidays.length}`,
                    countryCode: countryCode.toUpperCase(),
                    date: holiday.date,
                    name: holiday.name.trim(),
                    description: holiday.description?.trim() || undefined,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                validHolidays.push(normalizedHoliday);
            }
            catch (error) {
                console.error(`공휴일 검증 실패: ${JSON.stringify(holiday)}`, error);
            }
        }
        // 날짜순 정렬
        validHolidays.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        console.log(`데이터 검증 완료: ${holidays.length} → ${validHolidays.length}`);
        return validHolidays;
    }
    /**
     * 공휴일 데이터를 파일에 저장합니다.
     * @param countryCode 국가 코드
     * @param year 연도
     * @param holidays 공휴일 데이터
     */
    async saveHolidaysToFile(countryCode, year, holidays) {
        try {
            const fileName = `${countryCode.toLowerCase()}-${year}.json`;
            const filePath = path.join(this.dataDir, 'holidays', fileName);
            const data = {
                countryCode: countryCode.toUpperCase(),
                year,
                totalHolidays: holidays.length,
                lastUpdated: new Date().toISOString(),
                holidays
            };
            await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
            console.log(`파일 저장 완료: ${fileName}`);
        }
        catch (error) {
            console.error(`파일 저장 실패: ${countryCode} ${year}`, error);
            throw error;
        }
    }
    /**
     * 파일에서 공휴일 데이터를 로드합니다.
     * @param countryCode 국가 코드
     * @param year 연도
     * @returns Promise<Holiday[]> 로드된 공휴일 데이터
     */
    async loadHolidaysFromFile(countryCode, year) {
        try {
            const fileName = `${countryCode.toLowerCase()}-${year}.json`;
            const filePath = path.join(this.dataDir, 'holidays', fileName);
            const fileContent = await fs.readFile(filePath, 'utf-8');
            const data = JSON.parse(fileContent);
            return data.holidays || [];
        }
        catch (error) {
            console.warn(`파일 로드 실패: ${countryCode} ${year}`, error);
            return [];
        }
    }
    /**
     * 캐시에서 데이터를 가져옵니다.
     * @param key 캐시 키
     * @returns Promise<T | null> 캐시된 데이터 또는 null
     */
    async getCachedData(key) {
        try {
            // 메모리 캐시 확인
            const memoryCache = this.cache.get(key);
            if (memoryCache && Date.now() - memoryCache.timestamp < memoryCache.ttl) {
                return memoryCache.data;
            }
            // 파일 캐시 확인
            const cacheFilePath = path.join(this.cacheDir, `${key.replace(/:/g, '_')}.json`);
            const cacheContent = await fs.readFile(cacheFilePath, 'utf-8');
            const cacheEntry = JSON.parse(cacheContent);
            if (Date.now() - cacheEntry.timestamp < cacheEntry.ttl) {
                // 메모리 캐시에도 저장
                this.cache.set(key, cacheEntry);
                return cacheEntry.data;
            }
            return null;
        }
        catch (error) {
            return null;
        }
    }
    /**
     * 데이터를 캐시에 저장합니다.
     * @param key 캐시 키
     * @param data 저장할 데이터
     */
    async setCachedData(key, data) {
        try {
            const cacheEntry = {
                data,
                timestamp: Date.now(),
                ttl: this.cacheTTL,
                key
            };
            // 메모리 캐시에 저장
            this.cache.set(key, cacheEntry);
            // 파일 캐시에 저장
            const cacheFilePath = path.join(this.cacheDir, `${key.replace(/:/g, '_')}.json`);
            await fs.writeFile(cacheFilePath, JSON.stringify(cacheEntry, null, 2), 'utf-8');
        }
        catch (error) {
            console.error('캐시 저장 실패:', error);
        }
    }
    /**
     * 지정된 시간만큼 대기합니다.
     * @param ms 대기 시간 (밀리초)
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * 캐시를 정리합니다.
     */
    async clearCache() {
        try {
            this.cache.clear();
            const cacheFiles = await fs.readdir(this.cacheDir);
            for (const file of cacheFiles) {
                if (file.endsWith('.json')) {
                    await fs.unlink(path.join(this.cacheDir, file));
                }
            }
            console.log('캐시 정리 완료');
        }
        catch (error) {
            console.error('캐시 정리 실패:', error);
        }
    }
    /**
     * 데이터 수집 작업의 상태를 확인합니다.
     * @param countryCode 국가 코드
     * @param year 연도
     * @returns Promise<boolean> 데이터 존재 여부
     */
    async hasData(countryCode, year) {
        try {
            const fileName = `${countryCode.toLowerCase()}-${year}.json`;
            const filePath = path.join(this.dataDir, 'holidays', fileName);
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * 수집된 모든 데이터의 통계를 반환합니다.
     */
    async getDataStatistics() {
        try {
            const holidaysDir = path.join(this.dataDir, 'holidays');
            const files = await fs.readdir(holidaysDir);
            let totalHolidays = 0;
            const countries = new Set();
            const years = new Set();
            let lastUpdated = '';
            for (const file of files) {
                if (file.endsWith('.json')) {
                    try {
                        const filePath = path.join(holidaysDir, file);
                        const content = await fs.readFile(filePath, 'utf-8');
                        const data = JSON.parse(content);
                        totalHolidays += data.totalHolidays || 0;
                        countries.add(data.countryCode);
                        years.add(data.year);
                        if (data.lastUpdated > lastUpdated) {
                            lastUpdated = data.lastUpdated;
                        }
                    }
                    catch (error) {
                        console.warn(`파일 읽기 실패: ${file}`, error);
                    }
                }
            }
            return {
                totalFiles: files.length,
                totalHolidays,
                countries: Array.from(countries).sort(),
                years: Array.from(years).sort(),
                lastUpdated
            };
        }
        catch (error) {
            console.error('통계 생성 실패:', error);
            return {
                totalFiles: 0,
                totalHolidays: 0,
                countries: [],
                years: [],
                lastUpdated: ''
            };
        }
    }
}
/**
 * 기본 데이터 수집기 인스턴스를 생성합니다.
 */
export function createHolidayDataCollector(apiClient) {
    return new HolidayDataCollector(apiClient);
}
