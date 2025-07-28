import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getNestedValue,
  interpolateParams,
  translateKey,
  translatePlural,
  formatLocalizedDate,
  hasTranslationKey,
  flattenTranslationKeys
} from '../translation-utils';

describe('translation-utils', () => {
  describe('getNestedValue', () => {
    const testObj = {
      site: {
        title: '세계 공휴일 달력',
        meta: {
          description: '전세계 공휴일 정보'
        }
      },
      actions: {
        search: '검색'
      }
    };

    it('중첩된 값을 올바르게 가져온다', () => {
      expect(getNestedValue(testObj, 'site.title')).toBe('세계 공휴일 달력');
      expect(getNestedValue(testObj, 'site.meta.description')).toBe('전세계 공휴일 정보');
      expect(getNestedValue(testObj, 'actions.search')).toBe('검색');
    });

    it('존재하지 않는 키에 대해 undefined를 반환한다', () => {
      expect(getNestedValue(testObj, 'nonexistent')).toBeUndefined();
      expect(getNestedValue(testObj, 'site.nonexistent')).toBeUndefined();
      expect(getNestedValue(testObj, 'site.meta.nonexistent')).toBeUndefined();
    });

    it('잘못된 입력에 대해 undefined를 반환한다', () => {
      expect(getNestedValue(null, 'site.title')).toBeUndefined();
      expect(getNestedValue(undefined, 'site.title')).toBeUndefined();
      expect(getNestedValue('string', 'site.title')).toBeUndefined();
    });
  });

  describe('interpolateParams', () => {
    it('파라미터를 올바르게 치환한다', () => {
      const text = '안녕하세요, {{name}}님! {{count}}개의 메시지가 있습니다.';
      const params = { name: '홍길동', count: '5' };
      
      expect(interpolateParams(text, params)).toBe('안녕하세요, 홍길동님! 5개의 메시지가 있습니다.');
    });

    it('파라미터가 없으면 원본 텍스트를 반환한다', () => {
      const text = '안녕하세요, {{name}}님!';
      expect(interpolateParams(text)).toBe(text);
      expect(interpolateParams(text, {})).toBe(text);
    });

    it('존재하지 않는 파라미터는 그대로 둔다', () => {
      const text = '안녕하세요, {{name}}님! {{missing}}';
      const params = { name: '홍길동' };
      
      expect(interpolateParams(text, params)).toBe('안녕하세요, 홍길동님! {{missing}}');
    });

    it('숫자 파라미터도 올바르게 처리한다', () => {
      const text = '총 {{count}}개';
      const params = { count: 42 };
      
      expect(interpolateParams(text, params)).toBe('총 42개');
    });
  });

  describe('translateKey', () => {
    const translations = {
      site: {
        title: '세계 공휴일 달력',
        welcome: '환영합니다, {{name}}님!'
      },
      actions: {
        search: '검색'
      }
    };

    it('번역 키를 올바르게 찾아 반환한다', () => {
      expect(translateKey(translations, 'site.title')).toBe('세계 공휴일 달력');
      expect(translateKey(translations, 'actions.search')).toBe('검색');
    });

    it('파라미터와 함께 번역한다', () => {
      const result = translateKey(translations, 'site.welcome', {
        params: { name: '홍길동' }
      });
      expect(result).toBe('환영합니다, 홍길동님!');
    });

    it('존재하지 않는 키에 대해 fallback을 사용한다', () => {
      const result = translateKey(translations, 'nonexistent', {
        fallback: '기본값'
      });
      expect(result).toBe('기본값');
    });

    it('fallback이 없으면 키 자체를 반환한다', () => {
      expect(translateKey(translations, 'nonexistent')).toBe('nonexistent');
    });
  });

  describe('translatePlural', () => {
    const translations = {
      items: {
        zero: '항목이 없습니다',
        one: '{{count}}개 항목',
        other: '{{count}}개 항목들'
      },
      simple: '항목'
    };

    it('복수형을 올바르게 처리한다', () => {
      expect(translatePlural(0, translations, 'items')).toBe('항목이 없습니다');
      expect(translatePlural(1, translations, 'items')).toBe('1개 항목');
      expect(translatePlural(5, translations, 'items')).toBe('5개 항목들');
    });

    it('복수형 키가 없으면 기본 키를 사용한다', () => {
      expect(translatePlural(1, translations, 'simple')).toBe('항목');
    });
  });

  describe('formatLocalizedDate', () => {
    it('날짜를 올바르게 현지화한다', () => {
      const date = new Date('2024-01-01');
      
      const koResult = formatLocalizedDate(date, 'ko');
      const enResult = formatLocalizedDate(date, 'en');
      
      expect(koResult).toContain('2024');
      expect(enResult).toContain('2024');
    });

    it('문자열 날짜도 처리한다', () => {
      const result = formatLocalizedDate('2024-01-01', 'ko');
      expect(result).toContain('2024');
    });

    it('잘못된 날짜는 원본을 반환한다', () => {
      expect(formatLocalizedDate('invalid-date', 'ko')).toBe('invalid-date');
    });
  });

  describe('hasTranslationKey', () => {
    const translations = {
      site: {
        title: '제목',
        empty: '',
        nullValue: null
      }
    };

    it('존재하는 키에 대해 true를 반환한다', () => {
      expect(hasTranslationKey(translations, 'site.title')).toBe(true);
    });

    it('존재하지 않는 키에 대해 false를 반환한다', () => {
      expect(hasTranslationKey(translations, 'nonexistent')).toBe(false);
    });

    it('빈 문자열이나 null 값에 대해 false를 반환한다', () => {
      expect(hasTranslationKey(translations, 'site.empty')).toBe(false);
      expect(hasTranslationKey(translations, 'site.nullValue')).toBe(false);
    });
  });

  describe('flattenTranslationKeys', () => {
    const translations = {
      site: {
        title: '제목',
        meta: {
          description: '설명'
        }
      },
      actions: {
        search: '검색'
      }
    };

    it('중첩된 객체의 모든 키를 평면화한다', () => {
      const keys = flattenTranslationKeys(translations);
      
      expect(keys).toContain('site.title');
      expect(keys).toContain('site.meta.description');
      expect(keys).toContain('actions.search');
      expect(keys).toHaveLength(3);
    });

    it('빈 객체에 대해 빈 배열을 반환한다', () => {
      expect(flattenTranslationKeys({})).toEqual([]);
    });
  });
});