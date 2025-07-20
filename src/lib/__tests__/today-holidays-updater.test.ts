import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TodayHolidaysUpdater } from '../today-holidays-updater';
import { Holiday } from '@/types';

// Mock dependencies
vi.mock('../data-loader', () => ({
  getHolidaysByDate: vi.fn()
}));

vi.mock('../constants', () => ({
  SUPPORTED_COUNTRIES: [
    { code: 'US', name: 'United States', flag: '🇺🇸' },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷' },
    { code: 'JP', name: 'Japan', flag: '🇯🇵' }
  ]
}));

describe('TodayHolidaysUpdater', () => {
  let updater: TodayHolidaysUpdater;
  
  beforeEach(async () => {
    // Mock 초기화
    vi.clearAllMocks();
    
    // 새로운 인스턴스를 위해 캐시 클리어
    updater = TodayHolidaysUpdater.getInstance();
    updater.invalidateCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getTodayHolidays', () => {
    it('오늘의 공휴일을 정상적으로 가져와야 함', async () => {
      const mockHolidays: Holiday[] = [
        {
          id: '1',
          name: 'New Year Day',
          date: '2025-01-01',
          country: 'United States',
          countryCode: 'US',
          type: 'public',
          global: true
        },
        {
          id: '2',
          name: '신정',
          date: '2025-01-01',
          country: 'South Korea',
          countryCode: 'KR',
          type: 'public',
          global: true
        }
      ];

      const { getHolidaysByDate } = await import('../data-loader');
      vi.mocked(getHolidaysByDate).mockResolvedValue(mockHolidays);

      const result = await updater.getTodayHolidays();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('New Year Day');
      expect(result[1].name).toBe('신정');
    });

    it('공휴일이 없는 경우 빈 배열을 반환해야 함', async () => {
      const { getHolidaysByDate } = await import('../data-loader');
      vi.mocked(getHolidaysByDate).mockResolvedValue([]);

      const result = await updater.getTodayHolidays();

      expect(result).toHaveLength(0);
    });

    it('에러 발생 시 빈 배열을 반환해야 함', async () => {
      const { getHolidaysByDate } = await import('../data-loader');
      vi.mocked(getHolidaysByDate).mockRejectedValue(new Error('API Error'));

      const result = await updater.getTodayHolidays();

      expect(result).toHaveLength(0);
    });
  });

  describe('getTodayHolidayStats', () => {
    it('오늘의 공휴일 통계를 정상적으로 계산해야 함', async () => {
      const mockHolidays: Holiday[] = [
        {
          id: '1',
          name: 'New Year Day',
          date: '2025-01-01',
          country: 'United States',
          countryCode: 'US',
          type: 'public',
          global: true
        },
        {
          id: '2',
          name: 'Another Holiday',
          date: '2025-01-01',
          country: 'United States',
          countryCode: 'US',
          type: 'public',
          global: true
        },
        {
          id: '3',
          name: '신정',
          date: '2025-01-01',
          country: 'South Korea',
          countryCode: 'KR',
          type: 'public',
          global: true
        }
      ];

      const { getHolidaysByDate } = await import('../data-loader');
      vi.mocked(getHolidaysByDate).mockResolvedValue(mockHolidays);

      const stats = await updater.getTodayHolidayStats();

      expect(stats.totalHolidays).toBe(3);
      expect(stats.countriesCount).toBe(2);
      expect(stats.countries).toHaveLength(2);
      
      // 미국이 공휴일이 더 많으므로 첫 번째에 와야 함
      expect(stats.countries[0].code).toBe('US');
      expect(stats.countries[0].holidayCount).toBe(2);
      expect(stats.countries[1].code).toBe('KR');
      expect(stats.countries[1].holidayCount).toBe(1);
    });
  });

  describe('캐시 기능', () => {
    it('캐시 상태를 정상적으로 반환해야 함', async () => {
      const { getHolidaysByDate } = await import('../data-loader');
      vi.mocked(getHolidaysByDate).mockResolvedValue([]);

      // 캐시에 데이터 추가
      await updater.getTodayHolidays();

      const status = updater.getCacheStatus();

      expect(status.size).toBeGreaterThan(0);
      expect(status.keys.length).toBeGreaterThan(0);
      expect(status.keys.some(key => key.startsWith('today-'))).toBe(true);
    });

    it('캐시 무효화가 정상적으로 작동해야 함', async () => {
      const { getHolidaysByDate } = await import('../data-loader');
      vi.mocked(getHolidaysByDate).mockResolvedValue([]);

      // 데이터 로드하여 캐시 생성
      await updater.getTodayHolidays();
      
      // 캐시가 있는지 확인
      let status = updater.getCacheStatus();
      expect(status.size).toBeGreaterThan(0);
      
      // 캐시 무효화
      updater.invalidateCache();
      
      // 캐시가 비워졌는지 확인
      status = updater.getCacheStatus();
      expect(status.size).toBe(0);
    });
  });
});