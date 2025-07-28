import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { useTranslation, useCommonTranslation, createTranslationFunction } from '../useTranslation';
import { I18nProvider } from '@/lib/i18n-context';

// 테스트용 번역 데이터
const mockTranslations = {
  common: {
    site: {
      title: '세계 공휴일 달력',
      welcome: '환영합니다, {{name}}님!'
    },
    actions: {
      search: '검색',
      loading: '로딩 중...'
    },
    items: {
      zero: '항목이 없습니다',
      one: '{{count}}개 항목',
      other: '{{count}}개 항목들'
    }
  },
  navigation: {
    menu: {
      home: '홈',
      about: '소개'
    }
  }
};

// I18nProvider 모킹
vi.mock('@/lib/i18n-context', () => ({
  useI18nContext: () => ({
    locale: 'ko',
    translations: mockTranslations,
    isLoading: false
  }),
  I18nProvider: ({ children }: { children: ReactNode }) => children
}));

describe('useTranslation', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nProvider>{children}</I18nProvider>
  );

  describe('기본 번역 기능', () => {
    it('번역 키를 올바르게 번역한다', () => {
      const { result } = renderHook(() => useTranslation(), { wrapper });
      
      expect(result.current.t('common.site.title')).toBe('세계 공휴일 달력');
      expect(result.current.t('common.actions.search')).toBe('검색');
    });

    it('파라미터와 함께 번역한다', () => {
      const { result } = renderHook(() => useTranslation(), { wrapper });
      
      const translated = result.current.t('common.site.welcome', { name: '홍길동' });
      expect(translated).toBe('환영합니다, 홍길동님!');
    });

    it('존재하지 않는 키에 대해 키 자체를 반환한다', () => {
      const { result } = renderHook(() => useTranslation(), { wrapper });
      
      expect(result.current.t('nonexistent.key')).toBe('nonexistent.key');
    });

    it('언어 정보를 올바르게 반환한다', () => {
      const { result } = renderHook(() => useTranslation(), { wrapper });
      
      expect(result.current.locale).toBe('ko');
      expect(result.current.locales).toEqual(['ko', 'en']);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('복수형 번역', () => {
    it('복수형을 올바르게 처리한다', () => {
      const { result } = renderHook(() => useTranslation(), { wrapper });
      
      expect(result.current.tPlural(0, 'common.items')).toBe('항목이 없습니다');
      expect(result.current.tPlural(1, 'common.items')).toBe('1개 항목');
      expect(result.current.tPlural(5, 'common.items')).toBe('5개 항목들');
    });

    it('추가 파라미터와 함께 복수형을 처리한다', () => {
      const { result } = renderHook(() => useTranslation(), { wrapper });
      
      const translated = result.current.tPlural(3, 'common.items', { type: '중요한' });
      expect(translated).toBe('3개 항목들');
    });
  });

  describe('날짜 현지화', () => {
    it('날짜를 현지화한다', () => {
      const { result } = renderHook(() => useTranslation(), { wrapper });
      
      const date = new Date('2024-01-01');
      const formatted = result.current.tDate(date);
      
      expect(formatted).toContain('2024');
    });

    it('문자열 날짜도 처리한다', () => {
      const { result } = renderHook(() => useTranslation(), { wrapper });
      
      const formatted = result.current.tDate('2024-01-01');
      expect(formatted).toContain('2024');
    });

    it('날짜 형식 옵션을 적용한다', () => {
      const { result } = renderHook(() => useTranslation(), { wrapper });
      
      const date = new Date('2024-01-01');
      const formatted = result.current.tDate(date, { 
        year: 'numeric', 
        month: 'short' 
      });
      
      expect(formatted).toContain('2024');
    });
  });

  describe('키 존재 확인', () => {
    it('존재하는 키에 대해 true를 반환한다', () => {
      const { result } = renderHook(() => useTranslation(), { wrapper });
      
      expect(result.current.hasKey('common.site.title')).toBe(true);
      expect(result.current.hasKey('common.actions.search')).toBe(true);
    });

    it('존재하지 않는 키에 대해 false를 반환한다', () => {
      const { result } = renderHook(() => useTranslation(), { wrapper });
      
      expect(result.current.hasKey('nonexistent.key')).toBe(false);
    });
  });

  describe('네임스페이스 지정', () => {
    it('특정 네임스페이스만 사용한다', () => {
      const { result } = renderHook(() => useTranslation('common'), { wrapper });
      
      // 네임스페이스가 지정되면 키에서 네임스페이스 부분을 생략할 수 있음
      expect(result.current.t('site.title')).toBe('세계 공휴일 달력');
      expect(result.current.t('actions.search')).toBe('검색');
    });
  });
});

describe('편의 훅들', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <I18nProvider>{children}</I18nProvider>
  );

  it('useCommonTranslation이 올바르게 작동한다', () => {
    const { result } = renderHook(() => useCommonTranslation(), { wrapper });
    
    expect(result.current.t('site.title')).toBe('세계 공휴일 달력');
  });
});

describe('createTranslationFunction', () => {
  const translations = {
    site: { title: 'Test Title' },
    welcome: 'Hello, {{name}}!',
    items: {
      one: '{{count}} item',
      other: '{{count}} items'
    }
  };

  it('서버 사이드 번역 함수를 생성한다', () => {
    const { t, tPlural, tDate, hasKey, locale, locales } = createTranslationFunction('en', translations);
    
    expect(t('site.title')).toBe('Test Title');
    expect(t('welcome', { name: 'John' })).toBe('Hello, John!');
    expect(tPlural(1, 'items')).toBe('1 item');
    expect(tPlural(5, 'items')).toBe('5 items');
    expect(hasKey('site.title')).toBe(true);
    expect(hasKey('nonexistent')).toBe(false);
    expect(locale).toBe('en');
    expect(locales).toEqual(['ko', 'en']);
    
    const date = new Date('2024-01-01');
    const formatted = tDate(date);
    expect(formatted).toContain('2024');
  });
});