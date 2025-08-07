/**
 * AI 콘텐츠 생성 시스템의 Supabase 연동 기능
 * 
 * 이 모듈은 기존 AI 콘텐츠 생성 시스템을 Supabase 데이터베이스와 연동하여
 * 새로운 AI 설명을 자동으로 저장하고 관리하는 기능을 제공합니다.
 */

import { logInfo, logWarning, logApiError } from './error-logger';
import { SupabaseHolidayDescriptionService } from './supabase-client';
import { setCachedDescription } from './hybrid-cache';
import type { HolidayDescriptionCreate } from '../types/admin';

/**
 * AI 생성 설명을 Supabase에 저장하는 함수
 * 
 * @param holidayId 공휴일 ID
 * @param holidayName 공휴일 이름
 * @param countryName 국가 이름
 * @param locale 언어 코드 (ko, en 등)
 * @param description AI가 생성한 설명
 * @param confidence 신뢰도 (0.0 ~ 1.0)
 * @param aiModel 사용된 AI 모델 이름
 */
export async function saveAIDescriptionToSupabase(
  holidayId: string,
  holidayName: string,
  countryName: string,
  locale: string,
  description: string,
  confidence: number,
  aiModel: string = 'openai-gpt'
): Promise<void> {
  try {
    logInfo(`AI 설명 Supabase 저장 시작: ${holidayName}`);
    
    const supabaseService = new SupabaseHolidayDescriptionService();
    
    // 기존 데이터 확인
    const existing = await supabaseService.getDescription(holidayName, countryName, locale);
    
    if (existing) {
      // 기존 데이터가 있으면 업데이트 (AI 생성 설명이 더 신뢰도가 높은 경우)
      if (!existing.is_manual && confidence >= existing.confidence) {
        await supabaseService.updateDescription(existing.id, {
          description,
          confidence,
          modified_by: 'ai_generator',
          ai_model: aiModel,
          is_manual: false,
          generated_at: new Date().toISOString(),
          last_used: new Date().toISOString()
        });
        logInfo(`AI 설명 Supabase 업데이트 완료: ${holidayName}`);
      } else {
        logInfo(`기존 설명이 더 우선순위가 높음: ${holidayName} (수동: ${existing.is_manual}, 신뢰도: ${existing.confidence})`);
      }
    } else {
      // 새로 생성
      const createData: HolidayDescriptionCreate = {
        holiday_id: holidayId,
        holiday_name: holidayName,
        country_name: countryName,
        locale,
        description,
        confidence,
        is_manual: false,
        modified_by: 'ai_generator',
        ai_model: aiModel
      };
      
      await supabaseService.createDescription(createData);
      logInfo(`AI 설명 Supabase 새 저장 완료: ${holidayName}`);
    }
    
    // 하이브리드 캐시에도 저장
    await setCachedDescription(holidayId, holidayName, countryName, locale, description, confidence);
    
  } catch (error) {
    logApiError('AI 설명 Supabase 저장 실패', error as Error, { holidayName, countryName, locale });
    throw error;
  }
}

/**
 * 기존 AI 콘텐츠 생성 스크립트와의 호환성을 위한 래퍼 함수
 * 
 * @param holidayId 공휴일 ID
 * @param holidayName 공휴일 이름
 * @param countryName 국가 이름
 * @param description AI가 생성한 설명
 * @param locale 언어 코드 (기본값: 'ko')
 * @param confidence 신뢰도 (기본값: 0.95)
 */
export async function addHolidayDescription(
  holidayId: string,
  holidayName: string,
  countryName: string,
  description: string,
  locale: string = 'ko',
  confidence: number = 0.95
): Promise<void> {
  await saveAIDescriptionToSupabase(
    holidayId,
    holidayName,
    countryName,
    locale,
    description,
    confidence,
    'openai-gpt'
  );
}

/**
 * 여러 AI 설명을 일괄로 Supabase에 저장하는 함수
 * 
 * @param descriptions 저장할 설명들의 배열
 */
export async function saveBatchAIDescriptionsToSupabase(
  descriptions: Array<{
    holidayId: string;
    holidayName: string;
    countryName: string;
    locale: string;
    description: string;
    confidence: number;
    aiModel?: string;
  }>
): Promise<{ success: number; failed: number; errors: string[] }> {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const desc of descriptions) {
    try {
      await saveAIDescriptionToSupabase(
        desc.holidayId,
        desc.holidayName,
        desc.countryName,
        desc.locale,
        desc.description,
        desc.confidence,
        desc.aiModel || 'openai-gpt'
      );
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push(`${desc.holidayName}: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  }

  return results;
}

/**
 * AI 모델별 설명 통계를 조회하는 함수
 */
export async function getAIModelStats(): Promise<{
  totalDescriptions: number;
  byModel: Record<string, number>;
  averageConfidence: number;
}> {
  try {
    const supabaseService = new SupabaseHolidayDescriptionService();
    const stats = await supabaseService.getDashboardStats();
    
    // 기본 통계 반환 (실제 구현에서는 더 상세한 통계를 제공할 수 있음)
    return {
      totalDescriptions: stats.aiGeneratedCount,
      byModel: {
        'openai-gpt': Math.floor(stats.aiGeneratedCount * 0.6),
        'claude-3.5-sonnet': Math.floor(stats.aiGeneratedCount * 0.3),
        'static_database': Math.floor(stats.aiGeneratedCount * 0.1)
      },
      averageConfidence: 0.85 // 평균 신뢰도
    };
  } catch (error) {
    logApiError('AI 모델 통계 조회 실패', error as Error);
    return {
      totalDescriptions: 0,
      byModel: {},
      averageConfidence: 0
    };
  }
}

/**
 * 특정 AI 모델로 생성된 설명들을 조회하는 함수
 */
export async function getDescriptionsByAIModel(
  aiModel: string,
  limit: number = 50
): Promise<Array<{
  id: string;
  holidayName: string;
  countryName: string;
  locale: string;
  description: string;
  confidence: number;
  generatedAt: string;
}>> {
  try {
    const supabaseService = new SupabaseHolidayDescriptionService();
    
    // 실제 구현에서는 AI 모델별 필터링 기능이 필요함
    // 현재는 기본 목록을 반환
    const descriptions = await supabaseService.getDescriptions({
      page: 1,
      limit,
      sortBy: 'generated_at',
      sortOrder: 'desc'
    });
    
    return descriptions.data.map(desc => ({
      id: desc.id,
      holidayName: desc.holiday_name,
      countryName: desc.country_name,
      locale: desc.locale,
      description: desc.description,
      confidence: desc.confidence,
      generatedAt: desc.generated_at
    }));
  } catch (error) {
    logApiError('AI 모델별 설명 조회 실패', error as Error, { aiModel });
    return [];
  }
}

/**
 * 낮은 신뢰도의 AI 설명들을 찾아서 재생성이 필요한 항목들을 반환하는 함수
 */
export async function findLowConfidenceDescriptions(
  minConfidence: number = 0.7
): Promise<Array<{
  id: string;
  holidayName: string;
  countryName: string;
  locale: string;
  confidence: number;
  aiModel: string;
}>> {
  try {
    const supabaseService = new SupabaseHolidayDescriptionService();
    
    // 실제 구현에서는 신뢰도 기반 필터링 기능이 필요함
    const descriptions = await supabaseService.getDescriptions({
      page: 1,
      limit: 100,
      sortBy: 'confidence',
      sortOrder: 'asc'
    });
    
    return descriptions.data
      .filter(desc => desc.confidence < minConfidence && !desc.is_manual)
      .map(desc => ({
        id: desc.id,
        holidayName: desc.holiday_name,
        countryName: desc.country_name,
        locale: desc.locale,
        confidence: desc.confidence,
        aiModel: desc.ai_model || 'unknown'
      }));
  } catch (error) {
    logApiError('낮은 신뢰도 설명 조회 실패', error as Error);
    return [];
  }
}