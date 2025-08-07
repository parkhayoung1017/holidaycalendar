/**
 * AI 콘텐츠 생성 시스템의 Supabase 연동 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { saveAIDescriptionToSupabase, addHolidayDescription } from '../ai-content-supabase-integration';
import { SupabaseHolidayDescriptionService } from '../supabase-client';
import { getCachedDescription } from '../hybrid-cache';

// Mock dependencies
vi.mock('../supabase-client');
vi.mock('../hybrid-cache');
vi.mock('../error-logger', () => ({
  logInfo: vi.fn(),
  logWarning: vi.fn(),
  logApiError: vi.fn()
}));

const mockSupabaseService = {
  getDescription: vi.fn(),
  createDescription: vi.fn(),
  updateDescription: vi.fn()
};

const mockGetCachedDescription = vi.mocked(getCachedDescription);

describe('AI 콘텐츠 생성 시스템 Supabase 연동', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(SupabaseHolidayDescriptionService).mockImplementation(() => mockSupabaseService as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('saveAIDescriptionToSupabase', () => {
    const testData = {
      holidayId: 'test-holiday-2024',
      holidayName: 'Test Holiday',
      countryName: 'Test Country',
      locale: 'ko',
      description: '테스트 공휴일 설명입니다. 이 설명은 AI에 의해 생성되었으며, 충분한 길이를 가지고 있습니다.',
      confidence: 0.9,
      aiModel: 'claude-3.5-sonnet'
    };

    it('새로운 설명을 성공적으로 저장해야 합니다', async () => {
      // Given
      mockSupabaseService.getDescription.mockResolvedValue(null);
      mockSupabaseService.createDescription.mockResolvedValue({ id: 'new-id' });

      // When
      await saveAIDescriptionToSupabase(
        testData.holidayId,
        testData.holidayName,
        testData.countryName,
        testData.locale,
        testData.description,
        testData.confidence,
        testData.aiModel
      );

      // Then
      expect(mockSupabaseService.getDescription).toHaveBeenCalledWith(
        testData.holidayName,
        testData.countryName,
        testData.locale
      );
      expect(mockSupabaseService.createDescription).toHaveBeenCalledWith({
        holiday_id: testData.holidayId,
        holiday_name: testData.holidayName,
        country_name: testData.countryName,
        locale: testData.locale,
        description: testData.description,
        confidence: testData.confidence,
        is_manual: false,
        modified_by: 'ai_generator',
        ai_model: testData.aiModel
      });
    });

    it('기존 설명이 있고 신뢰도가 더 높은 경우 업데이트해야 합니다', async () => {
      // Given
      const existingDescription = {
        id: 'existing-id',
        confidence: 0.7,
        is_manual: false
      };
      mockSupabaseService.getDescription.mockResolvedValue(existingDescription);
      mockSupabaseService.updateDescription.mockResolvedValue({ id: 'existing-id' });

      // When
      await saveAIDescriptionToSupabase(
        testData.holidayId,
        testData.holidayName,
        testData.countryName,
        testData.locale,
        testData.description,
        testData.confidence,
        testData.aiModel
      );

      // Then
      expect(mockSupabaseService.updateDescription).toHaveBeenCalledWith('existing-id', {
        description: testData.description,
        confidence: testData.confidence,
        modified_by: 'ai_generator',
        ai_model: testData.aiModel,
        is_manual: false,
        generated_at: expect.any(String),
        last_used: expect.any(String)
      });
    });

    it('기존 설명이 수동 작성이거나 신뢰도가 더 높은 경우 업데이트하지 않아야 합니다', async () => {
      // Given
      const existingDescription = {
        id: 'existing-id',
        confidence: 0.95,
        is_manual: true
      };
      mockSupabaseService.getDescription.mockResolvedValue(existingDescription);

      // When
      await saveAIDescriptionToSupabase(
        testData.holidayId,
        testData.holidayName,
        testData.countryName,
        testData.locale,
        testData.description,
        0.8, // 기존보다 낮은 신뢰도
        testData.aiModel
      );

      // Then
      expect(mockSupabaseService.updateDescription).not.toHaveBeenCalled();
      expect(mockSupabaseService.createDescription).not.toHaveBeenCalled();
    });

    it('Supabase 오류 발생 시 예외를 던져야 합니다', async () => {
      // Given
      mockSupabaseService.getDescription.mockRejectedValue(new Error('Supabase 연결 실패'));

      // When & Then
      await expect(
        saveAIDescriptionToSupabase(
          testData.holidayId,
          testData.holidayName,
          testData.countryName,
          testData.locale,
          testData.description,
          testData.confidence,
          testData.aiModel
        )
      ).rejects.toThrow('Supabase 연결 실패');
    });
  });

  describe('addHolidayDescription (호환성 래퍼)', () => {
    it('기본 매개변수로 saveAIDescriptionToSupabase를 호출해야 합니다', async () => {
      // Given
      mockSupabaseService.getDescription.mockResolvedValue(null);
      mockSupabaseService.createDescription.mockResolvedValue({ id: 'new-id' });

      const testData = {
        holidayId: 'test-holiday-2024',
        holidayName: 'Test Holiday',
        countryName: 'Test Country',
        description: '테스트 설명입니다.'
      };

      // When
      await addHolidayDescription(
        testData.holidayId,
        testData.holidayName,
        testData.countryName,
        testData.description
      );

      // Then
      expect(mockSupabaseService.createDescription).toHaveBeenCalledWith({
        holiday_id: testData.holidayId,
        holiday_name: testData.holidayName,
        country_name: testData.countryName,
        locale: 'ko', // 기본값
        description: testData.description,
        confidence: 0.95, // 기본값
        is_manual: false,
        modified_by: 'ai_generator',
        ai_model: 'openai-gpt' // 기본값
      });
    });

    it('사용자 정의 매개변수를 올바르게 전달해야 합니다', async () => {
      // Given
      mockSupabaseService.getDescription.mockResolvedValue(null);
      mockSupabaseService.createDescription.mockResolvedValue({ id: 'new-id' });

      const testData = {
        holidayId: 'test-holiday-2024',
        holidayName: 'Test Holiday',
        countryName: 'Test Country',
        description: 'Test description.',
        locale: 'en',
        confidence: 0.85
      };

      // When
      await addHolidayDescription(
        testData.holidayId,
        testData.holidayName,
        testData.countryName,
        testData.description,
        testData.locale,
        testData.confidence
      );

      // Then
      expect(mockSupabaseService.createDescription).toHaveBeenCalledWith({
        holiday_id: testData.holidayId,
        holiday_name: testData.holidayName,
        country_name: testData.countryName,
        locale: testData.locale,
        description: testData.description,
        confidence: testData.confidence,
        is_manual: false,
        modified_by: 'ai_generator',
        ai_model: 'openai-gpt'
      });
    });
  });

  describe('AI 모델 정보 및 메타데이터 저장', () => {
    it('AI 모델 정보가 올바르게 저장되어야 합니다', async () => {
      // Given
      mockSupabaseService.getDescription.mockResolvedValue(null);
      mockSupabaseService.createDescription.mockResolvedValue({ id: 'new-id' });

      const testData = {
        holidayId: 'test-holiday-2024',
        holidayName: 'Test Holiday',
        countryName: 'Test Country',
        locale: 'ko',
        description: '테스트 설명입니다.',
        confidence: 0.9,
        aiModel: 'claude-3.5-sonnet'
      };

      // When
      await saveAIDescriptionToSupabase(
        testData.holidayId,
        testData.holidayName,
        testData.countryName,
        testData.locale,
        testData.description,
        testData.confidence,
        testData.aiModel
      );

      // Then
      expect(mockSupabaseService.createDescription).toHaveBeenCalledWith(
        expect.objectContaining({
          ai_model: testData.aiModel,
          confidence: testData.confidence,
          is_manual: false,
          modified_by: 'ai_generator'
        })
      );
    });

    it('생성된 설명이 어드민 편집 가능 상태로 설정되어야 합니다', async () => {
      // Given
      mockSupabaseService.getDescription.mockResolvedValue(null);
      mockSupabaseService.createDescription.mockResolvedValue({ id: 'new-id' });

      // When
      await saveAIDescriptionToSupabase(
        'test-id',
        'Test Holiday',
        'Test Country',
        'ko',
        '테스트 설명입니다.',
        0.9,
        'claude-3.5-sonnet'
      );

      // Then
      expect(mockSupabaseService.createDescription).toHaveBeenCalledWith(
        expect.objectContaining({
          is_manual: false, // AI 생성이므로 어드민이 편집 가능
          modified_by: 'ai_generator'
        })
      );
    });
  });
});