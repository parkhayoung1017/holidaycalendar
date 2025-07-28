import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  parseSearchQuery, 
  findMatchingCountries, 
  generateSearchResults,
  getTranslatedCountryName,
  calculateSearchPriority
} from '../search-utils';

// Mock the translation loader
vi.mock('../translation-loader', () => ({
  loadTranslations: vi.fn().mockResolvedValue({
    common: {
      time: {
        year: '년'
      }
    },
    countries: {
      countries: {
        US: '미국',
        KR: '대한민국',
        JP: '일본',
        GB: '영국',
        DE: '독일'
      }
    }
  })
}));

// Mock constants
vi.mock('../constants', () => ({
  SUPPORTED_COUNTRIES: [
    { code: 'US', name: 'United States', flag: '🇺🇸', region: 'northAmerica', popular: true },
    { code: 'KR', name: 'South Korea', flag: '🇰🇷', region: 'asia', popular: true },
    { code: 'JP', name: 'Japan', flag: '🇯🇵', region: 'asia', popular: true },
    { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', region: 'europe', popular: true },
    { code: 'DE', name: 'Germany', flag: '🇩🇪', region: 'europe', popular: true }
  ],
  SUPPORTED_YEARS: [2022, 2023, 2024, 2025, 2026, 2027],
  CURRENT_YEAR: 2025
}));

describe('search-utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('parseSearchQuery', () => {
    it('국가명과 연도를 올바르게 분리한다', () => {
      const result = parseSearchQuery('미국 2025');
      expect(result.countryQuery).toBe('미국');
      expect(result.year).toBe(2025);
      expect(result.isValidYear).toBe(true);
    });

    it('연도가 없는 경우 국가명만 반환한다', () => {
      const result = parseSearchQuery('미국');
      expect(result.countryQuery).toBe('미국');
      expect(result.year).toBe(null);
      expect(result.isValidYear).toBe(false);
    });

    it('유효하지 않은 연도는 false로 처리한다', () => {
      const result = parseSearchQuery('미국 2030');
      expect(result.countryQuery).toBe('미국');
      expect(result.year).toBe(2030);
      expect(result.isValidYear).toBe(false);
    });
  });

  describe('getTranslatedCountryName', () => {
    it('번역된 국가명을 반환한다', async () => {
      const result = await getTranslatedCountryName('US', 'ko');
      expect(result).toBe('미국');
    });

    it('번역이 없는 경우 원래 이름을 반환한다', async () => {
      const result = await getTranslatedCountryName('XX', 'ko');
      expect(result).toBe('XX');
    });
  });

  describe('findMatchingCountries', () => {
    it('번역된 국가명으로 검색할 수 있다', async () => {
      const results = await findMatchingCountries('미국', 'ko');
      expect(results).toHaveLength(1);
      expect(results[0].code).toBe('US');
    });

    it('영어 국가명으로도 검색할 수 있다', async () => {
      const results = await findMatchingCountries('united', 'ko');
      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.code === 'US')).toBe(true);
    });

    it('국가 코드로도 검색할 수 있다', async () => {
      const results = await findMatchingCountries('us', 'ko');
      expect(results).toHaveLength(1);
      expect(results[0].code).toBe('US');
    });

    it('2글자 미만의 검색어는 빈 배열을 반환한다', async () => {
      const results = await findMatchingCountries('u', 'ko');
      expect(results).toHaveLength(0);
    });
  });

  describe('generateSearchResults', () => {
    it('국가명과 연도로 검색 결과를 생성한다', async () => {
      const results = await generateSearchResults('미국 2025', 'ko');
      expect(results).toHaveLength(1);
      expect(results[0].country?.code).toBe('US');
      expect(results[0].year).toBe(2025);
      expect(results[0].url).toBe('/ko/us-2025');
    });

    it('국가명만으로 검색하면 현재 연도로 결과를 생성한다', async () => {
      const results = await generateSearchResults('미국', 'ko');
      expect(results).toHaveLength(1);
      expect(results[0].country?.code).toBe('US');
      expect(results[0].year).toBe(2025); // CURRENT_YEAR
    });

    it('번역된 국가명이 결과에 포함된다', async () => {
      const results = await generateSearchResults('미국', 'ko');
      expect(results[0].country?.name).toBe('미국');
      expect(results[0].title).toBe('미국 2025');
    });
  });

  describe('calculateSearchPriority', () => {
    it('정확한 매칭에 높은 우선순위를 부여한다', () => {
      const result = {
        type: 'country-year' as const,
        country: {
          code: 'US',
          name: '미국',
          flag: '🇺🇸',
          region: 'northAmerica'
        },
        year: 2025,
        url: '/ko/us-2025',
        title: '미국 2025',
        description: '2025년 미국 공휴일 보기'
      };

      const priority = calculateSearchPriority(result, '미국', 'ko');
      expect(priority).toBeGreaterThan(50);
    });

    it('현재 연도에 추가 점수를 부여한다', () => {
      const result = {
        type: 'country-year' as const,
        country: {
          code: 'US',
          name: '미국',
          flag: '🇺🇸',
          region: 'northAmerica'
        },
        year: 2025, // CURRENT_YEAR
        url: '/ko/us-2025',
        title: '미국 2025',
        description: '2025년 미국 공휴일 보기'
      };

      const currentYearPriority = calculateSearchPriority(result, '미국', 'ko');
      
      const pastYearResult = { ...result, year: 2024 };
      const pastYearPriority = calculateSearchPriority(pastYearResult, '미국', 'ko');
      
      expect(currentYearPriority).toBeGreaterThan(pastYearPriority);
    });
  });
});