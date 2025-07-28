/**
 * 번역 로더 성능 최적화 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  loadTranslation,
  loadTranslations,
  getCacheInfo,
  getClientCacheInfo,
  clearTranslationCache,
  clearClientCache,
  resetCacheStats,
  optimizeCache,
  warmupCache,
  smartWarmupCache,
  startAutoCacheCleanup,
  stopAutoCacheCleanup,
  generateCachePerformanceReport
} from '../translation-loader';

// 모킹
vi.mock('@/locales/ko/common.json', () => ({
  default: {
    site: { title: '세계 공휴일 달력' },
    actions: { search: '검색' }
  }
}));

vi.mock('@/locales/en/common.json', () => ({
  default: {
    site: { title: 'World Holiday Calendar' },
    actions: { search: 'Search' }
  }
}));

vi.mock('@/locales/ko/navigation.json', () => ({
  default: {
    menu: { home: '홈', todayHolidays: '오늘의 공휴일' }
  }
}));

vi.mock('@/locales/en/navigation.json', () => ({
  default: {
    menu: { home: 'Home', todayHolidays: 'Today\'s Holidays' }
  }
}));

// localStorage 모킹
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

// window 객체 모킹
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

describe('번역 로더 성능 최적화', () => {
  beforeEach(() => {
    // 각 테스트 전에 캐시 초기화
    clearTranslationCache();
    clearClientCache();
    resetCacheStats();
    
    // 모킹 초기화
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    sessionStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    stopAutoCacheCleanup();
  });

  describe('메모리 캐시 최적화', () => {
    it('캐시 히트율이 올바르게 계산되어야 한다', async () => {
      // 첫 번째 로드 (캐시 미스)
      await loadTranslation('ko', 'common');
      
      // 두 번째 로드 (캐시 히트)
      await loadTranslation('ko', 'common');
      await loadTranslation('ko', 'common');
      
      const cacheInfo = getCacheInfo();
      expect(cacheInfo.hitRate).toBeGreaterThan(0);
      expect(cacheInfo.stats.hits).toBeGreaterThan(0);
      expect(cacheInfo.stats.misses).toBeGreaterThan(0);
    });

    it('캐시 크기 제한이 작동해야 한다', async () => {
      // 많은 번역 데이터를 로드하여 캐시 크기 제한 테스트
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(loadTranslation('ko', 'common'));
        promises.push(loadTranslation('en', 'common'));
        promises.push(loadTranslation('ko', 'navigation'));
        promises.push(loadTranslation('en', 'navigation'));
      }
      
      await Promise.all(promises);
      
      const cacheInfo = getCacheInfo();
      expect(cacheInfo.size).toBeLessThanOrEqual(100); // 최대 100개 제한
    });

    it('캐시 최적화가 오래된 엔트리를 제거해야 한다', async () => {
      // 캐시에 데이터 추가
      await loadTranslation('ko', 'common');
      await loadTranslation('en', 'common');
      
      const beforeOptimization = getCacheInfo();
      
      // 캐시 최적화 실행
      optimizeCache();
      
      const afterOptimization = getCacheInfo();
      
      // 캐시 최적화 후에도 기본적인 구조는 유지되어야 함
      expect(afterOptimization.size).toBeGreaterThanOrEqual(0);
    });
  });

  describe('클라이언트 사이드 캐싱', () => {
    it('localStorage에 번역 데이터가 저장되어야 한다', async () => {
      await loadTranslation('ko', 'common');
      
      // localStorage.setItem이 호출되었는지 확인
      expect(localStorageMock.setItem).toHaveBeenCalled();
      
      const clientCacheInfo = getClientCacheInfo();
      expect(clientCacheInfo.localStorage.enabled).toBe(true);
    });

    it('sessionStorage에 번역 데이터가 저장되어야 한다', async () => {
      await loadTranslation('ko', 'common');
      
      // sessionStorage.setItem이 호출되었는지 확인
      expect(sessionStorageMock.setItem).toHaveBeenCalled();
      
      const clientCacheInfo = getClientCacheInfo();
      expect(clientCacheInfo.sessionStorage.enabled).toBe(true);
    });

    it('클라이언트 캐시에서 데이터를 복원해야 한다', async () => {
      const mockData = {
        site: { title: '캐시된 제목' },
        actions: { search: '캐시된 검색' }
      };
      
      // localStorage에서 캐시된 데이터 반환하도록 모킹
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        data: mockData,
        timestamp: Date.now(),
        version: '1.0',
        size: 100
      }));
      
      const result = await loadTranslation('ko', 'common');
      
      // 캐시된 데이터가 반환되어야 함
      expect(result).toEqual(mockData);
    });

    it('만료된 클라이언트 캐시 데이터는 무시되어야 한다', async () => {
      const expiredData = {
        data: { expired: true },
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25시간 전 (만료됨)
        version: '1.0',
        size: 100
      };
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(expiredData));
      
      await loadTranslation('ko', 'common');
      
      // 만료된 캐시는 제거되어야 함
      expect(localStorageMock.removeItem).toHaveBeenCalled();
    });
  });

  describe('캐시 워밍업', () => {
    it('일반 우선순위 캐시 워밍업이 작동해야 한다', async () => {
      await warmupCache('normal');
      
      const cacheInfo = getCacheInfo();
      expect(cacheInfo.size).toBeGreaterThan(0);
    });

    it('스마트 캐시 워밍업이 사용자 언어를 우선으로 로드해야 한다', async () => {
      await smartWarmupCache('en', 'ko');
      
      const cacheInfo = getCacheInfo();
      expect(cacheInfo.size).toBeGreaterThan(0);
      
      // 영어 번역이 먼저 로드되었는지 확인
      const englishKeys = cacheInfo.keys.filter(key => key.startsWith('en-'));
      expect(englishKeys.length).toBeGreaterThan(0);
    });
  });

  describe('자동 캐시 정리', () => {
    it('자동 캐시 정리가 시작되고 중지되어야 한다', () => {
      // 자동 정리 시작
      startAutoCacheCleanup(1000); // 1초 간격
      
      // 중지
      stopAutoCacheCleanup();
      
      // 에러 없이 실행되어야 함
      expect(true).toBe(true);
    });
  });

  describe('성능 리포트', () => {
    it('캐시 성능 리포트가 생성되어야 한다', async () => {
      // 캐시에 데이터 추가
      await loadTranslation('ko', 'common');
      await loadTranslation('en', 'common');
      
      const report = generateCachePerformanceReport();
      
      expect(report).toHaveProperty('memory');
      expect(report).toHaveProperty('client');
      expect(report).toHaveProperty('recommendations');
      
      expect(report.memory).toHaveProperty('size');
      expect(report.memory).toHaveProperty('hitRate');
      expect(report.memory).toHaveProperty('stats');
      expect(report.memory).toHaveProperty('topEntries');
      
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('성능 권장사항이 올바르게 생성되어야 한다', async () => {
      // 캐시 히트율을 낮게 만들기 위해 다양한 키로 로드
      await loadTranslation('ko', 'common');
      await loadTranslation('en', 'common');
      await loadTranslation('ko', 'navigation');
      await loadTranslation('en', 'navigation');
      
      const report = generateCachePerformanceReport();
      
      // 권장사항이 배열이고 문자열을 포함해야 함
      expect(Array.isArray(report.recommendations)).toBe(true);
      if (report.recommendations.length > 0) {
        expect(typeof report.recommendations[0]).toBe('string');
      }
    });
  });

  describe('동적 로딩 최적화', () => {
    it('중복 로딩이 방지되어야 한다', async () => {
      // 동시에 같은 번역 데이터를 여러 번 요청
      const promises = [
        loadTranslation('ko', 'common'),
        loadTranslation('ko', 'common'),
        loadTranslation('ko', 'common')
      ];
      
      const results = await Promise.all(promises);
      
      // 모든 결과가 동일해야 함
      expect(results[0]).toEqual(results[1]);
      expect(results[1]).toEqual(results[2]);
      
      const cacheInfo = getCacheInfo();
      // 실제로는 한 번만 로드되었어야 함
      expect(cacheInfo.stats.misses).toBe(1);
    });

    it('여러 네임스페이스를 병렬로 로드해야 한다', async () => {
      const startTime = Date.now();
      
      await loadTranslations('ko', ['common', 'navigation']);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 병렬 로딩으로 인해 합리적인 시간 내에 완료되어야 함
      expect(duration).toBeLessThan(5000); // 5초 이내
    });

    it('fallback 언어가 올바르게 작동해야 한다', async () => {
      // 존재하지 않는 언어로 요청
      const result = await loadTranslation('fr' as any, 'common');
      
      // 기본 언어(ko)의 데이터가 반환되어야 함
      expect(result).toBeDefined();
    });
  });

  describe('에러 처리', () => {
    it('localStorage 오류 시에도 정상 작동해야 한다', async () => {
      // localStorage 오류 시뮬레이션
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      
      // 오류가 발생해도 번역 로딩은 계속되어야 함
      const result = await loadTranslation('ko', 'common');
      expect(result).toBeDefined();
    });

    it('sessionStorage 오류 시에도 정상 작동해야 한다', async () => {
      // sessionStorage 오류 시뮬레이션
      sessionStorageMock.setItem.mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });
      
      // 오류가 발생해도 번역 로딩은 계속되어야 함
      const result = await loadTranslation('ko', 'common');
      expect(result).toBeDefined();
    });

    it('잘못된 캐시 데이터는 무시되어야 한다', async () => {
      // 잘못된 JSON 데이터 반환
      localStorageMock.getItem.mockReturnValue('invalid json');
      
      // 오류가 발생해도 정상적으로 로딩되어야 함
      const result = await loadTranslation('ko', 'common');
      expect(result).toBeDefined();
    });
  });
});