import { getHolidaysByDate } from '@/lib/data-loader';
import { Holiday } from '@/types';
import { SUPPORTED_COUNTRIES } from '@/lib/constants';

/**
 * 오늘의 공휴일 데이터를 업데이트하고 캐시합니다.
 */
export class TodayHolidaysUpdater {
  private static instance: TodayHolidaysUpdater;
  private cache: Map<string, { data: Holiday[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 60 * 60 * 1000; // 1시간

  private constructor() {}

  public static getInstance(): TodayHolidaysUpdater {
    if (!TodayHolidaysUpdater.instance) {
      TodayHolidaysUpdater.instance = new TodayHolidaysUpdater();
    }
    return TodayHolidaysUpdater.instance;
  }

  /**
   * 현재 날짜를 ISO 형식으로 반환
   */
  private getTodayISO(): string {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  /**
   * 오늘의 공휴일 데이터를 가져옵니다 (캐시 우선)
   */
  public async getTodayHolidays(): Promise<Holiday[]> {
    const today = this.getTodayISO();
    const cacheKey = `today-${today}`;
    
    // 캐시 확인
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log(`Using cached today holidays for ${today}`);
      return cached.data;
    }

    try {
      // 새로운 데이터 로드
      console.log(`Loading today holidays for ${today}`);
      const holidays = await getHolidaysByDate(today);
      
      // 국가 정보 보강
      const enrichedHolidays = holidays.map(holiday => {
        const countryInfo = SUPPORTED_COUNTRIES.find(c => c.code === holiday.countryCode);
        return {
          ...holiday,
          country: countryInfo?.name || holiday.country,
        };
      });

      // 캐시 업데이트
      this.cache.set(cacheKey, {
        data: enrichedHolidays,
        timestamp: Date.now()
      });

      console.log(`Found ${enrichedHolidays.length} holidays for today (${today})`);
      return enrichedHolidays;
    } catch (error) {
      console.error('Failed to load today holidays:', error);
      
      // 캐시된 데이터가 있으면 반환 (만료되었더라도)
      if (cached) {
        console.log('Returning expired cached data due to error');
        return cached.data;
      }
      
      return [];
    }
  }

  /**
   * 특정 날짜의 공휴일 데이터를 가져옵니다
   */
  public async getHolidaysForDate(date: string): Promise<Holiday[]> {
    const cacheKey = `date-${date}`;
    
    // 캐시 확인
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    try {
      const holidays = await getHolidaysByDate(date);
      
      // 국가 정보 보강
      const enrichedHolidays = holidays.map(holiday => {
        const countryInfo = SUPPORTED_COUNTRIES.find(c => c.code === holiday.countryCode);
        return {
          ...holiday,
          country: countryInfo?.name || holiday.country,
        };
      });

      // 캐시 업데이트
      this.cache.set(cacheKey, {
        data: enrichedHolidays,
        timestamp: Date.now()
      });

      return enrichedHolidays;
    } catch (error) {
      console.error(`Failed to load holidays for date ${date}:`, error);
      
      // 캐시된 데이터가 있으면 반환
      if (cached) {
        return cached.data;
      }
      
      return [];
    }
  }

  /**
   * 캐시를 수동으로 무효화합니다
   */
  public invalidateCache(date?: string): void {
    if (date) {
      this.cache.delete(`date-${date}`);
      this.cache.delete(`today-${date}`);
    } else {
      this.cache.clear();
    }
    console.log(`Cache invalidated${date ? ` for ${date}` : ' (all)'}`);
  }

  /**
   * 캐시 상태를 확인합니다
   */
  public getCacheStatus(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * 오늘의 공휴일 통계를 반환합니다
   */
  public async getTodayHolidayStats(): Promise<{
    totalHolidays: number;
    countriesCount: number;
    countries: Array<{ code: string; name: string; flag: string; holidayCount: number }>;
  }> {
    const holidays = await this.getTodayHolidays();
    
    // 국가별 공휴일 수 계산
    const countryStats = holidays.reduce((acc, holiday) => {
      const countryInfo = SUPPORTED_COUNTRIES.find(c => c.code === holiday.countryCode);
      const key = holiday.countryCode;
      
      if (!acc[key]) {
        acc[key] = {
          code: holiday.countryCode,
          name: countryInfo?.name || holiday.country,
          flag: countryInfo?.flag || '🏳️',
          holidayCount: 0
        };
      }
      acc[key].holidayCount++;
      return acc;
    }, {} as Record<string, { code: string; name: string; flag: string; holidayCount: number }>);

    const countries = Object.values(countryStats);

    return {
      totalHolidays: holidays.length,
      countriesCount: countries.length,
      countries: countries.sort((a, b) => b.holidayCount - a.holidayCount)
    };
  }
}

// 싱글톤 인스턴스 내보내기
export const todayHolidaysUpdater = TodayHolidaysUpdater.getInstance();