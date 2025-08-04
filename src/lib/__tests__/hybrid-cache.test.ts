/**
 * 하이브리드 캐시 시스템 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import { 
  HybridCacheService, 
  getCachedDescription, 
  setCachedDescription,
  getCacheStatus,
  type CachedContent 
} from '../hybrid-cache';
import type { HolidayDescription } from '../../types/admin';

// Mock 데이터
const mockCachedContent: CachedContent = {
  holidayId: 'US-2025-07-04-9',
  holidayName: 'Independence Day',
  countryName: 'United States',
  locale: 'ko',
  description: '미국 독립기념일 설명...',
  confidence: 0.95,
  generatedAt: '2025-07-28T04:56:09.346Z',
  lastUsed: '2025-07-29T08:29:09.974Z'
};

const mockSupabaseData: HolidayDescription = {
  id: 'test-id',
  holiday_id: 'US-2025-07-04-9',
  holiday_name: 'Independence Day',
  country_name: 'United States',
  locale: 'ko',
  description: '미국 독립기념일 설명...',
  confidence: 0.95,
  generated_at: '2025-07-28T04:56:09.346Z',
  last_used: '2025-07-29T08:29:09.974Z',
  modified_at: '2025-07-28T04:56:09.346Z',
  modified_by: 'system',
  is_manual: false,
  ai_model: 'openai-gpt',
  created_at: '2025-07-28T04:56:09.346Z',
  updated_at: '2025-07-28T04:56:09.346Z'
};

const mockLocalCache = {
  'Independence Day-United States-ko': mockCachedContent
};

// Supabase 서비스 모킹
const mockSupabaseService = {
  getDescription: vi.fn(),
  createDescription: vi.fn(),
  updateDescription: vi.fn()
};

// 파일 시스템 모킹
vi.mock('fs/promises');

// Supabase 클라이언트 모킹
vi.mock('../supabase-client', () => ({
  SupabaseHolidayDescriptionService: vi.fn(() => mockSupabaseService)
}));

// Supabase 연결 확인 모킹
vi.mock('../supabase', () => ({
  checkSupabaseConnection: vi.fn(() => Promise.resolve(true))
}));

describe('HybridCacheService', () => {
  let hybridCache: HybridCacheService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 파일 시스템 모킹 설정
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockLocalCache));
    vi.mocked(fs.writeFile).mockResolvedValue();
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    
    // Supabase 서비스 모킹 초기화
    mockSupabaseService.getDescription.mockResolvedValue(null);
    mockSupabaseService.createDescription.mockResolvedValue(mockSupabaseData);
    mockSupabaseService.updateDescription.mockResolvedValue(mockSupabaseData);
    
    hybridCache = new HybridCacheService({
      enableSupabase: true,
      fallbackToLocal: true,
      retryAttempts: 1,
      retryDelay: 100
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getDescription', () => {
    it('Supabase에서 데이터를 성공적으로 조회해야 함', async () => {
      mockSupabaseService.getDescription.mockResolvedValue(mockSupabaseData);
      
      const result = await hybridCache.getDescription('Independence Day', 'United States', 'ko');
      
      expect(result).toEqual(mockCachedContent);
      expect(mockSupabaseService.getDescription).toHaveBeenCalledWith('Independence Day', 'United States', 'ko');
      
      const stats = hybridCache.getStats();
      expect(stats.supabaseHits).toBe(1);
      expect(stats.localHits).toBe(0);
    });

    it('Supabase 실패 시 로컬 캐시로 폴백해야 함', async () => {
      mockSupabaseService.getDescription.mockRejectedValue(new Error('Supabase connection failed'));
      
      const result = await hybridCache.getDescription('Independence Day', 'United States', 'ko');
      
      // lastUsed를 제외한 나머지 필드들을 검증
      expect(result).toMatchObject({
        holidayId: mockCachedContent.holidayId,
        holidayName: mockCachedContent.holidayName,
        countryName: mockCachedContent.countryName,
        locale: mockCachedContent.locale,
        description: mockCachedContent.description,
        confidence: mockCachedContent.confidence,
        generatedAt: mockCachedContent.generatedAt
      });
      expect(result?.lastUsed).toBeDefined();
      expect(mockSupabaseService.getDescription).toHaveBeenCalled();
      
      const stats = hybridCache.getStats();
      expect(stats.supabaseHits).toBe(0);
      expect(stats.localHits).toBe(1);
      expect(stats.errors).toBe(1);
    });

    it('Supabase와 로컬 캐시 모두에서 데이터를 찾을 수 없을 때 null을 반환해야 함', async () => {
      mockSupabaseService.getDescription.mockResolvedValue(null);
      vi.mocked(fs.readFile).mockResolvedValue('{}'); // 빈 캐시
      
      const result = await hybridCache.getDescription('Nonexistent Holiday', 'Unknown Country', 'ko');
      
      expect(result).toBeNull();
      
      const stats = hybridCache.getStats();
      expect(stats.misses).toBe(1);
    });

    it('로컬 캐시 파일이 없을 때 적절히 처리해야 함', async () => {
      mockSupabaseService.getDescription.mockResolvedValue(null);
      const error = new Error('ENOENT: no such file or directory');
      (error as any).code = 'ENOENT';
      vi.mocked(fs.readFile).mockRejectedValue(error);
      
      const result = await hybridCache.getDescription('Independence Day', 'United States', 'ko');
      
      expect(result).toBeNull();
      expect(hybridCache.getStats().misses).toBe(1);
    });
  });

  describe('setDescription', () => {
    it('Supabase와 로컬 캐시 모두에 데이터를 저장해야 함', async () => {
      mockSupabaseService.getDescription.mockResolvedValue(null); // 기존 데이터 없음
      
      await hybridCache.setDescription(mockCachedContent);
      
      expect(mockSupabaseService.createDescription).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('기존 Supabase 데이터가 있을 때 업데이트해야 함', async () => {
      mockSupabaseService.getDescription.mockResolvedValue(mockSupabaseData);
      
      await hybridCache.setDescription(mockCachedContent);
      
      expect(mockSupabaseService.updateDescription).toHaveBeenCalledWith(
        mockSupabaseData.id,
        expect.objectContaining({
          description: mockCachedContent.description,
          confidence: mockCachedContent.confidence,
          modified_by: 'hybrid_cache',
          is_manual: false
        })
      );
    });

    it('Supabase 저장 실패 시에도 로컬 캐시에는 저장해야 함', async () => {
      mockSupabaseService.getDescription.mockRejectedValue(new Error('Supabase error'));
      
      await hybridCache.setDescription(mockCachedContent);
      
      expect(fs.writeFile).toHaveBeenCalled();
      expect(hybridCache.getStats().errors).toBe(1);
    });

    it('모든 저장이 실패할 때 오류를 발생시켜야 함', async () => {
      mockSupabaseService.getDescription.mockRejectedValue(new Error('Supabase error'));
      vi.mocked(fs.writeFile).mockRejectedValue(new Error('File system error'));
      
      await expect(hybridCache.setDescription(mockCachedContent)).rejects.toThrow('모든 캐시 저장 실패');
    });
  });

  describe('getDescriptions (일괄 조회)', () => {
    it('여러 설명을 일괄 조회해야 함', async () => {
      mockSupabaseService.getDescription
        .mockResolvedValueOnce(mockSupabaseData)
        .mockResolvedValueOnce(null);
      
      // 두 번째 요청을 위한 로컬 캐시 데이터 추가
      const extendedCache = {
        ...mockLocalCache,
        'Christmas Day-United States-ko': {
          ...mockCachedContent,
          holidayName: 'Christmas Day',
          description: '크리스마스 설명...'
        }
      };
      vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(extendedCache));
      
      const requests = [
        { holidayName: 'Independence Day', countryName: 'United States', locale: 'ko' },
        { holidayName: 'Christmas Day', countryName: 'United States', locale: 'ko' }
      ];
      
      const results = await hybridCache.getDescriptions(requests);
      
      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({
        holidayId: mockCachedContent.holidayId,
        holidayName: mockCachedContent.holidayName,
        countryName: mockCachedContent.countryName,
        locale: mockCachedContent.locale,
        description: mockCachedContent.description,
        confidence: mockCachedContent.confidence,
        generatedAt: mockCachedContent.generatedAt
      });
      expect(results[1]).toMatchObject({
        holidayName: 'Christmas Day',
        countryName: 'United States',
        locale: 'ko',
        description: '크리스마스 설명...'
      });
      expect(mockSupabaseService.getDescription).toHaveBeenCalledTimes(2);
    });
  });

  describe('통계 및 상태', () => {
    it('캐시 통계를 올바르게 추적해야 함', async () => {
      // Supabase 히트
      mockSupabaseService.getDescription.mockResolvedValue(mockSupabaseData);
      await hybridCache.getDescription('Holiday1', 'Country1', 'ko');
      
      // 로컬 캐시 히트
      mockSupabaseService.getDescription.mockResolvedValue(null);
      await hybridCache.getDescription('Independence Day', 'United States', 'ko');
      
      // 미스
      vi.mocked(fs.readFile).mockResolvedValue('{}');
      await hybridCache.getDescription('Holiday2', 'Country2', 'ko');
      
      const stats = hybridCache.getStats();
      expect(stats.supabaseHits).toBe(1);
      expect(stats.localHits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    it('통계를 초기화할 수 있어야 함', async () => {
      mockSupabaseService.getDescription.mockResolvedValue(mockSupabaseData);
      await hybridCache.getDescription('Holiday1', 'Country1', 'ko');
      
      hybridCache.resetStats();
      
      const stats = hybridCache.getStats();
      expect(stats.supabaseHits).toBe(0);
      expect(stats.localHits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.errors).toBe(0);
    });

    it('로컬 캐시 통계를 조회할 수 있어야 함', async () => {
      const stats = await hybridCache.getLocalCacheStats();
      
      expect(stats.totalEntries).toBe(1);
      expect(stats.lastModified).toBe(mockCachedContent.lastUsed);
    });
  });

  describe('재시도 로직', () => {
    it('Supabase 조회 실패 시 재시도해야 함', async () => {
      const hybridCacheWithRetry = new HybridCacheService({
        retryAttempts: 3,
        retryDelay: 10
      });
      
      // Supabase 연결 상태를 true로 설정
      hybridCacheWithRetry.getStats().isSupabaseAvailable = true;
      
      mockSupabaseService.getDescription
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockSupabaseData);
      
      const result = await hybridCacheWithRetry.getDescription('Independence Day', 'United States', 'ko');
      
      expect(result).toMatchObject({
        holidayId: mockCachedContent.holidayId,
        holidayName: mockCachedContent.holidayName,
        countryName: mockCachedContent.countryName,
        locale: mockCachedContent.locale,
        description: mockCachedContent.description,
        confidence: mockCachedContent.confidence,
        generatedAt: mockCachedContent.generatedAt
      });
      expect(mockSupabaseService.getDescription).toHaveBeenCalledTimes(3);
    });

    it('모든 재시도가 실패하면 로컬 캐시로 폴백해야 함', async () => {
      const hybridCacheWithRetry = new HybridCacheService({
        retryAttempts: 2,
        retryDelay: 10
      });
      
      // Supabase 연결 상태를 true로 설정
      hybridCacheWithRetry.getStats().isSupabaseAvailable = true;
      
      mockSupabaseService.getDescription.mockRejectedValue(new Error('Persistent error'));
      
      const result = await hybridCacheWithRetry.getDescription('Independence Day', 'United States', 'ko');
      
      expect(result).toMatchObject({
        holidayId: mockCachedContent.holidayId,
        holidayName: mockCachedContent.holidayName,
        countryName: mockCachedContent.countryName,
        locale: mockCachedContent.locale,
        description: mockCachedContent.description,
        confidence: mockCachedContent.confidence,
        generatedAt: mockCachedContent.generatedAt
      });
      expect(mockSupabaseService.getDescription).toHaveBeenCalledTimes(2);
    });
  });

  describe('데이터 형식 변환', () => {
    it('Supabase 형식을 레거시 형식으로 올바르게 변환해야 함', async () => {
      mockSupabaseService.getDescription.mockResolvedValue(mockSupabaseData);
      
      const result = await hybridCache.getDescription('Independence Day', 'United States', 'ko');
      
      expect(result).toEqual({
        holidayId: mockSupabaseData.holiday_id,
        holidayName: mockSupabaseData.holiday_name,
        countryName: mockSupabaseData.country_name,
        locale: mockSupabaseData.locale,
        description: mockSupabaseData.description,
        confidence: mockSupabaseData.confidence,
        generatedAt: mockSupabaseData.generated_at,
        lastUsed: mockSupabaseData.last_used
      });
    });
  });

  describe('옵션 설정', () => {
    it('Supabase 비활성화 시 로컬 캐시만 사용해야 함', async () => {
      const localOnlyCache = new HybridCacheService({
        enableSupabase: false,
        fallbackToLocal: true
      });
      
      const result = await localOnlyCache.getDescription('Independence Day', 'United States', 'ko');
      
      expect(result).toMatchObject({
        holidayId: mockCachedContent.holidayId,
        holidayName: mockCachedContent.holidayName,
        countryName: mockCachedContent.countryName,
        locale: mockCachedContent.locale,
        description: mockCachedContent.description,
        confidence: mockCachedContent.confidence,
        generatedAt: mockCachedContent.generatedAt
      });
      expect(mockSupabaseService.getDescription).not.toHaveBeenCalled();
    });

    it('로컬 캐시 비활성화 시 Supabase만 사용해야 함', async () => {
      const supabaseOnlyCache = new HybridCacheService({
        enableSupabase: true,
        fallbackToLocal: false
      });
      
      // Supabase 연결 상태를 강제로 true로 설정
      const stats = supabaseOnlyCache.getStats();
      stats.isSupabaseAvailable = true;
      
      mockSupabaseService.getDescription.mockResolvedValue(null);
      
      const result = await supabaseOnlyCache.getDescription('Independence Day', 'United States', 'ko');
      
      expect(result).toBeNull();
      expect(mockSupabaseService.getDescription).toHaveBeenCalled();
    });
  });
});

describe('호환성 래퍼 함수들', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fs.readFile).mockResolvedValue(JSON.stringify(mockLocalCache));
    vi.mocked(fs.writeFile).mockResolvedValue();
    vi.mocked(fs.mkdir).mockResolvedValue(undefined);
    mockSupabaseService.getDescription.mockResolvedValue(null);
  });

  describe('getCachedDescription', () => {
    it('하이브리드 캐시를 통해 설명을 조회해야 함', async () => {
      const result = await getCachedDescription('Independence Day', 'United States', 'ko');
      
      expect(result).toMatchObject({
        holidayId: mockCachedContent.holidayId,
        holidayName: mockCachedContent.holidayName,
        countryName: mockCachedContent.countryName,
        locale: mockCachedContent.locale,
        description: mockCachedContent.description,
        confidence: mockCachedContent.confidence,
        generatedAt: mockCachedContent.generatedAt
      });
    });
  });

  describe('setCachedDescription', () => {
    it('하이브리드 캐시를 통해 설명을 저장해야 함', async () => {
      await setCachedDescription(
        'test-id',
        'Test Holiday',
        'Test Country',
        'ko',
        'Test description',
        0.9
      );
      
      expect(fs.writeFile).toHaveBeenCalled();
    });
  });

  describe('getCacheStatus', () => {
    it('하이브리드 캐시와 로컬 캐시 상태를 모두 반환해야 함', async () => {
      const status = await getCacheStatus();
      
      expect(status).toHaveProperty('hybrid');
      expect(status).toHaveProperty('local');
      expect(status.hybrid).toHaveProperty('supabaseHits');
      expect(status.hybrid).toHaveProperty('localHits');
      expect(status.local).toHaveProperty('totalEntries');
      expect(status.local).toHaveProperty('lastModified');
    });
  });
});

describe('로컬 캐시 TTL', () => {
  it('캐시 TTL이 만료되면 파일을 다시 로드해야 함', async () => {
    const shortTtlCache = new HybridCacheService({
      enableSupabase: false,
      cacheTimeout: 10 // 10ms TTL
    });
    
    // 첫 번째 조회
    await shortTtlCache.getDescription('Independence Day', 'United States', 'ko');
    expect(fs.readFile).toHaveBeenCalledTimes(1);
    
    // TTL 만료 대기
    await new Promise(resolve => setTimeout(resolve, 15));
    
    // 두 번째 조회 - 파일을 다시 로드해야 함
    await shortTtlCache.getDescription('Independence Day', 'United States', 'ko');
    expect(fs.readFile).toHaveBeenCalledTimes(2);
  });
});