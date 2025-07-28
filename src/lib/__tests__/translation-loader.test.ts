import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadTranslation, loadTranslations, clearTranslationCache, getCacheInfo } from '../translation-loader';

// 모듈 모킹
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
    menu: { home: '홈' }
  }
}));

vi.mock('@/locales/en/navigation.json', () => ({
  default: {
    menu: { home: 'Home' }
  }
}));

describe('translation-loader', () => {
  beforeEach(() => {
    // 각 테스트 전에 캐시 클리어
    clearTranslationCache();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('loadTranslation', () => {
    it('한국어 번역 파일을 올바르게 로드한다', async () => {
      const result = await loadTranslation('ko', 'common');
      
      expect(result).toEqual({
        site: { title: '세계 공휴일 달력' },
        actions: { search: '검색' }
      });
    });

    it('영어 번역 파일을 올바르게 로드한다', async () => {
      const result = await loadTranslation('en', 'common');
      
      expect(result).toEqual({
        site: { title: 'World Holiday Calendar' },
        actions: { search: 'Search' }
      });
    });

    it('번역 데이터를 캐시한다', async () => {
      // 첫 번째 로드
      await loadTranslation('ko', 'common');
      
      const cacheInfo = getCacheInfo();
      expect(cacheInfo.keys).toContain('ko-common');
      expect(cacheInfo.size).toBeGreaterThan(0);
      
      // 두 번째 로드 (캐시에서)
      const result = await loadTranslation('ko', 'common');
      expect(result.site.title).toBe('세계 공휴일 달력');
    });

    it('존재하지 않는 파일에 대해 fallback을 시도한다', async () => {
      // 존재하지 않는 네임스페이스로 테스트
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const result = await loadTranslation('en', 'nonexistent' as any);
      
      expect(consoleSpy).toHaveBeenCalled();
      expect(result).toEqual({});
      
      consoleSpy.mockRestore();
    });
  });

  describe('loadTranslations', () => {
    it('여러 네임스페이스를 동시에 로드한다', async () => {
      const result = await loadTranslations('ko', ['common', 'navigation']);
      
      expect(result.common).toEqual({
        site: { title: '세계 공휴일 달력' },
        actions: { search: '검색' }
      });
      expect(result.navigation).toEqual({
        menu: { home: '홈' }
      });
    });

    it('기본 네임스페이스들을 로드한다', async () => {
      const result = await loadTranslations('ko');
      
      expect(result).toHaveProperty('common');
      expect(result).toHaveProperty('navigation');
    });
  });

  describe('clearTranslationCache', () => {
    it('전체 캐시를 클리어한다', async () => {
      // 캐시에 데이터 추가
      await loadTranslation('ko', 'common');
      await loadTranslation('en', 'common');
      
      expect(getCacheInfo().size).toBeGreaterThan(0);
      
      // 전체 캐시 클리어
      clearTranslationCache();
      
      expect(getCacheInfo().size).toBe(0);
    });

    it('특정 언어의 캐시만 클리어한다', async () => {
      // 캐시에 데이터 추가
      await loadTranslation('ko', 'common');
      await loadTranslation('en', 'common');
      
      expect(getCacheInfo().size).toBe(2);
      
      // 한국어 캐시만 클리어
      clearTranslationCache('ko');
      
      const cacheInfo = getCacheInfo();
      expect(cacheInfo.size).toBe(1);
      expect(cacheInfo.keys).toContain('en-common');
      expect(cacheInfo.keys).not.toContain('ko-common');
    });

    it('특정 언어의 특정 네임스페이스만 클리어한다', async () => {
      // 캐시에 데이터 추가
      await loadTranslation('ko', 'common');
      await loadTranslation('ko', 'navigation');
      
      expect(getCacheInfo().size).toBe(2);
      
      // 특정 네임스페이스만 클리어
      clearTranslationCache('ko', 'common');
      
      const cacheInfo = getCacheInfo();
      expect(cacheInfo.size).toBe(1);
      expect(cacheInfo.keys).toContain('ko-navigation');
      expect(cacheInfo.keys).not.toContain('ko-common');
    });
  });

  describe('getCacheInfo', () => {
    it('캐시 정보를 올바르게 반환한다', async () => {
      const initialInfo = getCacheInfo();
      expect(initialInfo.size).toBe(0);
      expect(initialInfo.keys).toEqual([]);
      
      await loadTranslation('ko', 'common');
      
      const afterLoadInfo = getCacheInfo();
      expect(afterLoadInfo.size).toBe(1);
      expect(afterLoadInfo.keys).toContain('ko-common');
    });
  });
});