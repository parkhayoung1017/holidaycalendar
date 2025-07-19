import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { HolidayDataCollector } from '../holiday-data-collector';
import { HolidayApiClient } from '../holiday-api';
import { Holiday } from '../../types';

// fs 모킹
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('fs')>();
  return {
    ...actual,
    promises: {
      mkdir: vi.fn(),
      writeFile: vi.fn(),
      readFile: vi.fn(),
      readdir: vi.fn(),
      access: vi.fn(),
      unlink: vi.fn()
    }
  };
});

// HolidayApiClient 모킹
vi.mock('../holiday-api', () => ({
  HolidayApiClient: vi.fn()
}));

describe('HolidayDataCollector', () => {
  let collector: HolidayDataCollector;
  let mockApiClient: vi.Mocked<HolidayApiClient>;
  let mockHolidays: Holiday[];

  beforeEach(() => {
    // 모킹된 API 클라이언트 생성
    mockApiClient = {
      fetchHolidaysByCountryYear: vi.fn(),
      testConnection: vi.fn()
    } as any;

    collector = new HolidayDataCollector(mockApiClient, 'test-data');

    // 테스트용 공휴일 데이터
    mockHolidays = [
      {
        id: 'us-2024-01-01-0',
        name: 'New Year\'s Day',
        date: '2024-01-01',
        country: 'United States',
        countryCode: 'US',
        description: 'New Year\'s Day celebration',
        type: 'public',
        global: true
      },
      {
        id: 'us-2024-07-04-0',
        name: 'Independence Day',
        date: '2024-07-04',
        country: 'United States',
        countryCode: 'US',
        description: 'Independence Day celebration',
        type: 'public',
        global: true
      }
    ];

    // fs 모킹 기본 설정
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    vi.mocked(fs.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.readdir).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('필요한 디렉토리를 생성해야 합니다', () => {
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('test-data'),
        { recursive: true }
      );
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('holidays'),
        { recursive: true }
      );
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('countries'),
        { recursive: true }
      );
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('cache'),
        { recursive: true }
      );
    });
  });

  describe('collectHolidayData', () => {
    it('API에서 데이터를 성공적으로 수집해야 합니다', async () => {
      mockApiClient.fetchHolidaysByCountryYear.mockResolvedValue(mockHolidays);

      const result = await collector.collectHolidayData('US', 2024, false);

      expect(mockApiClient.fetchHolidaysByCountryYear).toHaveBeenCalledWith('US', 2024);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('New Year\'s Day');
      expect(result[1].name).toBe('Independence Day');
      
      // 파일 저장 확인
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('us-2024.json'),
        expect.stringContaining('"totalHolidays": 2'),
        'utf-8'
      );
    });

    it('캐시된 데이터를 사용해야 합니다', async () => {
      const cachedData = JSON.stringify({
        data: mockHolidays,
        timestamp: Date.now(),
        ttl: 24 * 60 * 60 * 1000,
        key: 'holiday:US:2024'
      });

      vi.mocked(fs.readFile).mockResolvedValue(cachedData);

      const result = await collector.collectHolidayData('US', 2024, true);

      expect(mockApiClient.fetchHolidaysByCountryYear).not.toHaveBeenCalled();
      expect(result).toHaveLength(2);
    });

    it('API 실패 시 기존 파일에서 데이터를 로드해야 합니다', async () => {
      mockApiClient.fetchHolidaysByCountryYear.mockRejectedValue(new Error('API Error'));
      
      const fileData = JSON.stringify({
        countryCode: 'US',
        year: 2024,
        totalHolidays: 2,
        holidays: mockHolidays
      });

      vi.mocked(fs.readFile).mockResolvedValue(fileData);

      const result = await collector.collectHolidayData('US', 2024, false);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('New Year\'s Day');
    });

    it('API 실패하고 기존 파일도 없으면 에러를 던져야 합니다', async () => {
      mockApiClient.fetchHolidaysByCountryYear.mockRejectedValue(new Error('API Error'));
      vi.mocked(fs.readFile).mockRejectedValue(new Error('File not found'));

      await expect(collector.collectHolidayData('US', 2024, false))
        .rejects.toThrow('API Error');
    });
  });

  describe('validateAndNormalizeHolidays', () => {
    it('유효하지 않은 공휴일을 필터링해야 합니다', async () => {
      const invalidHolidays = [
        ...mockHolidays,
        { // 이름 없음
          id: 'invalid-1',
          name: '',
          date: '2024-01-01',
          country: 'US',
          countryCode: 'US',
          type: 'public',
          global: true
        } as Holiday,
        { // 잘못된 날짜
          id: 'invalid-2',
          name: 'Invalid Date Holiday',
          date: 'invalid-date',
          country: 'US',
          countryCode: 'US',
          type: 'public',
          global: true
        } as Holiday,
        { // 다른 연도
          id: 'invalid-3',
          name: 'Wrong Year Holiday',
          date: '2023-01-01',
          country: 'US',
          countryCode: 'US',
          type: 'public',
          global: true
        } as Holiday
      ];

      mockApiClient.fetchHolidaysByCountryYear.mockResolvedValue(invalidHolidays);

      const result = await collector.collectHolidayData('US', 2024, false);

      // 유효한 공휴일만 남아야 함
      expect(result).toHaveLength(2);
      expect(result.every(h => h.name && h.date && new Date(h.date).getFullYear() === 2024)).toBe(true);
    });

    it('중복 공휴일을 제거해야 합니다', async () => {
      const duplicateHolidays = [
        ...mockHolidays,
        { // 중복 공휴일
          id: 'duplicate',
          name: 'New Year\'s Day',
          date: '2024-01-01',
          country: 'US',
          countryCode: 'US',
          type: 'public',
          global: true
        } as Holiday
      ];

      mockApiClient.fetchHolidaysByCountryYear.mockResolvedValue(duplicateHolidays);

      const result = await collector.collectHolidayData('US', 2024, false);

      expect(result).toHaveLength(2); // 중복 제거되어 2개만 남음
    });

    it('공휴일을 날짜순으로 정렬해야 합니다', async () => {
      const unorderedHolidays = [mockHolidays[1], mockHolidays[0]]; // 순서 바뀜

      mockApiClient.fetchHolidaysByCountryYear.mockResolvedValue(unorderedHolidays);

      const result = await collector.collectHolidayData('US', 2024, false);

      expect(result[0].date).toBe('2024-01-01'); // 1월 1일이 먼저
      expect(result[1].date).toBe('2024-07-04'); // 7월 4일이 나중
    });
  });

  describe('collectMultipleCountries', () => {
    it('여러 국가의 데이터를 일괄 수집해야 합니다', async () => {
      mockApiClient.fetchHolidaysByCountryYear.mockResolvedValue(mockHolidays);

      const result = await collector.collectMultipleCountries(['US', 'CA', 'GB'], 2024);

      expect(mockApiClient.fetchHolidaysByCountryYear).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(true);
      expect(result.holidaysCollected).toBe(6); // 3개국 × 2개 공휴일
      expect(result.errors).toHaveLength(0);
    });

    it('일부 국가 실패 시 에러를 기록해야 합니다', async () => {
      mockApiClient.fetchHolidaysByCountryYear
        .mockResolvedValueOnce(mockHolidays) // US 성공
        .mockRejectedValueOnce(new Error('CA API Error')) // CA 실패
        .mockResolvedValueOnce(mockHolidays); // GB 성공

      const result = await collector.collectMultipleCountries(['US', 'CA', 'GB'], 2024);

      expect(result.success).toBe(false);
      expect(result.holidaysCollected).toBe(4); // 2개국 × 2개 공휴일
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('CA');
    });
  });

  describe('hasData', () => {
    it('데이터 파일이 존재하면 true를 반환해야 합니다', async () => {
      vi.mocked(fs.access).mockResolvedValue(undefined);

      const result = await collector.hasData('US', 2024);

      expect(result).toBe(true);
      expect(fs.access).toHaveBeenCalledWith(
        expect.stringContaining('us-2024.json')
      );
    });

    it('데이터 파일이 없으면 false를 반환해야 합니다', async () => {
      vi.mocked(fs.access).mockRejectedValue(new Error('File not found'));

      const result = await collector.hasData('US', 2024);

      expect(result).toBe(false);
    });
  });

  describe('getDataStatistics', () => {
    it('데이터 통계를 올바르게 계산해야 합니다', async () => {
      const mockFiles = ['us-2024.json', 'ca-2024.json', 'gb-2024.json'];
      const mockFileData = JSON.stringify({
        countryCode: 'US',
        year: 2024,
        totalHolidays: 10,
        lastUpdated: '2024-01-01T00:00:00.000Z'
      });

      vi.mocked(fs.readdir).mockResolvedValue(mockFiles as any);
      vi.mocked(fs.readFile).mockResolvedValue(mockFileData);

      const stats = await collector.getDataStatistics();

      expect(stats.totalFiles).toBe(3);
      expect(stats.totalHolidays).toBe(30); // 3개 파일 × 10개 공휴일
      expect(stats.countries).toEqual(['US', 'US', 'US']); // 모든 파일이 같은 데이터
      expect(stats.years).toEqual([2024]);
    });

    it('파일 읽기 실패 시 빈 통계를 반환해야 합니다', async () => {
      vi.mocked(fs.readdir).mockRejectedValue(new Error('Directory not found'));

      const stats = await collector.getDataStatistics();

      expect(stats.totalFiles).toBe(0);
      expect(stats.totalHolidays).toBe(0);
      expect(stats.countries).toEqual([]);
      expect(stats.years).toEqual([]);
    });
  });

  describe('clearCache', () => {
    it('캐시를 정리해야 합니다', async () => {
      const mockCacheFiles = ['cache1.json', 'cache2.json', 'other.txt'];
      vi.mocked(fs.readdir).mockResolvedValue(mockCacheFiles as any);
      vi.mocked(fs.unlink).mockResolvedValue(undefined);

      await collector.clearCache();

      expect(fs.unlink).toHaveBeenCalledTimes(2); // .json 파일만 삭제
      expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining('cache1.json'));
      expect(fs.unlink).toHaveBeenCalledWith(expect.stringContaining('cache2.json'));
    });

    it('캐시 정리 실패 시 에러를 처리해야 합니다', async () => {
      vi.mocked(fs.readdir).mockRejectedValue(new Error('Cache directory not found'));

      // 에러가 던져지지 않아야 함
      await expect(collector.clearCache()).resolves.not.toThrow();
    });
  });
});