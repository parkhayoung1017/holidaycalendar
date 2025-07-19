import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateHolidayDescription,
  generateCountryOverview,
  generateBulkDescriptions,
  validateContent,
  addHolidayDescription,
  getSupportedCountries,
  getCountryStats
} from '../ai-content-generator';
import { AIContentRequest, Holiday } from '@/types';

describe('AI Content Generator', () => {
  describe('generateHolidayDescription', () => {
    it('미국 독립기념일 설명을 정확히 생성해야 함', async () => {
      const request: AIContentRequest = {
        holidayId: 'us-independence-2024',
        holidayName: 'Independence Day',
        countryName: 'United States',
        date: '2024-07-04'
      };

      const result = await generateHolidayDescription(request);

      expect(result.holidayId).toBe('us-independence-2024');
      expect(result.description).toContain('1776년');
      expect(result.description).toContain('독립선언서');
      expect(result.description).toContain('미국');
      expect(result.confidence).toBeGreaterThan(0.8);
      expect(result.generatedAt).toBeDefined();
    });

    it('한국 설날 설명을 정확히 생성해야 함', async () => {
      const request: AIContentRequest = {
        holidayId: 'kr-newyear-2024',
        holidayName: '설날',
        countryName: 'South Korea',
        date: '2024-02-10'
      };

      const result = await generateHolidayDescription(request);

      expect(result.description).toContain('음력');
      expect(result.description).toContain('차례');
      expect(result.description).toContain('세배');
      expect(result.confidence).toBeGreaterThan(0.8);
    });

    it('기존 설명이 있으면 그대로 반환해야 함', async () => {
      const existingDescription = '이미 작성된 상세한 공휴일 설명입니다. 매우 길고 자세한 내용을 포함하고 있습니다.';
      const request: AIContentRequest = {
        holidayId: 'test-holiday',
        holidayName: 'Test Holiday',
        countryName: 'Test Country',
        date: '2024-01-01',
        existingDescription
      };

      const result = await generateHolidayDescription(request);

      expect(result.description).toBe(existingDescription);
      expect(result.confidence).toBe(1.0);
    });

    it('매칭되지 않는 공휴일은 템플릿을 사용해야 함', async () => {
      const request: AIContentRequest = {
        holidayId: 'unknown-holiday',
        holidayName: 'Unknown Holiday',
        countryName: 'Unknown Country',
        date: '2024-01-01'
      };

      const result = await generateHolidayDescription(request);

      expect(result.description).toContain('Unknown Holiday');
      expect(result.description).toContain('Unknown Country');
      expect(result.confidence).toBeLessThan(0.8);
    });

    it('종교적 공휴일은 종교 템플릿을 사용해야 함', async () => {
      const request: AIContentRequest = {
        holidayId: 'religious-test',
        holidayName: 'Religious Holiday',
        countryName: 'Test Country',
        date: '2024-12-25'
      };

      const result = await generateHolidayDescription(request);

      expect(result.description).toContain('종교적');
      expect(result.description).toContain('신앙인');
    });
  });

  describe('generateCountryOverview', () => {
    it('미국 개요를 정확히 생성해야 함', async () => {
      const overview = await generateCountryOverview('US', 'United States');

      expect(overview).toContain('미국');
      expect(overview).toContain('연방 공휴일');
      expect(overview).toContain('독립기념일');
      expect(overview).toContain('추수감사절');
    });

    it('한국 개요를 정확히 생성해야 함', async () => {
      const overview = await generateCountryOverview('KR', 'South Korea');

      expect(overview).toContain('한국');
      expect(overview).toContain('설날');
      expect(overview).toContain('추석');
      expect(overview).toContain('조상 숭배');
    });

    it('지원하지 않는 국가는 기본 개요를 반환해야 함', async () => {
      const overview = await generateCountryOverview('XX', 'Unknown Country');

      expect(overview).toContain('Unknown Country');
      expect(overview).toContain('역사와 문화적 전통');
    });
  });

  describe('generateBulkDescriptions', () => {
    it('여러 공휴일 설명을 일괄 생성해야 함', async () => {
      const holidays: Holiday[] = [
        {
          id: 'us-independence-2024',
          name: 'Independence Day',
          date: '2024-07-04',
          country: 'United States',
          countryCode: 'US',
          type: 'public',
          global: true
        },
        {
          id: 'us-christmas-2024',
          name: 'Christmas',
          date: '2024-12-25',
          country: 'United States',
          countryCode: 'US',
          type: 'public',
          global: true
        }
      ];

      const results = await generateBulkDescriptions(holidays);

      expect(results).toHaveLength(2);
      expect(results[0].holidayId).toBe('us-independence-2024');
      expect(results[1].holidayId).toBe('us-christmas-2024');
      expect(results[0].description).toContain('독립선언서');
      expect(results[1].description).toContain('크리스마스');
    });
  });

  describe('validateContent', () => {
    it('적절한 길이의 설명은 유효해야 함', () => {
      const validDescription = '이것은 적절한 길이의 공휴일 설명입니다. 충분한 정보를 포함하고 있으며, 문장 구조도 올바릅니다. 사용자가 이해하기 쉽게 작성되었습니다.';
      
      expect(validateContent(validDescription)).toBe(true);
    });

    it('너무 짧은 설명은 무효해야 함', () => {
      const shortDescription = '짧은 설명';
      
      expect(validateContent(shortDescription)).toBe(false);
    });

    it('너무 긴 설명은 무효해야 함', () => {
      const longDescription = '매우 '.repeat(500) + '긴 설명입니다.';
      
      expect(validateContent(longDescription)).toBe(false);
    });

    it('문장이 너무 많은 설명은 무효해야 함', () => {
      const manySentences = Array(15).fill('이것은 문장입니다.').join(' ');
      
      expect(validateContent(manySentences)).toBe(false);
    });
  });

  describe('addHolidayDescription', () => {
    it('새로운 공휴일 설명을 추가할 수 있어야 함', () => {
      const newDescription = {
        name: 'Test Holiday',
        keywords: ['test', '테스트'],
        description: '테스트용 공휴일 설명입니다. 이것은 테스트를 위해 추가된 설명입니다.'
      };

      addHolidayDescription('TEST', newDescription);
      
      const supportedCountries = getSupportedCountries();
      expect(supportedCountries).toContain('TEST');
    });
  });

  describe('getSupportedCountries', () => {
    it('지원되는 국가 목록을 반환해야 함', () => {
      const countries = getSupportedCountries();
      
      expect(countries).toContain('US');
      expect(countries).toContain('KR');
      expect(countries).toContain('JP');
      expect(countries).toContain('GB');
      expect(countries).toContain('FR');
      expect(countries).toContain('CA');
    });
  });

  describe('getCountryStats', () => {
    it('미국 통계를 정확히 반환해야 함', () => {
      const stats = getCountryStats('US');
      
      expect(stats.totalDescriptions).toBeGreaterThan(0);
      expect(stats.averageLength).toBeGreaterThan(0);
      expect(stats.coverage).toBeGreaterThan(0);
    });

    it('지원하지 않는 국가는 0 통계를 반환해야 함', () => {
      const stats = getCountryStats('XX');
      
      expect(stats.totalDescriptions).toBe(0);
      expect(stats.averageLength).toBe(0);
      expect(stats.coverage).toBe(0);
    });
  });
});